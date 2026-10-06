// Orbit – AI Agent Dashboard (plain JavaScript, no libraries)
const $ = (s) => document.querySelector(s);
const agents = [
  { name: "Research Agent", role: "Finds and summarises sources", ab: "Ra", cls: "a3", st: "working", on: true },
  { name: "Support Agent", role: "Answers customer tickets", ab: "Su", cls: "a1", st: "working", on: true },
  { name: "Data Agent", role: "Cleans and syncs datasets", ab: "Da", cls: "a5", st: "idle", on: true },
  { name: "Billing Agent", role: "Retrying a failed invoice sync", ab: "Bi", cls: "a4", st: "error", on: true },
];
const tasks = [
  { t: "Summarise Q3 feedback", p: 82 }, { t: "Reply to 14 open tickets", p: 55 },
  { t: "Sync product catalogue", p: 31 }, { t: "Weekly revenue report", p: 12 },
];
const events = [
  ["#3ddc97", "Support Agent closed ticket #2048"], ["#ffd800", "Research Agent started a new summary"],
  ["#ffb020", "Data Agent paused: waiting for new rows"], ["#ff5d5d", "Billing Agent hit an error and will retry"],
  ["#3ddc97", "Research Agent finished 3 sources"], ["#ffd800", "Support Agent drafted a reply"],
];

// Toast
let toastTimer;
function toast(msg) {
  const el = $("#toast"); el.textContent = msg; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

// Count-up numbers
function countUp(el) {
  const end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, suf = el.dataset.suffix || "";
  const start = performance.now(), dur = 1400;
  (function tick(now) {
    const k = Math.min((now - start) / dur, 1), e = 1 - Math.pow(1 - k, 3);
    el.textContent = (end * e).toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suf;
    if (k < 1) requestAnimationFrame(tick);
  })(start);
}
document.querySelectorAll("[data-count]").forEach(countUp);
(function hero() { const el = $("#heroCount"), s = performance.now();
  (function t(n) { const k = Math.min((n - s) / 1400, 1); el.textContent = Math.round(1284 * (1 - Math.pow(1 - k, 3))).toLocaleString(); if (k < 1) requestAnimationFrame(t); })(s); })();

// Agents list
function renderAgents() {
  $("#agents").innerHTML = agents.map((a, i) => `
    <li><span class="avatar ${a.cls}">${a.ab}</span>
    <div class="meta"><b>${a.name}</b><small>${a.role}</small></div>
    <span class="chip ${a.on ? a.st : "idle"}">${a.on ? a.st[0].toUpperCase() + a.st.slice(1) : "Paused"}</span>
    <button class="sw ${a.on ? "on" : ""}" data-i="${i}" aria-label="Turn ${a.name} on or off"></button></li>`).join("");
}
$("#agents").addEventListener("click", (e) => {
  const b = e.target.closest(".sw"); if (!b) return;
  const a = agents[b.dataset.i]; a.on = !a.on; renderAgents();
  toast(a.name + (a.on ? " is back online" : " paused")); addLog(a.on ? "#3ddc97" : "#ffb020", a.name + (a.on ? " resumed" : " was paused"));
});

// Tasks
function renderTasks() {
  $("#tasks").innerHTML = tasks.map((k) => `<li><div class="meta"><b>${k.t}</b><div class="prog"><i style="width:${k.p}%"></i></div></div><span class="pct">${k.p}%</span></li>`).join("");
}
function stepTasks() {
  tasks.forEach((k) => { k.p = k.p >= 100 ? 5 : Math.min(100, k.p + Math.round(Math.random() * 9)); });
  renderTasks();
}

// Activity log
const clock = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
function addLog(color, text) {
  const li = document.createElement("li");
  li.innerHTML = `<time>${clock()}</time><span class="dot" style="background:${color}"></span><span>${text}</span>`;
  const ul = $("#log"); ul.prepend(li); while (ul.children.length > 6) ul.lastChild.remove();
}
events.slice(0, 4).reverse().forEach((e) => addLog(...e));
let ev = 4;
setInterval(() => addLog(...events[ev++ % events.length]), 4500);

// Live chart
const data = Array.from({ length: 24 }, (_, i) => 90 + Math.sin(i / 2) * 25 + Math.random() * 20);
function drawChart() {
  const W = 600, H = 200, max = 180, step = W / (data.length - 1);
  const pts = data.map((v, i) => [i * step, H - (v / max) * (H - 20) - 10]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const grid = [50, 100, 150].map((y) => `<line class="grid-l" x1="0" x2="${W}" y1="${y}" y2="${y}"/>`).join("");
  $("#chart").innerHTML = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd800" stop-opacity=".28"/><stop offset="1" stop-color="#ffd800" stop-opacity="0"/></linearGradient></defs>${grid}<path class="area" d="${line} L${W} ${H} L0 ${H}Z"/><path class="line" d="${line}"/><circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="6" fill="#fff" stroke="#ffd800" stroke-width="3"/>`;
}
setInterval(() => { data.shift(); data.push(Math.max(40, Math.min(170, data.at(-1) + (Math.random() - 0.5) * 40))); drawChart(); stepTasks(); }, 2000);

// Approval
document.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => {
  const ok = b.dataset.act === "approved";
  $("#approvalBody").innerHTML = `<p class="ask">${ok ? "Approved. The report is on its way." : "Rejected. The agent will not send it."}</p>`;
  $("#navCount").textContent = "0"; toast(ok ? "Approved" : "Rejected");
  addLog(ok ? "#3ddc97" : "#ff5d5d", "You " + b.dataset.act + " the customer report");
}));

// New agent
$("#newAgent").addEventListener("click", () => {
  agents.push({ name: "Agent " + (agents.length + 1), role: "Just created, ready for tasks", ab: "N" + (agents.length + 1), cls: "a5", st: "idle", on: true });
  renderAgents(); toast("New agent created");
});

renderAgents(); renderTasks(); drawChart();

// Hero: letters pop in one by one (runs once on page load)
(function kinetic() {
  const h = $("#kinetic"), words = h.textContent.split(" "); let n = 0; h.textContent = "";
  words.forEach((w, wi) => {
    const wrap = document.createElement("span"); wrap.className = "w";
    [...w].forEach((c) => { const s = document.createElement("span"); s.className = "ch" + (wi >= 1 ? " hl" : ""); s.textContent = c; s.style.animationDelay = 0.2 + n++ * 0.045 + "s"; wrap.append(s); });
    h.append(wrap, " ");
  });
})();

// Scrolling ticker
(function ticker() {
  const items = ["Live monitoring", "Task queues", "Human approval", "Activity history", "Error retries", "Agent permissions", "Multi-agent workflows"];
  $("#marq").innerHTML = [...items, ...items].map((t) => `<span>${t}</span>`).join("");
})();

// Custom cursor (only on devices with a mouse)
(function cursor() {
  if (!matchMedia("(pointer:fine)").matches) return;
  const dot = $("#cDot"), ring = $("#cRing"); let x = 0, y = 0, rx = 0, ry = 0;
  addEventListener("mousemove", (e) => {
    x = e.clientX; y = e.clientY; document.body.classList.add("cursor-on");
    dot.style.transform = `translate(${x}px,${y}px)`;
    document.body.classList.toggle("cursor-hover", !!e.target.closest("button,a,.sw"));
  });
  document.addEventListener("mouseleave", () => document.body.classList.remove("cursor-on"));
  (function follow() { rx += (x - rx) * 0.16; ry += (y - ry) * 0.16; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(follow); })();
})();
