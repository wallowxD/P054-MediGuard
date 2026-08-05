# Hướng dẫn Chạy Embeddings BAAI/bge-m3 & Upload Qdrant Cloud trên Kaggle (GPU T4)

Tài liệu này hướng dẫn cách upload file Notebook [`notebooks/embed_to_qdrant_bge_m3.ipynb`](file:///d:/Work/VinUni/P-054/notebooks/embed_to_qdrant_bge_m3.ipynb) lên **Kaggle Notebook (GPU T4)** để vectorize toàn bộ các đoạn văn bản HDSD và đẩy lên **Qdrant Cloud**.

---

## 🛠️ NGUYÊN TẮC THIẾT KẾ VECTOR DB (ĐẢM BẢO CẢNH BÁO TỐI ĐA & KHÔNG LẪN THUỐC)

1. **Mô hình Embedding**: **`BAAI/bge-m3`**
   - Hỗ trợ tiếng Việt chuyên ngành Y Dược siêu việt.
   - Vector Size: **1024 chiều**, Distance: **Cosine**.
   - Context window: **8192 tokens** (bao phủ trọn vẹn các đoạn trích nguyên văn dài).

2. **Cách ly Tuyệt đối giữa các Thuốc (0% Lẫn Thuốc)**:
   - Mỗi vector chunk khi lưu lên Qdrant Cloud đều có **Payload Indexing** chứa:
     - `brand_name`: Tên biệt dược (VD: `"SaVi Acarbose 50"`).
     - `canonical_ingredients`: Mảng các hoạt chất chuẩn hóa (VD: `["acarbose"]`).
     - `section_name`: Tên mục (`"CHỐNG CHỈ ĐỊNH"`, `"THẬN TRỌNG"`, `"ADR"`...).
   - **Khi RAG Tra cứu**: Truy vấn tìm kiếm sử dụng `Qdrant Payload Filter(must=[MatchValue("brand_name", target_drug)])`.
   - 🛡️ **Kết quả**: Cách ly toán học 100% — các chunk của thuốc khác không bao giờ lọt vào câu trả lời của thuốc đang hỏi.

---

## 📋 HƯỚNG DẪN 4 BƯỚC THỰC HIỆN TRÊN KAGGLE

### Bước 1: Nén Thư mục JSON Dữ liệu
Trên máy tính của bạn, nén thư mục `data/extracted_leaflets/` hoặc file `data/extracted_full_drugs.json` thành file `.zip`:
- Tạo file `extracted_data.zip` chứa các file JSON.

### Bước 2: Upload Dataset lên Kaggle
1. Vào trang [Kaggle Datasets](https://www.kaggle.com/datasets) -> Bấm **New Dataset**.
2. Đặt tên Dataset: `p054-extracted-leaflets`.
3. Kéo thả file `extracted_data.zip` vào và bấm **Create**.

### Bước 3: Tạo Kaggle Notebook & Cấu hình GPU T4
1. Vào [Kaggle Notebooks](https://www.kaggle.com/code) -> Bấm **New Notebook**.
2. Ở bảng cài đặt bên phải (Notebook options):
   - **Accelerator**: Chọn **GPU T4 x2** hoặc **GPU T4 x1**.
   - **Persistence**: Chọn **Variables and files**.
3. Thêm Dataset vừa tạo: Bấm **+ Add Data** ở góc trên bên phải -> Chọn Dataset `p054-extracted-leaflets` vừa tạo ở Bước 2.
4. Tải file [`notebooks/embed_to_qdrant_bge_m3.ipynb`](file:///d:/Work/VinUni/P-054/notebooks/embed_to_qdrant_bge_m3.ipynb) từ máy bạn và Import vào Kaggle (File -> Import Notebook).

### Bước 4: Điền Qdrant Cloud Credentials & Bấm Run All
Trong Cell 2 của Notebook, điền thông tin Qdrant Cloud của bạn:
```python
QDRANT_URL = "https://YOUR_CLUSTER_ID.us-east-1-0.aws.cloud.qdrant.io:6333"
QDRANT_API_KEY = "YOUR_QDRANT_CLOUD_API_KEY"
COLLECTION_NAME = "hdsd_medsafe_chunks"
DATA_DIR = "/kaggle/input/p054-extracted-leaflets/extracted_leaflets"
```
Bấm **Run All** (Shift + Enter hoặc nút Run trên thanh công cụ).

---

## ⚡ KẾT QUẢ SAU KHU CHẠY XONG:
1. Bạn sẽ có ngay một **Vector DB hoàn chỉnh trên Qdrant Cloud** (`hdsd_medsafe_chunks`).
2. Mọi đoạn văn bản HDSD đều được gán nhãn chính xác 100%, sẵn sàng cho ứng dụng Web / Agent RAG tra cứu.
