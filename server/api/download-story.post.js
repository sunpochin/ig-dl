/*
 * Instagram Story 下載器 - API 處理器
 * 
 * 這個檔案就像一個專門的 Story 獵人，專門找出並下載 Instagram Stories！
 * 
 * 工作原理：
 * 1. 接收前端傳來的 Instagram Story URL
 * 2. 像瀏覽器一樣去訪問 Instagram Story 頁面
 * 3. 用多種方法在網頁中尋找 Story 的真實媒體網址：
 *    - 直接從 Story 頁面解析
 *    - 搜尋 GraphQL 數據
 *    - 尋找 JSON 結構中的媒體 URL
 * 4. 找到媒體網址後回傳給前端
 * 
 * Stories 的特殊之處：
 * - Stories 只有 24 小時的生命週期
 * - 需要特殊的認證和標頭來訪問
 * - 媒體格式可能是影片或圖片
 */

// 主要處理器：接收前端請求，下載 Instagram Story
export default defineEventHandler(async (event) => {
  // 解析請求內容：從請求體中取得 Story URL
  const body = await readBody(event)
  const { url } = body

  // 輸入驗證：確保提供了 URL
  if (!url) {
    return {
      success: false,
      error: '請提供 Instagram Story 連結'
    }
  }

  // URL 格式驗證：檢查是否為有效的 Instagram Story 連結
  if (!url.includes('instagram.com/stories/')) {
    return {
      success: false,
      error: '請提供有效的 Instagram Story 連結（格式：instagram.com/stories/username/story_id/）'
    }
  }

  try {
    // 直接解析 Instagram Story
    console.log(`[DEBUG] 開始嘗試下載 Story URL: ${url}`)
    const storyResponse = await tryInstagramStory(url)
    if (storyResponse) {
      console.log('[DEBUG] Instagram Story 解析成功！')
      return {
        success: true,
        videoUrl: storyResponse.mediaUrl,
        mediaType: storyResponse.mediaType,
        thumbnail: storyResponse.thumbnail
      }
    }
    
    // Instagram Story 解析失敗
    console.log('[DEBUG] Instagram Story 解析失敗')
    return {
      success: false,
      error: '無法獲取此 Instagram Story。可能原因：\n1. Story 已過期（超過 24 小時）\n2. 該用戶帳戶為私人帳戶\n3. Story 已被刪除\n4. 需要登入才能查看\n5. Instagram 更新了頁面結構'
    }
  } catch (error) {
    // 捕獲意外錯誤：記錄並返回通用錯誤訊息
    console.error('[DEBUG] Story 下載發生錯誤:', error)
    return {
      success: false,
      error: `處理 Story 請求時發生錯誤: ${error.message}`
    }
  }
})

// 主要 Story 解析函數
async function tryInstagramStory(url) {
  try {
    console.log('[DEBUG] Instagram Story 解析開始...')
    
    // 清理 URL，確保格式正確
    let cleanUrl = url.trim()
    if (cleanUrl.includes('?')) {
      cleanUrl = cleanUrl.split('?')[0]
    }
    if (!cleanUrl.endsWith('/')) {
      cleanUrl += '/'
    }
    
    console.log(`[DEBUG] 清理後的 Story URL: ${cleanUrl}`)

    // 從 URL 提取用戶名和 story_id
    const urlParts = cleanUrl.match(/instagram\.com\/stories\/([^\/]+)\/([^\/]+)/)
    if (!urlParts) {
      console.log('[DEBUG] 無法從 URL 解析用戶名和 story_id')
      return null
    }
    
    const username = urlParts[1]
    const storyId = urlParts[2]
    console.log(`[DEBUG] 解析到用戶名: ${username}, Story ID: ${storyId}`)

    // 模擬真實瀏覽器的請求頭，專門為 Stories 優化
    // 嘗試模擬 Instagram APP 的請求
    const headers = {
      // Instagram Android App User Agent
      'User-Agent': 'Instagram 269.0.0.18.75 Android (30/11; 420dpi; 1080x2220; samsung; SM-G973F; beyond1; exynos9820; en_US; 458229257)',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      // Instagram App 特定標頭
      'X-IG-App-ID': '936619743392459',
      'X-IG-Device-ID': generateDeviceId(),
      'X-IG-Android-ID': generateAndroidId(),
      'X-Requested-With': 'XMLHttpRequest',
      'X-Instagram-AJAX': '1',
      'X-CSRFToken': 'missing',
      // 嘗試添加一些可能有用的標頭
      'X-ASBD-ID': '198387',
      'X-IG-WWW-Claim': '0',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin'
    }

    // 方法 1: 直接訪問 Story URL
    console.log('[DEBUG] 嘗試直接訪問 Story URL...')
    const response = await fetch(cleanUrl, { headers })
    
    console.log(`[DEBUG] Story 響應狀態: ${response.status}`)
    
    if (!response.ok) {
      console.log(`[DEBUG] Story 訪問失敗: HTTP ${response.status}`)
      return null
    }

    const html = await response.text()
    console.log(`[DEBUG] Story HTML 長度: ${html.length}`)

    // 搜尋 Story 媒體資訊
    const storyMedia = await extractStoryMedia(html, username, storyId)
    if (storyMedia) {
      return storyMedia
    }

    // 方法 2: 嘗試 GraphQL API
    console.log('[DEBUG] 嘗試 GraphQL API...')
    const graphqlResult = await tryStoryGraphQL(username, storyId, headers)
    if (graphqlResult) {
      return graphqlResult
    }

    // 方法 3: 嘗試內部 API
    console.log('[DEBUG] 嘗試內部 API...')
    const apiResult = await tryStoryInternalAPI(username, storyId, headers)
    if (apiResult) {
      return apiResult
    }

    console.log('[DEBUG] 所有 Story 解析方法都失敗了')
    return null

  } catch (error) {
    console.log(`[DEBUG] Instagram Story 解析發生錯誤: ${error.message}`)
    return null
  }
}

// 從 HTML 中提取 Story 媒體資訊
async function extractStoryMedia(html, username, storyId) {
  try {
    console.log('[DEBUG] 開始從 HTML 提取 Story 媒體...')
    
    // 搜尋可能包含 Story 數據的模式
    const patterns = [
      // 直接的媒體 URL
      /"video_url":"([^"]*\.mp4[^"]*)"/g,
      /"image_url":"([^"]*\.jpg[^"]*)"/g,
      /"display_url":"([^"]*\.(jpg|mp4)[^"]*)"/g,
      
      // Instagram CDN 格式
      /https:\/\/[^"'\s]*\.cdninstagram\.com\/[^"'\s]*\.(mp4|jpg)[^"'\s]*/g,
      /https:\/\/[^"'\s]*\.fbcdn\.net\/[^"'\s]*\.(mp4|jpg)[^"'\s]*/g,
      
      // Story 特定格式
      /"story_media":\{[^}]*"video_resources":\[[^\]]*"src":"([^"]+)"/g,
      /"story_media":\{[^}]*"display_resources":\[[^\]]*"src":"([^"]+)"/g
    ]

    for (const pattern of patterns) {
      const matches = [...html.matchAll(pattern)]
      console.log(`[DEBUG] 模式找到 ${matches.length} 個匹配`)
      
      for (const match of matches) {
        const mediaUrl = match[1] || match[0]
        if (mediaUrl && (mediaUrl.includes('.mp4') || mediaUrl.includes('.jpg'))) {
          console.log(`[DEBUG] 找到 Story 媒體 URL: ${mediaUrl}`)
          
          const mediaType = mediaUrl.includes('.mp4') ? 'video' : 'image'
          return {
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            thumbnail: mediaType === 'video' ? mediaUrl.replace('.mp4', '.jpg') : mediaUrl
          }
        }
      }
    }

    // 搜尋 JSON 數據結構
    console.log('[DEBUG] 搜尋 JSON 數據結構...')
    const jsonMatches = html.match(/{"[^}]*story[^}]*":[^}]+}/gi) || []
    for (const jsonMatch of jsonMatches) {
      try {
        const data = JSON.parse(jsonMatch)
        const mediaUrl = findMediaInStoryObject(data)
        if (mediaUrl) {
          console.log(`[DEBUG] JSON 中找到 Story 媒體: ${mediaUrl}`)
          const mediaType = mediaUrl.includes('.mp4') ? 'video' : 'image'
          return {
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            thumbnail: mediaType === 'video' ? mediaUrl.replace('.mp4', '.jpg') : mediaUrl
          }
        }
      } catch {
        // 繼續嘗試下一個
      }
    }

    console.log('[DEBUG] HTML 中未找到 Story 媒體')
    return null
  } catch (error) {
    console.log(`[DEBUG] HTML Story 媒體提取失敗: ${error.message}`)
    return null
  }
}

// 嘗試 GraphQL API
async function tryStoryGraphQL(username, storyId, headers) {
  try {
    console.log('[DEBUG] 嘗試 Story GraphQL API...')
    
    const graphqlUrl = 'https://www.instagram.com/graphql/query/'
    const queryHash = '15463e8449a83d3d60b06be7e90627c7' // Stories query hash
    
    const variables = JSON.stringify({
      reel_ids: [`${username}:${storyId}`],
      tag_names: [],
      location_ids: [],
      highlight_reel_ids: [],
      precomposed_overlay: false,
      show_story_viewer_list: false,
      story_viewer_fetch_count: 50,
      story_viewer_cursor: ""
    })
    
    const url = `${graphqlUrl}?query_hash=${queryHash}&variables=${encodeURIComponent(variables)}`
    
    const response = await fetch(url, { headers })
    console.log(`[DEBUG] GraphQL 響應狀態: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      const mediaUrl = extractMediaFromGraphQLResponse(data)
      if (mediaUrl) {
        console.log(`[DEBUG] GraphQL 找到媒體: ${mediaUrl}`)
        const mediaType = mediaUrl.includes('.mp4') ? 'video' : 'image'
        return {
          mediaUrl: mediaUrl,
          mediaType: mediaType,
          thumbnail: mediaType === 'video' ? mediaUrl.replace('.mp4', '.jpg') : mediaUrl
        }
      }
    }
    
    return null
  } catch (error) {
    console.log(`[DEBUG] Story GraphQL 失敗: ${error.message}`)
    return null
  }
}

// 嘗試內部 API
async function tryStoryInternalAPI(username, storyId, headers) {
  try {
    console.log('[DEBUG] 嘗試 Story 內部 API...')
    
    const apiUrls = [
      `https://www.instagram.com/api/v1/stories/media/${storyId}/`,
      `https://www.instagram.com/api/v1/users/${username}/story/`,
      `https://i.instagram.com/api/v1/media/${storyId}/info/`
    ]
    
    for (let i = 0; i < apiUrls.length; i++) {
      const apiUrl = apiUrls[i]
      console.log(`[DEBUG] 嘗試 API 端點 ${i + 1}: ${apiUrl}`)
      
      try {
        const response = await fetch(apiUrl, { headers })
        console.log(`[DEBUG] API 端點 ${i + 1} 響應狀態: ${response.status}`)
        
        if (response.ok) {
          const data = await response.json()
          const mediaUrl = extractMediaFromAPIResponse(data)
          if (mediaUrl) {
            console.log(`[DEBUG] API 端點 ${i + 1} 找到媒體: ${mediaUrl}`)
            const mediaType = mediaUrl.includes('.mp4') ? 'video' : 'image'
            return {
              mediaUrl: mediaUrl,
              mediaType: mediaType,
              thumbnail: mediaType === 'video' ? mediaUrl.replace('.mp4', '.jpg') : mediaUrl
            }
          }
        }
      } catch (error) {
        console.log(`[DEBUG] API 端點 ${i + 1} 失敗: ${error.message}`)
      }
    }
    
    return null
  } catch (error) {
    console.log(`[DEBUG] Story 內部 API 失敗: ${error.message}`)
    return null
  }
}

// 輔助函數：在 Story 物件中尋找媒體 URL
function findMediaInStoryObject(obj, depth = 0) {
  if (depth > 10 || typeof obj !== 'object' || obj === null) return null
  
  for (const [key, value] of Object.entries(obj)) {
    // 檢查是否為媒體 URL 屬性
    if (typeof value === 'string') {
      if ((key.toLowerCase().includes('video') || key.toLowerCase().includes('media') || key.toLowerCase().includes('url')) && 
          (value.includes('.mp4') || value.includes('.jpg')) && 
          (value.includes('cdninstagram.com') || value.includes('fbcdn.net'))) {
        return value
      }
    }
    
    // 遞歸搜尋
    if (typeof value === 'object') {
      const result = findMediaInStoryObject(value, depth + 1)
      if (result) return result
    }
  }
  return null
}

// 從 GraphQL 響應中提取媒體
function extractMediaFromGraphQLResponse(data) {
  try {
    // 嘗試多種 GraphQL 路徑
    const possiblePaths = [
      data?.data?.reels_media?.[0]?.items?.[0]?.video_resources?.[0]?.src,
      data?.data?.reels_media?.[0]?.items?.[0]?.display_resources?.[0]?.src,
      data?.data?.reels_media?.[0]?.items?.[0]?.image_versions2?.candidates?.[0]?.url,
      data?.reels_media?.[0]?.items?.[0]?.video_resources?.[0]?.src
    ]
    
    for (const path of possiblePaths) {
      if (path && typeof path === 'string' && (path.includes('.mp4') || path.includes('.jpg'))) {
        return path
      }
    }
    
    return null
  } catch (error) {
    console.log(`[DEBUG] GraphQL 響應解析失敗: ${error.message}`)
    return null
  }
}

// 從 API 響應中提取媒體
function extractMediaFromAPIResponse(data) {
  try {
    // 嘗試多種 API 響應路徑
    const possiblePaths = [
      data?.items?.[0]?.video_versions?.[0]?.url,
      data?.items?.[0]?.image_versions2?.candidates?.[0]?.url,
      data?.media?.video_versions?.[0]?.url,
      data?.media?.image_versions2?.candidates?.[0]?.url,
      data?.video_url,
      data?.image_url
    ]
    
    for (const path of possiblePaths) {
      if (path && typeof path === 'string' && (path.includes('.mp4') || path.includes('.jpg'))) {
        return path
      }
    }
    
    return null
  } catch (error) {
    console.log(`[DEBUG] API 響應解析失敗: ${error.message}`)
    return null
  }
}