# Vận hành và nghiệm thu

## Triển khai Vercel

Đặt Build Command thành `npm run build:next` trên Vercel. Lệnh mặc định
`npm run build` hiện tạo Worker cho Cloudflare; xem [cấu hình Cloudflare](cloudflare.md).

1. Import repository do chủ dự án chọn. Framework Next.js; Node.js tối thiểu 22.13.
2. Tạo môi trường preview và production riêng; dùng Neon database/branch và R2 bucket phù hợp từng môi trường.
3. Đặt secret qua hệ thống biến môi trường của hosting; `BETTER_AUTH_URL` phải khớp domain HTTPS thực tế.
4. Kiểm tra migration SQL trước khi chạy `npm run db:migrate` bằng kết nối đúng database. Không chạy tự động trong build vì nhiều deployment có thể cùng thực hiện.
5. Chạy typecheck, unit tests và build. Kiểm tra riêng auth, cookie, owner isolation, upload/download và AI trên preview.
6. Chạy smoke test sau deploy, rồi mới đưa domain vào sử dụng. Giữ bản deployment trước để rollback.

Không cần Cloudflare Worker hoặc thay framework để dùng R2. Không cần WebSocket server để xử lý MIDI tại trình duyệt.

## Kiểm tra đàn thật

Ghi lại model, firmware nếu biết, hệ điều hành, trình duyệt, kết nối, thiết bị audio và ngày kiểm thử.

- USB: hệ điều hành phải thấy MIDI port. Không nhầm cổng USB chỉ cấp nguồn.
- Bluetooth: xác nhận BLE MIDI, không chỉ Bluetooth Audio; ghép nối ở hệ điều hành nếu cần.
- Trong Cài đặt: xin quyền MIDI, chọn input, nhấn từng nốt, hợp âm, nốt lặp và thử pedal.
- Kiểm tra velocity với lực nhấn khác nhau; timestamp và Note Off phải có dữ liệu thực.
- Ngắt dây/tắt đàn trong lúc giữ nốt; đảm bảo không kẹt phím và dữ liệu thiếu được đánh dấu.
- Thử Count-in, chơi liên tục, chờ hợp âm, A–B, tạm dừng/tiếp tục, phân tay và phần đệm.
- Đo độ trễ hiển thị bằng dụng cụ phù hợp; không đánh đồng thời gian callback với độ trễ từ ngón đến âm thanh.
- Nếu thử tai nghe Bluetooth, ghi rõ độ trễ đường audio; không coi đó là lỗi riêng của MIDI.

Chỉ công bố hỗ trợ tổ hợp đã thử. Fixture tự động chỉ xác minh logic ứng dụng.

## Backup và restore

Chủ dự án cần chốt thời gian mất dữ liệu tối đa và thời gian khôi phục trước phát hành production.

- Neon: chọn chính sách phục hồi phù hợp gói dịch vụ; tạo bản export mã hóa độc lập theo lịch đã thống nhất.
- R2: sao lưu file đang tham chiếu cùng metadata `assets`, không chỉ database. URL ký không phải bản sao lưu.
- Ghi một mốc thời gian chung để đối chiếu object key, byte size và SHA-256 khi phục hồi.
- Thử restore vào môi trường tách biệt, kiểm tra đăng nhập, dữ liệu hai người dùng, file, lịch, chú thích và một lượt luyện.
- Không ghi secret hoặc URL ký vào log. Sau phục hồi, chỉ chuyển traffic khi kiểm tra xong.

## Dọn file và hạn mức

API không cho phép tải thêm bản nhạc riêng (POST trả về 403). Tệp R2 đã lưu trước đây vẫn có thể tải về hoặc xóa theo quyền sở hữu; dữ liệu này không được dùng trong thư viện luyện tập.

Trước khi triển khai dọn tự động: chạy chế độ chỉ liệt kê, kiểm tra object không còn tham chiếu, giữ khoảng chờ phục hồi và lưu bằng chứng trước khi xóa. Không xóa theo suy đoán chỉ dựa vào tên file.

AI có hạn mức 30 request/tài khoản/ngày UTC trong database; không có tự động gọi AI sau mỗi sự kiện MIDI. Theo dõi chi phí và lỗi provider trước khi tăng hạn mức.

## Phạm vi nghiệm thu còn lại

Kiểm thử cloud thật, phân quyền với hai tài khoản, kiểm thử tải lớn, tối ưu parse bằng worker khi có số đo, các tác phẩm có hồi tấu/đổi nhịp/phức điệu, chốt chính sách điểm tổng hợp, hoàn thiện giáo trình, nhắc lịch nền và kiểm thử phần cứng đều phải có bằng chứng riêng. Build thành công không đồng nghĩa các mục này đã hoàn tất.

## Quản trị thư viện nhạc

### Cấu hình lần đầu

1. Cấu hình đăng nhập Better Auth/Neon như `.env.example`. Đăng ký hoặc đăng nhập tài khoản quản trị trong `/settings`; sao chép **Mã tài khoản** đang hiển thị.
2. Đặt `ADMIN_USER_IDS` ở môi trường server/hosting thành ID vừa sao chép. Nhiều admin dùng danh sách ID phân cách bằng dấu phẩy. Không dùng email, ID mẫu hoặc biến `NEXT_PUBLIC_*`. Để trống thì không ai được quản trị.
3. Cấu hình R2 private bucket qua `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`. File thư viện nằm trong prefix `library/`; không cần bật public bucket.
4. Kiểm tra và áp dụng `migrations/0002_thankful_hemingway.sql` bằng quy trình `npm.cmd run db:migrate` vào đúng database. Migration này chỉ thêm bảng `library_scores`, chỉ mục và khóa ngoại. Không chạy migration trong build. Script `docs/neon-setup.sql` đã bao gồm bảng cho database mới.
5. Khởi động lại server/deploy cấu hình, đăng nhập và mở `/admin` hoặc nút **Quản trị thư viện nhạc** trong Cài đặt.

### Thêm và phát hành bài

- Chọn MusicXML `.xml`/`.musicxml` UTF-8, tối đa 5 MB. Hệ thống kiểm tra lại file ở server và tạo dữ liệu nốt để luyện MIDI; dữ liệu nốt do trình duyệt gửi lên không được tin cậy. PDF, ảnh và MXL chưa nằm trong phiên bản quản trị này.
- Xem trước sheet, điền tên bài, tác giả, cấp độ, tempo và quyền sử dụng; bấm **Lưu bản nháp**. File gốc được lưu R2, thông tin và nốt chuẩn hóa được lưu Neon. Lưu nháp chưa làm bài xuất hiện cho người học.
- Sau khi kiểm tra, bấm **Xuất bản**. Bài hiện trong thư viện chung và danh sách chọn bài ở lịch luyện tập; trang luyện tải sheet và nốt từ cùng bản đã xuất bản. Thư viện làm mới khi mở trang hoặc quay lại tab.
- Sửa thông tin rồi lưu nháp sẽ giữ nguyên bản đang công khai cho đến lần xuất bản tiếp theo. Nút **Ẩn bài** gỡ bài khỏi thư viện và chặn tải qua URL public; không xóa file hay lịch sử luyện. Các bài tập có sẵn trong mã nguồn vẫn được giữ.
- API kiểm tra ID admin trong mọi lần đọc/sửa quản trị, kiểm tra Origin khi ghi và kiểm tra revision để tránh ghi đè thay đổi của admin khác. Khi nhận lỗi cập nhật đồng thời, mở lại bài để tải bản mới trước khi sửa tiếp.

### Giới hạn MusicXML và kiểm thử thật

Hỗ trợ score-partwise một hoặc hai bè Piano, hai khuông, hợp âm, backup/forward, nốt nối và tempo map. DTD ngoài do phần mềm ký âm xuất được loại bỏ trước khi lưu, không tải tài nguyên ngoài. DTD nội bộ/entity, nốt hoa mỹ, hồi tấu/D.C./D.S./Coda, transpose và đổi số chỉ nhịp bị từ chối với hướng dẫn chỉnh file. Hãy xuất cao độ thực và triển khai đoạn lặp thành ô nhịp liên tục.

Các test API dùng mock Neon/R2; kiểm thử trình duyệt có fixture API được ghi rõ trong tên test. Trước khi phát hành thật, thử với hai tài khoản (admin và người học), R2/Neon thật, đăng nhập/đăng xuất, file MusicXML thực tế và việc ẩn bài trên tab người học khác. Bản build thành công không xác nhận các dịch vụ thật đã được kết nối.
