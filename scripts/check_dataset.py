import csv
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

csv_path = 'dataset/drug_list_bv_gtvt.csv'
output_clean_dir = 'output_clean'

with open(csv_path, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

files = os.listdir(output_clean_dir) if os.path.exists(output_clean_dir) else []

print(f"Tổng số dòng CSV: {len(rows)}")
print(f"Tổng số file trong output_clean: {len(files)}")

notes_counter = {}
matched_files = 0
valid_link_count = 0
active_notes_count = 0

for i, row in enumerate(rows):
    note = row.get('notes', '').strip()
    notes_counter[note] = notes_counter.get(note, 0) + 1
    
    link1 = row.get('Link HDSD 1', '').strip()
    link2 = row.get('Link 2', '').strip()
    
    drive_id = None
    for link in [link1, link2]:
        m = re.search(r'/d/([a-zA-Z0-9_-]+)', link)
        if m:
            drive_id = m.group(1)
            break
            
    if drive_id:
        valid_link_count += 1
        has_file = any(drive_id in fname for fname in files)
        if has_file:
            matched_files += 1

print(f"Phân loại cột notes: {notes_counter}")
print(f"Số thuốc có link Drive hợp lệ: {valid_link_count}")
print(f"Số thuốc có file OCR tương ứng trong output_clean: {matched_files}")
