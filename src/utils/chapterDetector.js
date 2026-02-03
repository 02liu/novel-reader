import { CHAPTER_PATTERNS } from './constants.js';

/**
 * 从章节标题中提取章节号
 * @param {string} title - 章节标题
 * @returns {number|null} 章节号，如果无法提取则返回 null
 */
export function extractChapterNumber(title) {
  if (!title) return null;

  // 中文数字映射
  const chineseNumbers = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
    '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
    '十': 10, '百': 100, '千': 1000
  };

  // 尝试匹配 "第X章" 格式（阿拉伯数字）
  let match = title.match(/第(\d+)章/);
  if (match) {
    return parseInt(match[1], 10);
  }

  // 尝试匹配 "第X章" 格式（中文数字）
  match = title.match(/第([一二三四五六七八九十百千零]+)章/);
  if (match) {
    return chineseToNumber(match[1], chineseNumbers);
  }

  // 尝试匹配 "Chapter X" 格式
  match = title.match(/Chapter\s+(\d+)/i);
  if (match) {
    return parseInt(match[1], 10);
  }

  // 尝试匹配开头的数字 "1. xxx" 或 "1、xxx" 或 "001 xxx"
  match = title.match(/^(\d+)[\.、\s]/);
  if (match) {
    return parseInt(match[1], 10);
  }

  return null;
}

/**
 * 将中文数字转换为阿拉伯数字
 * @param {string} chinese - 中文数字字符串
 * @param {Object} map - 中文数字映射
 * @returns {number} 阿拉伯数字
 */
function chineseToNumber(chinese, map) {
  if (!chinese) return 0;

  let result = 0;
  let temp = 0;
  let prevUnit = 1;

  for (let i = 0; i < chinese.length; i++) {
    const char = chinese[i];
    const num = map[char];

    if (num === undefined) continue;

    if (num >= 10) {
      // 是单位（十、百、千）
      if (temp === 0) temp = 1;
      temp *= num;
      if (num > prevUnit) {
        result = (result + temp) * num / temp;
        temp = 0;
      }
      prevUnit = num;
    } else {
      // 是数字
      temp = num;
    }
  }

  return result + temp;
}

/**
 * 检测文本中的章节
 * @param {string} content - 小说文本内容
 * @returns {Array} 章节列表 [{title, startIndex, endIndex, content, chapterNum}]
 */
export function detectChapters(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const lines = content.split('\n');
  const chapters = [];
  let currentChapterStart = 0;
  let currentChapterTitle = '开始';

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // 检查是否匹配任何章节模式
    const isChapter = CHAPTER_PATTERNS.some(pattern => pattern.test(trimmedLine));

    if (isChapter && trimmedLine.length > 0 && trimmedLine.length < 50) {
      // 保存上一章节
      if (chapters.length > 0 || currentChapterStart === 0) {
        const chapterContent = lines.slice(currentChapterStart, index).join('\n').trim();
        if (chapterContent.length > 0) {
          const chapterNum = extractChapterNumber(currentChapterTitle);
          chapters.push({
            title: currentChapterTitle,
            startLine: currentChapterStart,
            endLine: index - 1,
            content: chapterContent,
            chapterNum: chapterNum,
          });
        }
      }

      // 开始新章节
      currentChapterStart = index;
      currentChapterTitle = trimmedLine;
    }
  });

  // 添加最后一章
  const lastChapterContent = lines.slice(currentChapterStart).join('\n').trim();
  if (lastChapterContent.length > 0) {
    const chapterNum = extractChapterNumber(currentChapterTitle);
    chapters.push({
      title: currentChapterTitle,
      startLine: currentChapterStart,
      endLine: lines.length - 1,
      content: lastChapterContent,
      chapterNum: chapterNum,
    });
  }

  // 如果没有检测到章节，将整本书作为一章
  if (chapters.length === 0) {
    chapters.push({
      title: '全文',
      startLine: 0,
      endLine: lines.length - 1,
      content: content.trim(),
      chapterNum: null,
    });
  }

  return chapters;
}

/**
 * 获取章节摘要（用于显示章节列表）
 * @param {Array} chapters - 章节列表
 * @returns {Array} 章节摘要 [{index, title, lineCount}]
 */
export function getChapterSummaries(chapters) {
  return chapters.map((chapter, index) => ({
    index,
    title: chapter.title,
    lineCount: chapter.endLine - chapter.startLine + 1,
  }));
}
