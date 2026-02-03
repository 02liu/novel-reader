<template>
  <div class="chapter-nav" :class="{ open: isOpen }">
    <div class="nav-header">
      <h3>章节目录</h3>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>
    <div class="chapter-list">
      <div
        v-for="(chapter, index) in chapters"
        :key="index"
        class="chapter-item"
        :class="{ active: index === currentIndex }"
        @click="$emit('select', index)"
      >
        <span class="chapter-number">{{ getDisplayNumber(chapter, index) }}</span>
        <span class="chapter-title">{{ chapter.title }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { extractChapterNumber } from '../utils/chapterDetector.js';

defineProps({
  chapters: {
    type: Array,
    required: true
  },
  currentIndex: {
    type: Number,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  }
});

defineEmits(['select', 'close']);

function getDisplayNumber(chapter, index) {
  // 优先使用缓存的章节号，否则动态提取
  if (chapter.chapterNum !== null && chapter.chapterNum !== undefined) {
    return chapter.chapterNum;
  }
  // 动态从标题提取章节号
  const extracted = extractChapterNumber(chapter.title);
  if (extracted !== null) {
    return extracted;
  }
  // 无法提取则显示特殊标记
  return '★';
}
</script>

<style scoped>
.chapter-nav {
  position: fixed;
  left: -320px;
  top: 0;
  bottom: 0;
  width: 300px;
  background: transparent;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  transition: left 0.3s;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.chapter-nav.open {
  left: 0;
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.nav-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.close-btn:hover {
  background: #e0e0e0;
}

.chapter-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.chapter-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.chapter-item:hover {
  background: #f5f5f5;
}

.chapter-item.active {
  background: #e3f2fd;
  color: #1976d2;
}

.chapter-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 50%;
  font-size: 12px;
  margin-right: 12px;
}

.chapter-item.active .chapter-number {
  background: #1976d2;
  color: white;
}

.chapter-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}
</style>
