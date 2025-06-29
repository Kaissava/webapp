const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

const USERS_FILE = path.join(__dirname, "data", "users.json"); // data/users.json
const MARKET_FILE = path.join(__dirname, "data", "market.json"); // data/market.json

// Sandık ayarları
const COIN_PER_DAY = 50;
const COIN_PER_DAY_BOOST = 100;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_30_DAYS = 30 * MS_PER_DAY;

app.use(express.json());
app.use(express.static("public"));

// Kullanıcı çekme (ID ile)
app.get("/api/user/:id", (req, res) => {
  const userId = req.params.id;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "Kullanıcı bulunamadı." });
  }
});

// PvP endpoint
app.post("/api/pvp", (req, res) => {
  const { userId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  let rivals = users.filter(u => u.id !== userId);
  if (rivals.length === 0) return res.status(400).json({ error: "Hiç rakip yok!" });
  let opponent = rivals[Math.floor(Math.random() * rivals.length)];

  let userScore = user.power + Math.random() * 20 + user.level;
  let oppScore = opponent.power + Math.random() * 20 + opponent.level;
  let userWins = userScore >= oppScore;
  let xpGain = userWins ? 50 : 15;
  let coinGain = userWins ? 30 : 10;
  user.xp += xpGain;
  user.coins = (user.coins || 0) + coinGain;

  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  res.json({
    result: userWins ? "Kazandın!" : "Kaybettin!",
    xp: xpGain,
    coins: coinGain,
    opponent: { name: opponent.name }
  });
});

// Arena endpoint
app.post("/api/arena", (req, res) => {
  const { userId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  let available = users.filter(u => u.id !== userId);
  if (available.length < 3) return res.status(400).json({ error: "Yeterli oyuncu yok!" });

  let teammate = available[Math.floor(Math.random() * available.length)];
  let rest = available.filter(u => u.id !== teammate.id);

  let rival1 = rest[Math.floor(Math.random() * rest.length)];
  let rival2 = rest.filter(u => u.id !== rival1.id)[0];

  let teamScore = user.power + teammate.power + Math.random() * 30;
  let rivalScore = rival1.power + rival2.power + Math.random() * 30;
  let win = teamScore >= rivalScore;
  let xpGain = win ? 80 : 30;
  let coinGain = win ? 50 : 15;

  user.xp += xpGain;
  user.coins = (user.coins || 0) + coinGain;

  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  res.json({
    result: win ? "Kazandınız!" : "Kaybettiniz!",
    team: [user, teammate],
    rivals: [rival1, rival2],
    xp: xpGain,
    coins: coinGain
  });
});

// --- MARKET MODÜLÜ --- //
app.get("/api/market", (req, res) => {
  let items = JSON.parse(fs.readFileSync(MARKET_FILE, "utf-8"));
  res.json(items);
});

app.post("/api/buy", (req, res) => {
  const { userId, itemId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  let items = JSON.parse(fs.readFileSync(MARKET_FILE, "utf-8"));
  let item = items.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: "Ürün bulunamadı!" });

  if (user.coins < item.price) return res.status(400).json({ error: "Yetersiz coin!" });

  user.inventory = user.inventory || [];
  user.inventory.push(itemId);

  user.coins -= item.price;

  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  res.json({
    message: `${item.name} satın alındı!`,
    coins: user.coins
  });
});

// --- HAZİNE SANDIĞI (CHEST) MODÜLÜ --- //

// SANDIK DURUMU
app.get('/api/chest-status/:userId', (req, res) => {
  const { userId } = req.params;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  const now = Date.now();
  const lastClaim = user.chest?.lastClaim || 0;
  const boostExpire = user.chest?.boostExpire || 0;
  const boosted = boostExpire > now;
  const maxCoin = boosted ? COIN_PER_DAY_BOOST : COIN_PER_DAY;
  let earned = Math.floor((now - lastClaim) / MS_PER_DAY * maxCoin);
  if (earned > maxCoin) earned = maxCoin;

  let nextFull = lastClaim + MS_PER_DAY;
  let timeLeft = Math.max(0, nextFull - now);
  let boostLeft = Math.max(0, boostExpire - now);

  res.json({
    coin: earned,
    timeLeft,
    boosted,
    boostExpire,
    boostLeft
  });
});

// SANDIĞI TOPLA
app.post('/api/chest-claim', (req, res) => {
  const { userId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  const now = Date.now();
  const lastClaim = user.chest?.lastClaim || 0;
  const boostExpire = user.chest?.boostExpire || 0;
  const boosted = boostExpire > now;
  const maxCoin = boosted ? COIN_PER_DAY_BOOST : COIN_PER_DAY;

  let earned = Math.floor((now - lastClaim) / MS_PER_DAY * maxCoin);
  if (earned > maxCoin) earned = maxCoin;

  user.coins = (user.coins || 0) + earned;
  user.chest = { lastClaim: now, boostExpire: boostExpire };

  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  res.json({
    coin: earned,
    totalCoins: user.coins
  });
});

// BOOST SATIN AL (30 GÜN BOYUNCA AKTİF)
app.post('/api/chest-boost', (req, res) => {
  const { userId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  // Boost 30 gün boyunca aktif
  const now = Date.now();
  user.chest = user.chest || {};
  user.chest.boostExpire = now + MS_PER_30_DAYS;

  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  res.json({ message: "Boost aktif! 30 gün boyunca sandık hızlı dolacak." });
});

// Sunucu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`KAISSAVA WebApp çalışıyor! Port: ${PORT}`);
});
