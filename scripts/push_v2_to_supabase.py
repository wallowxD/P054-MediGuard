"""Script push v2: Nạp dữ liệu JSON v2 đã bóc tách từ Gemini lên Supabase PostgreSQL.

Bao gồm:
1. Chạy migration_v2.sql để đảm bảo schema có cột version ('v2') và các bảng supplements, drug_supplement_interactions.
2. Nạp dữ liệu v2 từ data/master_extracted_v2.json vào các bảng PostgreSQL:
   - drugs (v2)
   - supplements (v2)
   - drug_drug_interactions (v2)
   - drug_disease_interactions (v2)
   - drug_supplement_interactions (v2)
   - evidence_chunks (v2)
"""

import argparse
import json
import os
import re
import sys
import urllib.parse
from pathlib import Path

# Setup paths & encoding
sys.stdout.reconfigure(encoding="utf-8")

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "backend" / "src"))

from medsafe.domain.normalization import normalize_for_matching, remove_vietnamese_accents

# Load .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

MASTER_JSON_FILE = REPO_ROOT / "data" / "master_extracted_v2.json"
SQL_MIGRATION_FILE = REPO_ROOT / "scripts" / "migration_v2.sql"


def fix_db_url_password_encoding(db_url: str) -> str:
    """Tự động chuẩn hóa URL scheme (bỏ +psycopg/asyncpg) và mã hóa password cho psycopg2."""
    clean_url = re.sub(r"^postgresql\+[a-z0-9_]+://", "postgresql://", db_url.strip())
    m = re.match(r"^(postgresql://|postgres://)(.*?):(.*?)@(.*?):(\d+)/(.*)$", clean_url)
    if m:
        scheme, user, password, host, port, dbname = m.groups()
        encoded_password = urllib.parse.quote(password, safe="")
        return f"{scheme}{user}:{encoded_password}@{host}:{port}/{dbname}"
    return clean_url


def run_migration_v2(cur, conn):
    """Khởi chạy migration SQL v2 trên Supabase."""
    if SQL_MIGRATION_FILE.exists():
        print("--> Đang chạy migration scripts/migration_v2.sql trên Supabase...")
        sql_content = SQL_MIGRATION_FILE.read_text(encoding="utf-8")
        cur.execute(sql_content)
        conn.commit()
        print("✅ Migration v2 hoàn tất thành công.")


def load_csv_metadata(csv_path: Path) -> tuple[dict, dict]:
    """Tạo lookup map từ file CSV dataset/drug_list_bv_gtvt.csv theo Google Drive File ID & Brand Name."""
    if not csv_path.exists():
        return {}, {}
    import unicodedata
    import pandas as pd

    def norm(text):
        if not text:
            return ""
        text = unicodedata.normalize("NFD", str(text))
        text = re.sub(r"[\u0300-\u036f]", "", text)
        return re.sub(r"[^a-zA-Z0-9]", "", text).lower()

    def extract_gdrive_id(url):
        if not isinstance(url, str):
            return ""
        m = re.search(r"/d/([a-zA-Z0-9_-]+)", url)
        return m.group(1) if m else ""

    try:
        df = pd.read_csv(csv_path)
        id_map = {}
        brand_map = {}
        for _, row in df.iterrows():
            bname = str(row.get("Biet duoc") or "").strip()
            u1 = extract_gdrive_id(row.get("Link HDSD 1"))
            u2 = extract_gdrive_id(row.get("Link 2"))
            meta = {
                "dosage_form": str(row.get("Dang bao che") or "").strip(),
                "route": str(row.get("Duong dung") or "").strip(),
                "manufacturer": str(row.get("Hang san xuat") or "").strip(),
                "leaflet_url": str(row.get("Link HDSD 1") or "").strip(),
            }
            if u1:
                id_map[u1] = meta
            if u2:
                id_map[u2] = meta
            nbname = norm(bname)
            if nbname and nbname not in brand_map:
                brand_map[nbname] = meta
        return id_map, brand_map
    except Exception as e:
        print(f"⚠️ Không thể đọc CSV metadata: {e}")
        return {}, {}


def push_master_v2_to_supabase(db_url: str, master_file: Path):
    try:
        import psycopg2
        from psycopg2.extras import execute_values
    except ImportError:
        print("❌ Chưa cài psycopg2-binary. Vui lòng cài đặt: pip install psycopg2-binary")
        return False

    if not master_file.exists():
        print(f"❌ Không tìm thấy master JSON file tại: {master_file}")
        return False

    with open(master_file, encoding="utf-8") as f:
        master_data = json.load(f)

    print(f"📦 Đã đọc {len(master_data)} thuốc từ master JSON file.")
    id_meta_map, brand_meta_map = load_csv_metadata(REPO_ROOT / "dataset" / "drug_list_bv_gtvt.csv")

    fixed_url = fix_db_url_password_encoding(db_url)
    print("--> Đang kết nối tới Supabase PostgreSQL...")
    conn = psycopg2.connect(fixed_url)
    cur = conn.cursor()

    # 1. Chạy Migration v2
    run_migration_v2(cur, conn)

    # 2. Push Bảng drugs (v2)
    print(f"--> Đang cập nhật/chèn dữ liệu v2 đầy đủ các cột vào bảng `drugs`...")
    import unicodedata

    def norm(text):
        if not text:
            return ""
        text = unicodedata.normalize("NFD", str(text))
        text = re.sub(r"[\u0300-\u036f]", "", text)
        return re.sub(r"[^a-zA-Z0-9]", "", text).lower()

    seen_brands = set()
    drug_tuples = []
    for file_name, d in master_data.items():
        brand_name = (d.get("brand_name") or "").strip()
        if not brand_name or brand_name.lower() in seen_brands:
            continue
        seen_brands.add(brand_name.lower())
        brand_unaccent = remove_vietnamese_accents(brand_name).lower()
        canonical_arr = d.get("canonical_ingredients") or []

        # Lấy metadata từ CSV bằng Google Drive File ID (khớp 100%) hoặc Brand Name
        meta = {}
        for fid, fmeta in id_meta_map.items():
            if len(fid) >= 8 and fid in file_name:
                meta = fmeta
                break
        if not meta:
            meta = brand_meta_map.get(norm(brand_name), {})

        sum_ind = d.get("summary_indications", "")
        sum_contra = d.get("summary_contraindications", "")
        sum_dos = d.get("summary_dosage", "")
        sum_prec = d.get("summary_precautions", "")
        sum_side = d.get("summary_side_effects", "")

        drug_tuples.append((
            brand_name,
            brand_unaccent,
            ", ".join(canonical_arr) if canonical_arr else brand_name,
            canonical_arr,
            meta.get("dosage_form") or d.get("dosage_form", ""),
            meta.get("route") or d.get("route", ""),
            meta.get("manufacturer") or d.get("manufacturer", ""),
            meta.get("leaflet_url") or "",
            sum_ind,     # indications (Full/Summary)
            sum_contra,  # contraindications (Full/Summary)
            sum_dos,     # dosage_and_admin (Full/Summary)
            sum_prec,    # warnings_and_precautions (Full/Summary)
            sum_side,    # side_effects (Full/Summary)
            d.get("pharmacological_class", ""),
            d.get("therapeutic_effect", ""),
            d.get("is_prescription", False),
            sum_ind,     # summary_indications
            sum_contra,  # summary_contraindications
            sum_dos,     # summary_dosage
            sum_prec,    # summary_precautions
            sum_side,    # summary_side_effects
            d.get("special_notes", ""),
            "v2"
        ))

    sql_drugs = """
        INSERT INTO drugs (
            brand_name, brand_name_unaccent, ingredient_raw, canonical_ingredients,
            dosage_form, route, manufacturer, leaflet_url,
            indications, contraindications, dosage_and_admin, warnings_and_precautions, side_effects,
            pharmacological_class, therapeutic_effect, is_prescription,
            summary_indications, summary_contraindications, summary_dosage,
            summary_precautions, summary_side_effects, special_notes, version
        ) VALUES %s
        ON CONFLICT (brand_name) DO UPDATE SET
            dosage_form = EXCLUDED.dosage_form,
            route = EXCLUDED.route,
            manufacturer = EXCLUDED.manufacturer,
            leaflet_url = EXCLUDED.leaflet_url,
            indications = EXCLUDED.indications,
            contraindications = EXCLUDED.contraindications,
            dosage_and_admin = EXCLUDED.dosage_and_admin,
            warnings_and_precautions = EXCLUDED.warnings_and_precautions,
            side_effects = EXCLUDED.side_effects,
            pharmacological_class = EXCLUDED.pharmacological_class,
            therapeutic_effect = EXCLUDED.therapeutic_effect,
            is_prescription = EXCLUDED.is_prescription,
            summary_indications = EXCLUDED.summary_indications,
            summary_contraindications = EXCLUDED.summary_contraindications,
            summary_dosage = EXCLUDED.summary_dosage,
            summary_precautions = EXCLUDED.summary_precautions,
            summary_side_effects = EXCLUDED.summary_side_effects,
            special_notes = EXCLUDED.special_notes,
            version = 'v2',
            updated_at = NOW();
    """
    execute_values(cur, sql_drugs, drug_tuples)
    conn.commit()

    # Lấy mapping brand_name -> drug_id
    cur.execute("SELECT brand_name, id FROM drugs;")
    drug_id_map = {row[0]: row[1] for row in cur.fetchall()}

    # 3. Push Bảng supplements và drug_supplement_interactions
    print("--> Đang chèn Thực phẩm / TPCN vào `supplements` & `drug_supplement_interactions`...")
    supplements_dict = {}  # supp_name -> category
    d2supp_tuples = []

    for file_name, d in master_data.items():
        bname = (d.get("brand_name") or "").strip()
        drug_id = drug_id_map.get(bname)

        for item in d.get("drug_supplement_interactions", []):
            supp_name = (item.get("supplement_name") or "").strip()
            cat = (item.get("category") or "food").strip().lower()
            ing = (item.get("canonical_ingredient") or item.get("ingredient") or "").strip()
            quote = (item.get("verbatim_quote") or "").strip()

            if supp_name:
                supplements_dict[supp_name] = cat

            if ing and supp_name and quote:
                d2supp_tuples.append((
                    drug_id,
                    ing,
                    supp_name,
                    normalize_for_matching(supp_name),
                    item.get("severity", "moderate"),
                    item.get("effect_description", ""),
                    item.get("management", ""),
                    quote,
                    "leaflet_ocr",
                    "v2",
                    "pending_review"
                ))

    if supplements_dict:
        supp_tuples = [(s_name, normalize_for_matching(s_name), cat, "v2") for s_name, cat in supplements_dict.items()]
        sql_supp = """
            INSERT INTO supplements (supplement_name, supplement_name_unaccent, category, version)
            VALUES %s
            ON CONFLICT (supplement_name) DO UPDATE SET category = EXCLUDED.category;
        """
        execute_values(cur, sql_supp, supp_tuples)
        conn.commit()

    if d2supp_tuples:
        # Xóa bản ghi v2 cũ để chống trùng lặp nếu nạp lại
        cur.execute("DELETE FROM drug_supplement_interactions WHERE version = 'v2';")
        sql_d2supp = """
            INSERT INTO drug_supplement_interactions (
                drug_id, canonical_ingredient, supplement_name, supplement_name_unaccent,
                severity, effect_description, management, verbatim_quote, source_type, version, review_status
            ) VALUES %s;
        """
        execute_values(cur, sql_d2supp, d2supp_tuples)
        conn.commit()

    # 4. Push Bảng diseases và drug_disease_interactions
    print("--> Đang chèn Danh mục Bệnh vào `diseases` & `drug_disease_interactions`...")
    diseases_dict = {}  # name_unaccent -> orig_name
    seen_d2dis = set()
    d2dis_tuples = []

    for file_name, d in master_data.items():
        bname = (d.get("brand_name") or "").strip()
        drug_id = drug_id_map.get(bname)

        for item in d.get("drug_disease_interactions", []):
            dis_name = (item.get("disease_name") or "").strip()
            ing = (item.get("canonical_ingredient") or item.get("ingredient") or "").strip()
            quote = (item.get("verbatim_quote") or "").strip()

            if dis_name:
                unacc = normalize_for_matching(dis_name)
                if unacc and unacc not in diseases_dict:
                    diseases_dict[unacc] = dis_name

            if ing and dis_name and quote:
                unacc_dis = normalize_for_matching(dis_name)
                pair_key = (ing, unacc_dis, "leaflet_ocr")
                if pair_key in seen_d2dis:
                    continue
                seen_d2dis.add(pair_key)

                d2dis_tuples.append((
                    drug_id,
                    ing,
                    dis_name,
                    unacc_dis,
                    item.get("severity", "moderate"),
                    item.get("effect_description", ""),
                    item.get("management", ""),
                    quote,
                    "leaflet_ocr",
                    "v2",
                    "pending_review"
                ))

    if diseases_dict:
        cur.execute("SELECT name_unaccent FROM diseases WHERE name_unaccent IS NOT NULL;")
        existing_dis_unacc = {row[0] for row in cur.fetchall()}

        dis_tuples = [
            (orig_name, unacc_name, "v2")
            for unacc_name, orig_name in diseases_dict.items()
            if unacc_name not in existing_dis_unacc
        ]
        if dis_tuples:
            sql_dis = """
                INSERT INTO diseases (name, name_unaccent, version)
                VALUES %s
                ON CONFLICT DO NOTHING;
            """
            execute_values(cur, sql_dis, dis_tuples)
            conn.commit()

    if d2dis_tuples:
        # Xóa bản ghi v2 cũ để chống trùng lặp nếu nạp lại
        cur.execute("DELETE FROM drug_disease_interactions WHERE version = 'v2';")
        sql_d2dis = """
            INSERT INTO drug_disease_interactions (
                drug_id, canonical_ingredient, disease_name, disease_name_unaccent,
                severity, effect_description, management, verbatim_quote, source_type, version, review_status
            ) VALUES %s
            ON CONFLICT (canonical_ingredient, disease_name_unaccent, source_type) DO UPDATE SET
                severity = EXCLUDED.severity,
                effect_description = EXCLUDED.effect_description,
                management = EXCLUDED.management,
                verbatim_quote = EXCLUDED.verbatim_quote,
                version = 'v2';
        """
        execute_values(cur, sql_d2dis, d2dis_tuples)
        conn.commit()

    # 5. Push Drug-Drug Interactions (v2)
    print("--> Đang chèn Tương tác Thuốc – Thuốc (v2) vào `drug_drug_interactions`...")
    seen_d2d = set()
    d2d_tuples = []
    for file_name, d in master_data.items():
        bname = (d.get("brand_name") or "").strip()
        drug_id = drug_id_map.get(bname)

        for item in d.get("drug_drug_interactions", []):
            ing_a = item.get("ingredient_a_norm")
            ing_b = item.get("ingredient_b_norm")
            quote = item.get("verbatim_quote")

            if ing_a and ing_b and quote:
                pair_key = (ing_a, ing_b, "leaflet_ocr")
                if pair_key in seen_d2d:
                    continue
                seen_d2d.add(pair_key)

                d2d_tuples.append((
                    ing_a,
                    ing_b,
                    item.get("severity", "unknown"),
                    item.get("mechanism", ""),
                    item.get("consequence", ""),
                    item.get("management", ""),
                    quote,
                    "leaflet_ocr",
                    drug_id,
                    "v2",
                    "pending_review"
                ))

    if d2d_tuples:
        sql_d2d = """
            INSERT INTO drug_drug_interactions (
                ingredient_a_norm, ingredient_b_norm, severity, mechanism, consequence, management,
                verbatim_quote, source_type, source_drug_id, version, review_status
            ) VALUES %s
            ON CONFLICT (ingredient_a_norm, ingredient_b_norm, source_type) DO UPDATE SET
                severity = EXCLUDED.severity,
                mechanism = EXCLUDED.mechanism,
                consequence = EXCLUDED.consequence,
                management = EXCLUDED.management,
                verbatim_quote = EXCLUDED.verbatim_quote,
                version = 'v2';
        """
        execute_values(cur, sql_d2d, d2d_tuples)
        conn.commit()

    # 5. Push Evidence Chunks (v2)
    print("--> Đang chèn Evidence Chunks (v2) vào `evidence_chunks`...")
    chunk_tuples = []
    for file_name, d in master_data.items():
        bname = (d.get("brand_name") or "").strip()
        drug_id = drug_id_map.get(bname)

        for idx, c in enumerate(d.get("chunks", []), start=1):
            sec = c.get("section") or "CHUNG"
            text = c.get("text") or ""
            if text:
                chunk_tuples.append((
                    drug_id,
                    sec,
                    text,
                    idx,
                    c.get("char_start", 0),
                    c.get("char_end", 0),
                    file_name,
                    "v2"
                ))

    if chunk_tuples:
        # Xóa bản ghi v2 cũ để chống trùng lặp nếu nạp lại
        cur.execute("DELETE FROM evidence_chunks WHERE version = 'v2';")
        sql_chunks = """
            INSERT INTO evidence_chunks (
                drug_id, section_name, content, chunk_index, start_char, end_char, source_url, version
            ) VALUES %s;
        """
        execute_values(cur, sql_chunks, chunk_tuples)
        conn.commit()

    cur.close()
    conn.close()
    print("🎉 HOÀN THÀNH NẠP DỮ LIỆU V2 LÊN SUPABASE POSTGRESQL!")
    return True


def main():
    parser = argparse.ArgumentParser(description="Push dữ liệu v2 từ master JSON lên Supabase")
    parser.add_argument("--db-url", type=str, help="Chuỗi kết nối PostgreSQL (DATABASE_URL)")
    args = parser.parse_args()

    db_url = args.db_url or os.getenv("DATABASE_URL")
    if not db_url or "user:password" in db_url:
        print("❌ Chưa cấu hình DATABASE_URL trong .env hoặc tham số --db-url.")
        return

    push_master_v2_to_supabase(db_url, MASTER_JSON_FILE)


if __name__ == "__main__":
    main()
