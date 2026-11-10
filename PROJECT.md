# qfish 项目交接说明

这份文档给「没有聊天上下文」的人或模型看：读它能知道项目怎么跑、怎么发版、哪些方案已经否决、哪里容易踩坑。

---

## 一、它是什么

qfish 是 DeepSeek Harness（DSH）的 QQ 机器人插件，走 NapCat / OneBot v11，不依赖官方机器人。

链路：

```
QQ ← NapCat（协议端）← WebSocket ← DSH 插件（qfish）← DSH 模型/会话/工具
```

衍生于 npm `dsh-onebot@1.4.0`（MPL-2.0），两者不能同时安装：都注册 `/onebot/api`，会抢同一个 NapCat 连接。

---

## 二、代码结构

```
lib/index.js      宿主插件，单文件，全部逻辑在这里（约 7000 行）
lib/console.js    控制台页面，本质是一个模板字符串，改的时候注意转义
client.js         浏览器端注入（设置页入口）
defaults/         默认人设、参数
docs/             使用手册
cordis.patch.yml  bundle 补丁（装插件时写进 profile 的默认配置）
```

运行时数据在 profile 的 `onebot-data/`：

```
qq-settings.json   行为参数
contacts.json      社交档案（name/nick/role/likes/dislikes/style）
memories.json      长期记忆
mood.json          好感度
moodmeta.json      状态与冷却
stickers/          表情库 + tags.json + .hashes.json
persona/           当前生效的人设
logs: qq-errors.log / mood-debug.log / rotate.log / flow-debug.log
```

---

## 三、关键设计（已经定下来的）

**人设**

- 放在 `systemPrompt.section`，不进每轮消息历史，省重复上下文
- 默认人设 `defaults/persona/*.md`，运行时从 profile 的 persona 目录读

**记忆**

- 不再每轮自动注入多条
- 每轮本地检索，最多带 1 条，命中至少 2 个词才注入
- 模型主动检索的工具已删，避免多一次调用
- 权重字段保留但不再参与排序
- 同义词表已删：没人维护

**档案**

- 四块：`role` 身份、`likes` 偏好、`dislikes` 雷区、`style` 聊天风格
- 写入前先 `get`，矛盾或反悔用 `replace` 清字段
- 旧的 `note` 字段保留兼容

**禁词**

- 支持三种：普通词/整句按字面；`/*/` 任意 1 字；`/-/` 任意 2–10 字
- 不支持正则、不支持 `{槽位}`
- 生成阶段只做提示，发送阶段按字面/句式删除整句

**表情**

- 只保留自动配图
- 模型显式发表情、`[[表情]]`、`[[好感]]` 标记都已删除（模型不配合）
- 存图仍走工具，入库后后台看图打标签

**好感度**

- 关键词判断 + 每 6 轮冷却
- 单次最多 ±25，0–100
- 标签方案试过，模型不输出，已放弃

**访问控制**

- 默认全拒：`allowlist` + 空名单
- `/mood`、`/setmood` 只对管理员提前放行
- 口头禅学习、watch 扫描、发言记录都在门控之后
- 门控失败不发任何消息，不写 moodmeta

**群清理**

- `群管理 → 群清理`，按不活跃天数踢人
- 只对开启的群生效，真踢，没有演练模式

**控制台**

- 端口 8090，地址带 `?t=<token>`
- 服务器要监听 `0.0.0.0`

---

## 四、已否决 / 不要再提的方案

```
关键词触发表：模型自己判断更准，表没人维护
同义词表：同上
记忆自动注入：费钱且常塞不相关，改成按需
权重排序：没有可靠权重来源
模型输出标记（[[表情]]/[[好感]]）：执行不稳定
正则禁词：用户要的是 /*/ 和 /-/ 这种简单写法
独立语法分析：中文句法依赖重，不值得
默认整个入口关闭（enabled 开关）：选了「默认全拒 + 白名单」这条路
```

---

## 五、部署与发版

本地工作区就是仓库源：`default-workspace/qfish`。

**1. 改完先自检**

```bash
node --check qfish/lib/index.js
node --check qfish/lib/console.js
python deploy.py run "systemctl restart dsh-qqbot; sleep 8; systemctl is-active dsh-qqbot"
python sync-check2.py    # 期望 29/29
```

**2. 推到服务器**

```bash
python deploy.py put <本地文件> <远端路径>
python deploy.py run "<命令>"
```

服务器路径 `/root/qfish`，服务 `dsh-qqbot`，profile `qqbot`。

**3. 发版**

```bash
# 改 package.json 版本
npm publish --access public --registry=https://registry.npmjs.org/

# 同步 GitHub
git -C repo-dsh-onebot-fish add -A
git commit -m "feat: ..."
git push origin main        # 网络不稳时走 http://127.0.0.1:7897 代理重试

# 建 release，上传 npm tgz 作为附件
```

npm 发布后要等几分钟；用 `npm view qfish version` 轮询，出现后再下载 tgz 挂到 GitHub release。

**4. 插件市场**

条目在 `awesome-dsh-plugin` 仓库的 `data/plugins/hyun20202023-ui__dsh-qfish.yml`，PR 分支 `add-qfish`。改描述用 GitHub Contents API 更新。

---

## 六、已知坑

1. **console.js 是模板字符串**
   里面写 `\\` 会被二次转义，生成页面变成 `\` 导致语法错误。
   要反斜杠时用 `String.fromCharCode(92)`。

2. **群清理方法的位置**
   `groupCleanup` 必须定义在 `OneBotClient`，不是 transport；调用用 `client.transport.request`。

3. **配置不生效**
   bundle 的 id/name 必须是 `qfish`；旧名 `dsh-onebot-fish` 不会应用配置。

4. **会话轮换参数不生效**
   `sessionCharLimit` 小于等于 20000 会被忽略。

5. **测试注入**
   要测试时把 `console.json` 换成 test 版，测完换回 prod 并重启；否则正式群会被测试消息打扰。

6. **看用量**
   会话文件是 zstd 分帧，要按帧头 `28 b5 2f fd` 切分解压，统计 `data.usage`。

7. **GitHub 网络**
   push 常因 TLS 失败，重试或走本地代理；SSL 报错时 curl 比 python urllib 稳。

8. **npm 延迟**
   publish 后 latest 不会立刻更新，务必轮询确认再挂附件。

---

## 七、测试方法

```
test-newgroup.sh      群聊冒烟测试
test-10turns.sh       10 轮成本测试
test-mood-tag.sh      好感度变化测试
sync-check2.py        本地/服务器文件一致性
```

控制台改动验证：

```bash
curl -s 'http://127.0.0.1:8090/?t=<token>' -o /tmp/cons.html
# 抽出 <script> 内容后 node --check
```

---

## 八、维护偏好

```
说话直接，不要营销腔
一次不要推一点，攒一批再发版
UI 细节要管
不要过度设计
结论要有测试或数据支撑
```

---

## 九、当前版本

`0.3.12`（npm latest）。发布记录见 GitHub Releases。
