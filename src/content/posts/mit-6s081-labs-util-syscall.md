---
title: MIT 6.S081 学习复盘：Lab 1（Util）与 Lab 2（Syscall）
published: 2026-11-26
description: 复盘 xv6-riscv 前两个实验，梳理用户态工具、进程与管道、系统调用陷入流程、进程追踪和跨页表数据复制。
image: ''
tags: [MIT 6.S081, xv6, 操作系统, C语言]
category: 操作系统
draft: false
lang: ''
---
最近完整复盘了 MIT 6.S081 的前两个实验。如果说 **Lab 1 (`util`)** 是在用户态亲手体会 Unix 的“一切皆文件”与多进程协作，那么 **Lab 2 (`syscall`)** 就是第一次推开内核大门，看清一条指令如何跨越特权级边界、在用户态与内核态之间安全搬运数据。

这篇笔记把这两个 Lab 的核心原理、容易混淆的底层概念，以及自己写代码时踩过的真实坑点全部整理出来，方便后续回顾。

---

## 一、Lab 1 (`util`)：在用户态摸清 Unix 哲学

Lab 1 一共包含 `sleep`、`pingpong`、`primes`、`find`、`xargs` 五个用户态工具，核心围绕 **进程生命周期（`fork`/`exec`/`wait`/`exit`）**、**管道与文件描述符**、以及 **文件系统遍历** 展开。

### 1. `find`：以 `ls.c` 为模板改造目录递归

在 xv6 中，**目录本质上也是文件**——普通文件的数据块存文本或二进制，而目录文件的数据块里连续存着一个个 16 字节的 `struct dirent`（2 字节 `inum` + 14 字节 `name`）。

`find` 的代码骨架完全脱胎于 `user/ls.c`，但在细节上有几处关键分叉：

| 对比维度 | `user/ls.c`（单层列出信息） | `user/find.c`（递归按名查找） |
| --- | --- | --- |
| **`fmtname()`** | 截取纯文件名后，用空格补齐到 14 字节（为了终端排版对齐） | **绝不补空格**，直接 `return p`，否则 `strcmp` 精确匹配会失败 |
| **遇到 `T_FILE**` | 直接打印文件元数据 | 用 `fmtname(path)` 抠出纯文件名比对，匹配才打印完整 `path` |
| **遇到 `.` 和 `..**` | 照常打印 | 必须 `continue` 跳过，否则无限递归自己和父目录 |
| **遍历深度** | 只读当前一层 | 判断子项是 `T_DIR` 后，拿拼接好的完整路径 `buf` 递归调用 `find` |
| **`stat` 变量** | 复用外层 `st` | 循环内必须新开 `struct stat sub_st`，防止覆盖外层当前目录的 `st` |

**几个容易迷糊的底层点：**

* **`fmtname` 找不到 `'/'` 为什么不会越界？** 循环 `for(p = path + strlen(path); p >= path && *p != '/'; p--)` 在遇到纯文件名（如 `"README"`）时会一直退到 `path - 1` 才终止，紧接着一句 `p++` 刚好把它拉回开头 `path`。


* **`p[DIRSIZ] = 0;` 没有移动指针 `p**`：它等价于 `*(p + 14) = '\0'`，只是站在 `p` 的位置往后第 14 格写一个结束符。`p` 本身始终停在 `'/'` 后面，这样下一轮循环 `memmove(p, de.name, DIRSIZ)` 才能原地覆盖旧文件名。
* **`stat` 与 `fstat` 的本质区别**：`fstat(fd, &st)` 是真正的系统调用（传已打开的 `fd`），而 `stat(path, &st)` 只是 `user/ulib.c` 里的用户态封装（内部顺手做了 `open` + `fstat` + `close`）。它们返回的 `struct stat` 也不是完整的内核 `inode`，而是内核提炼出来的 5 项安全元数据摘要。



**自己踩过的坑：**

* 遇到 `T_FILE` 时如果直接 `break`，会导致 `find README README` 这种直接传文件名的命令查不到结果。


* `de.name` 定长 14 字节，满长时末尾没有 `'\0'`，不能直接拿去 `strcmp(filename, de.name)`，必须拿已经补好 `p[DIRSIZ] = 0` 的 `p` 来比对。


* 缓冲区保护 `strlen(path) + 1 + DIRSIZ + 1 > sizeof buf` 里两个 `+ 1` 分别对应路径分隔符 `'/'` 和末尾的 `'\0'`。

### 2. `xargs`：标准输入重定向与状态机切词

以 `echo "file1 file2" | xargs rm -f` 为例，`xargs` 的本质是把“命令行固定参数”和“标准输入流里的动态行”拼成新的 `new_argv`，再 `fork` + `exec` 执行。

* **为什么读 `fd = 0` 就能读到管道内容？** `0` 是标准输入（stdin），Shell 在处理 `|` 时会自动把上游 `echo` 的输出口（`1`）和下游 `xargs` 的输入口（`0`）接到同一根管道上。
* **为什么拷贝参数从 `i = 1` 开始？** 因为 `argv[0]` 是 `"xargs"` 自身，我们真正要执行的是从 `argv[1]` 开始的命令（`rm -f`）。


* **为什么触发条件写成 `(c == '\n' && n == 1) || (n == 0 && len > 0)`？** 前半段处理常规换行；后半段专门兜底 **EOF 时末尾没有换行符** 的情况（比如 `echo -n` 或终端直接按 `Ctrl+D`），防止最后一行残留在 `buf` 里被丢弃。


* **`in_word` 状态机与末尾封口**：遍历 `buf` 时遇到单词后的空格就原地改成 `'\0'` 截断，连续空格直接跳过，遇到新单词首字母就把 `&buf[i]` 塞进 `new_argv`。切完词后必须补上 `new_argv[new_argc] = 0;`（注意这里是 **`NULL` 空指针**，不是字符 `'\0'`，用来告诉 `exec` 参数列表到头了）。


* **多行重置**：父进程 `wait(0)` 等子进程跑完后，把 `new_argc` 重置为 `base_argc`（保留 `rm -f` 前缀）并把 `len` 归零，准备处理下一行。



---

## 二、Lab 2 (`syscall`)：打通用户态到内核态的“高速通道”

Lab 2 包含 `trace` 和 `sysinfo` 两个任务，核心是理解 RISC-V 下系统调用的完整生命周期。

### 1. 系统调用全链路：从 `ecall` 到 `syscall()`

用户态受特权级隔离保护，不能直接调用内核函数，必须走一条固定的接力链路：

```text
1. [用户态]     调用 trace(mask) / sysinfo(&info) —— 参数按约定放进 a0~a5
2. [汇编存根]   user/usys.S（由 usys.pl 生成）：li a7, SYS_xxx -> ecall
3. [硬件陷入]   U-Mode 切 S-Mode，跳入 trampoline.S (uservec)
                保存全部 32 个用户寄存器到 p->trapframe，切内核栈与内核页表
4. [内核总入口] trap.c (usertrap) 检查 r_scause() == 8，epc += 4，调用 syscall()
5. [总分发器]   syscall.c (syscall)：读 p->trapframe->a7，查表执行 syscalls[num]()，
                返回值写入 p->trapframe->a0，最后经 userret + sret 返回用户态

```



这里涉及的寄存器分工非常清晰：

* **`a7`**：存放系统调用编号（类似点单号，内核靠它查白名单表 `syscalls[]`，既安全又解耦）。


* **`a0` ~ `a5**`：存放传入的参数（内核通过 `argint(n, ...)`、`argaddr(n, ...)` 按下标 `0`、`1`、`2` 提取）。


* **`a0`（返回时）**：存放系统调用的返回值（如成功 `0`，失败 `-1`）。



### 2. Task 1：`trace` — 进程控制块生命周期与总路口拦截

* **为什么要把 `mask` 放在 `struct proc` 里？** `struct proc` 是内核里的进程控制块（PCB），围绕它的生命周期有三处关键点：
* `allocproc()` 中必须清零 `p->mask = 0`（系统只有 64 个进程槽位 `proc[NPROC]`，会被循环复用，不清零会残留脏掩码）。
* `fork()` 中必须写 `np->mask = p->mask`，让子进程继承父进程的追踪设置。


* `exec()` 不需要任何改动——`exec` 只会替换用户态的代码段、数据段和栈，**不会更换 `struct proc` 和 PID**，所以 `trace 32 grep ...` 变成 `grep` 后依然带着 `mask = 32`。




* **为什么打印不能写在 `sys_trace()` 里？** `sys_trace()` 只在用户调用 `trace(mask)` 时执行一次，它的职责仅仅是“开开关”（把掩码存进 `p->mask`）；后续所有系统调用都会流经 `kernel/syscall.c` 的 `syscall()` 总路口，必须在 `p->trapframe->a0 = syscalls[num]();` **执行之后**拦截，才能同时拿到返回值并打印。


* **位运算与名字表**：用 `(p->mask >> num) & 1` 检查第 `num` 位是否命中；因为 `syscalls[]` 里存的是函数地址（机器码入口）而不是字符串，所以必须配一张下标一一对应的 `static char *syscall_names[]` 来打印可读的函数名。



### 3. Task 2：`sysinfo` — 跨页表通信与内核锁

* **`argaddr(0, &addr)` 没有解引用 `a0**`：用户调用 `sysinfo(&info)` 时，`a0` 里装的只是一个 64 位纯数字（用户虚拟地址）；`argaddr(0, &addr)` 只是把这个数值原封不动地拷贝给内核变量 `addr`。


* **收集系统状态与加锁防并发**：
* **空闲内存（`kernel/kalloc.c`）**：加 `acquire(&kmem.lock)` 后遍历空闲物理页链表 `kmem.freelist`，最后乘以 **`PGSIZE`（4096 字节，不是 1024）**。
* **活跃进程数（`kernel/proc.c`）**：遍历 `proc[NPROC]`，加 `acquire(&p->lock)` 统计 `p->state != UNUSED` 的进程个数。


* **为什么必须用 `copyout()`，而不能直接写 `*(struct sysinfo *)addr = s;` 或写回 `a0`？**
* `a0` 在返回时只负责传递状态码（`0` / `-1`），装不下结构体。


* 更核心的是**页表隔离**：内核运行在内核页表下，根本没有映射用户虚拟地址 `addr`，直接解引用会立刻触发 Page Fault 崩溃。必须调用 `copyout(p->pagetable, addr, (char *)&s, sizeof(s))`，由内核软件查用户页表（`walkaddr`）翻译出物理地址，再逐页 `memmove` 拷过去。





---

## 三、顺手补齐的 C 语言底层内功

做完前两个 Lab，连带着把几个平时容易模糊的 C 语言细节也彻底捋顺了：

* **`sizeof` 是运算符不是函数**：对变量名使用时括号可省略（`sizeof buf` 等价于 `sizeof(buf)`），只有对类型名使用时才必须加括号。
* **函数指针数组 + C99 指定初始化器**：`static uint64 (*syscalls[])(void)` 不是枚举，而是装满函数地址的静态数组；配合 `[SYS_fork] = sys_fork`，用系统调用号直接做下标，实现 $O(1)$ 分发。


* **`myproc()` 不是创建结构体**：它只是返回当前 CPU 正在运行的 `struct proc` 指针（进程槽位在开机时就静态分配在全局数组 `proc[NPROC]` 里了）。


* **链表遍历的一级指针 vs 二级指针**：`struct run *r = kmem.freelist;` 只是复印了头节点地址，后移 `r` 不会动原表头（适合 `count_free_mem` 这种只读统计）；如果真的想在子函数里挪动外部的 `kmem.freelist` 本尊，就必须传它的地址，用二级指针 `struct run **p = &kmem.freelist;` 来修改 `*p = (*p)->next`。

前两个 Lab 算是把用户态工具和系统调用的脉络彻底打通了。而 Lab 2 结尾留下的 `copyin`/`copyout` 每次都要软件查页表的痛点，正好无缝衔接到接下来的 **Lab 3 (`pgtbl`)**——亲手折腾 Sv39 三级页表和独立内核页表。

