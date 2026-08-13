---
description: "Ghi log sử dụng AI hoàn toàn tự động — không gọi thủ công script log_*"
activation: always-on
---

# Ghi log sử dụng AI — tự động

Logging prompt vào `.ai-log/session.jsonl` đã được **tự động hoá hoàn toàn**. Bạn (AI agent) **KHÔNG** cần — và **KHÔNG** nên — chạy bất kỳ lệnh logging nào sau mỗi task.

## Cơ chế

Trong phiên làm việc:
1. Codex chạy project hook `UserPromptSubmit` trong `.codex/hooks.json`; hook phải được user review và trust qua `/hooks` sau mỗi lần definition thay đổi.
2. Antigravity 2.0 chạy lifecycle hook trong `.agents/hooks.json`, đọc prompt nguyên văn từ `transcriptPath` tại `PreInvocation` và retry tại `Stop`.

Khi thành viên `git push`:
1. Pre-push hook chạy `scripts/log_codex.py --auto` và `scripts/log_antigravity.py --auto` để recovery prompt trong 24 giờ gần nhất chưa được realtime hook ghi nhận. Cả hai scanner deduplicate với pending log và archive bằng `entry_id`.
2. Pre-push hook chạy `scripts/submit_log.py`, gửi `.ai-log/session.jsonl` lên grading server. Batch submit thành công được append vào `.ai-log/archive/YYYY-MM-DD.jsonl`.

Prompt user được ghi **nguyên văn từ transcript local**, không cần AI tự tóm tắt. Database protobuf của Antigravity IDE legacy không phải interface được hỗ trợ; scanner không lấy `task.md` hoặc `walkthrough.md` thay cho prompt thật.

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
