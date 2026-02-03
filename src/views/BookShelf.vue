<template>
  <div class="bookshelf">
    <div class="header">
      <div class="drag-region" data-tauri-drag-region>
        <h1>我的书架</h1>
      </div>
      <div class="header-actions">
        <button class="opacity-toggle-btn" @click="toggleOpacity" :title="isFullOpacity ? '恢复透明度' : '完全不透明'">
          ☀️
        </button>
        <button class="import-btn" @click="importBook">
          + 导入小说
        </button>
        <button class="settings-btn" @click="toggleSettings">设置</button>
        <div class="window-controls">
          <button class="window-btn minimize-btn" @click="minimizeWindow" title="最小化">−</button>
          <button class="window-btn maximize-btn" @click="toggleMaximize" title="最大化">□</button>
          <button class="window-btn close-btn" @click="closeWindow" title="关闭">×</button>
        </div>
      </div>
    </div>

    <div v-if="books.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <p>书架空空如也</p>
      <p class="empty-hint">点击"导入小说"添加你的第一本书</p>
    </div>

    <div v-else class="book-grid">
      <BookCard
        v-for="book in books"
        :key="book.id"
        :book="book"
        @open="openBook"
        @delete="deleteBook"
      />
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>正在解析小说...</p>
    </div>

    <SettingsPanel
      :is-open="showSettings"
      @close="showSettings = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { getCurrentWindow } from '@tauri-apps/api/window';
import BookCard from '../components/BookCard.vue';
import SettingsPanel from '../components/SettingsPanel.vue';
import { storage } from '../utils/storage.js';
import { openFileDialog } from '../utils/fileParser.js';
import { detectChapters } from '../utils/chapterDetector.js';

const emit = defineEmits(['openReader']);

const books = ref([]);
const loading = ref(false);
const showSettings = ref(false);
const isFullOpacity = ref(false);
const previousOpacity = ref(null);

onMounted(() => {
  loadBooks();
  loadOpacityState();
  window.addEventListener('booksCleared', loadBooks);
});

onUnmounted(() => {
  window.removeEventListener('booksCleared', loadBooks);
});

function loadOpacityState() {
  const state = storage.getOpacityState();
  isFullOpacity.value = state.isFullOpacity;
  previousOpacity.value = state.previousOpacity;
}

function loadBooks() {
  books.value = storage.getBooks();
}

async function importBook() {
  try {
    console.log('点击导入按钮');
    loading.value = true;

    console.log('调用 openFileDialog...');
    const { path, content, name } = await openFileDialog();

    console.log('文件对话框返回:', { path, name, contentLength: content.length });

    // 检测章节
    console.log('开始检测章节...');
    const chapters = detectChapters(content);
    console.log('检测到章节数:', chapters.length);

    // 创建章节索引（不包含内容，只保存位置信息）
    const chapterIndex = chapters.map(ch => ({
      title: ch.title,
      startLine: ch.startLine,
      endLine: ch.endLine,
    }));

    // 创建书籍对象
    const book = {
      id: Date.now().toString(),
      title: name,
      path,
      wordCount: content.length,
      chapterCount: chapters.length,
      addedAt: Date.now(),
      chapterIndex, // 只保存索引，不保存内容
    };

    console.log('保存书籍:', book.title);
    // 保存书籍
    storage.saveBook(book);

    // 刷新列表
    loadBooks();

    loading.value = false;
    console.log('导入成功！');
  } catch (error) {
    loading.value = false;
    console.error('导入过程出错:', error);
    console.error('错误详情:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    if (error.message !== '未选择文件') {
      alert('导入失败: ' + error.message);
    } else {
      console.log('用户取消了文件选择');
    }
  }
}

function openBook(book) {
  emit('openReader', book.id);
}

async function deleteBook(bookId) {
  const { ask } = await import('@tauri-apps/plugin-dialog');

  const confirmed = await ask('确定要删除这本书吗？', {
    title: '删除确认',
    kind: 'warning'
  });

  if (!confirmed) {
    return;
  }

  // 获取书籍信息
  const book = storage.getBook(bookId);

  // 删除文件
  if (book && book.path) {
    try {
      const { remove } = await import('@tauri-apps/plugin-fs');
      await remove(book.path);
      console.log('文件已删除:', book.path);
    } catch (error) {
      console.error('删除文件失败:', error);
      // 即使文件删除失败，也继续删除书籍记录
    }
  }

  // 删除书籍记录
  storage.deleteBook(bookId);
  loadBooks();
}

function toggleSettings() {
  showSettings.value = !showSettings.value;
}

function toggleOpacity() {
  const settings = storage.getSettings();

  if (isFullOpacity.value) {
    // 恢复之前的透明度
    if (previousOpacity.value !== null) {
      settings.backgroundOpacity = previousOpacity.value;
      previousOpacity.value = null;
    }
    isFullOpacity.value = false;
  } else {
    // 保存当前透明度并设置为100%
    previousOpacity.value = settings.backgroundOpacity;
    settings.backgroundOpacity = 100;
    isFullOpacity.value = true;
  }

  // 保存透明度切换状态
  storage.saveOpacityState(isFullOpacity.value, previousOpacity.value);
  storage.saveSettings(settings);
  window.dispatchEvent(new Event('settingsChanged'));
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
</script>

<style scoped>
.bookshelf {
  min-height: 100vh;
  padding: 40px;
  padding-top: 60px;
  background: transparent;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 12px 40px;
  background: transparent;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.drag-region {
  flex: 1;
  cursor: move;
  user-select: none;
}

.header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0;
  pointer-events: none;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.opacity-toggle-btn {
  padding: 12px 16px;
  background: #FFA726;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 20px;
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

.import-btn {
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.import-btn:hover {
  background: #45a049;
}

.settings-btn {
  padding: 12px 24px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.settings-btn:hover {
  background: #1976D2;
}

.empty-state {
  text-align: center;
  padding: 100px 20px;
  color: #999;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 18px;
  margin: 10px 0;
}

.empty-hint {
  font-size: 14px;
  color: #ccc;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 1000;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-overlay p {
  margin-top: 20px;
  font-size: 16px;
}

/* 窗口控制按钮 */
.window-controls {
  display: flex;
  align-items: center;
  gap: 0;
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
</style>
