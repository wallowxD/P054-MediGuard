"""Sync Markdown reports from JSON files for Hung, Duc, and Minh.

Usage:
    python scripts/sync_review_reports.py
"""

import json
from pathlib import Path

ASSIGNEES = [
    {"key": "hung", "name": "Nguyễn Thanh Hùng", "title": "HÙNG"},
    {"key": "duc", "name": "Đỗ Quý Đức", "title": "ĐỨC"},
    {"key": "minh", "name": "Lê Nhật Minh", "title": "MINH"},
]


def update_md_report(name_title: str, assignee_name: str, items: list[dict], out_path: Path):
    total = len(items)
    pending = sum(1 for x in items if x.get("status") == "PENDING")
    verified = sum(1 for x in items if x.get("status") == "VERIFIED")
    fixed = sum(1 for x in items if x.get("status") == "FIXED")
    rejected = sum(1 for x in items if x.get("status") == "REJECTED")
    done = total - pending

    pct = (done / total * 100) if total > 0 else 0

    md_lines = [
        f"# BÁO CÁO PHÂN CÔNG KIỂM DUYỆT Y DƯỢC — {name_title.upper()}",
        "",
        f"**Người phụ trách:** `{assignee_name}`",
        f"**Tiến độ:** `{done}/{total}` (`{pct:.1f}%`) | ✅ VERIFIED: `{verified}` | 🛠️ FIXED: `{fixed}` | ❌ REJECTED: `{rejected}` | ⏳ PENDING: `{pending}`",
        "",
        "| STT | File Markdown | Dòng | Loại cờ | Lý do Gemini ghi nhận | Trạng thái | Ghi chú người duyệt |",
        "|---|---|---|---|---|---|---|",
    ]

    for idx, item in enumerate(items, 1):
        flag_badge = f"`{item['type']}`"
        status_str = item.get("status", "PENDING")
        if status_str == "VERIFIED":
            status_badge = "✅ VERIFIED"
        elif status_str == "FIXED":
            status_badge = "🛠️ FIXED"
        elif status_str == "REJECTED":
            status_badge = "❌ REJECTED"
        else:
            status_badge = "⏳ PENDING"

        note = item.get("note", "")
        md_lines.append(
            f"| {idx} | `{item['filename']}` | {item['line']} | {flag_badge} | {item['reason']} | {status_badge} | {note} |"
        )

    out_path.write_text("\n".join(md_lines), encoding="utf-8")
    print(f"Updated report for {out_path.name}: {done}/{total} done ({pct:.1f}%)")


def main():
    for a in ASSIGNEES:
        json_path = Path(f"review_items_{a['key']}.json")
        md_path = Path(f"review_report_{a['key']}.md")

        if json_path.exists():
            items = json.loads(json_path.read_text(encoding="utf-8"))
            update_md_report(a["title"], a["name"], items, md_path)

if __name__ == "__main__":
    main()
