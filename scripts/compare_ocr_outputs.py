import os
import sys
import re
import json
from pathlib import Path
from difflib import SequenceMatcher

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


ROOT_DIR = Path(__file__).resolve().parent.parent
QWEN_DIR = ROOT_DIR / "output"
GEMINI_DIR = ROOT_DIR / "output_clean_v3"
EVAL_DIR = ROOT_DIR / "eval"

KEY_SECTIONS = [
    "thành phần",
    "chỉ định",
    "liều dùng",
    "cách dùng",
    "chống chỉ định",
    "tương tác",
    "tác dụng phụ",
    "thận trọng",
    "quá liều",
    "bảo quản"
]

def count_tables(text: str) -> int:
    """Đếm số bảng Markdown trong văn bản."""
    lines = text.splitlines()
    table_lines = 0
    in_table = False
    table_count = 0
    
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("|") and stripped.endswith("|") and stripped.count("|") >= 2:
            if not in_table:
                in_table = True
                table_count += 1
        else:
            in_table = False
            
    return table_count

def count_sections(text: str) -> dict:
    """Đếm số lượng mục tiêu chuẩn xuất hiện trong văn bản."""
    text_lower = text.lower()
    found = {}
    for sec in KEY_SECTIONS:
        pattern = r"(?i)(#+|##+|\*\*)\s*.*" + re.escape(sec)
        found[sec] = len(re.findall(pattern, text)) > 0 or sec in text_lower
    return found

def detect_repetition_loops(text: str) -> int:
    """Phát hiện lỗi lặp lại vô hạn (looping bug) phổ biến ở các model OCR."""
    lines = [l.strip() for l in text.splitlines() if len(l.strip()) > 15]
    if not lines:
        return 0
    
    repeated_count = 0
    seen = {}
    for l in lines:
        seen[l] = seen.get(l, 0) + 1
        if seen[l] >= 4:
            repeated_count += 1
            
    return repeated_count

def detect_garbage_chars(text: str) -> int:
    """Đếm ký tự rác / mã Unicode lỗi / dấu hỏi lạ."""
    garbage_patterns = [r"\?\?\?", r"□", r"&#\d+;"]
    count = 0
    for p in garbage_patterns:
        count += len(re.findall(p, text))
    return count

def analyze_comparison():
    EVAL_DIR.mkdir(parents=True, exist_ok=True)
    
    qwen_files = {f.name: f for f in QWEN_DIR.glob("*.md")}
    gemini_files = {f.name: f for f in GEMINI_DIR.glob("*.md")}
    
    common_filenames = sorted(list(set(qwen_files.keys()) & set(gemini_files.keys())))
    print(f"Tìm thấy {len(common_filenames)} file chung giữa Qwen và Gemini.")
    
    qwen_total_tables = 0
    gemini_total_tables = 0
    
    qwen_section_counts = {sec: 0 for sec in KEY_SECTIONS}
    gemini_section_counts = {sec: 0 for sec in KEY_SECTIONS}
    
    qwen_total_loops = 0
    gemini_total_loops = 0
    
    qwen_total_garbage = 0
    gemini_total_garbage = 0
    
    qwen_total_chars = 0
    gemini_total_chars = 0
    
    file_diff_list = []
    
    for filename in common_filenames:
        with open(qwen_files[filename], "r", encoding="utf-8") as f:
            qwen_text = f.read()
        with open(gemini_files[filename], "r", encoding="utf-8") as f:
            gemini_text = f.read()
            
        qwen_tbl = count_tables(qwen_text)
        gemini_tbl = count_tables(gemini_text)
        qwen_total_tables += qwen_tbl
        gemini_total_tables += gemini_tbl
        
        qwen_sec = count_sections(qwen_text)
        gemini_sec = count_sections(gemini_text)
        for k in KEY_SECTIONS:
            if qwen_sec[k]:
                qwen_section_counts[k] += 1
            if gemini_sec[k]:
                gemini_section_counts[k] += 1
                
        q_loop = detect_repetition_loops(qwen_text)
        g_loop = detect_repetition_loops(gemini_text)
        qwen_total_loops += q_loop
        gemini_total_loops += g_loop
        
        q_garb = detect_garbage_chars(qwen_text)
        g_garb = detect_garbage_chars(gemini_text)
        qwen_total_garbage += q_garb
        gemini_total_garbage += g_garb
        
        qwen_total_chars += len(qwen_text)
        gemini_total_chars += len(gemini_text)
        
        sim_ratio = SequenceMatcher(None, qwen_text[:2000], gemini_text[:2000]).ratio()
        
        file_diff_list.append({
            "filename": filename,
            "qwen_tables": qwen_tbl,
            "gemini_tables": gemini_tbl,
            "qwen_char_len": len(qwen_text),
            "gemini_char_len": len(gemini_text),
            "qwen_loops": q_loop,
            "qwen_garbage": q_garb,
            "similarity_ratio": round(sim_ratio, 4)
        })
        
    file_diff_list.sort(key=lambda x: (abs(x["qwen_tables"] - x["gemini_tables"]), x["qwen_loops"], 1 - x["similarity_ratio"]), reverse=True)
    
    stats_result = {
        "total_paired_files": len(common_filenames),
        "qwen_metrics": {
            "total_tables": qwen_total_tables,
            "section_completeness": qwen_section_counts,
            "repetition_loops_found": qwen_total_loops,
            "garbage_characters": qwen_total_garbage,
            "total_characters": qwen_total_chars,
            "avg_file_length": round(qwen_total_chars / max(1, len(common_filenames)), 1)
        },
        "gemini_metrics": {
            "total_tables": gemini_total_tables,
            "section_completeness": gemini_section_counts,
            "repetition_loops_found": gemini_total_loops,
            "garbage_characters": gemini_total_garbage,
            "total_characters": gemini_total_chars,
            "avg_file_length": round(gemini_total_chars / max(1, len(common_filenames)), 1)
        },
        "top_diff_cases": file_diff_list[:20]
    }
    
    out_json = EVAL_DIR / "ocr_comparison_stats.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(stats_result, f, ensure_ascii=False, indent=2)
        
    print(f"Đã lưu kết quả phân tích thống kê tại: {out_json}")

if __name__ == "__main__":
    analyze_comparison()
