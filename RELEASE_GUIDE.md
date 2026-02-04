# 发布指南

## GitHub Actions 自动构建说明

这个项目已经配置了 GitHub Actions 自动构建，可以自动为 Windows 和 macOS 平台构建安装包。

## 如何发布新版本

### 1. 确保代码已推送到 GitHub

```bash
git add .
git commit -m "你的提交信息"
git push
```

### 2. 创建并推送 tag

```bash
# 创建 tag（使用语义化版本号）
git tag -a v1.0.0 -m "Release version 1.0.0"

# 推送 tag 到 GitHub
git push origin v1.0.0
```

### 3. 自动构建开始

推送 tag 后，GitHub Actions 会自动：
- 在 Windows 系统上构建 Windows 版本（.msi 和 .exe）
- 在 macOS 系统上构建 macOS 版本（.dmg 和 .app）
- 创建 GitHub Release
- 自动上传所有安装包到 Release

### 4. 查看构建进度

1. 访问你的 GitHub 仓库
2. 点击顶部的 "Actions" 标签
3. 查看正在运行的工作流

构建通常需要 10-20 分钟。

### 5. 下载发布的安装包

构建完成后：
1. 访问仓库的 "Releases" 页面
2. 找到对应的版本
3. 下载需要的安装包

## 版本号规范

建议使用语义化版本号：`v主版本号.次版本号.修订号`

- `v1.0.0` - 第一个正式版本
- `v1.1.0` - 添加新功能
- `v1.0.1` - 修复 bug
- `v2.0.0` - 重大更新，可能不兼容旧版本

## 注意事项

1. **首次使用**：第一次推送 tag 时，需要确保 GitHub 仓库的 Settings > Actions > General 中启用了 "Read and write permissions"

2. **macOS 安装提示**：由于应用未经过 Apple 公证，macOS 用户首次打开时需要：
   - 右键点击应用
   - 选择"打开"
   - 在弹出的对话框中点击"打开"

3. **修改 Release 说明**：如果需要修改自动生成的 Release 说明，可以编辑 `.github/workflows/release.yml` 文件中的 `releaseBody` 部分

## 本地构建（可选）

如果需要在本地构建：

```bash
# 构建当前平台的版本
npm run tauri build
```

构建产物位于：`src-tauri/target/release/bundle/`
