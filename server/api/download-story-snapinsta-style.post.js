/*
 * SnapInsta 風格的 Story 下載器
 * 嘗試模擬 SnapInsta 可能使用的方法
 * 
 * 研究目的：理解 SnapInsta 如何不需要登入就能下載 Stories
 */

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { url } = body

  if (!url) {
    return { success: false, error: '請提供 Story URL' }
  }

  console.log(`[SNAPINSTA-STYLE] 開始分析: ${url}`)

  try {
    // 從 URL 提取信息
    const match = url.match(/instagram\.com\/stories\/([^\/]+)\/(\d+)/)
    if (!match) {
      return { success: false, error: '無效的 Story URL' }
    }

    const [, username, storyId] = match
    console.log(`[SNAPINSTA-STYLE] 用戶: ${username}, Story ID: ${storyId}`)

    // SnapInsta 可能的方法
    const methods = [
      () => trySnapInstaMethod1_CDNGuessing(storyId),
      () => trySnapInstaMethod2_PublicAPI(username, storyId),
      () => trySnapInstaMethod3_EmbedAccess(username, storyId),
      () => trySnapInstaMethod4_CacheAccess(storyId),
      () => trySnapInstaMethod5_ThirdPartyProxy(url)
    ]

    for (let i = 0; i < methods.length; i++) {
      console.log(`[SNAPINSTA-STYLE] 嘗試方法 ${i + 1}: ${methods[i].name}`)
      try {
        const result = await methods[i]()
        if (result && result.mediaUrl) {
          console.log(`[SNAPINSTA-STYLE] 方法 ${i + 1} 成功！`)
          return {
            success: true,
            videoUrl: result.mediaUrl,
            mediaType: result.mediaType,
            method: `SnapInsta-Style-${i + 1}`
          }
        }
      } catch (error) {
        console.log(`[SNAPINSTA-STYLE] 方法 ${i + 1} 失敗: ${error.message}`)
      }
    }

    return {
      success: false,
      error: 'SnapInsta 風格的所有方法都失敗了。他們可能使用了我們不知道的技術。'
    }

  } catch (error) {
    console.error('[SNAPINSTA-STYLE] 錯誤:', error)
    return { success: false, error: error.message }
  }
})

// 方法 1: CDN 猜測演算法（SnapInsta 可能的核心技術）
async function trySnapInstaMethod1_CDNGuessing(storyId) {
  console.log('[SNAPINSTA-STYLE] 嘗試 CDN 猜測演算法...')
  
  // 模擬 SnapInsta 可能的 CDN URL 生成邏輯
  const timestamp = Math.floor(Date.now() / 1000)
  const baseId = storyId.substring(0, 11) // 取前11位
  
  // SnapInsta 可能知道的 CDN 模式
  const cdnPatterns = [
    // 基於 Story ID 的變體
    `https://scontent.cdninstagram.com/v/t51.2885-15/e35/${storyId}_n.jpg`,
    `https://scontent.cdninstagram.com/v/t50.2886-16/${storyId}_n.mp4`,
    `https://scontent-tpe1-1.cdninstagram.com/v/t51.2885-15/${storyId}.jpg`,
    `https://scontent-tpe1-1.cdninstagram.com/v/t50.2886-16/${storyId}.mp4`,
    
    // 基於時間戳的變體
    `https://instagram.fkhh1-2.fna.fbcdn.net/v/t51.2885-15/${baseId}_${timestamp}.jpg`,
    `https://instagram.fkhh1-2.fna.fbcdn.net/v/t50.2886-16/${baseId}_${timestamp}.mp4`,
    
    // 基於算法的變體（模擬 SnapInsta 可能的密鑰）
    `https://scontent.cdninstagram.com/hphotos-xaf1/t51.2885-15/${generateSnapInstaKey(storyId)}.jpg`,
    `https://scontent.cdninstagram.com/hphotos-xaf1/t50.2886-16/${generateSnapInstaKey(storyId)}.mp4`
  ]

  for (const cdnUrl of cdnPatterns) {
    console.log(`[SNAPINSTA-STYLE] 測試 CDN: ${cdnUrl}`)
    
    try {
      // 模擬 SnapInsta 的請求頭
      const response = await fetch(cdnUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (response.ok) {
        console.log(`[SNAPINSTA-STYLE] 找到有效的 CDN URL!`)
        return {
          mediaUrl: cdnUrl,
          mediaType: cdnUrl.includes('.mp4') ? 'video' : 'image'
        }
      }
    } catch (e) {
      // 繼續下一個
    }
  }
  
  return null
}

// 方法 2: 公開 API 端點（可能被 SnapInsta 發現但未公開）
async function trySnapInstaMethod2_PublicAPI(username, storyId) {
  console.log('[SNAPINSTA-STYLE] 嘗試未公開的公共 API...')
  
  // SnapInsta 可能發現的隱藏 API
  const hiddenAPIs = [
    `https://www.instagram.com/api/v1/stories/reel/${username}`,
    `https://graph.instagram.com/v12.0/${storyId}?fields=media_url,media_type`,
    `https://www.instagram.com/web/stories/reel/${username}/`,
    `https://i.instagram.com/media/${storyId}/story/`,
    // 模擬可能存在的開發者端點
    `https://developers.instagram.com/stories/media/${storyId}`
  ]

  for (const apiUrl of hiddenAPIs) {
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'InstagramBot/1.0',
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const mediaUrl = extractMediaFromResponse(data)
        if (mediaUrl) {
          return { mediaUrl, mediaType: 'unknown' }
        }
      }
    } catch (e) {
      // 繼續
    }
  }
  
  return null
}

// 方法 3: Embed 訪問（可能的漏洞）
async function trySnapInstaMethod3_EmbedAccess(username, storyId) {
  console.log('[SNAPINSTA-STYLE] 嘗試 Embed 訪問...')
  
  const embedUrls = [
    `https://www.instagram.com/p/${storyId}/embed/`,
    `https://www.instagram.com/${username}/embed/?story_id=${storyId}`,
    `https://instagram.com/stories/${username}/${storyId}/embed/`
  ]

  for (const embedUrl of embedUrls) {
    try {
      const response = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; facebookexternalhit/1.1)',
          'Accept': 'text/html'
        }
      })

      if (response.ok) {
        const html = await response.text()
        const mediaUrl = extractMediaFromHTML(html)
        if (mediaUrl) {
          return { mediaUrl, mediaType: 'unknown' }
        }
      }
    } catch (e) {
      // 繼續
    }
  }
  
  return null
}

// 方法 4: 緩存訪問（可能透過 CDN 緩存獲取）
async function trySnapInstaMethod4_CacheAccess(storyId) {
  console.log('[SNAPINSTA-STYLE] 嘗試緩存訪問...')
  
  // 可能的緩存服務
  const cacheServices = [
    `https://web.archive.org/web/timemap/json/https://www.instagram.com/stories/*/`,
    `https://webcache.googleusercontent.com/search?q=cache:instagram.com/stories/`,
    `https://cc.bingj.com/cache.aspx?q=site:instagram.com/stories/`
  ]

  // 這個方法比較複雜，SnapInsta 可能有特殊的緩存訪問技術
  return null
}

// 方法 5: 第三方代理（SnapInsta 可能的終極解決方案）
async function trySnapInstaMethod5_ThirdPartyProxy(url) {
  console.log('[SNAPINSTA-STYLE] 嘗試第三方代理...')
  
  // SnapInsta 可能使用的代理服務（這些是假設的）
  const proxyServices = [
    'https://proxy-service-1.snapinsta.internal/fetch',
    'https://instagram-cache.cdn.global/stories',
    'https://media-extractor.service.com/instagram'
  ]
  
  // 實際上，SnapInsta 可能有自己的專有代理網路
  return null
}

// 輔助函數
function generateSnapInstaKey(storyId) {
  // 模擬 SnapInsta 可能的密鑰生成算法
  // 實際上他們可能有更複雜的演算法
  const hash = storyId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff
  }, 0)
  return Math.abs(hash).toString(16)
}

function extractMediaFromResponse(data) {
  // 嘗試從各種可能的響應格式中提取媒體 URL
  const possiblePaths = [
    data?.media_url,
    data?.video_url,
    data?.image_url,
    data?.data?.media_url,
    data?.items?.[0]?.media_url
  ]
  
  return possiblePaths.find(url => url && (url.includes('.mp4') || url.includes('.jpg')))
}

function extractMediaFromHTML(html) {
  // 從 HTML 中提取媒體 URL
  const videoMatch = html.match(/"video_url":"([^"]*\.mp4[^"]*)"/)
  const imageMatch = html.match(/"display_url":"([^"]*\.jpg[^"]*)"/)
  
  return videoMatch?.[1] || imageMatch?.[1] || null
}