# TabManagerSP

Phiên bản **2.1.1**. Tên cũ của bản 1.x là Muse Manager.

TabManagerSP là trình duyệt đa hồ sơ dạng portable cho Windows. Mỗi tab gắn với một **hồ sơ độc lập**, có cookie, phiên đăng nhập và bộ nhớ trang web riêng. Nhờ vậy có thể đăng nhập nhiều tài khoản Muse AI, Gmail, Facebook… cùng lúc trong một cửa sổ, thay vì phải mở nhiều profile Chrome.

## Tính năng

### Hồ sơ và tab
- **Tab theo hồ sơ.** Mỗi hồ sơ là một "trình duyệt" riêng. Nhiều tab cùng hồ sơ thì dùng chung đăng nhập, giống Chrome.
- **Nhóm tab tự động.** Hồ sơ nào có từ 2 tab trở lên thì các tab đó được gom thành một nhóm, mang tên và màu của hồ sơ, giống tab group của Chrome. Thao tác với nhóm:
  - Bấm tên nhóm để thu gọn hoặc mở rộng.
  - Kéo tên nhóm để di chuyển cả nhóm.
  - Chuột phải vào tên nhóm để mở tab mới trong nhóm hoặc đóng cả nhóm.
- **Thanh hồ sơ bên trái.** Bấm một hồ sơ để chuyển tới tab của nó. Ctrl + bấm để luôn mở tab mới.
- **30 màu nhận diện** cho hồ sơ, cộng thêm ô chọn màu tùy ý.
- Mỗi hồ sơ có **trang khởi động** riêng.
- Có thể **mở trang đang xem bằng hồ sơ khác**, hoặc mở trong **tab ẩn danh** (đăng nhập không được lưu).

### Dashboard tài khoản
Nút **Dashboard** nằm ở góc dưới bên trái, ngay trên nút tạo hồ sơ. Bấm vào sẽ mở một trang sơ đồ mindmap: mỗi hồ sơ là một gốc, mỗi nhánh có dạng "Trang: tài khoản".

- Bấm vào nhánh để mở đúng link đó bằng đúng hồ sơ. Nếu hồ sơ đã có tab ở trang đó thì ứng dụng chuyển sang tab ấy, không mở thêm tab.
- Di chuột vào nhánh để sửa **chữ hiển thị** và **link**, đổi thứ tự hoặc xóa nhánh. Có sẵn nút chọn nhanh các trang phổ biến.
- Nhánh mẫu gồm YouTube, Google, TikTok, Muse, Gemini, Facebook, Claude và Flow (`labs.google/fx/tools/flow`). Phần tài khoản được điền sẵn từ ô Ghi chú của hồ sơ.
- Nội dung trên sơ đồ là ghi chú do bạn tự nhập. Ứng dụng không tự đọc tài khoản đang đăng nhập trên các trang.

### Thanh dấu trang
- Thanh dấu trang nằm dưới thanh địa chỉ, dùng chung cho mọi hồ sơ. Bấm vào dấu trang sẽ mở trang bằng hồ sơ của tab đang xem.
- Thêm dấu trang: bấm ☆ trên thanh địa chỉ hoặc `Ctrl+D`. Ẩn hoặc hiện thanh: `Ctrl+Shift+B`.
- Hỗ trợ thư mục và kéo thả để sắp xếp. Chuột phải vào thanh để **nhập dấu trang từ Chrome, Edge, Brave, Cốc Cốc**.

### Lưu và tự điền mật khẩu
Lõi Chromium trong ứng dụng không có trình quản lý mật khẩu của Chrome, nên TabManagerSP có trình quản lý riêng:

- **Lưu.** Sau khi đăng nhập trên một trang, một thanh hiện ra hỏi "Lưu mật khẩu?". Bạn chọn Lưu, Không bao giờ, hoặc đóng thanh.
- **Tự điền.** Nếu trang chỉ có 1 tài khoản đã lưu thì ứng dụng tự điền. Nếu có nhiều tài khoản thì một danh sách hiện ra để chọn. Biểu tượng 🔑 trên thanh địa chỉ cũng dùng để điền.
- **Riêng từng hồ sơ.** Mật khẩu lưu ở hồ sơ nào chỉ dùng trong hồ sơ đó, không áp dụng cho tab ẩn danh.
- **Quản lý.** Vào **Quản lý → Mật khẩu** để xem, sao chép hoặc xóa mật khẩu, thêm mật khẩu thủ công, và **nhập file CSV xuất từ Chrome** (`chrome://password-manager/settings` → Xuất mật khẩu).
- **Mã hóa.** Mật khẩu được mã hóa bằng tài khoản Windows (DPAPI). Nếu chép thư mục dữ liệu sang máy hoặc tài khoản Windows khác thì mật khẩu không đọc được, cần nhập lại. Hồ sơ và đăng nhập không bị ảnh hưởng.

### Khác
- **Mở bằng trình duyệt trên máy.** Ứng dụng tự tìm Chrome, Edge, Brave, Cốc Cốc, Vivaldi cùng các profile của chúng. Một cú bấm là mở trang hiện tại bằng đúng profile đó.
- **Khôi phục phiên.** Lần sau mở ứng dụng, các tab cũ được mở lại. Tab chỉ tải khi được chọn.
- Tìm trong trang, thu phóng, tải file, in, toàn màn hình, mở lại tab vừa đóng.

## Tải về và chạy

Bản build cho Windows được GitHub Actions tạo tự động:

1. Vào tab **Actions** của repo, chọn lần chạy mới nhất của workflow **Build Windows Portable**.
2. Ở mục **Artifacts**, tải `TabManagerSP-Windows-Portable`.

| Bản | Cách dùng | Ghi chú |
|---|---|---|
| `TabManagerSP-2.1.1-win-x64.zip` | Giải nén, chạy `TabManagerSP.exe` | **Khuyên dùng.** Khởi động nhanh. |
| `TabManagerSP-2.1.1-Portable.exe` | Chạy trực tiếp | Gọn 1 file nhưng mỗi lần mở chậm hơn vài giây. |

Dữ liệu nằm trong thư mục `TabManagerSP-Data`, ngay cạnh file chạy. File chưa ký số nên lần đầu chạy Windows có thể cảnh báo. Bấm **More info → Run anyway**.

### Nâng cấp từ Muse Manager 1.x (giữ nguyên hồ sơ và đăng nhập)

1. Đóng Muse Manager.
2. Giải nén bản mới **đè vào thư mục của bản cũ**, hoặc chép thư mục `MuseManager-Data` sang cạnh `TabManagerSP.exe`.
3. Chạy `TabManagerSP.exe`. Lần đầu chạy, ứng dụng tự đổi tên `MuseManager-Data` thành `TabManagerSP-Data`.
4. Có thể xóa `MuseManager.exe` cũ.

## Phím tắt chính

| Phím | Tác dụng |
|---|---|
| `Ctrl+T` | Tab mới (chọn hồ sơ) |
| `Ctrl+Shift+N` | Tab ẩn danh |
| `Ctrl+W` / `Ctrl+Shift+T` | Đóng tab / mở lại tab vừa đóng |
| `Ctrl+Tab` | Chuyển tab |
| `Ctrl+L` | Chọn thanh địa chỉ |
| `Ctrl+D` | Thêm dấu trang |
| `Ctrl+Shift+B` | Hiện hoặc ẩn thanh dấu trang |
| `Ctrl+F` | Tìm trong trang |

Danh sách đầy đủ có trong **Quản lý → Phím tắt & giới thiệu**.

## Lưu ý quan trọng

- **Đăng nhập Google.** Google hay chặn đăng nhập trong trình duyệt nhúng. Ứng dụng có **Chế độ tương thích đăng nhập Google** (bật sẵn): riêng trang `accounts.google.com` sẽ được giả lập là Firefox. Nếu vẫn bị chặn, dùng nút **Mở bằng trình duyệt trên máy**.
- **Không dùng được extension của Chrome.** Trang có DRM như Netflix có thể không phát được.
- **Bảo mật.** Thư mục `TabManagerSP-Data` chứa phiên đăng nhập của mọi hồ sơ. Ai có thư mục này là dùng được các tài khoản đó, nên đừng chia sẻ thư mục.

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

Kết quả nằm trong thư mục `dist/`. Muốn có file tải về trong mục Releases, hãy đẩy tag dạng `v2.1.1` lên GitHub.

## Cấu trúc mã

```
src/main/main.js        Khởi động, cửa sổ, IPC, phím tắt
src/main/tabs.js        Tab (WebContentsView + partition riêng mỗi hồ sơ), nhóm tab
src/main/store.js       Hồ sơ, cài đặt, dấu trang, nhánh dashboard (config.json)
src/main/passwords.js   Kho mật khẩu mã hóa (passwords.json), nhập CSV
src/main/paths.js       Thư mục dữ liệu portable, chuyển dữ liệu từ bản 1.x
src/main/useragent.js   User-Agent và chế độ tương thích đăng nhập Google
src/main/browsers.js    Dò trình duyệt trên máy, mở theo profile, đọc dấu trang
src/main/menus.js       Menu chuột phải và menu native
src/preload/preload.js  Cầu nối giao diện ↔ tiến trình chính
src/preload/page.js     Chạy trong trang web: phát hiện đăng nhập, tự điền mật khẩu
src/renderer/           Giao diện: app.js (lõi), bookmarks.js, passwords-ui.js, dashboard.js
```

Công nghệ sử dụng: Electron 44 (Chromium 152) và electron-builder.
