"""Script nạp dữ liệu Seed từ CSV, Manifest và drugtodrug.json lên Supabase (PostgreSQL hoặc REST API).

Bao gồm:
1. Nạp danh mục thuốc (dataset/drug_list_bv_gtvt.csv + dataset/hdsd_raw/manifest.csv) -> Bảng `drugs`.
2. Nạp 633 cặp tương tác chuẩn (dataset/drugtodrug.json) -> Bảng `drug_drug_interactions`.
"""

import argparse
import json
import os
from pathlib import Path
import re
import sys
import urllib.parse

sys.stdout.reconfigure(encoding="utf-8")

# Thêm backend/src vào sys.path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend" / "src"))

from medsafe.domain.normalization import normalize_for_matching, remove_vietnamese_accents
from medsafe.domain.severity import classify_severity
from medsafe.ingestion.loader import load_drug_list

# Load .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


def parse_args():
    parser = argparse.ArgumentParser(description="Nạp dữ liệu Seed lên Supabase")
    parser.add_argument("--db-url", type=str, help="Chuỗi kết nối PostgreSQL (DATABASE_URL)")
    parser.add_argument("--only-with-hdsd", action="store_true", default=True, help="Lọc giữ lại các thuốc có file HDSD đã OCR thành công")
    return parser.parse_args()


def fix_db_url_password_encoding(db_url: str) -> str:
    """Tự động mã hóa URL (percent-encode) cho mật khẩu có chứa khoảng trắng hoặc ký tự đặc biệt."""
    m = re.match(r"^(postgresql://|postgres://)(.*?):(.*?)@(.*?):(\d+)/(.*)$", db_url)
    if m:
        scheme, user, password, host, port, dbname = m.groups()
        encoded_password = urllib.parse.quote(password, safe="")
        return f"{scheme}{user}:{encoded_password}@{host}:{port}/{dbname}"
    return db_url


def generate_seed_data(only_with_hdsd: bool = True):
    csv_path = Path("dataset/drug_list_bv_gtvt.csv")
    manifest_path = Path("dataset/hdsd_raw/manifest.csv")
    json_path = Path("dataset/drugtodrug.json")

    print(f"--> Đang nạp danh mục thuốc từ {csv_path} & {manifest_path} (only_with_hdsd={only_with_hdsd})...")
    raw_drugs = load_drug_list(csv_path, manifest_path=manifest_path, only_with_hdsd=only_with_hdsd)
    print(f"✅ Đã nạp {len(raw_drugs)} thuốc độc lập tương ứng với 772 file .md trong output_clean/.")

    print(f"--> Đang nạp 633 cặp tương tác từ {json_path}...")
    with open(json_path, encoding="utf-8") as f:
        d2d_raw = json.load(f).get("data", [])

    d2d_dict = {}
    for item in d2d_raw:
        ing1 = item.get("Hoạt chất 1", "").strip()
        ing2 = item.get("Hoạt chất 2", "").strip()
        if not ing1 or not ing2:
            continue

        norm1 = normalize_for_matching(ing1)
        norm2 = normalize_for_matching(ing2)

        sorted_pair = sorted([norm1, norm2])
        ing_a, ing_b = sorted_pair[0], sorted_pair[1]

        mechanism = item.get("Cơ chế", "").strip()
        consequence = item.get("Hậu quả", "").strip()
        management = item.get("Xử trí", "").strip()

        severity = classify_severity(mechanism, consequence, management).value
        verbatim_quote = f"Tương tác giữa {ing1} và {ing2}. Cơ chế: {mechanism}. Hậu quả: {consequence}. Xử trí: {management}"

        key = (ing_a, ing_b)
        # Đã khử trùng lặp theo key (ing_a, ing_b)
        d2d_dict[key] = {
            "ingredient_a_norm": ing_a,
            "ingredient_b_norm": ing_b,
            "severity": severity,
            "mechanism": mechanism,
            "consequence": consequence,
            "management": management,
            "verbatim_quote": verbatim_quote,
            "source_type": "national_database",
            "review_status": "approved"
        }

    d2d_pairs = list(d2d_dict.values())
    print(f"✅ Đã chuẩn hóa {len(d2d_pairs)} cặp tương tác thuốc - thuốc độc lập (sau khi khử trùng lặp).")
    return raw_drugs, d2d_pairs


def execute_import_postgres(db_url: str, raw_drugs, d2d_pairs):
    try:
        import psycopg2
        from psycopg2.extras import execute_values
    except ImportError:
        print("⚠️ Chưa cài đặt psycopg2-binary.")
        return False

    fixed_url = fix_db_url_password_encoding(db_url)
    print(f"--> Đang kết nối tới PostgreSQL Supabase...")

    try:
        conn = psycopg2.connect(fixed_url)
    except Exception as e:
        print(f"❌ Kết nối Postgres thất bại: {e}")
        return False

    cur = conn.cursor()

    # 1. Khởi tạo tables từ init_supabase.sql
    sql_init_path = Path("scripts/init_supabase.sql")
    if sql_init_path.exists():
        print("--> Khởi tạo Bảng DB từ scripts/init_supabase.sql...")
        cur.execute(sql_init_path.read_text(encoding="utf-8"))
        conn.commit()

    # 2. Insert Drugs Catalog
    print(f"--> Đang chèn {len(raw_drugs)} bản ghi thuốc vào bảng `drugs`...")
    drug_tuples = []
    for d in raw_drugs:
        brand_unaccent = remove_vietnamese_accents(d.brand_name).lower()
        canonical_arr = [d.canonical_ingredient] if d.canonical_ingredient else []
        drug_tuples.append((
            d.brand_name,
            brand_unaccent,
            d.active_ingredient_raw,
            canonical_arr,
            d.dosage_form,
            d.route,
            d.manufacturer,
            d.hdsd_url,
            d.insurance_payment_pct,
            d.indication_limits,
            d.notes
        ))

    insert_drugs_sql = """
        INSERT INTO drugs (
            brand_name, brand_name_unaccent, ingredient_raw, canonical_ingredients,
            dosage_form, route, manufacturer, leaflet_url, insurance_payment_pct, indication_limits, notes
        ) VALUES %s
        ON CONFLICT DO NOTHING;
    """
    execute_values(cur, insert_drugs_sql, drug_tuples)
    conn.commit()

    # 3. Insert Drug-Drug Interactions
    print(f"--> Đang chèn {len(d2d_pairs)} cặp tương tác vào bảng `drug_drug_interactions`...")
    d2d_tuples = [
        (
            p["ingredient_a_norm"],
            p["ingredient_b_norm"],
            p["severity"],
            p["mechanism"],
            p["consequence"],
            p["management"],
            p["verbatim_quote"],
            p["source_type"],
            p["review_status"]
        ) for p in d2d_pairs
    ]

    insert_d2d_sql = """
        INSERT INTO drug_drug_interactions (
            ingredient_a_norm, ingredient_b_norm, severity, mechanism, consequence, management,
            verbatim_quote, source_type, review_status
        ) VALUES %s
        ON CONFLICT (ingredient_a_norm, ingredient_b_norm, source_type) DO UPDATE
        SET severity = EXCLUDED.severity,
            mechanism = EXCLUDED.mechanism,
            consequence = EXCLUDED.consequence,
            management = EXCLUDED.management;
    """
    execute_values(cur, insert_d2d_sql, d2d_tuples)
    conn.commit()

    cur.close()
    conn.close()
    print("🎉 NẠP THÀNH CÔNG DỮ LIỆU LÊN SUPABASE POSTGRESQL!")
    return True


def main():
    args = parse_args()
    raw_drugs, d2d_pairs = generate_seed_data(only_with_hdsd=args.only_with_hdsd)

    db_url = args.db_url or os.getenv("DATABASE_URL")

    if db_url and not db_url.startswith("postgresql://user:password"):
        success = execute_import_postgres(db_url, raw_drugs, d2d_pairs)
        if not success:
            print("\n📌 HƯỚNG DẪN KHẮC PHỤC KẾT NỐI POSTGRESQL:")
            print("Host 'db.[project_ref].supabase.co' là IPv6-only nên mạng Việt Nam đôi khi không phân giải được.")
            print("Vào Supabase Dashboard -> Database -> Connection String -> Chọn tab 'Pooler' (IPv4).")
            print("Link Pooler hỗ trợ IPv4 sẽ có dạng:")
            print("   postgresql://postgres.[project_ref]:<mật_khẩu>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres")


if __name__ == "__main__":
    main()
