# Sổ tay vận hành

Tài liệu này quy định lệnh cần chạy, thứ tự chạy và cách xử lý sự cố. Lý do kiến trúc nằm
trong [`adrs/`](../adrs/).

## Vận hành local hằng ngày

### Chạy frontend và backend

```bash
make dev        # backend :8000 + frontend :3000; một Ctrl-C dừng cả hai
```

Hoặc chạy ở hai terminal:

```bash
make run        # chỉ backend
make web        # chỉ frontend
```

### Chạy toàn bộ hệ thống bằng container

```bash
make up
docker compose ps        # db, backend, frontend phải healthy
make down
```

Root `.env` phải có `NEXTAUTH_SECRET`; Compose chủ động fail nếu thiếu.

### Kiểm tra tình trạng dịch vụ

| Lệnh | Kết quả mong đợi |
|---|---|
| `curl localhost:8000/health` | `{"status":"ok","env":"development"}` |
| `curl localhost:8000/api/v1/status` | `{"status":"ready",...}` |
| `curl -o /dev/null -w '%{http_code}' localhost:3000` | `200` khi chưa đăng nhập |
| `curl -o /dev/null -w '%{http_code}' localhost:3000/dashboard` | `307` tới sign-in |

Nếu `/` trả 307 khi chưa đăng nhập, xem sự cố 1.

### Trước khi push

```bash
make check
make web-lint
make web-build
docker compose config --quiet
shasum -a 256 -c .github/gate-1.sha256
```

Với feature có workspace riêng, chạy thêm `quickstart.md` và hoàn thành checklist tương ứng.

### Chạy ingestion pilot

```bash
make ingest-pilot
```

Đo extraction coverage trên pilot 50 thuốc trước khi xử lý toàn bộ catalog. Không scale một
pipeline có coverage thấp hoặc citation không truy vết được.

## Xử lý sự cố

### 1. Mọi route redirect tới `/signin?error=Configuration`

**Hiện tượng:** landing page public cũng trả 307 dù container vẫn healthy.

```bash
docker compose logs frontend | grep NO_SECRET
```

**Nguyên nhân:** `NEXTAUTH_SECRET` không vào frontend container nên next-auth từ chối chạy.

**Xử lý:** thêm `NEXTAUTH_SECRET` vào root `.env` bằng `openssl rand -base64 32`, rồi chạy
`make down` và `make up`.

### 2. `sh: next: command not found` hoặc Turbopack không thấy workspace root

**Nguyên nhân:** thiếu `frontend/node_modules`; thông báo Turbopack có thể gây hiểu nhầm.

**Xử lý:** chạy `make web-install`. Không dùng `npx next dev` vì npx có thể tải bản Next
khác vào cache tạm.

### 3. Backend container báo `ModuleNotFoundError: No module named 'medsafe'`

uv mặc định cài workspace member ở editable mode, chỉ tạo `.pth` trỏ tới source tree. Image
runtime không có source đó sẽ lỗi. Docker build hiện dùng `--no-editable`; nếu lỗi tái diễn,
kiểm tra flag này trong `backend/Dockerfile`.

### 4. Port vẫn bận sau `Ctrl-C`

Trước tiên xác định process còn giữ port:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:8000 -sTCP:LISTEN
```

Chỉ dừng đúng process development đã xác nhận. Không dùng pattern rộng trên máy dùng chung.

### 5. `sitemap.xml`, `robots.txt` hoặc static file redirect tới sign-in

Proxy matcher đã bị thay đổi. Khôi phục rule loại mọi path có extension trong
`frontend/src/proxy.ts`. Đổi lại, application route không được chứa dấu chấm.

### 6. Pre-push hook lỗi

Không dùng `git push --no-verify`. Lưu output và báo leader; xem
[AI_LOGGING_SETUP.md](../AI_LOGGING_SETUP.md).

### 7. AI log của thành viên bằng 0

Nguyên nhân thường gặp là mở IDE tại `backend/` hoặc `frontend/` thay vì repository root.
Mở lại `P-054/`, xác minh email/key và cài lại hook nếu cần. Prompt chưa từng được hook ghi
thì không thể khôi phục ngược thời gian.

## CI và merge pull request

PR phải pass các check về GATE checksum, repository integrity, backend, frontend và Docker
Compose. Trên GitHub, cấu hình branch protection cho `main` yêu cầu các check này và ít
nhất một reviewer; không cho merge khi branch chưa cập nhật hoặc conversation chưa resolve.

Không sửa workflow chỉ để làm check xanh. Nếu check phản ánh requirement sai, cập nhật
spec/ADR và workflow trong cùng PR với review rõ ràng.

## Triển khai production chưa được thiết lập

Team dự kiến dùng một VPS nhưng chưa chọn/mua hạ tầng. Vì vậy hiện chưa có live URL,
production secret store, migration, backup, rollback, TLS/reverse proxy, monitoring hoặc
deployment pipeline được chấp nhận.

Trước khi deploy lần đầu, Jira deployment ticket và feature/ADR tương ứng phải chốt tối
thiểu:

1. VPS/provider, region, resource sizing và quyền SSH.
2. Domain, DNS, TLS termination và reverse proxy.
3. Container registry, image tagging, deploy environment và approval rule.
4. Secret management; không copy `.env` vào image hoặc repository.
5. Database migration, backup/restore test và rollback procedure.
6. Health/readiness check, log/metric/alert và retention không lộ dữ liệu nhạy cảm.
7. CI/CD trigger, production approval, concurrency lock và post-deploy smoke test.
8. Incident owner, recovery objective và cách tắt feature an toàn.

Khi các quyết định được duyệt, cập nhật runbook này trong cùng PR. Không viết quy trình giả
định cho hạ tầng chưa tồn tại.
