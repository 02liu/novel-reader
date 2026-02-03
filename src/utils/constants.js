// 常量配置

// 章节识别正则表达式
export const CHAPTER_PATTERNS = [
  // 中文章节：第一章、第1章、第一百章等
  /^第[一二三四五六七八九十百千\d]+章.*/,
  // 英文章节：Chapter 1、Chapter One等
  /^Chapter\s+[\dA-Za-z]+.*/i,
  // 纯数字章节：001、1.、1、等
  /^\d{1,4}[\.、\s].*/,
  // 卷+章节：第一卷 第一章
  /^第[一二三四五六七八九十百千\d]+卷\s*第[一二三四五六七八九十百千\d]+章.*/,
];

// 默认字体配置
export const DEFAULT_FONTS = [
  { label: '宋体', value: 'SimSun, serif' },
  { label: '黑体', value: 'SimHei, sans-serif' },
  { label: '楷体', value: 'KaiTi, serif' },
  { label: '微软雅黑', value: 'Microsoft YaHei, sans-serif' },
  { label: '系统默认', value: 'system-ui, -apple-system, sans-serif' },
];

// 默认背景颜色预设
export const DEFAULT_BG_COLORS = [
  { label: '米白', value: '#F5F5DC' },
  { label: '护眼绿', value: '#C7EDCC' },
  { label: '淡黄', value: '#FFF8DC' },
  { label: '浅灰', value: '#F0F0F0' },
  { label: '纯白', value: '#FFFFFF' },
  { label: '深灰', value: '#2F2F2F' },
  { label: '纯黑', value: '#000000' },
];

// 默认字体颜色预设
export const DEFAULT_TEXT_COLORS = [
  { label: '黑色', value: '#000000' },
  { label: '深灰', value: '#333333' },
  { label: '中灰', value: '#666666' },
  { label: '浅灰', value: '#999999' },
  { label: '白色', value: '#FFFFFF' },
  { label: '深蓝', value: '#1E3A8A' },
  { label: '深绿', value: '#166534' },
];

// 默认阅读设置
export const DEFAULT_SETTINGS = {
  fontSize: 18,
  fontFamily: 'Microsoft YaHei, sans-serif',
  fontWeight: 'normal',
  lineHeight: 1.8,
  paragraphSpacing: 15,
  backgroundColor: '#F5F5DC',
  backgroundOpacity: 100,
  textColor: '#333333', // 文字颜色
  textOpacity: 100, // 文字透明度
  booksPath: './books', // 默认小说存储路径
};

// 默认快捷键配置
export const DEFAULT_KEYBINDINGS = {
  prevChapter: 'ArrowLeft',
  nextChapter: 'ArrowRight',
  bossKey: 'Escape',
  toggleOpacity: '',
  pageUp: 'PageUp',
  pageDown: 'PageDown'
};

// 快捷键显示名称映射
export const KEY_DISPLAY_NAMES = {
  'ArrowLeft': '←',
  'ArrowRight': '→',
  'ArrowUp': '↑',
  'ArrowDown': '↓',
  'Escape': 'Esc',
  'Enter': 'Enter',
  'Space': 'Space',
  'Tab': 'Tab',
  'Backspace': 'Backspace',
  'Delete': 'Delete',
  'Home': 'Home',
  'End': 'End',
  'PageUp': 'Page Up',
  'PageDown': 'Page Down',
  '': '未绑定'
};

// 存储键名
export const STORAGE_KEYS = {
  BOOKS: 'novel_reader_books',
  SETTINGS: 'novel_reader_settings',
  READING_PROGRESS: 'novel_reader_progress',
  KEYBINDINGS: 'novel_reader_keybindings',
  OPACITY_STATE: 'novel_reader_opacity_state',
};
