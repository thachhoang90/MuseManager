# Muse Manager

Trình duyệt đa hồ sơ dạng portable cho Windows. Mỗi tab gắn với một **hồ sơ độc lập** (cookie, phiên đăng nhập, bộ nhớ trang web riêng), nên có thể đăng nhập nhiều tài khoản Muse AI, Gmail, Facebook… cùng lúc trong một cửa sổ, thay vì phải mở nhiều profile Chrome.

## Tính năng

- **Tab theo hồ sơ.** Mỗi hồ sơ là một "trình duyệt" riêng. Tab có dải màu và nhãn viết tắt của hồ sơ để biết đang ở tài khoản nào. Nhiều tab cùng hồ sơ thì dùng chung đăng nhập, giống Chrome.
- **Thanh hồ sơ bên trái.** Bấm một hồ sơ để chuyển tới tab của nó (chưa có thì mở tab mới). Ctrl + bấm để luôn mở tab mới.
- **Trang khởi động riêng cho từng hồ sơ**, ví dụ đặt sẵn trang Muse AI để tab mới mở thẳng vào đó.
- **Mở trang hiện tại bằng hồ sơ khác** (bấm vào nhãn hồ sơ trên thanh địa chỉ, hoặc chuột phải vào liên kết).
- **Tab ẩn danh**: hồ sơ tạm trong RAM, đóng tab là mất đăng nhập. Hợp để thử nhanh một tài khoản.
- **Mở bằng trình duyệt trên máy.** Ứng dụng tự tìm Chrome, Edge, Brave, Cốc Cốc, Vivaldi cùng danh sách profile của chúng. Một cú bấm là mở trang hiện tại bằng đúng profile đó.
- **Khôi phục phiên**: lần sau mở lại sẽ có đủ các tab cũ. Tab chỉ tải khi được chọn để tiết kiệm RAM.
- Các tiện ích quen thuộc của trình duyệt: tìm trong trang, thu phóng, tải file, in, toàn màn hình, kéo thả sắp xếp tab, mở lại tab vừa đóng, công cụ nhà phát triển.

## Tải về và chạy

Bản build cho Windows được GitHub Actions tạo tự động sau mỗi lần cập nhật mã:

1. Vào tab **Actions** của repo → chọn lần chạy mới nhất của workflow **Build Windows Portable**.
2. Ở mục **Artifacts**, tải `MuseManager-Windows-Portable` (một file zip chứa hai bản bên dưới).

| Bản | Cách dùng | Ghi chú |
|---|---|---|
| `MuseManager-x.y.z-win-x64.zip` | Giải nén vào một thư mục, chạy `MuseManager.exe` | **Khuyên dùng.** Khởi động nhanh. |
| `MuseManager-x.y.z-Portable.exe` | Chạy trực tiếp file .exe | Gọn 1 file nhưng mỗi lần mở phải tự giải nén nên chậm hơn vài giây. |

Không cần cài đặt. Dữ liệu được lưu trong thư mục `MuseManager-Data` nằm cạnh file chạy.

File chưa được ký số nên lần đầu chạy Windows có thể hiện "Windows protected your PC". Bấm **More info → Run anyway**.

## Cách dùng nhanh

1. Bấm **Tạo hồ sơ đầu tiên**, đặt tên (ví dụ `Muse AI 1`), ghi chú email và dán địa chỉ trang Muse AI vào ô **Trang khởi động**.
2. Tab của hồ sơ mở ra. Đăng nhập tài khoản như trên Chrome. Đăng nhập được lưu lại cho lần sau.
3. Tạo thêm hồ sơ cho từng tài khoản khác, rồi chuyển qua lại bằng thanh hồ sơ bên trái hoặc nút **+** trên thanh tab.

Phím tắt chính: `Ctrl+T` tab mới (chọn hồ sơ), `Ctrl+W` đóng tab, `Ctrl+Shift+T` mở lại tab vừa đóng, `Ctrl+Tab` chuyển tab, `Ctrl+Shift+N` tab ẩn danh, `Ctrl+L` thanh địa chỉ, `Ctrl+F` tìm trong trang. Danh sách đầy đủ ở **Quản lý → Phím tắt & giới thiệu**.

## Lưu ý quan trọng

- **Đăng nhập Google.** Google hay chặn đăng nhập trong các trình duyệt nhúng ("Trình duyệt hoặc ứng dụng này có thể không an toàn"). Ứng dụng có **Chế độ tương thích đăng nhập Google** (bật sẵn trong Cài đặt): chỉ riêng trang `accounts.google.com` sẽ được giả lập là Firefox. Cách này thường giúp đăng nhập được, nhưng Google có thể đổi chính sách bất cứ lúc nào. Nếu vẫn bị chặn, dùng nút **Mở bằng trình duyệt trên máy** để mở trang đó bằng Chrome/Edge thật.
- **Không dùng được extension của Chrome.** Hồ sơ của ứng dụng không chạy tiện ích mở rộng.
- **Không nhập được đăng nhập từ profile Chrome sẵn có.** Chrome mã hóa cookie theo máy và theo trình duyệt, nên mỗi hồ sơ trong ứng dụng cần đăng nhập một lần. Sau đó đăng nhập được giữ lại.
- **Trang có DRM** (Netflix, một số trang phim) có thể không phát được do Electron không kèm Widevine.
- **Bảo mật.** Thư mục `MuseManager-Data` chứa phiên đăng nhập của mọi hồ sơ. Ai có thư mục này có thể dùng các tài khoản đó. Không chia sẻ thư mục, cẩn thận khi để bản portable trên USB.
- Có thể sao chép cả thư mục ứng dụng (gồm `MuseManager-Data`) sang máy khác để mang theo các phiên đăng nhập. Một số trang có thể yêu cầu đăng nhập lại khi phát hiện đổi máy.

## Build từ mã nguồn

Yêu cầu Node.js 22 trở lên.

```bash
npm install
```

```bash
npm start
```

```bash
npm run dist:win
```

Kết quả nằm trong thư mục `dist/`. Lệnh `dist:win` chạy được cả trên Windows lẫn Linux.

Muốn phát hành bản chính thức kèm file tải về trong mục Releases: tạo tag dạng `v1.0.0` và đẩy lên GitHub, workflow sẽ tự đính kèm file vào Release.

## Cấu trúc mã

```
src/main/main.js      Khởi động app, cửa sổ, IPC, phím tắt
src/main/tabs.js      Quản lý tab: mỗi tab là một WebContentsView với partition riêng của hồ sơ
src/main/store.js     Lưu hồ sơ, cài đặt, phiên làm việc (config.json)
src/main/paths.js     Xác định thư mục dữ liệu portable
src/main/useragent.js User-Agent và chế độ tương thích đăng nhập Google
src/main/browsers.js  Dò Chrome/Edge/Brave/Cốc Cốc trên máy và mở theo profile
src/main/menus.js     Menu chuột phải và menu native
src/preload/          Cầu nối an toàn giữa giao diện và tiến trình chính
src/renderer/         Giao diện (thanh tab, thanh hồ sơ, hộp thoại)
```

Công nghệ: Electron 44 (Chromium 152), electron-builder.
