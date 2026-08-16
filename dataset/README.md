# Dữ liệu ClinPharm Hà Đông

Thư mục này chứa ba bộ dữ liệu được crawl ngày **16/08/2026** từ các trang tra cứu công
khai của Bệnh viện Đa khoa Hà Đông. Mỗi bộ có hai định dạng:

- CSV UTF-8 có BOM, thuận tiện cho Excel và xử lý dạng bảng;
- JSON UTF-8, giữ metadata về nguồn, thời điểm crawl và số lượng bản ghi.

Dữ liệu xuất đã đổi line ending `CRLF`/`CR` thành `LF` và loại khoảng trắng không mang
nghĩa ở rìa mỗi dòng, mỗi ô. Nội dung cùng các xuống dòng nội bộ còn lại được giữ nguyên.

Dữ liệu phản ánh đúng nội dung endpoint tại thời điểm crawl. Endpoint của website không
phải API contract được cam kết ổn định, vì vậy schema hoặc nội dung có thể thay đổi ở lần
crawl sau.

## Tổng quan

| Bộ dữ liệu | Phạm vi | Số bản ghi | Mục đích phù hợp |
|---|---|---:|---|
| `clinpharm_hadong_full_2026-08-16` | Thông tin thuốc uống | 473 | Catalog staging và tham khảo thông tin thuốc |
| `clinpharm_hadong_drug_interactions_2026-08-16` | Tương tác dược lý/lâm sàng giữa thuốc, không giới hạn đường uống | 746 | Candidate cho dữ liệu tương tác thuốc–thuốc |
| `clinpharm_hadong_drug_compatibility_2026-08-16` | Tương hợp/tương kỵ thuốc tiêm truyền qua Y-site | 4.944 | Ma trận tương hợp vật lý–hóa học đường truyền tĩnh mạch |

Ba bộ dữ liệu mô tả ba khái niệm khác nhau. Không gộp `drug_interactions` và
`drug_compatibility` thành một loại quan hệ.

## 1. Thông tin thuốc uống

### File

- `clinpharm_hadong_full_2026-08-16.csv`
- `clinpharm_hadong_full_2026-08-16.json`

### Nguồn

[Tra cứu thuốc uống PC](https://www.clinpharmhadong.com/thu%E1%BB%91c-u%E1%BB%91ng/tra-c%E1%BB%A9u-thu%E1%BB%91c-u%E1%BB%91ng-pc)

### Schema

| Field | Nội dung |
|---|---|
| `Hoạt chất` | Hoạt chất của thuốc |
| `Hàm lượng` | Hàm lượng theo nội dung nguồn |
| `Biệt dược` | Tên biệt dược |
| `Dạng bào chế` | Dạng bào chế |
| `Nước sản xuất` | Quốc gia sản xuất |
| `Chỉ định` | Tóm tắt chỉ định trên trang nguồn |
| `Chống chỉ định` | Tóm tắt chống chỉ định trên trang nguồn |
| `Liều dùng` | Nội dung liều dùng trên trang nguồn |
| `Liều dùng tối đa` | Nội dung liều tối đa nếu nguồn có ghi |
| `Thận trọng` | Nội dung cảnh báo/thận trọng |
| `Sử dụng thuốc cho PN có thai và cho con bú` | Nội dung cho phụ nữ có thai và cho con bú |
| `Tương tác thuốc` | Tóm tắt tương tác của thuốc |
| `Tác dụng không mong muốn` | Nội dung ADR/tác dụng không mong muốn |
| `Bảo quản` | Điều kiện bảo quản |
| `Tài liệu tham khảo` | URL Google Drive; trong JSON giữ cả `text` và `url` |
| `Hình ảnh biệt dược` | URL hình ảnh nếu nguồn có cung cấp |

### Chất lượng dữ liệu quan sát được

- 473 bản ghi, 16 trường.
- 450 bản ghi có `Liều dùng`; 175 bản ghi có `Liều dùng tối đa`.
- 329 bản ghi có `Tương tác thuốc`.
- 462 bản ghi có URL `Tài liệu tham khảo`.
- 8 bản ghi thiếu `Biệt dược`; có 31 nhóm tên biệt dược trùng sau khi so sánh không phân
  biệt hoa thường.
- `Hình ảnh biệt dược` đang rỗng ở toàn bộ 473 bản ghi.

Đây là bộ thông tin **thuốc uống**. Không dùng nó để suy ra thông tin cho cùng hoạt chất ở
đường tiêm hoặc dạng bào chế khác.

## 2. Tương tác thuốc–thuốc

### File

- `clinpharm_hadong_drug_interactions_2026-08-16.csv`
- `clinpharm_hadong_drug_interactions_2026-08-16.json`

### Nguồn

[Tra cứu tương tác thuốc PC](https://www.clinpharmhadong.com/t%C6%B0%C6%A1ng-t%C3%A1c-thu%E1%BB%91c-thu%E1%BB%91c/t%C6%B0%C6%A1ng-t%C3%A1c-thu%E1%BB%91c-pc)

### Schema

| Field | Nội dung |
|---|---|
| `STT` | Số thứ tự tại nguồn |
| `Nhóm tương tác` | Nhóm/cơ chế phân loại tương tác |
| `Thuốc 1` | Thành phần thứ nhất của cặp |
| `Thuốc 2` | Thành phần thứ hai của cặp |
| `Mức độ` | Mức độ do nguồn cung cấp |
| `Cơ chế` | Cơ chế tương tác nếu có |
| `Hậu quả` | Hậu quả được mô tả tại nguồn |
| `Xử trí` | Nội dung xử trí tại nguồn, không phải khuyến nghị do P-054 sinh ra |
| `Nguồn` | Tên tài liệu tham khảo; phần lớn không phải URL |

### Phạm vi và chất lượng dữ liệu

- 746 bản ghi, tương ứng 744 cặp không phân biệt thứ tự.
- 312 tên thuốc/hoạt chất khác nhau sau khi chuẩn hóa hoa thường tối thiểu.
- Mức độ gồm 369 `Chống chỉ định`, 264 `Chống chỉ định có điều kiện`, 108 `Nghiêm trọng`
  và 5 `Trung bình`.
- 745/746 bản ghi có `Nguồn`; bản ghi `Levofloxacin` – `Maloox` không có nguồn.
- Có hai nhóm cặp lặp. Các dòng lặp được giữ nguyên vì có thể khác mức độ, nguồn hoặc nội
  dung xử trí; không được tự động loại trùng chỉ dựa trên tên cặp.

Bộ này mô tả tương tác dược lý/lâm sàng và **không chỉ gồm thuốc uống**. Một số tên thuốc
có phần mô tả đường dùng, ví dụ đường uống hoặc tiêm tĩnh mạch. Khi tạo exact key phải giữ
nguyên phần mô tả liên quan; không được tự quy tất cả về `oral`.

## 3. Tương hợp/tương kỵ Y-site

### File

- `clinpharm_hadong_drug_compatibility_2026-08-16.csv`
- `clinpharm_hadong_drug_compatibility_2026-08-16.json`

### Nguồn

[Tra cứu tương kỵ–tương hợp PC](https://www.clinpharmhadong.com/t%C6%B0%C6%A1ng-k%E1%BB%B5-t%C6%B0%C6%A1ng-h%E1%BB%A3p/t%C6%B0%C6%A1ng-k%E1%BB%B5-t%C6%B0%C6%A1ng-h%E1%BB%A3p-pc)

### Schema

| Field | Nội dung |
|---|---|
| `drug1` | Thuốc tiêm/truyền thứ nhất |
| `drug2` | Thuốc tiêm/truyền thứ hai |
| `status` | Trạng thái tương hợp Y-site |

Các giá trị `status`:

| Giá trị | Nghĩa trên trang nguồn | Số bản ghi |
|---|---|---:|
| `compatible` | Tương hợp | 1.497 |
| `incompatible` | Tương kỵ | 416 |
| `unknown` | Không có thông tin | 2.813 |
| `controversial` | Mâu thuẫn giữa các tài liệu | 218 |

Bộ này có 4.944 cặp duy nhất giữa 100 thuốc, không phát hiện cặp lặp hoặc dòng thiếu tên
thuốc/trạng thái tại thời điểm crawl.

`compatible` chỉ có nghĩa là tương hợp vật lý–hóa học trong ngữ cảnh Y-site của nguồn; nó
không có nghĩa hai thuốc không tương tác dược lý trong cơ thể. Tương tự, `incompatible`
không đồng nghĩa với mức lâm sàng `Chống chỉ định`, và `unknown` không có nghĩa là an toàn.

## Không quy đổi giữa hai loại quan hệ

| Y-site compatibility | Drug–drug interaction | Có được quy đổi không? |
|---|---|---|
| `compatible` | Không có tương tác | Không |
| `incompatible` | `Chống chỉ định` | Không |
| `unknown` | Chưa ghi nhận tương tác | Không |
| `controversial` | Mức độ chưa rõ | Không |

Chỉ có 8 cặp tên xuất hiện trong cả `drug_compatibility` và `drug_interactions`. Sự trùng
tên không làm hai record trở thành cùng một loại bằng chứng.

## Ràng buộc sử dụng trong P-054

Các file này là **dữ liệu staging/candidate**, chưa phải evidence production:

1. Nội dung thuốc uống là phần tóm tắt trên website. Link tài liệu tham khảo không chứng
   minh rằng từng câu trong record là trích dẫn nguyên văn từ PDF.
2. `drug_interactions` chủ yếu chỉ ghi tên nguồn, không có source URL, page hoặc verbatim
   quote cho từng record.
3. `drug_compatibility` không cung cấp citation cho từng cặp và thuộc domain Y-site riêng,
   không phải drug–drug interaction hiện hành của sản phẩm.
4. Không có citation đủ điều kiện thì hệ thống phải trả “chưa có dữ liệu”; không dùng các
   record này để bỏ qua ADR 0006 hoặc ranh giới exact-pair của ADR 0012.
5. Trước khi đưa một record vào production, phải đối chiếu tài liệu gốc, giữ verbatim
   quote, source URL, source coordinate và evidence version; sau đó mới chuyển qua quy
   trình review chuyên môn.

Việc dữ liệu có thể truy cập công khai không tự động xác nhận quyền tái phân phối. Cần kiểm
tra điều khoản sử dụng và quyền khai thác dữ liệu trước khi phát hành ra ngoài phạm vi dự
án.
