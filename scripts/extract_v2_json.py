"""Script trích xuất v2: Đọc file HDSD markdown (output_clean_v3_proofread_noImg/*.md),
dùng Gemini 3.5 Flash Lite bóc tách dữ liệu có cấu trúc (Key-Value cho DB & Evidence Chunks) ra file JSON.

Hỗ trợ Resume bằng checkpoint (data/v2_checkpoint.json).
Output:
- File JSON theo từng thuốc: data/extracted_v2_json/<file_stem>.json
- Master JSON tổng hợp: data/master_extracted_v2.json
"""

import argparse
import json
import os
import random
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path

# Setup paths & encoding
sys.stdout.reconfigure(encoding="utf-8")

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "backend" / "src"))

from medsafe.chunking.chunker import chunk_document, split_by_sections
from medsafe.domain.normalization import normalize_for_matching
from medsafe.domain.severity import classify_severity
from medsafe.llm.llm_client import GeminiRateLimitError, LLMClient

MASTER_JSON_FILE = REPO_ROOT / "data" / "master_extracted_v2.json"
OUTPUT_JSON_DIR = REPO_ROOT / "data" / "extracted_v2_json"


def is_already_extracted(file_path: Path) -> bool:
    """Kiểm tra trực tiếp xem file JSON của thuốc này đã tồn tại trong data/extracted_v2_json/ chưa."""
    json_path = OUTPUT_JSON_DIR / f"{file_path.stem}.json"
    return json_path.exists() and json_path.stat().st_size > 50


def save_drug_v2_json(file_name: str, drug_data: dict) -> None:
    """Lưu file JSON chi tiết cho từng thuốc."""
    OUTPUT_JSON_DIR.mkdir(parents=True, exist_ok=True)
    json_path = OUTPUT_JSON_DIR / f"{Path(file_name).stem}.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(drug_data, f, ensure_ascii=False, indent=2)


def sync_master_json() -> int:
    """Tự động tổng hợp tất cả các file JSON trong data/extracted_v2_json/ vào master_extracted_v2.json."""
    master_records = {}
    if OUTPUT_JSON_DIR.exists():
        for json_file in sorted(OUTPUT_JSON_DIR.glob("*.json")):
            try:
                with open(json_file, encoding="utf-8") as f:
                    data = json.load(f)
                    file_name = data.get("file_name") or f"{json_file.stem}.md"
                    master_records[file_name] = data
            except Exception:
                pass
    with open(MASTER_JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(master_records, f, ensure_ascii=False, indent=2)
    return len(master_records)


def extract_v2_drug_info(file_path: Path, llm_client: LLMClient) -> dict:
    """Bóc tách 2-Pass dữ liệu v2 từ 1 file Markdown HDSD."""
    text = file_path.read_text(encoding="utf-8")

    # Pass 1: Phân tách Sections & Cắt Chunks bằng Code (100% Nguyên văn)
    sections = split_by_sections(text)
    raw_chunks = chunk_document(text, drug_id=file_path.name, source_url="")

    section_dict = {sec_name.upper(): sec_content for sec_name, sec_content in sections}

    section_dict = {sec_name.upper(): sec_content for sec_name, sec_content in sections}

    # Tìm tên biệt dược fallback từ filename stem
    parts = file_path.stem.split("_")
    name_parts = []
    for p in parts[1:]:
        if p == "1" or p.startswith("1_") or len(p) > 15:
            break
        name_parts.append(p)
    fallback_brand_name = " ".join(name_parts) if name_parts else file_path.stem

    # Pass 2: Trích xuất Dữ liệu Cấu trúc v2 bằng LLM (Gemini 3.5 Flash Lite)
    system_prompt = (
        "Bạn là Chuyên gia Dược học Lâm sàng. Nhiệm vụ của bạn là đọc tờ Hướng dẫn sử dụng thuốc (HDSD) "
        "và bóc tách dữ liệu có cấu trúc chính xác tuyệt đối theo định dạng JSON.\n\n"
        "QUY TẮC AN TOÀN & CHUẨN HÓA ĐỊNH DẠNG:\n"
        "1. KHÔNG BỊA THÔNG TIN. Tất cả thông tin dựa 100% trên nội dung văn bản.\n"
        "2. GIỮ NGUYÊN VĂN TỪ NGỮ Y KHOA (NO REWRITING): Giữ nguyên 100% từ ngữ, câu chữ y khoa gốc, tuyệt đối không diễn đạt lại hay thay đổi thuật ngữ.\n"
        "3. ĐƯỢC PHÉP CHUẨN HÓA TRÌNH BÀY & LÀM SẠCH NHIỄU OCR:\n"
        "   - Loại bỏ các ký tự rác như `Rx`, các thẻ HTML comment `<!-- ... -->`, `[2]`, `[3]` ra khỏi phần nội dung. CHỈ LOẠI BỎ khi bạn chắc chắn nó là rác\n"
        "   - Nếu các ý trong một mục bị dính liền thành một cục, hãy định dạng xuống dòng và thêm gạch đầu dòng `- ` cho từng ý rõ ràng, sạch đẹp.\n"
        "4. Nếu thông tin nào không có trong văn bản, hãy để chuỗi rỗng \"\" hoặc mảng rỗng [].\n"
    )

    prompt = f"Hãy bóc tách thông tin dược lâm sàng v2 từ tờ HDSD dưới đây:\n\n--- NỘI DUNG HDSD ---\n{text[:8000]}\n--- HẾT NỘI DUNG ---\n"

    schema_desc = """
    {
      "brand_name": "Tên biệt dược",
      "canonical_ingredients": ["Hoạt chất 1", "Hoạt chất 2"],
      "pharmacological_class": "Nhóm thuốc / Phân loại dược lý (ví dụ: Kháng sinh nhóm Penicillin)",
      "therapeutic_effect": "Tác dụng / Cơ chế tác dụng chính (trích NGUYÊN VĂN 1-2 câu từ phần Dược lực/Chỉ định)",
      "is_prescription": true,
      "summary_indications": "Đoạn trích NGUYÊN VĂN 100% phần Chỉ định từ HDSD (không tự viết lại)",
      "summary_contraindications": "Đoạn trích NGUYÊN VĂN 100% phần Chống chỉ định từ HDSD (không tự viết lại)",
      "summary_dosage": "Đoạn trích NGUYÊN VĂN 100% phần Liều dùng & Cách dùng chính từ HDSD",
      "summary_precautions": "Đoạn trích NGUYÊN VĂN 100% phần Thận trọng chính từ HDSD",
      "summary_side_effects": "Đoạn trích NGUYÊN VĂN 100% phần Tác dụng phụ (ADR) thường gặp từ HDSD",
      "special_notes": "Đoạn trích NGUYÊN VĂN 100% các chú ý/lưu ý đặc biệt khi sử dụng từ HDSD",
      "drug_drug_interactions": [
        {
          "ingredient_a": "Tên hoạt chất A",
          "ingredient_b": "Tên hoạt chất B",
          "severity": "contraindicated | major | moderate | minor | unknown",
          "mechanism": "Cơ chế tương tác",
          "consequence": "Hậu quả lâm sàng",
          "management": "Hướng xử trí",
          "verbatim_quote": "Đoạn trích NGUYÊN VĂN 100% từ HDSD"
        }
      ],
      "drug_disease_interactions": [
        {
          "ingredient": "Tên hoạt chất",
          "disease_name": "Tên bệnh nền / Tình trạng sức khỏe",
          "severity": "contraindicated | major | moderate | minor",
          "effect_description": "Mô tả tác động khi dùng thuốc trên bệnh nền",
          "management": "Hướng xử trí / Chú ý lâm sàng",
          "verbatim_quote": "Đoạn trích NGUYÊN VĂN 100% từ HDSD"
        }
      ],
      "drug_supplement_interactions": [
        {
          "ingredient": "Tên hoạt chất",
          "supplement_name": "Tên thực phẩm / TPCN / Đồ uống (ví dụ: Rượu, Bưởi chùm, Sữa)",
          "category": "food | beverage | supplement | herb",
          "severity": "contraindicated | major | moderate | minor",
          "effect_description": "Mô tả tác động tương tác",
          "management": "Hướng xử trí / Khuyên dùng",
          "verbatim_quote": "Đoạn trích NGUYÊN VĂN 100% từ HDSD"
        }
      ]
    }
    """

    res_json = llm_client.complete_json(prompt, schema_description=schema_desc, system=system_prompt)

    # Chuẩn hóa kết quả
    canonical_list = [normalize_for_matching(i) for i in res_json.get("canonical_ingredients", []) if i]

    # Chuẩn hóa d2d
    d2d_processed = []
    for item in res_json.get("drug_drug_interactions", []):
        if not isinstance(item, dict):
            continue
        ing_a = (item.get("ingredient_a") or "").strip()
        ing_b = (item.get("ingredient_b") or "").strip()
        quote = (item.get("verbatim_quote") or "").strip()

        if ing_a and ing_b and quote:
            norm_a = normalize_for_matching(ing_a)
            norm_b = normalize_for_matching(ing_b)
            sorted_pair = sorted([norm_a, norm_b])
            mech = (item.get("mechanism") or "").strip()
            cons = (item.get("consequence") or "").strip()
            mgmt = (item.get("management") or "").strip()
            sev = item.get("severity") or classify_severity(mech, cons, mgmt).value

            d2d_processed.append({
                "ingredient_a_norm": sorted_pair[0],
                "ingredient_b_norm": sorted_pair[1],
                "severity": sev,
                "mechanism": mech,
                "consequence": cons,
                "management": mgmt,
                "verbatim_quote": quote,
                "source_type": "leaflet_ocr",
                "version": "v2",
                "review_status": "pending_review",
            })

    # Chuẩn hóa d2disease
    d2dis_processed = []
    for item in res_json.get("drug_disease_interactions", []):
        if not isinstance(item, dict):
            continue
        ing = (item.get("ingredient") or "").strip()
        dis = (item.get("disease_name") or "").strip()
        quote = (item.get("verbatim_quote") or "").strip()

        if ing and dis and quote:
            d2dis_processed.append({
                "canonical_ingredient": normalize_for_matching(ing),
                "disease_name": dis,
                "disease_name_unaccent": normalize_for_matching(dis),
                "severity": item.get("severity") or "major",
                "effect_description": (item.get("effect_description") or "").strip(),
                "management": (item.get("management") or "").strip(),
                "verbatim_quote": quote,
                "source_type": "leaflet_ocr",
                "version": "v2",
                "review_status": "pending_review",
            })

    # Chuẩn hóa d2supplement
    d2supp_processed = []
    for item in res_json.get("drug_supplement_interactions", []):
        if not isinstance(item, dict):
            continue
        ing = (item.get("ingredient") or "").strip()
        supp = (item.get("supplement_name") or "").strip()
        quote = (item.get("verbatim_quote") or "").strip()

        if ing and supp and quote:
            d2supp_processed.append({
                "canonical_ingredient": normalize_for_matching(ing),
                "supplement_name": supp,
                "supplement_name_unaccent": normalize_for_matching(supp),
                "category": (item.get("category") or "food").strip().lower(),
                "severity": item.get("severity") or "moderate",
                "effect_description": (item.get("effect_description") or "").strip(),
                "management": (item.get("management") or "").strip(),
                "verbatim_quote": quote,
                "source_type": "leaflet_ocr",
                "version": "v2",
                "review_status": "pending_review",
            })

    b_name = (res_json.get("brand_name") or "").strip()
    if not b_name or b_name.startswith("<!--") or "HƯỚNG DẪN SỬ DỤNG" in b_name.upper():
        b_name = fallback_brand_name

    full_record = {
        "file_name": file_path.name,
        "brand_name": b_name,
        "canonical_ingredients": canonical_list,
        "pharmacological_class": res_json.get("pharmacological_class", ""),
        "therapeutic_effect": res_json.get("therapeutic_effect", ""),
        "is_prescription": bool(res_json.get("is_prescription", False)),
        "summary_indications": res_json.get("summary_indications", ""),
        "summary_contraindications": res_json.get("summary_contraindications", ""),
        "summary_dosage": res_json.get("summary_dosage", ""),
        "summary_precautions": res_json.get("summary_precautions", ""),
        "summary_side_effects": res_json.get("summary_side_effects", ""),
        "special_notes": res_json.get("special_notes", ""),
        "version": "v2",
        "drug_drug_interactions": d2d_processed,
        "drug_disease_interactions": d2dis_processed,
        "drug_supplement_interactions": d2supp_processed,
        "sections": [{"section_name": sec_name, "content": sec_content} for sec_name, sec_content in sections],
        "chunks": [
            {
                "section": c.section,
                "text": c.text,
                "char_start": c.char_start,
                "char_end": c.char_end,
                "version": "v2",
            }
            for c in raw_chunks
        ],
    }

    return full_record


def process_single_file_worker(file_path: Path, llm_client: LLMClient) -> tuple[bool, str, dict | str]:
    """Hàm worker xử lý 1 file với random jitter delay để tránh rate limit."""
    # Jitter delay ngẫu nhiên 0.1s - 0.5s trước khi gọi API để phân tán luồng
    time.sleep(random.uniform(0.1, 0.5))
    try:
        res = extract_v2_drug_info(file_path, llm_client)
        save_drug_v2_json(file_path.name, res)
        return True, file_path.name, res
    except Exception as e:
        return False, file_path.name, str(e)


def parse_args():
    parser = argparse.ArgumentParser(description="Trích xuất dữ liệu v2 từ Markdown HDSD ra JSON bằng Gemini 3.5 Flash Lite")
    parser.add_argument("--input-dir", type=str, default="output_clean_v3_proofread_noImg", help="Thư mục chứa các file .md")
    parser.add_argument("--limit", type=int, default=None, help="Giới hạn số file xử lý (để test batch nhỏ)")
    parser.add_argument("--workers", type=int, default=2, help="Số lượng worker chạy song song (mặc định: 4)")
    parser.add_argument("--force", "--overwrite", action="store_true", help="Bắt buộc chạy lại và ghi đè tất cả các file JSON cũ")
    return parser.parse_args()


def main():
    args = parse_args()

    input_dir = REPO_ROOT / args.input_dir
    if not input_dir.exists():
        print(f"❌ Không tìm thấy thư mục: {input_dir}")
        return

    files = sorted(list(input_dir.glob("*.md")))
    if not files:
        print(f"❌ Không có file .md nào trong {input_dir}")
        return

    # Lọc danh sách file cần bóc tách dựa trực tiếp vào sự tồn tại của file .json trong data/extracted_v2_json/
    if args.force:
        unprocessed_files = files
        print("🔄 Cờ --force được bật: Sẽ ghi đè toàn bộ các file JSON cũ!")
    else:
        unprocessed_files = [f for f in files if not is_already_extracted(f)]

    already_done_count = len(files) - len(unprocessed_files)

    if args.limit:
        unprocessed_files = unprocessed_files[: args.limit]

    print(f"🚀 Bắt đầu trích xuất v2 (Gemini 3.5 Flash Lite) trên {len(unprocessed_files)} file .md...")
    print(f"   - Số worker chạy song song: {args.workers} luồng (kèm Jitter anti-429)")
    print(f"   - Số file đã có sẵn JSON trong data/extracted_v2_json/: {already_done_count}/{len(files)} file.\n")

    if not unprocessed_files:
        print("✅ Tất cả các file đã có sẵn JSON trong data/extracted_v2_json/. Không cần bóc tách thêm!")
        total_master = sync_master_json()
        print(f"📁 Master File JSON: data/master_extracted_v2.json (tổng cộng {total_master} thuốc).")
        return

    llm_client = LLMClient(model="gemini-3.5-flash-lite", max_tokens=8192)
    processed = 0
    failed = 0

    try:
        with ThreadPoolExecutor(max_workers=args.workers) as executor:
            future_to_file = {
                executor.submit(process_single_file_worker, f, llm_client): f
                for f in unprocessed_files
            }

            for idx, future in enumerate(as_completed(future_to_file), start=1):
                file_path = future_to_file[future]
                try:
                    success, filename, result = future.result()
                    if success and isinstance(result, dict):
                        processed += 1
                        d2d_count = len(result.get("drug_drug_interactions", []))
                        d2dis_count = len(result.get("drug_disease_interactions", []))
                        d2supp_count = len(result.get("drug_supplement_interactions", []))
                        chunks_count = len(result.get("chunks", []))
                        print(f"[{processed}/{len(unprocessed_files)}] ✅ {filename} -> D2D={d2d_count}, D2Dis={d2dis_count}, D2Supp={d2supp_count}, Chunks={chunks_count}")
                    else:
                        failed += 1
                        print(f"[{processed + failed}/{len(unprocessed_files)}] ❌ {filename} thất bại: {result}")
                except Exception as exc:
                    failed += 1
                    print(f"❌ Exception trên worker cho {file_path.name}: {exc}")

    except KeyboardInterrupt:
        print(f"\n👋 Tạm dừng script (Ctrl+C). Tiến độ được lưu trực tiếp bằng các file trong data/extracted_v2_json/. Chạy lại bất kỳ lúc nào để RESUME!")

    total_master = sync_master_json()

    print("\n✅ HOÀN THÀNH BÁO CÁO BÓC TÁCH V2!")
    print(f"   - File xử lý thành công đợt này: {processed}/{len(unprocessed_files)}")
    print(f"   - Tổng số file JSON hiện có trên đĩa: {already_done_count + processed}/{len(files)}")
    print(f"📁 Thư mục lưu JSON từng thuốc: data/extracted_v2_json/")
    print(f"📁 Master File JSON: data/master_extracted_v2.json (tổng {total_master} thuốc).")


if __name__ == "__main__":
    main()
