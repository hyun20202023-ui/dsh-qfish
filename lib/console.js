import { createServer } from "node:http";
import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync, mkdirSync, statSync } from "node:fs";
import { execFile } from "node:child_process";
import { join, basename } from "node:path";

let PROFILE = "";
let PDIR = "";
let SETTINGS = "";
let STICKERS = "";
let TOKEN = "change-me";
let PORT = 8090;
const IMG = /\.(png|jpe?g|gif|webp)$/i;
const LABEL = {
  "1-persona.md": "人设",
  "2-rules.md": "语言规则",
  "3-slang.md": "黑话",
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
header{padding:14px 20px;background:#161a20;border-bottom:1px solid #242a33;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
h1{font-size:18px;margin:0;font-weight:600;letter-spacing:.5px}
main{padding:20px;max-width:1200px;margin:0 auto}
.layout{display:grid;grid-template-columns:220px minmax(0,1fr);gap:18px;align-items:start}
.content{min-width:0}
nav.tabs{display:flex;flex-direction:column;gap:6px;position:sticky;top:12px}
.tab{padding:11px 14px;border-radius:9px;background:#1b2029;border:1px solid #252c37;cursor:pointer;font-size:15px;color:#c8cfd8;user-select:none}
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
<header><h1>dsh 控制台</h1><span id="status"><small>加载中…</small></span>
<span style="flex:1"></span><button class="ghost" onclick="load()">刷新</button><button onclick="restart()">重启 DSH</button></header>
<main>
<div class="layout">
<nav class="tabs" id="tabs"></nav>
<div class="content">
<div id="panels"></div>

<div class="panel" id="p-settings"><div id="settingsFields"></div>
      <div style="margin-top:6px">
      <div style="font-size:12.5px;color:#8a93a0;margin-bottom:4px">主人名单</div>
      <div id="ownersChips" class="chips"></div>
      <div class="row" style="gap:6px;margin:6px 0 12px">
        <input id="ownerAdd" placeholder="加主人 QQ" style="width:150px">
        <button class="ghost" onclick="addChip('owner')">添加</button>
      </div>
      <div style="font-size:12.5px;color:#8a93a0;margin:12px 0 4px">管理员名单（最高权限，可用 /dsh 与 shell）</div>
      <div id="adminsChips" class="chips"></div>
      <div class="row" style="gap:6px;margin-top:6px">
        <input id="adminAdd" placeholder="加管理员 QQ" style="width:150px">
        <button class="ghost" onclick="addChip('admin')">添加</button>
      </div>
      <button onclick="saveAdmins()">保存名单</button>
      </div>
<div class="row"><button onclick="saveSettings()">保存参数</button><small>保存后对下一条消息生效</small></div></div>

<div class="panel" id="p-stickers"><div class="row"><input type="file" id="file" accept="image/*" multiple><button onclick="upload()">上传</button><small id="stickerCount"></small></div><div class="grid" id="grid"></div></div>

<div class="panel" id="p-chats"><div class="row"><button class="ghost" onclick="loadChats()">刷新</button></div><div id="chatList"></div></div>
<div class="panel" id="p-mood"><div class="row"><button class="ghost" onclick="loadMood()">刷新</button><small>心情按 QQ 全局，跨群共用</small></div><div id="moodList"></div></div>
<div class="panel" id="p-memory"><div class="row"><input id="memAdd" placeholder="新增一条记忆" style="flex:1"><input id="memQQ" placeholder="QQ" style="width:120px"><button onclick="addMem()">添加</button><button class="ghost" onclick="loadMemList()">刷新</button><small>社交表里的人权重天生更高</small></div><div id="memList"></div></div>
<div class="panel" id="p-tics"><div class="row"><button class="ghost" onclick="loadTics()">刷新</button><small>她自己学到的口头禅</small></div>
<div class="row" style="gap:6px;margin-bottom:8px"><input id="ticScenario" placeholder="场景：这条用在哪" style="flex:1"><input id="ticPhrase" placeholder="说法" style="width:180px"><select id="ticKind" style="width:100px"><option value="phrase">口头禅</option><option value="pattern">句式</option></select><button onclick="addTic()">添加</button></div>
<div id="ticList"></div></div>
<div class="panel" id="p-reminders"><div class="row"><button class="ghost" onclick="loadReminders()">刷新</button><small>群里共享，到点 @ 发起人</small></div><div id="remindList"></div></div>
<div class="panel" id="p-contacts">
  <div class="row"><button class="ghost" onclick="loadContacts()">刷新</button><small>QQ 号 → 称呼，聊天时会照这个叫</small></div>
  <div id="contactList"></div>
  <div class="row" style="gap:8px;margin-top:8px">
    <input id="cQQ" placeholder="QQ 号" style="width:140px">
    <input id="cName" placeholder="称呼" style="width:140px"><input id="cNick" placeholder="小名，平时怎么叫">
    <input id="cNote" placeholder="档案（可选）" style="width:min(320px,100%)">
    <button onclick="saveContact()">添加/修改</button>
  </div>
</div>

<div class="panel" id="p-meme">
  <div class="row"><button class="ghost" onclick="loadMeme()">刷新</button><small id="memeMeta"></small></div>
  <div class="row" style="gap:18px;flex-wrap:wrap">
    <label><input type="checkbox" id="mwAuto"> 自动思考梗</label>
    <label><input type="checkbox" id="mwChuan"> 串子开关</label>
    <label>串子程度 <input type="range" id="mwLevel" min="0" max="100" step="5" style="vertical-align:middle;width:160px" oninput="document.getElementById('mwLevelVal').textContent=this.value"><b id="mwLevelVal">50</b></label>
    <button onclick="saveMemeCfg()">保存设置</button>
  </div>
  <div class="row"><input id="memeQ" placeholder="搜词条" style="width:220px"><button onclick="memeSearch(true)">搜索</button></div>
  <div id="memeList"></div>
  <div class="row" id="memePager" style="gap:8px;align-items:center;margin-top:6px"></div>
  <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">
    <input id="memeTitle" placeholder="词条名" style="width:150px">
    <input id="memeTags" placeholder="标签" style="width:120px">
    <input id="memeSummary" placeholder="释义" style="width:min(420px,100%)">
    <button onclick="memeAdd()">新增/修改</button>
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
  document.getElementById('grid').innerHTML = STICKERS.map(n=>'<div class="thumb"><img src="/api/sticker?name='+encodeURIComponent(n)+'&t='+encodeURIComponent(T)+'"><button onclick="del(\\''+n.replace(/'/g,"")+'\\')">×</button></div>').join('');
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
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1500)}
function tab(id){
  document.querySelectorAll('.tab').forEach(e=>e.classList.toggle('on', e.dataset.id===id));
  document.querySelectorAll('.panel').forEach(e=>e.classList.toggle('on', e.id==='p-'+id));
  if(id==='logs') loadLogs();
  if(id==='chats') loadChats();
  if(id==='mood') loadMood();
  if(id==='tics') loadTics();
  if(id==='reminders') loadReminders();
  if(id==='meme') loadMeme();
  if(id==='contacts') loadContacts();
  if(id==='settings') loadAdmins();
}
async function load(){
  const s = await api('/api/state');
  FILES = s.files;
  document.getElementById('status').innerHTML = '<span class="sdot" style="background:'+(s.status.dsh==='active'?'#3ddc84':'#e05555')+'"></span><small>DSH '+(s.status.dsh==='active'?'在线':'离线')+'</small> <span class="sdot" style="background:'+(s.status.napcat?'#3ddc84':'#e05555')+'"></span><small>QQ '+(s.status.napcat?'在线':'离线')+'</small>';
  document.getElementById('tabs').innerHTML =
    FILES.map(f=>'<div class="tab" data-id="'+f.key+'" onclick="tab(\\''+f.key+'\\')">'+f.label+'</div>').join('')
    + '<div class="tab" data-id="settings" onclick="tab(\\'settings\\')">行为参数</div>'
    + '<div class="tab" data-id="stickers" onclick="tab(\\'stickers\\')">表情库</div>'
    + '<div class="tab" data-id="chats" onclick="tab(\\'chats\\')">会话</div>'
    + '<div class="tab" data-id="mood" onclick="tab(\\'mood\\')">心情</div>'
    + '<div class="tab" data-id="memory" onclick="tab(\\'memory\\')">长期记忆</div>'
    + '<div class="tab" data-id="tics" onclick="tab(\\'tics\\')">学习表</div>'
    + '<div class="tab" data-id="reminders" onclick="tab(\\'reminders\\')">待办</div>'
    + '<div class="tab" data-id="meme" onclick="tab(\\'meme\\')">梗百科</div>'
    + '<div class="tab" data-id="contacts" onclick="tab(\\'contacts\\')">社交</div>'
    + '<div class="tab" data-id="logs" onclick="tab(\\'logs\\')">运行日志</div>';
  document.getElementById('panels').innerHTML = FILES.map(f=>
    '<div class="panel" id="p-'+f.key+'"><textarea id="ta-'+f.key+'"></textarea>'
    +'<div class="row"><button onclick="saveFile(\\''+f.name+'\\',\\''+f.key+'\\')">保存 '+f.label+'</button><small>保存后下一条 QQ 消息生效</small></div></div>').join('');
  for (const f of FILES) document.getElementById('ta-'+f.key).value = f.text;
  renderSettings(s.settings);
  STICKERS = s.stickers;
  renderGrid();
  loadMemList();
  tab(FILES.length? FILES[0].key : 'settings');
}
async function saveFile(name, key){
  await api('/api/file',{method:'POST',body:JSON.stringify({name,text:document.getElementById('ta-'+key).value})});
  toast('已保存 '+name);
}
const SETTINGS_FIELDS = [
  { key:'stickerChance', label:'表情概率', type:'number', step:0.05, hint:'0-1' },
  { key:'groupAmbientChance', label:'群接话概率', type:'number', step:0.05, hint:'0-1' },
  { key:'groupFollowUpSeconds', label:'接话窗口(秒)', type:'number', step:10, hint:'@ 后多久内算接着聊' },
  { key:'messageBufferMs', label:'回复缓冲(毫秒)', type:'number', step:500, hint:'5-8 秒随机基于这个基数' },
  { key:'proactiveChance', label:'主动找话概率', type:'number', step:0.05, hint:'0-1' },
  { key:'chatVideoChance', label:'聊天中发视频概率', type:'number', step:0.01, hint:'0-1' },
  { key:'moodCooldownTurns', label:'心情切档冷却(轮)', type:'number', step:1, hint:'最小 6' },
  { key:'sessionWindowTurns', label:'会话轮数上限', type:'number', step:5, hint:'满多少轮换新会话' },
  { key:'sessionResetMinutes', label:'空闲重置(分钟)', type:'number', step:30, hint:'多久不说话换会话' },
  { key:'biliCookie', label:'B站 Cookie', type:'text', wide:true, hint:'SESSDATA=...' },
  { key:'sessionCharLimit', label:'会话字符上限(触发轮换)', type:'number', step:50000, hint:'累计超过就换新会话，默认 40 万' },
  { key:'autoLeaveMinutes', label:'连续聊天脱离(分钟)', type:'number', step:1, hint:'群整体连聊满这么久就脱离' },
  { key:'arkKey', label:'卡片签名 Key', type:'text', wide:true, hint:'咸鱼 API 的 token' },
  { key:'pokeReplies', label:'戳一戳回复（逗号分隔）', type:'text', wide:true, hint:'随机挑一句' },
  { key:'bannedWords', label:'硬删词（逗号分隔）', type:'text', wide:true, hint:'生成后从回复里直接删掉；说话禁忌在「语言规则」页' },
];
function renderSettings(s){
  const box = document.getElementById('settingsFields');
  box.innerHTML = SETTINGS_FIELDS.map(function(f){
    var w = f.wide ? 'width:min(420px,100%)' : '';
    var v = s && s[f.key] !== undefined ? s[f.key] : '';
    if (Array.isArray(v)) v = v.join('，');
    return '<label>'+f.label+' <input id="set-'+f.key+'" type="'+f.type+'"'+(f.step?' step="'+f.step+'"':'')+' style="'+w+'" value="'+String(v).replace(/"/g,'&quot;')+'"></label>'
      + (f.hint ? '<div style="margin:-6px 0 10px;color:#5f6875;font-size:11.5px">'+f.hint+'</div>' : '');
  }).join('');
}
async function saveSettings(){
  const payload = {};
  for (const f of SETTINGS_FIELDS) {
    const el = document.getElementById('set-'+f.key);
    if (!el) continue;
    if (f.key === 'bannedWords' || f.key === 'pokeReplies' || f.key === 'groupAlwaysUsers') payload[f.key] = el.value.split(/[，,、]/).map(function(v){return v.trim();}).filter(Boolean);
    else payload[f.key] = f.type === 'number' ? Number(el.value) : el.value.trim();
  }
  await api('/api/settings',{method:'POST',body:JSON.stringify(payload)});
  toast('参数已保存');
}
async function del(name){ if(!confirm('删除 '+name+'?'))return; await api('/api/sticker?name='+encodeURIComponent(name),{method:'DELETE'}); STICKERS=STICKERS.filter(n=>n!==name); renderGrid(); toast('已删除 '+name); }
async function upload(){
  const files=[...document.getElementById('file').files]; if(!files.length)return;
  for(const f of files){
    const b64=await new Promise(res=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.readAsDataURL(f)});
    await api('/api/sticker',{method:'POST',body:JSON.stringify({name:f.name,data:b64})});
  }
  toast('上传完成'); await refreshStickers();
}
async function restart(){ if(!confirm('重启 DSH 服务?'))return; await api('/api/restart',{method:'POST',body:'{}'}); toast('已触发重启'); setTimeout(load,9000); }
async function loadMemList(){
  const rows = await api('/api/memory');
  const fmt = function(ts){ if(!ts) return ''; const d=new Date(ts); return (d.getMonth()+1)+'/'+d.getDate(); };
  const groups = {};
  for (const r of rows) {
    const k = r.from || '';
    if (!groups[k]) groups[k] = { from: k, name: r.name || '', items: [] };
    if (!groups[k].name && r.name) groups[k].name = r.name;
    groups[k].items.push(r);
  }
  const keys = Object.keys(groups).sort(function(a,b){ return (groups[b].items.length)-(groups[a].items.length); });
  const box = document.getElementById('memList');
  box.innerHTML = keys.map(function(k){
    const g = groups[k];
    const av = g.from ? 'https://q1.qlogo.cn/g?b=sdk&nk='+g.from+'&s=100' : '';
    const head = '<div class="chead" style="margin:14px 0 6px">'+(av?'<img class="av" src="'+av+'" style="width:26px;height:26px;border-radius:50%;margin-right:8px" loading="lazy" onerror="this.style.opacity=.15">':'')+'<span class="cname">'+esc(g.name||'未知')+'</span><span class="pill">'+esc(g.from||'-')+'</span><span class="pill">'+g.items.length+' 条</span></div>';
    const body = g.items.map(function(r){
      return '<div class="chatcard"><div class="cbody"><div class="chead"><span class="pill">权重 '+r.weight+'</span>'+(r.pinned?'<span class="pill">钉住</span>':'')+'</div><div class="cmeta">'+esc(r.text)+'</div><div class="cmeta">'+fmt(r.lastAt||r.at)+' · 用过 '+r.used+' 次 · '+(r.kind==='passive'?'自动摘要':'主动记的')+'</div></div><div style="display:flex;flex-direction:column;gap:6px"><button data-mem="'+r.id+'" data-act="'+(r.pinned?'unpin':'pin')+'">'+(r.pinned?'取消钉住':'钉住')+'</button><button class="danger" data-mem="'+r.id+'" data-act="delete">删除</button></div></div>';
    }).join('');
    return head + body;
  }).join('') || '<div style="color:#7d8794">还没有记忆</div>';
  box.querySelectorAll('[data-mem]').forEach(function(b){ b.onclick = function(){ memAct(b.dataset.mem, b.dataset.act); }; });
}
async function addMem(){
  const text = document.getElementById('memAdd').value.trim();
  const qq = document.getElementById('memQQ').value.trim();
  if(!text){ toast('写点什么'); return; }
  await api('/api/memory', { method:'POST', body: JSON.stringify({ action:'add', text: text, from: qq })});
  document.getElementById('memAdd').value=''; document.getElementById('memQQ').value='';
  toast('已添加'); loadMemList();
}
async function memAct(id, act){
  if(act === 'delete' && !confirm('删除这条记忆?')) return;
  await api('/api/memory', { method:'POST', body: JSON.stringify({ action: act, id: id })});
  loadMemList();
}

function esc(s){return String(s==null?'':s).replace(/[&<>]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[m]})}
async function loadChats(){
  const list=await api('/api/chats');
  const groups = list.filter(function(c){ return c.kind === 'group'; });
  const privs  = list.filter(function(c){ return c.kind !== 'group'; });
  const html=list.map(function(c){
    var st=c.busy?'<span class="pill busy">回复中…</span>':(Date.now()-c.lastMs<300000?'<span class="pill on">活跃</span>':'<span class="pill">闲置</span>');
    var dot=c.unread?'<span class="gdot"></span>':'';
    var t=c.lastText?'<div class="msg">他们说：'+esc(c.lastText)+'</div>':'';
    var r=c.replyText?'<div class="msg reply">它回：'+esc(c.replyText)+'</div>':'';
    return '<div class="chatcard'+(c.busy?' busy':'')+'"><div class="avwrap"><img class="av" src="'+c.avatar+'" loading="lazy" onerror="this.style.opacity=.15"></div><div class="cbody"><div class="chead">'+dot+'<span class="cname">'+c.kind+' '+esc(c.target)+'</span>'+st+'</div>'+t+r+'<div class="cmeta">最后活跃 '+esc(c.last)+' · 记忆 '+c.mem+' 条</div></div></div>';
  }).join('');
  const render = function(arr){
    return arr.map(function(c){
      const st=c.busy?'<span class="pill busy">回复中</span>':(Date.now()-c.lastMs<300000?'<span class="pill on">活跃</span>':'<span class="pill">闲置</span>');
      const dot=c.unread?'<span class="gdot"></span>':'';
      const t=c.lastText?'<div class="msg">最后：'+esc(c.lastText)+'</div>':'';
      const r=c.replyText?'<div class="msg reply">回复：'+esc(c.replyText)+'</div>':'';
      const label = c.kind==='group' ? (c.name ? esc(c.name)+' ('+esc(c.target)+')' : '群 '+esc(c.target)) : esc(c.target);
      const pct = c.turnPct || 0;
      const bar = '<div style="margin-top:6px"><div style="height:6px;border-radius:4px;background:#22262c;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+(pct>=80?'#e0524a':pct>=50?'#d8a13a':'#4a9e5a')+'"></div></div><div class="cmeta">上下文 '+c.turns+'/'+(c.turnsLimit||30)+' 轮 · '+Math.round((c.chars||0)/1000)+'k/'+Math.round((c.charLimit||400000)/1000)+'k 字符</div></div>';
      return '<div class="chatcard'+(c.busy?' busy':'')+'"><div class="avwrap"><img class="av" src="'+c.avatar+'" loading="lazy" onerror="this.style.opacity=.15"></div><div class="cbody"><div class="chead">'+dot+'<span class="cname">'+label+'</span>'+st+'</div>'+t+r+'<div class="cmeta">最后活跃 '+esc(c.last)+'</div>'+bar+'</div></div>';
    }).join('');
  };
  const gh = groups.length ? '<h4 style="margin:14px 0 6px">群聊 ('+groups.length+')</h4>'+render(groups) : '';
  const ph = privs.length ? '<h4 style="margin:14px 0 6px">私聊 ('+privs.length+')</h4>'+render(privs) : '';
  document.getElementById('chatList').innerHTML=(gh+ph)||'<div style="color:#7d8794">还没有会话</div>';
}
async function loadLogs(){ const r=await api('/api/logs'); document.getElementById('logs').textContent=r; }
async function loadTics(){
  const list=await api('/api/tics');
  const html=list.map(function(c){
    var rows=c.list.map(function(t){
      return '<tr><td>'+(t.kind==='pattern'?'句式':'口头禅')+'</td><td>'+esc(t.scenario)+'</td><td>'+esc(t.phrase)+'</td><td>'+esc(t.count||1)+'</td><td><button class="danger" onclick="delTic(\\''+c.key.replace(/'/g,'')+'\\',\\''+String(t.phrase).replace(/'/g,'')+'\\')">×</button> <button onclick="editTic(\\''+c.key.replace(/'/g,'')+'\\',\\''+String(t.phrase).replace(/'/g,'')+'\\')">改</button></td></tr>';
    }).join('');
    return '<div class="chatcard"><div class="avwrap"><img class="av" src="'+c.avatar+'" loading="lazy" onerror="this.style.opacity=.15"></div><div class="cbody"><div class="chead"><span class="cname">'+esc(c.kind)+' '+esc(c.target)+'</span><span class="pill">'+c.list.length+' 条</span></div><table style="width:100%;font-size:12.5px;border-collapse:collapse"><thead><tr style="color:#7d8794;text-align:left"><th>类型</th><th>场景</th><th>说法</th><th>次数</th><th></th></tr></thead><tbody>'+(rows||'<tr><td colspan="5" style="color:#7d8794">还没学到</td></tr>')+'</tbody></table></div></div>';
  }).join('');
  document.getElementById('ticList').innerHTML=html||'<div style="color:#7d8794">还没有学习记录</div>';
}
async function loadMood(){
  const rows = await api('/api/mood');
  const tier = function(v){ return v >= 75 ? '卖萌' : v <= 25 ? '暴躁' : '平常'; };
  document.getElementById('moodList').innerHTML = rows.map(function(r){
    const av = 'https://q1.qlogo.cn/g?b=sdk&nk='+r.qq+'&s=100';
    const pct = Math.max(0, Math.min(100, r.value));
    return '<div class="chatcard"><div class="avwrap"><img class="av" src="'+av+'" loading="lazy" onerror="this.style.opacity=.15"></div><div class="cbody"><div class="chead"><span class="cname">'+esc(r.name||'未知')+'</span><span class="pill">'+esc(r.qq)+'</span><span class="pill">'+tier(r.value)+'</span></div><div class="cmeta">'+r.value+'/100'+(r.reason?(' · 原因：'+esc(r.reason)):'')+'</div><div style="height:6px;border-radius:4px;background:#22262c;overflow:hidden;margin-top:6px"><div style="height:100%;width:'+pct+'%;background:'+(pct>=75?'#4a9e5a':pct<=25?'#e0524a':'#d8a13a')+'"></div></div></div><div style="display:flex;flex-direction:column;gap:6px"><button data-qq="'+r.qq+'" onclick="setMood(this.dataset.qq)">设值</button><button class="danger" data-qq="'+r.qq+'" onclick="clearMood(this.dataset.qq)">清除</button></div></div>';
  }).join('') || '<div style="color:#7d8794">还没有心情记录</div>';
}
async function setMood(qq){
  const v = prompt('心情值 0-100', '50');
  if(v === null) return;
  await api('/api/mood', { method:'POST', body: JSON.stringify({ qq: qq, value: Number(v) || 0 })});
  loadMood();
}
async function clearMood(qq){
  if(!confirm('清除 '+qq+' 的心情记录?')) return;
  await api('/api/mood', { method:'POST', body: JSON.stringify({ qq: qq, clear: true })});
  loadMood();
}
async function loadContacts(){
  const rows = await api('/api/contacts');
  const box = document.getElementById('contactList');
  if (!rows.length) { box.innerHTML = '<div style="color:#7d8794">还没有联系人</div>'; return; }
  box.innerHTML = rows.map(function(r){
    const av = 'https://q1.qlogo.cn/g?b=sdk&nk='+r.qq+'&s=100';
    const chance = Math.round((r.chance === undefined ? 0.5 : r.chance) * 100);
    return '<div class="chatcard" data-qq="'+r.qq+'">'
      + '<div class="avwrap"><img class="av" src="'+av+'" loading="lazy" onerror="this.style.opacity=.15"></div>'
      + '<div class="cbody" style="flex:1;min-width:0">'
      +   '<div class="row" style="gap:8px;align-items:center;flex-wrap:wrap">'
      +     '<span class="pill">'+esc(r.qq)+'</span>'
      +     '<label style="font-size:12px;color:#8a93a0">本名<input data-f="name" value="'+esc(r.name||'')+'" placeholder="本名" style="width:120px;margin-left:4px"></label>'
      +     '<label style="font-size:12px;color:#8a93a0">小名<input data-f="nick" value="'+esc(r.nick||'')+'" placeholder="怎么叫" style="width:120px;margin-left:4px"></label>'
      +     '<label style="font-size:12px;color:#8a93a0">接话<input data-f="chance" type="number" min="0" max="100" step="1" value="'+chance+'" style="width:70px;margin-left:4px">%</label>'
      +     '<label style="font-size:12px;color:#8a93a0;display:flex;align-items:center;gap:4px"><input data-f="cool" type="checkbox" '+(r.cool?'checked':'')+'>COOL</label>'
      +   '</div>'
      +   '<div style="margin-top:8px"><input data-f="note" value="'+esc(r.note||'')+'" placeholder="备注：他在哪、干什么、怎么相处，最多 80 字" style="width:100%"></div>'
      + '</div>'
      + '<div style="display:flex;flex-direction:column;gap:6px;justify-content:center">'
      +   '<button data-act="save">保存</button>'
      +   '<button class="danger" data-act="del">删除</button>'
      + '</div></div>';
  }).join('');
  box.querySelectorAll('.chatcard[data-qq]').forEach(function(card){
    const qq = card.dataset.qq;
    const get = function(f){ return card.querySelector('[data-f="'+f+'"]'); };
    card.querySelector('[data-act="save"]').onclick = async function(){
      const chanceVal = Number(get('chance').value);
      await api('/api/contacts', { method:'PUT', body: JSON.stringify({
        qq: qq,
        name: get('name').value.trim(),
        nick: get('nick').value.trim(),
        note: get('note').value.trim(),
        cool: get('cool').checked,
        chance: Math.max(0, Math.min(100, isNaN(chanceVal) ? 50 : chanceVal)) / 100
      })});
      toast('已保存'); loadContacts();
    };
    card.querySelector('[data-act="del"]').onclick = function(){ delContact(qq); };
  });
}
async function delContact(qq){ if(!confirm('删除 '+qq+' 的称呼?'))return; await api('/api/contacts?qq='+encodeURIComponent(qq),{method:'DELETE'}); loadContacts(); }
async function loadMeme(){
  const d=await api('/api/memewiki');
  document.getElementById('memeMeta').textContent='v'+(d.version||'?')+' · '+d.total+' 条词条';
  document.getElementById('mwAuto').checked=d.cfg['自动思考梗']!==false;
  document.getElementById('mwChuan').checked=d.cfg['串子开关']===true;
  const lv=Number(d.cfg['串子程度']||50);
  document.getElementById('mwLevel').value=lv;
  document.getElementById('mwLevelVal').textContent=lv;
  await memeSearch();
}
async function saveMemeCfg(){
  const payload={'自动思考梗':document.getElementById('mwAuto').checked,'串子开关':document.getElementById('mwChuan').checked,'串子程度':Number(document.getElementById('mwLevel').value)};
  await api('/api/memewiki/config',{method:'POST',body:JSON.stringify(payload)});
  toast('梗百科设置已保存');
}
let MEME_PAGE = 0;
async function memeSearch(reset){
  if(reset) MEME_PAGE = 0;
  const q = document.getElementById('memeQ').value.trim();
  const d = await api('/api/memewiki/search?q='+encodeURIComponent(q)+'&offset='+(MEME_PAGE*20)+'&limit=20');
  const rows = d.rows || [];
  const total = d.total || 0;
  const pages = Math.max(1, Math.ceil(total/20));
  document.getElementById('memeList').innerHTML = rows.map(function(r){
    return '<div class="chatcard"><div class="cbody"><div class="chead"><span class="cname">'+esc(r.title)+'</span></div><div class="msg">'+esc(r.summary||'')+'</div></div><button class="danger" data-title="'+esc(r.title)+'" onclick="memeDel(this.dataset.title)">删除</button></div>';
  }).join('') || '<div style="color:#7d8794">没有匹配词条</div>';
  document.getElementById('memePager').innerHTML = '<span style="color:#8a93a0;font-size:12px">第 '+(MEME_PAGE+1)+'/'+pages+' 页 · 共 '+total+' 条</span>'
    + '<button class="ghost" '+(MEME_PAGE===0?'disabled':'')+' onclick="MEME_PAGE--;memeSearch()">上一页</button>'
    + '<button class="ghost" '+(MEME_PAGE+1>=pages?'disabled':'')+' onclick="MEME_PAGE++;memeSearch()">下一页</button>';
}
async function memeDel(t){ if(!confirm('删除词条 '+t+'?'))return; await api('/api/memewiki/entry?title='+encodeURIComponent(t),{method:'DELETE'}); toast('已删除'); memeSearch(); }
async function memeAdd(){
  const title=document.getElementById('memeTitle').value.trim();
  if(!title){toast('词条名不能为空');return;}
  await api('/api/memewiki/entry',{method:'POST',body:JSON.stringify({title:title,tags:document.getElementById('memeTags').value,summary:document.getElementById('memeSummary').value})});
  toast('已保存 '+title); memeSearch();
}
let LIST_STATE = { owners: [], admins: [] };
function renderChips(){
  const box = (id, key) => {
    const el = document.getElementById(id);
    el.innerHTML = (LIST_STATE[key] || []).map(function(v){
      return '<span class="chip">'+esc(v)+'<b data-k="'+key+'" data-v="'+esc(v)+'" onclick="delChip(this.dataset.k,this.dataset.v)">×</b></span>';
    }).join('') || '<span style="color:#7d8794;font-size:12px">空</span>';
  };
  box('ownersChips','owners');
  box('adminsChips','admins');
}
async function loadAdmins(){
  LIST_STATE = await api('/api/lists');
  renderChips();
}
function delChip(key, val){
  LIST_STATE[key] = (LIST_STATE[key] || []).filter(function(v){ return v !== val; });
  renderChips();
}
function addChip(key){
  const input = document.getElementById(key === 'owner' ? 'ownerAdd' : 'adminAdd');
  const v = input.value.trim();
  if(!/^\d{5,12}$/.test(v)) { toast('QQ 号不对'); return; }
  const k = key === 'owner' ? 'owners' : 'admins';
  if(!(LIST_STATE[k] || []).includes(v)) (LIST_STATE[k] = LIST_STATE[k] || []).push(v);
  input.value = '';
  renderChips();
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
async function delReminder(id){ if(!confirm('删除这条待办?'))return; await api('/api/reminders?id='+encodeURIComponent(id),{method:'DELETE'}); loadReminders(); }
async function addTic(){
  const scenario = document.getElementById('ticScenario').value.trim();
  const phrase = document.getElementById('ticPhrase').value.trim();
  const kind = document.getElementById('ticKind').value;
  if(!scenario || !phrase){ toast('场景和说法都要填'); return; }
  await api('/api/tics', { method:'POST', body: JSON.stringify({ scenario: scenario, phrase: phrase, kind: kind })});
  document.getElementById('ticScenario').value=''; document.getElementById('ticPhrase').value='';
  toast('已添加'); loadTics();
}
async function editTic(key, phrase){
  const scenario = prompt('这条用在哪（场景）', '');
  if(scenario === null) return;
  const newPhrase = prompt('怎么说的（说法）', phrase);
  if(newPhrase === null) return;
  const countRaw = prompt('用过几次', '1');
  await api('/api/tics', { method:'PUT', body: JSON.stringify({ key: key, phrase: phrase, scenario: scenario, newPhrase: newPhrase, count: Number(countRaw) || 1 })});
  toast('已更新'); loadTics();
}
async function delTic(key,phrase){ if(!confirm('删除「'+phrase+'」?'))return; await api('/api/tics',{method:'DELETE',body:JSON.stringify({key:key,phrase:phrase})}); loadTics(); }
setInterval(function(){var t=document.querySelector('.tab.on');if(t&&t.dataset.id==='chats')loadChats();},5000);
load();
</script></html>`;

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
  if (url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(page);
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
        settings,
        stickers: stickerNames(),
        status: { dsh: dsh.stdout.trim(), napcat: nap.stdout.trim() === "yes" }
      });
    }
    if (url.pathname === "/api/file" && req.method === "POST") {
      const b = await body(req);
      const name = basename(String(b.name || ""));
      if (!name.endsWith(".md")) throw new Error("bad file");
      writeFileSync(join(PDIR, name), String(b.text ?? ""), "utf8");
      return json(res, { ok: true });
    }
    if (url.pathname === "/api/settings" && req.method === "POST") {
      const b = await body(req);
      const cur = existsSync(SETTINGS) ? JSON.parse(noBom(readFileSync(SETTINGS, "utf8"))) : {};
      const keys = ["stickerChance", "groupAmbientChance", "groupFollowUpSeconds", "messageBufferMs", "proactiveChance", "chatVideoChance", "moodCooldownTurns", "sessionWindowTurns", "sessionResetMinutes", "sessionCharLimit", "autoLeaveMinutes", "autoLeaveStreakResetSeconds", "proactiveVideoChance", "ttsVoice", "biliCookie", "baiduCookie", "bannedWords", "pokeReplies", "arkKey", "groupAlwaysUsers"];
      const next = { ...cur };
      for (const k of keys) if (b[k] !== void 0) next[k] = b[k];
      writeFileSync(SETTINGS, JSON.stringify(next, null, 2), "utf8");
      return json(res, { ok: true });
    }
    if (url.pathname === "/api/sticker" && req.method === "GET") {
      const name = basename(url.searchParams.get("name") || "");
      if (!IMG.test(name)) throw new Error("bad name");
      const data = readFileSync(join(STICKERS, name));
      const ext = name.split(".").pop().toLowerCase();
      res.writeHead(200, { "content-type": "image/" + (ext === "jpg" ? "jpeg" : ext) });
      return res.end(data);
    }
    if (url.pathname === "/api/sticker" && req.method === "POST") {
      const b = await body(req);
      const name = basename(String(b.name || "upload.png"));
      if (!IMG.test(name)) throw new Error("bad type");
      writeFileSync(join(STICKERS, name), Buffer.from(String(b.data || ""), "base64"));
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
    if (url.pathname === "/api/tics") {
      const TF = join(PROFILE, "tics.json");
      const loadT = () => { try { const d = JSON.parse(noBom(readFileSync(TF, "utf8"))); return d && typeof d === "object" ? d : {}; } catch { return {}; } };
      if (req.method === "GET") {
        const all = loadT();
        const rows = Object.keys(all).map((k) => {
          const parts = String(k).split(":");
          const kind = parts[4] === "group" ? "群" : parts[4] === "private" ? "私聊" : "全局";
          const target = parts[5] && parts[5] !== "-" ? parts[5] : (parts[6] || "全部");
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
        const scenario = String(b.scenario || "").trim().slice(0, 40);
        if (phrase === "" || scenario === "") { res.writeHead(400).end("bad args"); return; }
        const kind = String(b.kind || "") === "pattern" ? "pattern" : "phrase";
        const hit = arr.find((t) => String(t.phrase) === phrase);
        if (hit !== void 0) {
          hit.scenario = scenario;
          hit.kind = kind;
          hit.count = Number(hit.count || 1) + 1;
          hit.at = Date.now();
        } else {
          arr.push({ scenario, phrase, count: 1, kind, at: Date.now() });
        }
        all[key] = arr.slice(-200);
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
        if (typeof b.scenario === "string" && b.scenario.trim() !== "") hit.scenario = b.scenario.trim().slice(0, 40);
        if (typeof b.newPhrase === "string" && b.newPhrase.trim() !== "") hit.phrase = b.newPhrase.trim().slice(0, 20);
        if (typeof b.count === "number") hit.count = Math.max(1, Math.min(999, Math.round(b.count)));
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
    if (url.pathname === "/api/memewiki" && req.method === "GET") {
      const mwDir = join(PROFILE, "node_modules/dsh-memewiki");
      let cfg = { "自动思考梗": true, "串子开关": false, "串子程度": 50 };
      try {
        const cfgFile = join(process.env.HOME || "/root", ".dsh/memewiki.json");
        cfg = { ...cfg, ...JSON.parse(readFileSync(cfgFile, "utf8")) };
      } catch {}
      let total = 0;
      try {
        const { DatabaseSync } = await import("node:sqlite");
        const db = new DatabaseSync(join(mwDir, "data/memes.db"));
        total = Number(db.prepare("SELECT COUNT(*) AS n FROM memes").get().n);
        db.close();
      } catch {}
      let version = "";
      try {
        version = JSON.parse(readFileSync(join(mwDir, "package.json"), "utf8")).version;
      } catch {}
      return json(res, { cfg, total, version });
    }
    if (url.pathname === "/api/memewiki/config" && req.method === "POST") {
      const b = await body(req);
      const cfgFile = join(process.env.HOME || "/root", ".dsh/memewiki.json");
      let cur = {};
      try { cur = JSON.parse(readFileSync(cfgFile, "utf8")); } catch {}
      for (const k of ["自动思考梗", "串子开关", "串子程度"]) {
        if (b[k] !== void 0) cur[k] = b[k];
      }
      writeFileSync(cfgFile, JSON.stringify(cur, null, 2), "utf8");
      return json(res, { ok: true, cfg: cur });
    }
    if (url.pathname === "/api/memewiki/search" && req.method === "GET") {
      const q = String(url.searchParams.get("q") || "").trim();
      const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));
      const limit = Math.min(50, Math.max(5, Number(url.searchParams.get("limit") || 20)));
      const { DatabaseSync } = await import("node:sqlite");
      const db = new DatabaseSync(join(PROFILE, "node_modules/dsh-memewiki/data/memes.db"));
      let rows = [];
      let total = 0;
      if (q === "") {
        total = Number(db.prepare("SELECT COUNT(*) AS n FROM memes").get().n);
        rows = db.prepare("SELECT title, summary FROM memes ORDER BY title LIMIT ? OFFSET ?").all(limit, offset);
      } else {
        const like = "%" + q + "%";
        total = Number(db.prepare("SELECT COUNT(*) AS n FROM memes WHERE title LIKE ? OR slug LIKE ? OR summary LIKE ?").get(like, like, like).n);
        rows = db.prepare("SELECT title, summary FROM memes WHERE title LIKE ? OR slug LIKE ? OR summary LIKE ? ORDER BY title LIMIT ? OFFSET ?").all(like, like, like, limit, offset);
      }
      db.close();
      return json(res, { rows, total, offset, limit });
    }
    if (url.pathname === "/api/memewiki/entry" && req.method === "POST") {
      const b = await body(req);
      const title = String(b.title || "").trim();
      if (title === "") throw new Error("title required");
      const { DatabaseSync } = await import("node:sqlite");
      const db = new DatabaseSync(join(PROFILE, "node_modules/dsh-memewiki/data/memes.db"));
      db.prepare("INSERT INTO memes (title, slug, tags, usage, origin, other, summary) VALUES (?,?,?,?,?,?,?) ON CONFLICT(title) DO UPDATE SET summary=excluded.summary, tags=excluded.tags, usage=excluded.usage, origin=excluded.origin")
        .run(title, String(b.slug || ""), String(b.tags || ""), String(b.usage || ""), String(b.origin || ""), String(b.other || ""), String(b.summary || ""));
      db.close();
      return json(res, { ok: true });
    }
    if (url.pathname === "/api/memewiki/entry" && req.method === "DELETE") {
      const title = String(url.searchParams.get("title") || "");
      const { DatabaseSync } = await import("node:sqlite");
      const db = new DatabaseSync(join(PROFILE, "node_modules/dsh-memewiki/data/memes.db"));
      db.prepare("DELETE FROM memes WHERE title = ?").run(title);
      db.close();
      return json(res, { ok: true });
    }
    if (url.pathname === "/api/lists" && req.method === "GET") {
      const read = (f, k, fb) => {
        try { const d = JSON.parse(readFileSync(join(PROFILE, f), "utf8")); return Array.isArray(d[k]) ? d[k] : fb; } catch { return fb; }
      };
      return json(res, { owners: read("owners.json", "owners", ["2262898415"]), admins: read("admins.json", "admins", []) });
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
        res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NapCat 登录</title><body style="background:#111;color:#ddd;font-family:system-ui;text-align:center;padding:20px"><h3>用 QQ 扫这张码登录 3947294848</h3><div id="box"></div><p style="color:#888;font-size:13px">每 20 秒自动刷新，过期不用管</p><script>function r(){var i=new Image();i.onload=function(){document.getElementById("box").innerHTML="";document.getElementById("box").appendChild(i)};i.src="/qr?t=' + TOKEN + '&fresh=1&x="+Date.now();}r();setInterval(r,20000);</script></body>');
        return;
      }
      let ageMs = 1e9;
      try { ageMs = Date.now() - statSync("/opt/napcat/qrcode.png").mtimeMs; } catch {}
      if (url.searchParams.get("fresh") === "1" && ageMs > 90000) {
        await run("docker", ["restart", "napcat"]);
        await new Promise((r2) => setTimeout(r2, 9000));
      }
      const r = await run("docker", ["cp", "napcat:/app/napcat/cache/qrcode.png", "/opt/napcat/qrcode.png"]);
      if (!r.ok) { res.writeHead(500).end("qr unavailable"); return; }
      const buf = readFileSync("/tmp/napcat-qr.png");
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
