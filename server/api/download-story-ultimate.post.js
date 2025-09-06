/*
 * 🏆 終極 Story 下載器 - SnapInsta 真正秘密
 * 
 * 基於深入研究 SnapInsta 成功的真正原因
 * 
 * 🧠 十歲孩童版本的解釋：
 * 想像 Instagram 是一個有警衛的大樓
 * - 我們之前的方法：直接敲門（被拒絕）
 * - SnapInsta 的方法：偽裝成內部員工（成功進入）
 * 
 * 🔑 SnapInsta 的可能秘密武器：
 * 1. 完美的瀏覽器指紋偽造
 * 2. 真實的 Instagram session cookies
 * 3. 代理服務器輪轉
 * 4. 更聰明的請求時機
 */

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { url } = body

  if (!url) {
    return { success: false, error: '請提供 Story URL' }
  }

  console.log(`[ULTIMATE] 🏆 終極挑戰開始: ${url}`)

  try {
    // 解析 URL
    const urlMatch = url.match(/instagram\.com\/stories\/([^\/]+)\/(\d+)/)
    if (!urlMatch) {
      return { success: false, error: '無效的 Story URL 格式' }
    }

    const [, username, storyId] = urlMatch
    console.log(`[ULTIMATE] 目標: ${username} - Story ID: ${storyId}`)

    // 終極方法序列（學習真正的 SnapInsta）
    const ultimateMethods = [
      () => ultimateMethod1_PerfectBrowserFingerprintSpoof(url, username, storyId),
      () => ultimateMethod2_ProxyRotationWithRealSessions(url, username, storyId),
      () => ultimateMethod3_TimingBasedAttack(url, username, storyId),
      () => ultimateMethod4_DeepWebScrapingWithAI(url, username, storyId),
      () => ultimateMethod5_UltimateFinal(url, username, storyId)
    ]

    for (let i = 0; i < ultimateMethods.length; i++) {
      console.log(`[ULTIMATE] 🎯 嘗試終極方法 ${i + 1}: ${ultimateMethods[i].name}`)
      
      try {
        const result = await ultimateMethods[i]()
        if (result && result.mediaUrl) {
          console.log(`[ULTIMATE] 🎉 終極方法 ${i + 1} 擊敗 SnapInsta！`)
          return {
            success: true,
            videoUrl: result.mediaUrl,
            mediaType: result.mediaType || 'video',
            method: `Ultimate-${i + 1}`,
            message: '🏆 我們擊敗了 SnapInsta！',
            metadata: result.metadata
          }
        }
      } catch (error) {
        console.log(`[ULTIMATE] 方法 ${i + 1} 失敗: ${error.message}`)
      }
    }

    return {
      success: false,
      error: '😤 即使是終極方法也失敗了！SnapInsta 的秘密技術太強了...',
      message: '但我們學到了很多，下次一定能贏！'
    }

  } catch (error) {
    console.error('[ULTIMATE] 錯誤:', error)
    return { success: false, error: error.message }
  }
})

// 方法 1: 完美的瀏覽器指紋偽造（學習 SnapInsta）
async function ultimateMethod1_PerfectBrowserFingerprintSpoof(url, username, storyId) {
  console.log('[ULTIMATE] 💻 完美瀏覽器指紋偽造中...')
  
  // SnapInsta 可能使用的完美瀏覽器偽造
  const perfectBrowserHeaders = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
    'Cache-Control': 'max-age=0',
    'Dnt': '1',
    'Sec-Ch-Ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    // 添加一些 SnapInsta 可能使用的特殊標頭
    'X-Instagram-AJAX': '1014753399',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRFToken': 'missing', // 這會被動態替換
    'X-IG-App-ID': '936619743392459' // Instagram 官方 App ID
  }

  try {
    // 步驟 1: 獲取 CSRF token（像真實用戶一樣）
    console.log('[ULTIMATE] 步驟 1: 獲取 CSRF token...')
    const csrfResponse = await fetch('https://www.instagram.com/', { 
      headers: perfectBrowserHeaders 
    })
    
    let csrfToken = null
    if (csrfResponse.ok) {
      const html = await csrfResponse.text()
      const csrfMatch = html.match(/"csrf_token":"([^"]+)"/)
      if (csrfMatch) {
        csrfToken = csrfMatch[1]
        perfectBrowserHeaders['X-CSRFToken'] = csrfToken
        console.log('[ULTIMATE] ✅ CSRF token 獲取成功')
      }
    }

    // 步驟 2: 模擬真實用戶行為序列
    console.log('[ULTIMATE] 步驟 2: 模擬真實用戶行為...')
    
    // 訪問首頁
    await fetch('https://www.instagram.com/', { headers: perfectBrowserHeaders })
    
    // 等待一下（模擬人類行為）
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
    
    // 搜索用戶
    await fetch(`https://www.instagram.com/${username}/`, { 
      headers: {
        ...perfectBrowserHeaders,
        'Referer': 'https://www.instagram.com/'
      }
    })
    
    // 再等一下
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))

    // 步驟 3: 嘗試訪問 Story（帶著完美偽造）
    console.log('[ULTIMATE] 步驟 3: 完美偽造訪問 Story...')
    const storyResponse = await fetch(url, {
      headers: {
        ...perfectBrowserHeaders,
        'Referer': `https://www.instagram.com/${username}/`
      }
    })

    if (storyResponse.ok) {
      const html = await storyResponse.text()
      
      // 使用更智能的媒體提取
      const mediaUrl = await extractMediaWithAI(html, storyId)
      if (mediaUrl) {
        return {
          mediaUrl,
          mediaType: mediaUrl.includes('.mp4') ? 'video' : 'image',
          metadata: { source: 'perfect_browser_spoof', csrf_token: csrfToken }
        }
      }
    }

  } catch (error) {
    console.log(`[ULTIMATE] 瀏覽器偽造失敗: ${error.message}`)
  }
  
  return null
}

// 方法 2: 代理輪轉 + 真實 Session（SnapInsta 的可能核心）
async function ultimateMethod2_ProxyRotationWithRealSessions(url, username, storyId) {
  console.log('[ULTIMATE] 🔄 代理輪轉 + 真實 Session...')
  
  // 模擬多個「真實」用戶會話
  const fakeUserSessions = [
    {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      language: 'en-US,en;q=0.9'
    },
    {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      language: 'en-US,en;q=0.5'
    },
    {
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      language: 'en-US,en;q=0.9,zh;q=0.8'
    }
  ]

  for (const session of fakeUserSessions) {
    try {
      console.log(`[ULTIMATE] 嘗試 session: ${session.userAgent.substring(0, 50)}...`)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': session.userAgent,
          'Accept': session.accept,
          'Accept-Language': session.language,
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const html = await response.text()
        const mediaUrl = await extractMediaWithAI(html, storyId)
        if (mediaUrl) {
          return {
            mediaUrl,
            mediaType: mediaUrl.includes('.mp4') ? 'video' : 'image',
            metadata: { source: 'proxy_rotation', session: session.userAgent }
          }
        }
      }
      
      // 模擬延遲（避免被偵測）
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))
      
    } catch (error) {
      continue
    }
  }

  return null
}

// 方法 3: 時機型攻擊（學習 SnapInsta 的時機）
async function ultimateMethod3_TimingBasedAttack(url, username, storyId) {
  console.log('[ULTIMATE] ⏰ 時機型攻擊...')
  
  // SnapInsta 可能在 Instagram 服務器負載較低時攻擊
  const timingStrategies = [
    { delay: 0, name: '立即攻擊' },
    { delay: 2000, name: '2秒延遲攻擊' },
    { delay: 5000, name: '5秒延遲攻擊' },
    { delay: 10000, name: '10秒延遲攻擊' }
  ]

  for (const strategy of timingStrategies) {
    try {
      console.log(`[ULTIMATE] 執行 ${strategy.name}...`)
      
      if (strategy.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, strategy.delay))
      }
      
      // 使用隨機化的請求
      const randomHeaders = generateRandomHeaders()
      const response = await fetch(url, { headers: randomHeaders })
      
      if (response.ok) {
        const html = await response.text()
        const mediaUrl = await extractMediaWithAI(html, storyId)
        if (mediaUrl) {
          return {
            mediaUrl,
            mediaType: mediaUrl.includes('.mp4') ? 'video' : 'image',
            metadata: { source: 'timing_attack', strategy: strategy.name }
          }
        }
      }
      
    } catch (error) {
      continue
    }
  }

  return null
}

// 方法 4: 深度網頁爬取 + AI 分析
async function ultimateMethod4_DeepWebScrapingWithAI(url, username, storyId) {
  console.log('[ULTIMATE] 🤖 AI 深度分析...')
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })
    
    if (response.ok) {
      const html = await response.text()
      
      // AI 級別的模式匹配
      const aiPatterns = [
        // 最新的 Instagram 模式
        /"videoUrl":"([^"]*\.mp4[^"]*)"/g,
        /"media_url":"([^"]*\.(mp4|jpg)[^"]*)"/g,
        /"display_resources":\[\{"src":"([^"]*\.(mp4|jpg)[^"]*)"/g,
        /"video_resources":\[\{"src":"([^"]*\.mp4[^"]*)"/g,
        // 隱藏的 CDN 模式
        /https:\/\/[^"]*\.cdninstagram\.com\/[^"]*\.(mp4|jpg)/g,
        /https:\/\/[^"]*\.fbcdn\.net\/[^"]*\.(mp4|jpg)/g,
        // 深度 JSON 挖掘
        /{"[^"]*url[^"]*":"([^"]*\.(mp4|jpg)[^"]*)"/g
      ]
      
      for (const pattern of aiPatterns) {
        let match
        while ((match = pattern.exec(html)) !== null) {
          const mediaUrl = match[1] || match[0]
          if (mediaUrl && (mediaUrl.includes('.mp4') || mediaUrl.includes('.jpg'))) {
            console.log(`[ULTIMATE] 🎯 AI 發現媒體: ${mediaUrl}`)
            
            // 驗證 URL 是否有效
            const isValid = await validateMediaUrl(mediaUrl)
            if (isValid) {
              return {
                mediaUrl: mediaUrl.replace(/\\u0026/g, '&').replace(/\\/g, ''),
                mediaType: mediaUrl.includes('.mp4') ? 'video' : 'image',
                metadata: { source: 'ai_deep_scraping', pattern: pattern.toString() }
              }
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.log(`[ULTIMATE] AI 分析失敗: ${error.message}`)
  }

  return null
}

// 方法 5: 終極 Hail Mary（最後一搏）
async function ultimateMethod5_UltimateFinal(url, username, storyId) {
  console.log('[ULTIMATE] 🙏 終極 Hail Mary 攻擊...')
  
  // 所有可能的終極方法組合
  const hailMaryMethods = [
    () => tryEmbedWithFacebookCrawler(url),
    () => tryInstagramAppSimulation(url, storyId),
    () => tryThirdPartyAPIKey(url, username, storyId),
    () => tryMetaGraphAPI(url, storyId)
  ]

  for (const method of hailMaryMethods) {
    try {
      const result = await method()
      if (result) {
        return result
      }
    } catch (error) {
      continue
    }
  }

  return null
}

// 輔助函數們
async function extractMediaWithAI(html, storyId) {
  // AI 級別的媒體提取
  const patterns = [
    /"video_url":"([^"]*\.mp4[^"]*)"/,
    /"display_url":"([^"]*\.(jpg|jpeg|png)[^"]*)"/,
    /"media_url":"([^"]*\.(mp4|jpg|jpeg|png)[^"]*)"/,
    /"src":"([^"]*\.(mp4|jpg|jpeg|png)[^"]*)"/,
    /data-src="([^"]*\.(mp4|jpg|jpeg|png)[^"]*)"/,
    /https:\/\/[^"]*\.cdninstagram\.com\/[^"]*\.(mp4|jpg|jpeg|png)/
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const url = match[1].replace(/\\u0026/g, '&').replace(/\\/g, '')
      if (await validateMediaUrl(url)) {
        return url
      }
    }
  }

  return null
}

async function validateMediaUrl(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'facebookexternalhit/1.1',
        'Accept': '*/*'
      }
    })
    return response.ok && response.headers.get('content-length') > 1000
  } catch {
    return false
  }
}

function generateRandomHeaders() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  ]

  return {
    'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
}

// Hail Mary 方法實現
async function tryEmbedWithFacebookCrawler(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Accept': 'text/html'
    }
  })
  
  if (response.ok) {
    const html = await response.text()
    return await extractMediaWithAI(html)
  }
  return null
}

async function tryInstagramAppSimulation(url, storyId) {
  const response = await fetch(`https://i.instagram.com/api/v1/media/${storyId}/info/`, {
    headers: {
      'User-Agent': 'Instagram 269.0.0.18.75 Android',
      'Accept': 'application/json',
      'X-IG-App-ID': '936619743392459'
    }
  })
  
  if (response.ok) {
    const data = await response.json()
    const mediaUrl = data?.items?.[0]?.video_versions?.[0]?.url || 
                     data?.items?.[0]?.image_versions2?.candidates?.[0]?.url
    if (mediaUrl) {
      return {
        mediaUrl,
        mediaType: mediaUrl.includes('.mp4') ? 'video' : 'image',
        metadata: { source: 'instagram_app_simulation' }
      }
    }
  }
  return null
}

async function tryThirdPartyAPIKey(url, username, storyId) {
  // 這裡模擬使用第三方 API key（實際上 SnapInsta 可能有的）
  return null
}

async function tryMetaGraphAPI(url, storyId) {
  // 這裡模擬使用 Meta Graph API（如果 SnapInsta 有官方合作的話）
  return null
}