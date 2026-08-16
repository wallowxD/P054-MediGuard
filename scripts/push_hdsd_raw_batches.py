"""Batch push dataset/hdsd_raw to GitHub in ~25MB chunks to prevent HTTP 408/500 timeouts.
"""

import subprocess
import sys
from pathlib import Path

RAW_DIR = Path("dataset/hdsd_raw")


def main():
    if not RAW_DIR.exists():
        print("Directory dataset/hdsd_raw does not exist.")
        return

    files = sorted([f for f in RAW_DIR.glob("*") if f.is_file()])
    total_files = len(files)
    print(f"Found {total_files} files in dataset/hdsd_raw.")

    batch_limit = 25 * 1024 * 1024  # 25 MB per batch
    current_batch = []
    current_size = 0
    batch_num = 1

    for idx, f in enumerate(files, 1):
        current_batch.append(str(f))
        current_size += f.stat().st_size

        if current_size >= batch_limit or idx == total_files:
            mb = current_size / (1024 * 1024)
            print(f"\n--- Batch {batch_num}: {len(current_batch)} files ({mb:.1f} MB) [{idx}/{total_files}] ---")
            
            # git add
            add_cmd = ["git", "add"] + current_batch
            subprocess.run(add_cmd, check=True)
            
            # git commit (skip if nothing staged)
            commit_msg = f"feat(VMEC-30): add hdsd_raw dataset batch {batch_num} ({idx}/{total_files})"
            commit_res = subprocess.run(["git", "commit", "-m", commit_msg])
            
            if commit_res.returncode == 0:
                print("Pushing batch to origin...")
                res = subprocess.run(["git", "push", "origin", "feature/ocr-proofread-pipeline"])
                if res.returncode != 0:
                    print("Warning: Push returned error code, retrying push once...")
                    subprocess.run(["git", "push", "origin", "feature/ocr-proofread-pipeline"], check=True)
                print(f"[OK] Batch {batch_num} pushed successfully!")
            else:
                print(f"[OK] Batch {batch_num} already committed / no changes.")

            current_batch = []
            current_size = 0
            batch_num += 1

    print("\nAll files in dataset/hdsd_raw pushed successfully to GitHub!")


if __name__ == "__main__":
    main()
