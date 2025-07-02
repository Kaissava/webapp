const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

const USERS_FILE = path.join(__dirname, "data", "users.json");
const MARKET_FILE = path.join(__dirname, "data", "market.json");
const BAZAAR_FILE = path.join(__dirname, "data", "bazaar.json");

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

// MARKET MODÜLÜ
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

// --- PAZAR (BAZAAR) MODÜLÜ --- //
// Pazar listele
app.get('/api/bazaar', (req, res) => {
  let items = [];
  if (fs.existsSync(BAZAAR_FILE)) {
    items = JSON.parse(fs.readFileSync(BAZAAR_FILE, "utf-8"));
  }
  res.json(items);
});

// Eşya pazara koy
app.post('/api/bazaar', (req, res) => {
  const { userId, itemId, price } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });
  user.inventory = user.inventory || [];
  if (!user.inventory.includes(itemId)) return res.status(400).json({ error: "Eşya envanterinde yok!" });

  // Eşyayı envanterden çıkar
  user.inventory = user.inventory.filter(i => i !== itemId);

  // Pazara ekle
  let bazaar = [];
  if (fs.existsSync(BAZAAR_FILE)) {
    bazaar = JSON.parse(fs.readFileSync(BAZAAR_FILE, "utf-8"));
  }
  const newId = "b" + (bazaar.length + 1);
  bazaar.push({
    id: newId,
    sellerId: userId,
    itemId,
    price: Number(price)
  });

  // Güncelle
  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  fs.writeFileSync(BAZAAR_FILE, JSON.stringify(bazaar, null, 2), "utf-8");

  res.json({ message: "Eşya pazara eklendi!" });
});

// Pazardan satın al
app.post('/api/buy-bazaar', (req, res) => {
  const { userId, bazaarId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let buyer = users.find(u => u.id === userId);
  if (!buyer) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  let bazaar = JSON.parse(fs.readFileSync(BAZAAR_FILE, "utf-8"));
  let offer = bazaar.find(b => b.id === bazaarId);
  if (!offer) return res.status(404).json({ error: "Pazar teklifi bulunamadı!" });
  if (offer.sellerId === userId) return res.status(400).json({ error: "Kendi ürününü satın alamazsın!" });

  // Ürünü satanı bul ve para aktar
  let seller = users.find(u => u.id === offer.sellerId);
  if (!seller) return res.status(400).json({ error: "Satıcı bulunamadı!" });

  if ((buyer.coins || 0) < offer.price) return res.status(400).json({ error: "Yetersiz coin!" });

  // Alıcıdan coin çıkar, satıcıya coin ekle, eşyayı alıcıya ver
  buyer.coins -= offer.price;
  seller.coins = (seller.coins || 0) + offer.price;
  buyer.inventory = buyer.inventory || [];
  buyer.inventory.push(offer.itemId);

  // Pazardan sil
  bazaar = bazaar.filter(b => b.id !== bazaarId);

  // Dosyalara yaz
  users = users.map(u => {
    if (u.id === buyer.id) return buyer;
    if (u.id === seller.id) return seller;
    return u;
  });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  fs.writeFileSync(BAZAAR_FILE, JSON.stringify(bazaar, null, 2), "utf-8");

  res.json({ message: "Satın alma başarılı!" });
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

// Liderlik tablosu (en çok XP'ye sahip 20 oyuncu)
app.get('/api/leaderboard', (req, res) => {
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  users.sort((a, b) => b.xp - a.xp); // XP'ye göre sıralama
  res.json(users.slice(0, 20)); // En iyi 20 oyuncu
});


// Sunucu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`KAISSAVA WebApp çalışıyor! Port: ${PORT}`);
});
