---
name: firefly-blog-maintenance
description: 维护本仓库 PuPu-Blog 的 Firefly 主题配置、文章、动态、友链、相册和书签，按官方文档修改并验证；不用于其他仓库的通用网站开发。
---

# PuPu-Blog 维护

所有文件路径相对于仓库根目录。使用当前环境可用的文件、命令和浏览器工具；不依赖 Codex 专用 API 或固定盘符。

## 开始维护

1. 阅读适用的 `AGENTS.md`，检查 `git status`、相关差异及远端。保留用户已做的修改和删除，不自动恢复模板内容。
2. 从 [Firefly 官方文档](https://docs-firefly.cuteleaf.cn/zh/guide/getting-started.html) 查找本次任务的教程，先阅读，再核对当前源码、类型定义和 `package.json`。不要凭旧版本印象修改路径。
3. 优先使用现有配置项。汇报时区分“按官方文档”“源码补充”和“文档与当前版本存在差异”；无教程时明确说明，不能把推测写成文档结论。
4. 用户只要计划或演示做法时，仅调查和说明。获准修改后完成授权范围内的实现与验证；提交、推送和上线按照当次授权执行，不能从普通编辑要求推断发布授权。

## 本站资料与偏好

- 站名：PuPu-Blog；作者：普普；简介：青岛计科硕士在读。
- 网站：https://655700.xyz/；GitHub：https://github.com/PuPuSama；仓库：https://github.com/PuPuSama/MyBlog。
- 邮箱：pupusama0@gmail.com；头像为 GitHub 头像的本地副本 `src/assets/images/avatar.jpg`；需要更新时先核实 GitHub 账号及图片实际格式。
- 标签页图标：`public/favicon/Coco.svg`；配置路径为 `/favicon/Coco.svg`；同目录 `Coco.png` 是为 OpenGraph 和 Apple touch icon 保留的 PNG 版本，更换图标时一起更新。
- 副标题和个人签名暂留空，不代写尚未确定的口号。
- 默认壁纸保留；背景视频播放关闭，不保留视频地址。音乐使用 Meting 网易云歌单 `18551356303`，本地示例音乐暂保留但不参与在线模式播放。导航栏 Logo 暂保持原样。
- 动态、友链、相册、书签功能保留；没有用户内容时应展示空状态。书签已添加“社区”分类及 `https://linux.do/`，不将用户新增内容当作模板示例清理。
- 项目页和打赏页目前关闭。以上是当前配置基线，后续用户要求优先；执行前仍要读取真实文件。
- GitHub Pages 部署工作流已移除；`.github/workflows/` 保留构建检查和代码质量检查，不自动向 GitHub Pages 部署。

## 配置与文档入口

以下链接均位于官方文档 `https://docs-firefly.cuteleaf.cn/zh/guide/`：

| 任务 | 文件 | 对应文档 |
| --- | --- | --- |
| 站名、描述、图标、页面开关 | `src/config/siteConfig.ts` | [site.html](https://docs-firefly.cuteleaf.cn/zh/guide/site.html) |
| 头像、作者名、签名、社交链接 | `src/config/profileConfig.ts` | [profile.html](https://docs-firefly.cuteleaf.cn/zh/guide/profile.html) |
| 导航入口 | `src/config/navBarConfig.ts` | [navbar.html](https://docs-firefly.cuteleaf.cn/zh/guide/navbar.html) |
| 壁纸、视频、首页横幅文字和链接 | `src/config/backgroundWallpaper.ts` | [wallpaper.html](https://docs-firefly.cuteleaf.cn/zh/guide/wallpaper.html) |
| 文章 | `src/content/posts/` | [writing.html](https://docs-firefly.cuteleaf.cn/zh/guide/writing.html) |
| 动态 | `src/content/dynamic/`、`src/config/dynamicConfig.ts` | [dynamic.html](https://docs-firefly.cuteleaf.cn/zh/guide/dynamic.html) |
| 友链及本站申请资料 | `src/config/friendsConfig.ts`、`src/content/spec/friends.mdx` | [friends.html](https://docs-firefly.cuteleaf.cn/zh/guide/friends.html) |
| 相册 | `src/config/galleryConfig.ts`、`public/gallery/{id}/` | [gallery.html](https://docs-firefly.cuteleaf.cn/zh/guide/gallery.html) |
| 书签导航 | `src/config/booknavConfig.ts` | [booknav.html](https://docs-firefly.cuteleaf.cn/zh/guide/booknav.html) |
| 项目 | `src/content/projects/` | [projects.html](https://docs-firefly.cuteleaf.cn/zh/guide/projects.html) |
| 打赏 | `src/config/sponsorConfig.ts` | [sponsor.html](https://docs-firefly.cuteleaf.cn/zh/guide/sponsor.html) |
| 公告、页脚 | `src/config/announcementConfig.ts`、`src/config/FooterConfig.html` | [announcement.html](https://docs-firefly.cuteleaf.cn/zh/guide/announcement.html)、[footer.html](https://docs-firefly.cuteleaf.cn/zh/guide/footer.html) |

关于页正文在 `src/content/spec/about.md`。写文章时读取 `src/content.config.ts` 和新建脚本；草稿/发布状态遵循当次请求，不虚构作者经历或实验结果。

## 容易遗漏的联动

- `pages.<key>` 控制页面与预设导航入口。`PUBLIC_PAGES_<KEY>` 环境变量可覆盖文件配置；检查部署配置是否有覆盖，不输出凭据。
- 首页横幅的 `homeText.links` 是独立链接列表，不自动遵循打赏页面开关。关闭打赏时同时检查自定义链接；不要改坏壁纸、视频或音乐。
- GitHub 仓库赞助按钮来自 `.github/FUNDING.yml`，与网站打赏页开关不同。
- `public` 内资源使用以 `/` 开头的 URL，不带 `public` 或本地盘符；大小写必须一致。GitHub 头像快照不会自动随账号头像变化。
- 删除内容前列出目标并核对归属与引用。文章、动态、项目各自管理；相册元信息与照片目录同时核对。共享图片、默认壁纸、音乐、许可证及主题署名不随示例删除。
- 空集合目录用 `.gitkeep` 保留。不要为了让页面有内容而创建测试文章或虚构动态。
- 不对 `Firefly`、`CuteLeaf` 做全局替换：主题来源、官方文档链接和许可证应保留。

## 验证与交付

- 使用 pnpm；遵循 `package.json` 指定版本，已有依赖可用时不重复安装，不混用锁文件。
- 内容、配置或渲染变更按仓库要求运行 `pnpm check`、`pnpm type-check`、`pnpm build`。失败时分清改动引入的问题、既有问题与环境问题；不要为了通过检查而隐藏诊断或关闭功能。
- 视觉和交互变更用开发或生产预览检查。搜索索引应使用生产构建验证；检查无文章时首页和归档，以及动态、友链、相册、书签空状态，亮暗模式和移动端。
- 审查构建改动的 `src/constants/lqips.json` 等生成文件。只在实际出现陈旧内容症状且确认生成缓存路径后清理对应缓存，不常规删除整个依赖目录。
- 交付说明实际改动、文档依据、通过/未通过的检查及限制。推送成功不等于线上部署成功；未经验证不宣称上线。
- 用户重视文件整洁：不增加无必要的脚本、报告或重复备份。临时文件集中存放，结束后清理本次可确认归属的临时文件与测试进程，保留正式产物和运行所需依赖。
