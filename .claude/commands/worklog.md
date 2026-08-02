---
description: Soạn entry hàng ngày cho WORKLOG.md từ git log và thay đổi thực tế
argument-hint: [ngày YYYY-MM-DD, mặc định hôm nay]
allowed-tools: Bash(git log:*), Bash(git diff:*), Bash(git shortlog:*), Bash(date:*), Read, Edit
---

Soạn entry worklog cho `WORKLOG.md`. `WORKLOG.md` là **deliverable #9 được BTC chấm
điểm**, yêu cầu cập nhật hàng ngày.

Ngày cần ghi: $1 (rỗng thì lấy hôm nay).

## Dữ liệu thực tế

Commit trong ngày:
!`git log --since="${1:-today} 00:00" --until="${1:-today} 23:59" --format='%h | %an | %s' --no-merges`

Thống kê theo người:
!`git shortlog --since="${1:-today} 00:00" --until="${1:-today} 23:59" -sn --no-merges`

File bị đụng:
!`git log --since="${1:-today} 00:00" --until="${1:-today} 23:59" --name-only --format= --no-merges | sort -u | head -40`

## Việc cần làm

1. Đọc `WORKLOG.md` để nắm đúng định dạng bảng đang dùng.
2. Nếu ngày này đã có block rồi → **bổ sung vào block đó**, đừng tạo trùng.
3. Từ dữ liệu git bên trên, soạn bảng `Member | Task | Status | Output | Time`:
   - **Member** — lấy từ tên tác giả commit, map về tên thật trong team
     (Quang / Hùng / Đức / Minh). Không chắc thì để nguyên tên git và đánh dấu `?`.
   - **Task** — gộp các commit liên quan thành một dòng việc có nghĩa, mô tả bằng
     tiếng Việt. **Đừng chép nguyên commit message.** Một người có nhiều mảng việc
     thì tách nhiều dòng.
   - **Status** — ✅ Done / 🔄 WIP / ❌ Blocked. Suy từ nội dung commit; không suy được
     thì để ✅ Done và ghi chú.
   - **Output** — file/module cụ thể, hoặc link PR nếu có.
   - **Time** — **để trống dấu `-`**. Không bịa số giờ.
4. Viết **Tổng kết ngày** 1–2 câu về tiến độ chung.
5. Chèn vào `WORKLOG.md` đúng chỗ, giữ thứ tự **ngày mới nhất ở trên**.

## Ràng buộc

- Chỉ ghi việc **truy được từ git**. Không có commit nào trong ngày → nói thẳng là
  không có, hỏi user có muốn nhập tay không. **Tuyệt đối không bịa hoạt động.**
- Nếu `WORKLOG.md` còn placeholder `[Tên Team]` → thay bằng **Cuvée Tech**.
- Không đụng file nào khác ngoài `WORKLOG.md`.
