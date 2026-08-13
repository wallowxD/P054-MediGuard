# Thiết lập ghi log sử dụng AI

Repository tự động ghi nhận việc sử dụng AI bằng tool hook và pre-push hook. Mỗi thành viên
chỉ thiết lập từ repository root để log được gắn đúng danh tính.

## Thiết lập một lần

### 1. Mở đúng workspace

Mở thư mục `P-054/`. Không mở riêng `backend/` hoặc `frontend/` vì hook dùng đường dẫn tương
đối từ root và có thể không chạy mà không báo lỗi.

### 2. Cấu hình email đã đăng ký

```bash
git config user.name "Tên của bạn"
git config user.email "email-da-dang-ky@example.com"
git config user.email
```

Lệnh cuối phải in đúng email đã đăng ký với chương trình; hệ thống dùng giá trị này để quy
thuộc đóng góp.

### 3. Cài thư viện phụ thuộc

```bash
make install
```

uv workspace tạo `.venv/` tại repository root. Không tạo `backend/.venv/` riêng.

### 4. Cấu hình biến môi trường cá nhân

```bash
cp .env.example .env
```

Điền `OPENAI_API_KEY` khi cần và `AI_LOG_API_KEY` từ invitation cá nhân. Không dùng key của
người khác, không chia sẻ `.env` và không commit file này.

### 5. Cài Git hook

```bash
bash scripts/setup_hooks.sh
```

Chạy một lần sau khi clone vì `.git/hooks/` không được version control.

## Vận hành bình thường

Hook của các AI tool được hỗ trợ tự ghi log. Khi `git push`, pre-push hook gửi log còn chờ
trước khi cho phép push tiếp tục.

- Codex ghi prompt theo `UserPromptSubmit` trong `.codex/hooks.json`. Lần đầu mở repository hoặc
  sau khi hook thay đổi, chạy `/hooks`, review và trust đúng hook của project. Pre-push còn quét
  rollout JSONL trong 24 giờ gần nhất để recovery nếu hook chưa được trust hoặc tạm thời lỗi.
- Antigravity 2.0 đọc `.agents/hooks.json` và ghi prompt từ `transcriptPath` tại `PreInvocation`;
  `Stop` retry nếu transcript chưa flush ở lần đầu. Pre-push quét lại transcript trong 24 giờ gần
  nhất và deduplicate theo `entry_id`.
- Prompt mới nằm ở `.ai-log/session.jsonl`. Chỉ sau khi submit thành công, batch mới được append
  vào `.ai-log/archive/YYYY-MM-DD.jsonl`.

Không chạy thủ công `scripts/log_hook.py`, `scripts/log_antigravity.py` hoặc
`scripts/submit_log.py`; không sửa/xóa `.ai-log/`, không đổi file trong `scripts/` và không
dùng `git push --no-verify`.

Với web AI không có hook, làm theo [quy trình ghi log thủ công](.agents/workflows/log.md).

## Kiểm tra thiết lập

- Workspace root là `P-054/`.
- `git config user.email` là email đã đăng ký.
- `.venv/` và `.env` nằm tại root.
- `.env` chứa `AI_LOG_API_KEY` cá nhân.
- `.git/hooks/pre-push` tồn tại.
- Codex `/hooks` hiển thị hook project ở trạng thái trusted.
- Antigravity 2.0 đã reload workspace sau khi pull `.agents/hooks.json`.

Bằng chứng bình thường là một lần `git push` không bypass hook. Nếu pre-push lỗi, lưu đầy
đủ output và báo leader; tuyệt đối không bỏ qua hook.

## Sự cố thường gặp

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Log không gắn cho thành viên | Sai Git email | Sửa `git config user.email` trước khi làm tiếp |
| Không thấy hook local chạy | Mở workspace dưới repository root | Mở lại `P-054/` và cài lại hook |
| Hook không nạp được môi trường | Thiếu `.venv/` hoặc `.env` ở root | Chạy `make install` và cấu hình `.env` |
| Pre-push không gửi được log | Sai key, lỗi mạng hoặc lỗi hook | Giữ nguyên lỗi và báo leader; không bypass |
| Codex không tạo `session.jsonl` | Hook project chưa được trust hoặc đang dùng session mở trước khi hook thay đổi | Chạy `/hooks`, trust hook rồi mở session mới tại root |
| Antigravity không tạo `session.jsonl` | Workspace chưa reload hoặc đang dùng Antigravity IDE legacy với transcript rỗng | Reload bằng Antigravity 2.0; pre-push chỉ recovery được transcript JSONL có dữ liệu |

Logging là hạ tầng của chương trình. Thành viên chỉ cấu hình và sử dụng, không chỉnh sửa.
