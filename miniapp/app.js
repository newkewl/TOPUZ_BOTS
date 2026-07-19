// ====== SOZLAMALAR ======
const API_BASE = "https://YOUR-BACKEND-DOMAIN.com/api";

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor?.("secondary_bg_color");
}

const GAMES = [
  { id: "pubgm", name: "PUBG MOBILE", tag: "Global", img: "https://placehold.co/300x340/1c2340/ffffff?text=PUBG" },
  { id: "freefire", name: "FREE FIRE", tag: "SNG", img: "https://placehold.co/300x340/1c2340/ffffff?text=Free+Fire" },
  { id: "mlbb", name: "MOBILE LEGENDS", tag: "Global", img: "https://placehold.co/300x340/1c2340/ffffff?text=MLBB" },
  { id: "standoff2", name: "STAND OFF 2", tag: "Global", img: "https://placehold.co/300x340/1c2340/ffffff?text=Standoff+2" },
  { id: "tgstars", name: "TG STARS", tag: "Avto", img: "https://placehold.co/300x340/1c2340/ffc531?text=Stars" },
  { id: "tgpremium", name: "TG PREMIUM", tag: "Avto", img: "https://placehold.co/300x340/1c2340/ffc531?text=Premium" },
];

let state = {
  balance: 0,
  selectedAmount: null,
  requestId: null,
};

function initUser() {
  const u = tg?.initDataUnsafe?.user;
  if (u) {
    document.getElementById("userName").textContent = [u.first_name, u.last_name].filter(Boolean).join(" ") || "Foydalanuvchi";
    document.getElementById("userHandle").textContent = u.username ? "@" + u.username : "";
    if (u.photo_url) document.getElementById("userAvatar").src = u.photo_url;
  }
}

async function loadMe() {
  try {
    const res = await fetch(`${API_BASE}/me`, {
      headers: { "X-Telegram-Init-Data": tg?.initData || "" },
    });
    const data = await res.json();
    state.balance = data.balance || 0;
    document.getElementById("balanceValue").textContent = state.balance.toLocaleString("ru-RU");
    document.getElementById("coinCount").textContent = data.coins ?? 0;
  } catch (e) {
    console.warn("Balansni yuklab bo'lmadi:", e);
  }
}

function renderGames() {
  const grid = document.getElementById("gamesGrid");
  grid.innerHTML = GAMES.map(g => `
    <div class="game-card" data-id="${g.id}">
      <img src="${g.img}" alt="${g.name}">
      <span class="game-tag">${g.tag}</span>
      <span class="game-name">${g.name}</span>
    </div>
  `).join("");

  grid.querySelectorAll(".game-card").forEach(card => {
    card.addEventListener("click", () => {
      tg?.HapticFeedback?.impactOccurred?.("light");
      openTopup();
    });
  });
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const isGames = tab.dataset.tab === "games";
    document.getElementById("gamesGrid").classList.toggle("hidden", !isGames);
    document.getElementById("promoPanel").classList.toggle("active", !isGames);
  });
});

const overlay = document.getElementById("topupOverlay");
function openTopup() {
  goToStep(1);
  overlay.classList.add("active");
}
function closeTopup() {
  overlay.classList.remove("active");
}
function goToStep(n) {
  [1, 2, 3].forEach(i => {
    document.getElementById(`topupStep${i}`).classList.toggle("hidden", i !== n);
  });
}

document.getElementById("btnTopup").addEventListener("click", openTopup);
document.getElementById("topupClose").addEventListener("click", closeTopup);
document.getElementById("closeSheet").addEventListener("click", () => { closeTopup(); loadMe(); });
document.getElementById("backStep1").addEventListener("click", () => goToStep(1));

document.querySelectorAll(".quick-amt").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".quick-amt").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    document.getElementById("topupAmount").value = btn.dataset.amt;
  });
});

document.getElementById("topupNext").addEventListener("click", async () => {
  const amount = parseInt(document.getElementById("topupAmount").value, 10);
  if (!amount || amount < 1000) {
    tg?.showAlert?.("Iltimos, kamida 1000 so'm miqdorini kiriting");
    return;
  }
  state.selectedAmount = amount;
  document.getElementById("payAmountLabel").textContent = amount.toLocaleString("ru-RU") + " so'm";

  try {
    const res = await fetch(`${API_BASE}/topup/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Telegram-Init-Data": tg?.initData || "" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    const cardEl = document.getElementById("payCardNumber");
    const copyBtn = document.getElementById("copyCard");
    if (data.cardNumber) {
      cardEl.textContent = data.cardNumber;
      copyBtn.classList.remove("hidden");
    } else {
      cardEl.textContent = "Admin bilan bog'laning →";
      copyBtn.classList.add("hidden");
      cardEl.parentElement.style.cursor = "pointer";
      cardEl.parentElement.onclick = () => tg?.openTelegramLink?.("https://t.me/YOUR_SUPPORT_USERNAME");
    }
    state.requestId = data.requestId;
  } catch (e) {
    document.getElementById("payCardNumber").textContent = "Ulanishda xatolik, qayta urinib ko'ring";
  }

  goToStep(2);
});

document.getElementById("copyCard").addEventListener("click", () => {
  const text = document.getElementById("payCardNumber").textContent;
  navigator.clipboard?.writeText(text.replace(/\s/g, ""));
  tg?.HapticFeedback?.notificationOccurred?.("success");
});

document.getElementById("confirmPaid").addEventListener("click", async () => {
  try {
    await fetch(`${API_BASE}/topup/confirm-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Telegram-Init-Data": tg?.initData || "" },
      body: JSON.stringify({ requestId: state.requestId, amount: state.selectedAmount }),
    });
  } catch (e) {
    console.warn("So'rovni yuborib bo'lmadi", e);
  }
  goToStep(3);
});

document.getElementById("btnSupport").addEventListener("click", () => {
  tg?.openTelegramLink?.("https://t.me/YOUR_SUPPORT_USERNAME");
});

initUser();
renderGames();
loadMe();
