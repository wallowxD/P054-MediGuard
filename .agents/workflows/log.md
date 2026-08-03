---
description: "Ghi log AI thủ công — CHỈ dùng cho web tool (ChatGPT, Gemini Web, Claude.ai, v.v.). KHÔNG dùng cho Antigravity."
---

# Ghi log AI thủ công (chỉ dành cho web tool)

Antigravity IDE, Claude Code, Cursor, Codex, Copilot, Gemini CLI đã **tự động log** qua hook hoặc qua `log_antigravity.py` chạy trong pre-push. **Không cần** chạy lệnh dưới đây cho các tool đó.

Workflow này chỉ dành cho khi bạn dùng **tool web không có hook** — ví dụ ChatGPT, Gemini Web, Claude.ai, Perplexity, v.v.

## Cách chạy

**Linux / macOS / Git Bash:**
```bash
# Chế độ tương tác: script hỏi tool và prompt
bash scripts/_pyrun.sh scripts/log_manual.py

# Chế độ một dòng
bash scripts/_pyrun.sh scripts/log_manual.py --tool "<tên tool>" --prompt "<mô tả việc đã làm>"
```

**Windows (cmd.exe / PowerShell):**
```cmd
scripts\_pyrun.cmd scripts\log_manual.py
scripts\_pyrun.cmd scripts\log_manual.py --tool "<tên tool>" --prompt "<mô tả việc đã làm>"
```

## Ví dụ

```bash
bash scripts/_pyrun.sh scripts/log_manual.py --tool chatgpt --prompt "Đề xuất bố cục UI cho trang xác minh"
bash scripts/_pyrun.sh scripts/log_manual.py --tool gemini-web --prompt "Nghiên cứu thuật toán chấm điểm rủi ro"
bash scripts/_pyrun.sh scripts/log_manual.py --tool claude-web --prompt "Giải thích luồng OAuth2 PKCE"
```

Entry được thêm vào `.ai-log/session.jsonl` và gửi cùng log tự động khác ở lần `git push` kế tiếp.
