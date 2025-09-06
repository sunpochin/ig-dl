/*
 * Instagram Stories 批量解析器 - API 處理器
 * 
 * 這個檔案就像一個 Stories 收集專家，能夠找出某個用戶的所有當前 Stories！
 * 
 * 工作原理：
 * 1. 接收前端傳來的 Instagram Stories 用戶頁面 URL
 * 2. 像瀏覽器一樣去訪問該用戶的 Stories
 * 3. 用多種方法找出該用戶所有可用的 Stories：
 *    - 解析 Stories tray 數據
 *    - 搜尋 GraphQL Stories 查詢
 *    - 尋找 Stories 的媒體列表
 * 4. 整理後回傳所有 Stories 的清單給前端
 * 
 * Stories 的特殊挑戰：
 * - 只有 24 小時的生命週期
 * - 需要登入狀態才能看到完整列表
 * - 每個 Story 有不同的媒體類型（影片/圖片）
 */

// 主要處理器：接收前端請求，解析 Instagram Stories
export default defineEventHandler(async (event) => {
  // 解析請求內容：從請求體中取得 Stories URL
  const body = await readBody(event)
  const { storiesUrl } = body

  // 輸入驗證：確保提供了 Stories URL
  if (!storiesUrl) {
    return {
      success: false,
      error: '請提供 Instagram Stories 連結'
    }
  }

  // URL 格式驗證：檢查是否為有效的 Instagram Stories 連結
  if (!storiesUrl.includes('instagram.com/stories/')) {
    return {
      success: false,
      error: '請提供有效的 Instagram Stories 連結（例如：https://www.instagram.com/stories/username/）'
    }
  }

  try {
    console.log(`[DEBUG] 開始解析 Stories: ${storiesUrl}`)
    const stories = await parseInstagramStories(storiesUrl)
    
    if (stories && stories.length > 0) {
      console.log(`[DEBUG] 成功找到 ${stories.length} 個 Stories`)
      return {
        success: true,
        stories: stories
      }
    }

    console.log('[DEBUG] 未找到任何 Stories')
    return {
      success: false,
      error: '未找到任何 Stories，可能原因：\n1. 該用戶當前沒有 Stories\n2. Stories 已過期（超過 24 小時）\n3. 該帳戶為私人帳戶\n4. 需要登入才能查看\n5. Instagram 可能更新了頁面結構'
    }
  } catch (error) {
    console.error('[DEBUG] 解析 Stories 發生錯誤:', error)
    return {
      success: false,
      error: `處理 Stories 請求時發生錯誤: ${error.message}`
    }
  }
})

// 主要 Stories 解析函數
async function parseInstagramStories(storiesUrl) {
  try {
    console.log('[DEBUG] Instagram Stories 解析開始...')
    
    // 清理 URL，確保格式正確
    let cleanUrl = storiesUrl.trim()
    if (cleanUrl.includes('?')) {
      cleanUrl = cleanUrl.split('?')[0]
    }
    if (!cleanUrl.endsWith('/')) {
      cleanUrl += '/'
    }
    
    console.log(`[DEBUG] 清理後的 Stories URL: ${cleanUrl}`)

    // 從 URL 提取用戶名
    const username = cleanUrl.match(/instagram\.com\/stories\/([^\/]+)/)?.[1]
    if (!username) {
      console.log('[DEBUG] 無法從 URL 提取用戶名')
      return []
    }
    
    console.log(`[DEBUG] 解析用戶: ${username}`)

    // 模擬手機瀏覽器訪問（Stories 通常在手機上更容易獲取）
    const headers = {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      // Stories 特定標頭
      'X-Requested-With': 'XMLHttpRequest',
      'X-Instagram-AJAX': '1'
    }

    // 方法 1: 直接訪問 Stories 頁面
    console.log('[DEBUG] 方法 1: 直接訪問 Stories 頁面...')
    const stories = await tryDirectStoriesAccess(cleanUrl, username, headers)
    if (stories.length > 0) {
      console.log(`[DEBUG] 直接訪問找到 ${stories.length} 個 Stories`)
      return stories
    }

    // 方法 2: 嘗試 GraphQL Stories API
    console.log('[DEBUG] 方法 2: 嘗試 GraphQL Stories API...')
    const graphqlStories = await tryStoriesGraphQL(username, headers)
    if (graphqlStories.length > 0) {
      console.log(`[DEBUG] GraphQL 找到 ${graphqlStories.length} 個 Stories`)
      return graphqlStories
    }

    // 方法 3: 嘗試用戶個人資料頁面
    console.log('[DEBUG] 方法 3: 從用戶個人資料頁面提取 Stories...')
    const profileStories = await tryStoriesFromProfile(username, headers)
    if (profileStories.length > 0) {
      console.log(`[DEBUG] 個人資料頁面找到 ${profileStories.length} 個 Stories`)
      return profileStories
    }

    console.log('[DEBUG] 所有方法都未找到 Stories')
    return []

  } catch (error) {
    console.log(`[DEBUG] Instagram Stories 解析發生錯誤: ${error.message}`)
    throw error
  }
}

// 方法 1: 直接訪問 Stories 頁面
async function tryDirectStoriesAccess(storiesUrl, username, headers) {
  try {
    console.log('[DEBUG] 直接訪問 Stories 頁面...')
    
    const response = await fetch(storiesUrl, { 
      headers,
      redirect: 'manual' // 不自動跟隨重定向，讓我們看到實際發生了什麼
    })
    console.log(`[DEBUG] Stories 頁面響應狀態: ${response.status}`)
    console.log(`[DEBUG] 響應頭:`, JSON.stringify(Object.fromEntries(response.headers)))
    
    // 檢查重定向
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      console.log(`[DEBUG] 被重定向到: ${location}`)
      
      // 如果重定向到登入頁面，嘗試其他方法
      if (location && location.includes('/accounts/login')) {
        console.log('[DEBUG] 確認需要登入，嘗試替代方法...')
        return await tryAlternativeStoriesAccess(username, headers)
      }
    }
    
    if (response.status !== 200) {
      console.log(`[DEBUG] Stories 頁面訪問失敗: HTTP ${response.status}`)
      return await tryAlternativeStoriesAccess(username, headers)
    }

    const html = await response.text()
    console.log(`[DEBUG] Stories HTML 長度: ${html.length}`)
    
    // 檢查前面和後面各 500 字符，看看是什麼內容
    console.log('[DEBUG] HTML 前 500 字元:')
    console.log(html.substring(0, 500))
    console.log('[DEBUG] HTML 後 500 字元:')
    console.log(html.substring(Math.max(0, html.length - 500)))
    
    // 檢查是否被重定向到登入頁面
    const loginIndicators = [
      'loginForm', 'Log In', 'login', 'Sign Up', 'Create account',
      'instagram.com/accounts/login', 'Please log in'
    ]
    const hasLogin = loginIndicators.some(indicator => html.includes(indicator))
    if (hasLogin) {
      console.log('[DEBUG] 警告：頁面包含登入相關內容，可能需要認證')
      return await tryAlternativeStoriesAccess(username, headers)
    }
    
    // 檢查是否包含 Stories 相關關鍵字
    const storyKeywords = ['story', 'stories', 'reel', 'media', 'video', 'image']
    let totalKeywords = 0
    storyKeywords.forEach(keyword => {
      const count = (html.match(new RegExp(keyword, 'gi')) || []).length
      if (count > 0) {
        console.log(`[DEBUG] HTML 包含關鍵字 "${keyword}": ${count} 次`)
        totalKeywords += count
      }
    })
    
    console.log(`[DEBUG] 總共找到 ${totalKeywords} 個相關關鍵字`)

    // 搜尋 Stories 數據
    return extractStoriesFromHTML(html, username)
  } catch (error) {
    console.log(`[DEBUG] 直接 Stories 訪問失敗: ${error.message}`)
    return []
  }
}

// 嘗試替代方法獲取 Stories
async function tryAlternativeStoriesAccess(username, headers) {
  console.log('[DEBUG] 嘗試替代方法獲取 Stories...')
  
  // 嘗試不同的 URL 格式和方法
  const alternatives = [
    `https://www.instagram.com/${username}/?__a=1`,
    `https://www.instagram.com/${username}/channel/`,
    `https://i.instagram.com/api/v1/users/web_info/?username=${username}`,
    `https://www.instagram.com/web/search/topsearch/?query=${username}`
  ]
  
  for (let i = 0; i < alternatives.length; i++) {
    const url = alternatives[i]
    console.log(`[DEBUG] 嘗試替代方法 ${i + 1}: ${url}`)
    
    try {
      const response = await fetch(url, { headers })
      console.log(`[DEBUG] 替代方法 ${i + 1} 響應狀態: ${response.status}`)
      
      if (response.ok) {
        const content = await response.text()
        console.log(`[DEBUG] 替代方法 ${i + 1} 內容長度: ${content.length}`)
        console.log(`[DEBUG] 替代方法 ${i + 1} 內容類型: ${response.headers.get('content-type')}`)
        
        // 檢查前 200 字符
        console.log(`[DEBUG] 替代方法 ${i + 1} 前 200 字符:`)
        console.log(content.substring(0, 200))
        
        // 嘗試從這個內容中提取 Stories
        const stories = extractStoriesFromHTML(content, username)
        if (stories.length > 0) {
          console.log(`[DEBUG] 替代方法 ${i + 1} 找到 ${stories.length} 個 Stories`)
          return stories
        }
      }
    } catch (error) {
      console.log(`[DEBUG] 替代方法 ${i + 1} 失敗: ${error.message}`)
    }
  }
  
  return []
}

// 方法 2: GraphQL Stories API
async function tryStoriesGraphQL(username, headers) {
  try {
    console.log('[DEBUG] 嘗試 GraphQL Stories API...')
    
    // Stories 相關的 GraphQL 查詢
    const queries = [
      {
        query_hash: '15463e8449a83d3d60b06be7e90627c7', // Stories query
        variables: {
          reel_ids: [],
          tag_names: [],
          location_ids: [],
          highlight_reel_ids: [],
          precomposed_overlay: false,
          show_story_viewer_list: false,
          story_viewer_fetch_count: 50,
          story_viewer_cursor: ""
        }
      },
      {
        query_hash: '90709b530ea0969f002c3707a3cd4d3c', // User stories query  
        variables: {
          user_id: username,
          include_chaining: false,
          include_reel: true,
          include_suggested_users: false,
          include_logged_out_extras: false,
          include_highlight_reels: false
        }
      }
    ]

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      const url = `https://www.instagram.com/graphql/query/?query_hash=${query.query_hash}&variables=${encodeURIComponent(JSON.stringify(query.variables))}`
      
      console.log(`[DEBUG] 嘗試 GraphQL 查詢 ${i + 1}...`)
      
      try {
        const response = await fetch(url, {
          headers: {
            ...headers,
            'X-CSRFToken': 'missing'
          }
        })
        
        console.log(`[DEBUG] GraphQL 查詢 ${i + 1} 響應狀態: ${response.status}`)
        
        if (response.ok) {
          const data = await response.json()
          const stories = extractStoriesFromGraphQL(data, username)
          if (stories.length > 0) {
            return stories
          }
        }
      } catch (error) {
        console.log(`[DEBUG] GraphQL 查詢 ${i + 1} 失敗: ${error.message}`)
      }
    }

    return []
  } catch (error) {
    console.log(`[DEBUG] GraphQL Stories 失敗: ${error.message}`)
    return []
  }
}

// 方法 3: 從用戶個人資料頁面提取 Stories
async function tryStoriesFromProfile(username, headers) {
  try {
    console.log('[DEBUG] 從個人資料頁面提取 Stories...')
    
    const profileUrl = `https://www.instagram.com/${username}/`
    const response = await fetch(profileUrl, { headers })
    
    console.log(`[DEBUG] 個人資料頁面響應狀態: ${response.status}`)
    
    if (!response.ok) {
      return []
    }

    const html = await response.text()
    console.log(`[DEBUG] 個人資料 HTML 長度: ${html.length}`)

    // 從個人資料頁面提取 Stories 資訊
    return extractStoriesFromProfileHTML(html, username)
  } catch (error) {
    console.log(`[DEBUG] 個人資料 Stories 提取失敗: ${error.message}`)
    return []
  }
}

// 從 HTML 中提取 Stories
function extractStoriesFromHTML(html, username) {
  const stories = []
  try {
    console.log('[DEBUG] 從 HTML 提取 Stories...')
    
    // 深度搜尋任何可能包含 Story ID 的模式
    console.log('[DEBUG] 深度搜尋 Story 相關數據...')
    
    // 方法 1: 搜尋 window.__additionalDataLoaded 或類似的全域變數
    const globalVarPatterns = [
      /window\.__additionalDataLoaded\s*\([^)]+\)/g,
      /window\._sharedData\s*=\s*({.*?});/g,
      /window\.__initialData\s*=\s*({.*?});/g
    ]
    
    for (const pattern of globalVarPatterns) {
      const matches = html.match(pattern) || []
      console.log(`[DEBUG] 全域變數模式找到 ${matches.length} 個匹配`)
      
      if (matches.length > 0) {
        matches.forEach(match => {
          console.log(`[DEBUG] 全域變數內容前 500 字元: ${match.substring(0, 500)}`)
        })
      }
    }
    
    // 方法 2: 搜尋 Stories 相關的 JSON 數據（擴展模式）
    const jsonPatterns = [
      /"story_media":\[[^\]]+\]/g,
      /"reels_media":\[[^\]]+\]/g,
      /"items":\[[^\]]+\]/g,
      /"reels":\{[^}]+\}/g,
      /"tray":\[[^\]]+\]/g,
      /"story_highlights":\[[^\]]+\]/g,
      /"user":\{[^}]*"has_story"[^}]+\}/g
    ]

    for (const pattern of jsonPatterns) {
      const matches = html.match(pattern) || []
      console.log(`[DEBUG] JSON 模式找到 ${matches.length} 個匹配`)
      
      for (const match of matches) {
        try {
          const jsonStr = match.replace(/^[^:]*:/, '')
          const data = JSON.parse(jsonStr)
          
          if (Array.isArray(data)) {
            data.forEach((item, index) => {
              if (item.id || item.pk) {
                const story = extractStoryInfo(item, username, index)
                if (story) {
                  stories.push(story)
                }
              }
            })
          }
        } catch {
          // 繼續嘗試下一個匹配
        }
      }
    }

    // 方法 3: 使用多種正則表達式搜尋可能的 Story ID
    console.log('[DEBUG] 搜尋各種 Story ID 模式...')
    const storyIdPatterns = [
      /story_pk_id['"]\s*:\s*['"]([^'"]+)['"]/g,
      /story_media_id['"]\s*:\s*['"]([^'"]+)['"]/g,
      /instagram\.com\/stories\/[^\/]+\/(\d+)/g,
      /"pk":\s*"?(\d{10,})"?/g,
      /"id":\s*"(\d+_\d+)"/g,
      /data-story-id="([^"]+)"/g,
      /data-media-id="([^"]+)"/g
    ]
    
    const allStoryIds = new Set()
    storyIdPatterns.forEach((pattern, index) => {
      const matches = [...html.matchAll(pattern)]
      console.log(`[DEBUG] Story ID 模式 ${index + 1} 找到 ${matches.length} 個匹配`)
      matches.forEach(match => {
        const id = match[1]
        if (id && id.length > 5 && !id.includes('_') && /^\d+$/.test(id)) {
          allStoryIds.add(id)
        }
      })
    })
    
    console.log(`[DEBUG] 找到 ${allStoryIds.size} 個唯一的潛在 Story ID`)
    allStoryIds.forEach(id => {
      console.log(`[DEBUG] 潛在 Story ID: ${id}`)
    })
    
    // 方法 4: 搜尋任何看起來像 Instagram ID 的數字串
    const numericIdPattern = /\b(\d{15,20})\b/g
    const numericMatches = [...html.matchAll(numericIdPattern)]
    console.log(`[DEBUG] 找到 ${numericMatches.length} 個潛在的數字 ID`)
    
    numericMatches.forEach(match => {
      const id = match[1]
      // Instagram Story ID 通常是 17-19 位數字
      if (id.length >= 17 && id.length <= 19) {
        allStoryIds.add(id)
        console.log(`[DEBUG] 添加數字 ID: ${id}`)
      }
    })
    
    // 將找到的所有 Story ID 轉換為 Story 對象
    Array.from(allStoryIds).forEach((storyId, index) => {
      stories.push({
        id: storyId,
        url: `https://www.instagram.com/stories/${username}/${storyId}/`,
        thumbnail: '',
        title: `Story ${index + 1}`,
        media_type: 'unknown',
        timestamp: new Date().toISOString()
      })
    })

    console.log(`[DEBUG] HTML 提取完成，找到 ${stories.length} 個 Stories`)
    return stories.slice(0, 20) // 限制最多 20 個
  } catch (error) {
    console.log(`[DEBUG] HTML Stories 提取失敗: ${error.message}`)
    return []
  }
}

// 從 GraphQL 響應中提取 Stories
function extractStoriesFromGraphQL(data, username) {
  const stories = []
  try {
    console.log('[DEBUG] 從 GraphQL 響應提取 Stories...')
    
    // 嘗試多種 GraphQL 路徑
    const possiblePaths = [
      data?.data?.reels_media,
      data?.data?.user?.story_highlights?.edges,
      data?.data?.user?.reel?.items,
      data?.reels_media
    ]

    for (const path of possiblePaths) {
      if (Array.isArray(path)) {
        console.log(`[DEBUG] GraphQL 找到 ${path.length} 個項目`)
        
        path.forEach((item, index) => {
          const story = extractStoryInfo(item.node || item, username, index)
          if (story) {
            stories.push(story)
          }
        })
        break
      }
    }

    console.log(`[DEBUG] GraphQL 提取完成，找到 ${stories.length} 個 Stories`)
    return stories.slice(0, 20)
  } catch (error) {
    console.log(`[DEBUG] GraphQL Stories 提取失敗: ${error.message}`)
    return []
  }
}

// 從個人資料 HTML 中提取 Stories
function extractStoriesFromProfileHTML(html, username) {
  const stories = []
  try {
    console.log('[DEBUG] 從個人資料 HTML 提取 Stories...')
    
    // 搜尋個人資料頁面中的 Stories 指示器
    const storyIndicators = [
      /"has_stories":\s*true/g,
      /"story_highlights":\[[^\]]+\]/g,
      /"highlight_reel_count":\s*(\d+)/g
    ]

    let hasStories = false
    for (const indicator of storyIndicators) {
      if (html.match(indicator)) {
        hasStories = true
        console.log('[DEBUG] 個人資料頁面顯示該用戶有 Stories')
        break
      }
    }

    if (hasStories) {
      // 如果檢測到有 Stories，創建一個通用的 Stories 項目
      // 實際的 Story ID 需要通過其他方式獲取
      stories.push({
        id: 'latest',
        url: `https://www.instagram.com/stories/${username}/`,
        thumbnail: '',
        title: '查看最新 Stories',
        media_type: 'mixed',
        timestamp: new Date().toISOString()
      })
    }

    console.log(`[DEBUG] 個人資料提取完成，找到 ${stories.length} 個 Stories`)
    return stories
  } catch (error) {
    console.log(`[DEBUG] 個人資料 Stories 提取失敗: ${error.message}`)
    return []
  }
}

// 提取單個 Story 資訊
function extractStoryInfo(storyData, username, index) {
  try {
    const story = {
      id: storyData.pk || storyData.id || storyData.story_id || `story_${index}`,
      url: `https://www.instagram.com/stories/${username}/${storyData.pk || storyData.id || 'unknown'}/`,
      thumbnail: storyData.image_versions2?.candidates?.[0]?.url || storyData.display_url || '',
      title: storyData.caption?.text || `Story ${index + 1}`,
      media_type: storyData.media_type === 2 ? 'video' : 'image',
      duration: storyData.video_duration || null,
      timestamp: storyData.taken_at ? new Date(storyData.taken_at * 1000).toISOString() : new Date().toISOString()
    }

    // 確保有效的 ID
    if (story.id && story.id !== 'unknown' && story.id !== `story_${index}`) {
      return story
    }

    return null
  } catch (error) {
    console.log(`[DEBUG] Story 資訊提取失敗: ${error.message}`)
    return null
  }
}