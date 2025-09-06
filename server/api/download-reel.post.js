// 主要處理器：接收前端請求，協調不同下載服務
export default defineEventHandler(async (event) => {
  // 解析請求內容：從請求體中取得 URL
  const body = await readBody(event)
  const { url } = body

  // 輸入驗證：確保提供了 URL
  if (!url) {
    return {
      success: false,
      error: '請提供 Instagram Reel 連結'
    }
  }

  // URL 格式驗證：檢查是否為有效的 Instagram 連結
  if (!url.includes('instagram.com/reel/') && !url.includes('instagram.com/p/')) {
    return {
      success: false,
      error: '請提供有效的 Instagram Reel 連結'
    }
  }

  try {
    // 嘗試多個下載方案：依序嘗試直到成功
    
    // 方案 1: 使用 igram.world 服務 (開源、免費)
    const igramResponse = await tryIgramWorld(url)
    if (igramResponse) {
      return {
        success: true,
        videoUrl: igramResponse
      }
    }

    // 方案 2: 使用 snapinsta.app 的方法
    const snapInstaResponse = await trySnapInsta(url)
    if (snapInstaResponse) {
      return {
        success: true,
        videoUrl: snapInstaResponse
      }
    }

    // 方案 3: 使用 fastdl.app
    const fastDlResponse = await tryFastDl(url)
    if (fastDlResponse) {
      return {
        success: true,
        videoUrl: fastDlResponse
      }
    }

    // 所有方案都失敗：返回詳細錯誤訊息
    return {
      success: false,
      error: '無法下載此影片。由於 Instagram 的限制，請嘗試以下方法：\n1. 使用瀏覽器擴充功能\n2. 使用線上服務如 snapinsta.app 或 igram.world\n3. 確保影片是公開的'
    }
  } catch (error) {
    // 捕獲意外錯誤：記錄並返回通用錯誤訊息
    console.error('Error:', error)
    return {
      success: false,
      error: '處理請求時發生錯誤'
    }
  }
})

// 下載方案 1：igram.world API
// 使用公開的 API 端點進行影片下載
async function tryIgramWorld(url) {
  try {
    // 發送 POST 請求到 igram.world API
    const response = await fetch('https://igram.world/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // 模擬瀏覽器請求以避免被阻擋
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      // URL 編碼參數
      body: `url=${encodeURIComponent(url)}`
    })

    // 解析響應：提取影片 URL
    if (response.ok) {
      const data = await response.json()
      // 檢查響應格式並返回第一個影片連結
      if (data && data.url && data.url[0]) {
        return data.url[0].url
      }
    }
  } catch (error) {
    // 記錄失敗但不中斷流程，繼續嘗試其他方案
    console.log('igram.world failed:', error)
  }
  return null
}

// 下載方案 2：SnapInsta 服務
// 使用網頁擷取方式解析影片連結
async function trySnapInsta(url) {
  try {
    // 構建表單數據
    const formData = new URLSearchParams()
    formData.append('url', url)
    formData.append('lang', 'en')  // 使用英文介面

    // 發送請求到 SnapInsta 處理端點
    const response = await fetch('https://snapinsta.app/action.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // 偽裝請求來源以模擬正常瀏覽器行為
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://snapinsta.app',
        'Referer': 'https://snapinsta.app/'
      },
      body: formData.toString()
    })

    // 解析 HTML 響應
    if (response.ok) {
      const html = await response.text()
      // 使用正則表達式提取 MP4 影片連結
      const videoMatch = html.match(/href="(https?:\/\/[^"]*\.mp4[^"]*)"/i)
      if (videoMatch && videoMatch[1]) {
        return videoMatch[1]
      }
    }
  } catch (error) {
    // 記錄失敗但繼續嘗試下一個方案
    console.log('SnapInsta failed:', error)
  }
  return null
}

// 下載方案 3：FastDL 服務
// 使用 JSON API 獲取下載連結
async function tryFastDl(url) {
  try {
    // 發送 JSON 格式的請求
    const response = await fetch('https://fastdl.app/api/', {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        // 模擬瀏覽器請求
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      // 將 URL 包裝成 JSON 物件
      body: JSON.stringify({
        url: url
      })
    })

    // 解析 JSON 響應
    if (response.ok) {
      const data = await response.json()
      // 檢查並返回下載連結
      if (data && data.download) {
        return data.download
      }
    }
  } catch (error) {
    // 記錄失敗訊息
    console.log('FastDL failed:', error)
  }
  return null
}