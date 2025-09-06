/*
 * Instagram Reel 下載器 - API 處理器
 * 
 * 這個檔案的工作就像一個聰明的偵探，專門找出 Instagram 影片的真實下載網址！
 * 
 * 工作原理（用十歲小朋友都能懂的方式說明）：
 * 1. 接收前端傳來的 Instagram 網址
 * 2. 像瀏覽器一樣去訪問 Instagram 網頁
 * 3. 用五種不同的方法在網頁中尋找影片網址：
 *    方法1: 找結構化數據（就像找書的目錄）
 *    方法2: 找全域變數（就像找書的索引）  
 *    方法3: 找現代數據結構（就像找書的註解）
 *    方法4: 用正則表達式搜尋（就像用放大鏡逐字找）
 *    方法5: 嘗試嵌入版本（就像找書的簡化版）
 * 4. 找到影片網址後回傳給前端
 * 
 * 為什麼要用這麼多方法？
 * 因為 Instagram 會經常改變網頁結構，就像書店會重新整理書架。
 * 用多種方法可以確保即使某些方法失效，還有其他方法可以找到影片！
 * 
 * 最新更新：
 * - 增強了正則表達式模式，可以找到更多種類的影片網址
 * - 加入了更廣泛的 JSON 數據搜尋
 * - 改進了除錯輸出，可以看到具體找到了什麼
 */

// 主要處理器：接收前端請求，直接爬取 Instagram
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
    // 直接爬取 Instagram 網頁 (唯一方案)
    console.log(`[DEBUG] 開始嘗試下載 URL: ${url}`)
    const instagramDirectResponse = await tryInstagramDirect(url)
    if (instagramDirectResponse) {
      console.log('[DEBUG] Instagram 直接爬取成功！')
      return {
        success: true,
        videoUrl: instagramDirectResponse
      }
    }
    
    // Instagram 直接爬取失敗
    console.log('[DEBUG] Instagram 直接爬取失敗')
    return {
      success: false,
      error: '無法獲取此 Instagram 影片。可能原因：\n1. 該貼文為私人帳戶\n2. 該貼文已被刪除或無法存取\n3. Instagram 可能更新了頁面結構\n4. 網路連線問題'
    }
  } catch (error) {
    // 捕獲意外錯誤：記錄並返回通用錯誤訊息
    console.error('[DEBUG] 主函數發生錯誤:', error)
    return {
      success: false,
      error: `處理請求時發生錯誤: ${error.message}`
    }
  }
})

// 輔助函數：遞歸搜尋物件中的影片 URL
function findVideoInObject(obj, depth = 0) {
  if (depth > 10 || typeof obj !== 'object' || obj === null) return null
  
  for (const [key, value] of Object.entries(obj)) {
    // 檢查是否為影片 URL 屬性
    if (typeof value === 'string') {
      if ((key.toLowerCase().includes('video') || key.toLowerCase().includes('playback')) && 
          value.includes('.mp4') && 
          (value.includes('cdninstagram.com') || value.includes('fbcdn.net'))) {
        return value
      }
    }
    
    // 遞歸搜尋
    if (typeof value === 'object') {
      const result = findVideoInObject(value, depth + 1)
      if (result) return result
    }
  }
  return null
}

// 直接爬取 Instagram 網頁
// 模擬瀏覽器訪問，解析頁面獲取影片連結
async function tryInstagramDirect(url) {
  try {
    console.log('[DEBUG] Instagram 直接爬取開始...')
    
    // 清理 URL，確保格式正確
    let cleanUrl = url.trim()
    if (cleanUrl.includes('?')) {
      cleanUrl = cleanUrl.split('?')[0]
    }
    if (!cleanUrl.endsWith('/')) {
      cleanUrl += '/'
    }
    
    console.log(`[DEBUG] 清理後的 URL: ${cleanUrl}`)

    // 模擬真實瀏覽器的請求頭
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    }

    // 訪問 Instagram 網頁
    console.log('[DEBUG] 嘗試訪問 Instagram 網頁...')
    const response = await fetch(cleanUrl, { headers })
    
    console.log(`[DEBUG] Instagram 響應狀態: ${response.status}`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    console.log(`[DEBUG] HTML 長度: ${html.length}`)
    
    // 除錯：輸出 HTML 的一部分來分析結構
    console.log('[DEBUG] HTML 前 1000 字元:', html.substring(0, 1000))
    
    // 搜尋是否包含常見的影片相關關鍵字
    const videoKeywords = ['video_url', 'playback_url', 'media_url', '.mp4', 'cdninstagram', 'fbcdn']
    for (const keyword of videoKeywords) {
      if (html.includes(keyword)) {
        console.log(`[DEBUG] HTML 包含關鍵字: ${keyword}`)
      }
    }

    // 方法 1: 尋找 JSON-LD 結構化數據
    const jsonLdMatches = html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)
    if (jsonLdMatches) {
      console.log(`[DEBUG] 找到 ${jsonLdMatches.length} 個 JSON-LD 區塊`)
      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '')
          const data = JSON.parse(jsonContent)
          
          if (data.video && data.video.contentUrl) {
            console.log(`[DEBUG] JSON-LD 找到影片 URL: ${data.video.contentUrl}`)
            return data.video.contentUrl
          }
        } catch {
          console.log('[DEBUG] JSON-LD 解析失敗，繼續嘗試下一個')
        }
      }
    }

    // 方法 2: 尋找 window._sharedData 或類似的全域變數
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.*?});/)
    if (sharedDataMatch) {
      try {
        console.log('[DEBUG] 找到 _sharedData')
        const sharedData = JSON.parse(sharedDataMatch[1])
        
        const videoUrl = findVideoInObject(sharedData)
        if (videoUrl) {
          console.log(`[DEBUG] _sharedData 找到影片 URL: ${videoUrl}`)
          return videoUrl
        }
      } catch {
        console.log('[DEBUG] _sharedData 解析失敗')
      }
    }

    // 方法 3: 尋找現代 Instagram 的數據結構
    console.log('[DEBUG] 搜尋現代 Instagram 數據結構...')
    
    // 搜尋所有包含 video 相關的 JSON 數據
    const allJsonMatches = html.match(/{[^{}]*"video[^{}]*}|{[^{}]*video_url[^{}]*}|{[^{}]*playback_url[^{}]*}/g)
    if (allJsonMatches) {
      console.log(`[DEBUG] 找到 ${allJsonMatches.length} 個可能的 video JSON 數據`)
      for (const jsonMatch of allJsonMatches) {
        try {
          const data = JSON.parse(jsonMatch)
          const videoUrl = findVideoInObject(data)
          if (videoUrl) {
            console.log(`[DEBUG] JSON 數據找到影片 URL: ${videoUrl}`)
            return videoUrl
          }
        } catch {
          // 繼續嘗試下一個
        }
      }
    }

    // 搜尋 __d 函數調用中的數據 - 更寬鬆的匹配
    const moduleDataMatches = html.match(/__d\([^)]+\)[^{]*{[^}]+}/g)
    if (moduleDataMatches) {
      console.log(`[DEBUG] 找到 ${moduleDataMatches.length} 個模組數據`)
      for (const moduleMatch of moduleDataMatches) {
        const videoUrl = findVideoInObject({ content: moduleMatch })
        if (videoUrl) {
          console.log(`[DEBUG] 模組數據找到影片 URL: ${videoUrl}`)
          return videoUrl
        }
      }
    }

    // 搜尋 GraphQL 和 API 響應數據
    const apiDataMatches = html.match(/"data":[^}]+}|"media":[^}]+}/g)
    if (apiDataMatches) {
      console.log(`[DEBUG] 找到 ${apiDataMatches.length} 個 API 數據`)
      for (const apiMatch of apiDataMatches) {
        try {
          const data = JSON.parse(`{${apiMatch}}`)
          const videoUrl = findVideoInObject(data)
          if (videoUrl) {
            console.log(`[DEBUG] API 數據找到影片 URL: ${videoUrl}`)
            return videoUrl
          }
        } catch {
          // 繼續嘗試下一個
        }
      }
    }

    // 方法 4: 使用強化的正則表達式搜尋影片 URL
    console.log('[DEBUG] 使用增強的正則表達式搜尋影片 URL...')
    const enhancedVideoPatterns = [
      // 標準格式
      /"video_url":"([^"]*\.mp4[^"]*)"/g,
      /"videoUrl":"([^"]*\.mp4[^"]*)"/g,
      
      // Instagram CDN 格式 - 更廣泛的匹配
      /https:\/\/[^"'\s]*\.cdninstagram\.com\/[^"'\s]*\.mp4[^"'\s]*/g,
      /https:\/\/[^"'\s]*\.fbcdn\.net\/[^"'\s]*\.mp4[^"'\s]*/g,
      /https:\/\/[^"'\s]*\.instagram\.com\/[^"'\s]*\.mp4[^"'\s]*/g,
      
      // 其他可能的格式
      /"src":"(https:\/\/[^"]*\.mp4[^"]*)"/g,
      /"url":"(https:\/\/[^"]*\.mp4[^"]*)"/g,
      
      // 轉義的 URL
      /https:\\u002F\\u002F[^"]*\.mp4[^"]*/g,
      /https:\\\/\\\/[^"]*\.mp4[^"]*/g,
      
      // 新的 Instagram 格式
      /"playback_url":"([^"]*\.mp4[^"]*)"/g,
      /"video_dash_manifest":"([^"]*)"/g,
      
      // 更多可能的 key 名稱
      /"video_versions":\[{"url":"([^"]*\.mp4[^"]*)"/g,
      /"candidates":\[{"url":"([^"]*\.mp4[^"]*)"/g,
      /"media_url":"([^"]*\.mp4[^"]*)"/g,
      
      // 直接匹配任何 .mp4 URL
      /(https:\/\/[^"'\s]*\.mp4[^"'\s]*)/g,
      
      // Meta 相關的 CDN
      /https:\/\/[^"'\s]*\.xx\.fbcdn\.net\/[^"'\s]*\.mp4[^"'\s]*/g
    ]

    for (const pattern of enhancedVideoPatterns) {
      console.log(`[DEBUG] 嘗試模式: ${pattern.source}`)
      let match
      let matchCount = 0
      while ((match = pattern.exec(html)) !== null && matchCount < 10) {
        matchCount++
        const videoUrl = match[1] || match[0]
        if (videoUrl && videoUrl.includes('.mp4') && !videoUrl.includes('profile_pic') && !videoUrl.includes('thumbnail')) {
          // 解碼 URL 中的轉義字符
          let decodedUrl = videoUrl
            .replace(/\\u0026/g, '&')
            .replace(/\\u002F/g, '/')
            .replace(/\\\//g, '/')
            .replace(/\\\\\\\\/g, '\\\\')
          
          console.log(`[DEBUG] 正則表達式找到影片 URL: ${decodedUrl}`)
          return decodedUrl
        }
      }
    }

    // 方法 5: 嘗試 embed 版本
    console.log('[DEBUG] 嘗試 embed 版本...')
    const embedUrl = cleanUrl.replace('/p/', '/p/').replace('/reel/', '/reel/') + 'embed/'
    const embedResponse = await fetch(embedUrl, { headers })
    
    if (embedResponse.ok) {
      const embedHtml = await embedResponse.text()
      console.log(`[DEBUG] Embed HTML 長度: ${embedHtml.length}`)
      
      for (const pattern of enhancedVideoPatterns) {
        let match
        while ((match = pattern.exec(embedHtml)) !== null) {
          const videoUrl = match[1] || match[0]
          if (videoUrl && videoUrl.includes('.mp4')) {
            const decodedUrl = videoUrl
              .replace(/\\u0026/g, '&')
              .replace(/\\u002F/g, '/')
              .replace(/\\\//g, '/')
              .replace(/\\\\\\\\/g, '\\\\')
            console.log(`[DEBUG] Embed 版本找到影片 URL: ${decodedUrl}`)
            return decodedUrl
          }
        }
      }
    }

    console.log('[DEBUG] Instagram 直接爬取未找到影片 URL')
    return null

  } catch (error) {
    console.log(`[DEBUG] Instagram 直接爬取發生錯誤: ${error.message}`)
    return null
  }
}