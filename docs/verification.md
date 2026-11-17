# Kết quả kiểm tra — 17/11/2026

Môi trường: Windows, Node.js 22.13, Next.js 16.4.6. Các kiểm thử trình duyệt dùng Chrome headless và profile tách biệt với Chrome cá nhân.

## Đã đạt

- TypeScript và build production; các trang học được prerender, API riêng tư chạy động theo cấu hình Next.js.
- 17 unit tests: Note On/Off, velocity, pedal, channel/device, nốt lặp, phục hồi mất Note Off, ghép nốt một–một, thiếu/thừa/sai nốt, thời điểm/trường độ, thay đổi tempo, hợp âm chế độ chờ, ký âm và dấu chấm dôi, luyện tai, số ngón gam và số đo kỹ năng.
- Bộ E2E chính gồm 6 trường hợp: MIDI đi hết bài và lưu kết quả; điều hướng/desktop/mobile; OSMD ánh xạ đủ nốt và chú thích giữ sau reload; lịch và hoàn thành buổi; nhập MusicXML cá nhân; API từ chối truy cập ẩn danh/nguồn ghi không hợp lệ.
- Kiểm thử E2E bổ sung: gam hai tay có 30 nốt hiển thị/ánh xạ, số ngón đầu tay trái là 5, trang kỹ năng không hiện kết quả giả khi chưa có dữ liệu.
- `npm audit`: không phát hiện lỗ hổng sau cập nhật dependency.
- `db:generate`: schema 40 bảng hợp lệ, chạy lại không tạo thay đổi ngoài dự kiến. Chưa áp dụng migration vào database.
- Đã kiểm tra ảnh desktop và mobile; ảnh nằm trong `docs/screenshots/`.

Trong quá trình kiểm tra đã sửa MusicXML tempo thiếu `direction-type` làm OSMD bỏ ô nhịp đầu, việc OSMD tự render lại làm mất ánh xạ, tạm dừng phát mẫu, thời gian nghỉ, ngưỡng trường độ, tính chỉ số khi thiếu dữ liệu và gợi ý ngón tay trái.

## Chưa được nghiệm thu

- Victor VT02, USB/Bluetooth MIDI và độ trễ vật lý trên phần cứng thật.
- Neon, Better Auth trên database thật, phân quyền giữa hai tài khoản thực, R2 và API AI: chưa có `.env.local`.
- Backup/restore thật, tác vụ nhắc lịch khi đóng trang, triển khai Vercel và giám sát production.
- Persistence nghiệp vụ chuẩn hóa hoàn chỉnh: bản hiện tại đồng bộ snapshot riêng tư có phiên bản; các bảng nghiệp vụ đã có schema nhưng chưa được nối đầy đủ.
- Chính sách điểm tổng hợp có trọng số, giáo trình chuyên môn toàn diện và độ chính xác của mọi loại ký âm phức tạp.

Đây là bản đầu tiên có thể chạy và kiểm tra cục bộ, không phải tuyên bố đã hoàn thành nghiệm thu toàn bộ 21 tính năng.
