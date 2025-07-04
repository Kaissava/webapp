const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

const USERS_FILE = path.join(__dirname, "data", "users.json");
const MARKET_FILE = path.join(__dirname, "data", "market.json");
const BAZAAR_FILE = path.join(__dirname, "data", "bazaar.json");
const TASKS_FILE = path.join(__dirname, "data", "tasks.json");

// Sabitler
const COIN_PER_DAY = 50;
const COIN_PER_DAY_BOOST = 100;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_30_DAYS = 30 * MS_PER_DAY;

// Express ayarları
app.use(express.json());
app.use(express.static("public"));

// Otomatik kullanıcı ekleme fonksiyonu
function autoRegister(users, userId) {
  let user = users.find(u => u.id === userId);
  if (!user) {
    user = {
      id: userId,
      name: "Oyuncu" + userId,
      xp: 0,
      power: 10,
      level: 1,
      coins: 50,
      referrals: 0,
      chestBoost: 0,
      inventory: [],
      equipped: {},
      dailyReward: 0,
      tasks: [],
      chest: {},
    };
    users.push(user);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  }
  return user;
}

// Kullanıcı çekme (ID ile)
app.get("/api/user/:id", (req, res) => {
  const userId = req.params.id;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = autoRegister(users, userId);
  res.json(user);
});

// PvP endpoint
app.post("/api/pvp", (req, res) => {
  const { userId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = autoRegister(users, userId);

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
  let user = autoRegister(users, userId);

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

// Market
app.get("/api/market", (req, res) => {
  let items = JSON.parse(fs.readFileSync(MARKET_FILE, "utf-8"));
  res.json(items);
});

app.post("/api/buy", (req, res) => {
  const { userId, itemId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = autoRegister(users, userId);

  let items = JSON.parse(fs.readFileSync(MARKET_FILE, "utf-8"));
  let item = items.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: "Ürün bulunamadı!" });
  if (user.coins < item.price) return res.status(400).json({ error: "Yetersiz coin!" });

  user.inventory = user.inventory || [];
  user.inventory.push(itemId);
  user.coins -= item.price;

  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  res.json({ message: `${item.name} satın alındı!`, coins: user.coins });
});

// --- HAZİNE SANDIĞI (CHEST) ---
// Sandık durumu
app.get('/api/chest-status/:userId', (req, res) => {
  const { userId } = req.params;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = autoRegister(users, userId);

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
// Sandık topla
app.post('/api/chest-claim', (req, res) => {
  const { userId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = autoRegister(users, userId);

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
// Boost satın al (30 gün)
app.post('/api/chest-boost', (req, res) => {
  const { userId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = autoRegister(users, userId);

  const now = Date.now();
  user.chest = user.chest || {};
  user.chest.boostExpire = now + MS_PER_30_DAYS;

  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  res.json({ message: "Boost aktif! 30 gün boyunca sandık hızlı dolacak." });
});

// Günlük ödül kontrol
app.get("/api/daily/:userId", (req, res) => {
  const { userId } = req.params;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = autoRegister(users, userId);

  const now = Date.now();
  const last = typeof user.dailyReward === "number" ? user.dailyReward : 0;
  let canClaim = (now - last) >= MS_PER_DAY || last === 0;
  let timeLeft = canClaim ? 0 : (MS_PER_DAY - (now - last));

  res.json({ canClaim, timeLeft });
});
app.post("/api/daily", (req, res) => {
  const { userId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = autoRegister(users, userId);

  const now = Date.now();
  const last = typeof user.dailyReward === "number" ? user.dailyReward : 0;
  if ((now - last) < MS_PER_DAY && last !== 0) {
    return res.status(400).json({ error: "Daha önce ödül toplandı! Yarın tekrar dene." });
  }
  user.coins = (user.coins || 0) + 25;
  user.xp = (user.xp || 0) + 15;
  user.dailyReward = now;

  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  res.json({ message: "Günlük ödülünü aldın! 25 coin + 15 xp kazandın." });
});

// Görevler
app.get("/api/tasks", (req, res) => {
  const userId = req.query.userId;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = autoRegister(users, userId);

  let allTasks = JSON.parse(fs.readFileSync(TASKS_FILE, "utf-8"));
  let completed = user.tasks || [];
  let result = allTasks.map(task => ({
    ...task,
    completed: completed.includes(task.id),
    claimed: completed.includes(task.id + "_claimed")
  }));
  res.json(result);
});
app.post("/api/claim", (req, res) => {
  const { userId, taskId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = autoRegister(users, userId);

  let allTasks = JSON.parse(fs.readFileSync(TASKS_FILE, "utf-8"));
  let task = allTasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: "Görev bulunamadı!" });

  user.tasks = user.tasks || [];
  if (!user.tasks.includes(task.id)) user.tasks.push(task.id);
  if (user.tasks.includes(task.id + "_claimed")) return res.status(400).json({ error: "Ödül zaten alındı!" });
  user.tasks.push(task.id + "_claimed");

  user.coins = (user.coins || 0) + (task.rewardCoins || 0);
  user.xp = (user.xp || 0) + (task.rewardXP || 0);

  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  res.json({ message: "Görev ödülü alındı!" });
});

// Liderlik/Lig Tablosu
app.get("/api/leaderboard", (req, res) => {
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let top = users.sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 20);
  res.json(top);
});

// Referans sistemi (basit)
app.get("/api/referral/:id", (req, res) => {
  // Basit: referans linki ve kaç referans sayısı
  const userId = req.params.id;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = autoRegister(users, userId);
  res.json({ id: user.id, referrals: user.referrals || 0 });
});

// --- PAZAR (Bazaar) ---
// Satışa ekle
app.post("/api/bazaar", (req, res) => {
  const { userId, itemId, price } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = autoRegister(users, userId);

  user.inventory = user.inventory || [];
  if (!user.inventory.includes(itemId)) return res.status(400).json({ error: "Eşyaya sahip değilsin!" });

  let items = JSON.parse(fs.readFileSync(MARKET_FILE, "utf-8"));
  let item = items.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: "Ürün bulunamadı!" });

  // Pazara ekle
  let bazaar = [];
  if (fs.existsSync(BAZAAR_FILE)) bazaar = JSON.parse(fs.readFileSync(BAZAAR_FILE, "utf-8"));
  let bazaarId = Date.now().toString() + Math.floor(Math.random() * 10000);
  bazaar.push({ id: bazaarId, itemId, price, sellerId: userId, sellerName: user.name, name: item.name });

  // Envanterden çıkar
  user.inventory = user.inventory.filter(i => i !== itemId);

  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(BAZAAR_FILE, JSON.stringify(bazaar, null, 2), "utf-8");
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  res.json({ message: `${item.name} pazara eklendi!` });
});
// Pazardaki ürünler
app.get("/api/bazaar", (req, res) => {
  let bazaar = [];
  if (fs.existsSync(BAZAAR_FILE)) bazaar = JSON.parse(fs.readFileSync(BAZAAR_FILE, "utf-8"));
  res.json(bazaar);
});
// Pazardan satın al
app.post("/api/buy_bazaar", (req, res) => {
  const { userId, itemId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = autoRegister(users, userId);

  let bazaar = [];
  if (fs.existsSync(BAZAAR_FILE)) bazaar = JSON.parse(fs.readFileSync(BAZAAR_FILE, "utf-8"));
  let offer = bazaar.find(x => x.id === itemId);
  if (!offer) return res.status(404).json({ error: "Ürün bulunamadı!" });
  if (user.coins < offer.price) return res.status(400).json({ error: "Yetersiz coin!" });

  // Envantere ekle
  user.inventory = user.inventory || [];
  user.inventory.push(offer.itemId);
  user.coins -= offer.price;

  // Pazardan sil
  bazaar = bazaar.filter(x => x.id !== itemId);

  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(BAZAAR_FILE, JSON.stringify(bazaar, null, 2), "utf-8");
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  res.json({ message: "Satın alındı ve envantere eklendi." });
});

// Ekipman giydir
app.post("/api/equip", (req, res) => {
  const { userId, itemId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  let items = JSON.parse(fs.readFileSync(MARKET_FILE, "utf-8"));
  let item = items.find(i => i.id === itemId);
  if (!user || !item) return res.status(404).json({ error: "Kullanıcı veya eşya bulunamadı!" });
  let slot = item.slot || "other";
  user.equipped = user.equipped || {};
  user.inventory = user.inventory || [];
  // O slottaki eski eşyayı envantere iade et
  if (user.equipped[slot]) {
    user.inventory.push(user.equipped[slot]);
  }
  user.equipped[slot] = itemId;
  // Envanterden sil
  user.inventory = user.inventory.filter(i => i !== itemId);
  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  res.json({ message: "Giyildi!" });
});
// Ekipman çıkar
app.post("/api/unequip", (req, res) => {
  const { userId, slot } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });
  user.equipped = user.equipped || {};
  user.inventory = user.inventory || [];
  if (user.equipped[slot]) {
    user.inventory.push(user.equipped[slot]);
    user.equipped[slot] = null;
  }
  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  res.json({ message: "Çıkarıldı!" });
});

// Sunucu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`KAISSAVA WebApp çalışıyor! Port: ${PORT}`);
});
