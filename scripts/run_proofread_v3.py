"""Production-grade Multimodal Proofreading Script v3 for Medical HDSD Documents.

Inputs both HDSD images and existing Markdown text to Gemini 3.6 Flash.
Receives JSON diff arrays of line-level corrections to save tokens and update Markdown files.

Usage:
    # Dry-run check:
    python scripts/run_proofread_v3.py --dry-run

    # Proofread first 5 documents using Gemini API Key:
    python scripts/run_proofread_v3.py --api-key YOUR_API_KEY --limit 5

    # Proofread using Vertex AI:
    python scripts/run_proofread_v3.py --api-key YOUR_API_KEY --use-vertex --project YOUR_PROJECT
"""

import argparse
import json
import logging
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

# Add backend/src to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend" / "src"))

from medsafe.config import get_settings
from medsafe.ocr.multimodal_proofreader import MultimodalProofreader
from tqdm import tqdm

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("Proofread_v3")

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")


def natural_sort_key(s: str) -> list:
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r"(\d+)", str(s))]


def build_image_index(images_dir: Path) -> dict[str, list[Path]]:
    """Build a lookup mapping from drug folder name to list of sorted image file paths."""
    index = {}
    for root, _, files in os.walk(images_dir):
        root_path = Path(root)
        imgs = [root_path / f for f in files if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))]
        if imgs:
            imgs.sort(key=lambda p: natural_sort_key(p.name))
            valid_imgs = [p for p in imgs if p.stat().st_size > 0]
            if valid_imgs:
                index[root_path.name] = valid_imgs
    return index


def proofread_single_document(
    md_file: Path,
    image_files: list[Path],
    output_dir: Path,
    diff_dir: Path,
    proofreader: MultimodalProofreader,
) -> tuple[str, bool, int, int]:
    """Proofread a single Markdown file page-by-page against source images.

    Returns:
        (folder_name, success_flag, total_corrections_count, page_count)
    """
    folder_name = md_file.stem
    markdown_content = md_file.read_text(encoding="utf-8")

    if not image_files:
        logger.warning(f"No source images found for {folder_name}. Skipping proofreading.")
        return (folder_name, False, 0, 0)

    # Split markdown by page headers or double newlines if page dividers exist
    page_markdowns = [p.strip() for p in markdown_content.split("\n\n---\n\n") if p.strip()]

    all_corrections = []
    updated_pages = []

    # Process per-page if page count matches or process page 1..N
    if len(page_markdowns) == len(image_files):
        for idx, (img_path, page_md) in enumerate(zip(image_files, page_markdowns)):
            corr_md, diffs = proofreader.proofread_page(img_path, page_md)
            updated_pages.append(corr_md)
            if diffs:
                for d in diffs:
                    d["page"] = idx + 1
                    d["image"] = img_path.name
                all_corrections.extend(diffs)
        final_markdown = "\n\n---\n\n".join(updated_pages) + "\n"
    else:
        for idx, img_path in enumerate(image_files):
            curr_text = updated_pages[0] if updated_pages else markdown_content
            corr_md, diffs = proofreader.proofread_page(img_path, curr_text)
            if diffs:
                for d in diffs:
                    d["image"] = img_path.name
                all_corrections.extend(diffs)
            updated_pages = [corr_md]
        final_markdown = updated_pages[0] if updated_pages else markdown_content

    # Write updated Markdown file to output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    out_md_file = output_dir / md_file.name
    out_md_file.write_text(final_markdown, encoding="utf-8")

    # Save JSON diff audit trail
    diff_dir.mkdir(parents=True, exist_ok=True)
    diff_json_file = diff_dir / f"{folder_name}.diff.json"
    diff_json_file.write_text(json.dumps(all_corrections, ensure_ascii=False, indent=2), encoding="utf-8")

    return (folder_name, True, len(all_corrections), len(image_files))


def main():
    parser = argparse.ArgumentParser(description="Multimodal Proofreading Script v3 for Medical HDSD Documents.")
    parser.add_argument("--input-dir", type=Path, default=Path("output_clean_v3"), help="Directory containing input Markdown files.")
    parser.add_argument("--output-dir", type=Path, default=Path("output_clean_v3_proofread"), help="Directory to save proofread Markdown files.")
    parser.add_argument("--images-dir", type=Path, default=Path("dataset/hdsd_images"), help="Directory containing source HDSD images.")
    parser.add_argument("--diff-dir", type=Path, default=Path("output_clean_v3_diffs"), help="Directory to save JSON diff audit files.")
    parser.add_argument("--api-key", type=str, default=None, help="Gemini / Vertex API Key.")
    parser.add_argument("--use-vertex", action="store_true", help="Use Vertex AI mode.")
    parser.add_argument("--project", type=str, default=None, help="GCP Project ID for Vertex AI.")
    parser.add_argument("--model", type=str, default="gemini-3.6-flash", help="Gemini model name.")
    parser.add_argument("--workers", type=int, default=3, help="Number of parallel workers.")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of documents to process.")
    parser.add_argument("--dry-run", action="store_true", help="Scan documents and images without sending API calls.")

    args = parser.parse_args()

    md_files = sorted(list(args.input_dir.glob("*.md")), key=lambda p: natural_sort_key(p.name))
    if not md_files:
        logger.error(f"No Markdown files found in {args.input_dir}")
        sys.exit(1)

    img_index = build_image_index(args.images_dir)
    matched_pairs = []
    skipped_count = 0
    for md in md_files:
        diff_file = args.diff_dir / f"{md.stem}.diff.json"
        out_md_file = args.output_dir / md.name
        if diff_file.exists() and out_md_file.exists():
            skipped_count += 1
            continue
        imgs = img_index.get(md.stem, [])
        matched_pairs.append((md, imgs))

    if args.limit:
        matched_pairs = matched_pairs[: args.limit]

    print("=" * 80)
    print("MULTIMODAL PROOFREADING V3 SUMMARY")
    print("=" * 80)
    print(f"Total Markdown Files Found : {len(md_files)}")
    print(f"Skipped (Already Processed): {skipped_count}")
    print(f"Files Remaining to Process : {len(matched_pairs)}")
    print(f"Input Markdown Directory   : {args.input_dir.resolve()}")
    print(f"Images Directory           : {args.images_dir.resolve()}")
    print(f"JSON Diff Audit Directory  : {args.diff_dir.resolve()}")
    print("-" * 80)

    if args.dry_run:
        print("First 5 Matched Documents:")
        for idx, (md, imgs) in enumerate(matched_pairs[:5], 1):
            print(f"  {idx:02d}. [{md.name}] -> {len(imgs)} source image(s)")
        print("Dry-run complete. No API calls made.")
        return

    proofreader = MultimodalProofreader(
        api_key=args.api_key,
        model=args.model,
        use_vertex=args.use_vertex,
        project=args.project,
    )

    success_count = 0
    total_diffs = 0

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(proofread_single_document, md, imgs, args.output_dir, args.diff_dir, proofreader): md.name
            for md, imgs in matched_pairs
        }

        with tqdm(total=len(futures), desc="Proofreading Docs", unit="doc") as pbar:
            for future in as_completed(futures):
                doc_name = futures[future]
                try:
                    name, ok, diff_cnt, img_cnt = future.result()
                    if ok:
                        success_count += 1
                        total_diffs += diff_cnt
                        pbar.set_postfix({"latest": name[:20], "diffs": diff_cnt})
                except Exception as e:
                    logger.error(f"Error proofreading {doc_name}: {e}")
                pbar.update(1)

    print("=" * 80)
    print("PROOFREADING COMPLETE!")
    print(f"Successfully Processed : {success_count} / {len(matched_pairs)}")
    print(f"Total Corrections Made : {total_diffs}")
    print(f"Diff Audit Logs Saved  : {args.diff_dir.resolve()}")
    print("=" * 80)


if __name__ == "__main__":
    main()
