/*
 * Instagram 個人檔案解析器 - API 處理器
 * 
 * 這個檔案的工作就像一個聰明的探險家，專門找出 Instagram 個人檔案中的所有 Reels！
 * 
 * 工作原理：
 * 1. 接收前端傳來的 Instagram 個人檔案網址
 * 2. 像瀏覽器一樣去訪問該個人檔案頁面
 * 3. 用多種方法在網頁中尋找所有 Reels 的資訊：
 *    - 找到每個 Reel 的網址
 *    - 找到每個 Reel 的縮圖
 *    - 找到每個 Reel 的標題或描述
 * 4. 整理後回傳最近 10 個 Reels 的清單給前端
 * 
 * 就像去書店找一個作者的所有新書，然後列出書單給你選擇！
 */

// 主要處理器：接收前端請求，解析 Instagram 個人檔案
export default defineEventHandler(async (event) => {
  // 解析請求內容：從請求體中取得個人檔案 URL
  const body = await readBody(event)
  const { profileUrl } = body

  // 輸入驗證：確保提供了個人檔案 URL
  if (!profileUrl) {
    return {
      success: false,
      error: '請提供 Instagram 個人檔案連結'
    }
  }

  // URL 格式驗證：檢查是否為有效的 Instagram 個人檔案連結
  if (!profileUrl.includes('instagram.com/') || profileUrl.includes('/p/') || profileUrl.includes('/reel/')) {
    return {
      success: false,
      error: '請提供有效的 Instagram 個人檔案連結（例如：https://www.instagram.com/username/）'
    }
  }

  try {
    console.log(`[DEBUG] 開始解析個人檔案: ${profileUrl}`)
    const reels = await parseInstagramProfile(profileUrl)
    
    if (reels && reels.length > 0) {
      console.log(`[DEBUG] 成功找到 ${reels.length} 個 Reels`)
      return {
        success: true,
        reels: reels.slice(0, 10) // 只回傳最近 10 個
      }
    }

    console.log('[DEBUG] 未找到任何 Reels')
    return {
      success: false,
      error: '未找到任何 Reels，可能原因：\n1. 該帳戶為私人帳戶\n2. 該帳戶沒有發布 Reels\n3. Instagram 已更新防爬蟲機制\n4. 需要登入才能查看完整內容\n\n建議：\n• 嘗試使用其他工具（如 yt-dlp）\n• 或直接在 Instagram 查看並手動複製 Reel 連結來單獨下載'
    }
  } catch (error) {
    console.error('[DEBUG] 解析個人檔案發生錯誤:', error)
    return {
      success: false,
      error: `處理請求時發生錯誤: ${error.message}`
    }
  }
})

// 主要解析函數：從 Instagram 個人檔案頁面提取 Reels 資訊
async function parseInstagramProfile(profileUrl) {
  try {
    console.log('[DEBUG] Instagram 個人檔案解析開始...')
    
    // 清理 URL，確保格式正確
    let cleanUrl = profileUrl.trim()
    if (cleanUrl.includes('?')) {
      cleanUrl = cleanUrl.split('?')[0]
    }
    if (!cleanUrl.endsWith('/')) {
      cleanUrl += '/'
    }

    console.log(`[DEBUG] 清理後的 URL: ${cleanUrl}`)

    // 模擬真實瀏覽器的請求頭，避免被重定向到登入頁面
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      // 添加一些常見的瀏覽器標頭
      'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      // 避免被識別為爬蟲
      'Connection': 'keep-alive',
      'DNT': '1'
    }

    // 訪問 Instagram 個人檔案頁面
    console.log('[DEBUG] 嘗試訪問 Instagram 個人檔案頁面...')
    const response = await fetch(cleanUrl, { headers })
    
    console.log(`[DEBUG] Instagram 響應狀態: ${response.status}`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    console.log(`[DEBUG] HTML 長度: ${html.length}`)

    // 除錯：輸出 HTML 的一部分來分析結構
    console.log('[DEBUG] HTML 前 2000 字元:', html.substring(0, 2000))
    
    // 搜尋是否包含常見的 reels 相關關鍵字
    const reelsKeywords = ['reel', 'shortcode', 'video', 'clips', 'media', 'GraphQL']
    for (const keyword of reelsKeywords) {
      const count = (html.match(new RegExp(keyword, 'gi')) || []).length
      if (count > 0) {
        console.log(`[DEBUG] HTML 包含關鍵字 "${keyword}": ${count} 次`)
      }
    }
    
    // 檢查是否為登入頁面或被封鎖
    if (html.includes('loginForm') || html.includes('Log In') || html.includes('login')) {
      console.log('[DEBUG] 警告：可能被重定向到登入頁面')
    }
    
    // 檢查是否為完整的個人檔案頁面
    const hasProfile = html.includes('ProfilePage') || html.includes('User') || html.includes('edge_owner_to_timeline_media')
    console.log(`[DEBUG] 頁面是否包含個人檔案數據: ${hasProfile}`)
    
    // 輸出更多關於頁面結構的資訊
    console.log('[DEBUG] HTML 中搜尋關鍵結構...')
    const structures = [
      'edge_owner_to_timeline_media',
      'edge_felix_video_timeline',
      'ProfilePageContainer',
      'user',
      '"media"',
      'shortcode'
    ]
    
    structures.forEach(struct => {
      const count = (html.match(new RegExp(struct, 'gi')) || []).length
      if (count > 0) {
        console.log(`[DEBUG] 找到結構 "${struct}": ${count} 次`)
        
        // 如果找到這些結構，輸出周圍的內容
        if (['edge_owner_to_timeline_media', 'edge_felix_video_timeline', 'shortcode'].includes(struct)) {
          const regex = new RegExp(`.{0,200}${struct}.{0,200}`, 'gi')
          const contexts = html.match(regex) || []
          contexts.slice(0, 3).forEach((context, index) => {
            console.log(`[DEBUG] ${struct} 上下文 ${index + 1}: ${context.substring(0, 400)}`)
          })
        }
      }
    })

    // 方法 1: 尋找 JSON-LD 結構化數據
    console.log('[DEBUG] === 開始嘗試方法 1: JSON-LD 結構化數據 ===')
    const reelsFromJsonLd = findReelsInJsonLd(html)
    if (reelsFromJsonLd.length > 0) {
      console.log(`[DEBUG] JSON-LD 找到 ${reelsFromJsonLd.length} 個 Reels`)
      return reelsFromJsonLd
    }

    console.log('[DEBUG] JSON-LD 方法未找到結果')

    // 方法 2: 尋找 window._sharedData 或類似的全域變數
    console.log('[DEBUG] === 開始嘗試方法 2: SharedData 全域變數 ===')
    const reelsFromSharedData = findReelsInSharedData(html)
    if (reelsFromSharedData.length > 0) {
      console.log(`[DEBUG] SharedData 找到 ${reelsFromSharedData.length} 個 Reels`)
      return reelsFromSharedData
    }
    console.log('[DEBUG] SharedData 方法未找到結果')

    // 方法 3: 尋找現代 Instagram 的數據結構
    console.log('[DEBUG] === 開始嘗試方法 3: 現代數據結構 ===')
    const reelsFromModernData = findReelsInModernData(html)
    if (reelsFromModernData.length > 0) {
      console.log(`[DEBUG] 現代數據結構找到 ${reelsFromModernData.length} 個 Reels`)
      return reelsFromModernData
    }
    console.log('[DEBUG] 現代數據結構方法未找到結果')

    // 方法 4: 使用正則表達式尋找 Reels 連結
    console.log('[DEBUG] === 開始嘗試方法 4: 正則表達式匹配 ===')
    const reelsFromRegex = findReelsWithRegex(html)
    if (reelsFromRegex.length > 0) {
      console.log(`[DEBUG] 正則表達式找到 ${reelsFromRegex.length} 個 Reels`)
      return reelsFromRegex
    }
    console.log('[DEBUG] 正則表達式方法未找到結果')

    // 方法 5: 深度分析 JavaScript 中的所有變數和數據
    console.log('[DEBUG] === 開始嘗試方法 5: 深度 JavaScript 分析 ===')
    const reelsFromDeepAnalysis = analyzeAllJavaScriptData(html)
    if (reelsFromDeepAnalysis.length > 0) {
      console.log(`[DEBUG] JavaScript 深度分析找到 ${reelsFromDeepAnalysis.length} 個 Reels`)
      return reelsFromDeepAnalysis
    }
    console.log('[DEBUG] JavaScript 深度分析方法未找到結果')

    // 方法 6: 嘗試訪問 Instagram 的公開 JSON API
    console.log('[DEBUG] === 開始嘗試方法 6: Instagram JSON API ===')
    const reelsFromApi = await tryInstagramApi(cleanUrl, headers)
    if (reelsFromApi.length > 0) {
      console.log(`[DEBUG] Instagram API 找到 ${reelsFromApi.length} 個 Reels`)
      return reelsFromApi
    }
    console.log('[DEBUG] Instagram API 方法未找到結果')

    // 方法 7: 嘗試 Instagram 的內部 GraphQL 端點
    console.log('[DEBUG] === 開始嘗試方法 7: GraphQL 端點 ===')
    const reelsFromGraphQL = await tryInstagramGraphQL(cleanUrl, headers)
    if (reelsFromGraphQL.length > 0) {
      console.log(`[DEBUG] GraphQL 端點找到 ${reelsFromGraphQL.length} 個 Reels`)
      return reelsFromGraphQL
    }
    console.log('[DEBUG] GraphQL 端點方法未找到結果')

    console.log('[DEBUG] 所有方法都未找到 Reels')
    console.log('[DEBUG] 建議：Instagram 可能已經更改了其數據載入機制')
    console.log('[DEBUG] 可能需要使用瀏覽器自動化工具（如 Puppeteer）來獲取動態載入的內容')
    return []

  } catch (error) {
    console.log(`[DEBUG] Instagram 個人檔案解析發生錯誤: ${error.message}`)
    throw error
  }
}

// 輔助函數：從 JSON-LD 結構化數據中尋找 Reels
function findReelsInJsonLd(html) {
  const reels = []
  try {
    console.log('[DEBUG] 搜尋 JSON-LD 結構化數據...')
    const jsonLdMatches = html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)
    console.log(`[DEBUG] 找到 ${jsonLdMatches?.length || 0} 個 JSON-LD script 標籤`)
    
    if (jsonLdMatches) {
      for (let i = 0; i < jsonLdMatches.length; i++) {
        const match = jsonLdMatches[i]
        console.log(`[DEBUG] 處理 JSON-LD 區塊 ${i + 1}...`)
        try {
          const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '')
          const data = JSON.parse(jsonContent)
          
          if (data.mainEntity && data.mainEntity.video) {
            // 找到影片相關數據
            const videoData = data.mainEntity.video
            if (Array.isArray(videoData)) {
              videoData.forEach(video => {
                if (video.embedUrl && video.embedUrl.includes('/reel/')) {
                  reels.push(extractReelInfo(video))
                }
              })
            }
          }
        } catch {
          // 繼續嘗試下一個 JSON-LD 區塊
        }
      }
    }
  } catch (error) {
    console.log('[DEBUG] JSON-LD 解析失敗:', error)
  }
  return reels
}

// 輔助函數：從 SharedData 中尋找 Reels
function findReelsInSharedData(html) {
  const reels = []
  try {
    console.log('[DEBUG] 搜尋 window._sharedData...')
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.*?});/)
    console.log(`[DEBUG] window._sharedData ${sharedDataMatch ? '找到' : '未找到'}`)
    
    if (sharedDataMatch) {
      console.log('[DEBUG] 嘗試解析 _sharedData JSON...')
      const sharedData = JSON.parse(sharedDataMatch[1])
      console.log('[DEBUG] _sharedData 解析成功，開始搜尋 Reels...')
      
      // 遍歷 sharedData 尋找 Reels
      const reelsData = findReelsInObject(sharedData)
      reelsData.forEach(reel => reels.push(reel))
    }
  } catch (error) {
    console.log('[DEBUG] SharedData 解析失敗:', error)
  }
  return reels
}

// 輔助函數：從現代 Instagram 數據結構中尋找 Reels
function findReelsInModernData(html) {
  const reels = []
  try {
    console.log('[DEBUG] 搜尋現代 Instagram 數據結構...')
    
    // 方法 1: 搜尋 GraphQL 相關數據
    console.log('[DEBUG] 搜尋 GraphQL 數據...')
    // 更安全的 GraphQL 匹配模式
    const graphqlPatterns = [
      /{"data":{"user":{"edge_owner_to_timeline_media":[^}]+}}/g,
      /{"data":{"user":[^{]*{"edge_owner_to_timeline_media":[^}]+}/g,
      /"edge_owner_to_timeline_media":\{"count":\d+,"page_info":[^}]+,"edges":\[[^\]]+\]/g
    ]
    
    let graphqlMatches = []
    graphqlPatterns.forEach((pattern, index) => {
      const matches = html.match(pattern) || []
      console.log(`[DEBUG] GraphQL 模式 ${index + 1} 找到 ${matches.length} 個匹配`)
      graphqlMatches = graphqlMatches.concat(matches)
    })
    
    console.log(`[DEBUG] 總共找到 ${graphqlMatches.length} 個 GraphQL 匹配`)
    
    if (graphqlMatches) {
      graphqlMatches.forEach((match, index) => {
        console.log(`[DEBUG] 處理 GraphQL 匹配 ${index + 1}...`)
        try {
          const data = JSON.parse(match)
          if (data.data && data.data.user && data.data.user.edge_owner_to_timeline_media) {
            const mediaNodes = data.data.user.edge_owner_to_timeline_media.edges
            console.log(`[DEBUG] GraphQL 找到 ${mediaNodes.length} 個媒體節點`)
            mediaNodes.forEach(edge => {
              const node = edge.node
              if (node.is_video && node.shortcode) {
                console.log(`[DEBUG] 找到 video shortcode: ${node.shortcode}`)
                reels.push({
                  id: node.shortcode,
                  url: `https://www.instagram.com/reel/${node.shortcode}/`,
                  thumbnail: node.display_url || node.thumbnail_src || '',
                  title: node.edge_media_to_caption?.edges?.[0]?.node?.text || '點擊查看內容'
                })
              }
            })
          }
        } catch (e) {
          console.log(`[DEBUG] GraphQL 匹配 ${index + 1} 解析失敗:`, e.message)
        }
      })
    }
    
    // 方法 2: 搜尋 window.__additionalDataLoaded 或其他全域變數
    console.log('[DEBUG] 搜尋其他全域變數...')
    const additionalDataMatches = html.match(/window\.__additionalDataLoaded\s*=\s*({.*?});|window\._n_cfg\s*=\s*({.*?});/g)
    console.log(`[DEBUG] 找到 ${additionalDataMatches?.length || 0} 個額外數據匹配`)
    
    // 方法 3: 更廣泛搜尋 shortcode 和相關資訊
    console.log('[DEBUG] 搜尋 shortcode 和相關資訊...')
    
    // 嘗試多種 shortcode 格式，排除常見的錯誤匹配
    const shortcodePatterns = [
      /"shortcode":"([A-Za-z0-9_-]{6,}[A-Za-z0-9])"/g, // shortcode 至少 7 位，不以 - 結尾
      /\/p\/([A-Za-z0-9_-]{6,}[A-Za-z0-9])\//g,        // URL 中的 p/ 路徑
      /\/reel\/([A-Za-z0-9_-]{6,}[A-Za-z0-9])\//g,      // URL 中的 reel/ 路徑
      /"code":"([A-Za-z0-9_-]{6,}[A-Za-z0-9])"/g        // code 欄位
    ]
    
    // 需要排除的常見錯誤匹配
    const excludePatterns = [
      'en_US', 'zh_TW', 'fr_FR', 'es_ES', 'de_DE', 'ja_JP', 'ko_KR',
      'pt_BR', 'it_IT', 'nl_NL', 'ru_RU', 'ar_AR', 'hi_IN', 'th_TH'
    ]
    
    let allShortcodes = new Set()
    
    shortcodePatterns.forEach((pattern, index) => {
      const matches = [...html.matchAll(pattern)]
      console.log(`[DEBUG] Shortcode 模式 ${index + 1} 找到 ${matches.length} 個匹配`)
      matches.forEach(match => {
        const shortcode = match[1]
        // 排除常見的錯誤匹配
        if (!excludePatterns.includes(shortcode) && shortcode.length >= 7) {
          allShortcodes.add(shortcode)
          console.log(`[DEBUG] 有效 shortcode: ${shortcode}`)
        } else {
          console.log(`[DEBUG] 排除無效 shortcode: ${shortcode}`)
        }
      })
    })
    
    console.log(`[DEBUG] 總共找到 ${allShortcodes.size} 個唯一的 shortcode`)
    const shortcodeMatches = Array.from(allShortcodes).map(code => `"shortcode":"${code}"`)
    
    // 處理找到的 shortcode
    if (allShortcodes.size > 0) {
      Array.from(allShortcodes).forEach(shortcode => {
        console.log(`[DEBUG] 處理 shortcode: ${shortcode}`)
        
        // 為每個 shortcode 建立基本的 reel 資訊
        reels.push({
          id: shortcode,
          url: `https://www.instagram.com/reel/${shortcode}/`,
          thumbnail: '',
          title: '點擊查看內容'
        })
      })
    }
    
    // 去重
    const uniqueReels = reels.reduce((acc, reel) => {
      if (!acc.find(r => r.id === reel.id)) {
        acc.push(reel)
      }
      return acc
    }, [])
    
    console.log(`[DEBUG] 現代數據結構總共找到 ${uniqueReels.length} 個獨特的 Reels`)
    return uniqueReels
    
  } catch (error) {
    console.log('[DEBUG] 現代數據結構解析失敗:', error)
  }
  return reels
}

// 輔助函數：使用正則表達式尋找 Reels 連結
function findReelsWithRegex(html) {
  const reels = []
  try {
    console.log('[DEBUG] 使用正則表達式全面搜尋連結...')
    
    // 使用多種模式搜尋
    const patterns = [
      /\/reel\/([A-Za-z0-9_-]+)\//g,
      /\/p\/([A-Za-z0-9_-]+)\//g,
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/g,
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/g,
      /"permalink":"[^"]*\/reel\/([A-Za-z0-9_-]+)"/g,
      /"permalink":"[^"]*\/p\/([A-Za-z0-9_-]+)"/g
    ]
    
    let allMatches = []
    patterns.forEach((pattern, index) => {
      const matches = [...html.matchAll(pattern)]
      console.log(`[DEBUG] 正則模式 ${index + 1} 找到 ${matches.length} 個匹配`)
      allMatches = allMatches.concat(matches)
    })
    
    // 去重並建立 reels 陣列
    const uniqueShortcodes = [...new Set(allMatches.map(match => match[1]))]
    console.log(`[DEBUG] 去重後有 ${uniqueShortcodes.length} 個唯一的 shortcode`)
    
    uniqueShortcodes.forEach(shortcode => {
      reels.push({
        id: shortcode,
        url: `https://www.instagram.com/reel/${shortcode}/`,
        thumbnail: '', // 正則表達式方法無法取得縮圖
        title: '點擊查看內容'
      })
    })
  } catch (error) {
    console.log('[DEBUG] 正則表達式解析失敗:', error)
  }
  return reels
}

// 輔助函數：遞歸搜尋物件中的 Reels 資料
function findReelsInObject(obj, depth = 0) {
  const reels = []
  if (depth > 10 || typeof obj !== 'object' || obj === null) return reels
  
  try {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        // 檢查是否為 reel 相關的物件
        if (value.shortcode && value.is_video && key.includes('reel')) {
          reels.push(extractReelInfo(value))
        }
        
        // 遞歸搜尋
        const nestedReels = findReelsInObject(value, depth + 1)
        reels.push(...nestedReels)
      }
    }
  } catch (error) {
    console.log('[DEBUG] 物件遞歸搜尋失敗:', error)
  }
  
  return reels
}

// 新增方法：深度分析 HTML 中的所有 JavaScript 數據
function analyzeAllJavaScriptData(html) {
  const reels = []
  const foundShortcodes = new Set()
  
  try {
    console.log('[DEBUG] 開始深度分析 JavaScript 數據...')
    
    // 1. 尋找所有 script 標籤內容
    const scriptMatches = html.match(/<script[^>]*>(.*?)<\/script>/gs) || []
    console.log(`[DEBUG] 找到 ${scriptMatches.length} 個 script 標籤`)
    
    scriptMatches.forEach((script, index) => {
      console.log(`[DEBUG] 分析 script ${index + 1}...`)
      
      // 移除 script 標籤，只保留內容
      const scriptContent = script.replace(/<script[^>]*>/, '').replace(/<\/script>/, '')
      
      // 2. 尋找所有可能的變數賦值
      const variablePatterns = [
        /window\.\w+\s*=\s*({.*?});/g,
        /var\s+\w+\s*=\s*({.*?});/g,
        /const\s+\w+\s*=\s*({.*?});/g,
        /let\s+\w+\s*=\s*({.*?});/g,
        /__d\([^)]+,\s*({.*?})\)/g,
        /\w+\s*=\s*JSON\.parse\([^)]+\)/g
      ]
      
      variablePatterns.forEach((pattern, patternIndex) => {
        const matches = [...scriptContent.matchAll(pattern)]
        if (matches.length > 0) {
          console.log(`[DEBUG] Script ${index + 1} 變數模式 ${patternIndex + 1} 找到 ${matches.length} 個匹配`)
          
          matches.forEach((match, matchIndex) => {
            try {
              const jsonStr = match[1] || match[0]
              if (jsonStr && jsonStr.includes('shortcode')) {
                console.log(`[DEBUG] Script ${index + 1} 匹配 ${matchIndex + 1} 包含 shortcode`)
                
                // 嘗試解析 JSON
                let data
                try {
                  data = JSON.parse(jsonStr)
                } catch {
                  // 如果不是完整 JSON，嘗試提取 shortcode
                  const shortcodeMatches = [...jsonStr.matchAll(/"shortcode":"([A-Za-z0-9_-]{7,})"/g)]
                  shortcodeMatches.forEach(scMatch => {
                    const shortcode = scMatch[1]
                    if (!['en_US', 'zh_TW', 'fr_FR', 'es_ES'].includes(shortcode)) {
                      foundShortcodes.add(shortcode)
                      console.log(`[DEBUG] 提取到 shortcode: ${shortcode}`)
                    }
                  })
                  return
                }
                
                // 遞歸搜尋 JSON 數據中的 shortcode
                extractShortcodesFromObject(data, foundShortcodes)
              }
            } catch (error) {
              console.log(`[DEBUG] Script ${index + 1} 匹配 ${matchIndex + 1} 處理失敗:`, error.message)
            }
          })
        }
      })
    })
    
    // 3. 直接在整個 HTML 中搜尋更多模式
    console.log('[DEBUG] 在整個 HTML 中搜尋額外模式...')
    const additionalPatterns = [
      /"node":\{"__typename":"Graph\w+","id":"[^"]+","shortcode":"([A-Za-z0-9_-]+)"/g,
      /"shortcode":"([A-Za-z0-9_-]+)"[^}]*"is_video":true/g,
      /"shortcode":"([A-Za-z0-9_-]+)"[^}]*"media_type":2/g,
      /instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/g
    ]
    
    additionalPatterns.forEach((pattern, index) => {
      const matches = [...html.matchAll(pattern)]
      console.log(`[DEBUG] 額外模式 ${index + 1} 找到 ${matches.length} 個匹配`)
      matches.forEach(match => {
        const shortcode = match[2] || match[1]
        if (shortcode && shortcode.length >= 7 && !['en_US', 'zh_TW', 'fr_FR', 'es_ES'].includes(shortcode)) {
          foundShortcodes.add(shortcode)
          console.log(`[DEBUG] 額外模式找到 shortcode: ${shortcode}`)
        }
      })
    })
    
    // 4. 將找到的 shortcodes 轉換為 reels
    console.log(`[DEBUG] 總共找到 ${foundShortcodes.size} 個獨特的 shortcode`)
    foundShortcodes.forEach(shortcode => {
      reels.push({
        id: shortcode,
        url: `https://www.instagram.com/reel/${shortcode}/`,
        thumbnail: '',
        title: '點擊查看內容'
      })
    })
    
  } catch (error) {
    console.log('[DEBUG] JavaScript 深度分析失敗:', error.message)
  }
  
  return reels.slice(0, 10) // 限制最多 10 個
}

// 輔助函數：遞歸提取物件中的 shortcode
function extractShortcodesFromObject(obj, shortcodeSet, depth = 0) {
  if (depth > 10 || typeof obj !== 'object' || obj === null) return
  
  try {
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'shortcode' && typeof value === 'string' && value.length >= 7) {
        if (!['en_US', 'zh_TW', 'fr_FR', 'es_ES'].includes(value)) {
          shortcodeSet.add(value)
          console.log(`[DEBUG] 物件中找到 shortcode: ${value}`)
        }
      } else if (typeof value === 'object' && value !== null) {
        extractShortcodesFromObject(value, shortcodeSet, depth + 1)
      }
    }
  } catch (error) {
    // 忽略錯誤，繼續處理
  }
}

// 新增方法：嘗試訪問 Instagram 的公開 API
async function tryInstagramApi(profileUrl, headers) {
  const reels = []
  try {
    console.log('[DEBUG] 嘗試使用 Instagram API...')
    
    // 從 URL 提取用戶名
    const username = profileUrl.match(/instagram\.com\/([^\/\?]+)/)?.[1]
    if (!username) {
      console.log('[DEBUG] 無法從 URL 提取用戶名')
      return reels
    }
    
    console.log(`[DEBUG] 提取到用戶名: ${username}`)
    
    // 嘗試多種 API 端點
    const apiUrls = [
      `${profileUrl}?__a=1&__d=dis`,
      `${profileUrl}?__a=1`,
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      `https://i.instagram.com/api/v1/users/${username}/info/`
    ]
    
    for (let i = 0; i < apiUrls.length; i++) {
      const apiUrl = apiUrls[i]
      console.log(`[DEBUG] 嘗試 API 端點 ${i + 1}: ${apiUrl}`)
      
      try {
        const response = await fetch(apiUrl, { 
          headers: {
            ...headers,
            'X-Requested-With': 'XMLHttpRequest'
          }
        })
        
        console.log(`[DEBUG] API 端點 ${i + 1} 響應狀態: ${response.status}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log(`[DEBUG] API 端點 ${i + 1} 返回 JSON 數據`)
          
          // 嘗試從不同的數據結構中提取 reels
          const extractedReels = extractReelsFromApiData(data)
          if (extractedReels.length > 0) {
            console.log(`[DEBUG] API 端點 ${i + 1} 成功提取 ${extractedReels.length} 個 Reels`)
            return extractedReels
          }
        }
      } catch (error) {
        console.log(`[DEBUG] API 端點 ${i + 1} 失敗: ${error.message}`)
      }
    }
  } catch (error) {
    console.log(`[DEBUG] Instagram API 嘗試失敗: ${error.message}`)
  }
  
  return reels
}

// 輔助函數：從 API 數據中提取 Reels
function extractReelsFromApiData(data) {
  const reels = []
  try {
    console.log('[DEBUG] 開始從 API 數據提取 Reels...')
    
    // 嘗試多種數據路徑
    const possiblePaths = [
      data?.data?.user?.edge_owner_to_timeline_media?.edges,
      data?.graphql?.user?.edge_owner_to_timeline_media?.edges,
      data?.user?.edge_owner_to_timeline_media?.edges,
      data?.items,
      data?.media?.nodes
    ]
    
    for (const mediaEdges of possiblePaths) {
      if (Array.isArray(mediaEdges)) {
        console.log(`[DEBUG] 找到包含 ${mediaEdges.length} 個項目的媒體陣列`)
        
        mediaEdges.forEach((edge, index) => {
          const node = edge.node || edge
          if (node && node.shortcode) {
            console.log(`[DEBUG] 處理項目 ${index + 1}, shortcode: ${node.shortcode}`)
            
            // 檢查是否為影片 (Reel)
            if (node.is_video || node.media_type === 2 || node.__typename === 'GraphVideo') {
              reels.push({
                id: node.shortcode,
                url: `https://www.instagram.com/reel/${node.shortcode}/`,
                thumbnail: node.display_url || node.thumbnail_src || node.image_versions2?.candidates?.[0]?.url || '',
                title: node.edge_media_to_caption?.edges?.[0]?.node?.text || node.caption?.text || '點擊查看內容'
              })
            }
          }
        })
        break // 找到有效數據後跳出循環
      }
    }
    
    console.log(`[DEBUG] API 數據提取完成，找到 ${reels.length} 個 Reels`)
  } catch (error) {
    console.log(`[DEBUG] API 數據提取失敗: ${error.message}`)
  }
  
  return reels.slice(0, 10) // 只返回前 10 個
}

// 新增方法：嘗試 Instagram 的 GraphQL 端點
async function tryInstagramGraphQL(profileUrl, headers) {
  const reels = []
  try {
    console.log('[DEBUG] 嘗試使用 Instagram GraphQL...')
    
    // 從 URL 提取用戶名
    const username = profileUrl.match(/instagram\.com\/([^\/\?]+)/)?.[1]
    if (!username) {
      console.log('[DEBUG] 無法從 URL 提取用戶名')
      return reels
    }
    
    console.log(`[DEBUG] GraphQL 查詢用戶: ${username}`)
    
    // 嘗試 GraphQL 端點
    const graphqlEndpoints = [
      {
        url: 'https://www.instagram.com/graphql/query/',
        query_hash: '69cba40317214236af40e7efa697781d', // 用戶時間線
        variables: JSON.stringify({
          id: username,
          first: 12
        })
      },
      {
        url: 'https://www.instagram.com/graphql/query/',
        query_hash: '003056d32c2554def87228bc3fd9668a', // 用戶媒體
        variables: JSON.stringify({
          username: username,
          first: 12
        })
      }
    ]
    
    for (let i = 0; i < graphqlEndpoints.length; i++) {
      const endpoint = graphqlEndpoints[i]
      const url = `${endpoint.url}?query_hash=${endpoint.query_hash}&variables=${encodeURIComponent(endpoint.variables)}`
      
      console.log(`[DEBUG] 嘗試 GraphQL 端點 ${i + 1}`)
      
      try {
        const response = await fetch(url, {
          headers: {
            ...headers,
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': 'missing',
            'X-Instagram-AJAX': '1',
            'Referer': profileUrl
          }
        })
        
        console.log(`[DEBUG] GraphQL 端點 ${i + 1} 響應狀態: ${response.status}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log(`[DEBUG] GraphQL 端點 ${i + 1} 返回數據`)
          
          // 從 GraphQL 響應中提取 reels
          const extractedReels = extractReelsFromGraphQLResponse(data)
          if (extractedReels.length > 0) {
            console.log(`[DEBUG] GraphQL 端點 ${i + 1} 成功提取 ${extractedReels.length} 個 Reels`)
            return extractedReels
          }
        }
      } catch (error) {
        console.log(`[DEBUG] GraphQL 端點 ${i + 1} 失敗: ${error.message}`)
      }
    }
  } catch (error) {
    console.log(`[DEBUG] Instagram GraphQL 嘗試失敗: ${error.message}`)
  }
  
  return reels
}

// 輔助函數：從 GraphQL 響應中提取 Reels
function extractReelsFromGraphQLResponse(data) {
  const reels = []
  try {
    console.log('[DEBUG] 開始從 GraphQL 響應提取 Reels...')
    
    // 嘗試多種 GraphQL 響應路徑
    const possiblePaths = [
      data?.data?.user?.edge_owner_to_timeline_media?.edges,
      data?.data?.user?.edge_felix_video_timeline?.edges,
      data?.data?.shortcode_media,
      data?.user?.edge_owner_to_timeline_media?.edges,
      data?.graphql?.user?.edge_owner_to_timeline_media?.edges
    ]
    
    for (const mediaEdges of possiblePaths) {
      if (Array.isArray(mediaEdges)) {
        console.log(`[DEBUG] GraphQL 找到包含 ${mediaEdges.length} 個項目的媒體陣列`)
        
        mediaEdges.forEach((edge, index) => {
          const node = edge.node || edge
          if (node && node.shortcode) {
            console.log(`[DEBUG] GraphQL 處理項目 ${index + 1}, shortcode: ${node.shortcode}`)
            
            // 檢查是否為影片 (Reel)
            if (node.is_video || node.__typename === 'GraphVideo' || node.__typename === 'GraphSidecar') {
              reels.push({
                id: node.shortcode,
                url: `https://www.instagram.com/reel/${node.shortcode}/`,
                thumbnail: node.display_url || node.thumbnail_src || '',
                title: node.edge_media_to_caption?.edges?.[0]?.node?.text || '點擊查看內容'
              })
            }
          }
        })
        break // 找到有效數據後跳出循環
      }
    }
    
    console.log(`[DEBUG] GraphQL 響應提取完成，找到 ${reels.length} 個 Reels`)
  } catch (error) {
    console.log(`[DEBUG] GraphQL 響應提取失敗: ${error.message}`)
  }
  
  return reels.slice(0, 10) // 只返回前 10 個
}

// 輔助函數：從 reel 物件中提取重要資訊
function extractReelInfo(reelData) {
  return {
    id: reelData.shortcode || reelData.id || '',
    url: reelData.embedUrl || `https://www.instagram.com/reel/${reelData.shortcode}/`,
    thumbnail: reelData.thumbnailUrl || reelData.display_url || reelData.thumbnail_src || '',
    title: reelData.caption || reelData.edge_media_to_caption?.edges?.[0]?.node?.text || reelData.description || '點擊查看內容'
  }
}