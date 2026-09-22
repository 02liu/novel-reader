<template>
  <div class="settings-panel" :class="{ open: isOpen }">
    <div class="panel-header">
      <h3>阅读设置</h3>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>

    <div class="panel-content">
      <!-- 字体大小 -->
      <div class="setting-group">
        <label class="setting-label">
          字体大小
          <span class="setting-value">{{ settings.fontSize }}px</span>
        </label>
        <input
          type="range"
          min="12"
          max="32"
          v-model.number="settings.fontSize"
          @input="updateSettings"
          class="slider"
        />
      </div>

      <!-- 字体族 -->
      <div class="setting-group">
        <label class="setting-label">字体</label>
        <select v-model="settings.fontFamily" @change="updateSettings" class="select">
          <option
            v-for="font in fonts"
            :key="font.value"
            :value="font.value"
          >
            {{ font.label }}
          </option>
        </select>
      </div>

      <!-- 字体粗细 -->
      <div class="setting-group">
        <label class="setting-label">字体粗细</label>
        <select v-model="settings.fontWeight" @change="updateSettings" class="select">
          <option value="normal">正常</option>
          <option value="bold">加粗</option>
        </select>
      </div>

      <!-- 行间距 -->
      <div class="setting-group">
        <label class="setting-label">
          行间距
          <span class="setting-value">{{ settings.lineHeight }}</span>
        </label>
        <input
          type="range"
          min="1"
          max="3"
          step="0.1"
          v-model.number="settings.lineHeight"
          @input="updateSettings"
          class="slider"
        />
      </div>

      <!-- 段落间距 -->
      <div class="setting-group">
        <label class="setting-label">
          段落间距
          <span class="setting-value">{{ settings.paragraphSpacing }}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="30"
          v-model.number="settings.paragraphSpacing"
          @input="updateSettings"
          class="slider"
        />
      </div>

      <!-- 字体颜色 -->
      <div class="setting-group">
        <label class="setting-label">字体颜色</label>
        <div class="color-presets">
          <div
            v-for="color in textColors"
            :key="color.value"
            class="color-preset"
            :class="{ active: settings.textColor === color.value }"
            :style="{ backgroundColor: color.value }"
            :title="color.label"
            @click="selectTextColor(color.value)"
          ></div>
          <input
            type="color"
            v-model="settings.textColor"
            @input="updateSettings"
            class="color-picker"
            title="自定义颜色"
          />
        </div>
      </div>

      <!-- 背景颜色 -->
      <div class="setting-group">
        <label class="setting-label">背景颜色</label>
        <div class="color-presets">
          <div
            v-for="color in bgColors"
            :key="color.value"
            class="color-preset"
            :class="{ active: settings.backgroundColor === color.value }"
            :style="{ backgroundColor: color.value }"
            :title="color.label"
            @click="selectColor(color.value)"
          ></div>
          <input
            type="color"
            v-model="settings.backgroundColor"
            @input="updateSettings"
            class="color-picker"
            title="自定义颜色"
          />
        </div>
      </div>

      <!-- 背景透明度 -->
      <div class="setting-group">
        <label class="setting-label">
          背景透明度
          <span class="setting-value">{{ settings.backgroundOpacity }}%</span>
        </label>
        <p class="setting-hint">调整背景的透明度，0%为完全透明</p>
        <input
          type="range"
          min="0"
          max="100"
          v-model.number="settings.backgroundOpacity"
          @input="updateSettings"
          class="slider"
        />
      </div>

      <!-- 文字透明度 -->
      <div class="setting-group">
        <label class="setting-label">
          文字透明度
          <span class="setting-value">{{ settings.textOpacity }}%</span>
        </label>
        <p class="setting-hint">调整文字的透明度，100%为完全不透明</p>
        <input
          type="range"
          min="0"
          max="100"
          v-model.number="settings.textOpacity"
          @input="updateSettings"
          class="slider"
        />
      </div>

      <!-- 窗口标题 -->
      <div class="setting-group">
        <label class="setting-label">窗口标题</label>
        <p class="setting-hint">自定义任务栏和任务管理器中显示的窗口名称</p>
        <input
          type="text"
          v-model="settings.windowTitle"
          @change="updateWindowTitle"
          @blur="updateWindowTitle"
          class="text-input"
          placeholder="请输入窗口标题"
          maxlength="50"
        />
      </div>

      <!-- TTS 朗读 -->
      <div class="setting-group tts-setting-group">
        <div class="setting-section-title">语音朗读（免费系统 TTS）</div>
        <p class="setting-hint">
          使用 Windows/WebView2 的 Web Speech API，不需要 API Key。
        </p>

        <template v-if="ttsSupported">
          <label class="setting-label">音色</label>
          <select v-model="settings.ttsVoice" @change="updateSettings" class="select">
            <option value="">自动选择中文/系统默认语音</option>
            <option
              v-for="voice in ttsVoices"
              :key="voice.voiceURI"
              :value="voice.voiceURI"
            >
              {{ formatVoiceName(voice) }}
            </option>
          </select>

          <label class="setting-label tts-sub-label">
            语速
            <span class="setting-value">{{ Number(settings.ttsRate).toFixed(1) }}x</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            v-model.number="settings.ttsRate"
            @input="updateSettings"
            class="slider"
          />

          <label class="setting-label tts-sub-label">
            音量
            <span class="setting-value">{{ Math.round(settings.ttsVolume * 100) }}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            v-model.number="settings.ttsVolume"
            @input="updateSettings"
            class="slider"
          />

          <label class="checkbox-row">
            <input
              type="checkbox"
              v-model="settings.ttsAutoNextChapter"
              @change="updateSettings"
            />
            <span>本章读完后自动进入下一章并继续朗读</span>
          </label>
        </template>

        <p v-else class="setting-hint danger-hint">
          当前 WebView2 环境没有提供 Web Speech API。
        </p>
      </div>

      <!-- 重置按钮 -->
      <div class="setting-group">
        <button class="reset-btn" @click="resetSettings">
          恢复默认设置
        </button>
      </div>

      <!-- 快捷键绑定 -->
      <div class="setting-group">
        <button class="keybindings-btn" @click="openKeyBindings">
          ⌨️ 快捷键绑定
        </button>
      </div>

      <!-- 清除缓存 - 只在主界面显示 -->
      <div v-if="!inReader" class="setting-group">
        <button class="clear-cache-btn" @click="clearCache">
          🗑️ 清除所有缓存
        </button>
        <p class="setting-hint danger-hint">删除所有已导入的小说文件，此操作不可恢复</p>
      </div>
    </div>

    <KeyBindingsPanel
      :is-open="showKeyBindings"
      @close="showKeyBindings = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { storage } from '../utils/storage.js';
import { DEFAULT_FONTS, DEFAULT_BG_COLORS, DEFAULT_TEXT_COLORS, DEFAULT_SETTINGS } from '../utils/constants.js';
import { ttsController } from '../utils/tts.js';
import KeyBindingsPanel from './KeyBindingsPanel.vue';

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  inReader: {
    type: Boolean,
    default: false
  }
});

defineEmits(['close']);

const settings = ref({ ...DEFAULT_SETTINGS });
const fonts = DEFAULT_FONTS;
const bgColors = DEFAULT_BG_COLORS;
const textColors = DEFAULT_TEXT_COLORS;
const showKeyBindings = ref(false);
const ttsSupported = ref(false);
const ttsVoices = ref([]);

onMounted(async () => {
  loadSettings();
  ttsSupported.value = ttsController.isSupported();

  if (ttsSupported.value) {
    ttsVoices.value = await ttsController.waitForVoices();
  }
});

function loadSettings() {
  settings.value = storage.getSettings();
}

function updateSettings() {
  storage.saveSettings(settings.value);
  // 触发全局事件通知阅读器更新
  window.dispatchEvent(new Event('settingsChanged'));
}

function selectColor(color) {
  settings.value.backgroundColor = color;
  updateSettings();
}

function selectTextColor(color) {
  settings.value.textColor = color;
  updateSettings();
}

function updateWindowTitle() {
  console.log('更新窗口标题:', settings.value.windowTitle);
  storage.saveSettings(settings.value);
  // 触发窗口标题更新事件
  window.dispatchEvent(new CustomEvent('windowTitleChanged', {
    detail: { title: settings.value.windowTitle }
  }));
}

function formatVoiceName(voice) {
  const localTag = voice.localService ? '本地' : '系统/在线';
  return `${voice.name} (${voice.lang || 'unknown'} · ${localTag})`;
}

function resetSettings() {
  if (confirm('确定要恢复默认设置吗？')) {
    settings.value = { ...DEFAULT_SETTINGS };
    updateSettings();
  }
}

function openKeyBindings() {
  showKeyBindings.value = true;
}

async function clearCache() {
  const { ask, message } = await import('@tauri-apps/plugin-dialog');

  // 第一次确认
  const firstConfirm = await ask('确定要清除所有缓存吗？\n\n这将删除所有已导入的小说文件！', {
    title: '清除缓存',
    kind: 'warning'
  });

  if (!firstConfirm) {
    return;
  }

  // 第二次确认
  const secondConfirm = await ask('此操作将永久删除所有小说文件，且无法恢复！\n\n确定要继续吗？', {
    title: '⚠️ 最后确认',
    kind: 'warning'
  });

  if (!secondConfirm) {
    return;
  }

  try {
    const { remove, exists, readDir } = await import('@tauri-apps/plugin-fs');
    const { appDataDir, join } = await import('@tauri-apps/api/path');

    // 获取 books 目录路径
    const dataDir = await appDataDir();
    const booksDir = await join(dataDir, 'books');

    // 检查目录是否存在
    const dirExists = await exists(booksDir);
    if (dirExists) {
      // 读取目录中的所有文件
      const files = await readDir(booksDir);

      // 删除每个文件
      for (const file of files) {
        try {
          const filePath = await join(booksDir, file.name);
          await remove(filePath);
          console.log('已删除文件:', filePath);
        } catch (err) {
          console.error('删除文件失败:', file.name, err);
        }
      }
    }

    // 清除 localStorage 中的书籍记录
    storage.clearAllBooks();

    await message('所有小说文件已删除。', {
      title: '缓存已清除',
      kind: 'info'
    });

    // 通知书架刷新
    window.dispatchEvent(new Event('booksCleared'));
  } catch (error) {
    console.error('清除缓存失败:', error);
    await message('清除缓存失败: ' + error.message, {
      title: '错误',
      kind: 'error'
    });
  }
}
</script>

<style scoped>
.settings-panel {
  position: fixed;
  right: -360px;
  top: 0;
  bottom: 0;
  width: 340px;
  background: transparent;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  transition: right 0.3s;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.settings-panel.open {
  right: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
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

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.setting-group {
  margin-bottom: 24px;
}

.setting-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.setting-section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.setting-hint {
  font-size: 12px;
  color: #999;
  margin: -8px 0 8px 0;
}

.setting-value {
  color: #4CAF50;
  font-weight: 600;
}

.tts-setting-group {
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.tts-sub-label {
  margin-top: 18px;
}

.checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 18px;
  font-size: 13px;
  line-height: 1.5;
  color: #555;
  cursor: pointer;
}

.checkbox-row input {
  margin-top: 3px;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4CAF50;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4CAF50;
  cursor: pointer;
  border: none;
}

.select {
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.select:focus {
  outline: none;
  border-color: #4CAF50;
}

.text-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: border-color 0.2s;
}

.text-input:focus {
  outline: none;
  border-color: #4CAF50;
}

.color-presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-preset {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.color-preset:hover {
  transform: scale(1.1);
}

.color-preset.active {
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.color-picker {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.reset-btn {
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

.reset-btn:hover {
  background: #e0e0e0;
}

.keybindings-btn {
  width: 100%;
  padding: 12px;
  background: #2196F3;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  color: white;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.keybindings-btn:hover {
  background: #1976D2;
}

.clear-cache-btn {
  width: 100%;
  padding: 12px;
  background: #f44336;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  color: white;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.clear-cache-btn:hover {
  background: #d32f2f;
}

.danger-hint {
  color: #f44336 !important;
  margin-top: 4px;
}
</style>
