# Vận hành và nghiệm thu

## Triển khai Vercel

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

API upload hiện kiểm tra toàn bộ payload trước khi lưu; khi ghi metadata thất bại, ứng dụng cố xóa object vừa tải lên. Cần đối soát định kỳ các object mồ côi nếu R2/Neon lỗi giữa hai thao tác.

Trước khi triển khai dọn tự động: chạy chế độ chỉ liệt kê, kiểm tra object không còn tham chiếu, giữ khoảng chờ phục hồi và lưu bằng chứng trước khi xóa. Không xóa theo suy đoán chỉ dựa vào tên file.

AI có hạn mức 30 request/tài khoản/ngày UTC trong database; không có tự động gọi AI sau mỗi sự kiện MIDI. Theo dõi chi phí và lỗi provider trước khi tăng hạn mức.

## Phạm vi nghiệm thu còn lại

Kiểm thử cloud thật, phân quyền với hai tài khoản, kiểm thử tải lớn, tối ưu parse bằng worker khi có số đo, các tác phẩm có hồi tấu/đổi nhịp/phức điệu, chốt chính sách điểm tổng hợp, hoàn thiện giáo trình, nhắc lịch nền và kiểm thử phần cứng đều phải có bằng chứng riêng. Build thành công không đồng nghĩa các mục này đã hoàn tất.
