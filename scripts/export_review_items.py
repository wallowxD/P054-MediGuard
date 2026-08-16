"""Export NEED_REVIEW and INCOMPLETE_DOCUMENT items to JSON and Markdown reports.

Usage:
    python scripts/export_review_items.py
"""

import json
import re
from pathlib import Path

DIFF_DIR = Path("output_clean_v3_diffs_noImg")
PROOFREAD_DIR = Path("output_clean_v3_proofread_noImg")
ORIGINAL_DIR = Path("output_clean_v3")
REPORT_JSON = Path("review_items.json")
REPORT_MD = Path("review_report.md")


def extract_flag_info(text: str) -> tuple[str, str, str]:
    """Extract flag type, reason, and clean text from line content."""
    flag_type = "CORRECTED"
    reason = ""
    clean_text = text

    match = re.search(r"<!--\s*(NEED_REVIEW|INCOMPLETE_DOCUMENT):\s*(.*?)\s*-->", text)
    if match:
        flag_type = match.group(1)
        reason = match.group(2)
        clean_text = re.sub(r"\s*<!--.*?-->\s*$", "", text).strip()

    return flag_type, reason, clean_text


def main():
    if not DIFF_DIR.exists():
        print(f"Error: Directory {DIFF_DIR} does not exist.")
        return

    review_items = []
    diff_files = sorted(DIFF_DIR.glob("*.diff.json"))

    for diff_file in diff_files:
        try:
            data = json.loads(diff_file.read_text(encoding="utf-8"))
            stem = diff_file.name.replace(".diff.json", "")
            md_name = f"{stem}.md"
            proofread_md_path = PROOFREAD_DIR / md_name
            orig_md_path = ORIGINAL_DIR / md_name

            for item in data:
                line_num = item.get("line")
                corrected_text = item.get("corrected", "")

                if "NEED_REVIEW" in corrected_text or "INCOMPLETE_DOCUMENT" in corrected_text:
                    flag_type, reason, clean_text = extract_flag_info(corrected_text)

                    review_items.append({
                        "id": f"{stem}_L{line_num}",
                        "filename": md_name,
                        "line": line_num,
                        "type": flag_type,
                        "reason": reason,
                        "corrected_line": corrected_text,
                        "clean_text": clean_text,
                        "status": "PENDING",
                        "reviewer": "",
                        "note": "",
                        "proofread_path": str(proofread_md_path),
                        "original_path": str(orig_md_path),
                    })
        except Exception as e:
            print(f"Error reading {diff_file.name}: {e}")

    # Write JSON report
    REPORT_JSON.write_text(json.dumps(review_items, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Exported {len(review_items)} review item(s) to {REPORT_JSON.name}")

    # Write Markdown report dashboard
    md_lines = [
        "# BÁO CÁO CÁC CÂU CẦN KIỂM DUYỆT Y DƯỢC (NEED_REVIEW & INCOMPLETE_DOCUMENT)",
        "",
        f"**Tổng số câu nghi vấn / cần xem xét lại:** `{len(review_items)}`",
        "",
        "| STT | File Markdown | Dòng | Loại cờ | Lý do Gemini ghi nhận | Trạng thái |",
        "|---|---|---|---|---|---|",
    ]

    for idx, item in enumerate(review_items, 1):
        flag_badge = f"`{item['type']}`"
        md_lines.append(
            f"| {idx} | `{item['filename']}` | {item['line']} | {flag_badge} | {item['reason']} | `{item['status']}` |"
        )

    REPORT_MD.write_text("\n".join(md_lines), encoding="utf-8")
    print(f"Exported Markdown dashboard report to {REPORT_MD.name}")


if __name__ == "__main__":
    main()
