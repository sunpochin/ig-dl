<template>
  <!-- 主容器: 使用漸層背景，全屏高度，使用 flexbox 置中 -->
  <div class="min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 flex items-center justify-center p-4">
    <!-- 卡片容器: 使用更寬的最大寬度或完全移除限制 -->
    <div class="w-full max-w-7xl">
      <!-- 主卡片: 白色背景，使用 flex 來置中內容 -->
      <div class="bg-white rounded-2xl shadow-2xl p-8 md:p-12 lg:p-16 flex flex-col">
        <!-- 標題區塊: 使用 flex 確保居中對齊 -->
        <div class="w-full flex flex-col items-center mb-12">
          <h1 class="text-5xl font-bold text-gray-800 mb-4 text-center">Instagram Reel 下載器</h1>
          <p class="text-lg text-gray-600 text-center">貼上 Instagram Reel 連結即可下載影片</p>
        </div>

        <!-- 輸入區塊: 移除寬度限制，使用全寬 -->
        <div class="w-full space-y-6">
          <!-- URL 輸入框: 全寬，文字置中 -->
          <div class="w-full">
            <input
              v-model="reelUrl"
              type="text"
              placeholder="https://www.instagram.com/reel/... 或 https://www.instagram.com/p/..."
              class="w-full px-6 py-4 text-lg text-center border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors placeholder:text-center"
              @keyup.enter="downloadReel"
            />
          </div>

          <!-- 下載按鈕: 漸層背景，禁用狀態處理，載入動畫 -->
          <button
            @click="downloadReel"
            :disabled="loading || !reelUrl"
            class="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-8 text-lg rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <!-- 正常狀態文字 -->
            <span v-if="!loading">下載影片</span>
            <!-- 載入中狀態: 顯示旋轉動畫和文字 -->
            <span v-else class="flex items-center justify-center">
              <!-- SVG 載入動畫圖標 -->
              <svg class="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              處理中...
            </span>
          </button>
        </div>

        <!-- 錯誤訊息區塊: 使用全寬 -->
        <div v-if="error" class="w-full mt-6">
          <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl text-center">
            {{ error }}
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
          <!-- 步驟列表: 使用 flex 來置中對齊 -->
          <ol class="list-decimal list-inside space-y-3 text-gray-600">
            <li>打開 Instagram 應用程式或網站</li>
            <li>找到想要下載的 Reel</li>
            <li>點擊分享按鈕並複製連結</li>
            <li>將連結貼到上方輸入框</li>
            <li>點擊下載按鈕</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 狀態管理：使用 Vue 3 Composition API
// 輸入的 Instagram Reel URL
const reelUrl = ref('')
// 載入狀態標記
const loading = ref(false)
// 錯誤訊息
const error = ref('')
// 下載的影片 URL
const videoUrl = ref('')

// 主要下載函數：處理用戶點擊下載按鈕的邏輯
const downloadReel = async () => {
  // 驗證輸入：確保用戶提供了 URL
  if (!reelUrl.value) {
    error.value = '請輸入 Instagram Reel 連結'
    return
  }

  // 重置狀態：開始新的下載請求
  loading.value = true
  error.value = ''
  videoUrl.value = ''

  try {
    // 發送 API 請求：呼叫後端下載服務
    const response = await $fetch('/api/download-reel', {
      method: 'POST',
      body: {
        url: reelUrl.value
      }
    })

    // 處理響應：根據結果更新 UI
    if (response.success && response.videoUrl) {
      // 成功：設置影片 URL 供下載
      videoUrl.value = response.videoUrl
    } else {
      // 失敗：顯示錯誤訊息
      error.value = response.error || '無法下載影片，請確認連結是否正確'
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
</style>