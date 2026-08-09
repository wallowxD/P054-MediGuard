# GATE 1 — Cuvée Tech (P-054)

> **Bản sửa ngày 09/08/2026** theo góp ý của leader: bổ sung Acceptance Criteria cho từng
> dòng Requirements trong PRD, chốt mốc thời gian phản hồi, và xử lý mâu thuẫn giữa mục
> *Out of Scope* của PRD với chức năng *"Tra thuốc với bệnh nền"* trong UI Flow. Toàn bộ
> danh sách thay đổi: [`specs/gate-1-feedback-response.md`](../../specs/gate-1-feedback-response.md).

**Dự án:** Medication Safety Copilot — AI Agent tra cứu tương tác **thuốc–thuốc**, **thuốc–thực phẩm** và **thuốc–bệnh nền tự khai** có nguồn, đặt trong bối cảnh web app *"Hệ thống y tế X"*.

> Agent đóng vai trò **cảnh báo an toàn tham khảo**, hiển thị nguyên văn trích dẫn kèm nguồn và trạng thái review — **không tự kết luận lâm sàng và không thay thế quyết định của bác sĩ**.

---

## 👥 Thành viên

| Họ tên | Vai trò |
|---|---|
| Lê Nguyễn Minh Quang | PM / PO / Tech Lead / Fullstack Developer |
| Nguyễn Thanh Hùng | Backend + Database |
| Đỗ Quý Đức | Frontend + Backend |
| Lê Nhật Minh | Frontend + Database|

---

## 📦 Deliverables GATE 1

| # | Deliverable | File / Link | Trạng thái |
|---|---|---|:---:|
| 1 | **Brief** | [Project Brief.docx](Project%20Brief.docx) | ✅ |
| 2 | **PRD** | [Product Requirements Document (PRD).docx](Product%20Requirements%20Document%20(PRD).docx) | ✅ |
| 3 | **Wireframe / UI Flow** | [Diagram FLow.jpg](Diagram%20FLow.jpg) + [Figma board — Cuvée Tech](https://www.figma.com/board/NeIgXUC2eFtikTWvejnvwd/Cuv%C3%A9e-Tech?node-id=930-197) | ✅ |
| 4 | **GitHub Repo + Setup AI Log** | [github.com/AI20K-Build-Phase-Cohort-3/P-054](https://github.com/AI20K-Build-Phase-Cohort-3/P-054) — xem [AI_LOGGING_SETUP.md](../../AI_LOGGING_SETUP.md) | ✅ |
| — | *Bổ sung:* MVP Explainer Video | [Google Drive](https://drive.google.com/file/d/1kRtfjdhkEWkg1vp5mOqWZ-PBlm9As8U7/view) | ✅ |

> ⚠️ **Về Wireframe và Video:** hai hạng mục này **không đính kèm được trong thư mục** (wireframe nằm trên Figma board, video dung lượng lớn nên đưa lên Google Drive). Vui lòng chấm qua link tương ứng trong bảng.

---

## 📄 Chi tiết từng deliverable

### 1. Brief — Project Brief
Xác định bức tranh tổng quan của sản phẩm:
- **Problem Statement** — người dùng phải tự tra từng thuốc, tự đọc tờ HDSD và tự đối chiếu nhiều cặp tương tác; quy trình chậm, dễ bỏ sót, khó đánh giá mức độ nghiêm trọng. Danh mục thuốc của bệnh viện **không có sẵn dữ liệu tương tác**, buộc phải trích xuất từ PDF HDSD và review trước khi dùng.
- **Target Audience** — (a) bệnh nhân / người chăm sóc: tra cứu nhanh từ danh sách thuốc, ảnh hoặc PDF; (b) bác sĩ / dược sĩ: review đoạn trích, nguồn và xác nhận kết quả. Trạng thái duyệt dùng đúng bộ từ của hệ thống: `pending` / `approved` / `rejected`, thiếu dữ liệu là `unavailable`.
- **Phạm vi tra cứu** — thuốc–thuốc, thuốc–thực phẩm và thuốc–bệnh nền do người dùng tự khai; agent không chẩn đoán và không suy luận bệnh nền.
- **Định vị sản phẩm** — một agent nằm trong hệ thống y tế của bệnh viện, nhấn mạnh tính "có nguồn" và "có human-in-the-loop".

### 2. PRD — Product Requirements Document
Tài liệu yêu cầu sản phẩm đầy đủ, gồm:
- **Objective** — AI Agent tra cứu tương tác thuốc–thuốc, thuốc–thực phẩm và thuốc–bệnh nền tự khai, dựa trên dữ liệu trích xuất từ tờ HDSD của danh mục BV GTVT; UI lấy cảm hứng từ mô hình *Drug Interaction Checker* (tag-based search), cải tiến bằng severity trực quan, giải thích có nguồn và cơ chế human-in-the-loop **không chặn trải nghiệm**.
- **Success Metrics** — hoàn thành tra cứu ≥ 90%, chuẩn hóa tên thuốc đúng ≥ 90%, cảnh báo được dược sĩ approve ≥ 80%, độ phủ dữ liệu trích xuất đo trên pilot 50 thuốc trước khi scale, tốc độ phản hồi p95 ≤ 5 giây (đường nhập tay) và ≤ 15 giây (đường ảnh/PDF), và 100% cảnh báo hiển thị ngay không cần chờ duyệt.
- **Assumptions** — nguồn dữ liệu chính là danh mục thuốc BV GTVT (`drug_list_bv_gtvt.csv`, ~1073 dòng, tiếng Việt); dữ liệu tương tác và severity **được vision model trích xuất từ PDF HDSD** rồi **bắt buộc con người review**; giữ nguyên văn text gốc ở bước lưu trữ.
- **Milestones** — M1 Foundation (cuối tuần 2) → M2 Core flow (cuối tuần 3) → M3 MVP hoàn chỉnh (cuối tuần 4) → M4 Polish (cuối tuần 6).
- **Requirements** — bảng user story phân theo mức HIGH / MEDIUM / LOW, mỗi dòng kèm **Acceptance Criteria** kiểm chứng được; chi tiết và cách đo nằm ở [`specs/acceptance-criteria.md`](../../specs/acceptance-criteria.md).
- **Out of Scope** — chẩn đoán/kê đơn, suy luận bệnh nền từ triệu chứng, AI tự đổi thuốc, mô hình full-gate chặn cảnh báo, memory dài hạn, clone UI/dữ liệu thật của bệnh viện tham khảo.

**Các quyết định thiết kế đáng chú ý:**
1. **Bỏ mô hình full-gate.** Mọi cảnh báo (kể cả severe/major) hiển thị ngay cho bệnh nhân, kèm nhãn *"chờ xác nhận chuyên môn"*; dược sĩ xử lý song song, không chặn luồng.
2. **Không bịa cảnh báo.** Mỗi cảnh báo phải gắn với đoạn trích nguyên văn từ PDF HDSD gốc.
3. **Pilot trước khi scale.** Trích xuất thử 50 thuốc để đo tỷ lệ dữ liệu hữu ích trước khi chạy toàn bộ 1073 thuốc.

### 3. Wireframe / UI Flow

#### 3.1. UI Flow — [Diagram FLow.jpg](Diagram%20FLow.jpg)
Sơ đồ luồng end-to-end, tách theo 2 role sau bước đăng nhập:

- **Bệnh nhân** — Trang chủ → chọn 1 trong 3 chức năng:
  - *Tra tương tác thuốc*: tải/chụp ảnh đơn thuốc → hệ thống nhận diện thuốc → xác nhận danh sách → tra cứu tương tác → có dữ liệu thì xem kết quả, không có thì báo "chưa có dữ liệu" và gửi yêu cầu kiểm tra.
  - *Tra thông tin thuốc*: tìm kiếm thuốc → xem thông tin thuốc.
  - *Tra thuốc với bệnh nền*: chọn thuốc và bệnh nền → xem kết quả và lưu ý.
- **Bác sĩ / dược sĩ** — nhận *danh sách yêu cầu cần kiểm tra* (từ luồng "gửi đối chiếu" và "gửi kiểm tra") → chọn yêu cầu → xem kết quả và nguồn tham khảo → nếu kết quả phù hợp thì duyệt, chưa phù hợp thì chỉnh sửa nội dung rồi duyệt.

#### 3.2. Wireframe — Figma board
🔗 **https://www.figma.com/board/NeIgXUC2eFtikTWvejnvwd/Cuv%C3%A9e-Tech?node-id=930-197**

Board chứa wireframe các màn hình chính: nhập thuốc kiểu tag-based search, màn hình kết quả tương tác với badge severity, tab thuốc–thuốc / thuốc–thực phẩm, và màn hình hàng đợi xác nhận của dược sĩ.

### 4. GitHub Repo + Setup AI Log
🔗 **Repo:** https://github.com/AI20K-Build-Phase-Cohort-3/P-054

Repo đã khởi tạo từ AI20K Agent Template và **đã hoàn tất setup AI logging** cho cả team:

- ✅ Cài `pre-push` hook qua `bash scripts/setup_hooks.sh` — logs tự động submit lên grading server mỗi lần `git push`
- ✅ Hooks auto-log đã bật cho Claude Code (`.claude/`), Cursor (`.cursor/`), Codex (`.codex/`), Gemini CLI (`.gemini/`), GitHub Copilot (`.github/hooks/`) và Antigravity (`.agents/`)
- ✅ Prompts và tool calls ghi vào [`.ai-log/session.jsonl`](../../.ai-log/)
- ✅ Mỗi thành viên đã cấu hình `git config user.email` đúng email đăng ký với BTC và `AI_LOG_API_KEY` riêng trong `.env`
- 📄 Hướng dẫn setup cho từng thành viên: [AI_LOGGING_SETUP.md](../../AI_LOGGING_SETUP.md)

---

## ➕ Bổ sung — MVP Explainer Video
🔗 **https://drive.google.com/file/d/1kRtfjdhkEWkg1vp5mOqWZ-PBlm9As8U7/view**

Video giải thích MVP: bối cảnh bài toán, luồng sử dụng chính và giá trị mang lại cho từng nhóm người dùng.

> 📁 Video được lưu trên Google Drive thay vì đính kèm trong repo do dung lượng lớn (~91 MB).

---

## 🔗 Tài liệu tham khảo

- Tương tác thuốc: https://tuongtacthuoc.vn/
- DrugBank: https://go.drugbank.com/
