require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { Telegraf, Markup } = require("telegraf");

const BOT_TOKEN = (process.env.BOT_TOKEN || "").trim();
const ADMIN_ID = (process.env.ADMIN_TELEGRAM_ID || "").trim();
const CARD_NUMBER = (process.env.PAYMENT_CARD_NUMBER || "").trim() || null;
const MINIAPP_URL = (process.env.MINIAPP_URL || "https://example.com").trim();
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN topilmadi.");
  process.exit(1);
}

const DB_PATH = path.join(__dirname, "db.json");
function readDB() {
  if (!fs.existsSync(DB_PATH)) return { users: {}, requests: {} };
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}
function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
function getUser(db, id) {
  if (!db.users[id]) db.users[id] = { id, balance: 0, coins: 0 };
  return db.users[id];
}

function verifyInitData(initData) {
  if (!initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");
  const dataCheckArr = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckArr).digest("hex");
  if (computedHash !== hash) return null;
  const userJson = params.get("user");
  return userJson ? JSON.parse(userJson) : null;
}

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply(
    "Xush kelibsiz! O'yin valyutalarini to'ldirish uchun quyidagi tugmani bosing:",
    Markup.inlineKeyboard([Markup.button.webApp("🎮 Do'konni ochish", MINIAPP_URL)])
  );
});

bot.command("confirm", (ctx) => {
  if (String(ctx.from.id) !== ADMIN_ID) return ctx.reply("Sizga ruxsat yo'q.");
  const requestId = ctx.message.text.split(" ")[1];
  if (!requestId) return ctx.reply("Foydalanish: /confirm <requestId>");
  const db = readDB();
  const reqData = db.requests[requestId];
  if (!reqData) return ctx.reply("So'rov topilmadi.");
  if (reqData.status === "confirmed") return ctx.reply("Bu so'rov allaqachon tasdiqlangan.");
  const user = getUser(db, reqData.userId);
  user.balance += reqData.amount;
  reqData.status = "confirmed";
  writeDB(db);
  ctx.reply(`✅ Tasdiqlandi. ${reqData.userId} balansiga ${reqData.amount} so'm qo'shildi.`);
  bot.telegram.sendMessage(reqData.userId, `✅ To'lovingiz tasdiqlandi! Balansingizga ${reqData.amount.toLocaleString("ru-RU")} so'm qo'shildi.`).catch(() => {});
});

bot.command("pending", (ctx) => {
  if (String(ctx.from.id) !== ADMIN_ID) return ctx.reply("Sizga ruxsat yo'q.");
  const db = readDB();
  const pending = Object.entries(db.requests).filter(([, r]) => r.status === "pending");
  if (!pending.length) return ctx.reply("Kutilayotgan so'rovlar yo'q.");
  const text = pending.map(([id, r]) => `#${id} — user ${r.userId} — ${r.amount.toLocaleString("ru-RU")} so'm`).join("\n");
  ctx.reply(text);
});

bot.launch();
console.log("Bot ishga tushdi.");

const app = express();
app.use(cors());
app.use(express.json());

function authMiddleware(req, res, next) {
  const initData = req.header("X-Telegram-Init-Data");
  const user = verifyInitData(initData);
  if (!user) return res.status(401).json({ error: "Tekshiruvdan o'tmadi" });
  req.tgUser = user;
  next();
}

app.get("/api/me", authMiddleware, (req, res) => {
  const db = readDB();
  const user = getUser(db, req.tgUser.id);
  writeDB(db);
  res.json(user);
});

app.post("/api/topup/init", authMiddleware, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 1000) return res.status(400).json({ error: "Noto'g'ri summa" });
  const db = readDB();
  const requestId = crypto.randomBytes(4).toString("hex");
  db.requests[requestId] = { userId: req.tgUser.id, amount, status: "draft", createdAt: Date.now() };
  writeDB(db);
  res.json({ requestId, cardNumber: CARD_NUMBER });
});

app.post("/api/topup/confirm-request", authMiddleware, async (req, res) => {
  const { requestId } = req.body;
  const db = readDB();
  const reqData = db.requests[requestId];
  if (!reqData || reqData.userId !== req.tgUser.id) return res.status(404).json({ error: "So'rov topilmadi" });
  reqData.status = "pending";
  writeDB(db);
  const name = [req.tgUser.first_name, req.tgUser.last_name].filter(Boolean).join(" ");
  await bot.telegram.sendMessage(
    ADMIN_ID,
    `🆕 Yangi to'lov so'rovi\nFoydalanuvchi: ${name} (@${req.tgUser.username || "—"})\nID: ${req.tgUser.id}\nSumma: ${reqData.amount.toLocaleString("ru-RU")} so'm\n\nTasdiqlash uchun: /confirm ${requestId}`
  ).catch(() => {});
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`API ${PORT}-portda ishlamoqda`));
