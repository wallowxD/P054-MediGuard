# Bộ slide giới thiệu và tài liệu demo

Lưu artifact thuyết trình tại đây. Product requirement vẫn nằm trong `specs/`; mọi claim
định lượng phải lấy từ `eval/results/report.md`.

## File dự kiến

- `pitch_deck.pptx`: slide Demo Day.
- `video_demo.mp4`: video demo tối đa năm phút.

## Cấu trúc slide đề xuất

1. Tiêu đề — Medication Safety Copilot và Cuvée Tech.
2. Vấn đề — tra cứu tờ hướng dẫn và kiểm tra cặp thuốc thủ công.
3. Giải pháp — warning tham khảo thuốc–thuốc và thuốc–thực phẩm có dẫn nguồn.
4. Ranh giới an toàn — không citation thì không warning; không kết luận lâm sàng; review
   chạy song song.
5. Demo — một flow kiểm tra tương tác end-to-end với citation thật.
6. Kiến trúc — exact drug–drug lookup so với drug–food retrieval.
7. Evidence — chỉ dùng kết quả đã đo trong `eval/results/report.md`.
8. Người dùng và giá trị — patient/carer cùng pharmacist review.
9. Team — vai trò và evidence đóng góp.
10. Milestone tiếp theo — link Jira, không sao chép backlog/sprint status vào file này.

## Danh sách kiểm tra video

- [ ] Giới thiệu vấn đề trong dưới 30 giây.
- [ ] Demo primary flow trong hai đến ba phút.
- [ ] Hiển thị đầy đủ quote, source và review status.
- [ ] Demo no-data trung thực và wrong-pair safety case.
- [ ] Kết thúc bằng impact đã đo và limitation trong dưới 30 giây.
