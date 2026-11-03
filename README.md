# qfish

把 QQ 接进 DeepSeek Harness。基于 OneBot v11，配套 **NapCat**（或任何 OneBot v11 实现）使用。

装好之后，机器人会在 QQ 里按人设聊天：记人和事、有自己的心情、会发图、发 B 站卡片和网易云卡片，还带一个网页控制台。

## 你需要先准备

1. 一个 QQ 号（建议小号）；
2. **NapCat**：登录那个 QQ，打开「网络配置」→ 新建 **WebSocket 服务器**，端口 `3001`，消息格式 `array`；
3. 本机已安装 DeepSeek Harness（要求 `dsh >= 0.2.1-rc.2`）。

## 安装

把下面整段发给你的 DSH：

```
帮我安装 QQ 机器人插件：
1. 用 plugin_manager 的 install_bundle 安装我提供的这个插件目录（或压缩包解压后的目录）。
2. 安装完成后，找到配置项 id=onebot-fish：
   - url 填 ws://127.0.0.1:3001（NapCat 的正向 WS 地址）；
   - 如果 NapCat 设了 access token，把它填进凭据 ONEBOT_ACCESS_TOKEN；没有就留空
   - consoleEnabled 保持 true
3. 重启使配置生效。
4. 在日志里找一行「控制台已启动：http://...」，把那整行地址（含 ?t= 后面的令牌）发给我。
5. 如果连接失败，帮我判断是 NapCat 没开，还是端口/token 不对。
```

## 首次配置（一定要看）

装完默认是「没人有管理权限」：

- 打开控制台 → **设置 → 管理员名单**，把你要用的 QQ 加进去；
- 不加的话，`/mood`、改别人档案、群管理、加禁词、跨群发消息这些都会回「没权限」；
- 「DSH 后台权限名单」是更高一档，能用 `/dsh` 和 shell，按需再加。

其他默认值：

- `groupMentionOnly: true`：群里只回被 @ 或叫名字的消息；
- `consoleToken` 留空会自动生成并保存，不用自己记。

## 常见坑

1. **NapCat 不在本机 / 在 Docker 里**
   默认连 `ws://127.0.0.1:3001`，连不上就把 `url` 改成 DSH 能访问到的地址；NapCat 开了 token 就填 `ONEBOT_ACCESS_TOKEN`。

2. **控制台端口被占**
   默认 `8090`，被占用会自动往后顺延（8091、8092…），**以启动日志打印的地址为准**。

3. **服务器上想外网访问控制台**
   把 `consoleListen` 改成 `0.0.0.0`，并在防火墙/安全组放行对应端口；令牌等同于密码，别外传。

4. **首次启动失败，提示写文件失败**
   检查 DSH 的 profile 目录是否可写（默认在 `~/.dsh/profiles/<profile>/`）。插件的数据全部写在那里，不写安装目录。

5. **字体没生效 / 控制台是普通字体**
   确认安装包里带 `assets/fonts/fusion-pixel-12px.woff2`。用 npm 或完整目录安装会自带；只拷 `lib/` 会缺。

6. **群里 @ 它也不回**
   先确认 NapCat 在线、`respondToGroup` 是 true；再检查是不是被「管理员名单/黑名单」限制，或好感度太低。

7. **图片、表情不显示**
   表情放在 `onebot-data/stickers/`（png/jpg/gif/webp），控制台可以直接上传。

8. **换机器迁移**
   把整个 `onebot-data/` 目录拷过去即可，人设、记忆、心情、联系人都在里面。

## 数据放在哪

所有运行数据都在 `<profile>/onebot-data/`，不在安装目录：

```
onebot-data/
├── persona/           人设与规则（md）
├── stickers/          表情库
├── qq-settings.json   行为参数
├── memories.json      长期记忆
├── mood.json          好感度
├── tics.json          语言模仿表
├── memes.json         梗百科
├── contacts.json      熟人档案
├── reminders.json     待办
├── watches.json       出现提醒
├── summaries.json     会话摘要
├── state.json         会话状态
└── console-token.txt  控制台令牌
```

备份直接拷这个目录即可。

## 隐私说明

- 插件不向任何第三方上传聊天记录、联系人、记忆；
- 梗百科默认是空的，不会预置内容；它只在后台维护，QQ 用户不能浏览或修改，模型只能按词条只读查询；
- 控制台令牌只保存在本机 `console-token.txt`，请勿提交到公开仓库。

## 配置项

| 配置 | 默认 | 说明 |
|---|---|---|
| `transport` | `forward-ws` | OneBot 传输方式 |
| `url` | `ws://127.0.0.1:3001` | NapCat 正向 WS 地址 |
| `accessTokenRef` | `ONEBOT_ACCESS_TOKEN` | DSH 凭据名，NapCat 有 token 时填 |
| `respondToPrivate` | `true` | 是否回私聊 |
| `respondToGroup` | `true` | 是否回群聊 |
| `groupMentionOnly` | `true` | 群里是否只回被 @ 的消息 |
| `consoleEnabled` | `true` | 是否启动控制台 |
| `consolePort` | `8090` | 控制台端口，占用时自动顺延 |
| `consoleListen` | `127.0.0.1` | 控制台监听地址 |
| `consoleToken` | 空 | 留空自动生成并保存 |
| `injectEnabled` | `false` | 调试用注入接口，默认关闭 |

行为参数里还有三项和网络有关（不填就直连，不报错）：

| 参数 | 默认 | 说明 |
|---|---|---|
| `proxyUrl` | 空 | HTTP 代理，例如 `http://127.0.0.1:7890`；搜图、Pixiv、外链图片需要它 |
| `clashApi` | 空 | Clash 的 API，例如 `http://127.0.0.1:9090`，用于自动切节点 |
| `clashGroup` | 空 | Clash 分组名，例如你的机场分组；配合 `clashApi` 使用 |

没配 `proxyUrl` 时：普通聊天、群管理不受影响，但搜图、Pixiv 搜索、下载外链图片会失败（会提示失败原因，不会静默）。

## 来源说明

本插件基于 [dsh-onebot](https://www.npmjs.com/package/dsh-onebot)（作者 thawline，MPL-2.0）修改而来，增加了人设/记忆/心情/学习表、发图与卡片、网页控制台等功能。修改部分同样以 MPL-2.0 发布，完整许可见 LICENSE。
