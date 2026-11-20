# Kết quả kiểm tra — 17/11/2026

Môi trường: Windows, Node.js 22.13, Next.js 16.4.6. Các kiểm thử trình duyệt dùng Chrome headless và profile tách biệt với Chrome cá nhân.

## Đã đạt

- TypeScript và build production; các trang học được prerender, API riêng tư chạy động theo cấu hình Next.js.
- Unit tests: Note On/Off, velocity, pedal, channel/device, nốt lặp, phục hồi mất Note Off, ghép nốt một–một, thiếu/thừa/sai nốt, thời điểm/trường độ, thay đổi tempo, hợp âm chế độ chờ, ký âm và dấu chấm dôi, số ngón gam và số đo kỹ năng.
- Bộ E2E chính gồm 6 trường hợp: MIDI đi hết bài và lưu kết quả; điều hướng/desktop/mobile; OSMD ánh xạ đủ nốt và chú thích giữ sau reload; lịch và hoàn thành buổi; chỉ chọn nhạc hệ thống và chặn tải bản nhạc riêng; API từ chối truy cập ẩn danh/nguồn ghi không hợp lệ.
- Kiểm thử E2E bổ sung: gam hai tay có 30 nốt hiển thị/ánh xạ, số ngón đầu tay trái là 5, trang kỹ năng không hiện kết quả giả khi chưa có dữ liệu.
- `npm audit`: không phát hiện lỗ hổng sau cập nhật dependency.
- `db:generate`: schema 41 bảng hợp lệ, chạy lại không tạo thay đổi ngoài dự kiến. Chưa áp dụng migration vào database.
- Đã kiểm tra ảnh desktop và mobile; ảnh nằm trong `docs/screenshots/`.

Trong quá trình kiểm tra đã sửa MusicXML tempo thiếu `direction-type` làm OSMD bỏ ô nhịp đầu, việc OSMD tự render lại làm mất ánh xạ, tạm dừng phát mẫu, thời gian nghỉ, ngưỡng trường độ, tính chỉ số khi thiếu dữ liệu và gợi ý ngón tay trái.

## Chưa được nghiệm thu

- Victor VT02, USB/Bluetooth MIDI và độ trễ vật lý trên phần cứng thật.
- Neon, Better Auth trên database thật, phân quyền giữa hai tài khoản thực, R2 và API AI: chưa có `.env.local`.
- Backup/restore thật, tác vụ nhắc lịch khi đóng trang, triển khai Vercel và giám sát production.
- Persistence nghiệp vụ chuẩn hóa hoàn chỉnh: bản hiện tại đồng bộ snapshot riêng tư có phiên bản; các bảng nghiệp vụ đã có schema nhưng chưa được nối đầy đủ.
- Chính sách điểm tổng hợp có trọng số, giáo trình chuyên môn toàn diện và độ chính xác của mọi loại ký âm phức tạp.

Đây là bản đầu tiên có thể chạy và kiểm tra cục bộ, không phải tuyên bố đã hoàn thành nghiệm thu toàn bộ 21 tính năng.

## Bổ sung thư viện quản trị — 21/11/2026

Đã bổ sung unit test đọc MusicXML và API quản trị: phân quyền theo ID, chặn giả quyền/cross-origin, lưu nháp từ dữ liệu đã kiểm tra ở server, xuất bản tường minh, sửa nháp giữ nguyên bản công khai, ẩn bài và kiểm tra revision. Test E2E quản trị sử dụng API fixture cho luồng xem trước/lưu/xuất bản/ẩn; kiểm tra chặn truy cập ẩn danh dùng API thật tại môi trường kiểm thử. Chưa chạy migration, cấp quyền admin hoặc kết nối Neon/R2 thật trong lần triển khai mã nguồn này.

Kết quả kiểm tra bổ sung: 41 unit test đạt; 4 E2E liên quan thư viện/quản trị đạt (gồm fixture API cho thao tác admin); build Next.js production đạt. Đã xem ảnh quản trị ở desktop và mobile, không có tràn ngang trên màn hình 390 px.
Build gói Cloudflare/OpenNext cũng hoàn tất, đã tạo `.open-next/worker.js`. Chưa deploy hoặc áp dụng thay đổi lên dịch vụ thật.
