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
3. Từ dữ liệu Git bên trên, soạn bảng `Thành viên | Jira ticket | Outcome | Evidence | Thời gian`:
   - **Thành viên** — lấy từ tên tác giả commit, map về tên thật trong team
     (Quang / Hùng / Đức / Minh). Không chắc thì để nguyên tên git và đánh dấu `?`.
   - **Jira ticket** — lấy ticket key từ branch/commit/PR; không xác định được thì ghi `—`.
   - **Outcome** — gộp các commit liên quan thành một kết quả có nghĩa, mô tả bằng
     tiếng Việt. **Đừng chép nguyên commit message.** Một người có nhiều mảng việc
     thì tách nhiều dòng.
   - **Evidence** — file/module cụ thể, commit hoặc link PR nếu có.
   - **Thời gian** — để `—` nếu không có dữ liệu; không bịa số giờ.
4. Viết **Tổng kết ngày** 1–2 câu về tiến độ chung.
5. Chèn vào `WORKLOG.md` đúng chỗ, giữ thứ tự **ngày mới nhất ở trên**.

## Ràng buộc

- Chỉ ghi việc **truy được từ git**. Không có commit nào trong ngày → nói thẳng là
  không có, hỏi user có muốn nhập tay không. **Tuyệt đối không bịa hoạt động.**
- Dùng tên team **Cuvée Tech**.
- Không đụng file nào khác ngoài `WORKLOG.md`.
