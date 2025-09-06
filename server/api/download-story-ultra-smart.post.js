/*
 * 超級智能 Story 下載器
 * 基於對真實瀏覽器行為的深度分析
 * 
 * 🎯 目標：像 SnapInsta 一樣成功下載 Stories
 * 🧠 策略：完全模擬真實用戶瀏覽行為
 * 
 * 為什麼其他方法失敗：
 * 1. 我們的 User-Agent 太假
 * 2. 我們沒有正確的 session cookies
 * 3. 我們沒有模擬真實的瀏覽器請求序列
 * 4. 我們沒有正確解析頁面中嵌入的 JSON 數據
 */

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { url } = body

  if (!url) {
    return { success: false, error: '請提供 Story URL' }
  }

  console.log(`[ULTRA-SMART] 開始超級智能分析: ${url}`)

  try {
    // 解析 URL
    const urlMatch = url.match(/instagram\.com\/stories\/([^\/]+)\/(\d+)/)
    if (!urlMatch) {
      return { success: false, error: '無效的 Story URL 格式' }
    }

    const [, username, storyId] = urlMatch
    console.log(`[ULTRA-SMART] 目標: ${username} - Story ID: ${storyId}`)

    // 超級智能方法序列
    const smartMethods = [
      () => ultraSmartMethod1_RealBrowserSim(url, username, storyId),
      () => ultraSmartMethod2_SessionlessCrawl(url, username, storyId),  
      () => ultraSmartMethod3_MetaTagHunter(url),
      () => ultraSmartMethod4_JsonDataMiner(url, storyId),
      () => ultraSmartMethod5_CDNBruteForce(storyId)
    ]

    for (let i = 0; i < smartMethods.length; i++) {
      console.log(`[ULTRA-SMART] 嘗試超級方法 ${i + 1}: ${smartMethods[i].name}`)
      
      try {
        const result = await smartMethods[i]()
        if (result && result.mediaUrl) {
          console.log(`[ULTRA-SMART] 🎉 超級方法 ${i + 1} 成功！`)
          return {
            success: true,
            videoUrl: result.mediaUrl,
            mediaType: result.mediaType || 'video',
            method: `UltraSmart-${i + 1}`,
            metadata: result.metadata
          }
        }
      } catch (error) {
        console.log(`[ULTRA-SMART] 方法 ${i + 1} 失敗: ${error.message}`)
      }
    }

    return {
      success: false,
      error: '所有超級智能方法都失敗了。Instagram 的防護太強了，或者這個 Story 真的過期了。'
    }

  } catch (error) {
    console.error('[ULTRA-SMART] 錯誤:', error)
    return { success: false, error: error.message }
  }
})

// 方法 1: 真實瀏覽器完美模擬
async function ultraSmartMethod1_RealBrowserSim(url, username, storyId) {
  console.log('[ULTRA-SMART] 啟動真實瀏覽器模擬...')
  
  // 模擬真實的瀏覽器請求序列
  const realBrowserHeaders = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  }

  try {
    // 步驟 1: 訪問主頁建立 session
    console.log('[ULTRA-SMART] 步驟 1: 建立 Instagram session...')
    await fetch('https://www.instagram.com/', { 
      headers: realBrowserHeaders,
      redirect: 'follow'
    })

    // 步驟 2: 訪問用戶頁面
    console.log('[ULTRA-SMART] 步驟 2: 訪問用戶頁面...')
    await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        ...realBrowserHeaders,
        'Referer': 'https://www.instagram.com/',
        'Sec-Fetch-Site': 'same-origin'
      }
    })

    // 步驟 3: 訪問 Story 頁面
    console.log('[ULTRA-SMART] 步驟 3: 訪問 Story 頁面...')
    const storyResponse = await fetch(url, {
      headers: {
        ...realBrowserHeaders,
        'Referer': `https://www.instagram.com/${username}/`,
        'Sec-Fetch-Site': 'same-origin'
      }
    })

    if (storyResponse.ok) {
      const html = await storyResponse.text()
      return extractMediaFromStoryHTML(html, storyId)
    }

  } catch (error) {
    console.log(`[ULTRA-SMART] 真實瀏覽器模擬失敗: ${error.message}`)
  }
  
  return null
}

// 方法 2: 無 Session 爬取（像 SnapInsta 那樣）
async function ultraSmartMethod2_SessionlessCrawl(url, username, storyId) {
  console.log('[ULTRA-SMART] 無 Session 爬取模式...')
  
  // SnapInsta 可能使用的無 session 方法
  const crawlerHeaders = {
    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Cache-Control': 'no-cache'
  }

  try {
    const response = await fetch(url, { headers: crawlerHeaders })
    
    if (response.ok) {
      const html = await response.text()
      
      // 尋找 Open Graph 標籤
      const ogVideoMatch = html.match(/<meta property="og:video:secure_url" content="([^"]+)"/i) ||
                           html.match(/<meta property="og:video" content="([^"]+)"/i)
      
      if (ogVideoMatch && ogVideoMatch[1]) {
        console.log('[ULTRA-SMART] 在 OG 標籤中找到視頻！')
        return {
          mediaUrl: ogVideoMatch[1].replace(/&amp;/g, '&'),
          mediaType: 'video',
          metadata: { source: 'og_video' }
        }
      }

      // 尋找 JSON-LD 數據
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/i)
      if (jsonLdMatch) {
        try {
          const jsonData = JSON.parse(jsonLdMatch[1])
          if (jsonData.video && jsonData.video.contentUrl) {
            console.log('[ULTRA-SMART] 在 JSON-LD 中找到視頻！')
            return {
              mediaUrl: jsonData.video.contentUrl,
              mediaType: 'video',
              metadata: { source: 'json_ld' }
            }
          }
        } catch (e) {
          // JSON 解析失敗
        }
      }
    }
  } catch (error) {
    console.log(`[ULTRA-SMART] 無 Session 爬取失敗: ${error.message}`)
  }

  return null
}

// 方法 3: Meta 標籤獵人
async function ultraSmartMethod3_MetaTagHunter(url) {
  console.log('[ULTRA-SMART] Meta 標籤深度挖掘...')
  
  const metaCrawlerHeaders = {
    'User-Agent': 'Twitterbot/1.0',
    'Accept': 'text/html'
  }

  try {
    const response = await fetch(url, { headers: metaCrawlerHeaders })
    
    if (response.ok) {
      const html = await response.text()
      
      // 搜索所有可能的媒體 meta 標籤
      const metaPatterns = [
        /<meta property="og:video:secure_url" content="([^"]+)"/gi,
        /<meta property="og:video" content="([^"]+)"/gi,
        /<meta property="twitter:player:stream" content="([^"]+)"/gi,
        /<meta name="twitter:player:stream" content="([^"]+)"/gi,
        /<meta property="og:image" content="([^"]+\.mp4[^"]*)"/gi
      ]
      
      for (const pattern of metaPatterns) {
        let match
        while ((match = pattern.exec(html)) !== null) {
          const mediaUrl = match[1].replace(/&amp;/g, '&')
          if (mediaUrl.includes('.mp4') || mediaUrl.includes('.jpg')) {
            console.log(`[ULTRA-SMART] Meta 標籤找到媒體: ${mediaUrl}`)
            return {
              mediaUrl,
              mediaType: mediaUrl.includes('.mp4') ? 'video' : 'image',
              metadata: { source: 'meta_tags' }
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(`[ULTRA-SMART] Meta 標籤挖掘失敗: ${error.message}`)
  }

  return null
}

// 方法 4: JSON 數據挖掘
async function ultraSmartMethod4_JsonDataMiner(url, storyId) {
  console.log('[ULTRA-SMART] JSON 數據深度挖掘...')
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html'
      }
    })
    
    if (response.ok) {
      const html = await response.text()
      
      // 尋找頁面中的所有 JSON 數據
      const jsonMatches = [
        ...html.matchAll(/window\._sharedData\s*=\s*({.+?});/g),
        ...html.matchAll(/window\.__additionalDataLoaded\s*\([^,]+,\s*({.+?})\)/g),
        ...html.matchAll(/<script[^>]*>.*?({.*?"media_url".*?})/gs),
        ...html.matchAll(/requireLazy\([^{]*({.*?"video_url".*?})/gs)
      ]
      
      for (const match of jsonMatches) {
        try {
          const jsonStr = match[1]
          const jsonData = JSON.parse(jsonStr)
          
          // 遞歸搜索媒體 URL
          const mediaUrl = findMediaUrlInObject(jsonData, storyId)
          if (mediaUrl) {
            console.log(`[ULTRA-SMART] 在 JSON 數據中找到媒體: ${mediaUrl}`)
            return {
              mediaUrl,
              mediaType: mediaUrl.includes('.mp4') ? 'video' : 'image',
              metadata: { source: 'json_mining' }
            }
          }
        } catch (e) {
          // JSON 解析失敗，繼續
        }
      }
    }
  } catch (error) {
    console.log(`[ULTRA-SMART] JSON 挖掘失敗: ${error.message}`)
  }

  return null
}

// 方法 5: 超級 CDN 暴力破解
async function ultraSmartMethod5_CDNBruteForce(storyId) {
  console.log('[ULTRA-SMART] 超級 CDN 暴力破解...')
  
  // 生成更多 CDN 可能性
  const timestamp = Math.floor(Date.now() / 1000)
  const shortId = storyId.substring(0, 10)
  const hash1 = simpleHash(storyId)
  const hash2 = simpleHash(storyId + timestamp)
  
  const ultraCDNPatterns = [
    // 標準模式
    `https://scontent.cdninstagram.com/v/t51.2885-15/e35/${storyId}_n.jpg`,
    `https://scontent.cdninstagram.com/v/t50.2886-16/${storyId}_n.mp4`,
    
    // 時間戳變體
    `https://scontent-lax3-1.cdninstagram.com/v/t51.2885-15/${shortId}_${timestamp}.jpg`,
    `https://scontent-lax3-1.cdninstagram.com/v/t50.2886-16/${shortId}_${timestamp}.mp4`,
    
    // Hash 變體
    `https://instagram.fkhh1-2.fna.fbcdn.net/v/t51.2885-15/${hash1}.jpg`,
    `https://instagram.fkhh1-2.fna.fbcdn.net/v/t50.2886-16/${hash1}.mp4`,
    
    // 雙重 Hash
    `https://scontent.cdninstagram.com/hphotos-xaf1/t51.2885-15/${hash2}.jpg`,
    `https://scontent.cdninstagram.com/hphotos-xaf1/t50.2886-16/${hash2}.mp4`,
    
    // 其他可能的變體
    `https://scontent-tpe1-1.cdninstagram.com/v/t51.2885-15/e35/${shortId}.jpg`,
    `https://scontent-tpe1-1.cdninstagram.com/v/t50.2886-16/${shortId}.mp4`
  ]

  for (const cdnUrl of ultraCDNPatterns) {
    try {
      const response = await fetch(cdnUrl, { 
        method: 'HEAD',
        headers: {
          'User-Agent': 'facebookexternalhit/1.1',
          'Referer': 'https://www.instagram.com/',
          'Accept': '*/*'
        }
      })
      
      if (response.ok && response.headers.get('content-length') > 1000) {
        console.log(`[ULTRA-SMART] CDN 暴力破解成功: ${cdnUrl}`)
        return {
          mediaUrl: cdnUrl,
          mediaType: cdnUrl.includes('.mp4') ? 'video' : 'image',
          metadata: { source: 'cdn_bruteforce' }
        }
      }
    } catch (e) {
      // 繼續下一個
    }
  }

  return null
}

// 輔助函數
function extractMediaFromStoryHTML(html, storyId) {
  // 從 Story HTML 中提取媒體
  const mediaPatterns = [
    /"video_url":"([^"]*\.mp4[^"]*)"/,
    /"display_url":"([^"]*\.jpg[^"]*)"/,
    /src="([^"]*\.mp4[^"]*)"/,
    /data-src="([^"]*\.mp4[^"]*)"/
  ]
  
  for (const pattern of mediaPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      return {
        mediaUrl: match[1].replace(/\\u0026/g, '&').replace(/\\/g, ''),
        mediaType: match[1].includes('.mp4') ? 'video' : 'image',
        metadata: { source: 'story_html' }
      }
    }
  }
  
  return null
}

function findMediaUrlInObject(obj, targetId) {
  if (typeof obj !== 'object' || obj === null) return null
  
  for (const [key, value] of Object.entries(obj)) {
    // 直接檢查媒體 URL 鍵
    if (['video_url', 'media_url', 'display_url', 'src'].includes(key)) {
      if (typeof value === 'string' && (value.includes('.mp4') || value.includes('.jpg'))) {
        return value
      }
    }
    
    // 遞歸搜索
    if (typeof value === 'object') {
      const result = findMediaUrlInObject(value, targetId)
      if (result) return result
    }
  }
  
  return null
}

function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}