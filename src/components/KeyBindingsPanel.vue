<template>
  <div v-if="isOpen" class="keybindings-overlay" @click.self="close">
    <div class="keybindings-panel">
      <div class="panel-header">
        <h2>快捷键绑定</h2>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="panel-content">
        <div class="keybinding-item">
          <div class="keybinding-info">
            <h3>上一章</h3>
            <p class="keybinding-desc">快速跳转到上一章节</p>
          </div>
          <div class="keybinding-key" @click="startRecording('prevChapter')">
            <kbd :class="{ recording: recordingKey === 'prevChapter' }">
              {{ recordingKey === 'prevChapter' ? '按下任意键...' : getKeyDisplayName(keyBindings.prevChapter) }}
            </kbd>
          </div>
        </div>

        <div class="keybinding-item">
          <div class="keybinding-info">
            <h3>下一章</h3>
            <p class="keybinding-desc">快速跳转到下一章节</p>
          </div>
          <div class="keybinding-key" @click="startRecording('nextChapter')">
            <kbd :class="{ recording: recordingKey === 'nextChapter' }">
              {{ recordingKey === 'nextChapter' ? '按下任意键...' : getKeyDisplayName(keyBindings.nextChapter) }}
            </kbd>
          </div>
        </div>

        <div class="keybinding-item">
          <div class="keybinding-info">
            <h3>向上翻页</h3>
            <p class="keybinding-desc">向上滚动一页内容</p>
          </div>
          <div class="keybinding-key" @click="startRecording('pageUp')">
            <kbd :class="{ recording: recordingKey === 'pageUp' }">
              {{ recordingKey === 'pageUp' ? '按下任意键...' : getKeyDisplayName(keyBindings.pageUp) }}
            </kbd>
          </div>
        </div>

        <div class="keybinding-item">
          <div class="keybinding-info">
            <h3>向下翻页</h3>
            <p class="keybinding-desc">向下滚动一页内容</p>
          </div>
          <div class="keybinding-key" @click="startRecording('pageDown')">
            <kbd :class="{ recording: recordingKey === 'pageDown' }">
              {{ recordingKey === 'pageDown' ? '按下任意键...' : getKeyDisplayName(keyBindings.pageDown) }}
            </kbd>
          </div>
        </div>

        <div class="keybinding-item">
          <div class="keybinding-info">
            <h3>老板键</h3>
            <p class="keybinding-desc">一键最小化窗口</p>
          </div>
          <div class="keybinding-key" @click="startRecording('bossKey')">
            <kbd :class="{ recording: recordingKey === 'bossKey' }">
              {{ recordingKey === 'bossKey' ? '按下任意键...' : getKeyDisplayName(keyBindings.bossKey) }}
            </kbd>
          </div>
        </div>

        <div class="keybinding-item">
          <div class="keybinding-info">
            <h3>切换透明度</h3>
            <p class="keybinding-desc">快速切换背景透明/不透明</p>
          </div>
          <div class="keybinding-key" @click="startRecording('toggleOpacity')">
            <kbd :class="{ recording: recordingKey === 'toggleOpacity' }">
              {{ recordingKey === 'toggleOpacity' ? '按下任意键...' : getKeyDisplayName(keyBindings.toggleOpacity) }}
            </kbd>
          </div>
        </div>

        <div class="keybinding-actions">
          <button class="reset-keybindings-btn" @click="resetKeyBindings">
            恢复默认快捷键
          </button>
        </div>

        <div class="keybinding-hint">
          <p>💡 提示：点击快捷键可以修改，快捷键在阅读页面中生效</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { storage } from '../utils/storage.js';
import { DEFAULT_KEYBINDINGS, KEY_DISPLAY_NAMES } from '../utils/constants.js';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const keyBindings = ref({ ...DEFAULT_KEYBINDINGS });
const recordingKey = ref(null);

onMounted(() => {
  loadKeyBindings();
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  // 确保关闭时启用快捷键
  window.dispatchEvent(new CustomEvent('keyBindingsPanelState', { detail: { isOpen: false } }));
});

// 监听面板打开/关闭状态
watch(() => props.isOpen, (newValue) => {
  // 通知其他组件快捷键绑定面板的状态
  window.dispatchEvent(new CustomEvent('keyBindingsPanelState', { detail: { isOpen: newValue } }));
});

function loadKeyBindings() {
  keyBindings.value = storage.getKeyBindings();
}

function startRecording(action) {
  recordingKey.value = action;
}

function handleKeyDown(event) {
  if (!recordingKey.value) return;

  event.preventDefault();
  event.stopPropagation();

  // 忽略修饰键单独按下
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
    return;
  }

  // 保存新的快捷键
  keyBindings.value[recordingKey.value] = event.key;
  storage.saveKeyBindings(keyBindings.value);

  // 通知其他组件快捷键已更改
  window.dispatchEvent(new Event('keyBindingsChanged'));

  recordingKey.value = null;
}

function getKeyDisplayName(key) {
  return KEY_DISPLAY_NAMES[key] || key;
}

function resetKeyBindings() {
  if (confirm('确定要恢复默认快捷键吗？')) {
    keyBindings.value = { ...DEFAULT_KEYBINDINGS };
    storage.saveKeyBindings(keyBindings.value);
    window.dispatchEvent(new Event('keyBindingsChanged'));
  }
}

function close() {
  recordingKey.value = null;
  // 通知启用快捷键
  window.dispatchEvent(new CustomEvent('keyBindingsPanelState', { detail: { isOpen: false } }));
  emit('close');
}
</script>

<style scoped>
.keybindings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.keybindings-panel {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.panel-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #e0e0e0;
}

.panel-content {
  padding: 24px;
}

.keybinding-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: background 0.2s;
}

.keybinding-item:hover {
  background: #f0f0f0;
}

.keybinding-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
}

.keybinding-desc {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.keybinding-key {
  display: flex;
  gap: 8px;
  cursor: pointer;
}

kbd {
  display: inline-block;
  padding: 8px 16px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 40px;
  text-align: center;
  transition: all 0.2s;
}

kbd:hover {
  border-color: #2196F3;
  background: #E3F2FD;
}

kbd.recording {
  border-color: #4CAF50;
  background: #C8E6C9;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.keybinding-actions {
  margin-top: 16px;
  margin-bottom: 16px;
}

.reset-keybindings-btn {
  width: 100%;
  padding: 12px;
  background: #f5f5f5;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  color: #666;
  transition: background 0.2s;
}

.reset-keybindings-btn:hover {
  background: #e0e0e0;
}

.keybinding-hint {
  margin-top: 24px;
  padding: 16px;
  background: #e3f2fd;
  border-radius: 8px;
  border-left: 4px solid #2196F3;
}

.keybinding-hint p {
  margin: 0;
  font-size: 14px;
  color: #1976D2;
}
</style>

