<script setup>
import { ref, onMounted, computed } from 'vue';
import { getCurrentWindow, PhysicalPosition, PhysicalSize } from '@tauri-apps/api/window';
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

// 窗口状态管理
let saveWindowStateTimer = null;
let unlistenMove = null;
let unlistenResize = null;
let unlistenCloseRequested = null;

// 验证窗口位置是否在屏幕内
function isPositionValid(x, y, width, height) {
  // 简单验证:确保窗口至少有一部分在屏幕内
  // 允许窗口部分超出屏幕,但至少要有100px在屏幕内
  const minVisibleSize = 100;

  // 获取主屏幕尺寸(简化处理,假设主屏幕从0,0开始)
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;

  // 检查窗口是否完全在屏幕外
  if (x + width < minVisibleSize || x > screenWidth - minVisibleSize) {
    return false;
  }
  if (y + height < minVisibleSize || y > screenHeight - minVisibleSize) {
    return false;
  }

  return true;
}

async function restoreWindowState() {
  try {
    const appWindow = getCurrentWindow();
    const savedState = storage.getWindowState();

    console.log('尝试恢复窗口状态:', savedState);

    if (savedState) {
      // 验证窗口位置是否有效
      if (isPositionValid(savedState.x, savedState.y, savedState.width, savedState.height)) {
        await appWindow.setPosition(new PhysicalPosition(savedState.x, savedState.y));
        await appWindow.setSize(new PhysicalSize(savedState.width, savedState.height));
        console.log('窗口状态已恢复:', savedState);
      } else {
        console.log('保存的窗口位置无效,使用默认位置');
        // 清除无效的窗口状态
        storage.saveWindowState(null);
      }
    } else {
      console.log('没有保存的窗口状态');
    }
  } catch (error) {
    console.error('恢复窗口状态失败:', error);
  }
}

async function saveCurrentWindowState() {
  try {
    const appWindow = getCurrentWindow();
    const position = await appWindow.outerPosition();
    const size = await appWindow.outerSize();

    const state = {
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height
    };

    storage.saveWindowState(state);
    console.log('窗口状态已保存:', state);
  } catch (error) {
    console.error('保存窗口状态失败:', error);
  }
}

// 重置窗口到默认位置和大小
async function resetWindowPosition() {
  try {
    const appWindow = getCurrentWindow();

    // 计算屏幕中心位置
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const defaultWidth = 1200;
    const defaultHeight = 800;
    const centerX = Math.floor((screenWidth - defaultWidth) / 2);
    const centerY = Math.floor((screenHeight - defaultHeight) / 2);

    await appWindow.setPosition(new PhysicalPosition(centerX, centerY));
    await appWindow.setSize(new PhysicalSize(defaultWidth, defaultHeight));

    // 保存新的窗口状态
    await saveCurrentWindowState();

    console.log('窗口已重置到默认位置');
  } catch (error) {
    console.error('重置窗口位置失败:', error);
  }
}

function handleWindowStateChange() {
  if (saveWindowStateTimer) {
    clearTimeout(saveWindowStateTimer);
  }
  saveWindowStateTimer = setTimeout(() => {
    saveCurrentWindowState();
  }, 500);
}

async function setupWindowListeners() {
  try {
    const appWindow = getCurrentWindow();

    // 监听窗口移动事件
    unlistenMove = await appWindow.onMoved(() => {
      console.log('窗口移动事件触发');
      handleWindowStateChange();
    });

    // 监听窗口大小变化事件
    unlistenResize = await appWindow.onResized(() => {
      console.log('窗口大小变化事件触发');
      handleWindowStateChange();
    });

    // 监听窗口关闭请求事件
    unlistenCloseRequested = await appWindow.onCloseRequested(async () => {
      console.log('窗口关闭事件触发,保存窗口状态');
      await saveCurrentWindowState();
    });

    console.log('窗口事件监听已设置');
  } catch (error) {
    console.error('设置窗口监听失败:', error);
  }
}

// 监听快捷键
function handleGlobalKeyPress(event) {
  // Ctrl+Shift+R: 重置窗口位置
  if (event.ctrlKey && event.shiftKey && event.key === 'R') {
    event.preventDefault();
    resetWindowPosition();
  }
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

  // 监听全局快捷键
  window.addEventListener('keydown', handleGlobalKeyPress);

  // 延迟初始化窗口状态管理,避免阻塞主流程
  setTimeout(async () => {
    try {
      await restoreWindowState();
      await setupWindowListeners();
    } catch (error) {
      console.error('窗口状态管理初始化失败:', error);
    }
  }, 100);
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

html,
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: transparent;
  overflow: hidden;
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
