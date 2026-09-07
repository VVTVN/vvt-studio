# INCONCEPT Reference — Cinematic Luxury

Nguồn tham chiếu: https://www.inconcept.vn/

Mẫu này được lưu để học cách dùng video, chuyển động và nhịp cuộn cho website nội thất cao cấp. Không sao chép mã nguồn, video, hình ảnh, nội dung hoặc nhận diện của INCONCEPT.

## Vì sao mẫu này hiệu quả

- Hero dùng chuyển động điện ảnh để tạo cảm giác cao cấp ngay lập tức.
- Nội dung không xuất hiện dồn dập; mỗi đoạn cuộn chỉ truyền tải một ý.
- Ảnh, video và chữ luân phiên nên trang nhiều media nhưng không gây mệt.
- Chuyển section mềm, giữ cảm giác liên tục thay vì chia khối cứng.
- Câu chữ ngắn, nhiều khoảng thở, nhường vai trò chính cho hình ảnh.
- Dự án được trình bày như case study, có tên, địa điểm, năm và liên kết chi tiết.
- Các mảng năng lực, đối tác, showroom, văn phòng và xưởng tạo bằng chứng tin cậy.

## Bộ khung đề xuất

1. Header tối giản trên nền trong suốt.
2. Hero video full viewport, có poster dự phòng.
3. Tuyên ngôn thương hiệu ngắn.
4. Chuỗi media + micro-copy về vật liệu, đường nét, màu sắc và tay nghề.
5. Một câu kết nối lớn trước khi sang dự án.
6. Project showcase dạng cinematic cards.
7. Services/Capabilities với nội dung cô đọng.
8. Partner logos.
9. Showroom, office và manufacturing.
10. Footer tối giản với CTA và liên hệ.

## Smooth-scroll specification

- Ưu tiên cuộn trình duyệt tự nhiên; chỉ thêm smoothing vừa phải.
- Không khóa bánh xe chuột hoặc tạo độ trễ khiến người dùng mất kiểm soát.
- Reveal bằng opacity + translateY 18–32px.
- Thời lượng reveal 500–800ms; easing cubic-bezier mềm.
- Stagger chữ/ảnh 60–120ms, không kéo dài quá lâu.
- Parallax ảnh/video giới hạn 2–5%.
- Chuyển màu nền theo section bằng transition, không cắt đột ngột.
- Hỗ trợ prefers-reduced-motion.
- Mobile giảm hoặc tắt parallax và dùng native scrolling.

## Hero video guardrails

- Video muted, autoplay, playsinline và loop khi phù hợp.
- Có poster đẹp để first paint không bị màn hình đen.
- Ưu tiên WebM/MP4 tối ưu, bitrate vừa đủ; không tải bản desktop nặng trên mobile.
- Không để video che mất thông điệp và CTA.
- Text overlay phải đủ tương phản ở mọi khung hình.
- Tạm dừng media khi section ra khỏi viewport nếu cần tiết kiệm tài nguyên.

## Content rhythm

- Mỗi viewport chỉ có một thông điệp chính.
- Xen kẽ: video lớn → chữ ngắn → ảnh chi tiết → khoảng trắng.
- Dùng micro-copy giàu hình ảnh nhưng không dài dòng.
- Không quá 2–3 chuyển động cạnh tranh cùng lúc.
- Phần dự án phải có nhịp rõ: tên → vai trò → địa điểm/năm → xem chi tiết.

## Cách phối với mẫu Maison Décor

- Maison Décor: dùng cho editorial grid và mật độ ảnh phong phú.
- INCONCEPT: dùng cho hero video, nhịp cuộn và chuyển section.
- Bản phối đề xuất: khung dự án của Maison + motion system của INCONCEPT.
- Conversion layer của VVT phải rõ hơn cả hai: kết quả, quy trình, CTA và form tư vấn.

## Performance targets

- LCP dưới 2.5 giây trên kết nối tốt.
- CLS dưới 0.1.
- Video hero có poster và kích thước cố định.
- Lazy-load media dưới fold.
- Chỉ animate transform và opacity khi có thể.
- Lighthouse Performance ≥ 85; Accessibility ≥ 90.
