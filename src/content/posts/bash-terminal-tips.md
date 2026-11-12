---
title: Bash 终端实用技巧：历史命令、快捷编辑与任务管理
published: 2026-11-12
description: 整理九个常用 Bash 终端技巧，涵盖历史命令搜索、参数复用、目录切换、快捷编辑、花括号展开、前后台任务与命令别名。
image: ''
tags: [Linux, Bash, 终端, 学习笔记]
category: Linux
draft: false
lang: ''
---

把常用的 Bash 操作整理成一份随手查阅的笔记。很多时候，少重复输入一条长命令、少按几次方向键，就能让终端操作顺畅不少。

下面的快捷键以 **Bash 交互式终端的默认 Emacs 编辑模式**为前提。切换到 vi 模式，或被终端软件、自定义配置截获时，按键行为可能不同。

## 1. Ctrl+R：搜索历史命令

记得命令里的一小段内容，却忘了完整写法时，可以按 `Ctrl+R`，再输入关键词：

```text
(reverse-i-search)`ssh': ssh user@robot
```

继续按 `Ctrl+R`，会向更早的历史记录搜索相同关键词。

- 按 `Enter` 执行当前匹配的命令。
- 按右方向键结束搜索，保留命令供继续编辑。
- 按 `Ctrl+G` 取消搜索。

对于参数比较长的 `ssh`、`roslaunch` 或编译命令，这比一直按上方向键方便。

## 2. sudo !!：给上一条命令补上 sudo

上一条命令因为权限不足失败，且确实需要管理员权限时，可以输入：

```bash
sudo !!
```

例如，刚执行过：

```bash
apt update
```

紧接着输入 `sudo !!`，Bash 会将其展开为 `sudo apt update` 再执行。

这里的 `!!` 表示**历史记录中的上一条命令**，并不会自动寻找“上一条失败的命令”。如果中间执行了其他命令，它引用的对象也会改变。执行前应确认上一条是什么。

这是交互式 Bash 的历史展开功能，不适合直接照搬到脚本中。

## 3. Alt+.：复用上一条命令的最后一个参数

假设刚查看了一个很长的目录：

```bash
ls /home/user/projects/wheeltec_robot/src
```

接下来想进入它，可以先输入 `cd `，再按 `Alt+.`。上一条命令的最后一个参数就会插入当前输入行：

```bash
cd /home/user/projects/wheeltec_robot/src
```

连续按 `Alt+.`，还能依次取出更早历史命令的最后一个参数。这里的按键用于编辑输入行，不需要把 `Alt+.` 几个字符打进命令里。

如果终端没有传递 Alt 组合键，可以尝试先按一下 `Esc`，松开后再按 `.`。遇到含空格的路径，检查插入结果的引号或转义是否正确。

## 4. cd -：在最近两个目录之间切换

这两个写法容易混淆：

| 命令 | 作用 |
| --- | --- |
| `cd ~` 或 `cd` | 返回当前用户的主目录 |
| `cd -` | 返回上一次所在的目录 |

例如：

```bash
cd /etc
cd /var/log
cd -
```

最后一条会回到 `/etc`。再次执行 `cd -`，又会回到 `/var/log`，适合来回查看两个目录。

## 5. 快捷移动与删除：少按方向键

编辑一条长命令时，下面几组按键很常用：

| 快捷键 | 作用 |
| --- | --- |
| `Ctrl+A` | 移到行首 |
| `Ctrl+E` | 移到行尾 |
| `Alt+B` | 向前移动一个词 |
| `Alt+F` | 向后移动一个词 |
| `Ctrl+W` | 向前剪切到前一个空白边界 |
| `Alt+Backspace` | 向前剪切一个词，词边界规则与 `Ctrl+W` 不同 |
| `Ctrl+K` | 剪切光标到行尾的内容 |

例如，输入一长串参数后发现命令开头写错了，用 `Ctrl+A` 就能直接回到开头。

这里是 `Alt+Backspace`，即退格键；不要把它和 `Delete` 键混在一起。处理路径时，两种“向前删词”对斜杠等符号的处理也可能不同。

## 6. 花括号展开：一次生成多个参数

花括号可以展开为一组字符串。连续序列使用两个点：

```bash
echo {1..5}
# 输出：1 2 3 4 5

touch file{1..10}.txt
# 创建 file1.txt 到 file10.txt
```

逗号表示列举，不表示连续范围：

```bash
echo file{1,10}.txt
# 输出：file1.txt file10.txt
```

也可以组合前缀和扩展名：

```bash
echo report.{txt,md,pdf}
# 输出：report.txt report.md report.pdf
```

原笔记里的 `rm *.{png,jpg,txt}`，会先展开为 `rm *.png *.jpg *.txt`，再匹配当前目录中的文件。需要批量删除时，可以先用 `ls -d -- *.{png,jpg,txt}` 查看匹配结果，再决定是否删除；某一类没有匹配文件时，默认 Bash 下可能出现找不到文件的提示。

## 7. Ctrl+U 和 Ctrl+Y：临时移开正在输入的命令

命令写到一半，突然想先查一下目录或配置，可以利用 Readline 的剪切与恢复功能：

1. 按 `Ctrl+E` 移到行尾。
2. 按 `Ctrl+U` 剪切光标到行首的内容。
3. 输入并执行需要临时运行的命令。
4. 在新的提示符处按 `Ctrl+Y`，恢复刚才剪切的内容。

先移到行尾，是因为 **`Ctrl+U` 默认只剪切光标之前的部分**，不一定清空整行。

这些内容保存在 Readline 的剪切环中，与系统剪贴板不同。如果中间又进行了其他剪切操作，`Ctrl+Y` 恢复的内容也可能改变。

## 8. Ctrl+Z、bg、fg 和 jobs：管理前后台任务

`Ctrl+Z` 通常会挂起当前前台任务，**挂起后任务暂停执行**。要让它在后台继续运行，还需要 `bg`。

可以用一个简单例子理解：

```bash
sleep 300
```

按 `Ctrl+Z` 后，再输入：

```bash
jobs       # 查看当前 shell 管理的作业及其状态
bg %1      # 让编号为 1 的作业在后台继续运行
fg %1      # 把编号为 1 的作业带回前台
```

`%1` 是作业编号，应以 `jobs` 的实际输出为准。只有一个相关作业时，通常直接输入 `bg` 或 `fg` 即可。

如果一开始就想放到后台运行，可以在命令末尾加 `&`：

```bash
sleep 300 &
```

后台作业仍然可能向当前终端输出内容；需要读取终端输入的程序也可能再次停止。`bg` 和 `&` 本身不保证 SSH 断开后任务继续运行，需要长期运行时再考虑 `tmux` 等会话管理工具。

## 9. alias：给常用命令起一个短名字

例如，把常用的目录查看命令定义为 `ll`：

```bash
alias ll='ls -lah'
```

注意：**别名名称和值之间的等号两边不能有空格**。

这样就可以直接输入：

```bash
ll
```

在当前终端中定义的别名只对当前 shell 有效。要让以后启动的交互式 Bash 也能使用，可以把定义加入 `~/.bashrc`：

```bash
alias ll='ls -lah'
```

保存后，在当前终端重新加载：

```bash
source ~/.bashrc
```

这会重新执行整个配置文件。如果只想立刻启用这一条别名，也可以直接在当前终端执行对应的 `alias` 定义。

查看或移除别名：

```bash
alias ll
unalias ll
```

删除当前 shell 中的别名后，如果不想在下次启动时再次加载，还需要删除 `~/.bashrc` 里对应的定义。

## 参考资料

- [GNU Bash 官方手册](https://www.gnu.org/software/bash/manual/bash.html)：历史展开、目录切换、花括号展开、作业控制与别名。
- [Readline 历史命令操作](https://www.gnu.org/software/bash/manual/html_node/Commands-For-History.html)：`Ctrl+R` 与历史参数复用。
- [Readline 剪切与恢复操作](https://www.gnu.org/software/bash/manual/html_node/Commands-For-Killing.html)：`Ctrl+U`、`Ctrl+W` 和 `Ctrl+Y`。
