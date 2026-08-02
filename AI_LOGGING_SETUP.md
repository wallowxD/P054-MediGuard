# 📊 AI Logging Setup - Hướng dẫn cho Team Members

Hướng dẫn chi tiết để cấu hình AI logging tracking cho dự án AI20K.

> ⚠️ **QUAN TRỌNG:** Các logs được ghi danh theo `git config user.email`. Nếu email sai, logs sẽ tính sang người khác!

---

## 🚀 Quick Setup (6 bước)

### 1️⃣ Pull code mới nhất

```bash
git checkout dev
git pull origin dev
```

---

### 2️⃣ ⚠️ Cấu hình Git Email (QUAN TRỌNG NHẤT)

**Logs được ghi danh theo email này. Sai email → log bị tính sang người khác!**

```bash
git config user.email "email-cua-ban@gmail.com"
git config user.name "Tên của bạn"
```

**Kiểm tra lại:**
```bash
git config user.email   # Phải đúng email bạn đăng ký với BTC
```

---

### 3️⃣ Tạo Virtual Environment với uv

**(Bắt buộc — nếu thiếu venv thì hook không đọc được .env)**

```bash
# Tạo venv
uv venv

# Kích hoạt venv
source .venv/bin/activate

# Cài dependencies
uv pip install -r requirements.txt
```

---

### 4️⃣ Tạo .env file với key riêng của bạn

```bash
# Copy template
cp .env.example .env
```

**Mở `.env` và cập nhật:**

```env
# ---- LLM Configuration ----
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# ---- AI Hook Logging ----
AI_LOG_API_KEY=ai20k_YOUR_PERSONAL_KEY_HERE
# ⚠️ Lấy từ link mời của BTC — KHÔNG dùng key của người khác!

# Những config khác giữ nguyên
AI_LOG_SERVER=https://ai-logs.note.transformerlabs.ai/api/ingest
```

**⚠️ CẢNH BÁO:**
- ❌ Đừng commit `.env` vào git (chứa API keys)
- ❌ Đừng share `.env` với người khác
- ❌ Đừng dùng key của bạn bạn

---

### 5️⃣ Cài Git Pre-Push Hook

**(Hook không được clone theo repo — phải chạy thủ công)**

```bash
bash scripts/setup_hooks.sh
```

**Khi chạy thành công:**
```
✓ Pre-push hook installed
✓ Logs sẽ tự động submit khi git push
```

---

### 6️⃣ Test ngay (không cần push)

```bash
bash scripts/_pyrun.sh scripts/submit_log.py
```

**Nếu thấy output:**
```
[ai-log] Submitted 25 entries → 202
```

✅ **OK!** Logs được submit thành công.

Từ giờ:
- ✓ Mỗi lần dùng Claude Code → logs được ghi
- ✓ Mỗi lần `git push` → logs tự động gửi lên server
- ✓ Dashboard sẽ update

---

## 📝 Cách hoạt động

```
┌─────────────────────────────────────────────────────────────┐
│  Bạn dùng Claude Code (prompt, tool)                       │
│                    ↓                                         │
│  Hook: log_hook.py                                         │
│  → Ghi vào .ai-log/session.jsonl                           │
│                    ↓                                         │
│  Khi bạn: git push                                         │
│  Hook: submit_log.py                                       │
│  → Gửi logs lên ai-logs.note.transformerlabs.ai/api/ingest │
│  → Xác thực với AI_LOG_API_KEY                            │
│                    ↓                                         │
│  Dashboard của BTC cập nhật logs của bạn                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Kiểm tra & Troubleshooting

### Logs đang được ghi không?

```bash
# Xem số entries
wc -l .ai-log/session.jsonl

# Xem entry mới nhất
tail -1 .ai-log/session.jsonl | python3 -m json.tool
```

### Hook có được cài không?

```bash
cat .git/hooks/pre-push
```

Nếu file không tồn tại → chạy lại: `bash scripts/setup_hooks.sh`

### Test submit logs:

```bash
source .venv/bin/activate
bash scripts/_pyrun.sh scripts/submit_log.py
```

**Status codes:**
- `202` → ✅ Success
- `401` → ❌ API key sai
- `422` → ❌ Format logs sai
- `Timeout` → ⚠️ Server chậm (logs sẽ gửi lại khi push)

### Kiểm tra git config:

```bash
git config user.email
git config user.name
```

---

## ⚡ Tips & Best Practices

| Tip | Mô tả |
|-----|-------|
| **Mỗi member cần key riêng** | Không share AI_LOG_API_KEY |
| **Email phải đúng** | Sai email → logs bị tính sai người |
| **Commit .env.example** | Có, nhưng không commit `.env` |
| **Hook tự động chạy** | Mỗi `git push` tự động submit logs |
| **Logs lưu local + remote** | `.ai-log/` lưu local, submit lên server |

---

## 📞 Vấn đề thường gặp

**Q: "No AI logs yet" vẫn hiện dù đã set up**
- A: Logs được ghi local ✓, nhưng chưa submit lên server. Chạy `git push` hoặc test bằng `bash scripts/_pyrun.sh scripts/submit_log.py`

**Q: Sao logs không ghi được?**
- A: Kiểm tra `.venv/` có tồn tại không. Nếu không → chạy `uv venv && uv pip install -r requirements.txt`

**Q: Đổi email sau này có được không?**
- A: Được, nhưng logs cũ vẫn ghi danh với email cũ. Nên set đúng email từ lần đầu.

**Q: Xóa .ai-log/ được không?**
- A: Không nên. Chứa lịch sử logs. Nếu xóa → logs bị mất.

---

## 📋 Checklist trước khi bắt đầu dev

- [ ] `git config user.email` = email đúng
- [ ] `.venv/` tồn tại (`uv venv` đã chạy)
- [ ] `requirements.txt` đã cài (`uv pip install -r requirements.txt`)
- [ ] `.env` file tồn tại
- [ ] `AI_LOG_API_KEY` trong `.env` là key riêng của bạn
- [ ] Git hook cài sẵn (`bash scripts/setup_hooks.sh`)
- [ ] Test submit OK (`bash scripts/_pyrun.sh scripts/submit_log.py` → 202)

---

**🎯 Khi tất cả xong → bạn sẵn sàng dev! Logs sẽ tự động tracking.**

Câu hỏi? Liên hệ BTC hoặc team lead.
