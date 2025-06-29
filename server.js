const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

const USERS_FILE = path.join(__dirname, "data", "users.json"); // data/users.json
const MARKET_FILE = path.join(__dirname, "data", "market.json"); // data/market.json

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
  console.log("PVP POST BODY:", req.body);
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
// Marketteki eşyaların listesi
app.get("/api/market", (req, res) => {
  let items = JSON.parse(fs.readFileSync(MARKET_FILE, "utf-8"));
  res.json(items);
});

// Satın alma işlemi
app.post("/api/buy", (req, res) => {
  const { userId, itemId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  let items = JSON.parse(fs.readFileSync(MARKET_FILE, "utf-8"));
  let item = items.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: "Ürün bulunamadı!" });

  if (user.coins < item.price) return res.status(400).json({ error: "Yetersiz coin!" });

  // Envantere ekle
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
// Hazine Sandığı
app.post("/api/chest", (req, res) => {
  const { userId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  // Ödül tipini rastgele belirle: xp, coin, item
  const rewards = [
    { type: "xp", value: Math.floor(Math.random() * 50) + 30 },
    { type: "coin", value: Math.floor(Math.random() * 60) + 20 },
    { type: "item", value: null }
  ];
  const chosen = rewards[Math.floor(Math.random() * rewards.length)];

  let rewardMessage = "";
  let itemName = null;

  if (chosen.type === "xp") {
    user.xp += chosen.value;
    rewardMessage = `${chosen.value} XP`;
  } else if (chosen.type === "coin") {
    user.coins = (user.coins || 0) + chosen.value;
    rewardMessage = `${chosen.value} coin`;
  } else if (chosen.type === "item") {
    // Marketten rastgele bir eşya seç
    const items = JSON.parse(fs.readFileSync(MARKET_FILE, "utf-8"));
    const item = items[Math.floor(Math.random() * items.length)];
    user.inventory = user.inventory || [];
    user.inventory.push(item.id);
    itemName = item.name;
    rewardMessage = "Eşya";
  }

  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  res.json({
    reward: rewardMessage,
    item: itemName
  });
});

// Sunucu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`KAISSAVA WebApp çalışıyor! Port: ${PORT}`);
});
