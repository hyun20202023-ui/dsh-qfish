import { createServer } from "node:http";
import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync, mkdirSync, statSync } from "node:fs";
import { execFile } from "node:child_process";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

let PROFILE = "";
let PDIR = "";
let SETTINGS = "";
let STICKERS = "";
let TOKEN = "change-me";
let PORT = 8090;
const IMG = /\.(png|jpe?g|gif|webp)$/i;
const FONT_DIR = fileURLToPath(new URL("../assets/fonts", import.meta.url));
const LABEL = {
  "1-persona.md": "人设",
  "2-rules.md": "语言规则",
  "3-slang.md": "黑话表",
  "4-sticker.md": "表情规则",
  "5-extra.md": "场景规则",
  "6-misc.md": "杂项规则",
};

try { mkdirSync(PDIR, { recursive: true }); } catch {}

function run(cmd, args = []) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: 15000 }, (err, stdout, stderr) => {
      resolve({ ok: !err, stdout: String(stdout), stderr: String(stderr) });
    });
  });
}
const noBom = (s) => s.replace(/^\uFEFF/, "");

const page = `<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>dsh 控制台</title>
<style>
:root{color-scheme:dark}
body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;margin:0;background:#0f1115;color:#dfe4ea;font-size:15px;line-height:1.65}
header{padding:14px 20px;background:#161a20;border-bottom:1px solid #242a33;display:flex;gap:0;align-items:center;flex-wrap:wrap}
h1{font-size:18px;margin:0;font-weight:600;letter-spacing:.5px}
main{padding:20px;max-width:1200px;margin:0 auto}
.layout{display:grid;grid-template-columns:220px minmax(0,1fr);gap:18px;align-items:start}
.content{min-width:0}
nav.tabs{display:flex;flex-direction:column;gap:10px;position:sticky;top:12px}
.tab{padding:10px 12px;border-radius:8px;background:#171c24;border:1px solid #232a34;cursor:pointer;font-size:13.5px;color:#aeb7c2;user-select:none;margin:0 0 8px 8px}
.tab.on{background:#2b6cb0;border-color:#2b6cb0;color:#fff;font-weight:600}
.tab:hover{border-color:#2b6cb0}
.sdot{width:9px;height:9px;border-radius:50%;display:inline-block;margin-right:6px;vertical-align:middle}
table{border-collapse:collapse;font-size:14px;width:100%}
th,td{padding:9px 10px;border-bottom:1px solid #1e242c;text-align:left}
th{color:#93a0b0;font-weight:600}
tbody tr:hover{background:rgba(255,255,255,.03)}
@media(max-width:860px){
  .layout{grid-template-columns:1fr}
  nav.tabs{position:static;flex-direction:row;overflow-x:auto;padding-bottom:6px}
  .tab{white-space:nowrap;padding:9px 12px;font-size:14px}
  main{padding:12px}
  header{padding:12px 14px;gap:10px}
}
.panel{display:none;background:#161a20;border:1px solid #242a33;border-radius:10px;padding:14px}
.panel.on{display:block}
textarea{width:100%;min-height:460px;background:#0c0f13;color:#dfe4ea;border:1px solid #2a3240;border-radius:8px;padding:12px;font-family:ui-monospace,Consolas,monospace;font-size:14px;line-height:1.7}
button{background:#2b6cb0;color:#fff;border:0;border-radius:8px;padding:9px 16px;font-size:14px;cursor:pointer}
button:hover{filter:brightness(1.1)}
button.ghost{background:#242a33}
button.danger{background:#a33}
input[type=number],input[type=text]{background:#0c0f13;color:#d7dbe0;border:1px solid #2a3240;border-radius:8px;padding:8px;width:120px}
label{display:block;margin:0 0 10px;font-size:14.5px;color:#a8b3c1}
label input{margin-left:8px}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px}
pre{background:#0c0f13;border:1px solid #2a3240;border-radius:8px;padding:12px;max-height:460px;overflow:auto;font-size:13.5px;line-height:1.65;white-space:pre-wrap}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;margin-top:12px}
.thumb{position:relative;border:1px solid #2a3240;border-radius:8px;overflow:hidden;background:#0c0f13}
.thumb img{width:100%;height:90px;object-fit:cover;display:block}
.thumb button{position:absolute;right:4px;top:4px;padding:2px 7px;font-size:11px;background:#a33}
small{color:#8b95a3;font-size:13.5px}
.chatcard{display:flex;gap:12px;padding:12px;border:1px solid #242a33;border-radius:12px;background:#12161c;margin-bottom:10px;align-items:center}
.chatcard.busy{border-color:#2b6cb0}
.avwrap{flex:0 0 46px}
.av{width:46px;height:46px;border-radius:50%;object-fit:cover;background:#222}
.cbody{flex:1;min-width:0}
.chead{display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:4px}
.cname{font-weight:600}
.msg{font-size:12.5px;color:#9aa4b2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.msg.reply{color:#7fb3e6}
.cmeta{font-size:11.5px;color:#5f6875;margin-top:4px}
.gdot{width:8px;height:8px;border-radius:50%;background:#3ddc84;box-shadow:0 0 8px #3ddc84}
.pill{font-size:11px;padding:2px 8px;border-radius:999px;background:#20262f;color:#8b95a3;margin-left:auto}
.pill.on{background:#173322;color:#5fdc9a}
.pill.busy{background:#1b2b40;color:#7fb3e6;animation:pulse 1.2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
#toast{position:fixed;left:50%;transform:translateX(-50%);bottom:24px;background:#2b6cb0;padding:10px 18px;border-radius:8px;opacity:0;transition:.2s}
#toast.show{opacity:1}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{display:inline-flex;align-items:center;gap:6px;background:#1b2029;border:1px solid #2a3140;border-radius:14px;padding:3px 10px;font-size:12.5px}
.chip b{cursor:pointer;color:#8a93a0;font-weight:400}
.chip b:hover{color:#e26d6d}


</style>
<style id="pixel-theme">
@font-face{font-family:"FusionPixel";src:url("/fonts/fusion-pixel-12px.woff2") format("woff2");font-display:swap}
html,body{background:#0D1117!important;color:#E6EDF3!important;font-family:"FusionPixel",ui-monospace,"Courier New",monospace!important}
*{border-radius:0!important;box-shadow:none!important}
header,main,.panel,.chatcard,.thumb,.chip,pre,textarea,input,select,button,.tab,.grphead,#toast{box-shadow:none!important}
.panel,.chatcard,.thumb,pre,.chip{background:#151B22!important;border:2px solid #2C3742!important;border-top-color:#4E6B7A!important;border-left-color:#4E6B7A!important;border-bottom-color:#0A0D11!important;border-right-color:#0A0D11!important}
.chatcard{margin-bottom:10px!important}
button{background:#2E9E92!important;color:#06201D!important;border:2px solid #6FE0D0!important;border-bottom-color:#123B36!important;border-right-color:#123B36!important;padding:6px 12px!important;font-family:inherit!important;cursor:pointer}
button:hover{filter:brightness(1.12)}
button:active{border-top-color:#123B36!important;border-left-color:#123B36!important;border-bottom-color:#6FE0D0!important;border-right-color:#6FE0D0!important}
button.ghost{background:#1B232C!important;border-color:#3A4A57!important;border-bottom-color:#0A0D11!important;border-right-color:#0A0D11!important;color:#DCE6EF!important}
button.danger{background:#A6433E!important;border-color:#E08A82!important;border-bottom-color:#2A100E!important;border-right-color:#2A100E!important;color:#FFF1EF!important}
input,select,textarea{background:#0A0E13!important;color:#E6EDF3!important;border:2px solid #2C3742!important;border-top-color:#0A0D11!important;border-left-color:#0A0D11!important;border-bottom-color:#3E5A66!important;border-right-color:#3E5A66!important;padding:6px 8px!important;font-family:inherit!important}
input:focus,select:focus,textarea:focus{outline:none!important;border-bottom-color:#6FE0D0!important;border-right-color:#6FE0D0!important}
textarea{line-height:1.9!important}
a{color:#6FE0D0!important}
small{color:#9AA7B4!important}
h1,h2,h3,h4{color:#9BE8DB!important;letter-spacing:1px!important}
nav.tabs .tab{padding:8px 10px!important;background:#131A21!important;color:#AEBBC8!important;border:2px solid #26313B!important;border-top-color:#3E5A66!important;border-left-color:#3E5A66!important;border-bottom-color:#0A0D11!important;border-right-color:#0A0D11!important;margin:0 0 8px 6px!important;font-size:13.5px!important}
nav.tabs .tab.on{background:#245E58!important;color:#D9FBF5!important;border-color:#6FE0D0!important;border-bottom-color:#0E2E2A!important;border-right-color:#0E2E2A!important;font-weight:700}
#fgHead,#wqHead,#cfgHead,#othHead{background:#1B3330!important;color:#D9FBF5!important;border:2px solid #4E6B7A!important;border-bottom-color:#0A0D11!important;border-right-color:#0A0D11!important}
.pill{background:#1B232C!important;color:#AEBBC8!important;border:1px solid #33414D!important}
.pill.on{background:#1E3327!important;color:#A8D8B0!important}
.pill.busy{background:#2A2432!important;color:#CDB8E6!important}
.gdot{background:#57C99A!important;box-shadow:none!important}
#toast{background:#245E58!important;border:2px solid #6FE0D0!important;color:#D9FBF5!important}
input[type=range]{-webkit-appearance:none;appearance:none;height:24px!important;background:transparent!important;border:0!important;padding:0!important;cursor:pointer}
input[type=range]::-webkit-slider-runnable-track{height:16px;background:#0A0E13;border:2px solid #2C3742;border-top-color:#0A0D11;border-left-color:#0A0D11;border-bottom-color:#3E5A66;border-right-color:#3E5A66}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:26px;margin-top:-7px;background:#2E9E92;border:2px solid #6FE0D0;border-bottom-color:#123B36;border-right-color:#123B36}
input[type=range]::-moz-range-track{height:14px;background:#0A0E13;border:2px solid #2C3742}
input[type=range]::-moz-range-thumb{width:18px;height:24px;border-radius:0;background:#2E9E92;border:2px solid #6FE0D0}
div:has(> input[type=range])::before{content:"◀";color:#4E6B7A;font-size:12px;margin-right:6px}
div:has(> input[type=range])::after{content:"▶";color:#4E6B7A;font-size:12px;margin-left:6px}
label:has(input[type=range])::after{content:"（拖动滑块调整）";color:#6B7B8A;font-size:11.5px;margin-left:6px}
/* ===== 鲸鱼海洋主题：淡蓝 / 低饱和 / 低对比 / 圆角 ===== */
html,body{background:#0B1118!important;background-image:none!important;color:#AEBEC9!important;min-height:100%!important}
body{background-attachment:fixed!important}
header{background:#0F1820!important;border-bottom:1px solid #1E2A36!important}
h1{color:#C2D0DB!important}
.panel,.chatcard,.thumb,pre,.chip{background:#111A23!important;border:1px solid #1E2A36!important;color:#AEBEC9!important;border-radius:10px!important}
nav.tabs .tab,.tab{background:#131D26!important;border:1px solid #1E2A36!important;color:#7D8C99!important;border-radius:8px!important}
nav.tabs .tab.on,.tab.on{background:#22323E!important;border-color:#48606F!important;color:#C2D0DB!important;font-weight:600}
#fgHead,#wqHead,#cfgHead,#othHead{background:#0F1821!important;color:#B4C4D0!important;border:1px solid #222F3B!important;border-top-color:#3C5261!important;border-radius:9px!important}
button{background:#18242E!important;border:1px solid #22303B!important;color:#AEBEC9!important;border-radius:8px!important}
button:hover{background:#1E2D39!important;color:#C4D2DD!important}
button.ghost{background:transparent!important;border-color:#22303B!important;color:#8A9AA7!important;border-radius:8px!important}
button.danger{background:#2E2429!important;border-color:#544850!important;color:#C6BCC2!important;border-radius:8px!important}
input,textarea,select{background:#0D161F!important;border:1px solid #1F2C37!important;color:#AEBEC9!important;border-radius:8px!important}
input::placeholder,textarea::placeholder{color:#4E5B66!important}
a{color:#74919D!important}
small{color:#647280!important}
.chips .chip,.chip{background:#14202A!important;color:#A5B6C2!important;border-color:#202B31!important;border-radius:999px!important}
.pill{background:#14202A!important;color:#8098A4!important;border-radius:999px!important}
tr:hover{background:rgba(120,160,190,.05)!important}
::-webkit-scrollbar{background:#0B1118}
::-webkit-scrollbar-thumb{background:#1E2A36;border-radius:8px}
img.thumb,.thumb img{border-radius:8px!important}
</style>
<header><h1>dsh 控制台</h1><span id="status"><small>加载中…</small></span>
<span style="flex:1"></span><button class="ghost" onclick="load()">刷新</button><button onclick="restart()">重启 DSH</button></header>
<main>
<div class="layout">
<nav class="tabs" id="tabs"></nav>
<div class="content">
<div id="panels"></div>

<div class="panel" id="p-slang"><div class="row" style="justify-content:space-between"><div style="display:flex;gap:8px;align-items:center"><button class="ghost" onclick="loadSlang()">刷新</button><small>为了让 bot 听懂骂人的话用的，被骂时也会回怼</small></div><span style="display:flex;gap:8px;align-items:center"><span id="slangPager" style="display:flex;gap:6px;align-items:center;font-size:12px;color:#8a93a0"></span></span></div>
<div class="row" style="gap:6px;margin-bottom:8px"><input id="slangTerm" placeholder="词" style="width:120px"><input id="slangMeaning" placeholder="意思" style="flex:1"><button onclick="addSlang()">添加</button></div>
<div id="slangList"></div></div>
<div class="panel" id="p-banned"><div class="row" style="justify-content:space-between"><div style="display:flex;gap:8px;align-items:center"><button class="ghost" onclick="loadBanned()">刷新</button><small>生成回复时直接从文本里删掉这些词</small></div><span style="display:flex;gap:8px;align-items:center"><span id="bannedPager" style="display:flex;gap:6px;align-items:center;font-size:12px;color:#8a93a0"></span></span></div>
<div class="row" style="gap:6px;margin-bottom:8px"><input id="bannedWord" placeholder="词" style="flex:1"><button onclick="addBanned()">添加</button></div>
<div id="bannedList"></div></div>
<div class="panel" id="p-settings">
<div class="chatcard" style="display:block">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><b>QQ 登录</b><button class="ghost" onclick="loadQqQr()">刷新二维码</button><span id="qqQrTip" style="color:#8a93a0;font-size:12px"></span></div>
  <div id="qqSelfBox" style="display:none;align-items:center;gap:10px;margin-bottom:8px">
    <img id="qqSelfAvatar" alt="" style="width:48px;height:48px;border-radius:50%;object-fit:cover;background:#0b0f14">
    <div><div id="qqSelfId" style="font-size:13px;color:#dbe3ee"></div><div style="color:#7d8794;font-size:11px">已登录</div></div>
  </div>
  <img id="qqQrImg" alt="QQ 登录二维码" style="width:180px;height:180px;background:#fff;border-radius:8px;padding:6px;object-fit:contain">
  <div style="color:#7d8794;font-size:11px;margin-top:6px">用手机 QQ 扫码登录 NapCat；过期点刷新。登录成功后机器人会自动上线。</div>
</div>
<div id="settingsFields"></div>
<div id="winHelp" style="display:none;position:fixed;z-index:99;width:min(780px,94vw);max-height:76vh;overflow:auto;background:#1b222b;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:20px 24px;box-shadow:0 12px 40px rgba(0,0,0,.5)">
  <div style="font-size:17px;font-weight:600;margin-bottom:10px;color:#dbe3ee">接话窗口使用说明</div>
  <div style="font-size:13.5px;line-height:1.9;color:#c8d0da">
    就是它「不 @ 它，也会接着跟你聊」的那段时间。有人 @ 它、叫它名字，或者它刚回过你之后，窗口就打开了；你每再发一句，窗口从头重新计时。窗口还在，它就当你们还在一起聊；窗口结束就把对话关掉，不再接话。
  </div>
  <div style="font-size:14.5px;font-weight:600;margin:14px 0 8px;color:#dbe3ee">进入 / 离开条件</div>
  <div style="font-size:13.5px;line-height:1.9;color:#c8d0da">
    <b>进入</b>：它回你一条；或你 @ 它、叫它名字。<br>
    <b>续期</b>：窗口内它每回你一次，重新计时；你一直说就一直续。<br>
    <b>离开</b>：窗口内你不再说话，窗口自然结束；主动找话在窗口中间判定，说完也不会续期。
  </div>
  <div style="font-size:14.5px;font-weight:600;margin:14px 0 8px;color:#dbe3ee">怎么调（新手）</div>
  <div style="font-size:13.5px;line-height:1.9;color:#c8d0da">
    想黏人调大（3～5 分钟）；想安静调小，但最少 1 分钟；太短它以为你走了，太长它爱插嘴。
  </div>
  <svg viewBox="0 0 720 230" style="width:100%;height:auto;margin-top:12px" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="ah2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#8a93a0"/></marker></defs>
    <line x1="30" y1="150" x2="690" y2="150" stroke="#8a93a0" stroke-width="1.5" marker-end="url(#ah2)"/>
    <text x="30" y="176" fill="#7d8794" font-size="11">时间</text>
    <line x1="90" y1="150" x2="90" y2="60" stroke="#6ea8fe" stroke-width="1.5"/>
    <circle cx="90" cy="150" r="5" fill="#6ea8fe"/>
    <text x="40" y="46" fill="#a9c4f5" font-size="12">进入：回你 / @机器人 / 叫机器人名字</text>
    <rect x="100" y="130" width="320" height="14" rx="7" fill="rgba(110,168,254,.35)" stroke="rgba(110,168,254,.7)"/>
    <text x="104" y="170" fill="#a9c4f5" font-size="12">窗口打开（默认 120 秒，最少 60 秒）</text>
    <line x1="190" y1="150" x2="190" y2="106" stroke="#6ea8fe" stroke-width="1.2" stroke-dasharray="3,3"/>
    <text x="150" y="98" fill="#8a93a0" font-size="11">又说话 → 重新计时</text>
    <line x1="320" y1="150" x2="320" y2="106" stroke="#6ea8fe" stroke-width="1.2" stroke-dasharray="3,3"/>
    <text x="300" y="98" fill="#8a93a0" font-size="11">再说 → 再续</text>
    <line x1="260" y1="150" x2="260" y2="112" stroke="#f0b04f" stroke-width="1.5"/>
    <circle cx="260" cy="150" r="5" fill="#f0b04f"/>
    <text x="176" y="70" fill="#f0b04f" font-size="12">窗口中间：判定一次主动找话</text>
    <line x1="430" y1="150" x2="430" y2="112" stroke="#8a93a0" stroke-width="1.5"/>
    <circle cx="430" cy="150" r="5" fill="#8a93a0"/>
    <rect x="430" y="158" width="240" height="10" rx="5" fill="rgba(240,176,79,.25)" stroke="rgba(240,176,79,.6)"/>
    <text x="436" y="192" fill="#8a93a0" font-size="11">窗口结束：关闭对话，不再接话</text>
    <text x="436" y="210" fill="#8a93a0" font-size="11">（主动说了一句也不续期）</text>
  </svg>
</div>
      <div id="permBlock" style="background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:16px 16px 10px;margin-top:6px">
      <div style="display:flex;justify-content:flex-start;margin:0 0 16px"><span id="roleHelpBtn" style="display:inline-flex;align-items:center;gap:8px;cursor:help;font-size:14px;color:#cfd8e3;user-select:none"><span style="display:inline-flex;width:20px;height:20px;border-radius:50%;border:1.5px solid #cfd8e3;align-items:center;justify-content:center;font-size:13px">!</span>权限说明</span></div>
      <div style="font-size:12.5px;color:#8a93a0;margin-bottom:4px">管理员名单</div>
      <div id="ownersChips" class="chips"></div>
      <div class="row" style="gap:6px;margin:6px 0 12px">
        <input id="ownerAdd" placeholder="加管理员 QQ" style="width:150px">
        <button class="ghost" onclick="addChip('owner')">添加</button>
      </div>
      <div style="font-size:12.5px;color:#8a93a0;margin:12px 0 4px">DSH 后台权限名单（最高权限，可用 /dsh 与 shell）</div>
      <div id="adminsChips" class="chips"></div>
      <div class="row" style="gap:6px;margin-top:6px">
        <input id="adminAdd" placeholder="加 DSH 后台权限 QQ" style="width:150px">
        <button class="ghost" onclick="addChip('admin')">添加</button>
      </div>
      </div>
<div class="row" style="display:none"><button onclick="saveAllSettings()">保存</button></div></div>
<div id="roleHelp" style="display:none;position:fixed;z-index:99;width:min(720px,94vw);max-height:76vh;overflow:auto;background:#1b222b;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:20px 24px;box-shadow:0 12px 40px rgba(0,0,0,.5)">
  <div style="font-size:17px;font-weight:600;margin-bottom:10px;color:#dbe3ee">权限说明</div>
  <div style="font-size:14.5px;font-weight:600;margin:14px 0 8px;color:#9fc4ff">管理员能做什么</div>
  <div style="font-size:13.5px;line-height:1.9;color:#c8d0da">
    · <b>跨群 / 私聊说话、@ 人</b>：例「去测试群说一声今晚八点开会」；也可以在私聊里遥控，例「去测试群 @ 一下老王，说我晚点到」<br>
    · <b>处理申请</b>：例「看看有没有好友申请，先别同意」「有人申请进群的话先问我」<br>
    · <b>退群</b>：例「把那个广告群退了」<br>
    · <b>管群</b>：例「把@某人 禁言十分钟」「把这条广告撤回」「给他改成群名片老王」<br>
    · <b>删表情</b>：例「把表情库里那张糊了的删掉」<br>
    · <b>教它认人</b>：例「以后管 QQ 123456789 叫老王」「把 123456789 的档案记成：楼下卖水果的，爱发猫图」，之后它就会按这个叫、按这个聊<br>
    · <b>加禁词</b>：例「以后别说『笑死』」<br>
    · <b>组合任务</b>：例「帮我去网上找一下最近的 XX 新闻，然后写一份群公告发到测试群」<br>
    · <b>命令</b>：<b>/mood</b> 看好感度，<b>/setmood 0-100</b> 设定，例「/setmood 80」
  </div>
  <div style="font-size:14.5px;font-weight:600;margin:16px 0 8px;color:#f0b04f">DSH 后台权限怎么用</div>
  <div style="font-size:13.5px;line-height:1.9;color:#c8d0da">
    这个权限就是让名单里的人通过机器人账号去访问 DSH。<br>
    · <b>/dsh 对话</b>：例「/dsh 看下服务器还剩多少磁盘」<br>
    · <b>服务器命令</b>：例「用 shell 看看哪个进程占内存最多」「用 shell 重启一下 dsh-qqbot」<br>
    · <b>改配置 / 装插件</b>：例「把接话窗口改成 180 秒」「帮我装个新插件」<br>
    · <b>加名单</b>：例「把 QQ 123456789 加进 DSH 后台权限」，点底部「保存」生效<br>
    <span style="color:#8a93a0">以上只是示范，不是只靠某个特殊词语触发，请自行探索。</span>
  </div>
</div>

<div class="panel" id="p-memes">
  <div class="row" style="justify-content:space-between;align-items:center">
    <span id="memeHelpBtn" style="display:inline-flex;align-items:center;gap:8px;cursor:help;font-size:14px;color:#cfd8e3;user-select:none"><span style="display:inline-flex;width:20px;height:20px;border-radius:50%;border:1.5px solid #cfd8e3;align-items:center;justify-content:center;font-size:13px">!</span>梗百科/知识库说明</span>
    <span style="display:flex;gap:10px;align-items:center;font-size:12px;color:#8a93a0"><span id="memeCount"></span><span id="memePager" style="display:flex;gap:6px;align-items:center"></span></span>
  </div>

  <div id="memeHelp" style="display:none;position:fixed;z-index:99;width:min(520px,94vw);background:#1b222b;border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,.5);font-size:13px;line-height:1.8;color:#c8d0da">
    <div style="font-size:15px;font-weight:600;margin-bottom:8px;color:#dbe3ee">梗百科/知识库说明</div>
    插件内置的梗百科/知识库不设初始内容。使用者可以根据自己或群聊的需要，让 DSH 去找内容往里填，避免一次塞进太多垃圾信息。<br><br>
    · 「内容」不要求固定格式：梗是什么、出处、什么场合用，写清楚就行。<br>
    · 「标签」可选，方便搜索，比如「游戏」「主播」。<br>
    · 每页 8 条，搜索按标题、内容、标签匹配。
  </div>
  <div class="row" style="gap:6px">
    <input id="memeSearch" placeholder="搜索标题 / 内容 / 标签" style="flex:1;min-width:0" onkeydown="if(event.key==='Enter') loadMemes(0)">
    <button onclick="loadMemes(0)">搜索</button>
  </div>
  <div id="memeList" style="margin-top:8px"></div>
  <div class="row" style="gap:6px;margin-top:10px">
    <input id="memeNewTitle" placeholder="标题" style="width:180px">
    <input id="memeNewTag" placeholder="标签（可选）" style="width:140px">
    <button onclick="addMeme()">新增</button>
  </div>
</div>
<div class="panel" id="p-stickers"><div class="row"><button id="pickSticker">上传表情</button><input type="file" id="file" accept="image/*" multiple style="display:none"><small id="stickerCount"></small></div><div class="grid" id="grid"></div></div>

<div class="panel" id="p-chats">
  <div class="row" style="justify-content:space-between;align-items:center">
    <span id="chatHelpBtn" style="display:inline-flex;align-items:center;gap:8px;cursor:help;font-size:14px;color:#cfd8e3;user-select:none"><span style="display:inline-flex;width:20px;height:20px;border-radius:50%;border:1.5px solid #cfd8e3;align-items:center;justify-content:center;font-size:13px">!</span>摘要说明</span>
    <button class="ghost" onclick="loadChats()">刷新</button>
  </div>
  <div style="color:#7d8794;font-size:11.5px;line-height:1.7;margin:0 0 8px">按最后活跃排序，每页 3 个</div>
  <div id="chatHelp" style="display:none;position:fixed;z-index:99;width:min(560px,94vw);background:#1b222b;border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,.5);font-size:13px;line-height:1.8;color:#c8d0da">
    <div style="font-size:15px;font-weight:600;margin-bottom:8px;color:#dbe3ee">会话摘要规则</div>
    · 一段会话聊满 <b style="color:#f0b04f">30 次</b>（一次 = 对方发一条消息它处理一遍，不是 30 条消息）就自动换新会话，旧的压成一段摘要。<br>
    · 累计字符超过 <b style="color:#f0b04f">40 万</b>也会触发；没有空闲重置，空闲不会换会话。<br>
    · 上面两个数都能在「行为参数」里调（会话次数上限、会话字符上限）。<br>
    · 摘要按时间倒序存，点会话上的「摘要」会弹窗显示，最新的在左上。<br>
    · 每个会话最多存 <b style="color:#8a93a0">9 段</b>（这个写死在代码里，参数里调不了），满了删最旧的。<br>
    · 摘要也会带进新会话，所以换会话不会全忘。
  </div>
  <div id="sumOverlay" style="display:none;position:fixed;inset:0;z-index:98;background:rgba(0,0,0,.62);align-items:center;justify-content:center">
    <div style="width:min(760px,94vw);max-height:86vh;overflow:auto;background:#181b1f;border:2px solid #b9c0c8;padding:16px 18px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <b id="sumTitle" style="color:#dbe3ee">会话摘要</b>
        <button class="danger" id="sumClose" style="padding:2px 9px">×</button>
      </div>
      <div id="sumGrid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px"></div>
    </div>
  </div>
  <div style="background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px 16px;margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <span style="font-size:14.5px;font-weight:600;color:#dbe3ee">群聊 <span id="chatGCount" style="color:#8a93a0;font-size:12px;font-weight:400"></span></span>
      <span id="chatGPager" style="display:flex;gap:6px;align-items:center;font-size:12px;color:#8a93a0"></span>
    </div>
    <div id="chatGroups" style="height:432px;overflow:hidden"></div>
  </div>
  <div style="background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px 16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <span style="font-size:14.5px;font-weight:600;color:#dbe3ee">私聊 <span id="chatPCount" style="color:#8a93a0;font-size:12px;font-weight:400"></span></span>
      <span id="chatPPager" style="display:flex;gap:6px;align-items:center;font-size:12px;color:#8a93a0"></span>
    </div>
    <div id="chatPrivs" style="height:432px;overflow:hidden"></div>
  </div>
</div>
<div class="panel" id="p-tics"><div class="row" style="justify-content:space-between"><div style="display:flex;gap:8px;align-items:center"><button class="ghost" onclick="loadTics()">刷新</button><small>具体模仿规则</small></div><span style="display:flex;gap:8px;align-items:center"><span id="ticPager" style="display:flex;gap:6px;align-items:center;font-size:12px;color:#8a93a0"></span></span></div>
<div style="color:#7d8794;font-size:11.5px;line-height:1.75;margin:0 0 8px">自动收录：2–6 字的话 3 天内出现 3 次 → 口头禅；和上下文对不上的长句 → 提炼成句式。相似就覆盖旧的，最多 80 条，满了删最旧的。使用频率：每 30 次对话最多用 5 次。</div>
<div class="row" style="gap:6px;margin-bottom:8px"><input id="ticScenario" placeholder="场景：这条用在哪" style="flex:1"><input id="ticPhrase" placeholder="说法" style="width:180px"><select id="ticKind" style="width:100px" onchange="var e=document.getElementById('ticScenario'); if(e) e.style.display=this.value==='pattern'?'none':''"><option value="phrase">口头禅</option><option value="pattern">句式</option></select><button onclick="addTic()">添加</button></div>
<div id="ticList"></div></div>
<div class="panel" id="p-reminders">
  <div class="row" style="justify-content:space-between;align-items:center">
    <span id="remindHelpBtn" style="display:inline-flex;align-items:center;gap:8px;cursor:help;font-size:14px;color:#cfd8e3;user-select:none"><span style="display:inline-flex;width:20px;height:20px;border-radius:50%;border:1.5px solid #cfd8e3;align-items:center;justify-content:center;font-size:13px">!</span>待办说明</span>
    <button class="ghost" onclick="loadReminders()">刷新</button>
  </div>
  <div style="color:#7d8794;font-size:11.5px;line-height:1.7;margin:0 0 8px">全局共 10 条上限，到点 @ 发起人</div>
  <div id="remindHelp" style="display:none;position:fixed;z-index:99;width:min(520px,94vw);background:#1b222b;border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,.5);font-size:13px;line-height:1.8;color:#c8d0da">
    <div style="font-size:15px;font-weight:600;margin-bottom:8px;color:#dbe3ee">待办规则</div>
    · 最多 <b>10 条</b>，全部聊天合计；满了要先取消几条。<br>
    · 每条独立计时，到点各自提醒，互不影响、不分先后。<br>
    · 可以说提醒谁（昵称或 QQ），不说就提醒自己。<br>
    · 「某人出现就 @ 我」：按群监听，默认只提醒一次，也可以要求每次都提醒。<br>
    · 不支持连续重复 @：QQ 会拦截同一人短时间内的重复 @，只能提醒一次。<br>
    · 取消按关键词匹配，命中就删。
    <div style="margin-top:10px;color:#9aa4b2">用法示例</div>
    · 「明早七点喊我起床」<br>
    · 「一小时后喊小明喝水」→ 到点 @ 小明<br>
    · 「小明出现就 @ 我」→ 只提醒一次<br>
    · 「每次小明出现都 @ 我」→ 一直提醒，直到取消<br>
    · 「把喝水那个提醒取消了」
  </div>
  <div id="remindList"></div></div>
<div class="panel" id="p-contacts">
  <div class="row" style="justify-content:space-between"><div style="display:flex;gap:8px;align-items:center"><button class="ghost" onclick="loadContacts()">刷新</button><small>QQ 号 → 称呼，聊天时会照这个叫</small></div><span id="contactPager" style="display:flex;gap:6px;align-items:center;font-size:12px;color:#8a93a0"></span></div>
  <div id="contactList"></div>
  <div class="row" style="gap:8px;margin-top:8px">
    <input id="cQQ" placeholder="QQ 号" style="width:140px">
    <input id="cName" placeholder="名字" style="width:140px"><input id="cNick" placeholder="称呼">
    <input id="cNote" placeholder="简介（可选）" style="width:min(320px,100%)">
    <button onclick="saveContact()">添加/修改</button>
  </div>
</div>

<div class="panel" id="p-logs"><div class="row"><button class="ghost" onclick="loadLogs()">刷新日志</button></div><pre id="logs"></pre></div>
</div>
</div>
</main>
<div id="toast"></div>
<script>
const T = localStorage.getItem('token') || prompt('访问令牌') || '';
localStorage.setItem('token', T);
let FILES = [];
let STICKERS = [];
function renderGrid(){
  document.getElementById('stickerCount').textContent = '('+STICKERS.length+' 张)';
  document.getElementById('grid').innerHTML = STICKERS.map(n=>'<div class="thumb"><img loading="lazy" data-thumb="/api/sticker?thumb=1&name='+encodeURIComponent(n)+'&t='+encodeURIComponent(T)+'" data-anim="/api/sticker?anim=1&name='+encodeURIComponent(n)+'&t='+encodeURIComponent(T)+'" src="/api/sticker?thumb=1&name='+encodeURIComponent(n)+'&t='+encodeURIComponent(T)+'"><button onclick="del(\\''+n.replace(/'/g,"")+'\\')">×</button></div>').join('');
  watchStickerAnims();
}
function watchStickerAnims(){
  try {
    const imgs = document.querySelectorAll('#grid img[data-anim]');
    if (!('IntersectionObserver' in window)) {
      imgs.forEach(function(im){ im.src = im.dataset.anim; });
      return;
    }
    if (!window.__stickObs) {
      window.__stickObs = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if (!en.isIntersecting) return;
          const im = en.target;
          if (im.dataset.anim && im.src !== im.dataset.anim) im.src = im.dataset.anim;
          window.__stickObs.unobserve(im);
        });
      }, { rootMargin: '200px' });
    }
    imgs.forEach(function(im){ window.__stickObs.observe(im); });
  } catch (e) {}
}
async function refreshStickers(){
  const s = await api('/api/state');
  STICKERS = s.stickers;
  renderGrid();
}
async function api(path, opts={}) {
  opts.headers = Object.assign({'x-admin-token': T, 'content-type':'application/json'}, opts.headers||{});
  const r = await fetch(path, opts);
  if (!r.ok) throw new Error(await r.text());
  return r.headers.get('content-type')?.includes('json') ? r.json() : r.text();
}
function askConfirm(message, onOk){
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:999;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center';
  const box = document.createElement('div');
  box.style.cssText = 'background:#181b1f;border:2px solid #b9c0c8;padding:16px 18px;min-width:260px;max-width:92vw;color:#e6e9ed;font-size:13px;line-height:1.7';
  const msg = document.createElement('div');
  msg.textContent = message;
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-top:14px';
  const no = document.createElement('button');
  no.className = 'ghost';
  no.textContent = '取消';
  const yes = document.createElement('button');
  yes.textContent = '确定';
  row.appendChild(no); row.appendChild(yes);
  box.appendChild(msg); box.appendChild(row); ov.appendChild(box);
  document.body.appendChild(ov);
  no.onclick = function(){ ov.remove(); };
  yes.onclick = async function(){ ov.remove(); try { await onOk(); } catch (e) { toast('操作失败'); } };
}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1500)}
function tab(id){
  document.querySelectorAll('.tab').forEach(e=>e.classList.toggle('on', e.dataset.id===id));
  document.querySelectorAll('.panel').forEach(e=>e.classList.toggle('on', e.id==='p-'+id));
  if(id==='logs') loadLogs();
  if(id==='chats') loadChats();
  if(id==='tics') loadTics();
  if(id==='reminders') loadReminders();
  if(id==='contacts') loadContacts();
  if(id==='settings') { loadAdmins(); loadQqQr(); }
  if(id==='slang') loadSlang();
  if(id==='banned') loadBanned();
  if(id==='memes') loadMemes();
  if(id==='config') { loadConfig(); loadBiliMe(); loadBiliMem(); }
  if(id==='proxy') loadProxy();
  if(id==='tieba') loadTieba();
}
async function loadConfig(){
  try {
    const st = await api('/api/state');
    const s = (st && st.settings) || {};
    document.getElementById('cfg-arkKey').value = s.arkKey || '';
  } catch (e) { toast('读取失败'); }
}
async function loadProxy(){
  try {
    const st = await api('/api/state');
    const s = (st && st.settings) || {};
    document.getElementById('px-proxyUrl').value = s.proxyUrl || '';
    document.getElementById('px-clashApi').value = s.clashApi || '';
    document.getElementById('px-clashGroup').value = s.clashGroup || '';
  } catch (e) { toast('读取失败'); }
}
async function saveProxy(silent){
  const body = {
    proxyUrl: document.getElementById('px-proxyUrl').value.trim(),
    clashApi: document.getElementById('px-clashApi').value.trim(),
    clashGroup: document.getElementById('px-clashGroup').value.trim()
  };
  await api('/api/settings', { method:'POST', body: JSON.stringify(body) });
  if (!silent) toast('已保存');
}
let __biliQrTimer = null;
function biliFaceUrl(u){
  const t = (function(){ try { return localStorage.getItem('token') || ''; } catch (e) { return ''; } })();
  return '/api/bili/avatar?u=' + encodeURIComponent(u) + '&t=' + encodeURIComponent(t);
}
let BILI_MEM = [], BILI_MEM_PAGE = 0, BILI_OPEN = new Set();
const BILI_MEM_SIZE = 10;
function renderBiliMem(){
  const box = document.getElementById('biliMemList');
  if (!box) return;
  if (BILI_MEM.length === 0) { box.innerHTML = '<div style="color:#7d8794;font-size:12px;padding:6px">还没有记录</div>'; return; }
  const pages = Math.max(1, Math.ceil(BILI_MEM.length / BILI_MEM_SIZE));
  BILI_MEM_PAGE = Math.max(0, Math.min(pages - 1, BILI_MEM_PAGE));
  const rows = BILI_MEM.slice(BILI_MEM_PAGE * BILI_MEM_SIZE, BILI_MEM_PAGE * BILI_MEM_SIZE + BILI_MEM_SIZE);
  box.innerHTML = rows.map(function(x){
    const bv = String(x.bvid || '');
    const open = BILI_OPEN.has(bv);
    const summary = String(x.summary || '');
    const reaction = String(x.reaction || '');
    return '<div style="padding:6px 4px;border-bottom:1px solid rgba(255,255,255,.05)">'
      + '<div style="display:flex;gap:8px;align-items:center">'
      + '<span data-exp="' + esc(bv) + '" style="cursor:pointer;color:#8a93a0;width:12px;flex:none;user-select:none">' + (open ? '▾' : '▸') + '</span>'
      + '<a href="' + esc(String(x.url || '')) + '" target="_blank" style="flex:1;min-width:0;color:#9fc4ff;font-size:12.5px;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(String(x.title || bv)) + '</a>'
      + '<button data-del="' + esc(bv) + '" style="background:none;border:none;color:#e05555;font-size:16px;cursor:pointer;padding:0 4px;line-height:1">×</button>'
      + '</div>'
      + '<div style="color:#7d8794;font-size:11px;margin-left:20px">' + esc((x.tags || []).join(' / ')) + '</div>'
      + (open ? '<div style="margin:6px 0 0 20px;color:#b9c2cf;font-size:12px;line-height:1.6;white-space:pre-wrap">' + ((summary || reaction) ? (esc(summary) + (reaction ? '\\n—— ' + esc(reaction) : '')) : '（还没有摘要）') + '</div>' : '')
      + '</div>';
  }).join('');
  const pager = document.getElementById('biliMemPager');
  if (pager) {
    pager.innerHTML = BILI_MEM.length > 0
      ? '<button class="ghost" data-pg="prev"' + (BILI_MEM_PAGE <= 0 ? ' disabled' : '') + '>‹</button><span style="color:#8a93a0;font-size:12px">' + (BILI_MEM_PAGE + 1) + ' / ' + pages + '</span><button class="ghost" data-pg="next"' + (BILI_MEM_PAGE >= pages - 1 ? ' disabled' : '') + '>›</button>'
      : '';
    pager.querySelectorAll('[data-pg]').forEach(function(b){ b.onclick = function(){ BILI_MEM_PAGE += (b.getAttribute('data-pg') === 'next' ? 1 : -1); renderBiliMem(); }; });
  }
  box.querySelectorAll('[data-exp]').forEach(function(el){ el.onclick = function(){ const bv = el.getAttribute('data-exp'); if (BILI_OPEN.has(bv)) BILI_OPEN.delete(bv); else BILI_OPEN.add(bv); renderBiliMem(); }; });
  box.querySelectorAll('[data-del]').forEach(function(b){ b.onclick = function(){ delBiliMem(b.getAttribute('data-del')); }; });
}
async function loadBiliMem(){
  try {
    BILI_MEM = await api('/api/bili/memories');
    BILI_MEM_PAGE = 0;
    renderBiliMem();
  } catch (e) {}
}
async function delBiliMem(bv){
  try { await api('/api/bili/memories', { method:'DELETE', body: JSON.stringify({ bvid: bv }) }); toast('已删除'); loadBiliMem(); } catch (e) { toast('删除失败'); }
}
async function loadQqQr(){
  try {
    const img = document.getElementById('qqQrImg');
    const tip = document.getElementById('qqQrTip');
    if (!img) return;
    try {
      const st = await api('/api/state');
      if (st && st.status && st.status.napcat) {
        if (window.__qqQrTimer) { clearInterval(window.__qqQrTimer); window.__qqQrTimer = null; }
        img.style.display = 'none';
        if (tip) tip.textContent = 'QQ 已在线';
        try {
          const me = await api('/api/self');
          const box = document.getElementById('qqSelfBox');
          const av = document.getElementById('qqSelfAvatar');
          const idEl = document.getElementById('qqSelfId');
          if (me && me.id) {
            if (box) box.style.display = 'flex';
            if (av) av.src = 'https://q1.qlogo.cn/g?b=sdk&nk=' + encodeURIComponent(me.id) + '&s=100';
            if (idEl) idEl.textContent = (me.nick ? me.nick + ' · ' : '') + me.id;
          }
        } catch (e) {}
        return;
      }
      const sb = document.getElementById('qqSelfBox');
      if (sb) sb.style.display = 'none';
    } catch (e) {}
    img.style.display = 'block';
    img.src = '/qr?t=' + encodeURIComponent(T) + '&fresh=1&x=' + Date.now();
    if (window.__qqQrTimer) clearInterval(window.__qqQrTimer);
    window.__qqQrTimer = setInterval(function(){ try { img.src = '/qr?t=' + encodeURIComponent(T) + '&fresh=1&x=' + Date.now(); } catch (e) {} }, 120000);
    if (tip) tip.textContent = '二维码每 20 秒自动更新';
    img.onerror = function(){ if (tip) tip.textContent = '取不到二维码，检查 NapCat 是否在线'; };
    img.onload = function(){ if (tip) tip.textContent = '扫码后用手机确认'; };
  } catch (e) {}
}
function __debounce(fn, ms){
  let t = null;
  return function(){ const args = arguments; if (t) clearTimeout(t); t = setTimeout(function(){ t = null; fn.apply(null, args); }, ms); };
}
function bindAutoSave(){
  try {
    const saveSet = __debounce(function(){ saveSettings(true).then(function(){ try { if (LIST_LOADED) return saveAdmins(); } catch (e) {} }).catch(function(){}); }, 700);
    document.querySelectorAll('#settingsFields input, #settingsFields select, #settingsFields textarea').forEach(function(el){
      el.addEventListener('change', saveSet);
      el.addEventListener('input', saveSet);
    });
    if (FILES && FILES.length) {
      FILES.forEach(function(f){
        const ta = document.getElementById('ta-' + f.key);
        if (!ta) return;
        const fn = __debounce(function(){ saveFile(f.name, f.key, true); }, 1200);
        ta.addEventListener('input', fn);
        ta.addEventListener('change', fn);
      });
    }
    const bn = document.getElementById('botNameInput');
    if (bn) { const fn = __debounce(function(){ saveBotName(true); }, 900); bn.addEventListener('input', fn); }
    const cfgMap = [['cfg-arkKey', saveConfig], ['px-proxyUrl', saveProxy], ['px-clashApi', saveProxy], ['px-clashGroup', saveProxy], ['tb-baiduCookie', saveTieba]];
    cfgMap.forEach(function(pair){
      const el = document.getElementById(pair[0]);
      if (!el) return;
      const fn = __debounce(function(){ try { pair[1](true); } catch (e) {} }, 900);
      el.addEventListener('input', fn);
      el.addEventListener('change', fn);
    });
  } catch (e) {}
}
async function loadBiliMe(){
  try {
    const r = await api('/api/bili/me');
    const st = document.getElementById('biliQrStatus');
    const nm = document.getElementById('biliName');
    const av = document.getElementById('biliAvatar');
    if (r && r.loggedIn) {
      st.textContent = '已登录';
      nm.textContent = r.name || '';
      if (r.face) { av.src = biliFaceUrl(r.face); av.style.display = 'block'; }
    } else {
      st.textContent = '未登录';
      nm.textContent = '';
      av.style.display = 'none';
    }
  } catch (e) {}
}
async function biliQrStart(){
  if (__biliQrTimer) { clearInterval(__biliQrTimer); __biliQrTimer = null; }
  const box = document.getElementById('biliQrBox');
  const img = document.getElementById('biliQrImg');
  const st = document.getElementById('biliQrStatus');
  st.textContent = '正在生成二维码…';
  try {
    const r = await api('/api/bili/qr/new', { method: 'POST', body: '{}' });
    if (!r || !r.ok) throw new Error(r && r.error || '生成失败');
    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=' + encodeURIComponent(r.url);
    box.style.display = 'block';
    st.textContent = '请用 B站 App 扫码';
    __biliQrTimer = setInterval(async function(){
      try {
        const q = await api('/api/bili/qr/poll?key=' + encodeURIComponent(r.key));
        if (!q || !q.ok) return;
        if (q.code === 86101) { st.textContent = '等待扫码…'; return; }
        if (q.code === 86090) { st.textContent = '已扫码，请在手机上确认'; return; }
        if (q.code === 0) {
          clearInterval(__biliQrTimer); __biliQrTimer = null;
          box.style.display = 'none';
          st.textContent = '已登录';
          const nm = document.getElementById('biliName');
          if (nm) nm.textContent = q.name || '';
          const av = document.getElementById('biliAvatar');
          if (av && q.face) { av.src = biliFaceUrl(q.face); av.style.display = 'block'; }
          toast('登录成功');
          return;
        }
        if (q.code === 86038) { st.textContent = '二维码已过期，请重新生成'; clearInterval(__biliQrTimer); __biliQrTimer = null; }
      } catch (e) {}
    }, 2000);
  } catch (e) { st.textContent = '生成失败：' + String(e); }
}
async function loadTieba(){
  try {
    const st = await api('/api/state');
    const s = (st && st.settings) || {};
    document.getElementById('tb-baiduCookie').value = s.baiduCookie || '';
  } catch (e) { toast('读取失败'); }
}
async function saveTieba(silent){
  await api('/api/settings', { method:'POST', body: JSON.stringify({ baiduCookie: document.getElementById('tb-baiduCookie').value.trim() }) });
  if (!silent) toast('已保存');
}
async function saveAllConfig(){
  await saveConfig();
  await saveProxy();
  await saveTieba();
  toast('配置已保存');
}
async function saveConfig(silent){
  const el = document.getElementById('cfg-arkKey');
  if (!el) return;
  await api('/api/settings', { method:'POST', body: JSON.stringify({ arkKey: el.value.trim() }) });
  if (!silent) toast('已保存');
}
async function load(){
  const s = await api('/api/state');
  FILES = s.files;
  document.getElementById('status').innerHTML = '<span class="sdot" style="background:'+(s.status.dsh==='active'?'#3ddc84':'#e05555')+'"></span><small>DSH '+(s.status.dsh==='active'?'在线':'离线')+'</small> <span class="sdot" style="background:'+(s.status.napcat?'#3ddc84':'#e05555')+'"></span><small>QQ '+(s.status.napcat?'在线':'离线')+'</small>';
  const __fileTabs = FILES.map(f=>'<div class="tab" data-id="'+f.key+'" onclick="tab(\\''+f.key+'\\')">'+f.label+'</div>').join('');
  document.getElementById('tabs').innerHTML =
    '<div style="margin:12px 0 10px">'
    + '<div id="fgHead" style="display:flex;align-items:center;gap:7px;cursor:pointer;user-select:none;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.10);border-radius:9px;padding:12px;font-size:16px;font-weight:600;color:#e6edf6">'
    + '<span id="fgArrow" style="font-size:12px;color:#9aa4b2">▾</span><span>肥鱼底色</span>'
    + '<span id="fgHelp" style="margin-left:auto;display:inline-flex;width:18px;height:18px;border-radius:50%;border:1.5px solid #9aa4b2;align-items:center;justify-content:center;font-size:12px;font-weight:400;color:#9aa4b2;cursor:help">!</span>'
    + '</div>'
    + '<div id="fgTabs" style="margin-top:10px;display:flex;flex-direction:column;gap:0">' + __fileTabs + '</div>'
    + '</div>'
    + '<div style="margin:0 0 6px">'
    + '<div id="wqHead" style="display:flex;align-items:center;gap:7px;cursor:pointer;user-select:none;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.10);border-radius:9px;padding:12px;font-size:16px;font-weight:600;color:#e6edf6">'
    + '<span id="wqArrow" style="font-size:12px;color:#9aa4b2">▾</span><span>肥鱼库</span>'
    + '<span id="wqHelp" style="margin-left:auto;display:inline-flex;width:18px;height:18px;border-radius:50%;border:1.5px solid #9aa4b2;align-items:center;justify-content:center;font-size:12px;font-weight:400;color:#9aa4b2;cursor:help">!</span>'
    + '</div>'
    + '<div id="wqTabs" style="margin-top:10px;display:flex;flex-direction:column;gap:0">'
    + '<div class="tab" data-id="slang" onclick="tab(\\'slang\\')">黑话表<span class="tabhelp" data-hint="只收骂人、黑称，需解释；上限 40 条，满了删最旧。" style="margin-left:6px;display:inline-flex;width:15px;height:15px;border-radius:50%;border:1px solid #9aa4b2;align-items:center;justify-content:center;font-size:10px;color:#9aa4b2;cursor:help;vertical-align:middle">!</span></div>'
    + '<div class="tab" data-id="banned" onclick="tab(\\'banned\\')">禁词表<span class="tabhelp" data-hint="回复里要删的词，可与其他表重合；上限 40 条，满了删最旧。" style="margin-left:6px;display:inline-flex;width:15px;height:15px;border-radius:50%;border:1px solid #9aa4b2;align-items:center;justify-content:center;font-size:10px;color:#9aa4b2;cursor:help;vertical-align:middle">!</span></div>'
    + '<div class="tab" data-id="tics" onclick="tab(\\'tics\\')">语言模仿表<span class="tabhelp" data-hint="学对方说法（口头禅/句式），与黑话互斥；上限 80 条，每 30 次对话最多用 5 次。" style="margin-left:6px;display:inline-flex;width:15px;height:15px;border-radius:50%;border:1px solid #9aa4b2;align-items:center;justify-content:center;font-size:10px;color:#9aa4b2;cursor:help;vertical-align:middle">!</span></div>'
    + '<div class="tab" data-id="stickers" onclick="tab(\\'stickers\\')">表情库<span class="tabhelp" data-hint="存储上限：100 张，超了自动删最旧的；需要调整可以让 DSH 改。" style="margin-left:6px;display:inline-flex;width:15px;height:15px;border-radius:50%;border:1px solid #9aa4b2;align-items:center;justify-content:center;font-size:10px;color:#9aa4b2;cursor:help;vertical-align:middle">!</span></div>'
    + '<div class="tab" data-id="memes" onclick="tab(\\'memes\\')">梗百科/知识库<span class="tabhelp" data-hint="存储上限：10000 条，满了删最旧的；需要调整可以让 DSH 改。" style="margin-left:6px;display:inline-flex;width:15px;height:15px;border-radius:50%;border:1px solid #9aa4b2;align-items:center;justify-content:center;font-size:10px;color:#9aa4b2;cursor:help;vertical-align:middle">!</span></div>'
    + '</div>'
    + '</div>'

    + '<div style="margin:12px 0 10px">'
    + '<div id="cfgHead" style="display:flex;align-items:center;gap:7px;cursor:pointer;user-select:none;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.10);border-radius:9px;padding:12px;font-size:16px;font-weight:600;color:#e6edf6">'
    + '<span id="cfgArrow" style="font-size:12px;color:#9aa4b2">▾</span><span>功能配置</span>'
    + '<span id="cfgHelp" style="margin-left:auto;display:inline-flex;width:18px;height:18px;border-radius:50%;border:1.5px solid #9aa4b2;align-items:center;justify-content:center;font-size:12px;font-weight:400;color:#9aa4b2;cursor:help">!</span>'
    + '</div>'
    + '<div id="cfgTabs" style="margin-top:10px;display:flex;flex-direction:column;gap:0">'
    + '<div class="tab" data-id="config" onclick="tab(\\'config\\')">B站配置<span class="tabhelp" data-hint="观看记录最多 50 条，满了删最旧；九宫格图片只保留最近 20 张；视频文件抽完立即删除。卡片签名 Key 失效时卡片会退化成文字链接。" style="margin-left:6px;display:inline-flex;width:15px;height:15px;border-radius:50%;border:1px solid #9aa4b2;align-items:center;justify-content:center;font-size:10px;color:#9aa4b2;cursor:help;vertical-align:middle">!</span></div>'
    + '<div class="tab" data-id="proxy" onclick="tab(\\'proxy\\')">代理配置</div>'
    + '<div class="tab" data-id="tieba" onclick="tab(\\'tieba\\')">贴吧配置</div>'
    + '</div>'
    + '</div>'
    + '<div style="margin:12px 0 10px">'
    + '<div id="othHead" style="display:flex;align-items:center;gap:7px;cursor:pointer;user-select:none;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.10);border-radius:9px;padding:12px;font-size:16px;font-weight:600;color:#e6edf6">'
    + '<span id="othArrow" style="font-size:12px;color:#9aa4b2">▾</span><span>QQ控制</span>'
    + '<span id="othHelp" style="margin-left:auto;display:inline-flex;width:18px;height:18px;border-radius:50%;border:1.5px solid #9aa4b2;align-items:center;justify-content:center;font-size:12px;font-weight:400;color:#9aa4b2;cursor:help">!</span>'
    + '</div>'
    + '<div id="othTabs" style="margin-top:10px;display:flex;flex-direction:column;gap:0">'
    + '<div class="tab" data-id="settings" onclick="tab(\\'settings\\')">行为参数</div>'
    + '<div class="tab" data-id="chats" onclick="tab(\\'chats\\')">会话<span class="tabhelp" data-hint="上下文：会话满 30 轮或 40 万字符自动轮换；群聊缓存 30 条、每轮注入 30 条；摘要每个会话最多 9 段。" style="margin-left:6px;display:inline-flex;width:15px;height:15px;border-radius:50%;border:1px solid #9aa4b2;align-items:center;justify-content:center;font-size:10px;color:#9aa4b2;cursor:help;vertical-align:middle">!</span></div>'
    + '<div class="tab" data-id="reminders" onclick="tab(\\'reminders\\')">待办<span class="tabhelp" data-hint="待办全局最多 10 条，到点 @ 发起人；出现提醒最多 50 条。" style="margin-left:6px;display:inline-flex;width:15px;height:15px;border-radius:50%;border:1px solid #9aa4b2;align-items:center;justify-content:center;font-size:10px;color:#9aa4b2;cursor:help;vertical-align:middle">!</span></div>'
    + '<div class="tab" data-id="contacts" onclick="tab(\\'contacts\\')">社交<span class="tabhelp" data-hint="好感度 0–100：≥75 卖萌、≤25 暴躁、≤10 极端；长期记忆全局最多 800 条，锁定后不会被自动优化。&#10;认人规则：和同一个人聊满 10 次还没记名字，会主动问一次称呼（只问一次）。&#10;档案（名字/称呼/简介）写入后，本人可以让它改；管理员可以改别人的。" style="margin-left:6px;display:inline-flex;width:15px;height:15px;border-radius:50%;border:1px solid #9aa4b2;align-items:center;justify-content:center;font-size:10px;color:#9aa4b2;cursor:help;vertical-align:middle">!</span></div>'
    ;
    + '</div>'
    + '</div>'
    + '<div style="margin:14px 0 10px">'
    + '<div class="tab" id="logsHead" data-id="logs" onclick="tab(\\'logs\\')" style="display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.10);border-radius:9px;padding:12px;font-size:16px;font-weight:600;color:#e6edf6">运行日志</div>'
    + '</div>'
  document.getElementById('panels').innerHTML = FILES.map(function(f){
    const __nameBox = f.name === '1-persona.md'
      ? '<div class="row" style="gap:6px;margin-bottom:8px"><input id="botNameInput" placeholder="机器人名字，多个用逗号分隔" style="flex:1"><button onclick="saveBotName()">保存名字</button></div>'
      : '';
    return '<div class="panel" id="p-'+f.key+'">' + __nameBox + '<textarea id="ta-'+f.key+'"></textarea>'
      + '</div>';
  }).join('') + '<div class="panel" id="p-config">'
    + '<div style="background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:16px">'
    + '<h4 style="margin:0 0 10px;font-size:13px;color:#9aa4b2">卡片签名 Key</h4>'
    + '<input id="cfg-arkKey" type="text" placeholder="sk-...">'
    + '<div style="color:#5f6875;font-size:11px;margin:6px 0 18px">发 B 站、网易云卡片需要签名；没有的话去 https://api.xianyu.cn 注册一个 sk- 开头的。</div>'
    + '<h4 style="margin:0 0 10px;font-size:13px;color:#9aa4b2">B站登录</h4>'
    + '<div id="biliQrBox" style="display:none;margin:0 0 10px"><img id="biliQrImg" alt="二维码" style="width:200px;height:200px;background:#fff;border-radius:8px;padding:6px"></div>'
    + '<div style="display:flex;align-items:center;gap:10px;margin:0 0 10px">'
    + '<img id="biliAvatar" alt="" style="display:none;width:36px;height:36px;border-radius:50%;object-fit:cover;background:#0b0f14">'
    + '<div><div id="biliQrStatus" style="color:#8a93a0;font-size:12px">检查登录状态…</div><div id="biliName" style="font-size:13px;color:#dbe3ee"></div></div>'
    + '</div>'
    + '<button onclick="biliQrStart()">扫码登录</button>'
    + '<h4 style="margin:18px 0 8px;font-size:13px;color:#9aa4b2">观看记录</h4>'
    + '<div id="biliMemList" style="max-height:260px;overflow:auto;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:6px"><div style="color:#7d8794;font-size:12px;padding:6px">还没有记录</div></div>'
    + '<div id="biliMemPager" style="display:flex;align-items:center;gap:8px;margin-top:6px"></div>'
    + '</div></div>'
    + '<div class="panel" id="p-proxy"><div style="background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:16px">'
    + '<h4 style="margin:0 0 10px;font-size:13px;color:#9aa4b2">代理地址</h4>'
    + '<input id="px-proxyUrl" type="text" placeholder="http://127.0.0.1:7890">'
    + '<div style="color:#5f6875;font-size:11px;margin:6px 0 16px">不填就直连，搜图和外链图片可能失败。</div>'
    + '<h4 style="margin:0 0 10px;font-size:13px;color:#9aa4b2">Clash API</h4>'
    + '<input id="px-clashApi" type="text" placeholder="http://127.0.0.1:9090">'
    + '<div style="color:#5f6875;font-size:11px;margin:6px 0 16px">填了才自动切换节点，不填就不切。</div>'
    + '<h4 style="margin:0 0 10px;font-size:13px;color:#9aa4b2">Clash 分组名</h4>'
    + '<input id="px-clashGroup" type="text" placeholder="机场分组名">'
    + '<div style="color:#5f6875;font-size:11px;margin:6px 0 16px">填你自己机场的分组，配合 Clash API 用。</div>'
    + '<div style="color:#e05555;font-size:12px;margin:0 0 4px">有订阅链接的话，直接甩给 DSH，让它帮你配好</div>'
    + '</div></div>'
    + '<div class="panel" id="p-tieba"><div style="background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:16px">'
    + '<h4 style="margin:0 0 10px;font-size:13px;color:#9aa4b2">百度 Cookie</h4>'
    + '<textarea id="tb-baiduCookie" rows="2" style="width:100%;box-sizing:border-box;font-size:12px;min-height:52px;resize:vertical"></textarea>'
    + '<div style="color:#5f6875;font-size:11px;margin:6px 0 16px">抓贴吧链接时带上它，内容更全；主要要 BDUSS、STOKEN，不填也能用。</div>'
    + '</div></div>'
;
  try { loadBiliMe(); } catch {}
  try {
    const __st = s.settings || {};
    const __turns = typeof __st.sessionWindowTurns === 'number' ? __st.sessionWindowTurns : 30;
    const __chars = typeof __st.sessionCharLimit === 'number' ? __st.sessionCharLimit : 400000;
    const __chatHelp = document.querySelector('.tabhelp[data-hint^="上下文"]');
    if (__chatHelp) __chatHelp.dataset.hint = '上下文：会话满 ' + __turns + ' 轮或 ' + Math.round(__chars / 10000) + ' 万字符自动轮换；群聊缓存 30 条、每轮注入 30 条；摘要每个会话最多 9 段。';
  } catch {}
  for (const f of FILES) document.getElementById('ta-'+f.key).value = f.text;
  try {
    const __bn = document.getElementById('botNameInput');
    if (__bn) __bn.value = (s.botNames || []).join('，');
  } catch {}
  try {
    if (!window.__tabHelpTip) {
      const __tip = document.createElement('div');
      __tip.style.cssText = 'position:fixed;z-index:99;display:none;background:#1b222b;border:1px solid rgba(255,255,255,.14);color:#cfd8e3;font-size:12px;line-height:1.6;padding:8px 11px;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,.5);max-width:300px;white-space:pre-line';
      document.body.appendChild(__tip);
      window.__tabHelpTip = __tip;
    }
    const __tip = window.__tabHelpTip;
    document.querySelectorAll('.tabhelp').forEach(function(el){
      el.onmouseenter = function(e){
        e.stopPropagation();
        const r = el.getBoundingClientRect();
        __tip.textContent = el.dataset.hint || '';
        __tip.style.display = 'block';
        __tip.style.top = Math.min(window.innerHeight - 80, r.bottom + 6) + 'px';
        __tip.style.left = Math.max(8, Math.min(window.innerWidth - 320, r.right + 8)) + 'px';
      };
      el.onmouseleave = function(){ __tip.style.display = 'none'; };
      el.onclick = function(e){ e.stopPropagation(); };
    });
  } catch {}
  renderSettings(s.settings);
  try { bindAutoSave(); } catch {}
  STICKERS = s.stickers;
  renderGrid();
  try {
    const __head = document.getElementById('fgHead');
    const __body = document.getElementById('fgTabs');
    const __arrow = document.getElementById('fgArrow');
    let __open = true;
    try { __open = localStorage.getItem('fgOpen') !== '0'; } catch {}
    const __apply = function(){ __body.style.display = __open ? 'block' : 'none'; __arrow.textContent = __open ? '▾' : '▸'; };
    __apply();
    __head.onclick = function(){ __open = !__open; try { localStorage.setItem('fgOpen', __open ? '1' : '0'); } catch {} __apply(); };
    const __help = document.getElementById('fgHelp');
    const __tip = document.createElement('div');
    __tip.style.cssText = 'position:fixed;z-index:99;display:none;background:#1b222b;border:1px solid rgba(255,255,255,.14);color:#cfd8e3;font-size:12px;line-height:1.6;padding:8px 11px;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,.5);white-space:normal;max-width:300px';
    __tip.textContent = '除了人设，其他规则建议不动';
    document.body.appendChild(__tip);
    __help.onmouseenter = function(){
      const r = __help.getBoundingClientRect();
      __tip.style.display = 'block';
      __tip.style.top = (r.bottom + 6) + 'px';
      __tip.style.left = Math.max(8, Math.min(window.innerWidth - 220, r.left - 20)) + 'px';
    };
    __help.onmouseleave = function(){ __tip.style.display = 'none'; };
    __help.onclick = function(e){ e.stopPropagation(); };
  } catch {}
  try {
    const __wh = document.getElementById('wqHead');
    const __wb = document.getElementById('wqTabs');
    const __wa = document.getElementById('wqArrow');
    let __wopen = true;
    try { __wopen = localStorage.getItem('wqOpen') !== '0'; } catch {}
    const __wapply = function(){ __wb.style.display = __wopen ? 'block' : 'none'; __wa.textContent = __wopen ? '▾' : '▸'; };
    __wapply();
    __wh.onclick = function(){ __wopen = !__wopen; try { localStorage.setItem('wqOpen', __wopen ? '1' : '0'); } catch {} __wapply(); };
    const __whelp = document.getElementById('wqHelp');
    const __wtip = document.createElement('div');
    __wtip.style.cssText = 'position:fixed;z-index:99;display:none;background:#1b222b;border:1px solid rgba(255,255,255,.14);color:#cfd8e3;font-size:12px;line-height:1.6;padding:8px 11px;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,.5);white-space:nowrap';
    __wtip.textContent = 'bot 有自学习 / 自动存表情功能，用户也可以在聊天里教学，bot 会自动分流到下面这些表（梗百科/知识库除外）';
    document.body.appendChild(__wtip);
    __whelp.onmouseenter = function(){
      const r = __whelp.getBoundingClientRect();
      __wtip.style.display = 'block';
      __wtip.style.top = (r.bottom + 6) + 'px';
      __wtip.style.left = Math.max(8, Math.min(window.innerWidth - 240, r.left - 20)) + 'px';
    };
    __whelp.onmouseleave = function(){ __wtip.style.display = 'none'; };
    __whelp.onclick = function(e){ e.stopPropagation(); };
  } catch {}
  try {
    const __oh = document.getElementById('othHead');
    const __ob = document.getElementById('othTabs');
    const __oa = document.getElementById('othArrow');
    let __oopen = true;
    try { __oopen = localStorage.getItem('othOpen') !== '0'; } catch {}
    const __oapply = function(){ __ob.style.display = __oopen ? 'block' : 'none'; __oa.textContent = __oopen ? '▾' : '▸'; };
    __oapply();
    __oh.onclick = function(){ __oopen = !__oopen; try { localStorage.setItem('othOpen', __oopen ? '1' : '0'); } catch {} __oapply(); };
  try {
    const __ohhelp = document.getElementById('othHelp');
    if (__ohhelp) {
      const __ohtip = document.createElement('div');
      __ohtip.style.cssText = 'position:fixed;z-index:99;display:none;background:#1b222b;border:1px solid rgba(255,255,255,.14);color:#cfd8e3;font-size:12px;line-height:1.6;padding:8px 11px;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,.5);max-width:260px';
      __ohtip.textContent = '谨慎改动行为参数：它会影响回复频率、节奏和触发条件，拿不准就保持默认';
      document.body.appendChild(__ohtip);
      __ohhelp.onmouseenter = function(){
        const r = __ohhelp.getBoundingClientRect();
        __ohtip.style.display = 'block';
        __ohtip.style.top = (r.bottom + 6) + 'px';
        __ohtip.style.left = Math.max(8, Math.min(window.innerWidth - 280, r.left - 200)) + 'px';
      };
      __ohhelp.onmouseleave = function(){ __ohtip.style.display = 'none'; };
      __ohhelp.onclick = function(e){ e.stopPropagation(); };
    }
  } catch {}
  } catch {}
  try {
    const __ch = document.getElementById('cfgHead');
    const __cb = document.getElementById('cfgTabs');
    const __ca = document.getElementById('cfgArrow');
    if (__ch && __cb) {
      let __copen = true;
      try { __copen = localStorage.getItem('cfgOpen') !== '0'; } catch {}
      const __capply = function(){ __cb.style.display = __copen ? 'block' : 'none'; if (__ca) __ca.textContent = __copen ? '▾' : '▸'; };
      __capply();
      __ch.onclick = function(){ __copen = !__copen; try { localStorage.setItem('cfgOpen', __copen ? '1' : '0'); } catch {} __capply(); };
    }
  } catch {}
  try {
    const __mb = document.getElementById('memeHelpBtn');
    const __mp = document.getElementById('memeHelp');
    if (__mb && __mp) {
      const __showM = function(){
        const r = __mb.getBoundingClientRect();
        __mp.style.display = 'block';
        __mp.style.top = (r.bottom + 8) + 'px';
        __mp.style.left = Math.max(8, Math.min(window.innerWidth - 540, r.left - 10)) + 'px';
      };
      __mb.onmouseenter = __showM;
      __mb.onmouseleave = function(){ __mp.style.display = 'none'; };
      __mb.onclick = __showM;
    }
  } catch {}
  try {
    const __rb2 = document.getElementById('remindHelpBtn');
    const __rp2 = document.getElementById('remindHelp');
    if (__rb2 && __rp2) {
      const __showR2 = function(){
        const r = __rb2.getBoundingClientRect();
        __rp2.style.display = 'block';
        __rp2.style.top = (r.bottom + 8) + 'px';
        __rp2.style.left = Math.max(8, Math.min(window.innerWidth - 540, r.left - 10)) + 'px';
      };
      __rb2.onmouseenter = __showR2;
      __rb2.onmouseleave = function(){ __rp2.style.display = 'none'; };
      __rb2.onclick = __showR2;
    }
  } catch {}
  try {
    const __cb = document.getElementById('chatHelpBtn');
    const __cp = document.getElementById('chatHelp');
    if (__cb && __cp) {
      const __showC = function(){
        const r = __cb.getBoundingClientRect();
        __cp.style.display = 'block';
        __cp.style.top = (r.bottom + 8) + 'px';
        __cp.style.left = Math.max(8, Math.min(window.innerWidth - 580, r.left - 10)) + 'px';
      };
      __cb.onmouseenter = __showC;
      __cb.onmouseleave = function(){ __cp.style.display = 'none'; };
      __cb.onclick = __showC;
    }
  } catch {}

  tab(FILES.length? FILES[0].key : 'settings');
}
async function saveBotName(silent){
  const el = document.getElementById('botNameInput');
  if (!el) return;
  const names = String(el.value || '').split(/[，,、\s]+/).map(function(v){ return v.trim(); }).filter(Boolean);
  if (!names.length) { if (!silent) toast('名字不能空'); return; }
  const r = await api('/api/botname', { method:'POST', body: JSON.stringify({ names: names }) });
  if (r && r.ok) { el.value = r.botNames.join('，'); if (!silent) toast('名字已保存'); }
  else toast('保存失败');
}
async function saveFile(name, key, silent){
  await api('/api/file',{method:'POST',body:JSON.stringify({name,text:document.getElementById('ta-'+key).value})});
  if (!silent) toast('已保存 '+name);
}
const SETTINGS_FIELDS = [
  { key:'replyMaxParts', label:'最多连发条数', type:'range', min:2, max:10, step:1, unit:'条', hint:'一次回复最多拆成几条消息发出去：60% 只发两条，其余随机发三条到上限' },
  { key:'replyPartChars', label:'每条最多字数', type:'range', min:4, max:40, step:1, unit:'字', hint:'单条消息超过这个字数会被拆成多条，太短会显得断断续续' },
  { key:'sendGapMs', label:'连发间隔', type:'range', scale:0.001, min:0, max:3, step:0.1, unit:'秒', hint:'大肥鱼一次回复发好几条时，每条之间的间隔' },
  { key:'messageBufferMs', label:'回复缓冲', type:'range', scale:0.001, min:0, max:10, step:0.1, unit:'秒', hint:'他每发一条就重新计时，隔这么久没新消息才回复；连发会合并成一条' },
  { key:'groupFollowUpSeconds', label:'接话窗口', type:'range', min:60, max:600, step:30, unit:'秒', hint:'超过这个时间没发消息会关闭对话窗口；最少 1 分钟（主动找话在窗口中间判定）' },
  { key:'replyBudgetPerMin', label:'每分钟最多回复', type:'range', min:1, max:20, step:1, unit:'条', hint:'一分钟内最多回几次；超过就不回，这期间 @ 它、戳它或叫它名字，它会回一句「话太多了」' },
  { key:'stickerChance', label:'表情概率', type:'range', scale:100, min:0, max:100, step:5, unit:'%', hint:'每次回复时顺手带一张表情的概率' },
  { key:'groupAmbientChance', label:'接话概率', type:'range', scale:100, min:0, max:100, step:1, unit:'%', hint:'群里没人叫它时，它自己插话的概率' },
  { key:'knownChance', label:'认识的人接话概率', type:'range', scale:100, min:0, max:100, step:5, unit:'%', def:0.5, hint:'社交里的人在群里说话、但没叫它时，它主动接话的概率；一般比接话概率高' },
  { key:'proactiveChance', label:'主动找话概率', type:'range', scale:100, min:0, max:100, step:5, unit:'%', hint:'和某人聊着、对方不回了，聊天窗口走到一半时，按这个概率决定要不要主动说一句；说完不续期' },
  { key:'chatVideoChance', label:'聊天中发视频概率', type:'range', scale:100, min:0, max:100, step:5, unit:'%', hint:'聊天时随机发视频的概率' },
  { key:'moodCooldownTurns', label:'好感度切档冷却', type:'range', min:0, max:20, step:1, unit:'次', hint:'好感度升档或降档后，至少隔几次才允许再变，避免态度反复' },
  { key:'sessionWindowTurns', label:'会话次数上限', type:'range', min:10, max:100, step:5, unit:'次', hint:'一段对话满多少次就换新的，旧内容不再带入' },
  { key:'pokeReplies', label:'戳一戳回复', type:'text', hint:'被戳时随机回一句，逗号分开' },
  { key:'sessionCharLimit', label:'会话字符上限', type:'range', min:50000, max:1000000, step:50000, unit:'字符', hint:'对话内容累计超过多少字符就换新的' },
  { key:'arkKey', label:'卡片签名 Key', type:'text', long:true, hint:'发 B 站、网易云卡片需要签名，填签名服务的 Key；没有的话去 https://apii.xianyuw.cn 注册拿一个 sk- 开头的' },
  { key:'biliCookie', label:'B站 Cookie', type:'text', long:true, hint:'想让它查 B 站信息更稳，可从浏览器复制 Cookie；不会弄可以叫 DSH 帮你弄' },
  { key:'proxyUrl', label:'代理地址', type:'text', long:true, hint:'例如 http://127.0.0.1:7890；不填就直连，搜图和外链图片可能失败' },
  { key:'clashApi', label:'Clash API', type:'text', long:true, hint:'例如 http://127.0.0.1:9090；填了才自动切换节点，不填就不切' },
  { key:'clashGroup', label:'Clash 分组名', type:'text', long:true, hint:'机场分组名，填你自己机场的分组；配合 Clash API 使用' },
];
async function loadSlang(){
  const map = await api('/api/slang');
  const allKeys = Object.keys(map);
  const SIZE = 8;
  const pages = Math.max(1, Math.ceil(allKeys.length / SIZE));
  PAGE_STATE.slang = Math.max(0, Math.min(pages - 1, PAGE_STATE.slang));
  const keys = allKeys.slice(PAGE_STATE.slang * SIZE, PAGE_STATE.slang * SIZE + SIZE);
  renderPager('slangPager', 'slang', PAGE_STATE.slang, allKeys.length, SIZE, loadSlang);
  const box = document.getElementById('slangList');
  box.innerHTML = keys.length
    ? '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">'
      + keys.map(function(k){
          return '<div class="chatcard" style="margin:0"><div class="cbody" style="min-width:0"><div class="row" style="gap:6px;align-items:center">'
            + '<input data-old="'+esc(k)+'" value="'+esc(k)+'" style="width:88px;min-width:0">'
            + '<span style="opacity:.6">→</span>'
            + '<input data-mean="'+esc(k)+'" value="'+esc(map[k])+'" style="flex:1;min-width:0">'
            + '<button data-save="'+esc(k)+'">保存</button>'
            + '<button class="danger" data-del="'+esc(k)+'">删</button>'
            + '</div></div></div>';
        }).join('')
      + '</div>'
    : '<div style="color:#7d8794">还没有黑话表条目</div>';
  box.querySelectorAll('[data-save]').forEach(function(b){ b.onclick = function(){ saveSlang(b.dataset.save, b); }; });
  box.querySelectorAll('[data-del]').forEach(function(b){ b.onclick = function(){ delSlang(b.dataset.del); }; });
}
async function addSlang(){
  const term = document.getElementById('slangTerm').value.trim();
  const meaning = document.getElementById('slangMeaning').value.trim();
  if(!term){ toast('词不能空'); return; }
  await api('/api/slang', { method:'POST', body: JSON.stringify({ term: term, meaning: meaning })});
  document.getElementById('slangTerm').value=''; document.getElementById('slangMeaning').value='';
  toast('已添加'); loadSlang();
}
async function saveSlang(oldTerm, btn){
  const card = btn && btn.closest ? btn.closest('.chatcard') : document.querySelector('[data-save="'+CSS.escape(oldTerm)+'"]').closest('.chatcard');
  const term = card.querySelector('[data-old]').value.trim();
  const meaning = card.querySelector('[data-mean]').value.trim();
  await api('/api/slang', { method:'POST', body: JSON.stringify({ term: term, oldTerm: oldTerm, meaning: meaning })});
  toast('已保存'); loadSlang();
}
function delSlang(term){
  askConfirm('删除「'+term+'」？', async function(){
    await api('/api/slang', { method:'DELETE', body: JSON.stringify({ term: term, oldTerm: term })});
    loadSlang();
  });
}
async function loadBanned(){
  const allList = await api('/api/banned');
  const SIZE = 10;
  const pages = Math.max(1, Math.ceil(allList.length / SIZE));
  PAGE_STATE.banned = Math.max(0, Math.min(pages - 1, PAGE_STATE.banned));
  const list = allList.slice(PAGE_STATE.banned * SIZE, PAGE_STATE.banned * SIZE + SIZE);
  renderPager('bannedPager', 'banned', PAGE_STATE.banned, allList.length, SIZE, loadBanned);
  const box = document.getElementById('bannedList');
  box.innerHTML = list.length
    ? '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">'
      + list.map(function(w){
          return '<div class="chatcard" style="margin:0"><div class="cbody" style="min-width:0"><div class="row" style="gap:8px;align-items:center">'
            + '<input data-edit="'+esc(w)+'" value="'+esc(w)+'" style="flex:1;min-width:0">'
            + '<button data-save="'+esc(w)+'">保存</button>'
            + '<button class="danger" data-w="'+esc(w)+'">删除</button>'
            + '</div></div></div>';
        }).join('')
      + '</div>'
    : '<div style="color:#7d8794">还没有禁词表条目</div>';
  box.querySelectorAll('[data-w]').forEach(function(b){ b.onclick = function(){ delBanned(b.dataset.w); }; });
  box.querySelectorAll('[data-save]').forEach(function(b){
    b.onclick = function(){
      const input = box.querySelector('[data-edit="'+CSS.escape(b.dataset.save)+'"]');
      saveBanned(b.dataset.save, input ? input.value.trim() : '');
    };
  });
  SUM_OPEN.forEach(function(k){
    const b = document.querySelector('[data-sum="' + String(k).replace(/"/g, '\\"') + '"]');
    if (b) b.onclick();
  });
}
async function saveBanned(oldWord, newWord){
  if(!newWord){ toast('词不能空'); return; }
  if(newWord !== oldWord){
    await api('/api/banned', { method:'DELETE', body: JSON.stringify({ word: oldWord })});
    await api('/api/banned', { method:'POST', body: JSON.stringify({ word: newWord })});
  }
  toast('已保存'); loadBanned();
}
async function addBanned(){
  const w = document.getElementById('bannedWord').value.trim();
  if(!w){ toast('词不能空'); return; }
  await api('/api/banned', { method:'POST', body: JSON.stringify({ word: w })});
  document.getElementById('bannedWord').value='';
  toast('已添加'); loadBanned();
}
async function delBanned(w){
  await api('/api/banned', { method:'DELETE', body: JSON.stringify({ word: w })});
  loadBanned();
}
function fieldDisplay(f, raw){
  if ((raw === undefined || raw === null || raw === '') && f.def !== undefined) raw = f.def;
  if (raw === undefined || raw === null || raw === '') return '';
  if (Array.isArray(raw)) return raw.join('，');
  if (typeof raw !== 'number') return String(raw);
  const v = raw * (f.scale || 1);
  return String(Math.round(v * 100) / 100);
}
function renderSettings(s){
  const box = document.getElementById('settingsFields');
  const proxyKeys = ['proxyUrl', 'clashApi', 'clashGroup'];
  const short = SETTINGS_FIELDS.filter(function(f){ return !f.long; });
  const cfgKeys = ['arkKey', 'biliCookie', 'baiduCookie'];
  const longs = SETTINGS_FIELDS.filter(function(f){ return f.long && proxyKeys.indexOf(f.key) < 0 && cfgKeys.indexOf(f.key) < 0; });
  const proxyFields = SETTINGS_FIELDS.filter(function(f){ return proxyKeys.indexOf(f.key) >= 0; });
  const CARD = '<div style="background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:16px 16px 6px;margin-bottom:16px">';
  box.innerHTML =
    CARD
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 16px">'
    + '<span id="winHelpBtn" style="display:inline-flex;align-items:center;gap:8px;cursor:help;font-size:14px;color:#cfd8e3;user-select:none"><span style="display:inline-flex;width:20px;height:20px;border-radius:50%;border:1.5px solid #cfd8e3;align-items:center;justify-content:center;font-size:13px">!</span>使用说明</span>'
    + '<span style="color:#f0b04f;font-size:13.5px">请注意次数和条数的区别</span>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 26px">'
    + short.map(function(f){
        const raw = s ? s[f.key] : undefined;
        const cur = fieldDisplay(f, raw);
        const unit = f.unit ? '<span style="color:#8a93a0;font-size:12px">'+f.unit+'</span>' : '';
        if (f.type === 'range') {
          return '<div><div style="font-size:12.5px;color:#9aa4b2;margin-bottom:4px">'+f.label+'</div>'
            + '<div style="display:flex;align-items:center;gap:8px"><input id="set-'+f.key+'" type="range" min="'+(f.min||0)+'" max="'+(f.max||10)+'" step="'+(f.step||1)+'" value="'+cur+'" style="flex:1;min-width:0">'
            + '<b id="val-'+f.key+'" style="min-width:26px;text-align:right">'+cur+'</b>'+unit+'</div>'
            + '<div style="color:#5f6875;font-size:11px;margin-top:4px">'+(f.hint||'')+'</div></div>';
        }
        if (f.type === 'text') {
          return '<div><div style="font-size:12.5px;color:#9aa4b2;margin-bottom:4px">'+f.label+'</div>'
            + '<input id="set-'+f.key+'" type="text" value="'+String(cur).replace(/"/g,'&quot;')+'" style="width:100%;box-sizing:border-box;padding:5px 8px;font-size:12.5px">'
            + '<div style="color:#5f6875;font-size:11px;margin-top:4px">'+(f.hint||'')+'</div></div>';
        }
        return '<div><div style="font-size:12.5px;color:#9aa4b2;margin-bottom:4px">'+f.label+'</div>'
          + '<div style="display:flex;align-items:center;gap:8px"><input id="set-'+f.key+'" type="number" step="'+(f.step||1)+'"'+(f.min!==undefined?' min="'+f.min+'"':'')+(f.max!==undefined?' max="'+f.max+'"':'')+' value="'+cur+'" style="flex:1;min-width:0">'+unit+'</div>'
          + '<div style="color:#5f6875;font-size:11px;margin-top:4px">'+(f.hint||'')+'</div></div>';
      }).join('')
    + '</div>'
    + '</div>'
    + (longs.length ? CARD + '<h4 style="margin:0 0 12px;font-size:13px;color:#9aa4b2">更多设置</h4>' : '')
    + longs.map(function(f){
        const cur = fieldDisplay(f, s ? s[f.key] : undefined);
        if (f.type === 'textarea') {
          return '<div style="margin-bottom:20px"><div style="font-size:12.5px;color:#9aa4b2;margin-bottom:6px">'+f.label+'</div><textarea id="set-'+f.key+'" rows="1" style="width:100%;max-width:100%;box-sizing:border-box;min-height:46px;resize:vertical">'+String(cur).replace(/</g,'&lt;')+'</textarea><div style="color:#5f6875;font-size:11px">'+(f.hint||'')+'</div></div>';
        }
        return '<div style="margin-bottom:20px"><div style="font-size:12.5px;color:#9aa4b2;margin-bottom:6px">'+f.label+'</div><input id="set-'+f.key+'" type="text" value="'+String(cur).replace(/"/g,'&quot;')+'" style="width:100%"><div style="color:#5f6875;font-size:11px">'+(f.hint||'')+'</div></div>';
      }).join('')
    + (longs.length ? '</div>' : '')
    ;
  box.querySelectorAll('input[type="range"]').forEach(function(el){
    el.oninput = function(){
      const b = document.getElementById('val-' + el.id.slice(4));
      if (b) b.textContent = el.value;
    };
  });
  const __hb = document.getElementById('winHelpBtn');
  const __hp = document.getElementById('winHelp');
  if (__hb && __hp) {
    const __show = function(){
      const r = __hb.getBoundingClientRect();
      __hp.style.display = 'block';
      const h = __hp.offsetHeight || 420;
      const w = __hp.offsetWidth || 780;
      const top = r.top - h - 10;
      __hp.style.top = (top > 8 ? top : Math.min(window.innerHeight - 80, r.bottom + 10)) + 'px';
      __hp.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left - 20)) + 'px';
    };
    const __hide = function(){ __hp.style.display = 'none'; };
    __hb.onmouseenter = __show;
    __hb.onmouseleave = __hide;
    __hb.onclick = __show;
  }
  const __rb = document.getElementById('roleHelpBtn');
  const __rp = document.getElementById('roleHelp');
  if (__rb && __rp) {
    const __showR = function(){
      const r = __rb.getBoundingClientRect();
      __rp.style.display = 'block';
      const h = __rp.offsetHeight || 440;
      const w = __rp.offsetWidth || 720;
      const top = r.top - h - 10;
      __rp.style.top = (top > 8 ? top : Math.min(window.innerHeight - 80, r.bottom + 10)) + 'px';
      __rp.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left - 30)) + 'px';
    };
    const __hideR = function(){ __rp.style.display = 'none'; };
    __rb.onmouseenter = __showR;
    __rb.onmouseleave = __hideR;
    __rb.onclick = __showR;
  }
}
async function saveSettings(silent){
  const payload = {};
  for (const f of SETTINGS_FIELDS) {
    const el = document.getElementById('set-'+f.key);
    if (!el) continue;
    if (f.type === 'range' || f.type === 'number') {
      const v = Number(el.value);
      if (!Number.isFinite(v)) continue;
      let raw = v;
      if (f.min !== undefined && raw < f.min) raw = f.min;
      if (f.max !== undefined && raw > f.max) raw = f.max;
      payload[f.key] = Math.round((raw / (f.scale || 1)) * 10000) / 10000;
      continue;
    }
    if (f.key === 'pokeReplies') {
      payload[f.key] = el.value.split(/[，,、]/).map(function(v){return v.trim();}).filter(Boolean);
      continue;
    }
    payload[f.key] = el.value.trim();
  }
  await api('/api/settings',{method:'POST',body:JSON.stringify(payload)});
  if(!silent) toast('参数已保存');
}
async function saveAllSettings(){
  await saveSettings(true);
  await saveAdmins();
  toast('已保存');
}
function del(name){ askConfirm('删除 '+name+'？', async function(){ await api('/api/sticker?name='+encodeURIComponent(name),{method:'DELETE'}); STICKERS=STICKERS.filter(n=>n!==name); renderGrid(); toast('已删除 '+name); }); }
async function upload(){
  const files=[...document.getElementById('file').files]; if(!files.length)return;
  for(const f of files){
    const b64=await new Promise(res=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.readAsDataURL(f)});
    await api('/api/sticker',{method:'POST',body:JSON.stringify({name:f.name,data:b64})});
  }
  toast('上传完成'); await refreshStickers();
}
document.getElementById('pickSticker').onclick = function(){ document.getElementById('file').click(); };
document.getElementById('file').onchange = async function(){
  if (this.files && this.files.length > 0) {
    await upload();
    this.value = '';
  }
};
function restart(){ askConfirm('重启 DSH 服务？', async function(){ await api('/api/restart',{method:'POST',body:'{}'}); toast('已触发重启'); setTimeout(load,9000); }); }
let MEM_PAGE = 0, MEM_DATA = [];
const MEM_PAGE_SIZE = 3;
function memGroup(rows){
  const g = {};
  for (const r of rows) {
    const k = String(r.from || "");
    if (!g[k]) g[k] = { from: k, name: "", items: [] };
    if (!g[k].name && r.name) g[k].name = r.name;
    g[k].items.push(r);
  }
  return Object.keys(g).map(function(k){ return g[k]; }).sort(function(a, b){ return b.items.length - a.items.length; });
}
const MEM_OPEN_Q = new Set();
const MEM_ITEM_PAGE = new Map();
function memItemBox(r){
  const fmt = function(ts){ if(!ts) return ''; const d = new Date(ts); return (d.getMonth()+1)+'/'+d.getDate(); };
  return '<div style="border:1px solid rgba(255,255,255,.10);border-radius:8px;padding:9px 11px;margin:6px 0;background:rgba(255,255,255,.025)">'
    + '<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">'
    + '<div style="min-width:0"><div style="font-size:13px;color:#dbe3ee;line-height:1.6">'+esc(r.text)+'</div>'
    + '<div style="font-size:11.5px;color:#7d8794;margin-top:4px">权重 '+r.weight+' · '+fmt(r.lastAt||r.at)+' · 用过 '+r.used+' 次 · '+(r.kind==='passive'?'自动摘要':'主动记的')+(r.pinned?' · <span style="color:#f0b04f">已锁定</span>':'')+'</div></div>'
    + '<div style="display:flex;flex-direction:column;gap:5px;flex:0 0 auto;align-items:flex-end">'
    + (r.pinned ? '<label style="display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:#f0b04f;cursor:pointer"><input type="checkbox" data-pin="'+r.id+'" checked>锁定</label>' : '<label style="display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:#9aa4b2;cursor:pointer"><input type="checkbox" data-pin="'+r.id+'">锁定</label>')
    + '<button class="danger" data-mem="'+r.id+'" data-act="delete">删除</button></div>'
    + '</div></div>';
}
function memGroupHtml(g){
  const open = MEM_OPEN_Q.has(g.from);
  const av = g.from ? 'https://q1.qlogo.cn/g?b=sdk&nk='+g.from+'&s=100' : '';
  const head = '<div data-memhead="'+esc(g.from)+'" style="display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none;padding:9px 4px;border-bottom:1px solid rgba(255,255,255,.06)">'
    + '<span style="width:14px;color:#8a93a0">'+(open?'▾':'▸')+'</span>'
    + (av?'<img src="'+av+'" style="width:26px;height:26px;border-radius:50%;object-fit:cover" loading="lazy" onerror="this.style.opacity=.15">':'')
    + '<span class="cname">'+esc(g.name||'未知')+'</span><span class="pill">'+esc(g.from||'-')+'</span><span class="pill">'+g.items.filter(function(m){return String(m.text||'')!=='';}).length+' / 18 条</span></div>';
  const items = g.items.filter(function(m){ return String(m.text || '') !== ''; });
  const PER = 9;
  const pages = Math.max(1, Math.ceil(items.length / PER));
  let page = MEM_ITEM_PAGE.get(g.from) || 0;
  if (page > pages - 1) { page = pages - 1; MEM_ITEM_PAGE.set(g.from, page); }
  const slice = items.slice(page * PER, page * PER + PER);
  const pager = pages > 1
    ? '<div style="display:flex;align-items:center;gap:8px;padding:6px 4px;color:#8a93a0"><button class="ghost" data-mempage="prev" data-from="'+esc(g.from)+'"'+(page<=0?' disabled':'')+'>‹</button><span>'+(page+1)+' / '+pages+'</span><button class="ghost" data-mempage="next" data-from="'+esc(g.from)+'"'+(page>=pages-1?' disabled':'')+'>›</button></div>'
    : '';
  const body = open ? (items.length ? '<div style="margin:8px 0 4px">'+slice.map(memItemBox).join('')+'</div>'+pager : '<div style="color:#7d8794;padding:6px 4px">这张表还是空的，最多 45 条</div>') : '';
  return head + body;
}
function memPager(page, total){
  const box = document.getElementById('memKnownPager');
  if (!box) return;
  const pages = Math.max(1, Math.ceil(total / MEM_PAGE_SIZE));
  box.innerHTML = total > 0
    ? '<button class="ghost" data-go="prev"'+(page<=0?' disabled':'')+'>‹</button><span>'+(page+1)+' / '+pages+'</span><button class="ghost" data-go="next"'+(page>=pages-1?' disabled':'')+'>›</button>'
    : '';
  box.querySelectorAll('[data-go]').forEach(function(b){
    b.onclick = function(){
      const d = b.dataset.go === 'next' ? 1 : -1;
      MEM_PAGE = Math.max(0, Math.min(pages - 1, MEM_PAGE + d));
      renderMem();
    };
  });
}
function renderMem(){
  const view = MEM_DATA.slice(MEM_PAGE * MEM_PAGE_SIZE, MEM_PAGE * MEM_PAGE_SIZE + MEM_PAGE_SIZE);
  const box = document.getElementById('memKnown');
  box.innerHTML = view.length ? view.map(memGroupHtml).join('') : '<div style="color:#7d8794;padding:8px 0">还没有记忆</div>';
  document.getElementById('memKnownCount').textContent = '共 '+MEM_DATA.length+' 人';
  memPager(MEM_PAGE, MEM_DATA.length);
  box.querySelectorAll('[data-mem]').forEach(function(b){
    b.onclick = function(){ memAct(b.dataset.mem, b.dataset.act); };
  });
  box.querySelectorAll('[data-pin]').forEach(function(cb){
    cb.onchange = function(){ memAct(cb.dataset.pin, cb.checked ? 'pin' : 'unpin'); };
  });
  box.querySelectorAll('[data-mempage]').forEach(function(b){
    b.onclick = function(ev){
      ev.stopPropagation();
      const from = b.dataset.from;
      const cur = MEM_ITEM_PAGE.get(from) || 0;
      MEM_ITEM_PAGE.set(from, Math.max(0, cur + (b.dataset.mempage === 'next' ? 1 : -1)));
      renderMem();
    };
  });
  box.querySelectorAll('[data-memhead]').forEach(function(h){
    h.onclick = function(){
      const q = h.dataset.memhead;
      if (MEM_OPEN_Q.has(q)) MEM_OPEN_Q.delete(q); else MEM_OPEN_Q.add(q);
      renderMem();
    };
  });
}
async function loadMemList(){
  const rows = await api('/api/memory');
  let contacts = [];
  try { contacts = await api('/api/contacts'); } catch {}
  const knownQq = new Set(contacts.map(function(c){ return String(c.qq); }));
  const knownRows = rows.filter(function(r){ return r.from && knownQq.has(String(r.from)); });
  MEM_DATA = memGroup(knownRows);
  MEM_PAGE = Math.min(MEM_PAGE, Math.max(0, Math.ceil(MEM_DATA.length / MEM_PAGE_SIZE) - 1));
  renderMem();
}
async function memAct(id, act){
  if(act === 'delete') { askConfirm('删除这条记忆？', function(){ return memAct(id, '__delete'); }); return; }
  const real = act === '__delete' ? 'delete' : act;
  await api('/api/memory', { method:'POST', body: JSON.stringify({ action: real, id: id })});
  if (document.getElementById('memKnown')) loadMemList(); else loadContacts();
}

const PAGE_STATE = { slang: 0, banned: 0, tic: 0, mood: 0 };
function renderPager(id, kind, page, total, size, redraw){
  const box = document.getElementById(id);
  if (!box) return;
  const pages = Math.max(1, Math.ceil(total / size));
  box.innerHTML = '<button class="ghost" data-pg="prev"'+(page<=0?' disabled':'')+'>‹</button><span>'+(page+1)+' / '+pages+'</span><button class="ghost" data-pg="next"'+(page>=pages-1?' disabled':'')+'>›</button>';
  box.querySelectorAll('[data-pg]').forEach(function(b){
    b.onclick = function(){
      PAGE_STATE[kind] = Math.max(0, Math.min(pages - 1, page + (b.dataset.pg === 'next' ? 1 : -1)));
      redraw();
    };
  });
}
function esc(s){return String(s==null?'':s).replace(/[&<>]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[m]})}
let CHAT_G = 0, CHAT_P = 0, CHAT_DATA = { groups: [], privs: [] };
const SUM_OPEN = new Set();
const CHAT_PAGE_SIZE = 3;
function chatCard(c){
  const st = c.busy ? '<span class="pill busy">回复中</span>' : (Date.now() - c.lastMs < 300000 ? '<span class="pill on">活跃</span>' : '<span class="pill">闲置</span>');
  const dot = c.unread ? '<span class="gdot"></span>' : '';
  const t = c.lastText ? '<div class="msg">最后：'+esc(c.lastText)+'</div>' : '';
  const r = c.replyText ? '<div class="msg reply">回复：'+esc(c.replyText)+'</div>' : '';
  const label = c.kind === 'group'
    ? (c.name ? esc(c.name)+' ('+esc(c.target)+')' : '群 '+esc(c.target))
    : (c.name ? esc(c.name)+'（'+esc(c.target)+'）' : esc(c.target));
  const pct = c.turnPct || 0;
  const bar = '<div style="margin-top:6px"><div style="height:6px;border-radius:4px;background:#22262c;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+(pct>=80?'#e0524a':pct>=50?'#d8a13a':'#4a9e5a')+'"></div></div><div class="cmeta">聊天次数 '+c.turns+'/'+(c.turnsLimit||30)+' 次 · '+Math.round((c.chars||0)/1000)+'k/'+Math.round((c.charLimit||400000)/1000)+'k 字符</div></div>';
  return '<div class="chatcard'+(c.busy?' busy':'')+'"><div class="avwrap"><img class="av" src="'+c.avatar+'" loading="lazy" onerror="this.style.opacity=.15"></div><div class="cbody"><div class="chead">'+dot+'<span class="cname">'+label+'</span>'+st+'</div>'+t+r+'<div class="cmeta">最后活跃 '+esc(c.last)+'</div>'+bar
    + '<div style="margin-top:6px"><button class="ghost" data-sum="'+esc(c.key)+'" style="font-size:11.5px;padding:2px 9px">摘要 ▸</button></div>'
    + '<div data-sumbody="'+esc(c.key)+'" style="display:none;margin-top:8px;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px"></div>'
    + '</div></div>';
}
function chatPager(id, page, total){
  const box = document.getElementById(id);
  if (!box) return;
  const pages = Math.max(1, Math.ceil(total / CHAT_PAGE_SIZE));
  box.innerHTML = total > 0
    ? '<button class="ghost" data-go="prev"'+(page<=0?' disabled':'')+'>‹</button><span>'+(page+1)+' / '+pages+'</span><button class="ghost" data-go="next"'+(page>=pages-1?' disabled':'')+'>›</button>'
    : '';
  box.querySelectorAll('[data-go]').forEach(function(b){
    b.onclick = function(){
      const d = b.dataset.go === 'next' ? 1 : -1;
      if (id === 'chatGPager') { CHAT_G = Math.max(0, Math.min(pages - 1, CHAT_G + d)); } else { CHAT_P = Math.max(0, Math.min(pages - 1, CHAT_P + d)); }
      drawChats();
    };
  });
}
async function openSummary(key, label){
  const overlay = document.getElementById('sumOverlay');
  const grid = document.getElementById('sumGrid');
  const title = document.getElementById('sumTitle');
  if (!overlay || !grid) return;
  let rows = [];
  try { rows = await api('/api/summaries?key=' + encodeURIComponent(key)); } catch {}
  const cells = [];
  for (let i = 0; i < 9; i++) {
    const r = rows[i];
    if (r) {
      const d = new Date(r.at || Date.now());
      const ds = (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      cells.push('<div style="position:relative;border:2px solid #4a5057;background:#0c0e10;padding:7px 8px;height:96px;overflow:auto;font-size:11.5px;line-height:1.55"><div style="color:#8a93a0;margin-bottom:3px">' + esc(ds) + '<span data-sumdel="' + i + '" style="float:right;cursor:pointer;color:#e05555;padding:0 3px">×</span></div>' + esc(String(r.text || '').slice(0, 240)) + '</div>');
    } else {
      cells.push('<div style="border:2px dashed #3a3f45;height:96px;display:flex;align-items:center;justify-content:center;color:#4a5057;font-size:11.5px">空</div>');
    }
  }
  grid.innerHTML = cells.join('');
  grid.querySelectorAll('[data-sumdel]').forEach(function(el){
    el.onclick = function(ev){
      ev.stopPropagation();
      const idx = Number(el.dataset.sumdel);
      askConfirm('删除这条摘要？', async function(){
        await api('/api/summaries', { method:'POST', body: JSON.stringify({ action:'delete', key: key, index: idx })});
        openSummary(key, label);
      });
    };
  });
  if (title) title.textContent = '会话摘要' + (label ? '：' + label : '');
  overlay.style.display = 'flex';
  if (!overlay.__bound) {
    overlay.__bound = true;
    overlay.onclick = function(e){ if (e.target === overlay) overlay.style.display = 'none'; };
    const c = document.getElementById('sumClose');
    if (c) c.onclick = function(){ overlay.style.display = 'none'; };
  }
}
function toggleSummary(key, label){
  openSummary(key, label);
}
function drawChats(){
  const g = CHAT_DATA.groups, p = CHAT_DATA.privs;
  const gStart = CHAT_G * CHAT_PAGE_SIZE, pStart = CHAT_P * CHAT_PAGE_SIZE;
  const gView = g.slice(gStart, gStart + CHAT_PAGE_SIZE);
  const pView = p.slice(pStart, pStart + CHAT_PAGE_SIZE);
  const gBox = document.getElementById('chatGroups');
  const pBox = document.getElementById('chatPrivs');
  gBox.innerHTML = (g.length ? gView.map(chatCard).join('') : '<div style="color:#7d8794;padding:10px 0">还没有群聊会话</div>') + '<div style="height:'+((CHAT_PAGE_SIZE - gView.length) * 140)+'px"></div>';
  pBox.innerHTML = (p.length ? pView.map(chatCard).join('') : '<div style="color:#7d8794;padding:10px 0">还没有私聊会话</div>') + '<div style="height:'+((CHAT_PAGE_SIZE - pView.length) * 140)+'px"></div>';
  document.getElementById('chatGCount').textContent = '共 '+g.length+' 个';
  document.getElementById('chatPCount').textContent = '共 '+p.length+' 个';
  chatPager('chatGPager', CHAT_G, g.length);
  chatPager('chatPPager', CHAT_P, p.length);
  document.querySelectorAll('[data-sum]').forEach(function(btn){
    btn.onclick = function(){
      const card = btn.closest('.chatcard');
      const nameEl = card ? card.querySelector('.cname') : null;
      toggleSummary(btn.dataset.sum, nameEl ? nameEl.textContent.trim() : '');
    };
  });
  }
async function loadChats(){
  const list = await api('/api/chats');
  let contacts = [];
  try { contacts = await api('/api/contacts'); } catch {}
  const names = {};
  for (const c of contacts) names[String(c.qq)] = String(c.name || c.nick || "");
  const all = list.map(function(c){
    c.name = c.kind === 'group' ? (c.name || '') : (names[String(c.target)] || '');
    return c;
  }).sort(function(a, b){ return (b.lastMs || 0) - (a.lastMs || 0); });
  CHAT_DATA.groups = all.filter(function(c){ return c.kind === 'group'; });
  CHAT_DATA.privs = all.filter(function(c){ return c.kind !== 'group'; });
  CHAT_G = Math.min(CHAT_G, Math.max(0, Math.ceil(CHAT_DATA.groups.length / CHAT_PAGE_SIZE) - 1));
  CHAT_P = Math.min(CHAT_P, Math.max(0, Math.ceil(CHAT_DATA.privs.length / CHAT_PAGE_SIZE) - 1));
  drawChats();
}
let MEME_PAGE = 0;
const MEME_OPEN = new Set();
function memeCard(m){
  const t = String(m.title || "");
  return '<div class="chatcard" data-meme="'+esc(t)+'" style="margin:0 0 8px"><div class="cbody" style="min-width:0">'
    + '<div style="display:flex;align-items:center;gap:8px">'
    + '<div data-msec="'+esc(t)+'" style="display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none;font-size:13px;color:#cfd8e3;flex:1;min-width:0">'
    + '<span data-marrow style="width:12px;color:#8a93a0">▸</span>'
    + '<b style="font-size:13.5px">'+esc(t)+'</b>'
    + (m.tag ? '<span class="pill">'+esc(m.tag)+'</span>' : '')
    + '</div>'
    + '<button class="danger" data-mdel="'+esc(t)+'" title="删除这个词条" style="font-size:15px;line-height:1;padding:2px 8px;border-radius:6px">×</button>'
    + '</div>'
    + '<div data-mbody style="display:none;margin-top:8px">'
    + '<div class="row" style="gap:6px;align-items:center;margin-bottom:6px">'
    + '<input data-mt="'+esc(t)+'" value="'+esc(t)+'" placeholder="标题" style="flex:1;min-width:0">'
    + '<input data-mg="'+esc(t)+'" value="'+esc(m.tag||"")+'" placeholder="标签" style="width:120px">'
    + '</div>'
    + '<textarea data-mc="'+esc(t)+'" rows="3" placeholder="内容：梗是什么、出处、什么场合接，随便写" style="width:100%;box-sizing:border-box">'+esc(m.content||"")+'</textarea>'
    + '<div class="row" style="gap:6px;margin-top:6px;justify-content:flex-end">'
    + '<button data-msave="'+esc(t)+'">保存</button>'
    + '</div></div></div></div>';
}
async function loadMemes(page){
  if (typeof page === 'number') MEME_PAGE = page;
  const q = (document.getElementById('memeSearch') || {}).value || '';
  const r = await api('/api/memes?q=' + encodeURIComponent(q));
  const items = r.items || [];
  const cnt = document.getElementById('memeCount');
  if (cnt) cnt.textContent = '共 ' + (r.total !== void 0 ? r.total : items.length) + ' 条';
  const SIZE = 8;
  const pages = Math.max(1, Math.ceil(items.length / SIZE));
  MEME_PAGE = Math.max(0, Math.min(pages - 1, MEME_PAGE));
  const view = items.slice(MEME_PAGE * SIZE, MEME_PAGE * SIZE + SIZE);
  const box = document.getElementById('memeList');
  box.innerHTML = view.length ? view.map(memeCard).join('') : '<div style="color:#7d8794">还没有词条</div>';
  box.querySelectorAll('.chatcard[data-meme]').forEach(function(card){
    const title = card.dataset.meme;
    const body = card.querySelector('[data-mbody]');
    const arrow = card.querySelector('[data-marrow]');
    const apply = function(open){ body.style.display = open ? 'block' : 'none'; if (arrow) arrow.textContent = open ? '▾' : '▸'; };
    apply(MEME_OPEN.has(title));
    card.querySelector('[data-msec]').onclick = function(){
      const open = !MEME_OPEN.has(title);
      if (open) MEME_OPEN.add(title); else MEME_OPEN.delete(title);
      apply(open);
    };
  });
  const pager = document.getElementById('memePager');
  if (pager) {
    pager.innerHTML = '<button class="ghost" data-mgo="prev"' + (MEME_PAGE <= 0 ? ' disabled' : '') + '>‹</button><span>' + (MEME_PAGE + 1) + ' / ' + pages + '</span><button class="ghost" data-mgo="next"' + (MEME_PAGE >= pages - 1 ? ' disabled' : '') + '>›</button>';
    pager.querySelectorAll('[data-mgo]').forEach(function(b){
      b.onclick = function(){ loadMemes(MEME_PAGE + (b.dataset.mgo === 'next' ? 1 : -1)); };
    });
  }
  box.querySelectorAll('[data-msave]').forEach(function(b){
    b.onclick = async function(){
      const oldTitle = b.dataset.msave;
      const card = b.closest('.chatcard');
      const newTitle = (card.querySelector('[data-mt]').value || '').trim() || oldTitle;
      const content = card.querySelector('[data-mc]').value;
      const tag = card.querySelector('[data-mg]').value;
      await api('/api/memes', { method: 'POST', body: JSON.stringify({ title: newTitle, content: content, tag: tag }) });
      if (newTitle !== oldTitle) await api('/api/memes', { method: 'POST', body: JSON.stringify({ deleteTitle: oldTitle }) });
      toast('已保存'); loadMemes();
    };
  });
  box.onclick = async function(ev){
    const x = ev.target && ev.target.closest ? ev.target.closest('[data-mdel]') : null;
    if (!x) return;
    ev.stopPropagation();
    if (x.dataset.arm !== '1') {
      x.dataset.arm = '1';
      x.textContent = '确认?';
      x.style.fontSize = '11.5px';
      clearTimeout(x.__armTimer);
      x.__armTimer = setTimeout(function(){ x.dataset.arm = '0'; x.textContent = '×'; x.style.fontSize = '15px'; }, 3000);
      return;
    }
    clearTimeout(x.__armTimer);
    try {
      await api('/api/memes', { method: 'POST', body: JSON.stringify({ deleteTitle: x.dataset.mdel }) });
      toast('已删除'); loadMemes();
    } catch (e) { toast('删除失败'); }
  };
}
async function addMeme(){
  const title = document.getElementById('memeNewTitle').value.trim();
  const tag = document.getElementById('memeNewTag').value.trim();
  if (!title) { toast('先写标题'); return; }
  await api('/api/memes', { method: 'POST', body: JSON.stringify({ title: title, content: '', tag: tag }) });
  document.getElementById('memeNewTitle').value = '';
  document.getElementById('memeNewTag').value = '';
  toast('已添加'); loadMemes();
}
async function loadLogs(){ const r=await api('/api/logs'); document.getElementById('logs').textContent=r; }
async function loadTics(){
  const groups = await api('/api/tics');
  const allItems = [];
  for (const g of groups) {
    for (const t of (g.list || [])) allItems.push({ key: g.key, scenario: t.scenario || '', phrase: t.phrase || '', count: t.count || 1, kind: t.kind || 'phrase' });
  }
  const SIZE = 8;
  const pages = Math.max(1, Math.ceil(allItems.length / SIZE));
  PAGE_STATE.tic = Math.max(0, Math.min(pages - 1, PAGE_STATE.tic));
  const items = allItems.slice(PAGE_STATE.tic * SIZE, PAGE_STATE.tic * SIZE + SIZE);
  renderPager('ticPager', 'tic', PAGE_STATE.tic, allItems.length, SIZE, loadTics);
  const box = document.getElementById('ticList');
  box.innerHTML = items.length
    ? '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">'
      + items.map(function(t){
          return '<div class="chatcard" style="margin:0"><div class="cbody" style="min-width:0"><div class="row" style="gap:6px;align-items:center;margin-bottom:6px">'
            + (t.kind==='pattern'
                ? '<small style="color:#7d8794">句式不需要场景，听到类似的话就套用</small><span style="flex:1"></span>'
                : '<input data-scen="'+esc(t.phrase)+'" value="'+esc(t.scenario)+'" placeholder="情绪状态（什么心理时用）" style="flex:1;min-width:0">')
            + '</div><div class="row" style="gap:6px;align-items:center">'
            + '<select data-kind="'+esc(t.phrase)+'" style="width:86px"><option value="phrase"'+(t.kind==='phrase'?' selected':'')+'>口头禅</option><option value="pattern"'+(t.kind==='pattern'?' selected':'')+'>句式</option></select>'
            + '<input data-phrase="'+esc(t.phrase)+'" value="'+esc(t.phrase)+'" placeholder="说法" style="flex:1;min-width:0">'
            + '<button data-save="'+esc(t.phrase)+'">保存</button>'
            + '<button class="danger" data-del="'+esc(t.phrase)+'" data-key="'+esc(t.key)+'">删</button>'
            + '</div></div></div>';
        }).join('')
      + '</div>'
    : '<div style="color:#7d8794">还没有语言模仿记录</div>';

  box.querySelectorAll('[data-save]').forEach(function(b){
    b.onclick = function(){ saveTic(b.dataset.save); };
  });
  box.querySelectorAll('[data-del]').forEach(function(b){
    b.onclick = function(){ delTic(b.dataset.key, b.dataset.del); };
  });
}
async function saveTic(oldPhrase){
  const box = document.getElementById('ticList');
  const escSel = (v) => v.replace(/"/g, '\\"');
  const phraseEl = box.querySelector('[data-phrase="'+escSel(oldPhrase)+'"]');
  const scenEl = box.querySelector('[data-scen="'+escSel(oldPhrase)+'"]');
  const kindEl = box.querySelector('[data-kind="'+escSel(oldPhrase)+'"]');
  const phrase = phraseEl ? phraseEl.value.trim() : oldPhrase;
  const kindVal = kindEl ? kindEl.value : 'phrase';
  const scenario = kindVal === 'pattern' ? '' : (scenEl ? scenEl.value.trim() : '');
  if(!phrase){ toast('说法不能空'); return; }
  await api('/api/tics', { method:'PUT', body: JSON.stringify({ key:'global', phrase: oldPhrase, newPhrase: phrase, scenario: scenario, kind: kindVal })});
  toast('已保存'); loadTics();
}
async function loadMood(){
  const allRows = await api('/api/mood');
  const SIZE = 5;
  const pages = Math.max(1, Math.ceil(allRows.length / SIZE));
  PAGE_STATE.mood = Math.max(0, Math.min(pages - 1, PAGE_STATE.mood));
  const rows = allRows.slice(PAGE_STATE.mood * SIZE, PAGE_STATE.mood * SIZE + SIZE);
  renderPager('moodPager', 'mood', PAGE_STATE.mood, allRows.length, SIZE, loadMood);
  const tier = function(v){ return v >= 75 ? '卖萌' : v <= 25 ? '暴躁' : '平常'; };
  document.getElementById('moodList').innerHTML = rows.map(function(r){
    const av = 'https://q1.qlogo.cn/g?b=sdk&nk='+r.qq+'&s=100';
    const pct = Math.max(0, Math.min(100, r.value));
    return '<div class="chatcard"><div class="avwrap"><img class="av" src="'+av+'" loading="lazy" onerror="this.style.opacity=.15"></div><div class="cbody"><div class="chead"><span class="cname">'+esc(r.name||'未知')+'</span><span class="pill">'+esc(r.qq)+'</span><span class="pill">'+tier(r.value)+'</span></div><div class="cmeta">'+r.value+'/100'+(r.reason?(' · 原因：'+esc(r.reason)):'')+'</div><div style="height:6px;border-radius:4px;background:#22262c;overflow:hidden;margin-top:6px"><div style="height:100%;width:'+pct+'%;background:'+(pct>=75?'#4a9e5a':pct<=25?'#e0524a':'#d8a13a')+'"></div></div></div><div style="display:flex;flex-direction:column;gap:6px"><button data-qq="'+r.qq+'" onclick="setMood(this.dataset.qq)">设值</button><button class="danger" data-qq="'+r.qq+'" onclick="clearMood(this.dataset.qq)">清除</button></div></div>';
  }).join('') || '<div style="color:#7d8794">还没有好感度记录</div>';
}
async function setMood(qq){
  const v = prompt('好感度 0-100', '50');
  if(v === null) return;
  await api('/api/mood', { method:'POST', body: JSON.stringify({ qq: qq, value: Number(v) || 0 })});
  loadMood();
}
function clearMood(qq){
  askConfirm('清除 '+qq+' 的好感度记录？', async function(){
    await api('/api/mood', { method:'POST', body: JSON.stringify({ qq: qq, clear: true })});
    loadMood();
  });
}
const CONTACT_OPEN = new Set();
const CONTACT_MEM_PAGE = new Map();
let CONTACT_PAGE = 0;
let MOOD_MAP = {};
function contactMemBox(m){
  return '<div style="border:1px solid rgba(255,255,255,.10);border-radius:8px;padding:7px 9px;margin:5px 0;background:rgba(255,255,255,.025)">'
    + '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">'
    + '<div style="min-width:0;font-size:12.5px;color:#cdd6e0;line-height:1.55">'+esc(m.text)
    + '<div style="font-size:11px;color:#7d8794;margin-top:3px">记住于 '+((function(ts){ if(!ts) return '?'; const d=new Date(ts); return (d.getMonth()+1)+'/'+d.getDate(); })(m.at||m.lastAt))+' · 用过 '+(m.used||0)+' 次'+(m.pinned?' · 已锁定':'')+'</div></div>'
    + '<div style="display:flex;flex-direction:column;gap:5px;align-items:flex-end">'
    + (m.pinned ? '<label style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#f0b04f;cursor:pointer"><input type="checkbox" data-pin="'+m.id+'" checked>锁定</label>' : '<label style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#9aa4b2;cursor:pointer"><input type="checkbox" data-pin="'+m.id+'">锁定</label>')
    + '<button class="danger" data-mem="'+m.id+'" data-act="delete" style="font-size:11px;padding:2px 6px">删</button></div></div></div>';
}
async function loadContacts(){
  const rows = await api('/api/contacts');
  let mem = [];
  try { mem = await api('/api/memory'); } catch {}
  const byQq = {};
  for (const m of mem) { const k = String(m.from || ''); (byQq[k] = byQq[k] || []).push(m); }
  MOOD_MAP = {};
  try { for (const mr of await api('/api/mood')) MOOD_MAP[String(mr.qq)] = mr; } catch {}
  const box = document.getElementById('contactList');
  if (!rows.length) { box.innerHTML = '<div style="color:#7d8794">还没有联系人</div>'; return; }
  const PAGE = 4;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  CONTACT_PAGE = Math.max(0, Math.min(pages - 1, CONTACT_PAGE));
  const view = rows.slice(CONTACT_PAGE * PAGE, CONTACT_PAGE * PAGE + PAGE);
  const pager = document.getElementById('contactPager');
  if (pager) {
    pager.innerHTML = rows.length > PAGE
      ? '<button class="ghost" data-cgo="prev"'+(CONTACT_PAGE<=0?' disabled':'')+'>‹</button><span>'+(CONTACT_PAGE+1)+' / '+pages+'</span><button class="ghost" data-cgo="next"'+(CONTACT_PAGE>=pages-1?' disabled':'')+'>›</button>'
      : '<span>共 '+rows.length+' 人</span>';
    pager.querySelectorAll('[data-cgo]').forEach(function(b){
      b.onclick = function(){
        CONTACT_PAGE = Math.max(0, Math.min(pages - 1, CONTACT_PAGE + (b.dataset.cgo === 'next' ? 1 : -1)));
        loadContacts();
      };
    });
  }
  box.innerHTML = view.map(function(r){
    const av = 'https://q1.qlogo.cn/g?b=sdk&nk='+r.qq+'&s=100';
    const chance = Math.round((r.chance === undefined ? 0.5 : r.chance) * 100);
    const items = byQq[String(r.qq)] || [];
    const infoOpen = CONTACT_OPEN.has(r.qq + ':info');
    const memOpen = CONTACT_OPEN.has(r.qq + ':mem');
    return '<div class="chatcard" data-qq="'+r.qq+'" style="position:relative">'
      + '<div class="avwrap"><img class="av" src="'+av+'" loading="lazy" onerror="this.style.opacity=.15"></div>'
      + '<div class="cbody" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px">'
      + '<div style="display:flex;gap:10px;align-items:stretch">'
      +   '<div style="flex:1;min-width:0;border:1px solid rgba(255,255,255,.08);border-radius:9px;padding:8px 10px">'
      +     '<div data-sec="info" style="cursor:pointer;user-select:none;display:flex;gap:6px;align-items:center;font-size:12.5px;color:#cfd8e3"><span style="width:12px;color:#8a93a0">'+(infoOpen?'▾':'▸')+'</span>基本信息</div>'
      +     '<div style="display:none;margin-top:8px" data-body="info">'
      +       '<label style="font-size:11.5px;color:#8a93a0">名字<input data-f="name" value="'+esc(r.name||'')+'" placeholder="本名" style="width:100%;margin:3px 0 6px"></label>'
      +       '<label style="font-size:11.5px;color:#8a93a0">称呼<input data-f="nick" value="'+esc(r.nick||'')+'" placeholder="平时怎么叫" style="width:100%;margin:3px 0 6px"></label>'
      +       '<label style="font-size:11.5px;color:#8a93a0">简介<textarea data-f="note" rows="3" placeholder="身份、偏好、怎么相处，最多 80 字" style="width:100%;box-sizing:border-box;aspect-ratio:1/1;max-height:150px;min-height:90px;margin:3px 0 6px;resize:vertical">'+esc(r.note||'')+'</textarea></label>'
      +       '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'
      +       '<button data-act="save" style="margin-left:auto">保存</button></div>'
      +     '</div>'
      +   '</div>'
      +   '<div style="flex:1;min-width:0;border:1px solid rgba(255,255,255,.08);border-radius:9px;padding:8px 10px">'
      +     '<div data-sec="mem" style="cursor:pointer;user-select:none;display:flex;gap:6px;align-items:center;font-size:12.5px;color:#cfd8e3"><span style="width:12px;color:#8a93a0">'+(memOpen?'▾':'▸')+'</span>长期记忆 <span class="pill">'+items.length+' 条</span></div>'
      +     '<div style="display:none;margin-top:8px" data-body="mem">'
      +       (function(){
                const PER = 6;
                const pages = Math.max(1, Math.ceil(items.length / PER));
                let pg = CONTACT_MEM_PAGE.get(r.qq) || 0;
                if (pg > pages - 1) { pg = pages - 1; CONTACT_MEM_PAGE.set(r.qq, pg); }
                const slice = items.slice(pg * PER, pg * PER + PER);
                const nav = pages > 1
                  ? '<div style="display:flex;align-items:center;gap:8px;margin:6px 0;color:#8a93a0"><button class="ghost" data-mp="prev" data-mq="'+r.qq+'"'+(pg<=0?' disabled':'')+'>‹</button><span>'+(pg+1)+' / '+pages+'</span><button class="ghost" data-mp="next" data-mq="'+r.qq+'"'+(pg>=pages-1?' disabled':'')+'>›</button></div>'
                  : '';
                return slice.map(contactMemBox).join('') + nav;
              })()
      +       '<div style="display:flex;gap:6px;margin-top:6px"><input data-addmem placeholder="加一条记忆" style="flex:1;min-width:0"><button data-act="addmem" style="white-space:nowrap">添加</button></div>'
      +     '</div>'
      +   '</div>'
      + '</div>'
      + '<div style="position:absolute;top:8px;right:8px"><button class="danger" data-act="del" title="删除这个人" style="font-size:15px;line-height:1;padding:2px 8px;border-radius:6px">×</button></div>'
      + '</div>'
      + (function(){
          const mv = MOOD_MAP[String(r.qq)];
          const val = mv === undefined ? null : Number(mv.value);
          const pct = val === null ? 0 : Math.max(0, Math.min(100, val));
          const color = pct >= 75 ? '#4a9e5a' : pct <= 25 ? '#e0524a' : '#d8a13a';
          return '<div style="display:flex;align-items:center;gap:10px;font-size:12px;color:#9aa4b2;margin-top:6px">'
            + '<span style="white-space:nowrap">好感度</span>'
            + '<b data-moodval style="font-size:17px;line-height:1;min-width:44px;text-align:left;color:'+(val === null ? '#7d8794' : color)+'">'+(val === null ? '—' : val)+'</b>'
            + '<input type="range" min="0" max="100" step="1" value="'+(val === null ? 50 : val)+'" data-act="moodslide" style="flex:1;min-width:0">'
            + '</div>';
        })()
      + '</div>';
  }).join('');

  box.querySelectorAll('.chatcard[data-qq]').forEach(function(card){
    const qq = card.dataset.qq;
    const infoBody = card.querySelector('[data-body="info"]');
    const memBody = card.querySelector('[data-body="mem"]');
    if (CONTACT_OPEN.has(qq + ':info')) infoBody.style.display = 'block';
    if (CONTACT_OPEN.has(qq + ':mem')) memBody.style.display = 'block';
    card.querySelector('[data-sec="info"]').onclick = function(){
      const k = qq + ':info';
      if (CONTACT_OPEN.has(k)) CONTACT_OPEN.delete(k); else CONTACT_OPEN.add(k);
      infoBody.style.display = CONTACT_OPEN.has(k) ? 'block' : 'none';
      const sp = card.querySelector('[data-sec="info"] span'); if (sp) sp.textContent = CONTACT_OPEN.has(k) ? '▾' : '▸';
    };
    card.querySelector('[data-sec="mem"]').onclick = function(){
      const k = qq + ':mem';
      if (CONTACT_OPEN.has(k)) CONTACT_OPEN.delete(k); else CONTACT_OPEN.add(k);
      memBody.style.display = CONTACT_OPEN.has(k) ? 'block' : 'none';
      const sp = card.querySelector('[data-sec="mem"] span'); if (sp) sp.textContent = CONTACT_OPEN.has(k) ? '▾' : '▸';
    };
    card.querySelectorAll('[data-mp]').forEach(function(b){
      b.onclick = function(){
        const q = b.dataset.mq;
        const total = (byQq[String(q)] || []).length;
        const pages = Math.max(1, Math.ceil(total / 6));
        let pg = CONTACT_MEM_PAGE.get(q) || 0;
        pg = Math.max(0, Math.min(pages - 1, pg + (b.dataset.mp === 'next' ? 1 : -1)));
        CONTACT_MEM_PAGE.set(q, pg);
        loadContacts();
      };
    });
    const get = function(f){ return card.querySelector('[data-f="'+f+'"]'); };
    const saveBtn = card.querySelector('[data-act="save"]');
    if (saveBtn) saveBtn.onclick = async function(){
      await api('/api/contacts', { method:'PUT', body: JSON.stringify({
        qq: qq,
        name: get('name').value.trim(),
        nick: get('nick').value.trim(),
        note: get('note').value.trim(),
      })});
      toast('已保存'); loadContacts();
    };
    const addBtn = card.querySelector('[data-act="addmem"]');
    if (addBtn) addBtn.onclick = async function(){
      const input = card.querySelector('[data-addmem]');
      const text = input.value.trim();
      if (!text) { toast('写点什么'); return; }
      await api('/api/memory', { method:'POST', body: JSON.stringify({ action:'add', text: text, from: qq })});
      toast('已添加'); loadContacts();
    };
    card.querySelectorAll('[data-mem]').forEach(function(b){
      b.onclick = function(){ memAct(b.dataset.mem, b.dataset.act); };
    });
    card.querySelectorAll('[data-pin]').forEach(function(cb){
      cb.onchange = function(){ memAct(cb.dataset.pin, cb.checked ? 'pin' : 'unpin'); };
    });
    card.querySelector('[data-act="del"]').onclick = function(){ delContact(qq); };
    const ms = card.querySelector('[data-act="moodslide"]');
    if (ms) {
      const lab = card.querySelector('[data-moodval]');
      const paint = function(v){ if (!lab) return; lab.textContent = v; lab.style.color = v >= 75 ? '#4a9e5a' : v <= 25 ? '#e0524a' : '#d8a13a'; };
      ms.oninput = function(){ paint(ms.value); };
      ms.onchange = async function(){
        await api('/api/mood', { method:'POST', body: JSON.stringify({ qq: qq, value: Number(ms.value) }) });
        toast('好感度已设为 ' + ms.value);
      };
    }

  });
}
async function saveContact(){
  const qq = String(document.getElementById('cQQ').value || '').trim();
  if(!/^\\d{5,12}$/.test(qq)){ toast('QQ 号不对'); return; }
  const name = document.getElementById('cName').value.trim();
  const nick = document.getElementById('cNick').value.trim();
  const note = document.getElementById('cNote').value.trim();
  await api('/api/contacts', { method:'PUT', body: JSON.stringify({ qq: qq, name: name, nick: nick, note: note })});
  toast('已保存'); loadContacts();
}
function delContact(qq){ askConfirm('删除 '+qq+' 的称呼？', async function(){ await api('/api/contacts?qq='+encodeURIComponent(qq),{method:'DELETE'}); loadContacts(); }); }
let LIST_STATE = { owners: [], admins: [] };
let LIST_LOADED = false;
function renderChips(){
  const draw = function(key, wrapId){
    const wrap = document.getElementById(wrapId);
    if(!wrap) return;
    const list = LIST_STATE[key] || [];
    wrap.innerHTML = list.length
      ? list.map(function(v){
          const av = 'https://q1.qlogo.cn/g?b=sdk&nk='+encodeURIComponent(String(v))+'&s=100';
          return '<span class="chip" style="display:inline-flex;align-items:center;gap:6px">'
            + '<img src="'+av+'" loading="lazy" onerror="this.style.opacity=.2" style="width:22px;height:22px;border-radius:50%;object-fit:cover">'
            + esc(v)
            + ' <button class="danger" data-del-key="'+key+'" data-del-val="'+esc(v)+'" style="padding:0 4px">×</button></span>';
        }).join('')
      : '<span style="color:#7d8794">空</span>';
    wrap.querySelectorAll("[data-del-key]").forEach(function(b){
      b.onclick = function(){ delChip(b.dataset.delKey, b.dataset.delVal); };
    });
  };
  draw('owners', 'ownersChips');
  draw('admins', 'adminsChips');
}
async function loadAdmins(){
  LIST_LOADED = true;
  LIST_STATE = await api('/api/lists');
  renderChips();
}
function delChip(key, val){
  LIST_STATE[key] = (LIST_STATE[key] || []).filter(function(v){ return v !== val; });
  renderChips();
  try { if (LIST_LOADED) saveAdmins(); } catch (e) {}
}
function addChip(key){
  const input = document.getElementById(key === 'owner' ? 'ownerAdd' : 'adminAdd');
  const v = input.value.trim();
  if(!/^\\d{5,12}$/.test(v)) { toast('QQ 号不对'); return; }
  const k = key === 'owner' ? 'owners' : 'admins';
  if(!(LIST_STATE[k] || []).includes(v)) (LIST_STATE[k] = LIST_STATE[k] || []).push(v);
  input.value = '';
  renderChips();
  try { if (LIST_LOADED) saveAdmins(); } catch (e) {}
}
async function saveAdmins(){
  await api('/api/lists', { method: 'POST', body: JSON.stringify({ owners: LIST_STATE.owners, admins: LIST_STATE.admins })});
  toast('名单已保存');
}
async function loadReminders(){
  const list=await api('/api/reminders');
  const html=list.map(function(r){
    return '<div class="chatcard"><div class="avwrap"><img class="av" src="'+r.avatar+'" loading="lazy" onerror="this.style.opacity=.15"></div><div class="cbody"><div class="chead"><span class="cname">'+esc(r.kind)+' '+esc(r.target)+'</span><span class="pill">'+esc(r.time)+'</span></div><div class="msg">'+esc(r.text)+'</div><div class="cmeta">发起人 '+esc(r.requester)+'</div></div><button class="danger" data-id="'+r.id+'" onclick="delReminder(this.dataset.id)">删除</button></div>';
  }).join('');
  document.getElementById('remindList').innerHTML=html||'<div style="color:#7d8794">没有待办</div>';
}
function delReminder(id){ askConfirm('删除这条待办？', async function(){ await api('/api/reminders?id='+encodeURIComponent(id),{method:'DELETE'}); loadReminders(); }); }
async function addTic(){
  const scenario = document.getElementById('ticScenario').value.trim();
  const phrase = document.getElementById('ticPhrase').value.trim();
  const kind = document.getElementById('ticKind').value;
  if(!phrase || (kind !== 'pattern' && !scenario)){ toast('口头禅要填情绪状态，句式只填说法'); return; }
  await api('/api/tics', { method:'POST', body: JSON.stringify({ scenario: scenario, phrase: phrase, kind: kind })});
  document.getElementById('ticScenario').value=''; document.getElementById('ticPhrase').value='';
  toast('已添加'); loadTics();
}
function delTic(key,phrase){ askConfirm('删除「'+phrase+'」？', async function(){ await api('/api/tics',{method:'DELETE',body:JSON.stringify({key:key,phrase:phrase})}); loadTics(); }); }
setInterval(function(){var t=document.querySelector('.tab.on');if(t&&t.dataset.id==='chats')loadChats();},5000);
load();
</script>
</html>`;

function auth(req) {
  return req.headers["x-admin-token"] === TOKEN || new URL(req.url, "http://x").searchParams.get("t") === TOKEN;
}
function body(req) {
  return new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => resolve(d ? JSON.parse(d) : {}));
  });
}
function personaFiles() {
  try {
    return readdirSync(PDIR).filter((n) => n.endsWith(".md")).sort();
  } catch {
    return [];
  }
}
function stickerNames() {
  try {
    return readdirSync(STICKERS).filter((n) => IMG.test(n));
  } catch {
    return [];
  }
}
function json(res, obj, code = 200) {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

export async function startConsole(opts = {}) {
  PROFILE = opts.dataDir || process.env.DSH_PROFILE_DIR || process.cwd();
  PDIR = join(PROFILE, "persona");
  SETTINGS = join(PROFILE, "qq-settings.json");
  STICKERS = join(PROFILE, "stickers");
  TOKEN = String(opts.token || "change-me");
  PORT = Number(opts.port || 8090);
  const HOST = opts.host || "127.0.0.1";

  const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try { res.setHeader("cache-control", "no-store, must-revalidate"); res.setHeader("pragma", "no-cache"); } catch {}
  if (url.pathname === "/open") {
    res.writeHead(302, { location: "/?t=" + encodeURIComponent(TOKEN) });
    return res.end();
  }
  if (url.pathname === "/") {
    const __ae = String(req.headers["accept-encoding"] || "");
    if (__ae.includes("gzip")) {
      try {
        const __z = process.getBuiltinModule("node:zlib");
        const __buf = __z.gzipSync(Buffer.from(page, "utf8"));
        res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-encoding": "gzip", "vary": "accept-encoding", "content-length": __buf.length });
        return res.end(__buf);
      } catch {}
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    return res.end(page);
  }
  if (url.pathname.startsWith("/fonts/")) {
    try {
      const name = basename(url.pathname);
      if (!/^[A-Za-z0-9._-]+$/.test(name)) { res.writeHead(400).end("bad name"); return; }
      const buf = readFileSync(join(FONT_DIR, name));
      const type = name.endsWith(".woff2") ? "font/woff2" : name.endsWith(".txt") ? "text/plain; charset=utf-8" : "application/octet-stream";
      res.writeHead(200, { "content-type": type, "cache-control": "public, max-age=86400" });
      return res.end(buf);
    } catch {
      res.writeHead(404).end("not found");
      return;
    }
  }
  const qtParam = url.searchParams.get("t") || "";
  const proxyPath = url.pathname.startsWith("/napcat/") || url.pathname.startsWith("/webui/") || url.pathname.startsWith("/assets/");
  if (!auth(req) && !(proxyPath && (qtParam === TOKEN || url.pathname.startsWith("/webui/") || url.pathname.startsWith("/assets/")))) {
    res.writeHead(401, { "content-type": "text/plain; charset=utf-8" });
    return res.end("unauthorized");
  }
  try {
    if (url.pathname === "/api/state") {
      const dsh = await run("systemctl", ["is-active", "dsh-qqbot"]);
      const nap = await run("bash", ["-c", "ss -tn | grep -q ':3001' && echo yes || echo no"]);
      const settings = existsSync(SETTINGS) ? JSON.parse(noBom(readFileSync(SETTINGS, "utf8"))) : {};
      return json(res, {
        files: personaFiles().map((n) => ({ name: n, key: n.replace(/\W/g, ""), label: LABEL[n] || n.replace(/\.md$/, ""), text: noBom(readFileSync(join(PDIR, n), "utf8")) })),
        botNames: Array.isArray(settings.botNames) ? settings.botNames : [],
        settings,
        stickers: stickerNames(),
        status: { dsh: dsh.stdout.trim(), napcat: nap.stdout.trim() === "yes" }
      });
    }
    if (url.pathname === "/api/botname" && req.method === "POST") {
      const b = await body(req);
      const list = Array.isArray(b.names) ? b.names.map((v) => String(v || "").trim()).filter((v) => v !== "") : [];
      if (list.length === 0) { res.writeHead(400).end("empty"); return; }
      let st = {};
      try { st = JSON.parse(noBom(readFileSync(SETTINGS, "utf8"))); } catch {}
      st.botNames = list.slice(0, 8);
      writeFileSync(SETTINGS, JSON.stringify(st, null, 1), "utf8");
      return json(res, { ok: true, botNames: st.botNames });
    }
    if (url.pathname === "/api/file" && req.method === "POST") {
      const b = await body(req);
      const name = basename(String(b.name || ""));
      if (!name.endsWith(".md")) throw new Error("bad file");
      writeFileSync(join(PDIR, name), String(b.text ?? ""), "utf8");
      return json(res, { ok: true });
    }
    if (url.pathname === "/api/slang") {
      const SF = join(PROFILE, "slang.json");
      const loadS = () => { try { const v = JSON.parse(noBom(readFileSync(SF, "utf8"))); return v && typeof v === "object" ? v : {}; } catch { return {}; } };
      if (req.method === "GET") return json(res, loadS());
      const b = await body(req);
      const map = loadS();
      const term = String(b.term || "").trim();
      const oldTerm = String(b.oldTerm || term).trim();
      if (req.method === "POST") {
        if (term === "") throw new Error("bad term");
        if (oldTerm !== term) delete map[oldTerm];
        map[term] = String(b.meaning || "").trim().slice(0, 60);
        const __sk = Object.keys(map);
        if (__sk.length > 40) for (const k of __sk.slice(0, __sk.length - 40)) delete map[k];
        writeFileSync(SF, JSON.stringify(map, null, 1), "utf8");
        return json(res, { ok: true });
      }
      if (req.method === "DELETE") {
        delete map[oldTerm];
        writeFileSync(SF, JSON.stringify(map, null, 1), "utf8");
        return json(res, { ok: true });
      }
    }
    if (url.pathname === "/api/banned") {
      const loadW = () => { try { const st = JSON.parse(noBom(readFileSync(SETTINGS, "utf8"))); return Array.isArray(st.bannedWords) ? st.bannedWords.map((v) => String(v)) : []; } catch { return []; } };
      const saveW = (list) => { let st = {}; try { st = JSON.parse(noBom(readFileSync(SETTINGS, "utf8"))); } catch {} st.bannedWords = list; writeFileSync(SETTINGS, JSON.stringify(st, null, 2), "utf8"); };
      if (req.method === "GET") return json(res, loadW());
      const b = await body(req);
      const list = loadW();
      if (req.method === "POST") {
        const w = String(b.word || "").trim();
        if (w === "") throw new Error("bad word");
        if (!list.includes(w)) list.push(w);
        saveW(list.slice(-40));
        return json(res, { ok: true });
      }
      if (req.method === "DELETE") {
        const w = String(b.word || "").trim();
        saveW(list.filter((x) => x !== w));
        return json(res, { ok: true });
      }
    }
    if (url.pathname === "/api/bili/qr/new" && req.method === "POST") {
      try {
        const r = await fetch("https://passport.bilibili.com/x/passport-login/web/qrcode/generate?source=main-fe-header", { headers: { "user-agent": "Mozilla/5.0", referer: "https://www.bilibili.com/" }, signal: AbortSignal.timeout(15000) });
        const j = await r.json();
        const d = j && j.data;
        if (!d || !d.qrcode_key) throw new Error("生成失败");
        return json(res, { ok: true, key: d.qrcode_key, url: d.url });
      } catch (e) { return json(res, { ok: false, error: String(e) }); }
    }
    if (url.pathname === "/api/bili/avatar") {
      try {
        const u = url.searchParams.get("u") || "";
        if (!/^https?:\/\//i.test(u)) { res.writeHead(400).end(); return; }
        const r = await fetch(u, { headers: { "user-agent": "Mozilla/5.0", referer: "https://www.bilibili.com/" }, signal: AbortSignal.timeout(10000) });
        if (!r.ok) { res.writeHead(502).end(); return; }
        const buf = Buffer.from(await r.arrayBuffer());
        res.writeHead(200, { "content-type": r.headers.get("content-type") || "image/jpeg", "cache-control": "max-age=3600" });
        return res.end(buf);
      } catch (e) { try { res.writeHead(502).end(); } catch {} return; }
    }
    if (url.pathname === "/api/bili/memories") {
      const MF = join(PROFILE, "bili-memory.json");
      const load = () => { try { const a = JSON.parse(noBom(readFileSync(MF, "utf8"))); return Array.isArray(a) ? a : []; } catch { return []; } };
      if (req.method === "GET") return json(res, load().slice().reverse());
      if (req.method === "DELETE") {
        const b = await body(req);
        const bv = String(b.bvid || "");
        writeFileSync(MF, JSON.stringify(load().filter((x) => String(x.bvid || "") !== bv)), "utf8");
        return json(res, { ok: true });
      }
    }
    if (url.pathname === "/api/self") {
      try {
        const f = join(PROFILE, "self.json");
        const d = JSON.parse(noBom(readFileSync(f, "utf8")));
        return json(res, { ok: true, id: String(d.id || ""), nick: String(d.nick || "") });
      } catch { return json(res, { ok: false }); }
    }
    if (url.pathname === "/api/bili/me") {
      try {
        const st = JSON.parse(noBom(readFileSync(SETTINGS, "utf8").replace(/^\uFEFF/, "")));
        const cookie = String(st.biliCookie || "").trim();
        if (cookie === "") return json(res, { ok: true, loggedIn: false });
        const nr = await fetch("https://api.bilibili.com/x/web-interface/nav", { headers: { "user-agent": "Mozilla/5.0", referer: "https://www.bilibili.com/", cookie }, signal: AbortSignal.timeout(10000) });
        const nj = await nr.json();
        const d = nj && nj.data;
        if (!d || d.isLogin !== true) return json(res, { ok: true, loggedIn: false });
        return json(res, { ok: true, loggedIn: true, name: d.uname || "", face: d.face || "", level: d.level_info && d.level_info.current_level });
      } catch (e) { return json(res, { ok: false, error: String(e) }); }
    }
    if (url.pathname === "/api/bili/qr/poll") {
      const qkey = url.searchParams.get("key") || "";
      try {
        const r = await fetch("https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=" + encodeURIComponent(qkey) + "&source=main-fe-header", { headers: { "user-agent": "Mozilla/5.0", referer: "https://www.bilibili.com/" }, redirect: "manual", signal: AbortSignal.timeout(15000) });
        const j = await r.json();
        const d = j && j.data;
        const code = d && d.code;
        if (code === 0) {
          const sc = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [];
          let cookie = sc.map((v) => String(v).split(";")[0]).filter((v) => v.includes("=")).join("; ");
          try {
            const fr = await fetch("https://api.bilibili.com/x/frontend/finger/spi", { headers: { "user-agent": "Mozilla/5.0", referer: "https://www.bilibili.com/" }, signal: AbortSignal.timeout(10000) });
            const fj = await fr.json();
            const b3 = fj && fj.data && fj.data.b_3;
            if (b3 && !cookie.includes("buvid3=")) cookie += (cookie ? "; " : "") + "buvid3=" + b3;
          } catch {}
          const st = JSON.parse(noBom(readFileSync(SETTINGS, "utf8").replace(/^\uFEFF/, "")));
          st.biliCookie = cookie;
          writeFileSync(SETTINGS, JSON.stringify(st, null, 2), "utf8");
          let name = "";
          let face = "";
          try {
            const nr = await fetch("https://api.bilibili.com/x/web-interface/nav", { headers: { "user-agent": "Mozilla/5.0", referer: "https://www.bilibili.com/", cookie }, signal: AbortSignal.timeout(10000) });
            const nj = await nr.json();
            name = (nj && nj.data && nj.data.uname) || "";
            face = (nj && nj.data && nj.data.face) || "";
          } catch {}
          return json(res, { ok: true, code: 0, name, face });
        }
        return json(res, { ok: true, code, message: (d && d.message) || "" });
      } catch (e) { return json(res, { ok: false, error: String(e) }); }
    }
    if (url.pathname === "/api/settings" && req.method === "POST") {
      const b = await body(req);
      const cur = existsSync(SETTINGS) ? JSON.parse(noBom(readFileSync(SETTINGS, "utf8"))) : {};
      const keys = ["stickerChance", "groupAmbientChance", "knownChance", "groupFollowUpSeconds", "messageBufferMs", "replyTwoPartChance", "replyMaxParts", "replyPartChars", "sendGapMs", "replyBudgetPerMin", "proactiveChance", "chatVideoChance", "moodCooldownTurns", "sessionWindowTurns", "sessionResetMinutes", "sessionCharLimit", "proactiveVideoChance", "ttsVoice", "biliCookie", "baiduCookie", "bannedWords", "pokeReplies", "arkKey", "groupAlwaysUsers", "proxyUrl", "clashApi", "clashGroup"];
      const next = { ...cur };
      for (const k of keys) if (b[k] !== void 0) next[k] = b[k];
      writeFileSync(SETTINGS, JSON.stringify(next, null, 2), "utf8");
      return json(res, { ok: true });
    }
    if (url.pathname === "/api/sticker" && req.method === "GET") {
      const name = basename(url.searchParams.get("name") || "");
      if (!IMG.test(name)) throw new Error("bad name");
      if (url.searchParams.get("thumb") === "1") {
        try {
          const tdir = join(STICKERS, ".thumbs");
          const tpath = join(tdir, name + ".jpg");
          if (!existsSync(tpath)) {
            mkdirSync(tdir, { recursive: true });
            const __cp = process.getBuiltinModule("node:child_process");
            await new Promise((resolve, reject) => {
              __cp.execFile("ffmpeg", ["-y", "-loglevel", "error", "-i", join(STICKERS, name), "-vf", "scale=180:-1:flags=lanczos", "-frames:v", "1", tpath], (err) => err ? reject(err) : resolve());
            });
          }
          if (existsSync(tpath)) {
            res.writeHead(200, { "content-type": "image/jpeg", "cache-control": "public, max-age=604800" });
            return res.end(readFileSync(tpath));
          }
        } catch {}
      }
      if (url.searchParams.get("anim") === "1") {
        try {
          const adir = join(STICKERS, ".thumbs");
          const apath = join(adir, name + ".v2.webp");
          if (!existsSync(apath)) {
            mkdirSync(adir, { recursive: true });
            const __cp = process.getBuiltinModule("node:child_process");
            await new Promise((resolve, reject) => {
              __cp.execFile("ffmpeg", ["-y", "-loglevel", "error", "-i", join(STICKERS, name), "-vf", "fps=8,scale=120:-1:flags=lanczos", "-loop", "0", apath], (err) => err ? reject(err) : resolve());
            });
          }
          if (existsSync(apath)) {
            res.writeHead(200, { "content-type": "image/webp", "cache-control": "public, max-age=604800" });
            return res.end(readFileSync(apath));
          }
        } catch {}
      }
      const data = readFileSync(join(STICKERS, name));
      const ext = name.split(".").pop().toLowerCase();
      res.writeHead(200, { "content-type": "image/" + (ext === "jpg" ? "jpeg" : ext), "cache-control": "public, max-age=604800" });
      return res.end(data);
    }
    if (url.pathname === "/api/sticker" && req.method === "POST") {
      const b = await body(req);
      const name = basename(String(b.name || "upload.png"));
      if (!IMG.test(name)) throw new Error("bad type");
      writeFileSync(join(STICKERS, name), Buffer.from(String(b.data || ""), "base64"));
      try {
        const names = readdirSync(STICKERS).filter((n) => IMG.test(n));
        if (names.length > 100) {
          const items = names.map((n) => {
            let m = 0;
            try { m = statSync(join(STICKERS, n)).mtimeMs; } catch {}
            return { n, m };
          }).sort((a, b) => a.m - b.m);
          for (const it of items.slice(0, items.length - 100)) {
            try { unlinkSync(join(STICKERS, it.n)); } catch {}
          }
        }
      } catch {}
      return json(res, { ok: true });
    }
    if (url.pathname === "/api/sticker" && req.method === "DELETE") {
      const name = basename(url.searchParams.get("name") || "");
      if (!IMG.test(name)) throw new Error("bad name");
      unlinkSync(join(STICKERS, name));
      return json(res, { ok: true });
    }
    if (url.pathname === "/api/memory") {
      const MF = join(PROFILE, "memories.json");
      const load = () => {
        try {
          const arr = JSON.parse(noBom(readFileSync(MF, "utf8")));
          return Array.isArray(arr) ? arr : [];
        } catch { return []; }
      };
      if (req.method === "GET") {
        const rows = load().map((m) => ({
          id: String(m.id || ""),
          text: String(m.text || ""),
          from: String(m.from || ""),
          name: String(m.name || ""),
          weight: Number(m.weight || 1),
          at: Number(m.at || 0),
          lastAt: Number(m.lastAt || 0),
          used: Number(m.used || 0),
          pinned: m.pinned === true,
          kind: String(m.kind || "active")
        })).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.weight - a.weight);
        return json(res, rows);
      }
      if (req.method === "POST") {
        const b = await body(req);
        const id = String(b.id || "");
        const act = String(b.action || "");
        let list = load();
        if (act === "add") {
          const text = String(b.text || "").trim().slice(0, 200);
          if (text === "") throw new Error("bad text");
          list.push({ id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text, from: String(b.from || ""), name: String(b.name || ""), weight: Number(b.weight || 1), at: Date.now(), lastAt: Date.now(), used: 0, pinned: b.pinned === true });
          const __from = String(b.from || "");
          const __mine = list.filter((m) => String(m.from || "") === __from);
          if (__mine.length > 45) {
            const __drop = new Set(__mine.filter((m) => m.pinned !== true).slice(0, __mine.length - 45).map((m) => m.id));
            for (let i = list.length - 1; i >= 0; i--) if (__drop.has(list[i] && list[i].id)) list.splice(i, 1);
          }
        } else if (act === "delete") {
          list = list.filter((m) => String(m.id) !== id);
        } else if (act === "pin" || act === "unpin") {
          const m = list.find((x) => String(x.id) === id);
          if (m) m.pinned = act === "pin";
        } else if (act === "weight") {
          const m = list.find((x) => String(x.id) === id);
          if (m) m.weight = Math.max(0, Math.min(20, Number(b.weight || 1)));
        } else {
          throw new Error("bad action");
        }
        writeFileSync(MF, JSON.stringify(list, null, 1), "utf8");
        return json(res, { ok: true });
      }
    }
async function groupNamesCached(force) {
  const f = join(PROFILE, "groupnames.json");
  try {
    const d = JSON.parse(noBom(readFileSync(f, "utf8")));
    if (!force && d && d.__at && Date.now() - Number(d.__at) < 3600000) return d;
  } catch {}
  try {
    const { default: WS } = await import("/root/.dsh/profiles/qqbot/node_modules/ws/index.js");
    const out = await new Promise((resolve) => {
      const ws = new WS("ws://127.0.0.1:3001");
      const done = (v) => { try { ws.close(); } catch {} resolve(v); };
      const timer = setTimeout(() => done({}), 6000);
      ws.on("open", () => ws.send(JSON.stringify({ action: "get_group_list", params: {}, echo: "gn" })));
      ws.on("message", (raw) => {
        let d;
        try { d = JSON.parse(String(raw && raw.data ? raw.data : raw)); } catch { return; }
        if (d.echo !== "gn") return;
        clearTimeout(timer);
        const map = { __at: Date.now() };
        for (const g of (Array.isArray(d.data) ? d.data : [])) {
          const id = String((g && g.group_id) || "");
          if (id !== "") map[id] = String((g && g.group_name) || "");
        }
        done(map);
      });
      ws.on("error", () => { clearTimeout(timer); done({}); });
    });
    if (Object.keys(out).length > 1) writeFileSync(f, JSON.stringify(out), "utf8");
    return out;
  } catch {
    return {};
  }
}
    if (url.pathname === "/api/mood") {
      const MF = join(PROFILE, "mood.json");
      const MMF = join(PROFILE, "moodmeta.json");
      const loadJ = (f) => { try { return JSON.parse(noBom(readFileSync(f, "utf8"))); } catch { return {}; } };
      if (req.method === "GET") {
        const moods = loadJ(MF);
        const meta = loadJ(MMF);
        const contacts = loadJ(join(PROFILE, "contacts.json"));
        const rows = Object.keys(moods).map((qq) => {
          const v = Number(moods[qq]);
          const m = meta[qq] && typeof meta[qq] === "object" ? meta[qq] : {};
          const c = contacts[qq];
          const name = c && typeof c === "object" ? String(c.nick || c.name || "") : String(c || "");
          return { qq, name, value: Number.isFinite(v) ? v : 50, state: String(m.state || ""), reason: String(m.reason || "") };
        }).sort((a, b) => a.value - b.value);
        return json(res, rows);
      }
      if (req.method === "POST") {
        const b = await body(req);
        const qq = String(b.qq || "").replace(/\D/g, "");
        if (!/^\d{5,12}$/.test(qq)) throw new Error("bad qq");
        const moods = loadJ(MF);
        const meta = loadJ(MMF);
        if (b.clear === true) {
          delete moods[qq];
          delete meta[qq];
        } else if (typeof b.value === "number") {
          moods[qq] = Math.max(0, Math.min(100, Math.round(b.value)));
          meta[qq] = Object.assign({}, meta[qq] || {}, { state: "", tierCd: 99, noticeCd: 99, reason: "" });
        }
        writeFileSync(MF, JSON.stringify(moods), "utf8");
        writeFileSync(MMF, JSON.stringify(meta), "utf8");
        return json(res, { ok: true });
      }
    }
    if (url.pathname === "/api/summaries" && req.method === "POST") {
      const sf = join(PROFILE, "summaries.json");
      const b = await body(req);
      const k = String(b.key || "");
      const idx = Number(b.index);
      let all = {};
      try { all = JSON.parse(noBom(readFileSync(sf, "utf8"))); } catch { all = {}; }
      const arr = Array.isArray(all[k]) ? all[k] : [];
      if (!Number.isInteger(idx) || idx < 0 || idx >= arr.length) { res.writeHead(400).end("bad index"); return; }
      arr.splice(idx, 1);
      all[k] = arr;
      writeFileSync(sf, JSON.stringify(all), "utf8");
      return json(res, { ok: true });
    }
    if (url.pathname === "/api/summaries" && req.method === "GET") {
      const key = String(url.searchParams.get("key") || "");
      let all = {};
      try { all = JSON.parse(noBom(readFileSync(join(PROFILE, "summaries.json"), "utf8"))); } catch {}
      const arr = Array.isArray(all[key]) ? all[key] : [];
      return json(res, arr.slice(-9).reverse());
    }
    if (url.pathname === "/api/chats") {
      const SF = join(PROFILE, "state.json");
      let st = {};
      try { st = JSON.parse(noBom(readFileSync(SF, "utf8"))); } catch {}
      const rows = [];
      for (const k of Object.keys(st)) {
        const parts = String(k).split(":");
        const kind = parts[3] === "group" ? "group" : "private";
        const gid = parts[4] || "";
        const uid = parts[6] || "";
        const v = st[k] || {};
        const target = kind === "group" ? gid : uid;
        rows.push({
          key: k,
          kind,
          target,
          avatar: kind === "group"
            ? "https://p.qlogo.cn/gh/" + gid + "/" + gid + "/100"
            : "https://q1.qlogo.cn/g?b=sdk&nk=" + uid + "&s=100",
          busy: v.busy === true,
          unread: v.unread === true,
          lastMs: Number(v.lastActiveAt || v.replyAt || 0),
          lastText: String(v.lastText || ""),
          replyText: String(v.lastReply || ""),
          turns: Number(v.turns || 0),
          chars: Number(v.chars || 0),
          last: (function (ms) {
            if (!ms) return "-";
            const diff = Date.now() - ms;
            if (diff < 60000) return "刚刚";
            if (diff < 3600000) return Math.floor(diff / 60000) + " 分钟前";
            if (diff < 86400000) return Math.floor(diff / 3600000) + " 小时前";
            return Math.floor(diff / 86400000) + " 天前";
          })(Number(v.lastActiveAt || v.replyAt || 0)),
          mem: 0,
          name: ""
        });
      }
      try {
        let gn = await groupNamesCached(false);
        const missing = rows.some((r) => r.kind === "group" && !gn[r.target]);
        if (missing) gn = await groupNamesCached(true);
        for (const r of rows) {
          if (r.kind === "group") r.name = String(gn[r.target] || "");
        }
      } catch {}
      try {
        const mf = join(PROFILE, "memories.json");
        const mems = JSON.parse(noBom(readFileSync(mf, "utf8")));
        if (Array.isArray(mems)) {
          const byUser = {};
          for (const m of mems) {
            const from = String((m && m.from) || "");
            if (from === "") continue;
            byUser[from] = (byUser[from] || 0) + 1;
          }
          for (const r of rows) {
            if (r.kind === "private") r.mem = byUser[r.target] || 0;
          }
        }
      } catch {}
      const __keep = rows.filter((r) => !(r.kind === "group" && String(r.key || "").split(":").pop() !== "-"));
      rows.length = 0;
      rows.push(...__keep);
      rows.sort((a, b) => b.lastMs - a.lastMs);
      const merged = [];
      const seen = new Map();
      for (const r of rows) {
        const id = r.kind + ":" + r.target;
        const prev = seen.get(id);
        if (prev === void 0) {
          const copy = Object.assign({}, r, { users: 1 });
          seen.set(id, copy);
          merged.push(copy);
        } else {
          prev.users = (prev.users || 1) + 1;
          prev.mem = (prev.mem || 0) + (r.mem || 0);
          if (r.kind === 'group') {
            prev.turns = (prev.turns || 0) + (r.turns || 0);
            prev.chars = (prev.chars || 0) + (r.chars || 0);
          } else {
            prev.turns = Math.max(prev.turns || 0, r.turns || 0);
            prev.chars = Math.max(prev.chars || 0, r.chars || 0);
          }
          if (r.lastMs > prev.lastMs) {
            prev.lastMs = r.lastMs;
            prev.lastText = r.lastText;
            prev.replyText = r.replyText;
            prev.last = r.last;
            prev.busy = r.busy;
          }
        }
      }
      merged.sort((a, b) => b.lastMs - a.lastMs);
      let turnsLimit = 30;
      let charLimit = 400000;
      try {
        const st = JSON.parse(noBom(readFileSync(join(PROFILE, "qq-settings.json"), "utf8")));
        if (typeof st.sessionWindowTurns === "number") turnsLimit = st.sessionWindowTurns;
        if (typeof st.sessionCharLimit === "number") charLimit = st.sessionCharLimit;
      } catch {}
      for (const r of merged) {
        r.turnsLimit = turnsLimit;
        r.charLimit = charLimit;
        r.turnPct = Math.max(0, Math.min(100, Math.round((r.turns / Math.max(1, turnsLimit)) * 100)));
      }
      return json(res, merged.slice(0, 60));
    }
    if (url.pathname === "/api/memes") {
      const mfile = join(PROFILE, "memes.json");
      if (req.method === "GET") {
        let all = [];
        try { all = JSON.parse(noBom(readFileSync(mfile, "utf8"))); } catch {}
        if (!Array.isArray(all)) all = [];
        const q = String(url.searchParams.get("q") || "").trim().toLowerCase();
        const items = q === "" ? all : all.filter((m) => (String(m.title || "") + " " + String(m.content || "") + " " + String(m.tag || "")).toLowerCase().includes(q));
        items.sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "zh"));
        return json(res, { items, total: items.length });
      }
      if (req.method === "POST") {
        let payload = {};
        try { payload = await body(req); } catch { payload = {}; }
        let all = [];
        try { all = JSON.parse(noBom(readFileSync(mfile, "utf8"))); } catch {}
        if (!Array.isArray(all)) all = [];
        if (payload.deleteTitle !== void 0) {
          const t = String(payload.deleteTitle);
          const next = all.filter((m) => String(m.title) !== t);
          writeFileSync(mfile, JSON.stringify(next));
          return json(res, { ok: true, deleted: all.length - next.length });
        }
        const title = String(payload.title || "").trim();
        if (title === "") { res.writeHead(400).end("bad args"); return; }
        const content = String(payload.content || "");
        const tag = String(payload.tag || "");
        const idx = all.findIndex((m) => String(m.title) === title);
        const at = Date.now();
        if (idx >= 0) all[idx] = { ...all[idx], title, content, tag, at };
        else all.push({ title, content, tag, at });
        if (all.length > 10000) all = all.slice(-10000);
        writeFileSync(mfile, JSON.stringify(all));
        return json(res, { ok: true, title });
      }
    }
    if (url.pathname === "/api/tics") {
      const TF = join(PROFILE, "tics.json");
      const loadT = () => { try { const d = JSON.parse(noBom(readFileSync(TF, "utf8"))); return d && typeof d === "object" ? d : {}; } catch { return {}; } };
      if (req.method === "GET") {
        const all = loadT();
        const rows = Object.keys(all).map((k) => {
          const parts = String(k).split(":");
          const kind = k === "global" ? "" : (parts[4] === "group" ? "群" : parts[4] === "private" ? "私聊" : "");
          const target = k === "global" ? "" : (parts[5] && parts[5] !== "-" ? parts[5] : (parts[6] || ""));
          const list = Array.isArray(all[k]) ? all[k] : [];
          return {
            key: k,
            kind,
            target: String(target),
            avatar: parts[4] === "group" ? "https://p.qlogo.cn/gh/" + target + "/" + target + "/100" : "https://q1.qlogo.cn/g?b=sdk&nk=" + target + "&s=100",
            list: list.map((t) => ({ kind: String(t.kind || "phrase"), scenario: String(t.scenario || ""), phrase: String(t.phrase || ""), count: Number(t.count || 1) }))
          };
        }).filter((r) => r.list.length > 0);
        return json(res, rows);
      }
      if (req.method === "POST") {
        const b = await body(req);
        const key = "global";
        const all = loadT();
        const arr = Array.isArray(all[key]) ? all[key] : [];
        const phrase = String(b.phrase || "").trim().slice(0, 20);
        const kind = String(b.kind || "") === "pattern" ? "pattern" : "phrase";
        const scenario = kind === "pattern" ? "" : String(b.scenario || "").trim().slice(0, 40);
        if (phrase === "") { res.writeHead(400).end("bad args"); return; }
        if (scenario === "" && kind !== "pattern") { res.writeHead(400).end("bad args"); return; }
        const hit = arr.find((t) => String(t.phrase) === phrase);
        if (hit !== void 0) {
          hit.scenario = scenario;
          hit.kind = kind;
          hit.count = Number(hit.count || 1) + 1;
          hit.at = Date.now();
        } else {
          arr.push({ scenario, phrase, count: 1, kind, at: Date.now() });
        }
        all[key] = arr.slice(-80);
        writeFileSync(TF, JSON.stringify(all), "utf8");
        return json(res, { ok: true });
      }
      if (req.method === "PUT") {
        const b = await body(req);
        const key = String(b.key || "global");
        const phrase = String(b.phrase || "");
        const all = loadT();
        const arr = Array.isArray(all[key]) ? all[key] : [];
        const hit = arr.find((t) => String(t.phrase) === phrase);
        if (hit === void 0) { res.writeHead(404).end("not found"); return; }
        if (b.kind === "pattern") hit.scenario = "";
        else if (typeof b.scenario === "string" && b.scenario.trim() !== "") hit.scenario = b.scenario.trim().slice(0, 40);
        if (typeof b.newPhrase === "string" && b.newPhrase.trim() !== "") hit.phrase = b.newPhrase.trim().slice(0, 20);
        if (typeof b.count === "number") hit.count = Math.max(1, Math.min(999, Math.round(b.count)));
        if (b.kind === "pattern" || b.kind === "phrase") hit.kind = b.kind;
        all[key] = arr;
        writeFileSync(TF, JSON.stringify(all), "utf8");
        return json(res, { ok: true });
      }
      if (req.method === "DELETE") {
        const b = await body(req);
        const key = String(b.key || "global");
        const phrase = String(b.phrase || "");
        const all = loadT();
        if (Array.isArray(all[key])) all[key] = all[key].filter((t) => String(t.phrase) !== phrase);
        writeFileSync(TF, JSON.stringify(all), "utf8");
        return json(res, { ok: true });
      }
    }
    if (url.pathname === "/api/reminders") {
      const REM = join(PROFILE, "reminders.json");
      let list = [];
      try {
        list = JSON.parse(noBom(readFileSync(REM, "utf8")));
      } catch {}
      if (req.method === "GET") {
        const rows = list.map((r) => {
          const isGroup = r.kind === "group";
          const target = String(isGroup ? r.groupId : r.userId);
          const at = Number(r.at);
          return {
            id: r.id,
            kind: isGroup ? "群聊" : "私聊",
            target,
            avatar: isGroup ? "https://p.qlogo.cn/gh/" + target + "/" + target + "/100" : "https://q1.qlogo.cn/g?b=sdk&nk=" + target + "&s=100",
            text: String(r.text || ""),
            time: new Date(at).toLocaleString("zh-CN", { hour12: false }),
            requester: String(r.userId || ""),
            at
          };
        }).sort((a, b) => a.at - b.at);
        return json(res, rows);
      }
      if (req.method === "DELETE") {
        const id = url.searchParams.get("id") || "";
        const next = list.filter((r) => String(r.id) !== id);
        writeFileSync(REM, JSON.stringify(next), "utf8");
        return json(res, { ok: true });
      }
    }
            if (url.pathname === "/api/lists" && req.method === "GET") {
      const read = (f, k, fb) => {
        try { const d = JSON.parse(readFileSync(join(PROFILE, f), "utf8")); return Array.isArray(d[k]) ? d[k] : fb; } catch { return fb; }
      };
      return json(res, { owners: read("owners.json", "owners", []), admins: read("admins.json", "admins", []) });
    }
    if (url.pathname === "/api/lists" && req.method === "POST") {
      const b = await body(req);
      const clean = (v) => (Array.isArray(v) ? v : []).map((x) => String(x).trim()).filter((x) => /^\d{5,12}$/.test(x));
      if (Array.isArray(b.owners)) writeFileSync(join(PROFILE, "owners.json"), JSON.stringify({ owners: clean(b.owners) }, null, 2), "utf8");
      if (Array.isArray(b.admins)) writeFileSync(join(PROFILE, "admins.json"), JSON.stringify({ admins: clean(b.admins) }, null, 2), "utf8");
      return json(res, { ok: true });
    }
    if (url.pathname === "/api/contacts") {
      const CF = join(PROFILE, "contacts.json");
      let map = {};
      try { map = JSON.parse(readFileSync(CF, "utf8")); } catch {}
      if (req.method === "GET") {
        const norm = (v) => (typeof v === "string" ? { name: v, nick: "", note: "", cool: false, chance: 0.5 } : { name: String((v && v.name) || ""), nick: String((v && v.nick) || ""), note: String((v && v.note) || ""), cool: v && v.cool === true, chance: typeof (v && v.chance) === "number" ? Number(v.chance) : 0.5 });
        const rows = Object.keys(map).map((k) => { const v = norm(map[k]); return { qq: k, name: v.name, nick: v.nick, note: v.note, cool: v.cool, chance: v.chance, avatar: "https://q1.qlogo.cn/g?b=sdk&nk=" + k + "&s=100" }; });
        return json(res, rows);
      }
      if (req.method === "POST") {
        const b = await body(req);
        const qq = String(b.qq || "").replace(/\D/g, "").slice(0, 12);
        const name = String(b.name || "").trim().slice(0, 20);
        if (!/^\d{5,12}$/.test(qq) || name === "") throw new Error("bad args");
        map[qq] = { name: name, nick: String(b.nick || "").trim().slice(0, 20), note: String(b.note || "").trim().slice(0, 80), cool: map[qq] && map[qq].cool === true, chance: typeof b.chance === "number" ? Math.max(0, Math.min(1, b.chance)) : (map[qq] && typeof map[qq].chance === "number" ? map[qq].chance : 0.5) };
        writeFileSync(CF, JSON.stringify(map, null, 2), "utf8");
        return json(res, { ok: true });
      }
      if (req.method === "PUT") {
        const b = await body(req);
        const qq = String(b.qq || "").replace(/\D/g, "");
        if (!/^\d{5,12}$/.test(qq)) throw new Error("bad qq");
        const cur = map[qq] && typeof map[qq] === "object" ? map[qq] : { name: String((map[qq]) || ""), note: "" };
        map[qq] = {
          name: typeof b.name === "string" && b.name.trim() !== "" ? b.name.trim().slice(0, 20) : String(cur.name || ""),
          nick: typeof b.nick === "string" ? b.nick.trim().slice(0, 20) : String(cur.nick || ""),
          note: typeof b.note === "string" ? b.note.trim().slice(0, 80) : String(cur.note || ""),
          cool: typeof b.cool === "boolean" ? b.cool : cur.cool === true,
          chance: typeof b.chance === "number" ? Math.max(0, Math.min(1, b.chance)) : (typeof cur.chance === "number" ? cur.chance : 0.5)
        };
        writeFileSync(CF, JSON.stringify(map, null, 2), "utf8");
        return json(res, { ok: true, cool: b.cool === true });
      }
      if (req.method === "DELETE") {
        const qq = String(url.searchParams.get("qq") || "");
        delete map[qq];
        writeFileSync(CF, JSON.stringify(map, null, 2), "utf8");
        return json(res, { ok: true });
      }
    }
    if (url.pathname.startsWith("/napcat/") || url.pathname.startsWith("/webui/") || url.pathname.startsWith("/assets/")) {
      const fwd = new URLSearchParams(url.search); fwd.delete("t");
      const qs = fwd.toString();
      const basePath = url.pathname.startsWith("/napcat/") ? url.pathname.slice("/napcat".length) : url.pathname;
      const targetPath = basePath + (qs ? "?" + qs : "");
      const opt = {
        host: "127.0.0.1",
        port: 6099,
        path: targetPath,
        method: req.method,
        headers: { ...req.headers, host: "127.0.0.1:6099" }
      };
      const preq = await import("node:http").then((m) => m.request);
      const p = preq(opt, (pres) => {
        const headers = { ...pres.headers };
        if (typeof headers.location === "string") {
          try {
            const u = new URL(headers.location, "http://127.0.0.1:6099");
            headers.location = "/napcat" + u.pathname + (u.search || "");
          } catch {}
        }
        res.writeHead(pres.statusCode || 502, headers);
        pres.pipe(res);
      });
      p.on("error", () => { try { res.writeHead(502).end("napcat webui unreachable"); } catch {} });
      req.pipe(p);
      return;
    }
    if (url.pathname === "/qr" || url.pathname === "/qrpage") {
      const qt = url.searchParams.get("t") || "";
      if (qt !== TOKEN) { res.writeHead(403).end("forbidden"); return; }
      if (url.pathname === "/qrpage") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
        res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NapCat 登录</title><body style="background:#111;color:#ddd;font-family:system-ui;text-align:center;padding:20px"><h3>用 QQ 扫这张码登录</h3><div id="box"></div><p style="color:#888;font-size:13px">每 20 秒自动刷新，过期不用管</p><script>function r(){var i=new Image();i.onload=function(){document.getElementById("box").innerHTML="";document.getElementById("box").appendChild(i)};i.src="/qr?t=' + TOKEN + '&fresh=1&x="+Date.now();}r();setInterval(r,20000);</script></body>');
        return;
      }
      const __docker = existsSync("/usr/bin/docker") ? "/usr/bin/docker" : "docker";
      if (url.searchParams.get("fresh") === "1") {
        let __age = 1e9;
        try { __age = Date.now() - statSync("/opt/napcat/qrcode.png").mtimeMs; } catch {}
        let __connected = false;
        try {
          const __ss = await run("/usr/bin/ss", ["-tn", "state", "established", "( sport = :3001 )"]);
          __connected = String(__ss.stdout || "").trim().split("\n").length > 1;
        } catch {}
        if (__age > 100000 && !__connected) {
          const __stamp = "/tmp/napcat-qr-restart";
          let __last = 0;
          try { __last = statSync(__stamp).mtimeMs; } catch {}
          if (Date.now() - __last > 60000) {
            try { writeFileSync(__stamp, String(Date.now())); } catch {}
            await run(__docker, ["restart", "napcat"]);
            await new Promise((r2) => setTimeout(r2, 12000));
          }
        }
      }
      const r = await run(__docker, ["cp", "napcat:/app/napcat/cache/qrcode.png", "/opt/napcat/qrcode.png"]);
      if (!r.ok) { res.writeHead(500).end("qr unavailable"); return; }
      const buf = readFileSync("/opt/napcat/qrcode.png");
      res.writeHead(200, { "content-type": "image/png", "cache-control": "no-store" });
      res.end(buf);
      return;
    }
    
    if (url.pathname === "/api/logs") {
      const r = await run("journalctl", ["-u", "dsh-qqbot", "--no-pager", "-n", "150"]);
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      return res.end(r.stdout);
    }
    res.writeHead(404).end();
  } catch (e) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(String(e));
  }
});

  return new Promise((resolve, reject) => {
    const start = Number(PORT) || 8090;
    let attempt = 0;
    const tryListen = () => {
      const port = start + attempt;
      const onError = (error) => {
        server.removeListener("error", onError);
        if (error && error.code === "EADDRINUSE" && attempt < 20) {
          attempt += 1;
          setTimeout(tryListen, 50);
          return;
        }
        reject(error);
      };
      server.on("error", onError);
      server.once("listening", () => {
        server.removeListener("error", onError);
        resolve({ port, close: () => new Promise((r) => server.close(() => r())) });
      });
      server.listen(port, HOST);
    };
    tryListen();
  });
}
