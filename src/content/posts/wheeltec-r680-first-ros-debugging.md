---
title: 从零上手 WHEELTEC R680：我的第一次 ROS 机器人实机调试
published: 2026-11-02
description: 记录从环境搭建、远程连接到 ROS 底盘控制、RViz 可视化、Gmapping 建图和深度相机调试的完整过程，以及踩过的坑。
tags:
  - ROS
  - Jetson
  - SLAM
  - 机器人
  - 学习笔记
category: 机器人开发
draft: false
---

最近开始接触实验室的一台 **WHEELTEC R680 ROS 大型科研机器人**。

之前虽然学过一些 Linux、C++、STM32，但真正接触 ROS 机器人还是第一次。刚开始的时候，我连应该在 Windows 上安装 VMware，还是使用 WSL2 都拿不准，更不用说什么 TF、里程计、SLAM 和自主导航了。

经过一番折腾，目前总算把小车的底盘控制、激光雷达、RViz、Gmapping 建图以及 Astra 深度相机跑通了。

趁着还没忘记，记录一下这次从零摸索的过程，以及过程中学到的东西。

## 一、先搞清楚手里到底是什么设备

最开始，我知道这是一台 R680 ROS 小车，但并不清楚它内部运行的是什么系统。

通过 SSH 登录机器人：

```bash
ssh wheeltec@192.168.0.100
```

然后检查系统和 ROS 版本：

```bash
lsb_release -a
ls /opt/ros
echo $ROS_DISTRO
```

发现车上安装的是：

- Ubuntu 18.04.5 LTS
- ROS1 Melodic

继续查看硬件：

```bash
uname -m
cat /proc/device-tree/model
cat /etc/nv_tegra_release
free -h
lsblk
```

最终确定了机器人的核心配置。

| 硬件或软件 | 配置 |
|---|---|
| 机器人 | WHEELTEC R680 |
| 主控 | NVIDIA Jetson Xavier NX Developer Kit |
| CPU 架构 | ARM64 |
| 内存 | 8GB |
| 系统硬盘 | 128GB NVMe SSD |
| JetPack | 4.5 |
| Ubuntu | 18.04 |
| ROS | Melodic |
| 底盘控制 | STM32 |
| 激光雷达 | RPLIDAR |
| 深度相机 | Orbbec Astra S |

这里才逐渐理解，原来这台机器人并不是一个需要始终连接电脑的普通单片机小车。

**Jetson 本身就是一台 Linux 计算机，运行 ROS 和上层算法；STM32 则负责底层电机控制等工作。**

大致的数据流是：

```text
上层算法 / 键盘控制
        ↓
   ROS /cmd_vel
        ↓
wheeltec_robot_node
        ↓
     USB 串口
        ↓
    STM32 控制板
        ↓
       电机
```

这样的分层架构，对我这个之前学过 STM32 的人来说还挺有意思的。

## 二、纠结了半天 VMware、WSL2，最后发现 VNC 就够了

一开始，我一直在考虑应该怎么搭建 ROS 开发环境。

研究过 WSL2 和 VMware，还专门找了 VMware Workstation Pro 的下载地址，结果 Broadcom 账号一直提示验证未完成。

后来突然想到一个问题：

**既然 Jetson 本身已经装了 Ubuntu 和 ROS，我为什么一定要在 Windows 上再安装一套 Ubuntu？**

如果只是想操作小车的桌面、运行 RViz、查看雷达和相机画面，直接远程桌面不就行了吗？

于是开始研究 VNC。

在 Jetson 上检查：

```bash
pgrep -af 'vino|x11vnc|Xtigervnc'
ss -lnt | grep 5900
```

发现厂家系统竟然已经运行了 `vino-server`，而且 TCP 5900 端口正在监听。

于是直接在 Windows 上下载 TigerVNC Viewer，连接：

```text
192.168.0.100::5900
```

成功进入了 Jetson 的 Ubuntu 桌面。

### 第一个坑：VNC 画面只有 640×480

虽然连接成功，但整个 Ubuntu 桌面小得可怜，窗口都显示不完整。

执行：

```bash
xrandr
```

发现 HDMI 和 DP 均未连接显示器，桌面分辨率只有 640×480。

原因是 Jetson 没有接实体显示器，图形环境默认使用了很低的分辨率。

后来研究了 NVIDIA 的 Xorg 配置，尝试为无显示器环境设置虚拟桌面分辨率。

这也让我第一次意识到：

**VNC 只是把远程桌面的画面传过来，它并不会自动帮服务器创建一个高分辨率显示器。**

目前我的开发方式也逐渐明确了：

```text
Windows
├── PowerShell / SSH：执行 ROS 命令
├── TigerVNC：操作 Ubuntu 图形桌面
└── VS Code + Codex：后续源码开发
           │
           ▼
     Jetson Xavier NX
     Ubuntu + ROS Melodic
           │
           ▼
       STM32 底盘
```

至少在当前阶段，这套方案比重新折腾一台虚拟机简单得多。

## 三、第一次遇到 ROS Master 连接失败

刚开始运行：

```bash
rostopic list
```

结果直接报错：

```text
ERROR: Unable to communicate with master!
```

当时还以为是不是机器人网络配置有问题。

查看环境变量：

```bash
echo $ROS_MASTER_URI
```

得到：

```text
http://192.168.0.100:11311
```

再查看小车 IP，发现也是 `192.168.0.100`。

最后发现其实是 **ROS Master 没有运行**。

启动：

```bash
roscore
```

再运行：

```bash
rostopic list
```

成功显示：

```text
/rosout
/rosout_agg
```

第一次真正理解了 ROS1 中 Master 的作用。

Master 主要负责节点注册与发现，并不是所有 Topic 消息都必须经过 Master 转发。

后来学习 ROS2 时，也发现它与 ROS1 的一个重要区别就是 ROS2 不再需要 `roscore`，而是通过 DDS 等中间件完成分布式发现。

## 四、终于让小车动起来了

厂家提供的底盘启动命令是：

```bash
roslaunch turn_on_wheeltec_robot turn_on_wheeltec_robot.launch
```

然后使用键盘控制：

```bash
roslaunch wheeltec_robot_rc keyboard_teleop.launch
```

第一次按下前进键，小车真的动起来了。

虽然只是简单的前进、后退和转向，但相比单纯看代码，看到真实的机器人响应指令还是挺有成就感的。

后来又研究了它的串口配置：

```text
/dev/wheeltec_controller
```

通过 `readlink` 发现，这个设备实际指向：

```text
/dev/ttyUSB1
```

原来厂家通过 udev 规则，为 STM32 串口设备创建了固定名称。

这样即使下次重启系统，设备从 `ttyUSB1` 变成 `ttyUSB0`，程序也不需要跟着修改串口路径。

底盘通信波特率是 **115200**，核心源码位于：

```text
~/wheeltec_robot/src/turn_on_wheeltec_robot/src/wheeltec_robot.cpp
```

源码中使用标准的 `geometry_msgs/Twist` 接收速度控制指令。

这意味着未来如果需要移植 ROS2，可以重点研究上位机驱动和 STM32 串口通信协议，不一定要重新编写下位机固件。

### 顺便发现了一个问题：电机噪音挺大

小车移动的时候会发出明显的嗡嗡声，停下来就安静了。

暂时怀疑是电机驱动、减速器或四轮差速底盘的机械噪音。

因为实验室人比较多，也比较安静，所以不太方便长时间让它跑来跑去。

这也直接影响了我之后的测试安排：**先做不需要移动机器人的实验，把真正的移动导航实验留到合适的场地。**

## 五、第一次理解 TF 和 RobotModel

接下来开始按照厂家教程使用 RViz。

教程要求添加 `TF` 和 `RobotModel`。

刚开始我很疑惑：

> 我的小车又没有机械臂，为什么还需要 RobotModel？TF 又是什么？

后来才逐渐理解。

**TF 是 ROS 的坐标变换系统，RobotModel 是机器人外形的可视化。**

对于我的 R680，主要涉及：

```text
map
 └── odom_combined
      └── base_footprint
           ├── laser
           ├── gyro_link
           └── 其他机器人部件
```

这只是简化示意，实际 TF 树还包含其他坐标系。

其中：

- `map` 是建图后的全局参考坐标系。
- `odom_combined` 是融合里程计后的局部参考坐标系。
- `base_footprint` 是机器人底盘的基准坐标系。
- `laser` 是激光雷达坐标系。
- `gyro_link` 是 IMU 坐标系。

为什么需要这些坐标系？

假设激光雷达检测到前方两米处有一个障碍物，机器人要避障，就必须知道它在机器人底盘坐标系或地图坐标系中的位置。

TF 负责完成不同坐标系之间的变换。

第一次打开 RViz 时，还遇到了 `Fixed Frame = map` 报错的问题。后来改成厂家要求的 `odom_combined`，机器人模型和 TF 就正常显示了。

再后来开始 SLAM 建图时，又把 Fixed Frame 切换成了 `map`。

还学会了在 RViz 中设置：

```text
View Type    = TopDownOrtho
Target Frame = base_footprint
```

这样画面就能以小车为目标自动跟随，不会因为机器人走远了而消失在屏幕外。

这些看似只是界面设置，实际上让我开始理解 ROS 是怎么描述机器人位置和运动的。

## 六、激光雷达测试：第一次看到机器人眼中的世界

启动激光雷达：

```bash
roslaunch turn_on_wheeltec_robot wheeltec_lidar.launch
```

在 RViz 添加 `LaserScan`，Topic 设置成：

```text
/scan
```

屏幕上马上出现了一圈红色扫描点。

它们对应的是雷达检测到的墙壁、桌椅等物体。

从驱动日志中看到，雷达当前使用 DenseBoost 扫描模式，报告的扫描频率约为 **10Hz**。

这意味着它每秒大约产生 10 帧二维扫描数据。

以前只是听说过激光雷达和点云，真正看到红色的扫描点随着周围环境实时变化，感觉理解一下子具体了很多。

不过这里还需要区分两个概念：

**激光雷达扫描不等于 SLAM 地图。**

LaserScan 只是传感器在当前时刻观察到的距离数据，而 SLAM 还需要结合机器人自身的运动信息，逐步估计位姿并构建地图。

## 七、第一次尝试 Gmapping 建图

厂家已经提供了现成的建图启动文件：

```bash
roslaunch turn_on_wheeltec_robot mapping.launch
```

查看源码后发现，默认采用的是 `gmapping` 算法，同时还提供 Hector、Karto、Cartographer 等算法的启动入口。

原本以为一条命令就能跑通，结果第一次启动就出现了大量警告：

```text
Reason: new node registered with same name
```

以及：

```text
Could not transform imu message
from gyro_link to base_footprint
```

还有更严重的：

```text
MessageFilter [target=odom_combined]:
Dropped 100.00% of messages
```

后来才发现，之前启动的底盘节点和雷达节点没有全部关闭，而 `mapping.launch` 本身就会启动这些组件。

于是多个同名节点重复注册，导致部分 TF 发布节点退出，最终影响 Gmapping 接收数据。

### 解决方法

先停止之前单独启动的底盘、雷达和建图程序，再重新启动 ROS Master，并且只运行一次：

```bash
roslaunch turn_on_wheeltec_robot mapping.launch
```

这次日志终于正常了：

```text
Odom sensor activated
Imu sensor activated
Kalman filter initialized
Initialization complete
Registering First Scan
```

刚看到 `Registering First Scan` 后，终端长时间没有新输出，我还以为程序卡住了。

后来才知道，Gmapping 是持续运行的 ROS 节点，并不会像普通命令一样执行完就退出。

### 第二个坑：RViz 显示 No map received

虽然 `/map` 和 `/map_metadata` 都存在，但 RViz 一直提示没有收到地图。

执行：

```bash
rostopic info /map
```

发现：

```text
Publishers:
 * /slam_gmapping

Subscribers: None
```

也就是说，Gmapping 已经注册了地图发布者，但 RViz 并没有正常订阅。

此前我们曾经重启过 ROS Master，RViz 可能还保留着旧的连接状态。

关闭 RViz、重新打开并订阅 `/map` 后，地图终于正常显示。

随后用键盘让机器人缓慢移动，屏幕上出现了黑白灰色的二维栅格地图。

第一次知道：

- 白色代表已经观测到的空闲区域。
- 黑色代表障碍物或墙壁。
- 灰色代表未知区域。

当前只是在实验室小范围移动，所以建立的地图比较零碎，还不是一张适合实际导航的完整地图。

但至少证明了**激光雷达、里程计、IMU、TF 和 Gmapping 已经能够初步协同工作**。

后面如果需要保存地图，可以使用：

```bash
rosrun map_server map_saver -f ~/r680_lab_map
```

得到 `.pgm` 和 `.yaml` 文件，供后续定位和导航使用。

## 八、原来小车还有一台 Astra S 深度相机

完成激光雷达测试后，准备继续检查摄像头。

但一开始执行：

```bash
ls /dev/video*
```

竟然提示没有设备。

我还以为摄像头没有被识别。

后来查看系统日志：

```bash
dmesg | grep -iE 'camera|video|astra'
```

发现：

```text
usb 1-2.3: Product: ASTRA S
```

原来小车安装的是 **Orbbec Astra S 深度相机**。

这种相机不一定通过普通的 `/dev/video0` 接口提供数据，而是使用专门的深度相机驱动。

在厂家源码中找到了：

```text
ros_astra_camera/launch/astra.launch
```

启动：

```bash
roslaunch astra_camera astra.launch
```

再使用：

```bash
rqt_image_view
```

成功看到了研究室的实时彩色画面。

之后又在 RViz 中添加 `PointCloud2`，订阅：

```text
/camera/depth/points
```

第一次看到了深度相机生成的三维空间点云。

为了确认数据正常，执行：

```bash
rostopic hz /camera/depth/points
```

得到：

```text
average rate: 29.741
```

也就是**深度点云接近每秒 30 帧**。

之前看到二维激光雷达的红色扫描点已经觉得很有意思，三维点云则更直观地展示了物体的空间结构。

这也让我开始思考，后面能不能将二维雷达和深度相机结合起来，做行人检测、动态障碍物识别和导航避障。

## 九、语音模块测试失败，但不算什么大问题

厂家教程最后还有一个语音模块测试。

在 ROS 工程里确实找到了：

```text
xf_mic_asr_offline/launch/mic_init.launch
```

于是尝试启动：

```bash
roslaunch xf_mic_asr_offline mic_init.launch
```

结果程序提示：

```text
找不到麦克风设备
无法打开麦克风设备
```

最终进程退出。

这说明系统虽然安装了讯飞离线语音识别相关软件，但没有检测到对应的麦克风设备。

目前还不能确定是根本没有安装语音模块，还是设备连接存在问题。

考虑到之后主要研究的是机器人导航与避障，语音功能暂时先跳过。

## 十、还研究了一个问题：要不要升级 ROS2？

我这台 R680 使用的是 ROS1 Melodic，已经是比较老的版本。

但 ROS2 的通信架构、DDS、QoS，以及 Nav2 导航框架都比较吸引我。

于是又调查了能否将原有系统升级为 ROS2。

问题在于，Jetson Xavier NX 当前使用的是 JetPack 4.5 和 Ubuntu 18.04，不能简单地像普通电脑一样直接升级到 Ubuntu 22.04。

询问 WHEELTEC 技术支持后，对方表示没有适配这台车的 ROS2 镜像，需要自行寻找方案。

后来发现 GitHub 上有一些移植到 ROS2 的 WHEELTEC 驱动项目，但还需要验证与我的 STM32 固件及底盘配置是否兼容。

所以暂时决定：

**先保留已经能正常运行的 ROS1 环境，等完成基础导航实验后，再考虑 ROS2 迁移。**

这次也算意识到，升级开发框架不一定能直接改善机器人的导航效果。

如果已有的 ROS1 系统已经能够运行 Gmapping、AMCL、DWA 和 TEB，那么可以先用它们做实验，不一定非要先升级系统。

## 十一、后续开发计划

经过这次折腾，已经摸清了这台 R680 的基本软件和硬件架构。

后面准备重点做几件事情。

**首先是完善开发环境。**

计划使用 Windows 本地的 VS Code 和 Codex，通过 SSH 访问 Jetson，阅读、修改 ROS 工程源码。

同时配置 SSH 公钥认证，避免每次登录都需要输入密码。如果之后有同门一起使用，每个人都应该生成自己的 SSH 密钥，而不是互相共享私钥。

**其次是学习 rosbag。**

因为实验室空间有限，而且电机噪音比较大，不方便经常让小车移动。

可以录制激光雷达、IMU、里程计和相机数据，在电脑上离线回放、分析和调试算法。

**最后是正式开展导航实验。**

等找一个比较空旷的场地，再完成一次完整的二维建图，测试 AMCL 定位与自主导航，然后尝试 DWA、TEB 等算法。

之后希望结合智慧康复中心、康复医院这类场景，研究更具体的动态避障或路径规划问题。

## 十二、这次折腾最大的收获

回过头看，这次最大的收获其实不是学会了多少条 `roslaunch` 命令。

而是开始逐渐理解，一台真正的移动机器人是如何工作的。

从上层 ROS 节点发布 `/cmd_vel`，到底层 STM32 控制电机；从轮速和 IMU 估计机器人位姿，到 TF 维护不同坐标系之间的关系；再从激光雷达扫描环境，到 Gmapping 生成二维地图。

这些以前看起来彼此独立的概念，现在终于能够串起来了。

当然，目前还只是把厂家提供的功能初步跑通，并没有真正开发出自己的算法。

但是至少已经完成了从**“我有一台 ROS 小车，却不知道怎么用”**，到**“我能连接它、控制它、看到它的传感器数据，并让它尝试建立地图”**的过程。

下一步，希望不只是会运行厂家写好的 Launch 文件，而是能够看懂代码，理解算法，最后真正改出一点自己的东西。

**记录于第一次 R680 实机调试之后。**