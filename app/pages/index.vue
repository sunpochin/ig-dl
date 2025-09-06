<template>
  <!-- 主容器: 使用漸層背景，全屏高度，使用 flexbox 置中 -->
  <div class="min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 flex items-center justify-center p-4">
    <!-- 卡片容器: 使用更寬的最大寬度或完全移除限制 -->
    <div class="w-full max-w-7xl">
      <!-- 主卡片: 白色背景，使用 flex 來置中內容 -->
      <div class="bg-white rounded-2xl shadow-2xl p-8 md:p-12 lg:p-16 flex flex-col">
        <!-- 標題區塊: 使用 flex 確保居中對齊 -->
        <div class="w-full flex flex-col items-center mb-12">
          <h1 class="text-5xl font-bold text-gray-800 mb-4 text-center">Instagram 下載器</h1>
          <p class="text-lg text-gray-600 text-center mb-6">下載 Instagram Reels 和 Stories</p>
          
        </div>

        <!-- 輸入區塊: 移除寬度限制，使用全寬 -->
        <div class="w-full space-y-6">
          <!-- URL 輸入框: 全寬，文字置中 -->
          <div class="w-full">
            <input
              v-model="inputUrl"
              type="text"
              :placeholder="getPlaceholderText()"
              class="w-full px-6 py-4 text-lg text-center border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors placeholder:text-center"
              @keyup.enter="handleAction()"
            />
          </div>

          <!-- 操作按鈕: 根據模式顯示不同按鈕 -->
          <button
            class="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-8 text-lg rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            :disabled="loading || !inputUrl"
            @click="handleAction()"
          >
            <!-- 正常狀態文字 -->
            <span v-if="!loading">{{ getButtonText() }}</span>
            <!-- 載入中狀態: 顯示旋轉動畫和文字 -->
            <span v-else class="flex items-center justify-center">
              <!-- SVG 載入動畫圖標 -->
              <svg class="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ getLoadingText() }}
            </span>
          </button>
        </div>

        <!-- 錯誤訊息區塊: 使用全寬 -->
        <div v-if="error" class="w-full mt-6">
          <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl text-center">
            {{ error }}
          </div>
        </div>

        <!-- Stories 清單顯示區塊 -->
        <div v-if="storiesList.length > 0" class="w-full mt-8">
          <div class="p-6 bg-blue-50 border border-blue-300 rounded-xl">
            <h3 class="text-blue-800 font-semibold mb-4 text-lg text-center">找到 {{ storiesList.length }} 個 Stories</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              <div 
                v-for="story in storiesList" 
                :key="story.id"
                class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                @click="downloadSpecificStory(story.url)"
              >
                <!-- 縮圖 -->
                <div class="aspect-square bg-gray-200 rounded-lg mb-3 overflow-hidden">
                  <img 
                    v-if="story.thumbnail" 
                    :src="story.thumbnail" 
                    :alt="story.title || 'Story'"
                    class="w-full h-full object-cover"
                    @error="$event.target.style.display = 'none'"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                    <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                    </svg>
                  </div>
                </div>
                
                <!-- 標題/時間 -->
                <p class="text-sm text-gray-700 line-clamp-2 mb-2">
                  {{ story.title || story.timestamp || '點擊下載 Story' }}
                </p>
                
                <!-- Story 類型標籤 -->
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                    {{ story.media_type === 'video' ? '影片' : '圖片' }}
                  </span>
                  <span v-if="story.duration" class="text-xs text-gray-500">
                    {{ story.duration }}s
                  </span>
                </div>
                
                <!-- 下載按鈕 -->
                <button class="w-full bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                  下載此 Story
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Reel 預覽和下載區塊 -->
        <!-- 
          🎬 預覽功能說明：
          這個區塊就像 SnapInsta 的預覽功能一樣！
          1. 視頻預覽 - 在黑色框框裡播放影片（就像網頁上的小電視）
          2. 控制按鈕 - 可以播放、暫停、調音量（就像遙控器）
          3. 下載按鈕 - 點一下就直接下載到電腦（不用開新分頁）
        -->
        <div v-if="videoUrl && (mode === 'reel' || mode === 'story')" class="w-full mt-8">
          <div class="p-6 bg-green-50 border border-green-300 rounded-xl">
            <p class="text-green-800 font-semibold mb-4 text-lg text-center">
              {{ mode === 'reel' ? 'Reel 預覽' : 'Story 預覽' }}
            </p>
            
            <!-- 視頻預覽容器（就像網頁上的小電視） -->
            <div class="bg-black rounded-lg overflow-hidden mb-4 max-w-md mx-auto">
              <video
                :src="videoUrl"
                controls
                preload="metadata"
                class="w-full h-auto max-h-96 object-contain"
                @loadedmetadata="onVideoLoaded"
                @error="onVideoError"
              >
                您的瀏覽器不支持視頻播放
              </video>
            </div>
            
            <!-- 下載按鈕 -->
            <div class="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                @click="downloadVideo"
                :disabled="downloading"
                class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg v-if="downloading" class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                {{ downloading ? '下載中...' : '下載視頻' }}
              </button>
              
              <!-- 視頻信息 -->
              <div v-if="videoInfo.duration" class="text-sm text-gray-600 text-center sm:text-left">
                <p>時長: {{ formatDuration(videoInfo.duration) }}</p>
                <p v-if="videoInfo.size">大小: {{ videoInfo.size }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 使用說明區塊: 使用全寬，使用 flex 置中 -->
        <div class="w-full mt-12 pt-8 border-t border-gray-200 flex flex-col items-center">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">使用說明</h2>
          
          <!-- Reel 下載說明 -->
          <div v-if="mode === 'reel'" class="max-w-2xl">
            <h3 class="font-semibold text-gray-700 mb-3">Reel 下載：</h3>
            <ol class="list-decimal list-inside space-y-2 text-gray-600">
              <li>打開 Instagram，找到想要下載的 Reel</li>
              <li>點擊分享按鈕並複製 Reel 連結</li>
              <li>將連結貼到上方輸入框</li>
              <li>點擊下載按鈕</li>
            </ol>
            <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p class="text-sm text-green-800">
                <strong>支援格式：</strong>Reel 連結格式：<br>
                <code class="bg-green-100 px-1 rounded">https://www.instagram.com/reel/ABC123/</code><br>
                <code class="bg-green-100 px-1 rounded">https://www.instagram.com/p/ABC123/</code>
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 狀態管理：使用 Vue 3 Composition API
// 輸入的 Instagram URL (Reel 或 Story)
const inputUrl = ref('')
// 載入狀態標記
const loading = ref(false)
// 錯誤訊息
const error = ref('')
// 下載的影片 URL
const videoUrl = ref('')
// 解析出的 Stories 清單
const storiesList = ref([])
// 當前模式：'reel' Reel下載、'story' 單一Story下載、'batch-stories' 批量Stories下載
const mode = ref('reel')
// 選中的 Stories
const selectedStories = ref([])
// 視頻下載狀態
const downloading = ref(false)
// 視頻信息
const videoInfo = ref({ duration: 0, size: '' })

// 模式切換函數：切換不同的下載模式
const switchMode = (newMode) => {
  mode.value = newMode
  // 清除之前的狀態
  error.value = ''
  videoUrl.value = ''
  storiesList.value = []
  inputUrl.value = ''
  downloading.value = false
  videoInfo.value = { duration: 0, size: '' }
}

// 根據模式獲取輸入框 placeholder 文字
const getPlaceholderText = () => {
  switch (mode.value) {
    case 'reel':
      return 'https://www.instagram.com/reel/ABC123/ 或 https://www.instagram.com/p/ABC123/'
    case 'story':
      return 'https://www.instagram.com/stories/username/story_id/'
    case 'batch-stories':
      return 'https://www.instagram.com/stories/username/'
    default:
      return ''
  }
}

// 根據模式獲取按鈕文字
const getButtonText = () => {
  switch (mode.value) {
    case 'reel':
      return '下載 Reel'
    case 'story':
      return '下載 Story'
    case 'batch-stories':
      return '解析所有 Stories'
    default:
      return '下載'
  }
}

// 根據模式獲取載入中文字
const getLoadingText = () => {
  switch (mode.value) {
    case 'reel':
      return '下載中...'
    case 'story':
      return '下載中...'
    case 'batch-stories':
      return '解析中...'
    default:
      return '處理中...'
  }
}

// 統一的操作處理函數
const handleAction = () => {
  switch (mode.value) {
    case 'reel':
      return downloadReel()
    case 'story':
      return downloadStory()
    case 'batch-stories':
      return parseStories()
  }
}

// Reel 下載函數：下載 Instagram Reel
const downloadReel = async () => {
  // 驗證輸入：確保用戶提供了 URL
  if (!inputUrl.value) {
    error.value = '請輸入 Instagram Reel 連結'
    return
  }

  // 重置狀態：開始新的下載請求
  loading.value = true
  error.value = ''
  videoUrl.value = ''

  try {
    // 發送 API 請求：呼叫後端 Reel 下載服務
    const response = await $fetch('/api/download-reel', {
      method: 'POST',
      body: {
        url: inputUrl.value
      }
    })

    // 處理響應：根據結果更新 UI
    if (response.success && response.videoUrl) {
      // 成功：設置影片 URL 供下載
      videoUrl.value = response.videoUrl
    } else {
      // 失敗：顯示錯誤訊息
      error.value = response.error || '無法下載 Reel，請確認連結是否正確'
    }
  } catch (err) {
    // 捕獲網路或其他錯誤
    error.value = '發生錯誤，請稍後再試'
    console.error(err)
  } finally {
    // 無論成功或失敗，都要結束載入狀態
    loading.value = false
  }
}

// 批量 Stories 解析函數：解析 Instagram Stories 並列出所有 Stories
const parseStories = async () => {
  // 驗證輸入：確保用戶提供了 Stories URL
  if (!inputUrl.value) {
    error.value = '請輸入 Instagram Stories 連結'
    return
  }

  // 重置狀態：開始新的解析請求
  loading.value = true
  error.value = ''
  videoUrl.value = ''
  storiesList.value = []

  try {
    // 發送 API 請求：呼叫後端 Stories 解析服務
    const response = await $fetch('/api/parse-stories', {
      method: 'POST',
      body: {
        storiesUrl: inputUrl.value
      }
    })

    // 處理響應：根據結果更新 UI
    if (response.success && response.stories) {
      // 成功：設置 Stories 清單
      storiesList.value = response.stories
    } else {
      // 失敗：顯示錯誤訊息
      error.value = response.error || '無法解析 Stories，請確認連結是否正確'
    }
  } catch (err) {
    // 捕獲網路或其他錯誤
    error.value = '發生錯誤，請稍後再試'
    console.error(err)
  } finally {
    // 無論成功或失敗，都要結束載入狀態
    loading.value = false
  }
}

// 下載特定 Story 函數：當用戶點擊 Stories 清單中的某個 Story 時呼叫
const downloadSpecificStory = async (storyUrl) => {
  // 暫存當前輸入並切換到下載該特定 Story
  const originalUrl = inputUrl.value
  inputUrl.value = storyUrl
  
  try {
    await downloadStory()
  } finally {
    // 恢復原始輸入
    inputUrl.value = originalUrl
  }
}

// 主要下載函數：處理用戶點擊下載按鈕的邏輯
const downloadStory = async () => {
  // 驗證輸入：確保用戶提供了 URL
  if (!inputUrl.value) {
    error.value = '請輸入 Instagram Stories 連結'
    return
  }

  // 重置狀態：開始新的下載請求
  loading.value = true
  error.value = ''
  videoUrl.value = ''

  try {
    // 發送 API 請求：呼叫後端 Stories 下載服務
    const response = await $fetch('/api/download-story', {
      method: 'POST',
      body: {
        url: inputUrl.value
      }
    })

    // 處理響應：根據結果更新 UI
    if (response.success && response.videoUrl) {
      // 成功：設置影片 URL 供下載
      videoUrl.value = response.videoUrl
    } else {
      // 失敗：顯示錯誤訊息
      error.value = response.error || '無法下載 Story，請確認連結是否正確'
    }
  } catch (err) {
    // 捕獲網路或其他錯誤
    error.value = '發生錯誤，請稍後再試'
    console.error(err)
  } finally {
    // 無論成功或失敗，都要結束載入狀態
    loading.value = false
  }
}

// 視頻載入完成事件
const onVideoLoaded = (event) => {
  const video = event.target
  videoInfo.value.duration = video.duration
  
  // 嘗試獲取文件大小（如果可能的話）
  fetch(videoUrl.value, { method: 'HEAD' })
    .then(response => {
      const contentLength = response.headers.get('content-length')
      if (contentLength) {
        const sizeInMB = (parseInt(contentLength) / (1024 * 1024)).toFixed(1)
        videoInfo.value.size = `${sizeInMB} MB`
      }
    })
    .catch(() => {
      // 忽略錯誤，大小信息不是必需的
    })
}

// 視頻載入錯誤事件
const onVideoError = () => {
  error.value = '視頻載入失敗，請檢查連結是否有效'
}

// 格式化時長顯示
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * 直接下載視頻文件（像 SnapInsta 一樣的預覽下載功能）
 * 
 * 🎬 預覽下載功能解說（簡單到十歲孩童都懂）：
 * 
 * ## 就像看電影預告片一樣！
 * 
 * 這個功能做了三件事：
 * 1. 獲取視頻連結 - 就像問朋友：「hey，Instagram 上這個影片的真實網址是什麼？」
 * 2. 在頁面顯示預覽 - 就像在你的電腦上放一個小電視
 * 3. 直接下載到電腦 - 就像用吸管把飲料吸到你的杯子裡
 * 
 * ## 技術原理（簡單版）：
 * 
 * 步驟 1: 用 fetch() 當作「網路吸管」吸取影片
 * 步驟 2: 用 blob 把資料變成檔案（blob 就像一個資料盒子）
 * 步驟 3: 創造一個隱形下載按鈕並自動點擊它
 * 
 * ## 跟以前的差別：
 * 
 * 以前（開新分頁）：點下載 → 開新分頁 → 右鍵另存影片
 * 現在（像 SnapInsta）：點下載 → 在同一頁看預覽 → 點一個按鈕就下載完成
 * 
 * 就像以前要走到別的房間看電視，現在電視直接搬到你面前，
 * 還附一個「一鍵錄影」按鈕！
 * 
 * ## 關鍵技術：
 * - <video> 標籤 = 網頁小電視
 * - fetch() = 網路吸管
 * - blob = 把資料變成檔案的魔法
 * - createElement('a') = 創造隱形下載按鈕
 */
const downloadVideo = async () => {
  if (!videoUrl.value) return
  
  downloading.value = true
  
  try {
    // 步驟 1：用「網路吸管」（fetch）吸取影片
    const response = await fetch(videoUrl.value)
    // 步驟 2：把影片變成「檔案盒子」（blob）
    const blob = await response.blob()
    
    // 步驟 3：創建一個臨時的下載地址
    const url = window.URL.createObjectURL(blob)
    // 步驟 4：創造「隱形下載按鈕」
    const link = document.createElement('a')
    link.href = url
    
    // 設置文件名（從 Instagram URL 中提取 ID）
    const urlParts = inputUrl.value.match(/\/(?:reel|p|stories)\/([^/]+)/)
    const fileName = urlParts ? `instagram_${urlParts[1]}.mp4` : 'instagram_video.mp4'
    link.download = fileName
    
    // 步驟 5：自動點擊隱形按鈕，觸發下載
    document.body.appendChild(link)
    link.click() // 「咔嚓」！下載開始了！
    
    // 步驟 6：清理（把隱形按鈕和臨時地址刪掉）
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('下載失敗:', error)
    error.value = '下載失敗，請稍後再試'
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped>
/* 自定義動畫：旋轉載入指示器 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 應用旋轉動畫的類別 */
.animate-spin {
  animation: spin 1s linear infinite;
}

/* 文字截斷類別 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>