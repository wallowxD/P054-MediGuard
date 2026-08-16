"""Split review_items.json into 3 parts for Hung, Duc, and Minh.

Usage:
    python scripts/split_review_items.py
"""

import json
from pathlib import Path

REVIEW_ITEMS_FILE = Path("review_items.json")


def generate_person_md_report(name_title: str, assignee_name: str, items: list[dict], out_path: Path):
    md_lines = [
        f"# BÁO CÁO PHÂN CÔNG KIỂM DUYỆT Y DƯỢC — {name_title.upper()}",
        "",
        f"**Người phụ trách:** `{assignee_name}`",
        f"**Tổng số câu cần kiểm duyệt:** `{len(items)}`",
        "",
        "| STT | File Markdown | Dòng | Loại cờ | Lý do Gemini ghi nhận | Trạng thái | Ghi chú người duyệt |",
        "|---|---|---|---|---|---|---|",
    ]

    for idx, item in enumerate(items, 1):
        flag_badge = f"`{item['type']}`"
        md_lines.append(
            f"| {idx} | `{item['filename']}` | {item['line']} | {flag_badge} | {item['reason']} | `{item['status']}` | |"
        )

    out_path.write_text("\n".join(md_lines), encoding="utf-8")
    print(f"Exported report for {out_path.name} ({len(items)} items)")


def main():
    if not REVIEW_ITEMS_FILE.exists():
        print(f"Error: {REVIEW_ITEMS_FILE} not found. Please run export_review_items.py first.")
        return

    all_items = json.loads(REVIEW_ITEMS_FILE.read_text(encoding="utf-8"))
    total_count = len(all_items)
    print(f"Total items to split: {total_count}")

    # Group items by unique filename to avoid splitting a single file across different assignees
    files_map = {}
    for item in all_items:
        fn = item["filename"]
        files_map.setdefault(fn, []).append(item)

    unique_files = list(files_map.keys())
    print(f"Total unique files with flags: {len(unique_files)}")

    # Distribute files evenly among 3 assignees: Hung, Duc, Minh
    assignees = [
        {"key": "hung", "name": "Nguyễn Thanh Hùng", "title": "HÙNG", "items": []},
        {"key": "duc", "name": "Đỗ Quý Đức", "title": "ĐỨC", "items": []},
        {"key": "minh", "name": "Lê Nhật Minh", "title": "MINH", "items": []},
    ]

    for i, fn in enumerate(unique_files):
        target_assignee = assignees[i % 3]
        target_assignee["items"].extend(files_map[fn])

    # Save JSON & MD for each assignee
    for a in assignees:
        json_path = Path(f"review_items_{a['key']}.json")
        md_path = Path(f"review_report_{a['key']}.md")

        # Set assignee field inside each item
        for item in a["items"]:
            item["assignee"] = a["name"]

        json_path.write_text(json.dumps(a["items"], ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Saved {json_path.name}: {len(a['items'])} items")

        generate_person_md_report(a["title"], a["name"], a["items"], md_path)

    print("\nSuccessfully split review items for Hung, Duc, and Minh!")


if __name__ == "__main__":
    main()
