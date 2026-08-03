# ADR 0003 — Cấu trúc workspace hai ngôn ngữ

- **Trạng thái:** Bị thay thế một phần bởi ADR 0010 và 0014
- **Ngày:** 2026-08-02

## Bối cảnh

Backend Python và frontend Node có toolchain, dependency và build lifecycle khác nhau.
Repository đồng thời phải chứa product context, architecture decisions và deliverable.

## Quyết định

Giữ `backend/` và `frontend/` tách biệt thay vì gom vào một `src/`. Product requirements
nằm trong `specs/`, quyết định trong `adrs/`, hướng dẫn trong `docs/`, delivery state trong
Jira. Không đặt Markdown trong source directory.

`planning/` chỉ chứa README trỏ tới Jira. Root chứa `.env`, `.venv`, lockfile và Makefile.

## Hệ quả

- ✅ Boundary giữa hai toolchain rõ ràng.
- ✅ AI và thành viên đọc cùng một product context ngoài source code.
- ✅ Không tạo backlog/sprint thứ hai trong Git.
- ❌ Member phải luôn mở repository root và dùng lệnh root.
