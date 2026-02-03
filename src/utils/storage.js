import { STORAGE_KEYS, DEFAULT_SETTINGS, DEFAULT_KEYBINDINGS } from './constants.js';

/**
 * 存储管理类
 */
class StorageManager {
  /**
   * 获取所有书籍
   * @returns {Array} 书籍列表
   */
  getBooks() {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKS);
    return data ? JSON.parse(data) : [];
  }

  /**
   * 保存书籍
   * @param {Object} book - 书籍对象
   */
  saveBook(book) {
    const books = this.getBooks();
    const existingIndex = books.findIndex(b => b.id === book.id);

    if (existingIndex >= 0) {
      books[existingIndex] = book;
    } else {
      books.push(book);
    }

    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  }

  /**
   * 删除书籍
   * @param {string} bookId - 书籍ID
   */
  deleteBook(bookId) {
    const books = this.getBooks();
    const filtered = books.filter(b => b.id !== bookId);
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(filtered));

    // 同时删除该书的阅读进度
    this.deleteProgress(bookId);
  }

  /**
   * 清除所有书籍记录
   */
  clearAllBooks() {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.READING_PROGRESS, JSON.stringify({}));
  }

  /**
   * 获取书籍
   * @param {string} bookId - 书籍ID
   * @returns {Object|null} 书籍对象
   */
  getBook(bookId) {
    const books = this.getBooks();
    return books.find(b => b.id === bookId) || null;
  }

  /**
   * 获取阅读设置
   * @returns {Object} 设置对象
   */
  getSettings() {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  }

  /**
   * 保存阅读设置
   * @param {Object} settings - 设置对象
   */
  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  /**
   * 获取阅读进度
   * @param {string} bookId - 书籍ID
   * @returns {Object|null} 进度对象 {chapterIndex, scrollPosition}
   */
  getProgress(bookId) {
    const data = localStorage.getItem(STORAGE_KEYS.READING_PROGRESS);
    const allProgress = data ? JSON.parse(data) : {};
    return allProgress[bookId] || null;
  }

  /**
   * 保存阅读进度
   * @param {string} bookId - 书籍ID
   * @param {number} chapterIndex - 章节索引
   * @param {number} scrollPosition - 滚动位置
   */
  saveProgress(bookId, chapterIndex, scrollPosition = 0) {
    const data = localStorage.getItem(STORAGE_KEYS.READING_PROGRESS);
    const allProgress = data ? JSON.parse(data) : {};

    allProgress[bookId] = {
      chapterIndex,
      scrollPosition,
      updatedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEYS.READING_PROGRESS, JSON.stringify(allProgress));
  }

  /**
   * 删除阅读进度
   * @param {string} bookId - 书籍ID
   */
  deleteProgress(bookId) {
    const data = localStorage.getItem(STORAGE_KEYS.READING_PROGRESS);
    const allProgress = data ? JSON.parse(data) : {};
    delete allProgress[bookId];
    localStorage.setItem(STORAGE_KEYS.READING_PROGRESS, JSON.stringify(allProgress));
  }

  /**
   * 获取最近阅读的书籍
   * @returns {Object|null} 书籍对象
   */
  getLastReadBook() {
    const data = localStorage.getItem(STORAGE_KEYS.READING_PROGRESS);
    if (!data) return null;

    const allProgress = JSON.parse(data);
    const entries = Object.entries(allProgress);

    if (entries.length === 0) return null;

    // 找到最近更新的进度
    const [bookId] = entries.reduce((latest, current) => {
      return current[1].updatedAt > latest[1].updatedAt ? current : latest;
    });

    return this.getBook(bookId);
  }

  /**
   * 获取快捷键配置
   * @returns {Object} 快捷键配置对象
   */
  getKeyBindings() {
    const data = localStorage.getItem(STORAGE_KEYS.KEYBINDINGS);
    return data ? { ...DEFAULT_KEYBINDINGS, ...JSON.parse(data) } : DEFAULT_KEYBINDINGS;
  }

  /**
   * 保存快捷键配置
   * @param {Object} keyBindings - 快捷键配置对象
   */
  saveKeyBindings(keyBindings) {
    localStorage.setItem(STORAGE_KEYS.KEYBINDINGS, JSON.stringify(keyBindings));
  }

  /**
   * 获取透明度切换状态
   * @returns {Object} 透明度状态对象 {isFullOpacity, previousOpacity}
   */
  getOpacityState() {
    const data = localStorage.getItem(STORAGE_KEYS.OPACITY_STATE);
    return data ? JSON.parse(data) : { isFullOpacity: false, previousOpacity: null };
  }

  /**
   * 保存透明度切换状态
   * @param {boolean} isFullOpacity - 是否为完全不透明
   * @param {number|null} previousOpacity - 之前的透明度值
   */
  saveOpacityState(isFullOpacity, previousOpacity) {
    localStorage.setItem(STORAGE_KEYS.OPACITY_STATE, JSON.stringify({
      isFullOpacity,
      previousOpacity
    }));
  }
}

// 导出单例
export const storage = new StorageManager();
