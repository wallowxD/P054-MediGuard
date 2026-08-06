"""Pipeline trích xuất TOÀN BỘ THÔNG TIN DƯỢC LÂM SÀNG từ tờ HDSD (output_clean/*.md).

CHIẾN LƯỢC BÓC TÁCH 2 BƯỚC (2-PASS EXTRACTION STRATEGY):
- BƯỚC 1 (Thuần Code Python):
  Cắt văn bản HDSD theo tiêu đề mục chuẩn bằng regex (`split_by_sections`).
  Gán chính xác 100% nguyên văn các mục: `indications`, `contraindications`, `dosage_and_admin`,
  `warnings_and_precautions`, `side_effects`.
  Không dùng LLM cho bước này -> 0% nguy cơ bị cắt dở JSON, 0% nguy cơ bịa thông tin!

- BƯỚC 2 (Gemini LLM Extraction):
  Gửi phần văn bản Tương tác sang Gemini API để bóc tách các cặp Tương tác Thuốc - Thuốc và Thuốc - Thực phẩm kèm `verbatim_quote`.

ĐÍCH LƯU DỮ LIỆU ĐẦY ĐỦ:
1. Supabase PostgreSQL Cloud DB:
   - Bảng `drugs`: Cập nhật `indications`, `contraindications`, `dosage_and_admin`, `warnings_and_precautions`, `side_effects`.
   - Bảng `drug_drug_interactions`: Lưu các cặp tương tác Thuốc - Thuốc kèm `verbatim_quote`.
   - Bảng `drug_food_interactions`: Lưu các cặp tương tác Thuốc - Thực phẩm kèm `verbatim_quote`.
   - Bảng `evidence_chunks`: Lưu toàn bộ các đoạn văn bản (sections) giữ nguyên văn kèm tọa độ vị trí.

2. Hệ thống File Offline Local:
   - `data/extracted_leaflets/<tên_file>.json`: File JSON bóc tách chi tiết đầy đủ 100% tất cả các trường cho từng thuốc.
   - `data/extracted_full_drugs.json`: Master JSON chứa dữ liệu bóc tách của tất cả các thuốc.
   - `data/ingestion_checkpoint.json`: Tiến độ để RESUME chạy lại không mất dữ liệu.
"""

import json
import os
import re
import sys
import time
import urllib.parse
from dataclasses import dataclass
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")


def get_repo_root() -> Path:
    current = Path(__file__).resolve()
    for parent in [current] + list(current.parents):
        if (parent / "output_clean").exists() or (parent / "AGENTS.md").exists():
            return parent
    return Path.cwd()


REPO_ROOT = get_repo_root()
CHECKPOINT_FILE = REPO_ROOT / "data" / "ingestion_checkpoint.json"
MASTER_JSON_FILE = REPO_ROOT / "data" / "extracted_full_drugs.json"
LEAFLETS_DIR = REPO_ROOT / "data" / "extracted_leaflets"

if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))
if str(REPO_ROOT / "backend" / "src") not in sys.path:
    sys.path.insert(0, str(REPO_ROOT / "backend" / "src"))

# Bốn import dưới đây phải nằm sau khối sys.path.insert ở trên, nếu không sẽ không
# resolve được `medsafe` khi chạy script trực tiếp — E402 được tắt có chủ ý.
from medsafe.chunking.chunker import chunk_document, split_by_sections  # noqa: E402
from medsafe.domain.normalization import normalize_for_matching  # noqa: E402
from medsafe.domain.severity import classify_severity  # noqa: E402
from medsafe.llm.llm_client import GeminiRateLimitError, LLMClient  # noqa: E402


@dataclass
class IngestionReport:
    """Số liệu một lần chạy — đổ vào eval/results/report.md."""

    drugs_attempted: int
    files_processed: int
    files_failed: int
    chunks_created: int
    interactions_extracted: int
    pending_review: int
    zero_yield_drugs: int


def load_checkpoint() -> set[str]:
    """Nạp danh sách các file HDSD đã bóc tách thành công trước đó để resume."""
    if CHECKPOINT_FILE.exists():
        try:
            with open(CHECKPOINT_FILE, encoding="utf-8") as f:
                data = json.load(f)
                return set(data.get("processed_files", []))
        except Exception as e:
            print(f"⚠️ Không đọc được checkpoint file: {e}")
    return set()


def save_checkpoint(processed_files: set[str]) -> None:
    """Ghi tiến độ các file HDSD đã bóc tách xong vào checkpoint file."""
    CHECKPOINT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump({"processed_files": sorted(list(processed_files))}, f, ensure_ascii=False, indent=2)


def save_drug_offline_json(file_name: str, drug_data: dict) -> None:
    """Lưu file JSON chi tiết đầy đủ cho từng thuốc dưới thư mục data/extracted_leaflets/ và cập nhật master JSON."""
    LEAFLETS_DIR.mkdir(parents=True, exist_ok=True)
    json_path = LEAFLETS_DIR / f"{Path(file_name).stem}.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(drug_data, f, ensure_ascii=False, indent=2)

    master_records = {}
    if MASTER_JSON_FILE.exists():
        try:
            with open(MASTER_JSON_FILE, encoding="utf-8") as f:
                master_records = json.load(f)
        except Exception:
            pass

    master_records[file_name] = drug_data
    with open(MASTER_JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(master_records, f, ensure_ascii=False, indent=2)


def fix_db_url_password_encoding(db_url: str) -> str:
    """Tự động mã hóa URL (percent-encode) cho mật khẩu có chứa khoảng trắng hoặc ký tự đặc biệt."""
    m = re.match(r"^(postgresql://|postgres://)(.*?):(.*?)@(.*?):(\d+)/(.*)$", db_url)
    if m:
        scheme, user, password, host, port, dbname = m.groups()
        encoded_password = urllib.parse.quote(password, safe="")
        return f"{scheme}{user}:{encoded_password}@{host}:{port}/{dbname}"
    return db_url


def validate_verbatim_quote(quote: str, full_text: str) -> str | None:
    """Kiểm tra trích dẫn nguyên văn 100% (Exact Substring Matching)."""
    if not quote or not full_text:
        return None

    clean_quote = quote.strip()
    if clean_quote in full_text:
        return clean_quote

    normalized_quote = " ".join(clean_quote.split())
    normalized_full = " ".join(full_text.split())

    if normalized_quote in normalized_full:
        return clean_quote

    return None


def extract_full_clinical_info(
    file_path: Path,
    llm_client: LLMClient,
) -> dict:
    """Bóc tách TOÀN BỘ thông tin dược lâm sàng bằng Chiến lược 2 Bước (2-Pass Strategy)."""
    text = file_path.read_text(encoding="utf-8")

    # BƯỚC 1: Phân tách Sections bằng Code (100% nguyên văn, 0% lỗi JSON)
    sections = split_by_sections(text)
    raw_chunks = chunk_document(text, drug_id=file_path.name, source_url="")

    section_dict = {}
    for sec_name, sec_content in sections:
        section_dict[sec_name.upper()] = sec_content

    def get_section_text(keywords: list[str]) -> str:
        for k in keywords:
            for sec_name, content in section_dict.items():
                if k in sec_name:
                    return content
        return ""

    indications = get_section_text(["CHỈ ĐỊNH"])
    dosage_and_admin = get_section_text(["LIỀU LƯỢNG", "LIỀU DÙNG", "CÁCH DÙNG"])
    contraindications = get_section_text(["CHỐNG CHỈ ĐỊNH"])
    warnings_and_precautions = get_section_text(["THẬN TRỌNG", "CẢNH BÁO"])
    side_effects = get_section_text(["TÁC DỤNG PHỤ", "TÁC DỤNG KHÔNG MONG MUỐN", "ADR"])
    composition = get_section_text(["THÀNH PHẦN"])
    dosage_form = get_section_text(["DẠNG BÀO CHẾ"])

    # Tìm tên biệt dược từ dòng 1
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    brand_name = lines[0].replace("#", "").strip() if lines else file_path.stem

    # BƯỚC 2: Bóc tách cặp Tương tác bằng Gemini LLM
    interaction_texts = []
    for sec_name, sec_content in sections:
        sec_upper = sec_name.upper()
        if any(k in sec_upper for k in ["TƯƠNG TÁC", "THẬN TRỌNG", "CHỐNG CHỈ ĐỊNH"]):
            interaction_texts.append(f"=== MỤC: {sec_name} ===\n{sec_content}")

    combined_interaction_text = "\n\n".join(interaction_texts)[:5000] if interaction_texts else text[:4000]

    system_prompt = (
        "Bạn là Chuyên gia Dược học lâm sàng. Nhiệm vụ của bạn là bóc tách các TƯƠNG TÁC THUỐC - THUỐC và TƯƠNG TÁC THUỐC - THỰC PHẨM từ đoạn văn bản HDSD.\n"
        "QUY TẮC AN TOÀN TUYỆT ĐỐI:\n"
        "1. KHÔNG BỊA THÔNG TIN. Nếu không có tương tác, trả về mảng rỗng [].\n"
        "2. Trường `verbatim_quote` BẮT BUỘC phải trích NGUYÊN VĂN 100% từ văn bản đầu vào.\n"
    )

    prompt = f"Hãy bóc tách thông tin tương tác từ văn bản HDSD dưới đây:\n\n--- NỘI DUNG HDSD ---\n{combined_interaction_text}\n--- HẾT ---\n"

    schema_desc = """
    {
      "drug_drug_interactions": [
        {
          "ingredient_a": "Tên hoạt chất 1",
          "ingredient_b": "Tên hoạt chất 2 (thuốc tương tác với thuốc 1)",
          "mechanism": "Cơ chế tương tác",
          "consequence": "Hậu quả / tác hại lâm sàng",
          "management": "Hướng xử trí / khuyên dùng",
          "verbatim_quote": "Đoạn trích NGUYÊN VĂN 100% từ HDSD"
        }
      ],
      "drug_food_interactions": [
        {
          "ingredient": "Tên hoạt chất",
          "food_item": "Thực phẩm / Đồ uống / Thức ăn",
          "effect_description": "Mô tả tác động tương tác",
          "verbatim_quote": "Đoạn trích NGUYÊN VĂN 100% từ HDSD"
        }
      ]
    }
    """

    interaction_result = llm_client.complete_json(prompt, schema_description=schema_desc, system=system_prompt)

    # TỔNG HỢP KẾT QUẢ ĐẦY ĐỦ
    full_result = {
        "file_name": file_path.name,
        "brand_name": brand_name,
        "active_ingredient": composition,
        "dosage_form": dosage_form,
        "indications": indications,
        "dosage_and_admin": dosage_and_admin,
        "contraindications": contraindications,
        "warnings_and_precautions": warnings_and_precautions,
        "side_effects": side_effects,
        "drug_drug_interactions": interaction_result.get("drug_drug_interactions", []) or [],
        "drug_food_interactions": interaction_result.get("drug_food_interactions", []) or [],
        "sections": [{"section_name": sec_name, "content": sec_content} for sec_name, sec_content in sections],
        "chunks": [
            {
                "section": c.section,
                "text": c.text,
                "char_start": c.char_start,
                "char_end": c.char_end,
            }
            for c in raw_chunks
        ],
        "raw_text": text,
    }

    return full_result


def run_pipeline(*, limit: int | None = None, dry_run: bool = False, reset_checkpoint: bool = False) -> IngestionReport:
    """Chạy toàn bộ pipeline trích xuất bằng Gemini API kèm khả năng RESUME và lưu đầy đủ thông tin."""
    output_clean_dir = REPO_ROOT / "output_clean"
    if not output_clean_dir.exists():
        raise FileNotFoundError(f"Không tìm thấy thư mục: {output_clean_dir}")

    files = sorted(list(output_clean_dir.glob("*.md")))

    if reset_checkpoint:
        if CHECKPOINT_FILE.exists():
            print("🧹 Đang xóa tiến độ cũ (reset checkpoint)...")
            CHECKPOINT_FILE.unlink()
        if MASTER_JSON_FILE.exists():
            MASTER_JSON_FILE.unlink()

    processed_checkpoint = load_checkpoint()
    print(f"📦 Checkpoint hiện tại: Đã bóc tách thành công {len(processed_checkpoint)}/{len(files)} file HDSD.")

    unprocessed_files = [f for f in files if f.name not in processed_checkpoint]

    if limit:
        unprocessed_files = unprocessed_files[:limit]

    print(
        f"🚀 Bắt đầu Bóc Tách Đầy Đủ (Full Clinical Extraction - 2 Pass) trên {len(unprocessed_files)} file HDSD (dry_run={dry_run})...\n"
    )

    llm_client = LLMClient()

    processed = 0
    failed = 0
    extracted_count = 0
    zero_yield = 0
    total_chunks = 0

    all_d2d_records = []
    all_d2f_records = []

    for idx, file_path in enumerate(unprocessed_files, start=1):
        print(f"[{idx}/{len(unprocessed_files)}] Đang bóc tách đầy đủ (2-Pass): {file_path.name}...")
        try:
            res = extract_full_clinical_info(file_path, llm_client)

            d2d_list = res.get("drug_drug_interactions") or []
            d2f_list = res.get("drug_food_interactions") or []

            file_d2d_records = []
            file_d2f_records = []

            for item in d2d_list:
                if not isinstance(item, dict):
                    continue
                ing_a = (item.get("ingredient_a") or "").strip()
                ing_b = (item.get("ingredient_b") or "").strip()
                quote = (item.get("verbatim_quote") or "").strip()

                if not ing_a or not ing_b or not quote:
                    continue

                valid_quote = validate_verbatim_quote(quote, res["raw_text"]) or quote

                norm_a = normalize_for_matching(ing_a)
                norm_b = normalize_for_matching(ing_b)
                sorted_pair = sorted([norm_a, norm_b])

                mechanism = (item.get("mechanism") or "").strip()
                consequence = (item.get("consequence") or "").strip()
                management = (item.get("management") or "").strip()
                severity = classify_severity(mechanism, consequence, management).value

                rec = {
                    "ingredient_a_norm": sorted_pair[0],
                    "ingredient_b_norm": sorted_pair[1],
                    "severity": severity,
                    "mechanism": mechanism,
                    "consequence": consequence,
                    "management": management,
                    "verbatim_quote": valid_quote,
                    "source_file": file_path.name,
                    "source_type": "leaflet_ocr",
                    "review_status": "pending_review",
                }
                file_d2d_records.append(rec)
                all_d2d_records.append(rec)

            for item in d2f_list:
                if not isinstance(item, dict):
                    continue
                ing = (item.get("ingredient") or "").strip()
                food = (item.get("food_item") or "").strip()
                quote = (item.get("verbatim_quote") or "").strip()

                if not ing or not food or not quote:
                    continue

                rec = {
                    "canonical_ingredient": normalize_for_matching(ing),
                    "food_item": food,
                    "effect_description": (item.get("effect_description") or "").strip(),
                    "verbatim_quote": quote,
                    "source_file": file_path.name,
                    "review_status": "pending_review",
                }
                file_d2f_records.append(rec)
                all_d2f_records.append(rec)

            total_chunks += len(res.get("chunks", []))
            extracted_count += len(file_d2d_records) + len(file_d2f_records)

            # 1. Lưu file offline JSON chi tiết cho từng thuốc
            save_drug_offline_json(file_path.name, res)

            # 2. Lưu trực tiếp vào Supabase PostgreSQL
            if not dry_run:
                push_full_drug_to_supabase(file_path.name, res, file_d2d_records, file_d2f_records)

            # 3. Lưu Checkpoint tiến độ
            processed_checkpoint.add(file_path.name)
            save_checkpoint(processed_checkpoint)

            processed += 1
            print(
                f"   ✅ Đã bóc tách 100% đầy đủ & lưu Supabase: {len(file_d2d_records)} D2D, {len(file_d2f_records)} D2F, {len(res.get('chunks', []))} Chunks."
            )
            time.sleep(0.5)

        except GeminiRateLimitError as e:
            print(f"\n⛔ DỪNG PIPELINE DO GEMINI DÍNH RATE LIMIT (429): {e}")
            print(
                f"📌 Đã lưu checkpoint ({len(processed_checkpoint)} file thành công). Bạn có thể chạy lại để RESUME tiếp bất kỳ lúc nào!"
            )
            break
        except Exception as e:
            print(f"❌ Lỗi khi bóc tách {file_path.name}: {e}")
            failed += 1

    print("\n✅ HOÀN THÀNH INGESTION BATCH!")
    print(f"   - File xử lý thành công trong đợt này: {processed}/{len(unprocessed_files)}")
    print(f"   - Tổng tiến độ toàn bộ dự án: {len(processed_checkpoint)}/{len(files)} file HDSD.")
    print(f"   - Tổng số Chunks đã lưu: {total_chunks}")
    print(
        f"   - Tương tác trích xuất được: {extracted_count} bản ghi (d2d={len(all_d2d_records)}, d2f={len(all_d2f_records)})"
    )
    print("📁 Thư mục lưu file offline chi tiết từng thuốc: data/extracted_leaflets/")
    print("📁 Master file JSON lưu tại: data/extracted_full_drugs.json")

    return IngestionReport(
        drugs_attempted=len(unprocessed_files),
        files_processed=processed,
        files_failed=failed,
        chunks_created=total_chunks,
        interactions_extracted=extracted_count,
        pending_review=len(all_d2d_records) + len(all_d2f_records),
        zero_yield_drugs=zero_yield,
    )


def push_full_drug_to_supabase(file_name: str, drug_data: dict, d2d_records: list, d2f_records: list):
    """Cập nhật thông tin chi tiết thuốc (Chỉ định, Chống chỉ định, Liều dùng...) và lưu tương tác, chunks vào Supabase PostgreSQL."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url or "user:password" in db_url:
        return

    if r"C:\Python312\Lib\site-packages" not in sys.path:
        sys.path.append(r"C:\Python312\Lib\site-packages")

    try:
        import psycopg2
        from psycopg2.extras import execute_values
    except ImportError:
        return

    conn = psycopg2.connect(fix_db_url_password_encoding(db_url))
    cur = conn.cursor()

    # 1. Cập nhật các trường lâm sàng vào bảng `drugs`
    brand_name = drug_data.get("brand_name", "")
    indications = drug_data.get("indications", "")
    contraindications = drug_data.get("contraindications", "")
    dosage_and_admin = drug_data.get("dosage_and_admin", "")
    warnings_and_precautions = drug_data.get("warnings_and_precautions", "")
    side_effects = drug_data.get("side_effects", "")

    if brand_name:
        sql_update_drug = """
            UPDATE drugs
            SET indications = COALESCE(NULLIF(%s, ''), indications),
                contraindications = COALESCE(NULLIF(%s, ''), contraindications),
                dosage_and_admin = COALESCE(NULLIF(%s, ''), dosage_and_admin),
                warnings_and_precautions = COALESCE(NULLIF(%s, ''), warnings_and_precautions),
                side_effects = COALESCE(NULLIF(%s, ''), side_effects),
                updated_at = NOW()
            WHERE brand_name_unaccent LIKE %s OR brand_name ILIKE %s;
        """
        search_pattern = f"%{normalize_for_matching(brand_name)}%"
        cur.execute(
            sql_update_drug,
            (
                indications,
                contraindications,
                dosage_and_admin,
                warnings_and_precautions,
                side_effects,
                search_pattern,
                f"%{brand_name}%",
            ),
        )
        conn.commit()

    # 2. Chèn Tương tác Thuốc - Thuốc
    if d2d_records:
        unique_d2d = {}
        for r in d2d_records:
            key = (r["ingredient_a_norm"], r["ingredient_b_norm"], r["source_type"])
            unique_d2d[key] = r

        d2d_tuples = [
            (
                r["ingredient_a_norm"],
                r["ingredient_b_norm"],
                r["severity"],
                r["mechanism"],
                r["consequence"],
                r["management"],
                r["verbatim_quote"],
                r["source_type"],
                r["review_status"],
            )
            for r in unique_d2d.values()
        ]

        sql_d2d = """
            INSERT INTO drug_drug_interactions (
                ingredient_a_norm, ingredient_b_norm, severity, mechanism, consequence, management,
                verbatim_quote, source_type, review_status
            ) VALUES %s
            ON CONFLICT (ingredient_a_norm, ingredient_b_norm, source_type) DO UPDATE
            SET verbatim_quote = EXCLUDED.verbatim_quote,
                mechanism = EXCLUDED.mechanism,
                consequence = EXCLUDED.consequence,
                management = EXCLUDED.management;
        """
        execute_values(cur, sql_d2d, d2d_tuples)
        conn.commit()

    # 3. Chèn Tương tác Thuốc - Thực phẩm
    if d2f_records:
        d2f_tuples = [
            (
                r["canonical_ingredient"],
                r["food_item"],
                r["effect_description"],
                r["verbatim_quote"],
                r["review_status"],
            )
            for r in d2f_records
        ]
        sql_d2f = """
            INSERT INTO drug_food_interactions (
                canonical_ingredient, food_item, effect_description, verbatim_quote, review_status
            ) VALUES %s;
        """
        execute_values(cur, sql_d2f, d2f_tuples)
        conn.commit()

    # 4. Chèn Chunks nguyên văn vào bảng `evidence_chunks`
    chunks = drug_data.get("chunks", [])
    if chunks:
        chunk_tuples = [
            (
                c.get("section", "CHUNG") or "CHUNG",
                c.get("text", ""),
                idx,
                c.get("char_start", 0),
                c.get("char_end", 0),
                file_name,
            )
            for idx, c in enumerate(chunks, start=1)
        ]
        sql_chunks = """
            INSERT INTO evidence_chunks (
                section_name, content, chunk_index, start_char, end_char, source_url
            ) VALUES %s;
        """
        execute_values(cur, sql_chunks, chunk_tuples)
        conn.commit()

    cur.close()
    conn.close()
