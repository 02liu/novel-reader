/**
 * 读取文件内容
 * @param {File} file - 文件对象
 * @returns {Promise<string>} 文件内容
 */
export async function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      let content = e.target.result;

      // 尝试检测编码并转换
      content = detectAndConvertEncoding(content);

      resolve(content);
    };

    reader.onerror = (e) => {
      reject(new Error('文件读取失败'));
    };

    // 先尝试以UTF-8读取
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * 检测并转换编码
 * @param {string} content - 原始内容
 * @returns {string} 转换后的内容
 */
function detectAndConvertEncoding(content) {
  // 检查是否有乱码（简单检测）
  const hasGarbledText = /[�\uFFFD]/.test(content);

  if (hasGarbledText) {
    console.warn('检测到可能的编码问题，建议使用GBK编码重新读取');
  }

  return content;
}

/**
 * 从Tauri读取文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} 文件内容
 */
export async function readFileFromPath(filePath) {
  try {
    const { readTextFile } = await import('@tauri-apps/plugin-fs');
    const content = await readTextFile(filePath);
    return content;
  } catch (error) {
    console.error('读取文件失败:', error);
    throw error;
  }
}

/**
 * 打开文件选择对话框并保存到应用数据目录
 * @returns {Promise<{path: string, content: string, name: string}>}
 */
export async function openFileDialog() {
  try {
    console.log('开始导入文件...');

    const { open } = await import('@tauri-apps/plugin-dialog');
    const { readTextFile, writeTextFile, exists, mkdir } = await import('@tauri-apps/plugin-fs');
    const { appDataDir, join } = await import('@tauri-apps/api/path');

    console.log('插件加载成功，打开文件对话框...');

    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Text',
        extensions: ['txt']
      }]
    });

    console.log('选择的文件:', selected);

    if (!selected) {
      throw new Error('未选择文件');
    }

    console.log('开始读取文件内容...');
    const content = await readTextFile(selected);
    console.log('文件读取成功，大小:', content.length, '字符');

    // 获取文件名
    const originalName = selected.split(/[/\\]/).pop();
    const name = originalName.replace('.txt', '');

    // 获取应用数据目录
    const dataDir = await appDataDir();
    const booksDir = await join(dataDir, 'books');

    // 确保 books 目录存在
    const booksDirExists = await exists(booksDir);
    if (!booksDirExists) {
      console.log('创建 books 目录:', booksDir);
      await mkdir(booksDir, { recursive: true });
    }

    // 生成唯一的文件名（使用时间戳）
    const timestamp = Date.now();
    const savedFileName = `${timestamp}_${originalName}`;
    const savedPath = await join(booksDir, savedFileName);

    // 将文件内容写入应用数据目录
    console.log('保存文件到:', savedPath);
    await writeTextFile(savedPath, content);
    console.log('文件保存成功');

    return {
      path: savedPath,
      content,
      name
    };
  } catch (error) {
    console.error('打开文件失败，详细错误:', error);
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    throw error;
  }
}

/**
 * 打开文件夹选择对话框
 * @returns {Promise<string>} 选择的文件夹路径
 */
export async function openFolderDialog() {
  try {
    const { open } = await import('@tauri-apps/plugin-dialog');

    const selected = await open({
      directory: true,
      multiple: false,
    });

    if (!selected) {
      throw new Error('未选择文件夹');
    }

    return selected;
  } catch (error) {
    console.error('打开文件夹失败:', error);
    throw error;
  }
}

/**
 * 解析书籍信息
 * @param {string} content - 书籍内容
 * @param {string} fileName - 文件名
 * @returns {Object} 书籍信息
 */
export function parseBookInfo(content, fileName) {
  const lines = content.split('\n').filter(line => line.trim());
  const wordCount = content.length;

  return {
    title: fileName,
    wordCount,
    lineCount: lines.length,
    addedAt: Date.now(),
  };
}
