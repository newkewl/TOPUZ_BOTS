/* ---------------- Telegram WebApp init ---------------- */
const tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) { tg.ready(); tg.expand(); }

/* ---------------- data ---------------- */
const GAMES = [
  { id: "pubg", name: "PUBG MOBILE", badge: "Global", emoji: "🎯", g: ["#2B3A8F", "#5B6CFF"] },
  { id: "ff", name: "FREE FIRE", badge: "SNG", emoji: "🔥", g: ["#FF7A45", "#FFC24B"] },
  { id: "mlbb", name: "MOBILE LEGENDS", badge: "Global", emoji: "⚔️", g: ["#6C4CF7", "#B15CF7"], needsServer: true },
  { id: "sf2", name: "STANDOFF 2", badge: "Texnik ish", emoji: "🛡️", g: ["#3A4258", "#5C6584"], disabled: true },
  { id: "stars", name: "TG STARS", badge: "Avto", emoji: "⭐", g: ["#3FE4D6", "#5B6CFF"] },
  { id: "prem", name: "TG PREMIUM", badge: "Avto", emoji: "👑", g: ["#FFC24B", "#FF8A45"] },
  { id: "gifts", name: "TG GIFTS", badge: "Gifts", emoji: "🎁", g: ["#FF6FA5", "#FFC24B"] },
  { id: "brawl", name: "BRAWL STARS", badge: "Avto", emoji: "💎", g: ["#F7508C", "#6C4CF7"] },
  { id: "cod", name: "COD MOBILE", badge: "Global", emoji: "🎮", g: ["#20263F", "#4A5578"] },
];

const PACKS = {
  pubg: [["60 UC", 14500], ["325 UC", 68000], ["660 UC", 132000], ["1800 UC", 349000]],
  ff: [["100 Olmos", 16000], ["310 Olmos", 47000], ["520 Olmos", 78000], ["1080 Olmos", 152000]],
  mlbb: [
    ["55 Olmos", 10400, true], ["165 Olmos", 31000, true], ["275 Olmos", 49800, true], ["565 Olmos", 102200, true],
    ["86 Olmos", 16400], ["172 Olmos", 32400], ["257 Olmos", 46900], ["706 Olmos", 126000], ["Haftalik pass", 20200],
  ],
  stars: [["50 Stars", 19000], ["100 Stars", 36000], ["250 Stars", 87000], ["500 Stars", 168000]],
  prem: [["1 oylik", 89000], ["3 oylik", 239000], ["6 oylik", 429000], ["12 oylik", 749000]],
  gifts: [["Kichik sovg'a", 25000], ["O'rta sovg'a", 65000], ["Katta sovg'a", 150000], ["VIP sovg'a", 320000]],
  brawl: [["30 Gems", 17000], ["80 Gems", 41000], ["170 Gems", 79000], ["360 Gems", 158000]],
  cod: [["80 CP", 15000], ["420 CP", 72000], ["880 CP", 140000], ["2400 CP", 360000]],
};

const REGIONS = ["UZB / Global", "UZB / PH", "RU", "TR", "ID", "SG", "MY"];
const BADGE_COLORS = {
  "Global": ["#5B6CFF", "#232B55"], "SNG": ["#FFC24B", "#3A2E17"], "Avto": ["#3FE4D6", "#123A38"],
  "Gifts": ["#FF6FA5", "#3A1B2A"], "Texnik ish": ["#FF6B6B", "#3A1A1A"],
};

const fmt = (n) => Math.round(n).toLocaleString("ru-RU").replace(/,/g, " ");

/* ---------------- state ---------------- */
const state = {
  balance: 900,
  history: [],
  savedIds: JSON.parse(localStorage.getItem("topup_saved_ids") || "[]"),
  currentGame: null,
};

/* ---------------- boot / loading ---------------- */
window.addEventListener("DOMContentLoaded", () => {
  const user = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
  if (user) {
    document.getElementById("userName").textContent = (user.first_name || "Foydalanuvchi").toUpperCase();
    document.getElementById("userHandle").textContent = user.username ? "@" + user.username : "";
    document.getElementById("avatar").textContent = (user.first_name || "U")[0].toUpperCase();
  }

  const bar = document.getElementById("progressBar");
  let pct = 6;
  const iv = setInterval(() => {
    pct = Math.min(pct + Math.random() * 18, 100);
    bar.style.width = pct + "%";
  }, 180);

  setTimeout(() => {
    clearInterval(iv);
    document.getElementById("loading").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    renderGames();
    renderBalance();
  }, 1600);

  bindEvents();
});

/* ---------------- render helpers ---------------- */
function renderBalance() {
  document.getElementById("balanceValue").textContent = fmt(state.balance);
}

function badgeHTML(text) {
  const [fg, bg] = BADGE_COLORS[text] || ["#8891B0", "#1A2138"];
  return `<span class="badge" style="color:${fg};background:${bg}">${text}</span>`;
}

function renderGames() {
  const grid = document.getElementById("sub-games");
  grid.innerHTML = GAMES.map((g) => `
    <button class="game-card ${g.disabled ? "disabled" : ""}" data-game="${g.id}">
      <div class="game-icon" style="background:linear-gradient(135deg,${g.g[0]},${g.g[1]})">${g.emoji}</div>
      <div class="game-badge">${badgeHTML(g.badge)}</div>
      <div class="game-name">${g.name}</div>
    </button>
  `).join("");
  grid.querySelectorAll(".game-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("disabled")) return;
      openGameSheet(btn.dataset.game);
    });
  });
}

function renderHistory() {
  const list = document.getElementById("historyList");
  if (state.history.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🕘</div>
      <div class="empty-title">Hali tarix yo'q</div>
      <div class="empty-desc">To'lov yoki xarid qilganingizda shu yerda ko'rinadi</div></div>`;
    return;
  }
  list.innerHTML = state.history.map((h) => `
    <div class="history-item">
      <div><div class="history-label">${h.label}</div><div class="history-time">${h.time}</div></div>
      <div class="history-amt ${h.positive ? "pos" : "neg"}">${h.amt}</div>
    </div>
  `).join("");
}

/* ---------------- sheets ---------------- */
function openSheet(id) {
  document.getElementById("overlay").classList.remove("hidden");
  document.getElementById(id).classList.remove("hidden");
}
function closeSheets() {
  document.getElementById("overlay").classList.add("hidden");
  document.querySelectorAll(".sheet").forEach((s) => s.classList.add("hidden"));
}
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add("hidden"), 2200);
}

/* ---- top up ---- */
function initTopUpSheet() {
  let selected = 25000;
  const buttons = document.querySelectorAll("#sheet-topup .preset-btn");
  const customInput = document.getElementById("customAmt");
  const setActive = (val) => {
    selected = val;
    buttons.forEach((b) => b.classList.toggle("active", Number(b.dataset.amt) === val));
  };
  buttons.forEach((b) => b.addEventListener("click", () => { customInput.value = ""; setActive(Number(b.dataset.amt)); }));
  customInput.addEventListener("input", () => { if (customInput.value) { selected = Number(customInput.value); buttons.forEach((b) => b.classList.remove("active")); } });
  setActive(25000);

  document.getElementById("confirmTopup").addEventListener("click", () => {
    const amt = customInput.value ? Number(customInput.value) : selected;
    if (!amt || amt <= 0) return;
    state.balance += amt;
    state.history.unshift({ label: "Hisob to'ldirildi", amt: `+${fmt(amt)} so'm`, positive: true, time: "hozir" });
    renderBalance(); renderHistory(); closeSheets();
    toast(`${fmt(amt)} so'm hisobga qo'shildi`);
    if (tg) tg.HapticFeedback && tg.HapticFeedback.notificationOccurred("success");
  });
}

/* ---- promo ---- */
function initPromoSheet() {
  const input = document.getElementById("promoInput");
  const err = document.getElementById("promoErr");
  document.getElementById("confirmPromo").addEventListener("click", () => {
    const code = input.value.trim().toUpperCase();
    if (!code) return;
    if (code === "WELCOME10") {
      state.balance += 10000;
      state.history.unshift({ label: "Bonus kod faollashtirildi", amt: "+10 000 so'm", positive: true, time: "hozir" });
      renderBalance(); renderHistory(); closeSheets();
      toast("Bonus muvaffaqiyatli qo'shildi!");
      input.value = ""; err.classList.add("hidden");
    } else {
      err.textContent = "Kod noto'g'ri yoki muddati tugagan.";
      err.classList.remove("hidden");
    }
  });
}

/* ---- game sheet ---- */
function openGameSheet(gameId) {
  const game = GAMES.find((g) => g.id === gameId);
  state.currentGame = game;
  const packs = PACKS[gameId] || PACKS.stars;
  let idx = 0, region = 0, verified = !game.needsServer;

  document.getElementById("gameSheetTitle").textContent = game.name;
  const body = document.getElementById("gameSheetBody");
  const mySaved = state.savedIds.filter((s) => s.gameId === gameId);

  body.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,${game.g[0]},${game.g[1]});display:flex;align-items:center;justify-content:center;font-size:24px">${game.emoji}</div>
      <div><div style="font-weight:700;font-size:15px">${game.name}</div>${badgeHTML(game.badge)}</div>
    </div>
    ${mySaved.length ? `<div class="field-label" style="margin-bottom:7px">Saqlangan ID'lar</div>
      <div class="saved-ids">${mySaved.map((s, i) => `<button class="saved-chip" data-idx="${i}">${s.pid}${s.server ? ` (${s.server})` : ""}</button>`).join("")}</div>` : ""}
    <div class="field"><div class="field-label">O'yinchi ID</div><input id="pidInput" type="text" placeholder="O'yinchi ID kiriting" /></div>
    ${game.needsServer ? `
      <div class="field-label">Server ID</div>
      <div class="verify-row" style="margin-bottom:6px">
        <input id="serverInput" type="text" placeholder="Server ID kiriting" style="flex:1" />
        <button id="verifyBtn" class="verify-btn" disabled>Tekshirish</button>
      </div>
      <div class="field-label" style="margin:14px 0 8px">Region</div>
      <div class="region-row">${REGIONS.map((r, i) => `<button class="region-btn ${i === 0 ? "active" : ""}" data-r="${i}">${r}</button>`).join("")}</div>
    ` : ""}
    <div class="field-label" style="margin-bottom:8px">Mahsulotni tanlang</div>
    <div class="pack-grid">${packs.map((p, i) => `
      <button class="pack-btn ${i === 0 ? "active" : ""}" data-i="${i}">
        ${p[2] ? '<span class="pack-hit">HIT</span>' : ""}
        <div class="pack-name">${p[0]}</div><div class="pack-price">${fmt(p[1])} so'm</div>
      </button>`).join("")}</div>
    <div id="gameErr" class="error hidden"></div>
    <button id="buyBtn" class="primary-btn" disabled>${fmt(packs[0][1])} so'm — sotib olish</button>
  `;

  const pidInput = document.getElementById("pidInput");
  const serverInput = document.getElementById("serverInput");
  const verifyBtn = document.getElementById("verifyBtn");
  const buyBtn = document.getElementById("buyBtn");
  const gameErr = document.getElementById("gameErr");

  function idOk() {
    return game.needsServer
      ? pidInput.value.trim().length >= 3 && serverInput && serverInput.value.trim().length >= 3
      : pidInput.value.trim().length >= 4;
  }
  function refreshBuy() {
    const price = packs[idx][1];
    buyBtn.textContent = `${fmt(price)} so'm — sotib olish`;
    const canBuy = idOk() && state.balance >= price && verified;
    buyBtn.disabled = !canBuy;
    gameErr.classList.add("hidden");
    if (idOk() && state.balance < price) { gameErr.textContent = "Balansda mablag' yetarli emas — avval hisobni to'ldiring"; gameErr.classList.remove("hidden"); }
    else if (game.needsServer && idOk() && !verified) { gameErr.textContent = "Davom etishdan oldin ID'ni tekshiring"; gameErr.classList.remove("hidden"); }
  }

  pidInput.addEventListener("input", () => { verified = !game.needsServer; if (verifyBtn) verifyBtn.disabled = !idOk(); refreshBuy(); });
  if (serverInput) {
    serverInput.addEventListener("input", () => { verified = false; verifyBtn.disabled = !idOk(); refreshBuy(); });
    verifyBtn.addEventListener("click", () => {
      if (!idOk()) return;
      verifyBtn.textContent = "Tekshirilmoqda…"; verifyBtn.disabled = true;
      setTimeout(() => { verified = true; verifyBtn.textContent = "✓ OK"; verifyBtn.classList.add("done"); refreshBuy(); }, 900);
    });
    document.querySelectorAll(".region-btn").forEach((b) => b.addEventListener("click", () => {
      document.querySelectorAll(".region-btn").forEach((x) => x.classList.remove("active"));
      b.classList.add("active"); region = Number(b.dataset.r);
    }));
  }

  document.querySelectorAll(".pack-btn").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".pack-btn").forEach((x) => x.classList.remove("active"));
    b.classList.add("active"); idx = Number(b.dataset.i); refreshBuy();
  }));

  document.querySelectorAll(".saved-chip").forEach((chip) => chip.addEventListener("click", () => {
    const s = mySaved[Number(chip.dataset.idx)];
    pidInput.value = s.pid;
    if (serverInput) { serverInput.value = s.server || ""; verified = false; verifyBtn.disabled = !idOk(); }
    refreshBuy();
  }));

  buyBtn.addEventListener("click", () => {
    const pack = packs[idx];
    const pid = pidInput.value.trim();
    const server = serverInput ? serverInput.value.trim() : "";
    state.balance -= pack[1];
    state.history.unshift({ label: `${game.name} — ${pack[0]}`, amt: `-${fmt(pack[1])} so'm`, positive: false, time: "hozir" });
    if (!state.savedIds.some((s) => s.gameId === gameId && s.pid === pid)) {
      state.savedIds.unshift({ gameId, pid, server });
      state.savedIds = state.savedIds.slice(0, 10);
      localStorage.setItem("topup_saved_ids", JSON.stringify(state.savedIds));
    }
    renderBalance(); renderHistory(); closeSheets();
    document.getElementById("successTitle").textContent = `${pack[0]} yuborildi`;
    document.getElementById("successDesc").innerHTML = `${game.name} · ID: ${pid}<br>${fmt(pack[1])} so'm hisobdan yechildi`;
    openSheet("sheet-success");
    if (tg) tg.HapticFeedback && tg.HapticFeedback.notificationOccurred("success");
  });

  refreshBuy();
  openSheet("sheet-game");
}

/* ---------------- nav & tabs ---------------- */
function bindEvents() {
  document.querySelectorAll("[data-open]").forEach((btn) =>
    btn.addEventListener("click", () => openSheet(btn.dataset.open)));

  document.getElementById("overlay").addEventListener("click", closeSheets);
  document.querySelectorAll("[data-close]").forEach((btn) => btn.addEventListener("click", closeSheets));

  document.querySelectorAll(".seg-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      document.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const sub = btn.dataset.sub;
      document.getElementById("sub-games").classList.toggle("hidden", sub !== "games");
      document.getElementById("sub-promo").classList.toggle("hidden", sub !== "promo");
    }));

  document.querySelectorAll(".nav-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
      document.getElementById("tab-" + btn.dataset.tab).classList.remove("hidden");
      if (btn.dataset.tab === "history") renderHistory();
    }));

  document.getElementById("toggleNotif").addEventListener("click", (e) => e.currentTarget.classList.toggle("on"));
  document.getElementById("toggleSound").addEventListener("click", (e) => e.currentTarget.classList.toggle("on"));

  initTopUpSheet();
  initPromoSheet();
}
