"""Fix truncated proofread outputs script.

Scans output_clean_v3_diffs/*.diff.json for truncated corrections.
1. Updates .diff.json with flag='NEEDS_REVIEW' and reason='Bị đứt chuỗi phản hồi Gemini (Truncated Output)'.
2. Restores affected original lines in output_clean_v3_proofread/*.md from output_clean_v3/*.md.
"""

import json
import re
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

DIFF_DIR = Path("output_clean_v3_diffs")
PROOFREAD_DIR = Path("output_clean_v3_proofread")
CLEAN_DIR = Path("output_clean_v3")

DANGLING_ENDINGS = ("-", "+", ",", ":", ";", "/", "\\", " là", " và", " cho", " trong", " của", " với", " hoặc", " được", " thuộc")

def is_truncated_correction(original: str, corrected: str, clean_line: str = "") -> bool:
    corr_strip = corrected.strip()
    orig_strip = original.strip()
    full_clean_strip = clean_line.strip() if clean_line else orig_strip

    if not corr_strip:
        return True

    # 1. Ends with dangling symbols or prepositions
    if any(corr_strip.endswith(ending) for ending in DANGLING_ENDINGS):
        return True

    # 2. Original line ends with period/punctuation, but corrected text drops sentence ending
    if full_clean_strip.endswith((".", "!", "?")) and not corr_strip.endswith((".", "!", "?", "*", "_", ")", "]", '"')):
        if len(corr_strip) < len(full_clean_strip) - 10:
            return True

    # 3. Significant length reduction (>30% shorter than clean line)
    if full_clean_strip and len(corr_strip) < len(full_clean_strip) * 0.70:
        return True

    # 4. Number loss check
    if full_clean_strip and len(corr_strip) < len(full_clean_strip) * 0.85:
        orig_nums = set(re.findall(r"\d+", full_clean_strip))
        corr_nums = set(re.findall(r"\d+", corr_strip))
        if orig_nums - corr_nums:
            return True

    return False

def main():
    diff_files = sorted(list(DIFF_DIR.glob("*.diff.json")))
    print(f"Found {len(diff_files)} diff audit JSON file(s) in {DIFF_DIR.resolve()}")

    total_diff_files_updated = 0
    total_md_files_restored = 0
    total_lines_restored = 0

    for diff_file in diff_files:
        stem = diff_file.stem.replace(".diff", "")
        clean_md_file = CLEAN_DIR / f"{stem}.md"
        proofread_md_file = PROOFREAD_DIR / f"{stem}.md"

        try:
            diff_data = json.loads(diff_file.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"[ERROR] Could not parse {diff_file.name}: {e}")
            continue

        diff_updated = False
        lines_to_restore = []

        clean_lines = clean_md_file.read_text(encoding="utf-8").splitlines() if clean_md_file.exists() else []

        for item in diff_data:
            orig = str(item.get("original", ""))
            corr = str(item.get("corrected", ""))
            line_num = item.get("line")
            clean_line = clean_lines[line_num - 1] if line_num and 0 <= line_num - 1 < len(clean_lines) else orig
            has_reason = "reason" in item and item["reason"]
            has_flag = "flag" in item and item["flag"]

            is_trunc = is_truncated_correction(orig, corr, clean_line) or not has_reason or not has_flag

            if is_trunc:
                item["flag"] = "NEEDS_REVIEW"
                if not has_reason or item.get("reason", "").startswith("Bị đứt chuỗi") or is_truncated_correction(orig, corr, clean_line):
                    item["reason"] = "Bị đứt chuỗi phản hồi Gemini (Truncated Output)"
                diff_updated = True
                if line_num:
                    lines_to_restore.append((line_num, orig))

        if diff_updated:
            diff_file.write_text(json.dumps(diff_data, ensure_ascii=False, indent=2), encoding="utf-8")
            total_diff_files_updated += 1

        # Restore lines in proofread MD if clean MD exists
        if lines_to_restore and clean_md_file.exists() and proofread_md_file.exists():
            clean_lines = clean_md_file.read_text(encoding="utf-8").splitlines()
            proofread_lines = proofread_md_file.read_text(encoding="utf-8").splitlines()

            md_modified = False
            for line_num, orig in lines_to_restore:
                idx = line_num - 1
                if 0 <= idx < len(proofread_lines) and 0 <= idx < len(clean_lines):
                    current_proofread_line = proofread_lines[idx]
                    original_clean_line = clean_lines[idx]

                    # If proofread line was corrupted by truncated text
                    if current_proofread_line != original_clean_line:
                        proofread_lines[idx] = original_clean_line
                        md_modified = True
                        total_lines_restored += 1
                        print(f"  [RESTORED] {stem}.md Line {line_num}: '{current_proofread_line[:40]}...' -> '{original_clean_line[:40]}...'")

            if md_modified:
                proofread_md_file.write_text("\n".join(proofread_lines) + "\n", encoding="utf-8")
                total_md_files_restored += 1

    print("\n" + "=" * 80)
    print("RESTORATION COMPLETE")
    print(f"Updated Diff Audit JSONs  : {total_diff_files_updated}")
    print(f"Restored Markdown Files   : {total_md_files_restored}")
    print(f"Total Lines Restored      : {total_lines_restored}")
    print("=" * 80)

if __name__ == "__main__":
    main()
