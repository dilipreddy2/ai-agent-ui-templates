// Orbit – Agent Execution Timeline (plain JavaScript, no libraries)
const $ = (s) => document.querySelector(s);
const steps = [
  { n: "Receive request", t: "system", s: 0, d: 0.4, sum: "Ticket #2048 arrives from the help desk.", i: "Ticket text (212 words)", o: "Task created", tk: 0 },
  { n: "Read the ticket", t: "model", s: 0.4, d: 1.1, sum: "The agent reads the message and finds what the customer needs.", i: "Ticket text", o: "Topic: refund, mood: upset", tk: 840 },
  { n: "Search help articles", t: "tool", s: 1.5, d: 1.6, sum: "Looks through the knowledge base for the refund policy.", i: "Query: refund policy", o: "3 articles found", tk: 0 },
  { n: "Look up the customer", t: "tool", s: 3.1, d: 1.4, sum: "Checks the order history in the CRM.", i: "Customer ID 7731", o: "Order #8841, paid twice", tk: 0, note: "Retried once after a slow response" },
  { n: "Write the reply", t: "model", s: 4.5, d: 3.4, sum: "Drafts a friendly reply that offers a refund.", i: "Policy + order details", o: "Draft reply (96 words)", tk: 4120 },
  { n: "Safety check", t: "model", s: 7.9, d: 0.8, sum: "Checks the draft for risky promises or private data.", i: "Draft reply", o: "Passed, no issues", tk: 1460 },
  { n: "Wait for approval", t: "human", s: 8.7, d: 2.6, sum: "A person reviews the $240 refund before it is sent.", i: "Draft + refund request", o: "Approved by BROO", tk: 0 },
  { n: "Send the reply", t: "system", s: 11.3, d: 0.6, sum: "Email is sent and the ticket is marked solved.", i: "Approved reply", o: "Email delivered", tk: 0 },
];
const total = +(steps.at(-1).s + steps.at(-1).d).toFixed(1);
const names = { model: "AI model", tool: "Tool call", human: "Human", system: "System" };
const colors = { model: "var(--model)", tool: "var(--tool)", human: "var(--human)", system: "var(--system)" };
const tokens = steps.reduce((a, s) => a + s.tk, 0);

$("#sum").innerHTML = [["Status", "Completed"], ["Total time", total + "s"], ["Steps", steps.length], ["Tokens used", tokens.toLocaleString()]].map((x) => `<div class="card"><span>${x[0]}</span><b>${x[1]}</b></div>`).join("");

// Waterfall (built once, then painted)
const ticks = Array.from({ length: 7 }, (_, i) => Math.round((total / 6) * i) + "s");
$("#wf").innerHTML = `<div class="ph" id="ph"></div>` + steps.map((st, i) => `<div class="wfrow"><span class="lbl">${st.n}</span><div class="track"><div class="bar t-${st.t}" data-i="${i}" style="left:${(st.s / total) * 100}%;width:${(st.d / total) * 100}%"><i></i></div></div></div>`).join("") +
  `<div class="axis"><span></span><div>${ticks.map((t) => `<span>${t}</span>`).join("")}</div></div>`;

// Vertical timeline (built once)
$("#tl").innerHTML = steps.map((st, i) => `<li class="step pending" data-i="${i}"><span class="dot">${i + 1}</span>
  <div class="body"><div class="top"><b>${st.n}</b><span class="tag ${st.t}" style="--c:${colors[st.t]}">${names[st.t]}</span><span class="time"></span></div><p>${st.sum}</p>
  <div class="more"><div><div class="io"><div><small>Input</small>${st.i}</div><div><small>Output</small>${st.o}</div></div>${st.note ? `<p class="note">${st.note}</p>` : ""}${st.tk ? `<p>Tokens used: ${st.tk.toLocaleString()}</p>` : ""}</div></div></div></li>`).join("");

const els = [...document.querySelectorAll(".step")], bars = [...document.querySelectorAll(".bar i")];
let t = 0, playing = false, last = 0, speed = 2;

function paint() {
  steps.forEach((st, i) => {
    const state = t >= st.s + st.d ? "done" : t >= st.s ? "running" : "pending";
    els[i].className = "step " + state + (els[i].classList.contains("open") ? " open" : "");
    els[i].querySelector(".dot").textContent = state === "done" ? "✓" : i + 1;
    els[i].querySelector(".time").textContent = state === "done" ? st.d + "s" : state === "running" ? "Running..." : "Waiting";
    bars[i].style.width = Math.max(0, Math.min((t - st.s) / st.d, 1)) * 100 + "%";
  });
  $("#wf").style.setProperty("--p", t / total); $("#clock").textContent = t.toFixed(1) + "s / " + total + "s";
  $("#scrub").value = (t / total) * 1000;
}
function frame(now) {
  if (!playing) return;
  t = Math.min(total, t + ((now - last) / 1000) * speed); last = now; paint();
  if (t >= total) { playing = false; $("#play").textContent = "Replay"; return; }
  requestAnimationFrame(frame);
}
function play() {
  if (t >= total) t = 0; playing = true; last = performance.now(); $("#play").textContent = "Pause"; requestAnimationFrame(frame);
}
$("#play").addEventListener("click", () => { if (playing) { playing = false; $("#play").textContent = "Play"; } else play(); });
$("#replayTop").addEventListener("click", () => { t = 0; play(); toast("Replaying the run"); });
$("#speed").addEventListener("change", (e) => (speed = +e.target.value));
$("#scrub").addEventListener("input", (e) => { playing = false; $("#play").textContent = "Play"; t = (e.target.value / 1000) * total; paint(); });
$("#tl").addEventListener("click", (e) => { const li = e.target.closest(".step"); if (li) li.classList.toggle("open"); });
document.querySelectorAll(".bar").forEach((b) => b.addEventListener("click", () => { const li = els[b.dataset.i]; li.classList.toggle("open"); li.scrollIntoView({ behavior: "smooth", block: "center" }); }));

function toast(m) { const e = $("#toast"); e.textContent = m; e.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("show"), 2000); }

// Hero letters
(function () { const h = $("#kinetic"), ws = h.textContent.split(" "); let n = 0; h.textContent = "";
  ws.forEach((w, i) => { const s = document.createElement("span"); s.className = "w"; [...w].forEach((c) => { const k = document.createElement("span"); k.className = "ch" + (i >= 1 ? " hl" : ""); k.textContent = c; k.style.animationDelay = 0.2 + n++ * 0.045 + "s"; s.append(k); }); h.append(s, " "); }); })();

// Cursor
(function () { if (!matchMedia("(pointer:fine)").matches) return; const d = $("#cDot"), r = $("#cRing"); let x = 0, y = 0, rx = 0, ry = 0;
  addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; document.body.classList.add("cursor-on"); d.style.transform = `translate(${x}px,${y}px)`; document.body.classList.toggle("cursor-hover", !!e.target.closest("button,a,select,.step,.bar,input")); });
  document.addEventListener("mouseleave", () => document.body.classList.remove("cursor-on"));
  (function f() { rx += (x - rx) * 0.16; ry += (y - ry) * 0.16; r.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(f); })(); })();

paint(); setTimeout(play, 900);
