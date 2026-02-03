<script setup>
import { ref, onMounted, computed } from 'vue';
import BookShelf from './views/BookShelf.vue';
import Reader from './views/Reader.vue';
import { storage } from './utils/storage.js';

const currentView = ref('bookshelf');
const currentBookId = ref(null);
const settings = ref(storage.getSettings());

// 全局背景样式
const globalStyle = computed(() => {
  const bgOpacity = settings.value.backgroundOpacity / 100;
  const textOpacity = settings.value.textOpacity / 100;

  // 将hex颜色转换为RGB
  const bgRgb = hexToRgb(settings.value.backgroundColor);
  const textRgb = hexToRgb(settings.value.textColor);

  return {
    '--bg-color': `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, ${bgOpacity})`,
    '--text-color': `rgba(${textRgb.r}, ${textRgb.g}, ${textRgb.b}, ${textOpacity})`,
    '--bg-opacity': bgOpacity,
  };
});

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

onMounted(() => {
  // 监听设置变化
  window.addEventListener('settingsChanged', () => {
    settings.value = storage.getSettings();
  });
  // 监听全局样式更新（由 toggleOpacity 触发）
  window.addEventListener('globalStyleUpdate', () => {
    settings.value = storage.getSettings();
  });
});

function openReader(bookId) {
  currentBookId.value = bookId;
  currentView.value = 'reader';
}

function backToBookshelf() {
  currentView.value = 'bookshelf';
  currentBookId.value = null;
}
</script>

<template>
  <div id="app" :style="globalStyle">
    <BookShelf
      v-if="currentView === 'bookshelf'"
      @open-reader="openReader"
    />
    <Reader
      v-else-if="currentView === 'reader' && currentBookId"
      :book-id="currentBookId"
      @back="backToBookshelf"
    />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: transparent;
}

#app {
  width: 100%;
  min-height: 100vh;
  background-color: var(--bg-color);
}

/* 所有背景元素使用全局背景色 */
.bookshelf,
.reader,
.reader-header,
.settings-panel,
.chapter-nav {
  background-color: var(--bg-color) !important;
}

/* UI元素使用半透明背景 */
.import-btn,
.action-btn,
.nav-btn {
  background-color: rgba(76, 175, 80, var(--bg-opacity)) !important;
  color: white !important;
}

.settings-btn {
  background-color: rgba(33, 150, 243, var(--bg-opacity)) !important;
  color: white !important;
}

.opacity-toggle-btn {
  background-color: rgba(255, 167, 38, var(--bg-opacity)) !important;
  color: white !important;
}

.keybindings-btn {
  background-color: rgba(33, 150, 243, var(--bg-opacity)) !important;
  color: white !important;
}

.back-btn,
.close-btn,
.reset-btn {
  background-color: rgba(245, 245, 245, var(--bg-opacity)) !important;
  color: #666 !important;
}

.book-card {
  background-color: rgba(255, 255, 255, var(--bg-opacity)) !important;
}

.chapter-item {
  background-color: transparent !important;
}

.chapter-item:hover {
  background-color: rgba(245, 245, 245, var(--bg-opacity)) !important;
}

.chapter-item.active {
  background-color: rgba(227, 242, 253, var(--bg-opacity)) !important;
  color: #1976d2 !important;
}

/* 按钮悬停效果 */
.import-btn:hover,
.action-btn:hover,
.nav-btn:hover:not(:disabled) {
  background-color: #45a049 !important;
}

.settings-btn:hover {
  background-color: #1976D2 !important;
}

.opacity-toggle-btn:hover {
  background-color: #FB8C00 !important;
}

.keybindings-btn:hover {
  background-color: #1976D2 !important;
}

.back-btn:hover,
.close-btn:hover,
.reset-btn:hover {
  background-color: #e0e0e0 !important;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-color);
}

::-webkit-scrollbar-thumb {
  background: rgba(136, 136, 136, 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(85, 85, 85, 0.7);
}
</style>
