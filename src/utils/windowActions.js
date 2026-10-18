import { getCurrentWindow } from '@tauri-apps/api/window';

/**
 * 隐藏窗口到系统托盘（任务栏按钮会一并消失）。
 * @returns {Promise<boolean>} 是否隐藏成功
 */
export async function hideToTray() {
  try {
    await getCurrentWindow().hide();
    return true;
  } catch (error) {
    console.error('隐藏窗口失败:', error);
    return false;
  }
}

/**
 * 设置窗口是否置顶。
 * @param {boolean} enabled - 是否置顶
 * @returns {Promise<boolean>} 是否设置成功
 */
export async function setWindowAlwaysOnTop(enabled) {
  try {
    await getCurrentWindow().setAlwaysOnTop(enabled);
    return true;
  } catch (error) {
    console.error('设置窗口置顶失败:', error);
    return false;
  }
}
