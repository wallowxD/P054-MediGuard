# P-054 — Medication Safety Copilot (Cuvée Tech)

**Ngữ cảnh đầy đủ nằm ở [AGENTS.md](../AGENTS.md) ở thư mục gốc repo. Đọc file đó
trước khi sửa code.**

Tóm tắt constraint hiện hành:

1. **Không bịa cảnh báo** — theo baseline hiện hành, mỗi cảnh báo tương tác thuốc gắn với đoạn trích
   nguyên văn từ PDF HDSD gốc + link nguồn. Không có trích dẫn → trả "chưa có dữ liệu",
   không để LLM tự suy luận ra tương tác.
2. **Không kết luận lâm sàng** — không chẩn đoán, không đề xuất đổi thuốc, không đưa liều.
3. **Human-in-the-loop không chặn luồng** — cảnh báo hiện ngay kèm nhãn "chờ xác nhận
   chuyên môn". Không implement full-gate.
4. **`gate/gate_1/` đã submit** — đây là vùng duy nhất bất biến: không sửa, xoá, đổi tên
   hay di chuyển.
5. **Không đụng `scripts/` và `.ai-log/`** — hạ tầng logging của BTC, tự động hoàn toàn.
   Không gọi tay script `log_*`. Không `git push --no-verify`.
6. **Luôn mở repo ở thư mục gốc `P-054/`**, không mở `backend/` hay `frontend/` làm
   workspace — hook logging dùng đường dẫn tương đối từ root, mở sai chỗ là mất log
   mà không có báo lỗi.

Các product/architecture constraint khác có thể thay đổi khi leader duyệt và PR cập nhật
spec/ADR liên quan; không tự thay đổi trong lúc implement.

Quy ước: Python 3.11 · ruff line-length 120 · type hint bắt buộc · không bare `except:` ·
Pydantic v2 · commit message tiếng Anh theo Conventional Commits · tài liệu team sở hữu
viết bằng tiếng Việt.
