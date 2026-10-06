// Orbit – Automation Workflow Builder (plain JavaScript, no libraries)
const $ = (s) => document.querySelector(s);
const W = 190, H = 66;
const kinds = {
  schedule: { t: "trigger", name: "Schedule", sub: "Every day at 9:00" },
  email: { t: "trigger", name: "New email", sub: "When an email arrives" },
  webhook: { t: "trigger", name: "Webhook", sub: "When a URL is called" },
  agent: { t: "action", name: "Ask an agent", sub: "Agent writes a reply" },
  send: { t: "action", name: "Send email", sub: "Send to a person" },
  post: { t: "action", name: "Post message", sub: "Post to team chat" },
  wait: { t: "action", name: "Wait", sub: "Pause for 1 hour" },
  task: { t: "action", name: "Create task", sub: "Add to the task queue" },
};
let nodes = [], edges = [], sel = null, from = null, uid = 0, running = false;
const find = (id) => nodes.find((n) => n.id === id);
const HINT = "Tip: click the dot on the right of a block, then the dot on the left of another block to connect them. Click a line to remove it.";

function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2200); }

// Palette
$("#pal").innerHTML = ["trigger", "action"].map((t) => `<h3>${t === "trigger" ? "Triggers (start here)" : "Actions"}</h3>` +
  Object.entries(kinds).filter(([, k]) => k.t === t).map(([key, k]) => `<button class="blk" draggable="true" data-k="${key}"><span class="ico ${t}">${t === "trigger" ? "T" : "A"}</span><span>${k.name}<small>${k.sub}</small></span></button>`).join("")).join("");
$("#pal").addEventListener("click", (e) => { const b = e.target.closest(".blk"); if (b) addNode(b.dataset.k); });
$("#pal").addEventListener("dragstart", (e) => { const b = e.target.closest(".blk"); if (b) e.dataTransfer.setData("text/plain", b.dataset.k); });
$("#canvas").addEventListener("dragover", (e) => e.preventDefault());
$("#canvas").addEventListener("drop", (e) => {
  e.preventDefault(); const k = e.dataTransfer.getData("text/plain"); if (!kinds[k]) return;
  const r = $("#canvas").getBoundingClientRect(); addNode(k, e.clientX - r.left - W / 2, e.clientY - r.top - H / 2);
});

function addNode(kind, x, y) {
  const i = nodes.length, c = $("#canvas").getBoundingClientRect();
  const n = { id: ++uid, kind, label: kinds[kind].name, x: x ?? 40 + ((i * 70) % Math.max(c.width - W - 40, 120)), y: y ?? 30 + ((i * 84) % (c.height - H - 40)) };
  n.x = Math.max(0, Math.min(n.x, c.width - W)); n.y = Math.max(0, Math.min(n.y, c.height - H));
  nodes.push(n); renderNodes(); select(n.id); return n;
}

function renderNodes() {
  $("#nodes").innerHTML = nodes.map((n) => {
    const k = kinds[n.kind];
    return `<div class="node ${k.t} ${n.id === sel ? "sel" : ""}" data-id="${n.id}" style="left:${n.x}px;top:${n.y}px">
      ${k.t === "action" ? `<button class="port in" data-p="in" aria-label="Connect into ${n.label}"></button>` : ""}
      <span class="ico">${k.t === "trigger" ? "T" : "A"}</span><div><b>${n.label}</b><small>${k.sub}</small></div>
      <button class="port out ${from === n.id ? "armed" : ""}" data-p="out" aria-label="Connect from ${n.label}"></button></div>`;
  }).join("");
  drawEdges();
}
function drawEdges(activeFrom) {
  $("#edges").innerHTML = edges.map((e, i) => {
    const a = find(e.from), b = find(e.to); if (!a || !b) return "";
    const x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x, y2 = b.y + H / 2, d = `M${x1} ${y1} C${x1 + 70} ${y1},${x2 - 70} ${y2},${x2} ${y2}`;
    return `<path class="line ${activeFrom === e.from ? "live" : ""}" d="${d}"/><path class="hit" data-i="${i}" d="${d}"/>`;
  }).join("");
}

// Selecting and settings
function select(id) {
  sel = id; document.querySelectorAll(".node").forEach((el) => el.classList.toggle("sel", +el.dataset.id === id));
  const n = find(id);
  $("#settings").innerHTML = n ? `<span class="chip ${kinds[n.kind].t === "trigger" ? "idle" : "working"}">${kinds[n.kind].t === "trigger" ? "Trigger" : "Action"}</span>
    <input id="lbl" value="${n.label}" aria-label="Block name" maxlength="24"><button class="btn-no" id="del">Delete block</button>` : `<p>Click a block on the canvas to rename or delete it.</p>`;
}
$("#settings").addEventListener("input", (e) => { if (e.target.id !== "lbl") return; const n = find(sel); n.label = e.target.value || "Untitled"; document.querySelector(`.node[data-id="${sel}"] b`).textContent = n.label; });
$("#settings").addEventListener("click", (e) => {
  if (e.target.id !== "del") return;
  nodes = nodes.filter((n) => n.id !== sel); edges = edges.filter((x) => x.from !== sel && x.to !== sel); sel = null; renderNodes(); select(null); toast("Block deleted");
});

// Dragging blocks around
$("#nodes").addEventListener("pointerdown", (e) => {
  if (e.target.closest(".port")) return;
  const el = e.target.closest(".node"); if (!el) return;
  const n = find(+el.dataset.id), r = $("#canvas").getBoundingClientRect(), ox = e.clientX - r.left - n.x, oy = e.clientY - r.top - n.y;
  select(n.id); el.setPointerCapture(e.pointerId);
  const move = (ev) => {
    n.x = Math.max(0, Math.min(ev.clientX - r.left - ox, r.width - W)); n.y = Math.max(0, Math.min(ev.clientY - r.top - oy, r.height - H));
    el.style.left = n.x + "px"; el.style.top = n.y + "px"; drawEdges();
  };
  const up = () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); };
  el.addEventListener("pointermove", move); el.addEventListener("pointerup", up);
});

// Connecting blocks
$("#nodes").addEventListener("click", (e) => {
  const p = e.target.closest(".port"); if (!p) { if (e.target.id === "nodes" && from) { from = null; renderNodes(); $("#hint").textContent = HINT; } return; }
  const id = +p.closest(".node").dataset.id;
  if (p.dataset.p === "out") { from = from === id ? null : id; renderNodes(); $("#hint").textContent = from ? "Now click the left dot of the block it should go to." : HINT; return; }
  if (from === null) return toast("Click the right dot of a block first");
  if (edges.some((x) => x.from === from && x.to === id)) { from = null; renderNodes(); return toast("Those blocks are already connected"); }
  edges.push({ from, to: id }); from = null; renderNodes(); $("#hint").textContent = HINT; toast("Blocks connected");
});
$("#canvas").addEventListener("click", (e) => { if (e.target.id === "canvas" || e.target.id === "edges") { from = null; renderNodes(); $("#hint").textContent = HINT; } });
$("#edges").addEventListener("click", (e) => { const h = e.target.closest(".hit"); if (!h) return; edges.splice(+h.dataset.i, 1); drawEdges(); toast("Connection removed"); });
$("#clearBtn").addEventListener("click", () => { nodes = []; edges = []; sel = null; from = null; renderNodes(); select(null); toast("Canvas cleared"); });

// Running the flow
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function log(text, cls = "") { const li = document.createElement("li"); li.innerHTML = `<time>${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time><span class="${cls}">${text}</span>`; $("#runlog").prepend(li); }
async function run() {
  if (running) return;
  const queue = nodes.filter((n) => kinds[n.kind].t === "trigger");
  if (!queue.length) return toast("Add a trigger block first");
  running = true; $("#runlog").innerHTML = ""; const seen = new Set();
  while (queue.length) {
    const n = queue.shift(); if (seen.has(n.id)) continue; seen.add(n.id);
    const el = document.querySelector(`.node[data-id="${n.id}"]`); el.classList.add("running"); drawEdges(n.id);
    log(`${kinds[n.kind].t === "trigger" ? "Trigger fired" : "Running"}: ${n.label}`); await sleep(850);
    el.classList.replace("running", "done"); log(`${n.label} finished`, "ok");
    edges.filter((x) => x.from === n.id).forEach((x) => queue.push(find(x.to)));
  }
  drawEdges(); const missed = nodes.length - seen.size;
  if (missed) log(`${missed} block(s) were skipped because they are not connected to a trigger`, "warn");
  log("Flow finished", "ok"); toast("Flow finished"); running = false;
  await sleep(1800); document.querySelectorAll(".node.done").forEach((el) => el.classList.remove("done"));
}
$("#runBtn").addEventListener("click", run);

// Starter flow
const a = addNode("email", 30, 60), b = addNode("agent", 280, 170), c = addNode("post", 540, 80);
edges.push({ from: a.id, to: b.id }, { from: b.id, to: c.id }); renderNodes(); select(null); $("#hint").textContent = HINT;

// Hero letters
(function () { const h = $("#kinetic"), ws = h.textContent.split(" "); let n = 0; h.textContent = "";
  ws.forEach((w, i) => { const s = document.createElement("span"); s.className = "w"; [...w].forEach((ch) => { const k = document.createElement("span"); k.className = "ch" + (i >= 1 ? " hl" : ""); k.textContent = ch; k.style.animationDelay = 0.2 + n++ * 0.045 + "s"; s.append(k); }); h.append(s, " "); }); })();

// Cursor
(function () { if (!matchMedia("(pointer:fine)").matches) return; const d = $("#cDot"), r = $("#cRing"); let x = 0, y = 0, rx = 0, ry = 0;
  addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; document.body.classList.add("cursor-on"); d.style.transform = `translate(${x}px,${y}px)`; document.body.classList.toggle("cursor-hover", !!e.target.closest("button,a,input,.node,.hit")); });
  document.addEventListener("mouseleave", () => document.body.classList.remove("cursor-on"));
  (function f() { rx += (x - rx) * 0.16; ry += (y - ry) * 0.16; r.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(f); })(); })();
