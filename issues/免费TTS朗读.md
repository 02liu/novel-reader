# 免费 TTS 朗读改造

## 目标

在现有透明小说阅读器基础上增加免费、无需 API Key 的 Windows TTS 朗读能力，并保留老板键、透明度、章节切换和阅读进度功能。

## 技术方案

第一阶段使用 WebView2 提供的 Web Speech API（`window.speechSynthesis` / `SpeechSynthesisUtterance`），优先使用 Windows 已安装的中文语音。该方案不引入付费 API，也不增加额外运行时依赖。

## 功能范围

- 枚举系统可用语音并优先展示中文语音
- 当前章节按中文标点切句
- 播放 / 暂停 / 继续 / 停止
- 上一句 / 下一句
- 语速与音量设置
- 章节朗读结束后可自动进入下一章继续朗读
- 切章、返回书架、关闭阅读器时安全停止朗读
- 增加 TTS 快捷键并支持用户自定义
- TTS 设置使用现有 localStorage 设置体系持久化

## 修改文件

- `src/utils/tts.js`
- `src/utils/constants.js`
- `src/components/SettingsPanel.vue`
- `src/components/KeyBindingsPanel.vue`
- `src/views/Reader.vue`

## 默认快捷键

- F7：上一句
- F8：下一句
- F9：播放 / 暂停 / 继续
- F10：停止

## 验证项

1. TXT 小说正常导入并读取章节
2. 能枚举 Windows/WebView2 可用语音
3. 播放、暂停、继续、停止工作正常
4. 上一句、下一句可跳转
5. 语速、音量、音色修改后生效
6. 章节结束可自动进入下一章
7. 手动切章时不会继续朗读旧章节
8. 老板键/透明模式不影响 TTS 状态
9. 返回书架或关闭阅读器时停止朗读
10. 重启应用后 TTS 设置保留
