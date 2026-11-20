# Piano Learning Website

Ứng dụng Next.js + React + TypeScript để học Piano trên **đàn thật qua Web MIDI**. Giao diện tiếng Việt, thiết kế desktop/laptop và responsive.

## Chạy tại máy

Yêu cầu Node.js 22.13 hoặc mới hơn. Trên PowerShell có chặn `npm.ps1`, dùng `npm.cmd`.

```powershell
npm.cmd ci
npm.cmd run dev
```

Mở http://127.0.0.1:3000. Không cần tài khoản dịch vụ để xem giáo trình, phát mẫu, nhập bản nhạc và dùng MIDI cục bộ. Quyền MIDI và audio do trình duyệt quản lý; âm thanh bắt đầu sau thao tác người dùng.

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

Playwright dùng Chrome đã cài trên máy. Playwright tự khởi động server nếu chưa chạy. Các test MIDI dùng fixture có nhãn rõ; **không thay thế kiểm chứng Victor VT02**.

## Cấu hình dịch vụ thật

Sao chép `.env.example` thành `.env.local` và điền cấu hình ở máy cá nhân. Không gửi secret vào chat, không đặt secret trong biến `NEXT_PUBLIC_*`, không commit `.env.local`.

- **Neon PostgreSQL**: `DATABASE_URL` của database dành riêng cho dự án.
- **Better Auth**: `BETTER_AUTH_SECRET` ngẫu nhiên ít nhất 32 ký tự; `BETTER_AUTH_URL` là URL chính xác của ứng dụng. Bản triển khai hiện dùng email/mật khẩu, mật khẩu tối thiểu 12 ký tự, hashing do Better Auth thực hiện.
- **Cloudflare R2**: account ID, bucket riêng tư và access key chỉ có quyền bucket cần dùng. Không bật public bucket cho file cá nhân.
- **AI**: đặt `AI_PROVIDER=openai` hoặc `gemini`, `AI_MODEL` và key tương ứng. Không tự chọn model hoặc sử dụng tiền trong tài khoản khi chưa có cấu hình. Adapter không thay đổi điểm MIDI.

Migration đã được sinh trong `migrations/`. Chỉ chạy khi `DATABASE_URL` trỏ đúng môi trường dự án:

```powershell
npm.cmd run db:migrate
```

Không có kết nối Neon/R2/AI thật trong lần kiểm thử ban đầu do chưa có `.env.local`. Không có bucket, tài khoản, database hay deployment nào được tạo tự động.

## Những luồng đã triển khai

Ảnh kiểm tra giao diện: [desktop](docs/screenshots/dashboard-desktop.png), [mobile](docs/screenshots/dashboard-mobile.png), [không gian luyện](docs/screenshots/practice-desktop.png).

- Tổng quan dùng dữ liệu thực, giáo trình năm cấp độ, bài học gốc, minh họa số ngón, kiểm tra kiến thức và hướng dẫn thực hành MIDI.
- OSMD hiển thị MusicXML; VexFlow thông qua OSMD phục vụ ký âm và đánh dấu trực tiếp. Định danh nốt độc lập tọa độ màn hình.
- Web MIDI nhận Note On/Off, channel, velocity, timestamp, CC64; tách trạng thái phím khỏi pedal và phục hồi khi mất kết nối.
- Chờ nốt/hợp âm, luyện riêng tay, tempo, Count-in, metronome, nghe mẫu, phần đệm, đoạn A–B và lưu lượt luyện.
- Thuật toán đo cao độ, nốt sai/thiếu/thừa, thời điểm và trường độ. Dung sai hiện là **thử nghiệm**, chưa có điểm tổng hợp có trọng số được phê duyệt.
- Thư viện bài tập gốc, nhập MIDI/MusicXML cá nhân, phân tay suy luận và sửa gán bè.
- Gam trưởng/thứ tự nhiên, quãng tám, hợp âm ba/bảy át, đảo hợp âm, chuyển hợp âm và arpeggio.
- Ghi chú, màu, đánh dấu nốt, số ngón cá nhân, lịch lặp, mục tiêu và tiến độ dạng bảng.
- Backend Better Auth/Neon, đồng bộ snapshot có chống ghi đè phiên bản, file R2 riêng tư và AI Tutor có hạn mức.

## Lưu dữ liệu

Dữ liệu cục bộ nằm trong IndexedDB, có đọc dữ liệu localStorage cũ và fallback khi cần. Trình duyệt riêng tư hoặc dọn dữ liệu website có thể xóa dữ liệu này. Đồng bộ Neon chỉ xảy ra khi người dùng chọn trong Cài đặt; dữ liệu không tự công khai.

Schema quan hệ gồm dữ liệu giáo trình, bản nhạc, phiên bản, bài tập, buổi/lượt luyện, kết quả, lỗi, lịch, mục tiêu và auth. Trong bản hiện tại, UI cục bộ đồng bộ qua `learning_workspaces`; các bảng nghiệp vụ chuẩn hóa được chuẩn bị cho bước lưu chi tiết tiếp theo. Không gọi đây là cơ chế persistence chuẩn hóa hoàn chỉnh.

Không lưu file nhị phân vào PostgreSQL. API R2 kiểm tra file trước khi lưu, xác thực chủ sở hữu khi tải/xóa và cấp URL GET 60 giây. Không có URL public cho file cá nhân. Không lưu hoặc phát lại toàn bộ màn biểu diễn.

## Giới hạn cần nghiệm thu

- Chưa thử đàn Victor VT02, Bluetooth MIDI, độ trễ vật lý hoặc âm thanh trên phần cứng của người dùng.
- Bộ chuyển MIDI hiện lượng tử hóa 1/16 và từ chối trường hợp bè chồng/nốt qua ô nhịp mà bộ chuyển đơn giản không biểu diễn đúng. Dùng MusicXML để bảo toàn ký âm phức tạp. `.mxl` cần giải nén trước.
- MusicXML hiện hỗ trợ `score-partwise`; không thực hiện lặp dấu hồi tấu/Da Capo như bộ giải diễn tấu đầy đủ. Cần kiểm chứng trước khi dùng chấm tác phẩm có cấu trúc đó.
- Thế bấm là heuristic có thể sửa, không tối ưu cho mọi tay/giọng/bản nhạc. MIDI không đo ngón tay thực tế.
- Giáo trình hiện là nội dung khởi đầu; chưa phải giáo trình chuyên môn hoàn chỉnh được giáo viên thẩm định cho mọi cấp độ.
- Nhắc lịch hiện chạy khi website đang mở. Chưa triển khai Web Push/email khi trang đóng.
- Chưa kết nối dịch vụ thật, chưa kiểm tra backup/restore thực tế, chưa deploy production.

Không bổ sung những chức năng bị loại như microphone, Audio-to-MIDI, Piano ảo thay thế đàn thật, biểu đồ tiến bộ theo thời gian, huy hiệu, chức năng độc lập 15/21/22/23/25/28 hoặc các tiểu chức năng bị loại trong yêu cầu gốc.

## Tài liệu vận hành

Xem [kết quả kiểm tra và phần chưa nghiệm thu](docs/verification.md) để phân biệt tính năng đã kiểm thử với các tích hợp còn thiếu cấu hình.

Các nhóm file mới: `src/app` (trang và API), `src/components` (khung và renderer), `src/features` (luồng học), `src/music` (mô hình/MIDI/audio/đánh giá), `src/server` (auth/Neon/R2), `migrations` (schema SQL), `public/lessons` (ảnh/video/phụ đề gốc), `tests` (unit và trình duyệt). Cấu hình chạy nằm ở các file `package.json`, `tsconfig.json`, `next.config.ts`, `drizzle.config.ts`, `vitest.config.ts`, `playwright.config.ts` và `.env.example`.

Xem [docs/operations.md](docs/operations.md) để cấu hình deployment, sao lưu, phục hồi và kiểm thử đàn thật. Tài nguyên video/ảnh gốc có thể tạo lại bằng `node scripts/generate-lesson-media.mjs`.
