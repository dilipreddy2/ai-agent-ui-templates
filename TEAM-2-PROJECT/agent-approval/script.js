// Orbit – Agent Approval Interface (plain JavaScript, no libraries)
const $ = (s) => document.querySelector(s);
const rnd = (a, b) => Math.round(a + Math.random() * (b - a));
const pool = [
  ["Research Agent", "Send the weekly report to customers", "Low", "The report is ready and has been checked twice.", ["Email goes to 42 customers", "Cannot be recalled once sent"], "Hi team, here is this week's summary of results and next steps..."],
  ["Billing Agent", "Refund $240 to a customer", "Medium", "The customer was charged twice for the same order.", ["$240 leaves the company account", "Customer gets an email"], "Refund for order #8841: duplicate charge found on 03 Oct."],
  ["Data Agent", "Delete 1,200 old records", "High", "Records are older than 3 years and no longer used.", ["Records are removed from the database", "A backup is kept for 7 days"], "DELETE FROM records WHERE created < '2023-10-01'"],
  ["Outreach Agent", "Post an announcement on the website", "Low", "A new feature launches tomorrow.", ["Page becomes public right away"], "Big news: our new dashboard is live! Take a look..."],
  ["Support Agent", "Close 14 resolved tickets", "Low", "All 14 tickets were solved and the customers confirmed.", ["Tickets move to Closed", "Customers get a thank-you note"], "Thanks for your patience, your ticket is now closed."],
  ["Security Agent", "Block a suspicious login location", "Medium", "Many failed logins came from one place.", ["Logins from that place are blocked", "Real users there may be affected"], "Block rule: country=XX, reason=repeated failed logins"],
];
let id = 0, tab = "Pending", rejecting = null;
const make = (i) => { const p = pool[i % pool.length]; return { id: ++id, agent: p[0], title: p[1], risk: p[2], why: p[3], impact: p[4], preview: p[5], conf: rnd(72, 98), left: rnd(90, 900), st: "Pending", note: "" }; };
let reqs = [0, 1, 2, 3].map(make);
let auto = false;
const ini = (n) => n.split(" ").map((w) => w[0]).join("");

function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2200); }
const fmt = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");

function render() {
  const n = (s) => reqs.filter((r) => r.st === s).length;
  $("#tabs").innerHTML = ["Pending", "Approved", "Rejected"].map((t) => `<button class="${t === tab ? "on" : ""}">${t} (${n(t)})</button>`).join("");
  const rows = reqs.filter((r) => r.st === tab);
  $("#reqs").innerHTML = rows.length ? rows.map((r, i) => `
    <article class="card req ${i === 0 && tab === "Pending" ? "first" : ""}" data-id="${r.id}">
      <div class="head2"><span class="avatar">${ini(r.agent)}</span><div class="meta"><b>${r.agent}</b><small>wants to do this</small></div><span class="risk ${r.risk}">${r.risk} risk</span></div>
      <h3>${r.title}</h3><p>${r.why}</p>
      <ul class="impact">${r.impact.map((x) => `<li>${x}</li>`).join("")}</ul>
      <div class="preview">${r.preview}</div>
      <div class="conf"><span>Confidence</span><div class="bar"><i style="width:${r.conf}%"></i></div><span>${r.conf}%</span></div>
      ${r.st !== "Pending" ? `<span class="done-tag">${r.st}${r.note ? ": " + r.note : ""}</span>` : rejecting === r.id
        ? `<div class="reason"><input id="why" placeholder="Why? (optional)" aria-label="Reason"><button class="btn-no" data-a="confirm">Confirm reject</button><button class="btn-no" data-a="cancel">Cancel</button></div>`
        : `<div class="foot2"><span class="grow">Expires in <span class="cd" data-id="${r.id}">${fmt(r.left)}</span></span><button class="btn-no" data-a="reject">Reject</button><button class="btn-ok" data-a="approve">Approve</button></div>`}
    </article>`).join("") : `<p class="empty">${tab === "Pending" ? "All caught up. Nothing needs your approval." : "Nothing here yet."}</p>`;
  const w = $("#why"); if (w) w.focus();
}

function decide(r, st, note) {
  const el = document.querySelector(`.req[data-id="${r.id}"]`); if (el) el.classList.add("out");
  setTimeout(() => { r.st = st; r.note = note || ""; rejecting = null; render(); }, el ? 330 : 0);
  toast(st === "Approved" ? r.agent + " can go ahead" : "Request rejected");
}
$("#reqs").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  const r = reqs.find((x) => x.id == b.closest(".req").dataset.id), a = b.dataset.a;
  if (a === "approve") decide(r, "Approved");
  if (a === "reject") { rejecting = r.id; render(); }
  if (a === "cancel") { rejecting = null; render(); }
  if (a === "confirm") decide(r, "Rejected", $("#why").value.trim());
});
$("#tabs").addEventListener("click", (e) => { if (e.target.tagName !== "BUTTON") return; tab = e.target.textContent.split(" ")[0]; rejecting = null; render(); });
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || tab !== "Pending") return;
  const r = reqs.find((x) => x.st === "Pending"); if (!r) return;
  if (e.key.toLowerCase() === "a") decide(r, "Approved");
  if (e.key.toLowerCase() === "r") { e.preventDefault(); rejecting = r.id; render(); }
});
$("#auto").addEventListener("click", () => {
  auto = !auto; $("#auto").classList.toggle("on", auto);
  if (auto) { const low = reqs.filter((r) => r.st === "Pending" && r.risk === "Low"); low.forEach((r) => (r.st = "Approved", r.note = "auto-approved")); render(); toast(low.length ? low.length + " low-risk requests approved" : "Auto-approve is on"); }
});
function arrive() { const r = make(rnd(0, pool.length - 1)); if (auto && r.risk === "Low") { r.st = "Approved"; r.note = "auto-approved"; } reqs.unshift(r); if (rejecting === null) render(); }
$("#newReq").addEventListener("click", () => { arrive(); toast("New request arrived"); });
setInterval(() => { if (reqs.filter((r) => r.st === "Pending").length < 6) arrive(); }, 15000);

// Countdowns update in place, so typing is never interrupted
setInterval(() => {
  let expired = false;
  reqs.filter((r) => r.st === "Pending").forEach((r) => {
    r.left--; const c = document.querySelector(`.cd[data-id="${r.id}"]`); if (c) c.textContent = fmt(Math.max(r.left, 0));
    if (r.left <= 0 && rejecting !== r.id) { r.st = "Rejected"; r.note = "expired"; expired = true; }
  });
  if (expired) render();
}, 1000);

// Hero letters
(function () { const h = $("#kinetic"), ws = h.textContent.split(" "); let n = 0; h.textContent = "";
  ws.forEach((w, i) => { const s = document.createElement("span"); s.className = "w"; [...w].forEach((c) => { const k = document.createElement("span"); k.className = "ch" + (i >= 1 ? " hl" : ""); k.textContent = c; k.style.animationDelay = 0.2 + n++ * 0.045 + "s"; s.append(k); }); h.append(s, " "); }); })();

// Cursor
(function () { if (!matchMedia("(pointer:fine)").matches) return; const d = $("#cDot"), r = $("#cRing"); let x = 0, y = 0, rx = 0, ry = 0;
  addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; document.body.classList.add("cursor-on"); d.style.transform = `translate(${x}px,${y}px)`; document.body.classList.toggle("cursor-hover", !!e.target.closest("button,a,input")); });
  document.addEventListener("mouseleave", () => document.body.classList.remove("cursor-on"));
  (function f() { rx += (x - rx) * 0.16; ry += (y - ry) * 0.16; r.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(f); })(); })();

render();
