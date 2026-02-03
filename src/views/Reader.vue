<template>
  <div class="reader" :style="readerStyle" @mousemove="handleMouseMove">
    <div class="reader-header" :class="{ 'header-hidden': !showHeader }">
      <div class="header-left">
        <button class="back-btn" @click="goBack">← 返回书架</button>
      </div>
      <div class="drag-region" data-tauri-drag-region>
        <h2 class="book-title">{{ book?.title }}</h2>
      </div>
      <div class="header-right">
        <button class="opacity-toggle-btn" @click="toggleOpacity" :title="isFullOpacity ? '恢复透明度' : '完全不透明'">
          ☀️
        </button>
        <button class="action-btn" @click="toggleChapterNav">目录</button>
        <button class="action-btn" @click="toggleSettings">设置</button>
        <div class="window-controls">
          <button class="window-btn minimize-btn" @click="minimizeWindow" title="最小化">−</button>
          <button class="window-btn maximize-btn" @click="toggleMaximize" title="最大化">□</button>
          <button class="window-btn close-btn" @click="closeWindow" title="关闭">×</button>
        </div>
      </div>
    </div>

    <div class="reader-content" ref="contentRef" @scroll="handleScroll" :class="{ 'show-scrollbar': showScrollbar }">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <template v-else-if="currentChapterContent">
        <div class="chapter-header">
          <h3>{{ currentChapterTitle }}</h3>
          <div class="chapter-info">
            {{ currentChapterIndex + 1 }} / {{ book?.chapterIndex?.length }}
          </div>
        </div>

        <div class="chapter-text" :style="textStyle">
          {{ currentChapterContent }}
        </div>

        <div class="chapter-nav-buttons">
          <button
            class="nav-btn"
            :disabled="currentChapterIndex === 0"
            @click="prevChapter"
          >
            上一章
          </button>
          <button
            class="nav-btn"
            :disabled="currentChapterIndex === book?.chapterIndex?.length - 1"
            @click="nextChapter"
          >
            下一章
          </button>
        </div>
      </template>
    </div>

    <ChapterNav
      :chapters="book?.chapterIndex || []"
      :current-index="currentChapterIndex"
      :is-open="showChapterNav"
      @select="selectChapter"
      @close="showChapterNav = false"
    />

    <SettingsPanel
      :is-open="showSettings"
      :in-reader="true"
      @close="showSettings = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { getCurrentWindow } from '@tauri-apps/api/window';
import ChapterNav from '../components/ChapterNav.vue';
import SettingsPanel from '../components/SettingsPanel.vue';
import { storage } from '../utils/storage.js';
import { readFileFromPath } from '../utils/fileParser.js';

const props = defineProps({
  bookId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['back']);

const book = ref(null);
const fullContent = ref(''); // 完整的书籍内容
const currentChapterIndex = ref(0);
const currentChapterContent = ref('');
const currentChapterTitle = ref('');
const showChapterNav = ref(false);
const showSettings = ref(false);
const contentRef = ref(null);
const settings = ref(storage.getSettings());
const loading = ref(false);
const showHeader = ref(true); // 控制顶部栏显示/隐藏
let hideTimer = null; // 延迟隐藏定时器
const showScrollbar = ref(false); // 控制滚动条显示/隐藏
let scrollbarTimer = null; // 滚动条隐藏定时器
const isFullOpacity = ref(false);
const previousOpacity = ref(null);
const keyBindings = ref(storage.getKeyBindings());
const keyBindingsPanelOpen = ref(false);
const isChangingChapter = ref(false); // 标记是否正在切换章节

// 阅读器样式
const readerStyle = computed(() => {
  const opacity = settings.value.backgroundOpacity / 100;
  return {
    backgroundColor: hexToRgba(settings.value.backgroundColor, opacity),
  };
});

// 文本样式
const textStyle = computed(() => {
  const textOpacity = settings.value.textOpacity / 100;
  const textRgb = hexToRgb(settings.value.textColor);

  return {
    fontSize: `${settings.value.fontSize}px`,
    fontFamily: settings.value.fontFamily,
    fontWeight: settings.value.fontWeight,
    lineHeight: settings.value.lineHeight,
    marginBottom: `${settings.value.paragraphSpacing}px`,
    color: `rgba(${textRgb.r}, ${textRgb.g}, ${textRgb.b}, ${textOpacity})`,
  };
});

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 51, g: 51, b: 51 };
}

onMounted(() => {
  loadBook();
  loadOpacityState();
  window.addEventListener('settingsChanged', handleSettingsChange);
  window.addEventListener('keydown', handleKeyPress);
  window.addEventListener('keyBindingsChanged', handleKeyBindingsChange);
  window.addEventListener('keyBindingsPanelState', handleKeyBindingsPanelState);
});

function loadOpacityState() {
  const state = storage.getOpacityState();
  isFullOpacity.value = state.isFullOpacity;
  previousOpacity.value = state.previousOpacity;
}

function handleKeyBindingsChange() {
  keyBindings.value = storage.getKeyBindings();
}

function handleKeyBindingsPanelState(event) {
  keyBindingsPanelOpen.value = event.detail.isOpen;
}

onUnmounted(() => {
  window.removeEventListener('settingsChanged', handleSettingsChange);
  window.removeEventListener('keydown', handleKeyPress);
  window.removeEventListener('keyBindingsChanged', handleKeyBindingsChange);
  window.removeEventListener('keyBindingsPanelState', handleKeyBindingsPanelState);
  saveProgress();
  // 清除隐藏定时器
  if (hideTimer) {
    clearTimeout(hideTimer);
  }
  // 清除滚动条定时器
  if (scrollbarTimer) {
    clearTimeout(scrollbarTimer);
  }
});

// 监听章节变化
watch(currentChapterIndex, async () => {
  loadChapterContent();
  await nextTick();
  // 滚动到顶部
  if (contentRef.value) {
    contentRef.value.scrollTop = 0;
  }
  // 延迟重置标记并保存进度
  setTimeout(() => {
    isChangingChapter.value = false;
    saveProgress();
  }, 100);
});

async function loadBook() {
  try {
    loading.value = true;
    book.value = storage.getBook(props.bookId);

    if (!book.value) {
      alert('书籍不存在');
      goBack();
      return;
    }

    console.log('加载书籍:', book.value.title);
    console.log('书籍路径:', book.value.path);

    // 从文件读取完整内容
    fullContent.value = await readFileFromPath(book.value.path);
    console.log('文件内容加载成功，大小:', fullContent.value.length);

    // 恢复阅读进度
    const progress = storage.getProgress(props.bookId);
    if (progress) {
      currentChapterIndex.value = progress.chapterIndex;
    }

    // 加载当前章节内容
    await loadChapterContent();

    // 恢复滚动位置
    if (progress && progress.scrollPosition) {
      setTimeout(() => {
        if (contentRef.value) {
          contentRef.value.scrollTop = progress.scrollPosition;
        }
      }, 100);
    }

    loading.value = false;
  } catch (error) {
    loading.value = false;
    console.error('加载书籍失败:', error);
    alert('加载书籍失败: ' + error.message);
    goBack();
  }
}

async function loadChapterContent() {
  if (!book.value || !fullContent.value) return;

  const chapterInfo = book.value.chapterIndex[currentChapterIndex.value];
  if (!chapterInfo) return;

  currentChapterTitle.value = chapterInfo.title;

  // 从完整内容中提取当前章节
  const lines = fullContent.value.split('\n');
  const chapterLines = lines.slice(chapterInfo.startLine, chapterInfo.endLine + 1);
  currentChapterContent.value = chapterLines.join('\n').trim();

  console.log('加载章节:', chapterInfo.title);
}

// 处理快捷键
function handleKeyPress(event) {
  // 如果快捷键绑定面板打开，不处理快捷键
  if (keyBindingsPanelOpen.value) {
    return;
  }

  // 如果正在输入框中输入，不处理快捷键
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return;
  }

  const keys = keyBindings.value;

  if (event.key === keys.prevChapter) {
    // 上一章
    event.preventDefault();
    prevChapter();
  } else if (event.key === keys.nextChapter) {
    // 下一章
    event.preventDefault();
    nextChapter();
  } else if (event.key === keys.bossKey) {
    // 老板键：最小化窗口
    event.preventDefault();
    minimizeWindow();
  } else if (keys.toggleOpacity && event.key === keys.toggleOpacity) {
    // 切换透明度
    event.preventDefault();
    toggleOpacity();
  } else if (event.key === keys.pageUp) {
    // 向上翻页
    event.preventDefault();
    pageUp();
  } else if (event.key === keys.pageDown) {
    // 向下翻页
    event.preventDefault();
    pageDown();
  }
}

function handleSettingsChange() {
  settings.value = storage.getSettings();
}

function handleScroll() {
  if (contentRef.value) {
    // 如果正在切换章节，不保存滚动位置
    if (!isChangingChapter.value) {
      const scrollPosition = contentRef.value.scrollTop;
      storage.saveProgress(props.bookId, currentChapterIndex.value, scrollPosition);
    }

    // 显示滚动条
    showScrollbar.value = true;

    // 清除之前的定时器
    if (scrollbarTimer) {
      clearTimeout(scrollbarTimer);
    }

    // 0.3秒后隐藏滚动条
    scrollbarTimer = setTimeout(() => {
      showScrollbar.value = false;
      scrollbarTimer = null;
    }, 300);
  }
}

// 处理鼠标移动，实现顶部栏自动隐藏
function handleMouseMove(event) {
  const mouseY = event.clientY;
  const triggerDistance = 80; // 触发显示的距离（像素）

  if (mouseY <= triggerDistance) {
    // 鼠标在顶部区域，显示顶部栏并清除隐藏定时器
    showHeader.value = true;
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  } else {
    // 鼠标离开顶部区域，如果还没有设置定时器，则设置一个3秒后隐藏的定时器
    if (!hideTimer) {
      hideTimer = setTimeout(() => {
        showHeader.value = false;
        hideTimer = null;
      }, 1000);
    }
  }
}

function saveProgress() {
  const scrollPosition = contentRef.value?.scrollTop || 0;
  storage.saveProgress(props.bookId, currentChapterIndex.value, scrollPosition);
}

function prevChapter() {
  if (currentChapterIndex.value > 0) {
    isChangingChapter.value = true;
    currentChapterIndex.value--;
  }
}

function nextChapter() {
  if (currentChapterIndex.value < book.value.chapterIndex.length - 1) {
    isChangingChapter.value = true;
    currentChapterIndex.value++;
  }
}

function pageUp() {
  if (contentRef.value) {
    // 获取可视区域高度
    const viewportHeight = contentRef.value.clientHeight;
    // 向上滚动一个可视区域的高度（留一点重叠便于阅读连贯）
    const scrollAmount = viewportHeight - 50;
    contentRef.value.scrollTop = Math.max(0, contentRef.value.scrollTop - scrollAmount);
  }
}

function pageDown() {
  if (contentRef.value) {
    // 获取可视区域高度
    const viewportHeight = contentRef.value.clientHeight;
    // 向下滚动一个可视区域的高度（留一点重叠便于阅读连贯）
    const scrollAmount = viewportHeight - 50;
    contentRef.value.scrollTop = contentRef.value.scrollTop + scrollAmount;
  }
}

function selectChapter(index) {
  isChangingChapter.value = true;
  currentChapterIndex.value = index;
  showChapterNav.value = false;
}

function toggleChapterNav() {
  showChapterNav.value = !showChapterNav.value;
}

function toggleSettings() {
  showSettings.value = !showSettings.value;
}

function toggleOpacity() {
  if (isFullOpacity.value) {
    // 恢复之前的透明度
    if (previousOpacity.value !== null) {
      settings.value.backgroundOpacity = previousOpacity.value;
      previousOpacity.value = null;
    }
    isFullOpacity.value = false;
  } else {
    // 保存当前透明度并设置为100%
    previousOpacity.value = settings.value.backgroundOpacity;
    settings.value.backgroundOpacity = 100;
    isFullOpacity.value = true;
  }

  // 保存透明度切换状态
  storage.saveOpacityState(isFullOpacity.value, previousOpacity.value);
  // 保存设置到存储
  storage.saveSettings(settings.value);
  // 通知 App.vue 更新全局样式（但不触发本组件的 handleSettingsChange）
  window.dispatchEvent(new CustomEvent('globalStyleUpdate'));
}

function goBack() {
  saveProgress();
  emit('back');
}

// 窗口控制函数
async function minimizeWindow() {
  const appWindow = getCurrentWindow();
  await appWindow.minimize();
}

async function toggleMaximize() {
  const appWindow = getCurrentWindow();
  await appWindow.toggleMaximize();
}

async function closeWindow() {
  const appWindow = getCurrentWindow();
  await appWindow.close();
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
</script>

<style scoped>
.reader {
  height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s;
  overflow: hidden;
}

.reader-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  transition: transform 0.3s ease-in-out;
  transform: translateY(0);
}

.reader-header.header-hidden {
  transform: translateY(-100%);
}

.header-left {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

.drag-region {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  user-select: none;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.back-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #e0e0e0;
}

.book-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 窗口控制按钮 */
.window-controls {
  display: flex;
  align-items: center;
  gap: 0;
  margin-left: 12px;
}

.window-btn {
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  color: #333;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Segoe UI', sans-serif;
}

.window-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.minimize-btn {
  font-size: 20px;
  padding-bottom: 4px;
}

.maximize-btn {
  font-size: 14px;
}

.close-btn:hover {
  background: #e81123;
  color: white;
}

.action-btn {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #45a049;
}

.opacity-toggle-btn {
  padding: 8px 12px;
  background: #FFA726;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.opacity-toggle-btn:hover {
  background: #FB8C00;
  transform: scale(1.05);
}

.opacity-toggle-btn:active {
  transform: scale(0.95);
}

.reader-content {
  flex: 1;
  overflow-y: scroll;
  padding: 40px;
  padding-top: 100px; /* 为固定定位的顶部栏留出空间 */
  padding-right: 48px; /* 为滚动条预留空间 */
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

/* 滚动条样式 - 始终存在但透明 */
.reader-content::-webkit-scrollbar {
  width: 8px;
  position: absolute;
}

.reader-content::-webkit-scrollbar-track {
  background: transparent;
}

.reader-content::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 4px;
  transition: background 0.3s;
}

/* 滚动时显示滚动条 */
.reader-content.show-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
}

.reader-content.show-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}

/* Firefox 滚动条 */
.reader-content {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.reader-content.show-scrollbar {
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top-color: #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  margin-top: 20px;
  color: #666;
}

.chapter-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.1);
}

.chapter-header h3 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.chapter-info {
  font-size: 14px;
  color: #999;
}

.chapter-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #333;
  text-align: justify;
  transition: all 0.3s;
}

.chapter-nav-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 60px;
  padding-top: 40px;
  border-top: 2px solid rgba(0, 0, 0, 0.1);
}

.nav-btn {
  padding: 12px 32px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: #45a049;
}

.nav-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
