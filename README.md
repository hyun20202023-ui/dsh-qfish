# QQ 鏈哄櫒浜猴紙dsh-onebot-fish锛?
鎶?QQ 鎺ヨ繘 DeepSeek Harness銆傚熀浜?OneBot v11锛岄厤鍚?**NapCat**锛堟垨浠讳綍 OneBot v11 瀹炵幇锛変娇鐢ㄣ€?
瑁呭ソ涔嬪悗锛屾満鍣ㄤ汉鍦?QQ 閲屾寜浜鸿鑱婂ぉ锛屼細璁颁綇浜哄拰浜嬨€佹湁鑷繁鐨勫績鎯呫€佷細鍙戝浘銆佸彂 B 绔欏崱鍜岀綉鏄撲簯鍗★紝杩樺甫涓€涓綉椤垫帶鍒跺彴銆?
## 浣犻渶瑕佸厛鍑嗗

1. 涓€涓?QQ 鍙凤紙寤鸿灏忓彿锛夛紱
2. **NapCat**锛氱櫥褰曢偅涓?QQ锛屾墦寮€銆岀綉缁滈厤缃€嶁啋 鏂板缓 **WebSocket 鏈嶅姟鍣?*锛岀鍙?`3001`锛屾秷鎭牸寮?`array`锛?3. 鏈満宸插畨瑁?DeepSeek Harness銆?
## 璁?DSH 甯綘瑁?
鎶婁笅闈㈣繖娈垫暣涓彂缁欎綘鐨?DSH锛?
```
甯垜瀹夎 QQ 鏈哄櫒浜烘彃浠讹細
1. 鐢?plugin_manager 鐨?install_bundle 瀹夎鎴戞彁渚涚殑杩欎釜鎻掍欢鐩綍锛堟垨鍘嬬缉鍖呰В鍘嬪悗鐨勭洰褰曪級銆?2. 瀹夎瀹屾垚鍚庯紝鎵惧埌閰嶇疆琛?id=onebot-fish锛?   - url 濉?ws://127.0.0.1:3001锛圢apCat 鐨勬鍚?WS 鍦板潃锛?   - 濡傛灉 NapCat 璁句簡 access token锛屾妸瀹冨～杩涘嚟鎹?ONEBOT_ACCESS_TOKEN锛涙病鏈夊氨鐣欑┖
   - consoleEnabled 淇濇寔 true
3. 閲嶅惎浣块厤缃敓鏁堛€?4. 鍦ㄦ棩蹇楅噷鎵句竴琛屻€屾帶鍒跺彴宸插惎鍔細http://...銆嶏紝鎶婇偅鏁磋鍦板潃锛堝惈 ?t= 鍚庨潰鐨勪护鐗岋級鍙戠粰鎴戙€?5. 濡傛灉杩炴帴澶辫触锛屽府鎴戝垽鏂槸 NapCat 娌″紑锛岃繕鏄鍙?token 涓嶅銆?```

## 鎺у埗鍙?
鍚姩鏃ュ織閲屼細鍑虹幇绫讳技锛?
```
鎺у埗鍙板凡鍚姩锛歨ttp://127.0.0.1:8090/?t=AbC123xyz
```

澶嶅埗鏁磋鍒版祻瑙堝櫒鍗冲彲锛屼笉鐢ㄥ崟鐙浠ょ墝銆傜鍙ｈ鍗犵敤浼氳嚜鍔ㄥ線鍚庨『寤讹紝浠ユ棩蹇椾负鍑嗐€?
鎺у埗鍙拌兘鏀癸細浜鸿銆佽瑷€瑙勫垯銆侀粦璇濄€佽〃鎯呰鍒欍€佸満鏅鍒欍€佹潅椤硅鍒欍€佽涓哄弬鏁般€佽〃鎯呭簱銆佷細璇濄€佸績鎯呫€侀暱鏈熻蹇嗐€佸涔犺〃銆佸緟鍔炪€佽仈绯讳汉銆佹棩蹇椼€?
鏈嶅姟鍣ㄤ笂闇€瑕佸缃戣闂椂锛屾妸閰嶇疆閲岀殑 `consoleListen` 鏀规垚 `0.0.0.0`锛屽苟鍦ㄥ畨鍏ㄧ粍鏀捐瀵瑰簲绔彛銆?
## 閰嶇疆椤?
| 閰嶇疆 | 榛樿 | 璇存槑 |
|---|---|---|
| `transport` | `forward-ws` | OneBot 浼犺緭鏂瑰紡 |
| `url` | `ws://127.0.0.1:3001` | NapCat 姝ｅ悜 WS 鍦板潃 |
| `accessTokenRef` | `ONEBOT_ACCESS_TOKEN` | DSH 鍑嵁鍚嶏紝NapCat 鏈?token 鏃跺～ |
| `respondToPrivate` | `true` | 鏄惁鍥炵鑱?|
| `respondToGroup` | `true` | 鏄惁鍥炵兢鑱?|
| `groupMentionOnly` | `true` | 缇ら噷鏄惁鍙洖琚?@ 鐨勬秷鎭?|
| `consoleEnabled` | `true` | 鏄惁鍚姩鎺у埗鍙?|
| `consolePort` | `8090` | 鎺у埗鍙扮鍙ｏ紝鍗犵敤鏃惰嚜鍔ㄩ『寤?|
| `consoleListen` | `127.0.0.1` | 鎺у埗鍙扮洃鍚湴鍧€ |
| `consoleToken` | 绌?| 鐣欑┖鑷姩鐢熸垚骞朵繚瀛?|
| `injectEnabled` | `false` | 璋冭瘯鐢ㄦ敞鍏ユ帴鍙ｏ紝榛樿鍏抽棴 |

## 鏁版嵁鏀惧湪鍝?
鎵€鏈夋暟鎹兘鍦?`<profile>/onebot-data/`锛?
```
onebot-data/
鈹溾攢鈹€ persona/           浜鸿涓庤鍒欙紙md锛?鈹溾攢鈹€ stickers/          琛ㄦ儏搴?鈹溾攢鈹€ qq-settings.json   琛屼负鍙傛暟
鈹溾攢鈹€ memories.json      闀挎湡璁板繂
鈹溾攢鈹€ mood.json          蹇冩儏
鈹溾攢鈹€ tics.json          瀛︿範琛?鈹溾攢鈹€ contacts.json      鐔熶汉妗ｆ
鈹溾攢鈹€ reminders.json     寰呭姙
鈹溾攢鈹€ state.json         浼氳瘽鐘舵€?鈹斺攢鈹€ console-token.txt  鎺у埗鍙颁护鐗?```

澶囦唤鐩存帴鎷疯繖涓洰褰曞嵆鍙€?
## 甯歌闂

- **缇ら噷涓嶅洖**锛氶粯璁ゅ彧鍥?@ 鐨勬秷鎭紝鍏?@ 瀹冦€?- **杩炴帴澶辫触**锛歂apCat 鐨?WS 娌″紑锛屾垨 `url` / token 涓?NapCat 涓嶄竴鑷淬€?- **鎺у埗鍙版墦涓嶅紑**锛氱湅鏃ュ織閲屾墦鍗扮殑鐪熷疄绔彛锛涙湇鍔″櫒杩樿妫€鏌ュ畨鍏ㄧ粍銆?- **琛ㄦ儏涓嶆樉绀?*锛歚onebot-data/stickers` 閲屾斁 png/jpg/gif/webp锛屾帶鍒跺彴鍙洿鎺ヤ笂浼犮€?
## 来源说明

本插件基于 [dsh-onebot](https://www.npmjs.com/package/dsh-onebot)（作者 thawline，MPL-2.0）修改而来，增加了人设/记忆/心情/学习表、发图与卡片、网页控制台等功能。修改部分同样以 MPL-2.0 发布，完整许可见 LICENSE。
