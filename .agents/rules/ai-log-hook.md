---
description: "Ghi log sử dụng AI hoàn toàn tự động — không gọi thủ công script log_*"
activation: always-on
---

# Ghi log sử dụng AI — tự động

Logging prompt vào `.ai-log/session.jsonl` đã được **tự động hoá hoàn toàn**. Bạn (AI agent) **KHÔNG** cần — và **KHÔNG** nên — chạy bất kỳ lệnh logging nào sau mỗi task.

## Cơ chế

Khi thành viên `git push`:
1. Pre-push hook chạy `scripts/log_antigravity.py --auto`, đọc trực tiếp transcript của các conversation Antigravity từ `~/.gemini/antigravity-ide/brain/<conv>/.system_generated/logs/transcript.jsonl` và quét mọi prompt (`USER_INPUT` + `USER_EXPLICIT`) thuộc repository hiện tại trong 24 giờ gần nhất.
2. Pre-push hook chạy `scripts/submit_log.py`, gửi `.ai-log/session.jsonl` lên grading server.

Toàn bộ prompt user đã gõ trong Antigravity IDE được ghi **nguyên văn từ disk**, không cần AI tự tóm tắt.

## Không làm những việc sau

- ❌ **KHÔNG** gọi `scripts/log_antigravity.py "<summary>" "<model>"` sau mỗi task. Lệnh này đã ngừng dùng; nếu gọi sẽ tạo log entry dạng "TaskComplete" không phải prompt thật của user.
- ❌ **KHÔNG** chạy `scripts/log_manual.py` cho Antigravity — chỉ dùng nó cho ChatGPT / web tool (xem `.agents/workflows/log.md`).
- ❌ **KHÔNG** sửa hoặc xoá file trong `.ai-log/` — chúng được pre-push hook và submit script quản lý.

## Khi nào cần can thiệp

- Nếu pre-push hook báo lỗi → báo lại cho user, không bypass bằng `--no-verify`.
- Nếu thành viên dùng tool không có auto-hook (ChatGPT, Gemini Web, v.v.) → xem `.agents/workflows/log.md` để ghi thủ công.

## Cài đặt một lần sau khi clone repo

```bash
# Linux / macOS / Git Bash
bash scripts/setup_hooks.sh

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts\setup_hooks.ps1
```
