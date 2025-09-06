/*
 * SnapIns.ai 風格的 Story 下載器
 * 基於對 https://snapins.ai/ 的技術分析
 * 
 * 🔍 研究發現：
 * - 使用 PHP backend (action.php)
 * - 依賴公開連結的可訪問性
 * - 聲明無法下載私人帳號
 * - 使用 web scraping + unofficial API
 */

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { url } = body

  if (!url) {
    return { success: false, error: '請提供 Instagram Story URL' }
  }

  console.log(`[SNAPINS-STYLE] 開始分析: ${url}`)

  try {
    // 模擬 SnapIns.ai 的分析流程
    const analysisResult = await analyzeInstagramURL(url)
    
    if (!analysisResult.isValid) {
      return { 
        success: false, 
        error: 'URL 格式無效或無法訪問（可能是私人帳號）' 
      }
    }

    const { username, storyId, mediaType } = analysisResult

    // SnapIns.ai 可能的方法組合
    const methods = [
      () => snapinsMethod1_PublicEndpoint(username, storyId),
      () => snapinsMethod2_EmbedScraping(username, storyId),
      () => snapinsMethod3_MetadataExtraction(url),
      () => snapinsMethod4_CDNIntelligence(storyId),
      () => snapinsMethod5_ProxyNetwork(url)
    ]

    for (let i = 0; i < methods.length; i++) {
      console.log(`[SNAPINS-STYLE] 嘗試方法 ${i + 1}: ${methods[i].name}`)
      
      try {
        const result = await methods[i]()
        if (result && result.mediaUrl) {
          console.log(`[SNAPINS-STYLE] 方法 ${i + 1} 成功！`)
          return {
            success: true,
            videoUrl: result.mediaUrl,
            mediaType: result.mediaType || mediaType,
            method: `SnapIns-Style-${i + 1}`,
            metadata: result.metadata
          }
        }
      } catch (error) {
        console.log(`[SNAPINS-STYLE] 方法 ${i + 1} 失敗: ${error.message}`)
      }
    }

    return {
      success: false,
      error: 'SnapIns.ai 風格的所有方法都失敗了。這可能是私人帳號或 Instagram 已更新防護。'
    }

  } catch (error) {
    console.error('[SNAPINS-STYLE] 錯誤:', error)
    return { success: false, error: error.message }
  }
})

// 分析 Instagram URL（模擬 SnapIns.ai 的前置處理）
async function analyzeInstagramURL(url) {
  console.log('[SNAPINS-STYLE] 分析 URL 結構...')
  
  // Story URL 模式匹配
  const storyMatch = url.match(/instagram\.com\/stories\/([^\/]+)\/(\d+)/)
  if (!storyMatch) {
    return { isValid: false, reason: 'Invalid story URL format' }
  }

  const [, username, storyId] = storyMatch
  
  // 檢查是否為公開帳號（模擬 SnapIns.ai 的檢查）
  const isPublic = await checkIfPublicAccount(username)
  
  return {
    isValid: true,
    username,
    storyId,
    mediaType: 'story',
    isPublic
  }
}

// 檢查是否為公開帳號
async function checkIfPublicAccount(username) {
  try {
    console.log(`[SNAPINS-STYLE] 檢查 ${username} 是否為公開帳號...`)
    
    // 嘗試訪問用戶的公開資料
    const response = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      console.log(`[SNAPINS-STYLE] 無法訪問 ${username} 的頁面`)
      return false
    }
    
    const html = await response.text()
    
    // 檢查是否包含私人帳號指示器
    const privateIndicators = [
      'This Account is Private',
      'is_private":true',
      'private account',
      '這是私人帳號'
    ]
    
    const isPrivate = privateIndicators.some(indicator => 
      html.toLowerCase().includes(indicator.toLowerCase())
    )
    
    console.log(`[SNAPINS-STYLE] ${username} 是${isPrivate ? '私人' : '公開'}帳號`)
    return !isPrivate
    
  } catch (error) {
    console.log(`[SNAPINS-STYLE] 檢查帳號狀態失敗: ${error.message}`)
    return false
  }
}

// 方法 1: 公開端點訪問（SnapIns.ai 可能的主要方法）
async function snapinsMethod1_PublicEndpoint(username, storyId) {
  console.log('[SNAPINS-STYLE] 嘗試公開端點訪問...')
  
  // 模擬 SnapIns.ai 可能使用的端點
  const endpoints = [
    `https://www.instagram.com/api/v1/stories/${username}/`,
    `https://graph.instagram.com/${storyId}/?fields=media_url,media_type&access_token=public`,
    `https://www.instagram.com/stories/${username}/embed/`,
    `https://i.instagram.com/api/v1/feed/reels_media/?reel_ids=${username}`
  ]
  
  for (const endpoint of endpoints) {
    try {
      console.log(`[SNAPINS-STYLE] 測試端點: ${endpoint}`)
      
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
          'Accept': 'application/json,text/html,application/xhtml+xml',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || ''
        
        if (contentType.includes('application/json')) {
          const data = await response.json()
          const mediaUrl = extractMediaFromJSON(data, storyId)
          
          if (mediaUrl) {
            return {
              mediaUrl,
              mediaType: mediaUrl.includes('.mp4') ? 'video' : 'image',
              metadata: { source: 'public_endpoint', endpoint }
            }
          }
        } else if (contentType.includes('text/html')) {
          const html = await response.text()
          const mediaUrl = extractMediaFromHTML(html)
          
          if (mediaUrl) {
            return {
              mediaUrl,
              mediaType: mediaUrl.includes('.mp4') ? 'video' : 'image',
              metadata: { source: 'embed_html', endpoint }
            }
          }
        }
      }
    } catch (error) {
      console.log(`[SNAPINS-STYLE] 端點失敗: ${error.message}`)
    }
  }
  
  return null
}

// 方法 2: Embed 頁面抓取（SnapIns.ai 的可能技術）
async function snapinsMethod2_EmbedScraping(username, storyId) {
  console.log('[SNAPINS-STYLE] 嘗試 Embed 頁面抓取...')
  
  const embedUrls = [
    `https://www.instagram.com/p/${storyId}/embed/captioned/`,
    `https://www.instagram.com/stories/${username}/embed/?story_id=${storyId}`,
    `https://instagram.com/stories/${username}/${storyId}/embed/simple/`
  ]
  
  for (const embedUrl of embedUrls) {
    try {
      const response = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; facebookexternalhit/1.1; +http://www.facebook.com/externalhit_uatext.php)',
          'Accept': 'text/html'
        }
      })
      
      if (response.ok) {
        const html = await response.text()
        console.log(`[SNAPINS-STYLE] Embed HTML 長度: ${html.length}`)
        
        // 抓取媒體 URL
        const mediaPatterns = [
          /"video_url":"([^"]*\.mp4[^"]*)"/,
          /"display_url":"([^"]*\.(jpg|jpeg|png)[^"]*)"/,
          /src="([^"]*\.(mp4|jpg|jpeg|png)[^"]*)"/,
          /data-src="([^"]*\.(mp4|jpg|jpeg|png)[^"]*)"/
        ]
        
        for (const pattern of mediaPatterns) {
          const match = html.match(pattern)
          if (match && match[1]) {
            console.log(`[SNAPINS-STYLE] 在 Embed 中找到媒體: ${match[1]}`)
            return {
              mediaUrl: match[1],
              mediaType: match[1].includes('.mp4') ? 'video' : 'image',
              metadata: { source: 'embed_scraping', url: embedUrl }
            }
          }
        }
      }
    } catch (error) {
      console.log(`[SNAPINS-STYLE] Embed 抓取失敗: ${error.message}`)
    }
  }
  
  return null
}

// 方法 3: 元數據提取（SnapIns.ai 的智能分析）
async function snapinsMethod3_MetadataExtraction(originalUrl) {
  console.log('[SNAPINS-STYLE] 嘗試元數據提取...')
  
  try {
    const response = await fetch(originalUrl, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1'
      }
    })
    
    if (response.ok) {
      const html = await response.text()
      
      // 提取 Open Graph 和 Twitter Card 元數據
      const metaTags = [
        /<meta property="og:video" content="([^"]+)"/,
        /<meta property="og:image" content="([^"]+)"/,
        /<meta name="twitter:player:stream" content="([^"]+)"/,
        /<meta name="twitter:image" content="([^"]+)"/
      ]
      
      for (const pattern of metaTags) {
        const match = html.match(pattern)
        if (match && match[1] && (match[1].includes('.mp4') || match[1].includes('.jpg'))) {
          console.log(`[SNAPINS-STYLE] 從元數據找到媒體: ${match[1]}`)
          return {
            mediaUrl: match[1],
            mediaType: match[1].includes('.mp4') ? 'video' : 'image',
            metadata: { source: 'meta_tags' }
          }
        }
      }
    }
  } catch (error) {
    console.log(`[SNAPINS-STYLE] 元數據提取失敗: ${error.message}`)
  }
  
  return null
}

// 方法 4: CDN 智能推測（基於 SnapIns.ai 的可能算法）
async function snapinsMethod4_CDNIntelligence(storyId) {
  console.log('[SNAPINS-STYLE] 嘗試 CDN 智能推測...')
  
  // SnapIns.ai 可能使用的智能 CDN 推測算法
  const cdnPatterns = generateSnapInsCDNPatterns(storyId)
  
  for (const cdnUrl of cdnPatterns) {
    try {
      const response = await fetch(cdnUrl, { 
        method: 'HEAD',
        headers: {
          'User-Agent': 'facebookexternalhit/1.1',
          'Referer': 'https://www.instagram.com/'
        }
      })
      
      if (response.ok && response.headers.get('content-length')) {
        console.log(`[SNAPINS-STYLE] CDN 推測成功: ${cdnUrl}`)
        return {
          mediaUrl: cdnUrl,
          mediaType: cdnUrl.includes('.mp4') ? 'video' : 'image',
          metadata: { source: 'cdn_intelligence' }
        }
      }
    } catch (error) {
      // 繼續下一個
    }
  }
  
  return null
}

// 方法 5: 代理網絡（SnapIns.ai 的終極方案）
async function snapinsMethod5_ProxyNetwork(url) {
  console.log('[SNAPINS-STYLE] 嘗試代理網絡...')
  
  // 這是 SnapIns.ai 可能使用的代理策略
  // 實際上他們可能有自己的代理服務器網絡
  
  return null
}

// 輔助函數：生成 SnapIns CDN 模式
function generateSnapInsCDNPatterns(storyId) {
  const baseId = storyId.substring(0, 11)
  const timestamp = Math.floor(Date.now() / 1000)
  const hash = simpleHash(storyId)
  
  return [
    `https://scontent.cdninstagram.com/v/t51.2885-15/e35/${storyId}_n.jpg`,
    `https://scontent.cdninstagram.com/v/t50.2886-16/${storyId}_n.mp4`,
    `https://scontent-lax3-1.cdninstagram.com/v/t51.2885-15/${baseId}.jpg`,
    `https://scontent-lax3-1.cdninstagram.com/v/t50.2886-16/${baseId}.mp4`,
    `https://instagram.fkhh1-2.fna.fbcdn.net/v/t51.2885-15/e35/${hash}.jpg`,
    `https://instagram.fkhh1-2.fna.fbcdn.net/v/t50.2886-16/${hash}.mp4`
  ]
}

// 輔助函數
function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

function extractMediaFromJSON(data, targetId) {
  // 從 JSON 響應中提取媒體 URL
  try {
    const traverse = (obj) => {
      if (typeof obj !== 'object' || obj === null) return null
      
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'media_url' || key === 'video_url' || key === 'display_url') {
          if (typeof value === 'string' && (value.includes('.mp4') || value.includes('.jpg'))) {
            return value
          }
        }
        
        if (typeof value === 'object') {
          const result = traverse(value)
          if (result) return result
        }
      }
      
      return null
    }
    
    return traverse(data)
  } catch (error) {
    return null
  }
}

function extractMediaFromHTML(html) {
  const patterns = [
    /"video_url":"([^"]*\.mp4[^"]*)"/,
    /"display_url":"([^"]*\.(jpg|jpeg|png)[^"]*)"/,
    /src="([^"]*\.(mp4|jpg|jpeg|png)[^"]*)"/
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}