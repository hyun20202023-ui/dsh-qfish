const TOKEN = new URLSearchParams(location.search).get("t") || "";

export function toast(text) {
  let el = document.getElementById("qf-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "qf-toast";
    el.style.cssText =
      "position:fixed;left:50%;bottom:42px;transform:translateX(-50%);z-index:999;background:#141515;border:1px solid #b7a98f;color:#d8c9a8;padding:8px 18px;font:14px/1.4 'Fusion Pixel',monospace;letter-spacing:1px;opacity:0;transition:opacity .18s";
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.style.opacity = "1";
  clearTimeout(el.__t);
  el.__t = setTimeout(() => (el.style.opacity = "0"), 1800);
}

export async function api(path, opts = {}) {
  const url = path + (path.includes("?") ? "&" : "?") + "t=" + encodeURIComponent(TOKEN);
  const init = { method: opts.method || "GET", headers: {} };
  if (opts.body !== undefined) {
    init.headers["content-type"] = "application/json";
    init.body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
  }
  const r = await fetch(url, init);
  if (!r.ok) throw new Error("HTTP " + r.status);
  const ct = r.headers.get("content-type") || "";
  if (ct.includes("application/json")) return r.json();
  return r.text();
}

export { TOKEN };
