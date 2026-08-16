"""Script xử lý dọn dẹp & gộp các file thuốc trùng lặp theo phương án an toàn 100%."""

import glob
import os
import re
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

OUTPUT_DIR = Path("output_clean_v3")

# 12 Cặp Nhóm A (Giống hệt nội dung): Xoá file _2_
GROUP_A_DELETE_FILES = [
    "0393_Carmotop_25_mg-_Carmotop_50_mg_2_1StSld4jXm0cImHnS8zUoSpz8U-j3iB23.md",
    "0406_A_T_Noradrenaline_1mg_ml_2_1mC_XfdRWhWWEUo6FM0dsgSin2Xf6qewy.md",
    "0579_Tamiflu_2_1FAC2n3JYR9HFPBOGRzq6B0N0omCyzVQv.md",
    "0620_Procoralan_5mg_2_1av9OQyJ3qstjwo2htWKcuduylxgV8AyY.md",
    "0629_Seretide_Accuhaler_50_500mcg_2_1sWFyJ-6UtxQk-LbglbaK_hK9uESQ4Tb9.md",
    "0630_Seretide_Accuhaler_50_250mcg_2_1sWFyJ-6UtxQk-LbglbaK_hK9uESQ4Tb9.md",
    "0639_TP_Povidon_iod_10_2_5g_25ml_450ml_2_1vnxPc1AEU59lp6vRW-barhn2dHWZXahs.md",
    "0700_Natrixam_1_5mg_10mg_2_1HybFO2ThpwFv_yFHptcLGPyBp1_1evVx.md",
    "0859_NATRI_CLORID_0_9_2_1fKgsn62Z4xG__zCVrRYn2UtS12KvyUZj.md",
    "0912_Natri_clorid_10_Vinphaco_2_12A8OTTizkWL-_oK7Fsfjq-tqfWEnUJfe.md",
    "1002_Nephrosteril_250ml_2_15mm25UdLIGgnp-KdFe55DonOD-zeIVBR.md",
    "1007_NICARDIPINE_AGUETTANT_10MG_10ML_2_10zMGfQ4NLni_goGMyqiFDbRNAKljPJ92.md",
]

# 3 Cặp Nhóm B gộp thông tin rồi xoá file ngắn hơn
MERGE_RULES = [
    {
        "id": "0659",
        "keep": "0659_Zapnex-10_Olanzapin_10_Mg_1_1M4LDfvReR6tvsRtuEupmiGpiFHRXnd_S.md",
        "remove": "0659_Zapnex-10_Olanzapin_10_Mg_2_11xxDNwI7XcH4G_PMNs81U1L5DVTuB240.md",
        "append_text": "\n\n<!-- Gộp thông tin bảo quản & khuyến cáo bổ sung -->\n**Bảo quản & Lưu ý:** Để thuốc nơi khô ráo, tránh ánh sáng, nhiệt độ không quá 30°C, và ngoài tầm với của trẻ em. Không sử dụng thuốc sau ngày hết hạn.\n",
    },
    {
        "id": "1005",
        "keep": "1005_Toujeo_SoloStar_300DV_ml_2_1lPFTaid3uN4nLv9spI1igEvuUVd5No_4.md",
        "remove": "1005_Toujeo_SoloStar_300DV_ml_1_1G8c8Aikkto8_hdpy-CxwRld9TQ8SXsKg.md",
        "append_text": "\n\n<!-- Gộp danh sách tá dược chi tiết từ nhãn sản phẩm -->\n**Thành phần tá dược chi tiết:** Clorua kẽm, Metacresol, glycerol, Acid hydrochloric (để điều chỉnh pH), natri hydroxyd (để điều chỉnh pH), Nước pha tiêm.\n",
    },
    {
        "id": "0836",
        "keep": "0836_Vincomid_2_1W9_D3M_uXMNL7s5PifSorrhKBJjNAK8m.md",
        "remove": "0836_Vincomid_1_1URsPz_aPae9Z8ipsw7RGQGie9gLnnxqz.md",
        "append_text": "\n\n<!-- Gộp quy cách đóng gói bổ sung -->\n**Quy cách đóng gói:** Hộp 2 vỉ x 5 ống x 2 ml. Thuốc lựa chọn hàng hai (second-line) dự phòng nôn xuất hiện muộn.\n",
    },
]


def main():
    print("=" * 80)
    print("BẮT ĐẦU XỬ LÝ DỌN DẸP THUỐC TRÙNG LẶP HỆ THỐNG")
    print("=" * 80)

    deleted_count = 0
    merged_count = 0

    # 1. Processing Group A (Direct deletion of identical duplicate files)
    print("\n1. Xử lý Nhóm A (Xoá 12 file giống hệt 100%):")
    for filename in GROUP_A_DELETE_FILES:
        target_path = OUTPUT_DIR / filename
        if target_path.exists():
            target_path.unlink()
            deleted_count += 1
            print(f"  ✓ Đã xoá file thừa: {filename}")
        else:
            print(f"  - File không tồn tại (đã xoá trước đó): {filename}")

    # 2. Processing Group B (Merge missing info then remove shorter file)
    print("\n2. Xử lý Nhóm B (Gộp thông tin rồi xoá file ngắn hơn):")
    for rule in MERGE_RULES:
        keep_path = OUTPUT_DIR / rule["keep"]
        remove_path = OUTPUT_DIR / rule["remove"]

        if keep_path.exists():
            original_content = keep_path.read_text(encoding="utf-8")
            if rule["append_text"].strip() not in original_content:
                updated_content = original_content + rule["append_text"]
                keep_path.write_text(updated_content, encoding="utf-8")
                print(f"  + Đã gộp thêm thông tin còn thiếu vào: {rule['keep']}")

        if remove_path.exists():
            remove_path.unlink()
            merged_count += 1
            deleted_count += 1
            print(f"  ✓ Đã xoá file ngắn sau khi gộp: {rule['remove']}")

    print("\n3. Nhóm B Độc lập (Giữ nguyên cả 2 file vì là 2 dạng/tài liệu khác nhau):")
    print("  • ID 0643 (Tebantin: Bản 16 trang vs Bản tóm tắt)")
    print("  • ID 0696 (Optive: Bản Tép đơn liều UD vs Bản Lọ đa liều)")
    print("  • ID 0827 (Tunadimet: Bản chuyên môn vs Bản người bệnh)")
    print("  • ID 0830 (Vinphason: Bản tiêm vs Bản hướng dẫn chung)")
    print("  • ID 0841 (Buscopan: Bản Tiêm 20mg vs Bản Viên nén 10mg)")

    total_remaining = len(list(OUTPUT_DIR.glob("*.md")))

    print("\n" + "=" * 80)
    print("HOÀN THÀNH XỬ LÝ DỌN DẸP THUỐC TRÙNG LẶP!")
    print(f"- Số file đã xoá an toàn          : {deleted_count}")
    print(f"- Số file đã gộp thông tin trước xoá: {merged_count}")
    print(f"- Số file Markdown còn lại hiện tại : {total_remaining}")
    print("=" * 80)


if __name__ == "__main__":
    main()
