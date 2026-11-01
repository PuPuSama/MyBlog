# PuPu-Blog

普普的个人博客，记录学习与生活。

- 网站：<https://655700.xyz/>
- 作者：普普，青岛计科硕士在读
- GitHub：<https://github.com/PuPuSama>
- 邮箱：<pupusama0@gmail.com>

## 本地运行

使用项目 `package.json` 指定的 Node.js 和 pnpm 版本：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## 检查与构建

```sh
pnpm check
pnpm type-check
pnpm build
pnpm preview
```

## 内容与配置

- 站点信息：`src/config/siteConfig.ts`
- 作者资料：`src/config/profileConfig.ts`
- 博客文章：`src/content/posts/`，通过 `pnpm new-post <name>` 创建
- 动态：`src/content/dynamic/`，通过 `pnpm new-dynamic` 创建
- 关于页：`src/content/spec/about.md`
- 友链：`src/config/friendsConfig.ts`
- 相册：`src/config/galleryConfig.ts`，照片放在 `public/gallery/{id}/`
- 书签：`src/config/booknavConfig.ts`

动态、友链、相册页保留，目前暂无内容。书签页已添加“社区 → LINUX DO”。项目页与打赏页关闭。默认壁纸保留，背景视频关闭；音乐使用网易云歌单 `18551356303`，通过 Meting API 加载。

## 维护指南

修改文件前先查阅 [Firefly 官方文档](https://docs-firefly.cuteleaf.cn/zh/guide/getting-started.html)，并核对当前源码。

仓库维护 skill：[skills/firefly-blog-maintenance/SKILL.md](skills/firefly-blog-maintenance/SKILL.md)。Codex、Hermes 或其他代理可先读取该文件，再执行维护任务；自动加载方式取决于各工具的配置。

## 主题与许可

使用 [Astro](https://astro.build/) 和 [Firefly](https://github.com/CuteLeaf/Firefly)；Firefly 基于 [Fuwari](https://github.com/saicaca/fuwari)。保留主题署名与原始 [LICENSE](LICENSE)。
