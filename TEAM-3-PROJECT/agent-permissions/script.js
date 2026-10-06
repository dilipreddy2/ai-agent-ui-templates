// Orbit – Agent Permissions (plain JavaScript, no libraries)
const $ = (s) => document.querySelector(s);
const agents = ["Research Agent", "Support Agent", "Billing Agent", "Data Agent", "Outreach Agent"];
const perms = [
  ["Data", "read", "Read files", "See documents and records", "Low", 1], ["Data", "edit", "Edit data", "Change existing records", "Medium"], ["Data", "del", "Delete data", "Remove records for good", "High"],
  ["Messages", "mail", "Send email", "Email people on your behalf", "Medium"], ["Messages", "chat", "Post to team chat", "Write in shared channels", "Low"], ["Messages", "cust", "Contact customers", "Message customers directly", "High"],
  ["Money", "refund", "Issue refunds", "Send money back to customers", "High"], ["Money", "buy", "Make purchases", "Spend company money", "High"],
  ["System", "code", "Run code", "Execute scripts on the server", "High"], ["System", "api", "Call outside services", "Connect to other websites and tools", "Medium"],
].map(([cat, id, name, desc, risk, read]) => ({ cat, id, name, desc, risk, read: !!read }));
const rules = { ro: (p) => (p.read ? 2 : 0), std: (p) => ({ Low: 2, Medium: 1, High: 0 })[p.risk], full: (p) => ({ Low: 2, Medium: 2, High: 1 })[p.risk] };
const fresh = () => agents.map(() => Object.fromEntries(perms.map((p) => [p.id, rules.std(p)])));
const defaults = () => { const s = fresh(); s[2].refund = 1; s[1].cust = 1; s[4].mail = 2; s[3].del = 1; s[0].api = 2; return s; };
let state = defaults(), saved = JSON.parse(JSON.stringify(state)), sel = 0, q = "";
const labels = ["Deny", "Ask", "Allow"];

function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2200); }

function renderChips() { $("#agentChips").innerHTML = `<span>Editing:</span>` + agents.map((a, i) => `<button class="${i === sel ? "on" : ""}" data-i="${i}">${a.split(" ")[0]}</button>`).join(""); }

function renderGrid() {
  const rows = perms.filter((p) => (p.name + p.desc + p.cat).toLowerCase().includes(q)); let cat = "";
  $("#grid").innerHTML = `<thead><tr><th>Permission</th>${agents.map((a, i) => `<th class="${i === sel ? "sel" : ""}"><div class="avatar">${a.split(" ").map((w) => w[0]).join("")}</div>${a.split(" ")[0]}</th>`).join("")}</tr></thead><tbody>` +
    (rows.length ? rows.map((p) => {
      const head = p.cat !== cat ? `<tr class="cat"><td colspan="${agents.length + 1}">${p.cat}</td></tr>` : ""; cat = p.cat;
      return head + `<tr><td class="pname"><b>${p.name}</b><span class="rk ${p.risk}">${p.risk}</span><small>${p.desc}</small></td>` +
        agents.map((_, a) => `<td class="${a === sel ? "sel" : ""}"><button class="pm d${state[a][p.id]}" data-a="${a}" data-p="${p.id}" aria-label="${p.name} for ${agents[a]}">${labels[state[a][p.id]]}</button></td>`).join("") + `</tr>`;
    }).join("") : `<tr><td colspan="${agents.length + 1}" style="padding:34px;color:var(--soft);font-weight:700">No permissions match your search.</td></tr>`) + `</tbody>`;
}

function summary() {
  const s = state[sel], c = [0, 0, 0]; let score = 0, max = 0; const w = { Low: 1, Medium: 2, High: 4 };
  perms.forEach((p) => { c[s[p.id]]++; score += w[p.risk] * (s[p.id] / 2); max += w[p.risk]; });
  const pct = Math.round((score / max) * 100), lvl = pct < 30 ? "Low" : pct < 55 ? "Medium" : "High", col = pct < 30 ? "#2fa64f" : pct < 55 ? "#e0a100" : "#d63d73";
  $("#sum").innerHTML = [["Allowed", c[2]], ["Ask first", c[1]], ["Denied", c[0]]].map((x) => `<div class="card"><span>${x[0]}</span><b>${x[1]}</b></div>`).join("") +
    `<div class="card"><span>Risk level for ${agents[sel].split(" ")[0]}</span><b style="color:${col}">${lvl}</b><div class="meter"><i style="width:${pct}%;background:${col}"></i></div></div>`;
}

function dirty() {
  let n = 0; state.forEach((s, a) => perms.forEach((p) => { if (s[p.id] !== saved[a][p.id]) n++; }));
  $("#savebar").classList.toggle("show", n > 0); $("#dirtyTxt").textContent = n + " unsaved change" + (n > 1 ? "s" : "");
}
function all() { renderChips(); renderGrid(); summary(); dirty(); }

$("#grid").addEventListener("click", (e) => {
  const b = e.target.closest(".pm"); if (!b) return;
  const a = +b.dataset.a, p = perms.find((x) => x.id === b.dataset.p), v = (state[a][p.id] + 1) % 3;
  state[a][p.id] = v; b.className = "pm d" + v; b.textContent = labels[v];
  if (v === 2 && p.risk === "High") toast("Careful: " + p.name + " is high risk. “Ask” is safer.");
  if (a === sel) summary(); dirty();
});
$("#agentChips").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; sel = +b.dataset.i; all(); });
document.querySelector(".presets").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return; perms.forEach((p) => (state[sel][p.id] = rules[b.dataset.p](p)));
  all(); toast(b.textContent + " setup applied to " + agents[sel].split(" ")[0]);
});
$("#q").addEventListener("input", (e) => { q = e.target.value.toLowerCase(); renderGrid(); });
$("#save").addEventListener("click", () => { saved = JSON.parse(JSON.stringify(state)); dirty(); toast("Permissions saved"); });
$("#discard").addEventListener("click", () => { state = JSON.parse(JSON.stringify(saved)); all(); toast("Changes discarded"); });
$("#resetBtn").addEventListener("click", () => { state = defaults(); all(); toast("Reset to defaults. Save to keep it."); });

// Hero letters
(function () { const h = $("#kinetic"), ws = h.textContent.split(" "); let n = 0; h.textContent = "";
  ws.forEach((w, i) => { const s = document.createElement("span"); s.className = "w"; [...w].forEach((c) => { const k = document.createElement("span"); k.className = "ch" + (i >= 1 ? " hl" : ""); k.textContent = c; k.style.animationDelay = 0.2 + n++ * 0.045 + "s"; s.append(k); }); h.append(s, " "); }); })();

// Cursor
(function () { if (!matchMedia("(pointer:fine)").matches) return; const d = $("#cDot"), r = $("#cRing"); let x = 0, y = 0, rx = 0, ry = 0;
  addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; document.body.classList.add("cursor-on"); d.style.transform = `translate(${x}px,${y}px)`; document.body.classList.toggle("cursor-hover", !!e.target.closest("button,a,input")); });
  document.addEventListener("mouseleave", () => document.body.classList.remove("cursor-on"));
  (function f() { rx += (x - rx) * 0.16; ry += (y - ry) * 0.16; r.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(f); })(); })();

all();
