# SCROLL_BEHAVIOR — Selected Projects motion study

## Phạm vi và phương pháp (ghi trước khi sửa animation)

Ngày 08/09/2026. Quan sát trực tiếp https://unseen.co/projects/ và http://127.0.0.1:3000/#work trong Browser. Đã đọc viewport của cả hai trang: **1440 × 900**. Hai trang được mở thành hai tab để đối chiếu và các cặp ảnh được ghi trong hội thoại. Browser hiện không có API chia đôi hai cửa sổ sống; không tuyên bố đã mở được hai viewport 1440px cùng lúc trên một màn hình 1440px.

Không đọc/copy source shader hay asset của Unseen. Tên dự án gốc dưới đây chỉ để xác định các hình được theo dõi, không đưa vào demo. Không đổi ảnh, màu, font hoặc nội dung FORME trong lần sửa này.

Dùng một chu kỳ **dịch chuyển một hàng**: hàng B lên vị trí ban đầu của hàng A. Hàng A là Hubtown / Poly, hàng B là OceanX / The Symphony of Vines. Bước hàng nhìn thấy khoảng **380–400px**, tùy dao động nhẹ của mặt phẳng. Bốn thao tác wheel bằng nhau (0.055 trang mỗi lần trong Browser, xấp xỉ 50px input/lần) làm nội dung Unseen dịch khoảng 95–100px/lần. Đây là mốc chuẩn hóa theo chuyển động quan sát, không phải giá trị ScrollTrigger nội bộ. Số pixel lấy từ canvas/screenshot là xấp xỉ (±15px), không phải DOM bounding box của card, vì card được vẽ trong canvas.

## Những gì thực sự pinned

- Toàn bộ canvas là một viewport cố định 1440×900; `window.scrollY` của trang gốc không đại diện cho tiến độ bên trong.
- Navigation / logo giữ ở trên.
- Heading Selected Projects: DOM y=72, cao 69px, thuộc ancestor `position: fixed`.
- Các pill filter khoảng y=156–186, đứng yên trong các lần cuộn.
- Vùng biến dạng nằm ngay bên dưới filter, xấp xỉ y=220. **Card không đơn giản chạy lên phía sau một thanh toolbar che kín.** Mặt ảnh bị gập lại trong vùng này và vẫn có thể tồn tại dưới dạng dải.
- Hai cột gần đồng hàng, không có offset 85px giữa cột trái và phải như demo cũ.

## Một chu kỳ: 0 / 25 / 50 / 75 / 100%

| Mốc | Hàng A / ảnh đang rời vùng xem | Caption A | Hàng B / ảnh kế tiếp | Vị trí, scale, crop |
| --- | --- | --- | --- | --- |
| 0% | Ảnh gần phẳng, top≈300, bottom≈600, rộng≈560 | y≈610–665 | Top≈690, phần dưới ở ngoài viewport | Hai cột x≈145 và x≈750, rộng gần như không đổi; không zoom lớn |
| 25% | Top nhìn thấy≈230–240, bottom≈510; mép trên bắt đầu cong | y≈525–575 | Top≈595, bottom≈890 | Phần dưới đi lên gần tuyến tính; phần trên bắt đầu gập. Không scaleY toàn bộ ảnh |
| 50% | Mép gập giữ quanh≈210–240; bottom≈405; còn khoảng180–200px vùng ảnh thấy được | y≈420–470 | Top≈490, bottom≈790 | Nội dung trên mặt ảnh bị nén/đảo ở dải gập; phần phẳng phía dưới giữ tỷ lệ cục bộ |
| 75% | Còn dải mặt ảnh rộng≈560, cao≈80–110px, top≈200–230, bottom≈305 | y≈320–370 | Top≈390–400, bottom≈685–695 | Gập tăng theo tiến độ, không phải reveal animation theo thời gian. Hàng B không bị phóng lớn để lấp chỗ |
| 100% | Hàng A không biến mất tức thời: vẫn còn một dải gập khoảng y≈200–295, có thể đè qua vùng caption | y≈235–270 | Top≈290–300, bottom≈585–595 | Hàng B thay chỗ A. Dải A mỏng dần khi đi thêm; đến≈125% vẫn thấy một mép mỏng phía trên |

### Ảnh bên trong khung

- Cảm giác crop chủ yếu là hệ quả mặt phẳng ảnh đi vào vùng uốn/gập: **không phải** giảm height rồi `object-fit: cover` lại ở mỗi frame; cách đó làm vật thể bên trong zoom và đổi bố cục sai.
- Điểm ảnh ở phần dưới còn phẳng đi cùng mép dưới. Vùng trên bị nén rồi quay thành dải. Chiều rộng thay đổi nhẹ theo sóng, không scale cả card từ 1 xuống 0.8.
- Một số ảnh là media đang chạy; không thể suy ra lượng pan độc lập chính xác từ chúng. Không gán các con số parallax của bản demo cũ cho trang gốc.
- Bản dựng sẽ dùng texture cover ổn định trên một lưới biến dạng, giữ UV của hình. Biên dạng mặt phẳng mới là phần chuyển động chính; không dùng parallax phóng đại để thay thế.

## Cuộn nhanh / cuộn ngược đã quan sát ở trang gốc

- Một lần input 0.22 trang: frame đầu chưa đi hết một hàng; sau khi dừng, hàng B về khoảng y=290–300 như khi cuộn thành bốn bước. Có quán tính/scrub, không có bốn transition riêng chạy nối đuôi.
- Từ≈125%, cuộn ngược 0.11 trang: sau khi dừng trở lại gần mốc75%, B top≈398; A mở lại thành dải≈110px. Caption cũng quay lại. Không chạy reveal một lần rồi giữ trạng thái đã reveal.
- Mép gập có dao động nhỏ theo thời gian/động lượng; hình dáng pixel không bất biến giữa các screenshot. Tiến độ hàng và mức gập chính phải đảo chiều được.

## Đo demo cũ trước khi sửa

Cùng bốn input wheel 0.055 trang: native scrollY = 497, 547, 596, 646, 695. Top card A = 194, 144, 95, 45, -4. Height luôn486px, width642px. Top card phải luôn lệch+85px. Hàng kế tiếp còn ở y902→704. Toolbar chỉ bắt đầu dính sau khi y84→34→0. Ảnh vẫn giữ `scale(1.12)` với translate nhỏ. **Không có gập, không có crop tiến triển theo một trường biến dạng, tốc độ tiến hàng bằng khoảng một nửa tham chiếu.**

## Đặc tả thay thế (mô hình xấp xỉ độc lập)

1. Một stage sticky cao100vh, chứa canvas và các hit target/caption có ngữ nghĩa. Header và heading/filter pinned trong stage. Outer section cung cấp khoảng cuộn thật để thoát sang Studio ở cuối.
2. Bỏ stagger cột, bỏ IntersectionObserver reveal một lần, bỏ translate/scale/skew parallax cũ.
3. Desktop1440: margin≈10% mỗi bên, gutter≈40, ảnh≈560×296, row pitch≈384, first top≈300, fold line≈220. Đây là thay đổi hình học để tái tạo motion, không redesign typography.
4. Dùng cùng một scalar distance cho mọi hàng: `rowTop = firstTop + rowIndex * rowPitch - distance`. `distance` lấy từ scroll thật, gain≈2 so với native input đã đo; smooth theo delta time và không chạy queue tween.
5. Texture cover ổn định. Lưới có nhiều segment để phần trên của mặt ảnh lật trở lại vùng fold; phần dưới tiếp tục đi tuyến tính. Dải còn lại giảm chiều dày rồi biến mất khi toàn mặt ảnh đã đi qua vùng gập. Không dùng scaleY toàn card.
6. Caption đi cùng đáy ảnh chưa biến dạng; chỉ bị cắt khi qua vùng điều khiển, không đi theo mép gập. Hàng B/C xuất hiện tự nhiên từ đáy stage, không opacity reveal.
7. Geometry là hàm của distance. Giảm distance phải cho lại vị trí/UV/gập tương ứng; tốc độ chỉ ảnh hưởng độ trễ và biến dạng phụ nhỏ, không thay đổi đích đến.
8. Motion off/reduced motion: vẫn đọc/mở/lọc được dự án, không quán tính hoặc gập. Không giấu nội dung nếu WebGL không sẵn sàng.

## Tiêu chí kiểm tra sau triển khai

- Desktop: năm mốc, so sánh vị trí đáy A và top B với bảng; heading/filter không trôi.
- Cuộn chậm thành bốn bước và cuộn nhanh một bước có cùng điểm cuối sau settle.
- 100→75→50→25→0 mở lại mặt ảnh; không nhảy hàng hoặc lưu trạng thái reveal.
- Thử liên tiếp down/up khi đang chạy; không có tween còn tiếp tục kéo theo hướng cũ.
- Các ảnh giữ crop nền nhất quán, không thay kích thước đối tượng bằng object-fit mỗi frame.
- Filter đổi số hàng phải reset/recompute chiều dài pin; resize và mobile không giữ kích thước desktop.
- Canvas không chặn click/focus, dialog vẫn mở/đóng. Không phát sinh lỗi console. Build và kiểm tra hình học phải pass.

Kết quả kiểm tra sau triển khai sẽ được bổ sung vào phần dưới, phân biệt rõ với quan sát nguồn và mô hình dự kiến.

## Kết quả lượt kiểm tra cuối (theo yêu cầu dừng tinh chỉnh)

Implementation giữ nguyên sau khi người dùng yêu cầu kết thúc. `npm run build` thành công (exit 0). Browser xác nhận viewport1440×900, renderer WebGL hoạt động. Một lượt wheel xuôi0.22 trang đưa distance từ0 lên395.19px; stageTop=0, hàng kế tiếp top285.44px, hàng trước còn dải gập225.19–304.32px. Một lượt wheel ngược0.22 đưa distance về0.00, card đầu khôi phục top300.00 / bottom592.63px. Không tinh chỉnh thêm sau lượt này. Một lỗi HMR cũ khi thay module đã được xử lý bằng reload; không có lỗi mới trong lượt cuộn cuối. Tab localhost được giữ mở. Không deploy hoặc kết nối GitHub.
