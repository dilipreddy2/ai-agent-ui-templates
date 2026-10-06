// Orbit – Agent Task Queue (plain JavaScript, no libraries)
const $ = (s) => document.querySelector(s);
const rnd = (a, b) => Math.round(a + Math.random() * (b - a));
const agentNames = ["Research Agent", "Support Agent", "Data Agent", "Billing Agent", "Outreach Agent"];
const MAX_RUNNING = 2;
let id = 0, filter = "All";
const mk = (title, prio, agent, p, st) => ({ id: ++id, title, prio, agent, p, st, isNew: false });
let tasks = [
  mk("Summarise Q3 customer feedback", "High", agentNames[0], 64, "running"),
  mk("Reply to 14 open support tickets", "High", agentNames[1], 38, "running"),
  mk("Clean the product catalogue data", "Medium", agentNames[2], 0, "queued"),
  mk("Send the weekly progress email", "Medium", agentNames[4], 0, "queued"),
  mk("Reconcile last month's invoices", "Low", agentNames[3], 0, "queued"),
  mk("Draft the launch announcement", "Low", agentNames[0], 0, "paused"),
  mk("Archive old support tickets", "Low", agentNames[1], 100, "done"),
];
$("#agent").innerHTML = agentNames.map((a) => `<option>${a}</option>`).join("");
$("#chips").innerHTML = ["All", "Running", "Queued", "Paused", "Done"].map((c) => `<button class="${c === "All" ? "on" : ""}">${c}</button>`).join("");

function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2000); }

function render() {
  const rows = tasks.filter((t) => filter === "All" || t.st === filter.toLowerCase());
  $("#tasks").innerHTML = rows.length ? rows.map((t) => `
    <li class="task ${t.st} ${t.isNew ? "new" : ""}" data-id="${t.id}">
      <span class="prio ${t.prio}">${t.prio}</span>
      <div><b>${t.title}</b><small>${t.agent}</small></div>
      <div class="pg"><div class="bar"><i style="width:${t.p}%"></i></div><span class="pct">${t.p}%</span></div>
      <span class="chip ${t.st}">${t.st[0].toUpperCase() + t.st.slice(1)}</span>
      <div class="acts">
        <button data-a="up" aria-label="Move up">↑</button><button data-a="down" aria-label="Move down">↓</button>
        ${t.st === "done" ? "" : `<button data-a="pause">${t.st === "paused" ? "Resume" : "Pause"}</button>`}<button data-a="cancel">${t.st === "done" ? "Clear" : "Cancel"}</button>
      </div></li>`).join("") : `<li class="empty">Nothing here yet.</li>`;
  tasks.forEach((t) => (t.isNew = false));
  const n = (s) => tasks.filter((t) => t.st === s).length;
  $("#cRun").textContent = n("running"); $("#cQ").textContent = n("queued") + n("paused"); $("#cDone").textContent = n("done");
}

// Every second: move running tasks forward, and start waiting ones
function tick() {
  let changed = false;
  tasks.filter((t) => t.st === "running").forEach((t) => {
    t.p = Math.min(100, t.p + rnd(2, 7));
    if (t.p === 100) { t.st = "done"; changed = true; toast(t.agent + " finished a task"); }
  });
  while (tasks.filter((t) => t.st === "running").length < MAX_RUNNING) {
    const next = tasks.find((t) => t.st === "queued"); if (!next) break; next.st = "running"; changed = true;
  }
  if (changed) return render();
  document.querySelectorAll(".task.running").forEach((li) => {
    const t = tasks.find((x) => x.id == li.dataset.id);
    li.querySelector(".bar i").style.width = t.p + "%"; li.querySelector(".pct").textContent = t.p + "%";
  });
}
setInterval(tick, 1000);

$("#tasks").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  const i = tasks.findIndex((t) => t.id == b.closest(".task").dataset.id), t = tasks[i], a = b.dataset.a;
  if (a === "up" && i > 0) [tasks[i - 1], tasks[i]] = [tasks[i], tasks[i - 1]];
  if (a === "down" && i < tasks.length - 1) [tasks[i + 1], tasks[i]] = [tasks[i], tasks[i + 1]];
  if (a === "pause") { t.st = t.st === "paused" ? "queued" : "paused"; toast(t.st === "paused" ? "Task paused" : "Task back in the queue"); }
  if (a === "cancel") { tasks.splice(i, 1); toast("Task removed"); }
  render();
});
$("#chips").addEventListener("click", (e) => {
  if (e.target.tagName !== "BUTTON") return; filter = e.target.textContent;
  document.querySelectorAll("#chips button").forEach((b) => b.classList.toggle("on", b === e.target)); render();
});
function addTask() {
  const v = $("#title").value.trim(); if (!v) return toast("Type a task first");
  const t = mk(v, $("#prio").value, $("#agent").value, 0, "queued"); t.isNew = true; tasks.unshift(t); $("#title").value = ""; render(); toast("Task added to the queue");
}
$("#addBtn").addEventListener("click", addTask);
$("#title").addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });
$("#clearDone").addEventListener("click", () => { tasks = tasks.filter((t) => t.st !== "done"); render(); toast("Finished tasks cleared"); });

// Hero letters
(function () { const h = $("#kinetic"), ws = h.textContent.split(" "); let n = 0; h.textContent = "";
  ws.forEach((w, i) => { const s = document.createElement("span"); s.className = "w"; [...w].forEach((c) => { const k = document.createElement("span"); k.className = "ch" + (i >= 1 ? " hl" : ""); k.textContent = c; k.style.animationDelay = 0.2 + n++ * 0.045 + "s"; s.append(k); }); h.append(s, " "); }); })();

// Cursor
(function () { if (!matchMedia("(pointer:fine)").matches) return; const d = $("#cDot"), r = $("#cRing"); let x = 0, y = 0, rx = 0, ry = 0;
  addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; document.body.classList.add("cursor-on"); d.style.transform = `translate(${x}px,${y}px)`; document.body.classList.toggle("cursor-hover", !!e.target.closest("button,a,select,input")); });
  document.addEventListener("mouseleave", () => document.body.classList.remove("cursor-on"));
  (function f() { rx += (x - rx) * 0.16; ry += (y - ry) * 0.16; r.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(f); })(); })();

render();
