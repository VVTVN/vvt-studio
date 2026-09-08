# VVT Demo API

Cloudflare Worker phục vụ chatbot VVT Digital và endpoint nhận lead demo.

## Endpoints

- `GET /api/health`
- `POST /api/chat`
- `POST /api/lead-capture`

## Cloudflare secrets

Các giá trị này chỉ cấu hình tại Cloudflare, không commit lên GitHub:

- `GEMINI_API_KEY`
- `TELEGRAM_BOT_TOKEN` (tùy chọn)
- `TELEGRAM_CHAT_ID` (tùy chọn)

## Cloudflare Builds

Chọn thư mục gốc `worker` và dùng lệnh deploy:

```sh
npx wrangler deploy
```
