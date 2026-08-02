---
description: Soát trạng thái 10 deliverable + 5 trục chấm điểm trước khi nộp gate
argument-hint: [số gate, ví dụ 2]
allowed-tools: Bash(git log:*), Bash(git status:*), Bash(ls:*), Bash(find:*), Bash(grep:*), Read, Glob, Grep
---

Soát mức sẵn sàng nộp **GATE $1** của repo P-054 (team Cuvée Tech).

## Nguồn chuẩn

Đọc `docs/guide/deliverables/checklist.md` trước — đó là rubric gốc của BTC.
Tham chiếu cách trình bày của gate trước: `gate/gate_1/README.md`.

## Soát 10 deliverable

Với mỗi mục, kết luận **CÓ / THIẾU / CÒN PLACEHOLDER**:

1. Source code — `backend/` (hoặc `src/` nếu chưa di trú), có chạy được không
2. `README.md` — đủ Problem → Solution → Tech Stack → Setup → Team
3. `docs/architecture_diagram.md` — diagram có khớp code thật không
4. AI logs — `.ai-log/` có dữ liệu, hook đã cài
5. Live URL — có deploy chưa
6. Video demo
7. `presentation/` — pitch deck
8. `JOURNAL.md` — cập nhật tới tuần hiện tại chưa
9. `WORKLOG.md` — cập nhật tới hôm qua chưa
10. `eval/results/report.md` — có số đo thật chưa

**Quy tắc quan trọng:** file còn nguyên placeholder template (`[mô tả]`,
`[Tên Team]`, `[choice]`, `[YYYY-MM-DD]`) tính là **CHƯA LÀM**, dù file có tồn tại.
Grep các dấu hiệu đó thay vì chỉ kiểm tra file có tồn tại.

## Soát nhanh 5 trục chấm

Product · System Design · UX/UI · DevOps · Code Quality — mỗi trục 1 câu: đang ở đâu,
thiếu gì để đạt ngưỡng tối thiểu (8/7/7/6/7).

## Soát vệ sinh repo

- `.env` có bị commit nhầm không (`git log --all --full-history -- .env`)
- Còn sót code template không (`example_node`, `example_tool`, `README_boilerplate.md`)
- `gate/gate_1/` còn nguyên 4 file không — **phải luôn nguyên vẹn**
- CI lần chạy gần nhất xanh hay đỏ

## Báo cáo

1. Bảng 10 deliverable: `# | Deliverable | Trạng thái | Thiếu gì`
2. Bảng 5 trục: `Trục | Ước lượng | Nút thắt`
3. **Danh sách việc phải làm trước khi nộp**, xếp theo *chặn nộp* → *mất điểm* →
   *nên có*. Mỗi việc kèm ước lượng thời gian.

Chỉ báo cáo, **không sửa file nào**.
