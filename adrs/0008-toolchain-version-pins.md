# ADR 0008 — Ghim phiên bản frontend toolchain

- **Trạng thái:** Được chấp nhận
- **Ngày:** 2026-08-02

## Quyết định

- Ghim Yarn trong `packageManager`; dùng Corepack, không cài Yarn global.
- Commit `yarn.lock` và dùng `yarn install --immutable` trong CI.
- Giữ Node version đồng nhất giữa local, CI và Docker.
- Giữ Next.js/React/Tailwind theo major version đã duyệt; upgrade trong PR riêng.

## Hệ quả

- ✅ Local và CI giải dependency giống nhau.
- ✅ Tránh Yarn 1/package-lock xung đột với Yarn 4.
- ❌ Upgrade toolchain cần review lockfile và build riêng.
