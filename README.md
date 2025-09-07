**English Below**

# Instagram Reel 下載器

一個簡單易用的 Instagram Reel 和影片下載工具，使用 Nuxt 3 構建，直接解析 Instagram 網頁內容獲取影片下載連結。

## DEMO
https://instag-dl.vercel.app/

## 特色

- 🎯 **直接解析**：不依賴第三方 API，直接從 Instagram 網頁解析影片網址
- 🔍 **多重搜尋**：使用 5 種不同的解析策略，確保最高成功率
- 💫 **美觀界面**：現代化的漸層設計，響應式佈局
- ⚡ **快速下載**：無需等待，直接獲取影片下載連結
- 🔧 **智能除錯**：詳細的日誌輸出，方便問題排查

## 支援格式

- Instagram Reels (`/reel/`)
- Instagram 影片貼文 (`/p/`)
- 各種 Instagram CDN 格式

## 快速開始

### 安裝依賴
```bash
npm install
```

### 啟動開發伺服器
```bash
npm run dev
```

### 使用方法
1. 打開瀏覽器訪問 `http://localhost:3000`
2. 貼上 Instagram Reel 或影片連結
3. 點擊下載按鈕
4. 等待解析完成後點擊下載

## 技術架構

- **前端**：Vue 3 + Nuxt 3 + Tailwind CSS
- **後端**：Nitro 伺服器 API 路由
- **解析策略**：
  - JSON-LD 結構化數據解析
  - Window 全域變數搜尋
  - 現代 Instagram 模組數據提取
  - 增強型正則表達式匹配
  - Embed 版本回退機制

---

# Instagram Reel Downloader

A simple and user-friendly Instagram Reel and video downloader built with Nuxt 3 that directly parses Instagram web content to extract video download links.

## Features

- 🎯 **Direct Parsing**: No third-party API dependencies, directly parses Instagram web pages for video URLs
- 🔍 **Multi-Strategy Search**: Uses 5 different parsing strategies to ensure maximum success rate
- 💫 **Beautiful UI**: Modern gradient design with responsive layout
- ⚡ **Fast Download**: No waiting time, direct video download links
- 🔧 **Smart Debugging**: Detailed logging output for easy troubleshooting

## Supported Formats

- Instagram Reels (`/reel/`)
- Instagram Video Posts (`/p/`)
- Various Instagram CDN formats

## Quick Start

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

### How to Use
1. Open browser and navigate to `http://localhost:3000`
2. Paste Instagram Reel or video link
3. Click the download button
4. Wait for parsing completion and click download

## Tech Stack

- **Frontend**: Vue 3 + Nuxt 3 + Tailwind CSS
- **Backend**: Nitro server API routes
- **Parsing Strategies**:
  - JSON-LD structured data parsing
  - Window global variable search
  - Modern Instagram module data extraction
  - Enhanced regex pattern matching
  - Embed version fallback mechanism

## Project Structure

```
ig-dl/
├── app/
│   ├── app.vue              # Root Vue component
│   └── pages/
│       └── index.vue        # Main download interface
├── server/
│   └── api/
│       └── download-reel.post.js  # Core parsing logic
├── nuxt.config.ts           # Nuxt configuration
├── package.json             # Dependencies
└── README.md               # This file
```

## API Endpoint

### POST `/api/download-reel`

**Request Body:**
```json
{
  "url": "https://www.instagram.com/reel/ABC123/"
}
```

**Response (Success):**
```json
{
  "success": true,
  "videoUrl": "https://scontent.cdninstagram.com/video.mp4"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Parsing Methods

The application uses multiple parsing strategies to extract video URLs:

1. **JSON-LD Structured Data**: Searches for `<script type="application/ld+json">` tags
2. **Window Shared Data**: Looks for `window._sharedData` global variables
3. **Modern Instagram Data**: Extracts data from Instagram's module system
4. **Enhanced Regex Patterns**: Uses comprehensive regex patterns for various URL formats
5. **Embed Version Fallback**: Attempts to parse embed version of the page

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Dependencies

- **Nuxt 3**: Full-stack Vue framework
- **@nuxtjs/tailwindcss**: Tailwind CSS integration
- **@nuxt/eslint**: ESLint configuration

## Troubleshooting

### Common Issues

1. **Video not found**: The post might be private, deleted, or Instagram changed their structure
2. **Connection refused**: Make sure the development server is running
3. **Invalid URL**: Ensure the URL is a valid Instagram reel or post URL

### Debug Information

The application provides detailed console output showing:
- HTML content analysis
- Keyword detection results
- Parsing strategy attempts
- Success/failure status for each method

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes only. Please respect Instagram's Terms of Service.

## Disclaimer

This tool is intended for personal use only. Users are responsible for complying with Instagram's terms of service and applicable laws regarding content downloading and usage.
