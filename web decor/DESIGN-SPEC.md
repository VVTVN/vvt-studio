# Design Specification — Web Decor

## Visual direction

- Phong cách: editorial luxury, ấm, tinh tế, ít trang trí thừa.
- Nền: trắng ngà, beige rất nhạt hoặc than đậm theo từng section.
- Màu nhấn: vàng champagne, nâu gỗ hoặc màu thương hiệu của dự án.
- Hình ảnh: ưu tiên ảnh công trình hoặc sản phẩm chân thật; không dùng ảnh nhỏ dày đặc.
- Bo góc: ít hoặc không bo với ảnh editorial; nút có thể bo nhẹ.

## Layout rhythm

- Container rộng, lề lớn.
- Section xen kẽ: full-bleed image → text rộng thoáng → grid ảnh.
- Grid dự án: 12 cột; ảnh lớn 7–8 cột, ảnh phụ 4–5 cột.
- Không quá 2–3 ảnh cùng cạnh tranh trong một viewport.
- Khoảng cách section lớn hơn khoảng cách nội bộ để người xem nhận ra nhịp.

## Motion

- Reveal khi cuộn: opacity kết hợp translateY nhỏ.
- Ảnh scale rất nhẹ khi hover.
- Parallax tối đa 3–5% quãng đường.
- Thời lượng 350–700 ms; easing mềm.
- Tôn trọng prefers-reduced-motion.
- Không dùng hiệu ứng phô diễn nếu làm chậm thao tác.

## Typography

- Heading serif thanh lịch hoặc sans display có cá tính.
- Body sans-serif dễ đọc.
- Heading ngắn, line-height chặt; body line-height thoáng.
- Giới hạn chiều rộng đoạn văn khoảng 55–70 ký tự.

## Conversion layer

Khung đẹp phải phục vụ bán hàng:

- CTA chính: Nhận tư vấn / Xem dự án / Yêu cầu báo giá.
- Mỗi case study có vấn đề, giải pháp, ảnh kết quả và phạm vi công việc.
- Form ngắn, hỏi đúng nhu cầu.
- Có Zalo hoặc điện thoại nhưng không che nội dung.
- Chứng minh năng lực bằng kết quả, không chỉ bằng lời hoa mỹ.

## Performance guardrails

- Dùng AVIF/WebP và responsive images.
- Lazy-load ảnh dưới màn hình đầu.
- Hero có kích thước cố định để tránh layout shift.
- Không autoplay video nặng trên mobile.
- Giới hạn font weight và script animation.
- Mục tiêu Lighthouse: Performance ≥ 85, Accessibility ≥ 90.

## Không được sao chép

- Ảnh, logo, nội dung và tên dự án của Maison Décor.
- Mã nguồn hoặc animation độc quyền.
- Bố cục từng section theo tỷ lệ y hệt.

Chỉ kế thừa nguyên tắc: nhiều hình nhưng có nhịp, khoảng trắng tốt, chuyển động tiết chế và cảm giác cao cấp.
