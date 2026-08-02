---
description: Soạn entry hàng tuần cho JOURNAL.md từ git log, WORKLOG và tiến độ milestone
argument-hint: [số tuần, ví dụ 3]
allowed-tools: Bash(git log:*), Bash(git shortlog:*), Bash(date:*), Read, Edit
---

Soạn entry tuần cho `JOURNAL.md`. Đây là **deliverable #8 được BTC chấm điểm**,
nhịp hàng tuần.

Tuần cần ghi: $1 (rỗng thì suy từ block cuối cùng đang có trong `JOURNAL.md`).

## Dữ liệu thực tế

Commit 7 ngày qua:
!`git log --since="7 days ago" --format='%h | %ad | %an | %s' --date=short --no-merges`

Đóng góp theo người:
!`git shortlog --since="7 days ago" -sn --no-merges`

## Việc cần làm

1. Đọc `JOURNAL.md` — nắm định dạng và xem tuần trước đặt mục tiêu gì.
2. Đọc `WORKLOG.md` phần 7 ngày qua — đây là nguồn chi tiết hơn git log.
3. Soạn block theo đúng cấu trúc sẵn có:
   - **Mục tiêu tuần này** — lấy từ mục *Kế hoạch tuần sau* của block tuần trước.
     Tick `[x]` cái đã xong, để trống cái chưa.
   - **Đã hoàn thành** — thành quả thật, có bằng chứng trong git/WORKLOG.
   - **Khó khăn & Giải pháp** — bảng. Chỉ điền khi **thật sự** truy được dấu vết
     (commit revert, fix lặp lại, refactor lớn, PR sửa nhiều lần). Không suy diễn.
   - **Bài học** — rút ra từ quyết định kỹ thuật thật trong tuần. Tránh câu sáo rỗng
     kiểu "teamwork rất quan trọng".
   - **Kế hoạch tuần sau** — đối chiếu với milestone trong PRD:
     M1 Foundation (hết tuần 2) → M2 Core flow (hết tuần 3) → M3 MVP (hết tuần 4)
     → M4 Polish (hết tuần 6).
4. Chèn vào `JOURNAL.md`, giữ thứ tự Week tăng dần.

## Ràng buộc

- Không bịa khó khăn hay bài học cho đủ mục. Không có thì để trống và **nói cho user
  biết mục nào cần họ tự điền** — người chấm nhìn ra ngay văn AI viết cho đủ chỗ.
- Placeholder `[Tên Team]` → **Cuvée Tech**.
- Chỉ sửa `JOURNAL.md`.
