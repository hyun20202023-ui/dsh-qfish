<div align="center">

<img src="assets/logo.png" width="150" alt="qfish">

# qfish 🐳

**让 DeepSeek Harness 直接接管 QQ**

一条灵活、自主、有点脾气的大肥鱼

![license](https://img.shields.io/github/license/hyun20202023-ui/dsh-qfish?style=flat-square&color=4a6fbf)
![stars](https://img.shields.io/github/stars/hyun20202023-ui/dsh-qfish?style=flat-square&color=2b3a67)
![issues](https://img.shields.io/github/issues/hyun20202023-ui/dsh-qfish?style=flat-square&color=9aa4b2)
![platform](https://img.shields.io/badge/platform-DeepSeek%20Harness-5b7fd4?style=flat-square)
![npm](https://img.shields.io/npm/v/qfish?style=flat-square&color=cb3837)
![downloads](https://img.shields.io/npm/dm/qfish?style=flat-square&color=2b3a67)

</div>

```bash
dsh plugin add qfish
```

---

> 大多数 QQ 机器人活在框架里：人设是配置项，记忆是数据库，什么时候说话靠关键词。
>
> qfish 不走这条路。它是 DSH 的插件，QQ 只是它的手和嘴，判断交给模型自己做。

---

## 目录

- [它是什么](#它是什么)
- [快速开始](#快速开始)
- [功能模块](#功能模块)
- [默认值](#默认值)
- [它记在哪](#它记在哪)
- [常见问题](#常见问题)

---

## 🐟 它是什么

<div align="center">

| 陪伴 | 说话 | 眼睛 | 手脚 |
|:---:|:---:|:---:|:---:|
| 群聊收敛，私聊放开<br>同一份人设和记忆 | 短句、按人设、有情绪<br>不套客服腔 | 看图、看视频<br>字幕画面弹幕一起过 | 搜图、联网、音乐卡片<br>提醒、群管理、运维 |

</div>

**💬 聊天与陪伴**

群聊里它不抢话，私聊里它话多一点。同一条鱼，两种状态。

**🗣️ 尽量像人地说话**

短句为主，不写小作文；按人设说话，有情绪和好感度，态度会变。

**👂 会学人说话**

听多了会学群里人的口头禅和句式，合适的时候用一次，不是每句都套。

群里的黑话它看得懂；被骂了也会用那套还回去。

**✂️ 切句和语气**

一条话说完就停，不凑长篇。要分几条发时按语气断，不按字数均分。

短句、语气词、哪里停顿，都按口语来，不写成书面文章。

<img src="assets/chat-split.png" alt="切句演示" width="520">


**🎭 判断交给人设**

什么该回、该说什么、要不要装作没看见，没有写死的规则表；人设文件决定它的性格和反应方式，模型按场合判断。

同一句话，换个性格就是另一种反应。

**🖼️ 图片和视频**

发图能看图说话；发 B 站视频会把字幕、画面、弹幕、热评都过一遍，看完再聊。太长会直接说太长，不装看过。看完写摘要（没写就用字幕兜底）和感想（它愿意写才有），存进观看记录。

**🧰 工具**

搜图、联网、音乐卡片、提醒、群管理、跨群发消息、跑服务器命令（仅后台权限）。

**🖥️ 一个控制台**

会话、记忆、社交、观看记录、配置、日志，全在一个网页里。

<img src="assets/console.png" alt="控制台" width="760">


**💰 花费可控**

聊久了会自动轮换上下文，旧内容压成摘要，不会越聊越贵；看视频是主要开销，时长、频率、描述长短都能在控制台调。

---

## 🔀 两种接入方式

QQ 机器人常见两条路：

- **官方开放平台**：AppID / AppSecret，接口稳，但要注册、审核、配置回调；
- **OneBot / NapCat**：用普通 QQ 号，起步快，协议端有被风控的可能。

qfish 走第二条。两种方式没有谁更好，取舍不同：

| | qfish（OneBot / NapCat） | 官方 Bot |
|---|---|---|
| 账号 | 普通 QQ 号 | 开放平台机器人 |
| 上手 | 装 NapCat，填地址 | 注册、审核、配回调 |
| 进群 | 像普通号一样被拉进去 | 邀请链接和权限 |
| 稳定性 | 协议端有风控可能 | 官方接口 |
| 适合 | 自己养、群里像个人 | 面向公众的产品 |

具体到功能，这几块做得比较多：

**一、起步简单**

装个 NapCat，登个 QQ 小号，插件里填个地址就通了。

**二、视频会看完再聊**

不光看标题和简介：B 站视频的字幕、逐帧画面、弹幕、热评都会过一遍。太长会直说太长。

**三、记忆是活的**

按人存，记满了自己压成一条；会话聊长了轮换，旧内容压成摘要带进新会话；群聊和私聊共用同一份记忆。

**四、说话像人**

人设写在一个 markdown 里；短句为主，会学群里人的说法，会用黑话，有情绪和好感度，被骂会回嘴。

**五、花得可控**

上下文轮换、看图批量调用、视频时长和频率上限，都在控制台里能调。

**六、一个包全都有**

机器人逻辑、网页控制台、右下角入口、默认人设，装一个包全在里面。

---

## 🚀 快速开始

两种跑法：本机跑，或者丢到服务器。装插件那步一样，起 NapCat 和开控制台不一样。

### 准备

- DeepSeek Harness（本地桌面版，或服务器上的 dsh），并且已经能正常对话（有默认模型）
- 一个 QQ 小号
- NapCat
- 服务器跑的话：一台能开端口的小鸡

### 📦 ① 装插件

**从 npm 装（推荐）**

```bash
dsh plugin add qfish
```

装完重启 DSH。

**从 GitHub 装**

```bash
pnpm add git+https://github.com/hyun20202023-ui/dsh-qfish.git
```

或者在 profile 的 `package.json` 里加依赖，把 `qfish` 放进 `dsh.profile.bundles`，再装一遍依赖。

### 🐈 ② 起 NapCat

**本地**

1. 装 NapCat，登录 QQ；
2. 网络配置 → 新建 **WebSocket 服务器**；
3. 端口 3001，消息格式 `array`。

**服务器（Docker）**

```bash
docker run -d --name napcat --restart unless-stopped \
  -p 3001:3001 -p 6099:6099 \
  -v /opt/napcat:/app/napcat \
  mlikiowa/napcat-docker:latest
```

- `3001`：给插件连的 WebSocket；
- `6099`：NapCat 的网页，用来扫码；
- `/opt/napcat`：登录状态和数据，重启不丢。

起来之后用浏览器打开 `http://服务器IP:6099`，扫码登录 QQ。

### ⚙️ ③ 填配置

DSH → 插件设置 → **qfish**：

| 配置 | 本地 | 服务器 |
|---|---|---|
| `url` | `ws://127.0.0.1:3001` | `ws://127.0.0.1:3001` |
| `accessTokenRef` | NapCat 设了 token 才填 | 同左 |
| `consoleEnabled` | `true` | `true` |
| `consoleListen` | `127.0.0.1` | **`0.0.0.0`** |
| `consolePort` | `8090` | `8090`（被占用会自动顺延） |
| `consoleToken` | 留空自动生成 | 建议自己设一长串 |

**服务器还要放行端口**

- 开 `8090`（控制台）；
- 开 `6099`（NapCat 网页）；
- `3001` 只给本机插件用，别暴露到公网。

### 🔑 ④ 登录

- **本地**：控制台 → 行为参数 → 顶部二维码；也可以直接在 NapCat 界面扫。
- **服务器**：浏览器开 `http://服务器IP:6099` 扫码；控制台行为参数里也有二维码。

登录成功后再进下一步。

### 🖥️ ⑤ 打开控制台

控制台是一个网页，**必须带 token 才能进**，地址长这样：

```
http://地址:8090/?t=令牌
```

**本地**

1. 地址固定是 `http://127.0.0.1:8090`；
2. token 在哪里：
   - 配置里的 `consoleToken`；
   - 留空的话，读这个文件：`<profile>/onebot-data/console-token.txt`；
   - 或者 DSH 启动日志里「控制台已启动：http://…」那一行，整行就是带 token 的地址。
3. 拼起来就是：

```
http://127.0.0.1:8090/?t=CAIvQF3D...
```

**服务器**

1. 先把配置里的 `consoleListen` 改成 `0.0.0.0`——不改的话，只有服务器自己能访问，你在外面打不开；
2. 放行端口 `8090`（安全组 / 防火墙）；
3. 建议顺手把 `consoleToken` 设成一个自己记得住的长串，别用自动生成的；
4. 地址换成服务器 IP：

```
http://你的服务器IP:8090/?t=你的令牌
```

**进不去的时候**

| 现象 | 原因 |
|---|---|
| 浏览器显示 `unauthorized` | 地址里没带 `?t=`，或 token 不对 |
| 一直转圈、打不开 | `consoleListen` 还是 `127.0.0.1`，或者端口没放行 |
| 能打开但页面空白 | 端口对了、token 错了，刷新时检查地址 |
| 本地能开、远程不能 | 只放行了 NapCat 的 6099，没放行 8090 |

**右下角按钮**

DSH 页面右下角的悬浮按钮也能打开控制台，但它内置的地址是 `127.0.0.1:8090`。在服务器上使用时，手动把地址换成服务器 IP。

---

## 🧩 功能模块

### 人设与说话

| 功能 | 说明 |
|---|---|
| 人设文件 | 性格写在 markdown 里，改文件就换人 |
| 语言模仿 | 会学群里人的说法和句式 |
| 黑话表 | 群里的黑话看得懂，被骂时也会用 |
| 禁词表 | 回复里出现的词自动删掉 |
| 梗百科 | 查梗、加梗，聊天时能用上 |

### 记忆与会话

| 功能 | 说明 |
|---|---|
| 长期记忆 | 按人存，有上限，满了自动压缩 |
| 会话摘要 | 轮换时压缩上下文，新会话带着走 |
| 群聊缓存 | 进群先看最近几句，接得上话 |
| 记忆锁定 | 重要的那条可以锁住，不被压缩 |

### 群聊与私聊

| 功能 | 说明 |
|---|---|
| 接话概率 | 群里不是每条都回 |
| 认识的人接话概率 | 认识的人说话，更容易接 |
| 闭嘴 | 只对某个人静音，不影响别人 |
| 私聊 | 话比群里多，记得你的事 |

### 社交

| 功能 | 说明 |
|---|---|
| 联系人档案 | 名字、称呼、备注 |
| 好感度 | 会影响语气和态度 |
| 认人 | 聊久了会主动问怎么称呼 |

### 看图与看视频

| 功能 | 说明 |
|---|---|
| 看图 | 收到图片会看内容，再决定怎么接 |
| 看视频 | 字幕、画面、弹幕、热评一起过 |
| 观看记录 | 看完写摘要和感想，存着能翻 |
| 主动分享 | 有合适的视频会自己发（默认关闭） |

### 内容工具

| 功能 | 说明 |
|---|---|
| B 站 | 找视频、看视频、发卡片 |
| 音乐 | 网易云 / QQ 音乐卡片 |
| 表情包 | 收、存、随机发 |
| 搜图 | pixiv、booru、以图搜图 |
| 联网 | 搜索、抓网页正文 |

### 管理与运维

| 功能 | 说明 |
|---|---|
| 提醒 | 定时提醒 |
| 群管理 | 禁言、踢人、处理加群和好友申请 |
| 发消息 | 跨群、私聊、@ 人 |
| 服务器命令 | `/dsh` 跑运维命令，仅后台权限 |
| 代理 | 走 Clash / HTTP 代理访问外网 |
| 贴吧 | 配置百度 Cookie 抓贴吧内容 |

---

## 🎛️ 默认值

都能在控制台改，这里只是出厂设置。

| 项 | 默认 |
|---|:---:|
| 一次回复最多条数 | 4 |
| 每条最多字数 | 12 |
| 群聊接话概率 | 5% |
| 记忆上限 | 45 条/人 |
| 会话轮换 | 30 轮 / 40 万字符 |
| 观看记录 | 50 条 |
| 同一视频缓存 | 10 分钟 |
| 视频时长上限 | 10 分钟 |
| 每小时视频上限 | 20 条 |

---

## 🗂️ 它记在哪

数据都在 profile 的数据目录，纯 JSON / 文本，能直接看、直接备份。

| 文件 | 内容 |
|---|---|
| `memories.json` | 记忆 |
| `summaries.json` | 摘要 |
| `state.json` | 会话索引 |
| `bili-memory.json` | 观看记录 |
| `contacts.json` | 联系人 |
| `frames/` | 九宫格缓存 |

会自己清的东西：读图会话用完即删、旧会话段轮换后删、临时视频抽完帧就删。

---

## ❓ 常见问题

<details>
<summary><b>它不回我</b></summary>

- 群里没 @ 也没叫名字，可能在按概率接话
- 看看接话概率是不是调太低了
- 去控制台「运行日志」翻翻有没有报错

</details>

<details>
<summary><b>看视频失败</b></summary>

- 超过时长上限会被拒绝，这是正常的
- B 站 Cookie 可能过期了
- 卡片发不出是签名服务的问题，文字链接还能用

</details>

<details>
<summary><b>扫码登不上</b></summary>

- 二维码有时效，重新生成
- NapCat 掉线时，控制台会提示重连

</details>

<details>
<summary><b>控制台打不开</b></summary>

- 确认服务在跑
- 确认地址和端口
- 别漏了地址里的 token

</details>

<details>
<summary><b>QQ 在线，但一条都不回（日志里是 blocked）</b></summary>

DSH 可能把 qfish 的会话标成了「已归档」。归档的会话会被 DSH 直接拒绝执行，模型一次都不会跑。

1. 退出 DSH；
2. 打开 `~/.dsh/storages/workspace.json`（Windows：`C:\Users\你的用户名\.dsh\storages\workspace.json`）；
3. 删掉 `archivedSessionIds` 里所有以 `onebot:` 开头的条目；
4. 保存，重开 DSH。

</details>

<details>
<summary><b>DSH 里有会话了，但控制台聊天框不动</b></summary>

多半是 profile 没配默认模型，插件新建的会话拿不到模型，每轮直接被判 blocked。

在 profile 的 `cordis.patch.yml` 里加：

```yaml
- id: agent-default-model
  name: "@deepseek-ai/dsh-agent-default-model"
  config:
    provider: deepseek-account
    model: deepseek-flash
    reasoningEffort: high
```

重启 DSH。

</details>

<details>
<summary><b>控制台打不开，或者端口被占</b></summary>

多半是开了两个 DSH。任务管理器里把所有 `DeepSeek Harness` 进程结束，只留一个再启动。

</details>

<details>
<summary><b>同一个 QQ 能在两台机器上同时登吗</b></summary>

不能。两个 NapCat 登同一个号会互相踢，表现就是「刚才还好好的，突然掉线」。

</details>

<details>
<summary><b>NapCat 里改了网络配置，插件还是连不上</b></summary>

确认改的是**当前实例**的配置。NapCat 桌面版里 SnowLuma 后端和 napcat 后端的配置文件不在同一个位置，改错文件不会生效。改完还要重启那个实例。

</details>

<details>
<summary><b>npm 装不上，或者特别慢</b></summary>

换国内镜像：

```bash
npm config set registry https://registry.npmmirror.com
```

装完想换回来：

```bash
npm config set registry https://registry.npmjs.org
```

镜像只影响下载，不影响发布。

</details>

---

<div align="center">

见 [LICENSE](LICENSE)

</div>
