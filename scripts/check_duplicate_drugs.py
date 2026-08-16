"""Script kiểm tra và so sánh các file thuốc bị lặp (Link 1 và Link 2) trong output_clean_v3."""

import glob
import os
import re
import sys
import difflib
from collections import defaultdict

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

OUTPUT_DIR = "output_clean_v3"
REPORT_FILE = "duplicate_drugs_report.md"

def clean_text(text: str) -> str:
    return re.sub(r"<!--\s*metadata:.*?-->\n*", "", text).strip()

def main():
    files = glob.glob(os.path.join(OUTPUT_DIR, "*.md"))
    groups = defaultdict(list)

    for f in files:
        name = os.path.basename(f)
        m = re.match(r"^(\d+)_", name)
        if m:
            drug_id = m.group(1)
            groups[drug_id].append(f)

    duplicates = {k: sorted(v) for k, v in groups.items() if len(v) > 1}

    report = []
    report.append("# Báo cáo Kiểm tra Thuốc trùng lặp (Link 1 vs Link 2)\n")
    report.append(f"- **Tổng số file Markdown**: {len(files)}")
    report.append(f"- **Tổng số ID Thuốc duy nhất**: {len(groups)}")
    report.append(f"- **Số ID Thuốc có 2 file HDSD (Link 1 & Link 2)**: {len(duplicates)}\n")

    identical_pairs = []
    different_pairs = []

    report.append("## Danh sách Chi tiết 20 bộ Thuốc có 2 Link PDF\n")
    report.append("| ID Thuốc | Tên file Link 1 | Tên file Link 2 | Trạng thái | Độ tương đồng |")
    report.append("|---|---|---|---|---|")

    details_sections = []

    for drug_id in sorted(duplicates.keys(), key=lambda x: int(x)):
        pair = duplicates[drug_id]
        f1, f2 = pair[0], pair[1]
        name1, name2 = os.path.basename(f1), os.path.basename(f2)

        t1 = clean_text(open(f1, encoding="utf-8").read())
        t2 = clean_text(open(f2, encoding="utf-8").read())

        ratio = difflib.SequenceMatcher(None, t1, t2).ratio() * 100
        is_exact = (t1 == t2)

        if is_exact:
            identical_pairs.append((drug_id, name1, name2))
            status_str = "🟢 GIỐNG HỆT 100%"
        else:
            different_pairs.append((drug_id, name1, name2, ratio))
            status_str = f"🔴 KHÁC NHAU ({ratio:.1f}%)"

        report.append(f"| `{drug_id}` | `{name1[:35]}...` | `{name2[:35]}...` | {status_str} | {ratio:.1f}% |")

        # Prepare detail diff snippet if different
        if not is_exact:
            lines1 = t1.splitlines()
            lines2 = t2.splitlines()
            diff = list(difflib.unified_diff(lines1, lines2, fromfile=name1, tofile=name2, lineterm=""))
            diff_text = "\n".join(diff[:25])
            
            details_sections.append(f"### ID `{drug_id}` (Độ tương đồng: {ratio:.1f}%)\n")
            details_sections.append(f"- **File 1**: `{name1}` ({len(lines1)} dòng)")
            details_sections.append(f"- **File 2**: `{name2}` ({len(lines2)} dòng)")
            details_sections.append("```diff\n" + diff_text + "\n```\n")

    report.append("\n## Tóm tắt Phân loại\n")
    report.append(f"### 1. Các bộ Giống hệt 100% ({len(identical_pairs)} cặp - Có thể giữ 1 file & xoá file thừa):")
    for drug_id, n1, n2 in identical_pairs:
        report.append(f"- **ID `{drug_id}`**: `{n1}`")

    report.append(f"\n### 2. Các bộ Có sự Khác biệt ({len(different_pairs)} cặp - Cần xem xét lý do):")
    for drug_id, n1, n2, r in different_pairs:
        report.append(f"- **ID `{drug_id}`** (Tương đồng {r:.1f}%): `{n1}` vs `{n2}`")

    if details_sections:
        report.append("\n## Chi tiết Các điểm Khác biệt giữa Link 1 và Link 2\n")
        report.extend(details_sections)

    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(report))

    print(f"Báo cáo đã được tạo tại: {os.path.abspath(REPORT_FILE)}")

if __name__ == "__main__":
    main()
