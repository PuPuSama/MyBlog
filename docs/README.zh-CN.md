# 🍥Fuwari

基于 [Astro](https://astro.build) 开发的静态博客模板。

[**🖥️在线预览（Vercel）**](https://fuwari.vercel.app)

![Preview Image](https://raw.githubusercontent.com/saicaca/resource/main/fuwari/home.png)

## ✨ 功能特性

- [x] 基于 Astro 和 Tailwind CSS 开发
- [x] 流畅的动画和页面过渡
- [x] 亮色 / 暗色模式
- [x] 自定义主题色和横幅图片
- [x] 响应式设计
- [ ] 评论
- [x] 搜索
- [x] 文内目录

## 👀 要求

- 本项目已使用 Node.js 24.15.0、pnpm 11.25.0 完成安装和生产构建，无需另装旧版。
- 保留模板的项目依赖及 `pnpm-lock.yaml`，统一使用 pnpm；项目依赖安装在 `node_modules`，不全局安装 Astro。

## Cloudflare Pages 部署

站点地址已配置为 `https://655700.xyz/`，界面语言为简体中文。标题、头像、个人简介及示例文章仍是模板内容，可在 `src/config.ts` 和 `src/content/` 中修改。

1. 本项目使用仓库 `https://github.com/PuPuSama/MyBlog` 的 `master` 分支，当前文件已由 Fuwari 完整替换原有 Hugo 博客；原有版本仅保留在 Git 历史中。
2. 在 Cloudflare 的 **Workers & Pages → Create application → Pages** 中导入该仓库。
3. 设置生产分支为 `master`，构建命令为 `pnpm build`，输出目录为 `dist`，根目录保持默认。
4. 设置构建环境变量 `PNPM_VERSION=11.25.0`。Node.js 版本由根目录 `.node-version` 指定为 `24.15.0`；生产和预览环境均使用这套版本。
5. 部署成功后，在 Pages 项目的 **Custom domains** 中添加 `655700.xyz`，按提示完成 DNS 和证书设置。

本项目输出静态文件，无需安装 Cloudflare 适配器或 Wrangler。日常本地预览运行 `pnpm dev`；提交前运行 `pnpm build`，会同时生成 Pagefind 搜索索引。不要提交 `node_modules`、`.astro` 或 `dist`。

部署配置参考 [Cloudflare Astro 指南](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)及[构建环境文档](https://developers.cloudflare.com/pages/configuration/build-image/)。

## 🚀 使用方法 1

使用 [create-fuwari](https://github.com/L4Ph/create-fuwari) 在本地初始化项目。

```sh
# npm
npm create fuwari@latest

# yarn
yarn create fuwari

# pnpm
pnpm create fuwari@latest

# bun
bun create fuwari@latest

# deno
deno run -A npm:create-fuwari@latest
```

1. 通过配置文件 `src/config.ts` 自定义博客
2. 执行 `pnpm new-post <filename>` 创建新文章，并在 `src/content/posts/` 目录中编辑
3. 参考[官方指南](https://docs.astro.build/zh-cn/guides/deploy/)将博客部署至 Vercel, Netlify, GitHub Pages 等；部署前需编辑 `astro.config.mjs` 中的站点设置。

## 🚀 使用方法 2

1. 使用此模板[生成新仓库](https://github.com/saicaca/fuwari/generate)或 Fork 此仓库
2. 进行本地开发，Clone 新的仓库，执行 `pnpm install` 和 `pnpm add sharp` 以安装依赖  
   - 若未安装 [pnpm](https://pnpm.io)，执行 `npm install -g pnpm`
3. 通过配置文件 `src/config.ts` 自定义博客
4. 执行 `pnpm new-post <filename>` 创建新文章，并在 `src/content/posts/` 目录中编辑
5. 参考[官方指南](https://docs.astro.build/zh-cn/guides/deploy/)将博客部署至 Vercel, Netlify, GitHub Pages 等；部署前需编辑 `astro.config.mjs` 中的站点设置。

## ⚙️ 文章 Frontmatter

```yaml
---
title: My First Blog Post
published: 2023-09-09
description: This is the first post of my new Astro blog.
image: ./cover.jpg
tags: [Foo, Bar]
category: Front-end
draft: false
lang: jp      # 仅当文章语言与 `config.ts` 中的网站语言不同时需要设置
---
```

## 🧞 指令

下列指令均需要在项目根目录执行：

| Command                           | Action                            |
|:----------------------------------|:----------------------------------|
| `pnpm install` 并 `pnpm add sharp` | 安装依赖                              |
| `pnpm dev`                        | 在 `localhost:4321` 启动本地开发服务器      |
| `pnpm build`                      | 构建网站至 `./dist/`                   |
| `pnpm preview`                    | 本地预览已构建的网站                        |
| `pnpm new-post <filename>`        | 创建新文章                             |
| `pnpm astro ...`                  | 执行 `astro add`, `astro check` 等指令 |
| `pnpm astro --help`               | 显示 Astro CLI 帮助                   |
