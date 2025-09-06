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
          
          <!-- 模式切換按鈕 -->
          <div class="flex flex-wrap justify-center gap-3 mb-6">
            <button
              class="px-6 py-2 rounded-lg font-medium transition-all"
              :class="mode === 'reel' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
              @click="switchMode('reel')"
            >
              單一 Reel 下載
            </button>
            <button
              class="px-6 py-2 rounded-lg font-medium transition-all"
              :class="mode === 'story' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
              @click="switchMode('story')"
            >
              單一 Story 下載
            </button>
            <button
              class="px-6 py-2 rounded-lg font-medium transition-all"
              :class="mode === 'batch-stories' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
              @click="switchMode('batch-stories')"
            >
              批量 Stories 下載
            </button>
          </div>
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

        <!-- 成功下載區塊: 使用全寬 -->
        <div v-if="videoUrl" class="w-full mt-8">
          <div class="p-6 bg-green-50 border border-green-300 rounded-xl text-center">
            <p class="text-green-800 font-semibold mb-4 text-lg">影片已準備好！</p>
            <!-- 下載連結按鈕 -->
            <a
              :href="videoUrl"
              download
              target="_blank"
              class="inline-block bg-green-600 text-white px-8 py-3 text-lg rounded-xl hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
            >
              點擊下載
            </a>
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
          
          <!-- Story 下載說明 -->
          <div v-else-if="mode === 'story'" class="max-w-2xl">
            <h3 class="font-semibold text-gray-700 mb-3">單一 Story 下載：</h3>
            <ol class="list-decimal list-inside space-y-2 text-gray-600">
              <li>打開 Instagram，找到想要下載的 Story</li>
              <li>點擊分享按鈕並複製 Story 連結</li>
              <li>將連結貼到上方輸入框</li>
              <li>點擊下載按鈕</li>
            </ol>
            <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p class="text-sm text-yellow-800">
                <strong>注意：</strong>Stories 連結格式通常為：<br>
                <code class="bg-yellow-100 px-1 rounded">https://www.instagram.com/stories/username/story_id/</code>
              </p>
            </div>
          </div>
          
          <!-- 批量 Stories 說明 -->
          <div v-else class="max-w-2xl">
            <h3 class="font-semibold text-gray-700 mb-3">批量 Stories 下載：</h3>
            <ol class="list-decimal list-inside space-y-2 text-gray-600">
              <li>打開 Instagram，找到目標用戶的 Stories</li>
              <li>複製 Stories 主頁連結（例如：instagram.com/stories/username/）</li>
              <li>將連結貼到上方輸入框</li>
              <li>點擊解析按鈕，瀏覽該用戶的所有 Stories</li>
              <li>點擊任一 Story 卡片即可下載</li>
            </ol>
            <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-sm text-blue-800">
                <strong>提示：</strong>此功能會嘗試獲取該用戶當前所有可見的 Stories（通常在 24 小時內）
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

// 模式切換函數：切換不同的下載模式
const switchMode = (newMode) => {
  mode.value = newMode
  // 清除之前的狀態
  error.value = ''
  videoUrl.value = ''
  storiesList.value = []
  inputUrl.value = ''
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