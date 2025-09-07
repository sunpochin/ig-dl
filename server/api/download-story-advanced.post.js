/*
 * Instagram Story 進階下載器 - 實驗性功能
 * 
 * ⚠️ 警告：此方法可能違反 Instagram 服務條款
 * 僅供教育和研究用途
 * 
 * 這個檔案實現了更進階的 Story 下載方法，包括：
 * 1. Cookie 支援（可選）
 * 2. 更多 API 端點嘗試
 * 3. 媒體 ID 解析
 * 4. CDN 直接訪問
 */

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { url, cookie } = body // 可選的 cookie 參數

  if (!url) {
    return {
      success: false,
      error: '請提供 Instagram Story 連結'
    }
  }

  try {
    console.log(`[DEBUG] 進階 Story 下載開始: ${url}`)
    
    // 從 URL 解析信息
    const urlMatch = url.match(/instagram\.com\/stories\/([^\/]+)\/(\d+)/)
    if (!urlMatch) {
      return {
        success: false,
        error: '無效的 Story URL 格式'
      }
    }
    
    const [, username, storyId] = urlMatch
    console.log(`[DEBUG] 用戶: ${username}, Story ID: ${storyId}`)

    // 嘗試多種方法
    const methods = [
      () => tryMethodWebAPI(username, storyId, cookie),
      () => tryMethodGraphQL(username, storyId, cookie),
      () => tryMethodMediaInfo(storyId, cookie),
      () => tryMethodDirectCDN(storyId),
      () => tryMethodReelsMedia(username, storyId, cookie)
    ]

    for (let i = 0; i < methods.length; i++) {
      console.log(`[DEBUG] 嘗試方法 ${i + 1}/${methods.length}...`)
      try {
        const result = await methods[i]()
        if (result && result.mediaUrl) {
          console.log(`[DEBUG] 方法 ${i + 1} 成功！`)
          return {
            success: true,
            videoUrl: result.mediaUrl,
            mediaType: result.mediaType || 'video',
            thumbnail: result.thumbnail
          }
        }
      } catch (error) {
        console.log(`[DEBUG] 方法 ${i + 1} 失敗: ${error.message}`)
      }
    }

    return {
      success: false,
      error: '所有方法都失敗了。Story 可能需要登入才能訪問。'
    }

  } catch (error) {
    console.error('[DEBUG] 進階 Story 下載錯誤:', error)
    return {
      success: false,
      error: `處理失敗: ${error.message}`
    }
  }
})

// 方法 1: Web API
async function tryMethodWebAPI(username, storyId, cookie) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-IG-App-ID': '936619743392459',
    'X-ASBD-ID': '198387',
    'Sec-Fetch-Site': 'same-origin'
  }
  
  if (cookie) {
    headers['Cookie'] = cookie
  }

  const apiUrl = `https://www.instagram.com/api/v1/feed/user/${username}/story/`
  console.log(`[DEBUG] 嘗試 Web API: ${apiUrl}`)
  
  const response = await fetch(apiUrl, { headers })
  console.log(`[DEBUG] API 響應: ${response.status}`)
  
  if (response.ok) {
    const data = await response.json()
    return extractMediaFromData(data, storyId)
  }
  
  return null
}

// 方法 2: GraphQL
async function tryMethodGraphQL(username, storyId, cookie) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': '*/*',
    'X-IG-App-ID': '936619743392459'
  }
  
  if (cookie) {
    headers['Cookie'] = cookie
  }

  // Instagram 的 Stories GraphQL query hash
  const queryHash = 'de8017ee0a7c9c45ec4260733d81ea31'
  const variables = {
    reel_ids: [username],
    tag_names: [],
    location_ids: [],
    highlight_reel_ids: [],
    precomposed_overlay: false,
    show_story_viewer_list: true,
    story_viewer_fetch_count: 50,
    story_viewer_cursor: ""
  }

  const url = `https://www.instagram.com/graphql/query/?query_hash=${queryHash}&variables=${encodeURIComponent(JSON.stringify(variables))}`
  console.log(`[DEBUG] 嘗試 GraphQL: ${url}`)
  
  const response = await fetch(url, { headers })
  console.log(`[DEBUG] GraphQL 響應: ${response.status}`)
  
  if (response.ok) {
    const data = await response.json()
    return extractMediaFromGraphQL(data, storyId)
  }
  
  return null
}

// 方法 3: Media Info API
async function tryMethodMediaInfo(storyId, cookie) {
  const headers = {
    'User-Agent': 'Instagram 269.0.0.18.75 Android',
    'Accept': 'application/json'
  }
  
  if (cookie) {
    headers['Cookie'] = cookie
  }

  // 轉換 Story ID 為 Media ID 格式
  const mediaId = `${storyId}_0`
  const apiUrl = `https://i.instagram.com/api/v1/media/${mediaId}/info/`
  console.log(`[DEBUG] 嘗試 Media Info API: ${apiUrl}`)
  
  const response = await fetch(apiUrl, { headers })
  console.log(`[DEBUG] Media Info 響應: ${response.status}`)
  
  if (response.ok) {
    const data = await response.json()
    return extractMediaFromMediaInfo(data)
  }
  
  return null
}

// 方法 4: 直接 CDN 訪問
async function tryMethodDirectCDN(storyId) {
  console.log('[DEBUG] 嘗試直接 CDN 訪問...')
  
  // 基於 Story ID 構建可能的 CDN URL
  const baseId = storyId.substring(0, 10) // 使用前10位
  const cdnServers = [
    'scontent.cdninstagram.com',
    'scontent-lax3-1.cdninstagram.com',
    'scontent-iad3-1.cdninstagram.com',
    'instagram.fkhh1-2.fna.fbcdn.net'
  ]
  
  const pathPatterns = [
    `/v/t51.2885-15/${storyId}.jpg`,
    `/v/t51.2885-15/${storyId}.mp4`,
    `/v/t50.2886-16/${storyId}.mp4`,
    `/v/t51.12442-15/${baseId}.mp4`,
    `/o1/${storyId}.jpg`,
    `/o1/${storyId}.mp4`
  ]
  
  for (const server of cdnServers) {
    for (const path of pathPatterns) {
      const cdnUrl = `https://${server}${path}`
      console.log(`[DEBUG] 測試 CDN: ${cdnUrl}`)
      
      try {
        const response = await fetch(cdnUrl, { 
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
          }
        })
        
        if (response.ok) {
          console.log(`[DEBUG] 找到有效 CDN URL!`)
          const isVideo = cdnUrl.includes('.mp4')
          return {
            mediaUrl: cdnUrl,
            mediaType: isVideo ? 'video' : 'image',
            thumbnail: isVideo ? cdnUrl.replace('.mp4', '.jpg') : cdnUrl
          }
        }
      } catch (e) {
        // 繼續嘗試下一個
      }
    }
  }
  
  return null
}

// 方法 5: Reels Media API
async function tryMethodReelsMedia(username, storyId, cookie) {
  const headers = {
    'User-Agent': 'Instagram 269.0.0.18.75 Android',
    'Accept': 'application/json',
    'X-IG-App-ID': '936619743392459'
  }
  
  if (cookie) {
    headers['Cookie'] = cookie
  }

  const apiUrl = `https://i.instagram.com/api/v1/feed/reels_media/?reel_ids=${username}`
  console.log(`[DEBUG] 嘗試 Reels Media API: ${apiUrl}`)
  
  const response = await fetch(apiUrl, { headers })
  console.log(`[DEBUG] Reels Media 響應: ${response.status}`)
  
  if (response.ok) {
    const data = await response.json()
    return extractMediaFromReelsMedia(data, storyId)
  }
  
  return null
}

// 輔助函數：從數據中提取媒體
function extractMediaFromData(data, targetStoryId) {
  try {
    // 遍歷所有 story items
    const items = data?.reel?.items || data?.items || []
    for (const item of items) {
      if (item.pk == targetStoryId || item.id == targetStoryId) {
        const videoUrl = item.video_versions?.[0]?.url
        const imageUrl = item.image_versions2?.candidates?.[0]?.url
        
        if (videoUrl || imageUrl) {
          return {
            mediaUrl: videoUrl || imageUrl,
            mediaType: videoUrl ? 'video' : 'image',
            thumbnail: imageUrl || videoUrl?.replace('.mp4', '.jpg')
          }
        }
      }
    }
  } catch (error) {
    console.log(`[DEBUG] 數據提取失敗: ${error.message}`)
  }
  return null
}

// 從 GraphQL 響應提取媒體
function extractMediaFromGraphQL(data, targetStoryId) {
  try {
    const reels = data?.data?.reels_media || []
    for (const reel of reels) {
      const items = reel?.items || []
      for (const item of items) {
        if (item.pk == targetStoryId || item.id == targetStoryId) {
          const videoUrl = item.video_resources?.[0]?.src
          const imageUrl = item.display_resources?.[0]?.src
          
          if (videoUrl || imageUrl) {
            return {
              mediaUrl: videoUrl || imageUrl,
              mediaType: videoUrl ? 'video' : 'image',
              thumbnail: imageUrl || videoUrl?.replace('.mp4', '.jpg')
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(`[DEBUG] GraphQL 提取失敗: ${error.message}`)
  }
  return null
}

// 從 Media Info 提取媒體
function extractMediaFromMediaInfo(data) {
  try {
    const items = data?.items || []
    for (const item of items) {
      const videoUrl = item.video_versions?.[0]?.url
      const imageUrl = item.image_versions2?.candidates?.[0]?.url
      
      if (videoUrl || imageUrl) {
        return {
          mediaUrl: videoUrl || imageUrl,
          mediaType: videoUrl ? 'video' : 'image',
          thumbnail: imageUrl || videoUrl?.replace('.mp4', '.jpg')
        }
      }
    }
  } catch (error) {
    console.log(`[DEBUG] Media Info 提取失敗: ${error.message}`)
  }
  return null
}

// 從 Reels Media 提取媒體
function extractMediaFromReelsMedia(data, targetStoryId) {
  try {
    const reels = data?.reels || {}
    for (const reelKey in reels) {
      const items = reels[reelKey]?.items || []
      for (const item of items) {
        if (item.pk == targetStoryId || item.id == targetStoryId) {
          const videoUrl = item.video_versions?.[0]?.url
          const imageUrl = item.image_versions2?.candidates?.[0]?.url
          
          if (videoUrl || imageUrl) {
            return {
              mediaUrl: videoUrl || imageUrl,
              mediaType: videoUrl ? 'video' : 'image',
              thumbnail: imageUrl || videoUrl?.replace('.mp4', '.jpg')
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(`[DEBUG] Reels Media 提取失敗: ${error.message}`)
  }
  return null
}