# CLAUDE.md - 專案開發指引

## 重要注意事項

### Tailwind CSS 設定
- **請使用 @nuxtjs/tailwindcss 而非 @nuxt/ui**
- @nuxt/ui 可能會干擾 Tailwind CSS 的樣式渲染（例如漸層背景無法正常顯示）
- 除非有特殊需求，否則優先使用純 Tailwind CSS 來確保樣式的可預測性

## 專案資訊
- 框架：Nuxt 3
- CSS：Tailwind CSS
- 開發伺服器：http://localhost:3001/