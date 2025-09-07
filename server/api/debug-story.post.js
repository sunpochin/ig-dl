/*
 * Story 調試器 - 深度分析特定 Story 的問題
 * 專門用來診斷為什麼某些 Story 無法下載
 */

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { url } = body

  if (!url) {
    return { success: false, error: '請提供 Story URL' }
  }

  console.log(`[DEBUG-STORY] 開始深度分析: ${url}`)

  try {
    // 解析 URL
    const urlMatch = url.match(/instagram\.com\/stories\/([^\/]+)\/(\d+)/)
    if (!urlMatch) {
      return { success: false, error: '無效的 Story URL 格式' }
    }

    const [, username, storyId] = urlMatch
    console.log(`[DEBUG-STORY] 用戶: ${username}, Story ID: ${storyId}`)

    const debugInfo = {
      url,
      username,
      storyId,
      tests: []
    }

    // 測試 1: 基本連通性測試
    console.log(`[DEBUG-STORY] 測試 1: 基本連通性`)
    const connectivityTest = await testBasicConnectivity(url)
    debugInfo.tests.push({
      name: '基本連通性測試',
      ...connectivityTest
    })

    // 測試 2: 用戶頁面訪問測試
    console.log(`[DEBUG-STORY] 測試 2: 用戶頁面訪問`)
    const userPageTest = await testUserPageAccess(username)
    debugInfo.tests.push({
      name: '用戶頁面訪問測試',
      ...userPageTest
    })

    // 測試 3: Story 頁面分析
    console.log(`[DEBUG-STORY] 測試 3: Story 頁面分析`)
    const storyPageTest = await testStoryPageAnalysis(url)
    debugInfo.tests.push({
      name: 'Story 頁面分析',
      ...storyPageTest
    })

    // 測試 4: 各種 API 端點測試
    console.log(`[DEBUG-STORY] 測試 4: API 端點測試`)
    const apiTest = await testAPIEndpoints(username, storyId)
    debugInfo.tests.push({
      name: 'API 端點測試',
      ...apiTest
    })

    // 測試 5: CDN 推測測試
    console.log(`[DEBUG-STORY] 測試 5: CDN 推測測試`)
    const cdnTest = await testCDNGuessing(storyId)
    debugInfo.tests.push({
      name: 'CDN 推測測試',
      ...cdnTest
    })

    // 測試 6: 元數據提取測試
    console.log(`[DEBUG-STORY] 測試 6: 元數據提取測試`)
    const metaTest = await testMetadataExtraction(url)
    debugInfo.tests.push({
      name: '元數據提取測試',
      ...metaTest
    })

    return {
      success: true,
      debugInfo,
      summary: generateSummary(debugInfo)
    }

  } catch (error) {
    console.error('[DEBUG-STORY] 調試過程發生錯誤:', error)
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
})

// 測試 1: 基本連通性
async function testBasicConnectivity(url) {
  try {
    console.log(`[DEBUG-STORY] 嘗試直接訪問: ${url}`)
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    return {
      success: true,
      status: response.status,
      headers: Object.fromEntries(response.headers),
      redirected: response.redirected,
      finalUrl: response.url
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// 測試 2: 用戶頁面訪問
async function testUserPageAccess(username) {
  try {
    const userUrl = `https://www.instagram.com/${username}/`
    console.log(`[DEBUG-STORY] 檢查用戶頁面: ${userUrl}`)
    
    const response = await fetch(userUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: '無法訪問用戶頁面'
      }
    }

    const html = await response.text()
    
    // 檢查帳號狀態
    const isPrivate = html.includes('"is_private":true') || 
                     html.includes('This Account is Private') ||
                     html.includes('這個帳號是私人帳號')
    
    const hasStories = html.includes('"has_story":true') ||
                      html.includes('story_highlights') ||
                      html.includes('story_media')

    // 提取基本信息
    const userInfo = {
      isPrivate,
      hasStories,
      htmlLength: html.length,
      containsStoryKeywords: {
        has_story: html.includes('"has_story":true'),
        story_highlights: html.includes('story_highlights'),
        story_media: html.includes('story_media'),
        reels_media: html.includes('reels_media')
      }
    }

    return {
      success: true,
      status: response.status,
      userInfo,
      excerpt: html.substring(0, 500)
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// 測試 3: Story 頁面分析
async function testStoryPageAnalysis(url) {
  try {
    console.log(`[DEBUG-STORY] 分析 Story 頁面內容`)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    })

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: 'Story 頁面無法訪問'
      }
    }

    const html = await response.text()
    
    // 分析頁面內容
    const analysis = {
      htmlLength: html.length,
      isLoginPage: html.includes('loginForm') || html.includes('Log In'),
      containsVideo: html.includes('video') || html.includes('.mp4'),
      containsImage: html.includes('image') || html.includes('.jpg'),
      storyKeywordCount: (html.match(/story/gi) || []).length,
      mediaKeywordCount: (html.match(/media/gi) || []).length
    }

    // 搜索可能的媒體 URL
    const mediaPatterns = [
      /"video_url":"([^"]*\.mp4[^"]*)"/g,
      /"display_url":"([^"]*\.jpg[^"]*)"/g,
      /https:\/\/[^"'\s]*\.cdninstagram\.com\/[^"'\s]*\.(mp4|jpg)/g,
      /https:\/\/[^"'\s]*\.fbcdn\.net\/[^"'\s]*\.(mp4|jpg)/g
    ]

    const foundUrls = []
    for (const pattern of mediaPatterns) {
      const matches = [...html.matchAll(pattern)]
      matches.forEach(match => {
        if (match[0] || match[1]) {
          foundUrls.push(match[0] || match[1])
        }
      })
    }

    return {
      success: true,
      status: response.status,
      analysis,
      foundUrls: [...new Set(foundUrls)], // 去重
      htmlExcerpt: {
        start: html.substring(0, 300),
        end: html.substring(Math.max(0, html.length - 300))
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// 測試 4: API 端點測試
async function testAPIEndpoints(username, storyId) {
  const endpoints = [
    {
      name: 'Instagram Web API',
      url: `https://www.instagram.com/api/v1/stories/${username}/`
    },
    {
      name: 'Instagram GraphQL',
      url: `https://www.instagram.com/graphql/query/?query_hash=15463e8449a83d3d60b06be7e90627c7&variables=${encodeURIComponent(JSON.stringify({ reel_ids: [username] }))}`
    },
    {
      name: 'Instagram Media Info',
      url: `https://i.instagram.com/api/v1/media/${storyId}/info/`
    },
    {
      name: 'Instagram Reels Media',
      url: `https://i.instagram.com/api/v1/feed/reels_media/?reel_ids=${username}`
    }
  ]

  const results = []

  for (const endpoint of endpoints) {
    try {
      console.log(`[DEBUG-STORY] 測試端點: ${endpoint.name}`)
      
      const response = await fetch(endpoint.url, {
        headers: {
          'User-Agent': 'Instagram 269.0.0.18.75 Android',
          'Accept': 'application/json',
          'X-IG-App-ID': '936619743392459'
        }
      })

      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        contentType: response.headers.get('content-type'),
        success: response.ok
      })

      if (response.ok && response.headers.get('content-type')?.includes('json')) {
        try {
          const data = await response.json()
          results[results.length - 1].hasData = Object.keys(data).length > 0
          results[results.length - 1].dataKeys = Object.keys(data).slice(0, 5) // 前 5 個 keys
        } catch (e) {
          results[results.length - 1].jsonError = e.message
        }
      }

    } catch (error) {
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        success: false,
        error: error.message
      })
    }
  }

  return {
    success: true,
    results
  }
}

// 測試 5: CDN 推測測試
async function testCDNGuessing(storyId) {
  const baseId = storyId.substring(0, 11)
  
  const cdnPatterns = [
    `https://scontent.cdninstagram.com/v/t51.2885-15/e35/${storyId}_n.jpg`,
    `https://scontent.cdninstagram.com/v/t50.2886-16/${storyId}_n.mp4`,
    `https://scontent-lax3-1.cdninstagram.com/v/t51.2885-15/${baseId}.jpg`,
    `https://scontent-lax3-1.cdninstagram.com/v/t50.2886-16/${baseId}.mp4`,
    `https://instagram.fkhh1-2.fna.fbcdn.net/v/t51.2885-15/${baseId}.jpg`,
    `https://instagram.fkhh1-2.fna.fbcdn.net/v/t50.2886-16/${baseId}.mp4`
  ]

  const results = []

  for (const cdnUrl of cdnPatterns) {
    try {
      console.log(`[DEBUG-STORY] 測試 CDN: ${cdnUrl}`)
      
      const response = await fetch(cdnUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'facebookexternalhit/1.1',
          'Referer': 'https://www.instagram.com/'
        }
      })

      results.push({
        url: cdnUrl,
        status: response.status,
        contentLength: response.headers.get('content-length'),
        contentType: response.headers.get('content-type'),
        success: response.ok
      })

    } catch (error) {
      results.push({
        url: cdnUrl,
        success: false,
        error: error.message
      })
    }
  }

  return {
    success: true,
    results,
    summary: `測試了 ${cdnPatterns.length} 個 CDN URL，成功 ${results.filter(r => r.success).length} 個`
  }
}

// 測試 6: 元數據提取測試
async function testMetadataExtraction(url) {
  try {
    console.log(`[DEBUG-STORY] 提取元數據`)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
      }
    })

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: '無法獲取頁面進行元數據提取'
      }
    }

    const html = await response.text()
    
    // 提取各種元數據
    const metaTags = {
      ogVideo: extractMetaContent(html, 'og:video'),
      ogImage: extractMetaContent(html, 'og:image'),
      ogTitle: extractMetaContent(html, 'og:title'),
      ogDescription: extractMetaContent(html, 'og:description'),
      twitterPlayer: extractMetaContent(html, 'twitter:player'),
      twitterImage: extractMetaContent(html, 'twitter:image')
    }

    return {
      success: true,
      status: response.status,
      metaTags,
      hasUsefulMeta: Object.values(metaTags).some(v => v && (v.includes('.mp4') || v.includes('.jpg')))
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// 輔助函數：提取 meta 標籤內容
function extractMetaContent(html, property) {
  const patterns = [
    new RegExp(`<meta\\s+property="${property}"\\s+content="([^"]+)"`, 'i'),
    new RegExp(`<meta\\s+name="${property}"\\s+content="([^"]+)"`, 'i'),
    new RegExp(`<meta\\s+content="([^"]+)"\\s+property="${property}"`, 'i'),
    new RegExp(`<meta\\s+content="([^"]+)"\\s+name="${property}"`, 'i')
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

// 生成診斷總結
function generateSummary(debugInfo) {
  const { tests, username, storyId } = debugInfo
  
  const summary = {
    diagnosis: [],
    recommendations: [],
    technicalFindings: []
  }

  // 分析基本連通性
  const connectivity = tests.find(t => t.name === '基本連通性測試')
  if (connectivity && !connectivity.success) {
    summary.diagnosis.push('❌ Story URL 無法訪問')
    summary.recommendations.push('檢查 URL 是否正確或 Story 是否已過期')
  }

  // 分析用戶頁面
  const userPage = tests.find(t => t.name === '用戶頁面訪問測試')
  if (userPage?.userInfo?.isPrivate) {
    summary.diagnosis.push('🔒 該帳號為私人帳號')
    summary.recommendations.push('私人帳號的 Story 通常需要登入才能訪問')
  }

  if (!userPage?.userInfo?.hasStories) {
    summary.diagnosis.push('📭 該帳號當前可能沒有活躍的 Stories')
  }

  // 分析 Story 頁面
  const storyPage = tests.find(t => t.name === 'Story 頁面分析')
  if (storyPage?.analysis?.isLoginPage) {
    summary.diagnosis.push('🚫 Story 頁面重定向到登入頁面')
    summary.recommendations.push('需要有效的登入 session 才能訪問此 Story')
  }

  if (storyPage?.foundUrls?.length > 0) {
    summary.technicalFindings.push(`💡 在頁面中發現 ${storyPage.foundUrls.length} 個潛在媒體 URL`)
  }

  // 分析 API 端點
  const apiTest = tests.find(t => t.name === 'API 端點測試')
  const workingEndpoints = apiTest?.results?.filter(r => r.success)?.length || 0
  
  if (workingEndpoints === 0) {
    summary.diagnosis.push('🚨 所有 API 端點都無法訪問')
    summary.recommendations.push('Instagram 可能已加強對此 Story 的保護')
  } else {
    summary.technicalFindings.push(`✅ 有 ${workingEndpoints} 個 API 端點可訪問`)
  }

  // 分析 CDN 推測
  const cdnTest = tests.find(t => t.name === 'CDN 推測測試')
  const workingCDNs = cdnTest?.results?.filter(r => r.success)?.length || 0
  
  if (workingCDNs > 0) {
    summary.technicalFindings.push(`🎯 CDN 推測找到 ${workingCDNs} 個可能的 URL`)
  }

  return summary
}