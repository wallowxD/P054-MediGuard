-- Migration v2: Cập nhật Schema cho Supabase PostgreSQL
-- Gắn version='v1' cho dữ liệu hiện có, chuẩn bị cột và bảng cho v2

-- 1. Bổ sung các cột mới và version vào bảng drugs
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS version VARCHAR(50) DEFAULT 'v1';
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS pharmacological_class TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS therapeutic_effect TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS is_prescription BOOLEAN DEFAULT False;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS summary_indications TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS summary_contraindications TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS summary_dosage TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS summary_precautions TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS summary_side_effects TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS special_notes TEXT;

-- Đặt default cho các insert mới về sau là 'v2'
ALTER TABLE drugs ALTER COLUMN version SET DEFAULT 'v2';

-- Khử trùng lặp brand_name v1 cũ trước khi thêm Unique Constraint
DELETE FROM drugs d1
USING drugs d2
WHERE d1.brand_name = d2.brand_name AND d1.id > d2.id;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_drugs_brand_name'
    ) THEN
        ALTER TABLE drugs ADD CONSTRAINT uq_drugs_brand_name UNIQUE (brand_name);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_drugs_version ON drugs(version);

-- 2. Tạo hoặc bổ sung cột cho bảng diseases
CREATE TABLE IF NOT EXISTS diseases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disease_code TEXT UNIQUE,
    name TEXT NOT NULL,
    name_unaccent TEXT NOT NULL,
    category TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE diseases ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE diseases ADD COLUMN IF NOT EXISTS name_unaccent TEXT;
ALTER TABLE diseases ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE diseases ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE diseases ADD COLUMN IF NOT EXISTS version VARCHAR(50) DEFAULT 'v2';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_diseases_name'
    ) THEN
        ALTER TABLE diseases ADD CONSTRAINT uq_diseases_name UNIQUE (name);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_diseases_unaccent ON diseases(name_unaccent);

-- 3. Tạo bảng supplements (MỚI)
CREATE TABLE IF NOT EXISTS supplements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplement_name TEXT NOT NULL UNIQUE,
    supplement_name_unaccent TEXT NOT NULL,
    category TEXT,
    description TEXT,
    version VARCHAR(50) DEFAULT 'v2',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplements_unaccent ON supplements(supplement_name_unaccent);
CREATE INDEX IF NOT EXISTS idx_supplements_version ON supplements(version);

-- 4. Bổ sung version vào drug_drug_interactions
ALTER TABLE drug_drug_interactions ADD COLUMN IF NOT EXISTS version VARCHAR(50) DEFAULT 'v1';
ALTER TABLE drug_drug_interactions ALTER COLUMN version SET DEFAULT 'v2';
CREATE INDEX IF NOT EXISTS idx_d2d_version ON drug_drug_interactions(version);

-- 5. Bổ sung version vào drug_disease_interactions
ALTER TABLE drug_disease_interactions ADD COLUMN IF NOT EXISTS version VARCHAR(50) DEFAULT 'v1';
ALTER TABLE drug_disease_interactions ALTER COLUMN version SET DEFAULT 'v2';
CREATE INDEX IF NOT EXISTS idx_d2dis_version ON drug_disease_interactions(version);

-- 6. Tạo bảng drug_supplement_interactions (MỚI - Tương tác Thuốc – TPCN / Thực phẩm)
CREATE TABLE IF NOT EXISTS drug_supplement_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_id UUID REFERENCES drugs(id) ON DELETE CASCADE,
    canonical_ingredient TEXT NOT NULL,
    supplement_id UUID REFERENCES supplements(id) ON DELETE SET NULL,
    supplement_name TEXT NOT NULL,
    supplement_name_unaccent TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'moderate',
    effect_description TEXT NOT NULL,
    management TEXT,
    verbatim_quote TEXT NOT NULL,
    source_type VARCHAR(50) DEFAULT 'leaflet_ocr',
    version VARCHAR(50) DEFAULT 'v2',
    review_status VARCHAR(50) DEFAULT 'pending_review',
    reviewer_id UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_d2supp_ingredient ON drug_supplement_interactions(canonical_ingredient);
CREATE INDEX IF NOT EXISTS idx_d2supp_supplement_unaccent ON drug_supplement_interactions(supplement_name_unaccent);
CREATE INDEX IF NOT EXISTS idx_d2supp_version ON drug_supplement_interactions(version);

-- 7. Bổ sung version vào evidence_chunks
ALTER TABLE evidence_chunks ADD COLUMN IF NOT EXISTS version VARCHAR(50) DEFAULT 'v1';
ALTER TABLE evidence_chunks ALTER COLUMN version SET DEFAULT 'v2';
CREATE INDEX IF NOT EXISTS idx_evidence_version ON evidence_chunks(version);
