<template>
  <div class="book-card" @click="$emit('open', book)">
    <div class="book-cover">
      <div class="book-icon">📖</div>
      <div class="book-title">{{ book.title }}</div>
    </div>
    <div class="book-info">
      <div class="info-item">{{ formatWordCount(book.wordCount) }}</div>
      <div class="info-item">{{ formatDate(book.addedAt) }}</div>
    </div>
    <button class="delete-btn" @click.stop="$emit('delete', book.id)" title="删除">
      ×
    </button>
  </div>
</template>

<script setup>
defineProps({
  book: {
    type: Object,
    required: true
  }
});

defineEmits(['open', 'delete']);

function formatWordCount(count) {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万字`;
  }
  return `${count}字`;
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
</script>

<style scoped>
.book-card {
  position: relative;
  background: white;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.book-cover {
  text-align: center;
  margin-bottom: 12px;
}

.book-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.book-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 0, 0, 0.1);
  color: #ff4444;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.book-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(255, 0, 0, 0.2);
}
</style>
