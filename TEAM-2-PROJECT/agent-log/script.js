// Orbit – Agent Activity Log (plain JavaScript, no libraries)
const $ = (s) => document.querySelector(s);
const rnd = (a, b) => Math.round(a + Math.random() * (b - a));
const pick = (a) => a[rnd(0, a.length - 1)];
const agents = ["Research Agent", "Support Agent", "Data Agent", "Billing Agent", "Outreach Agent", "Security Agent"];
const types = ["success", "info", "warning", "error"];
const lines = {
  success: ["finished the task <b>Weekly summary</b>", "closed ticket <b>#2048</b>", "synced <b>1,204 records</b> without errors", "sent the report to <b>42 customers</b>"],
  info: ["started the task <b>Customer feedback</b>", "asked for approval before sending an email", "connected to a new data source", "picked up a new task from the queue"],
  warning: ["took longer than usual to respond", "is close to its daily usage limit", "found 3 records with missing data", "retried a slow request"],
  error: ["failed to sync <b>invoices</b>", "lost connection to the database", "could not read a file", "was blocked by a permission rule"],
};
let id = 0, filter = "All", live = true;
const open = new Set();
function make(minAgo) {
  const type = pick(["success", "success", "info", "info", "warning", "error"]);
  return { id: ++id, type, agent: pick(agents), msg: pick(lines[type]), ts: Date.now() - minAgo * 60000, task: "#" + rnd(1000, 9999), dur: (rnd(4, 90) / 10).toFixed(1) + "s", tokens: rnd(200, 4200).toLocaleString(), fresh: false };
}
let events = Array.from({ length: 45 }, (_, i) => make(i * 22 + rnd(0, 18)));

$("#agent").innerHTML = `<option value="">All agents</option>` + agents.map((a) => `<option>${a}</option>`).join("");
const ago = (ts) => { const m = Math.floor((Date.now() - ts) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.floor(m / 60) + " h ago" : Math.floor(m / 1440) + " d ago"; };
const ini = (n) => n.split(" ").map((w) => w[0]).join("");

function visible() {
  const q = $("#q").value.toLowerCase(), ag = $("#agent").value, limit = Date.now() - $("#range").value * 60000;
  return events.filter((e) => e.ts >= limit && (!ag || e.agent === ag) && (filter === "All" || e.type === filter.toLowerCase()) && (e.agent + e.msg).toLowerCase().includes(q));
}
function render() {
  const rows = visible();
  $("#chips").innerHTML = ["All", "Success", "Info", "Warning", "Error"].map((c) => {
    const n = c === "All" ? events.length : events.filter((e) => e.type === c.toLowerCase()).length;
    return `<button class="${c === filter ? "on" : ""}">${c} (${n})</button>`;
  }).join("");
  $("#count").textContent = `Showing ${rows.length} events`;
  $("#log").innerHTML = rows.length ? rows.slice(0, 60).map((e) => `
    <li class="ev ${e.type} ${open.has(e.id) ? "open" : ""} ${e.fresh ? "fresh" : ""}" data-id="${e.id}">
      <div class="row"><span class="avatar">${ini(e.agent)}</span><div class="msg"><b>${e.agent}</b> ${e.msg}</div><span class="chip ${e.type}">${e.type[0].toUpperCase() + e.type.slice(1)}</span><time>${ago(e.ts)}</time></div>
      <div class="more"><div><div class="det"><span>Task<b>${e.task}</b></span><span>Duration<b>${e.dur}</b></span><span>Tokens used<b>${e.tokens}</b></span><span>Time<b>${new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</b></span></div></div></div></li>`).join("") : `<li class="empty">No events match your filters.</li>`;
  events.forEach((e) => (e.fresh = false));
}

setInterval(() => { if (!live) return; const e = make(0); e.fresh = true; events.unshift(e); render(); }, 4000);
$("#log").addEventListener("click", (e) => { const li = e.target.closest(".ev"); if (!li) return; const i = +li.dataset.id; open.has(i) ? open.delete(i) : open.add(i); li.classList.toggle("open"); });
$("#chips").addEventListener("click", (e) => { if (e.target.tagName !== "BUTTON") return; filter = e.target.textContent.split(" ")[0]; render(); });
["input", "change"].forEach((ev) => { $("#q").addEventListener(ev, render); $("#agent").addEventListener(ev, render); $("#range").addEventListener(ev, render); });

function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2000); }
$("#liveBtn").addEventListener("click", () => { live = !live; $("#liveBtn").textContent = live ? "Pause live feed" : "Resume live feed"; toast(live ? "Live feed on" : "Live feed paused"); });
$("#export").addEventListener("click", () => {
  const rows = visible(), csv = ["Time,Agent,Type,Message"].concat(rows.map((e) => [new Date(e.ts).toISOString(), e.agent, e.type, '"' + e.msg.replace(/<[^>]+>/g, "") + '"'].join(","))).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "agent-activity-log.csv"; a.click(); toast("Exported " + rows.length + " events");
});

// Hero letters
(function () { const h = $("#kinetic"), ws = h.textContent.split(" "); let n = 0; h.textContent = "";
  ws.forEach((w, i) => { const s = document.createElement("span"); s.className = "w"; [...w].forEach((c) => { const k = document.createElement("span"); k.className = "ch" + (i >= 1 ? " hl" : ""); k.textContent = c; k.style.animationDelay = 0.2 + n++ * 0.045 + "s"; s.append(k); }); h.append(s, " "); }); })();

// Cursor
(function () { if (!matchMedia("(pointer:fine)").matches) return; const d = $("#cDot"), r = $("#cRing"); let x = 0, y = 0, rx = 0, ry = 0;
  addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; document.body.classList.add("cursor-on"); d.style.transform = `translate(${x}px,${y}px)`; document.body.classList.toggle("cursor-hover", !!e.target.closest("button,a,select,input,.ev")); });
  document.addEventListener("mouseleave", () => document.body.classList.remove("cursor-on"));
  (function f() { rx += (x - rx) * 0.16; ry += (y - ry) * 0.16; r.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(f); })(); })();

render();
