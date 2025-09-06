# CLAUDE.md - 專案開發指引

## 重要注意事項

### Tailwind CSS 設定
- **請使用 @nuxtjs/tailwindcss 而非 @nuxt/ui**
- @nuxt/ui 可能會干擾 Tailwind CSS 的樣式渲染（例如漸層背景無法正常顯示）
- 除非有特殊需求，否則優先使用純 Tailwind CSS 來確保樣式的可預測性

### API 服務配置

#### 核心技術 - Instagram 直接爬取
專案使用純原生爬取技術，不依賴任何第三方 API：

**多重解析策略**：
1. **JSON-LD 結構化數據** - Instagram 標準的元數據格式
2. **window._sharedData** - Instagram 的傳統全域 JavaScript 變數  
3. **現代模組系統** - 解析 `__d()` 函數和 GraphQL 響應
4. **強化正則匹配** - 支援多種 Instagram CDN 格式
5. **Embed 版本備案** - 嘗試嵌入版本頁面

**技術特點**：
- ✅ **完全自主** - 不需要任何 API 金鑰或第三方服務
- ✅ **無使用限制** - 不受 API 配額或費用限制
- ✅ **最高品質** - 直接從 Instagram CDN 獲取原始影片
- ✅ **真實模擬** - 完整瀏覽器請求頭，不易被封鎖
- ✅ **高成功率** - 五種解析方法並行，適應 Instagram 結構變化
- ✅ **智能過濾** - 自動排除縮圖和個人照片
- ✅ **穩定可靠** - 單一方案，減少複雜性和潛在錯誤點

## 常見問題處理

### Nuxt 開發伺服器連接問題
如果遇到 `ECONNREFUSED /var/folders/.../nuxt-dev-*.sock` 錯誤：

```bash
# 1. 終止所有 node 進程
pkill -f "npm run dev"

# 2. 清理臨時 socket 檔案
rm -rf /var/folders/*/T/nuxt-dev-*

# 3. 清理快取
rm -rf .nuxt .output node_modules/.cache

# 4. 重新啟動
npm run dev
```

### 其他常見指令
```bash
# 完全重置專案
npm run build
npm run preview

# 檢查 port 使用情況
lsof -ti:3001 | xargs kill -9
```

## 專案資訊
- 框架：Nuxt 3
- CSS：Tailwind CSS
- 開發伺服器：http://localhost:3001/
- API 端點：/api/download-reel