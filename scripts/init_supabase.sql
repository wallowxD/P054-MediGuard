-- ============================================================
-- Supabase PostgreSQL Schema Initialization for MedSafe Copilot (P-054)
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bảng Danh mục Thuốc (drugs)
CREATE TABLE IF NOT EXISTS drugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name TEXT NOT NULL,                    -- Biệt dược, e.g., "SaVi Acarbose 50 mg"
    brand_name_unaccent TEXT NOT NULL,           -- Biệt dược không dấu để search
    ingredient_raw TEXT NOT NULL,                -- Hoạt chất + hàm lượng gốc từ CSV
    canonical_ingredients TEXT[] NOT NULL,       -- Array hoạt chất chuẩn hóa chữ thường
    dosage_form TEXT,                            -- Dạng bào chế
    route TEXT,                                  -- Đường dùng
    manufacturer TEXT,                           -- Nhà sản xuất
    leaflet_url TEXT,                            -- Link PDF HDSD gốc
    insurance_payment_pct TEXT,                  -- % Thanh toán BHYT
    indication_limits TEXT,                      -- Giới hạn chỉ định
    indications TEXT,                            -- Chỉ định điều trị
    contraindications TEXT,                      -- Chống chỉ định
    dosage_and_admin TEXT,                       -- Liều lượng & Cách dùng
    warnings_and_precautions TEXT,               -- Cảnh báo & Thận trọng
    side_effects TEXT,                           -- Tác dụng phụ / ADR
    notes TEXT,                                  -- Ghi chú trạng thái link
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE drugs ALTER COLUMN insurance_payment_pct TYPE TEXT;
ALTER TABLE drugs ALTER COLUMN notes TYPE TEXT;
ALTER TABLE drugs ALTER COLUMN dosage_form TYPE TEXT;
ALTER TABLE drugs ALTER COLUMN route TYPE TEXT;
ALTER TABLE drugs ALTER COLUMN manufacturer TYPE TEXT;
ALTER TABLE drugs ALTER COLUMN brand_name TYPE TEXT;
ALTER TABLE drugs ALTER COLUMN brand_name_unaccent TYPE TEXT;

CREATE INDEX IF NOT EXISTS idx_drugs_canonical_ingredients ON drugs USING GIN(canonical_ingredients);
CREATE INDEX IF NOT EXISTS idx_drugs_brand_unaccent ON drugs(brand_name_unaccent);

-- 2. Bảng Tương Tác Thuốc - Thuốc (drug_drug_interactions)
CREATE TABLE IF NOT EXISTS drug_drug_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_a_norm TEXT NOT NULL,             -- Hoạt chất 1 (lowercase, sorted)
    ingredient_b_norm TEXT NOT NULL,             -- Hoạt chất 2 (lowercase, sorted)
    severity VARCHAR(50) NOT NULL,                -- contraindicated, major, moderate, minor
    mechanism TEXT,                              -- Cơ chế tương tác
    consequence TEXT,                            -- Hậu quả / tác hại lâm sàng
    management TEXT,                             -- Hướng xử trí / khuyên dùng
    verbatim_quote TEXT NOT NULL,                 -- Trích dẫn nguyên văn 100%
    source_type VARCHAR(50) NOT NULL,             -- 'national_database' HOẶC 'leaflet_ocr'
    source_drug_id UUID REFERENCES drugs(id) ON DELETE SET NULL,
    source_leaflet_url TEXT,                     -- Link PDF gốc
    review_status VARCHAR(50) DEFAULT 'pending_review',
    reviewer_id UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_canonical_pair_source UNIQUE(ingredient_a_norm, ingredient_b_norm, source_type)
);

ALTER TABLE drug_drug_interactions ALTER COLUMN ingredient_a_norm TYPE TEXT;
ALTER TABLE drug_drug_interactions ALTER COLUMN ingredient_b_norm TYPE TEXT;

CREATE INDEX IF NOT EXISTS idx_d2d_pair ON drug_drug_interactions(ingredient_a_norm, ingredient_b_norm);
CREATE INDEX IF NOT EXISTS idx_d2d_review_status ON drug_drug_interactions(review_status);

-- 3. Bảng Tương Tác Thuốc - Thực Phẩm (drug_food_interactions)
CREATE TABLE IF NOT EXISTS drug_food_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_id UUID REFERENCES drugs(id) ON DELETE CASCADE,
    canonical_ingredient TEXT NOT NULL,
    food_item TEXT NOT NULL,                      -- e.g., "rượu", "đường mía", "nước ép bưởi"
    effect_description TEXT NOT NULL,
    management TEXT,
    verbatim_quote TEXT NOT NULL,                 -- Trích dẫn nguyên văn từ HDSD
    review_status VARCHAR(50) DEFAULT 'pending_review',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE drug_food_interactions ALTER COLUMN canonical_ingredient TYPE TEXT;
ALTER TABLE drug_food_interactions ALTER COLUMN food_item TYPE TEXT;

CREATE INDEX IF NOT EXISTS idx_d2f_drug_id ON drug_food_interactions(drug_id);

-- 4. Bảng Bằng Chứng Văn Bản Chunk (evidence_chunks)
CREATE TABLE IF NOT EXISTS evidence_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_id UUID REFERENCES drugs(id) ON DELETE CASCADE,
    section_name TEXT NOT NULL,                   -- 'TƯƠNG TÁC THUỐC', 'CHỐNG CHỈ ĐỊNH'...
    content TEXT NOT NULL,                        -- Nội dung chunk nguyên văn
    chunk_index INT NOT NULL,
    start_char INT,
    end_char INT,
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE evidence_chunks ALTER COLUMN section_name TYPE TEXT;

CREATE INDEX IF NOT EXISTS idx_evidence_drug_id ON evidence_chunks(drug_id);

-- 5. Bảng Tương Tác Thuốc - Bệnh Nền (drug_disease_interactions)
CREATE TABLE IF NOT EXISTS drug_disease_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_id UUID REFERENCES drugs(id) ON DELETE SET NULL,
    canonical_ingredient TEXT NOT NULL,           -- Hoạt chất đã chuẩn hóa (lowercase)
    disease_name TEXT NOT NULL,                   -- Tên bệnh nền / chống chỉ định bệnh lý
    disease_name_unaccent TEXT NOT NULL,          -- Tên bệnh bỏ dấu tiếng Việt để tìm kiếm mờ
    severity VARCHAR(50) NOT NULL,                -- contraindicated, major, moderate, minor, unknown
    effect_description TEXT,                     -- Mô tả tác động / Hậu quả tương tác
    management TEXT,                             -- Hướng xử trí / Khuyên dùng / Thận trọng
    verbatim_quote TEXT NOT NULL,                 -- Trích dẫn nguyên văn 100% (bắt buộc theo ADR 0006)
    source_type VARCHAR(50) NOT NULL,             -- 'national_database' HOẶC 'leaflet_ocr'
    source_leaflet_url TEXT,                     -- Link PDF/MD HDSD gốc
    review_status VARCHAR(50) DEFAULT 'pending_review',
    reviewer_id UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_disease_interaction_source UNIQUE(canonical_ingredient, disease_name_unaccent, source_type)
);

ALTER TABLE drug_disease_interactions ALTER COLUMN canonical_ingredient TYPE TEXT;
ALTER TABLE drug_disease_interactions ALTER COLUMN disease_name TYPE TEXT;
ALTER TABLE drug_disease_interactions ALTER COLUMN disease_name_unaccent TYPE TEXT;

CREATE INDEX IF NOT EXISTS idx_d2dis_ingredient ON drug_disease_interactions(canonical_ingredient);
CREATE INDEX IF NOT EXISTS idx_d2dis_disease_unaccent ON drug_disease_interactions(disease_name_unaccent);
CREATE INDEX IF NOT EXISTS idx_d2dis_review_status ON drug_disease_interactions(review_status);

