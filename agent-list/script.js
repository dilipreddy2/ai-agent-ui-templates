// Orbit – AI Agent List (plain JavaScript, no libraries)
const $ = (s) => document.querySelector(s);
const names = [["Research Agent","Finds and summarises sources","working"],["Support Agent","Answers customer tickets","working"],["Data Agent","Cleans and syncs datasets","idle"],["Billing Agent","Handles invoices and refunds","error"],["Outreach Agent","Writes and sends emails","working"],["Scheduler Agent","Books meetings and reminders","idle"],["Code Review Agent","Checks pull requests","working"],["Insight Agent","Spots trends in your data","working"],["Translator Agent","Translates content, 30 languages","idle"],["Security Agent","Watches for risky activity","working"],["Content Agent","Drafts posts and captions","idle"],["QA Agent","Tests new releases","error"]];
const rnd = (a, b) => Math.round(a + Math.random() * (b - a));
let agents = names.map(([name, role, st]) => ({ name, role, st, on: true, tasks: rnd(120, 2400), rate: rnd(88, 99), spark: Array.from({ length: 10 }, () => rnd(4, 30)) }));
const ab = (n) => n.split(" ").map((w) => w[0]).slice(0, 2).join("");
let filter = "All", view = "grid";

function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2200); }
const state = (a) => (a.on ? a.st : "paused");

function render() {
  const q = $("#q").value.toLowerCase(), by = $("#sort").value;
  let rows = agents.filter((a) => (filter === "All" || state(a) === filter.toLowerCase()) && (a.name + a.role).toLowerCase().includes(q));
  rows.sort((a, b) => (by === "name" ? a.name.localeCompare(b.name) : b[by] - a[by]));
  $("#count").textContent = `Showing ${rows.length} of ${agents.length} agents`;
  $("#list").className = "grid" + (view === "list" ? " list" : "");
  $("#list").innerHTML = rows.length ? rows.map((a, i) => {
    const pts = a.spark.map((v, j) => `${j * 10.6},${36 - v}`).join(" ");
    return `<article class="card" style="animation-delay:${i * 45}ms">
      <div class="top"><span class="avatar">${ab(a.name)}</span><div class="meta"><b>${a.name}</b><small>${a.role}</small></div><span class="chip ${state(a)}">${state(a)[0].toUpperCase() + state(a).slice(1)}</span></div>
      <div class="stats"><div><b>${a.tasks.toLocaleString()}</b><span>Tasks done</span></div><div><b>${a.rate}%</b><span>Success</span></div><svg class="spark" viewBox="0 0 96 38" aria-hidden="true"><polyline points="${pts}"/></svg></div>
      <div class="foot"><button class="sw ${a.on ? "on" : ""}" data-n="${a.name}" aria-label="Turn ${a.name} on or off"></button><button class="link" data-v="${a.name}">View profile</button></div></article>`;
  }).join("") : `<p class="empty">No agents match your search.</p>`;
}

$("#chips").innerHTML = ["All", "Working", "Idle", "Error", "Paused"].map((c) => `<button class="${c === "All" ? "on" : ""}">${c}</button>`).join("");
$("#chips").addEventListener("click", (e) => { if (e.target.tagName !== "BUTTON") return; filter = e.target.textContent; document.querySelectorAll("#chips button").forEach((b) => b.classList.toggle("on", b === e.target)); render(); });
document.querySelector(".view").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; view = b.dataset.v; document.querySelectorAll(".view button").forEach((x) => x.classList.toggle("on", x === b)); render(); });
$("#q").addEventListener("input", render); $("#sort").addEventListener("change", render);
$("#list").addEventListener("click", (e) => {
  const sw = e.target.closest(".sw"), v = e.target.closest(".link");
  if (sw) { const a = agents.find((x) => x.name === sw.dataset.n); a.on = !a.on; toast(a.name + (a.on ? " is back online" : " paused")); render(); }
  if (v) toast("Profile page comes in the next UI");
});
$("#addBtn").addEventListener("click", () => { agents.unshift({ name: "New Agent " + (agents.length - 11), role: "Just created, ready for tasks", st: "idle", on: true, tasks: 0, rate: 100, spark: Array(10).fill(4) }); render(); toast("New agent created"); });

// Hero letters
(function () { const h = $("#kinetic"), ws = h.textContent.split(" "); let n = 0; h.textContent = "";
  ws.forEach((w, i) => { const s = document.createElement("span"); s.className = "w"; [...w].forEach((c) => { const k = document.createElement("span"); k.className = "ch" + (i >= 1 ? " hl" : ""); k.textContent = c; k.style.animationDelay = 0.2 + n++ * 0.045 + "s"; s.append(k); }); h.append(s, " "); }); })();

// Cursor
(function () { if (!matchMedia("(pointer:fine)").matches) return; const d = $("#cDot"), r = $("#cRing"); let x = 0, y = 0, rx = 0, ry = 0;
  addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; document.body.classList.add("cursor-on"); d.style.transform = `translate(${x}px,${y}px)`; document.body.classList.toggle("cursor-hover", !!e.target.closest("button,a,select,input")); });
  document.addEventListener("mouseleave", () => document.body.classList.remove("cursor-on"));
  (function f() { rx += (x - rx) * 0.16; ry += (y - ry) * 0.16; r.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(f); })(); })();

render();
