const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

const USERS_FILE = path.join(__dirname, "data", "users.json");
const MARKET_FILE = path.join(__dirname, "data", "market.json");
const BAZAAR_FILE = path.join(__dirname, "data", "bazaar.json");
const TASKS_FILE = path.join(__dirname, "data", "tasks.json");

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

// REFERANS SİSTEMİ: Arkadaş daveti ile kayıt
app.post('/api/register-ref', (req, res) => {
  const { newUserId, newName, referrerId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  if (users.find(u => u.id === newUserId)) {
    return res.status(400).json({ error: "Bu kullanıcı zaten var!" });
  }
  // Yeni kullanıcıyı ekle
  users.push({
    id: newUserId,
    name: newName,
    xp: 0,
    power: 50,
    level: 1,
    coins: 50,
    inventory: [],
    equipped: { weapon: null, armor: null, gloves: null }, // <---- DİKKAT!
    referrals: 0,
    chestBoost: 0,
    chest: {},
    tasks: {}
  });
  // Referans edenin boostu +1
  let refUser = users.find(u => u.id === referrerId);
  if (refUser) {
    refUser.referrals = (refUser.referrals || 0) + 1;
    refUser.chestBoost = (refUser.chestBoost || 0) + 5;
  }
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  res.json({ message: "Kayıt başarılı, referans bonusu uygulandı!" });
});

// PvP endpoint
app.post("/api/pvp", (req, res) => {
  const { userId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let market = JSON.parse(fs.readFileSync(MARKET_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);

  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  // Güç hesaplaması: takılı ekipmanlar
  let totalPower = user.power;
  if (user.equipped) {
    Object.values(user.equipped).forEach(eqId => {
      let eqItem = market.find(i => i.id === eqId);
      if (eqItem) totalPower += eqItem.power;
    });
  }

  let rivals = users.filter(u => u.id !== userId);
  if (rivals.length === 0) return res.status(400).json({ error: "Hiç rakip yok!" });
  let opponent = rivals[Math.floor(Math.random() * rivals.length)];

  // Rakip güç hesaplaması
  let oppPower = opponent.power;
  if (opponent.equipped) {
    Object.values(opponent.equipped).forEach(eqId => {
      let eqItem = market.find(i => i.id === eqId);
      if (eqItem) oppPower += eqItem.power;
    });
  }

  let userScore = totalPower + Math.random() * 20 + user.level;
  let oppScore = oppPower + Math.random() * 20 + opponent.level;
  let userWins = userScore >= oppScore;
  let xpGain = userWins ? 50 : 15;
  let coinGain = userWins ? 30 : 10;
  user.xp += xpGain;
  user.coins = (user.coins || 0) + coinGain;

  // Görev ilerlemesi: PvP kazanma
  user.tasks = user.tasks || {};
  if (userWins) {
    user.tasks["win_pvp"] = user.tasks["win_pvp"] || { progress: 0, completed: false, claimed: false };
    if (!user.tasks["win_pvp"].completed) {
      user.tasks["win_pvp"].progress += 1;
      if (user.tasks["win_pvp"].progress >= 3) user.tasks["win_pvp"].completed = true;
    }
  }

  // Görev ilerlemesi: coin toplama
  user.tasks["collect_coins"] = user.tasks["collect_coins"] || { progress: 0, completed: false, claimed: false };
  if (!user.tasks["collect_coins"].completed) {
    user.tasks["collect_coins"].progress += coinGain;
    let tasksList = JSON.parse(fs.readFileSync(TASKS_FILE, "utf-8"));
    let tsk = tasksList.find(t => t.id === "collect_coins");
    if (user.tasks["collect_coins"].progress >= tsk.target) user.tasks["collect_coins"].completed = true;
  }

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

// --- EKİPMAN KUŞAN / ÇIKAR ENDPOINTLERİ ---
app.post('/api/equip', (req, res) => {
  const { userId, itemId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let market = JSON.parse(fs.readFileSync(MARKET_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  user.inventory = user.inventory || [];
  let item = market.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: "Eşya bulunamadı!" });
  if (!user.inventory.includes(itemId)) return res.status(400).json({ error: "Eşya envanterinde yok!" });

  user.equipped = user.equipped || {};
  if (user.equipped[item.type]) {
    user.inventory.push(user.equipped[item.type]);
  }
  user.inventory = user.inventory.filter(i => i !== itemId);
  user.equipped[item.type] = itemId;

  users = users.map(u => u.id === userId ? user : u);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  res.json({ message: `${item.name} kuşanıldı!` });
});

app.post('/api/unequip', (req, res) => {
  const { userId, type } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let market = JSON.parse(fs.readFileSync(MARKET_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  user.equipped = user.equipped || {};
  if (!user.equipped[type]) return res.status(400).json({ error: "Bu türde ekipman takılı değil!" });

  user.inventory = user.inventory || [];
  user.inventory.push(user.equipped[type]);
  user.equipped[type] = null;

  users = users.map(u => u.id === userId ? user : u);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  res.json({ message: "Ekipman çıkarıldı!" });
});

// --- PAZAR (BAZAAR) MODÜLÜ (kısa)
app.get('/api/bazaar', (req, res) => {
  let items = [];
  if (fs.existsSync(BAZAAR_FILE)) {
    items = JSON.parse(fs.readFileSync(BAZAAR_FILE, "utf-8"));
  }
  res.json(items);
});
app.post('/api/bazaar', (req, res) => {
  const { userId, itemId, price } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });
  user.inventory = user.inventory || [];
  if (!user.inventory.includes(itemId)) return res.status(400).json({ error: "Eşya envanterinde yok!" });

  user.inventory = user.inventory.filter(i => i !== itemId);

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

  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  fs.writeFileSync(BAZAAR_FILE, JSON.stringify(bazaar, null, 2), "utf-8");

  res.json({ message: "Eşya pazara eklendi!" });
});
app.post('/api/buy-bazaar', (req, res) => {
  const { userId, bazaarId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let buyer = users.find(u => u.id === userId);
  if (!buyer) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  let bazaar = JSON.parse(fs.readFileSync(BAZAAR_FILE, "utf-8"));
  let offer = bazaar.find(b => b.id === bazaarId);
  if (!offer) return res.status(404).json({ error: "Pazar teklifi bulunamadı!" });
  if (offer.sellerId === userId) return res.status(400).json({ error: "Kendi ürününü satın alamazsın!" });

  let seller = users.find(u => u.id === offer.sellerId);
  if (!seller) return res.status(400).json({ error: "Satıcı bulunamadı!" });

  if ((buyer.coins || 0) < offer.price) return res.status(400).json({ error: "Yetersiz coin!" });

  buyer.coins -= offer.price;
  seller.coins = (seller.coins || 0) + offer.price;
  buyer.inventory = buyer.inventory || [];
  buyer.inventory.push(offer.itemId);

  bazaar = bazaar.filter(b => b.id !== bazaarId);

  users = users.map(u => {
    if (u.id === buyer.id) return buyer;
    if (u.id === seller.id) return seller;
    return u;
  });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  fs.writeFileSync(BAZAAR_FILE, JSON.stringify(bazaar, null, 2), "utf-8");

  res.json({ message: "Satın alma başarılı!" });
});

// --- HAZİNE SANDIĞI (Referans boost entegre) ---
app.get('/api/chest-status/:userId', (req, res) => {
  const { userId } = req.params;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  const now = Date.now();
  const lastClaim = user.chest?.lastClaim || 0;
  const boostExpire = user.chest?.boostExpire || 0;
  const boosted = boostExpire > now;
  let baseCoin = boosted ? COIN_PER_DAY_BOOST : COIN_PER_DAY;
  let boostRate = (user.chestBoost || 0) / 100;
  let maxCoin = baseCoin * (1 + boostRate);

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
    boostLeft,
    maxCoin
  });
});
app.post('/api/chest-claim', (req, res) => {
  const { userId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  const now = Date.now();
  const lastClaim = user.chest?.lastClaim || 0;
  const boostExpire = user.chest?.boostExpire || 0;
  const boosted = boostExpire > now;
  let baseCoin = boosted ? COIN_PER_DAY_BOOST : COIN_PER_DAY;
  let boostRate = (user.chestBoost || 0) / 100;
  let maxCoin = baseCoin * (1 + boostRate);

  let earned = Math.floor((now - lastClaim) / MS_PER_DAY * maxCoin);
  if (earned > maxCoin) earned = maxCoin;

  user.coins = (user.coins || 0) + earned;
  user.chest = { lastClaim: now, boostExpire: boostExpire };

  user.tasks = user.tasks || {};
  user.tasks["collect_coins"] = user.tasks["collect_coins"] || { progress: 0, completed: false, claimed: false };
  if (!user.tasks["collect_coins"].completed) {
    user.tasks["collect_coins"].progress += earned;
    let tasksList = JSON.parse(fs.readFileSync(TASKS_FILE, "utf-8"));
    let tsk = tasksList.find(t => t.id === "collect_coins");
    if (user.tasks["collect_coins"].progress >= tsk.target) user.tasks["collect_coins"].completed = true;
  }

  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  res.json({
    coin: earned,
    totalCoins: user.coins
  });
});
app.post('/api/chest-boost', (req, res) => {
  const { userId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  const now = Date.now();
  user.chest = user.chest || {};
  user.chest.boostExpire = now + MS_PER_30_DAYS;

  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  res.json({ message: "Boost aktif! 30 gün boyunca sandık hızlı dolacak." });
});

// Liderlik tablosu (XP'ye göre)
app.get('/api/leaderboard', (req, res) => {
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  users.sort((a, b) => b.xp - a.xp);
  res.json(users.slice(0, 20));
});

// GÖREVLER MODÜLÜ
app.get('/api/tasks/:userId', (req, res) => {
  const { userId } = req.params;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  let tasks = JSON.parse(fs.readFileSync(TASKS_FILE, "utf-8"));
  user.tasks = user.tasks || {};

  tasks.forEach(task => {
    if (!user.tasks[task.id]) {
      user.tasks[task.id] = { progress: 0, completed: false, claimed: false };
    }
  });

  res.json({ tasks, progress: user.tasks });
});
app.post('/api/tasks/claim', (req, res) => {
  const { userId, taskId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  let tasks = JSON.parse(fs.readFileSync(TASKS_FILE, "utf-8"));
  user.tasks = user.tasks || {};

  let task = tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: "Görev bulunamadı!" });

  if (!user.tasks[taskId] || !user.tasks[taskId].completed || user.tasks[taskId].claimed) {
    return res.status(400).json({ error: "Görev tamamlanmamış veya ödül alınmış!" });
  }

  if (task.rewardType === "coin") user.coins += task.reward;
  if (task.rewardType === "xp") user.xp += task.reward;
  user.tasks[taskId].claimed = true;

  users = users.map(u => u.id === userId ? user : u);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  res.json({ message: "Ödül alındı!", coin: user.coins, xp: user.xp });
});

// Günlük ödül kontrolü
app.get("/api/daily/:userId", (req, res) => {
  const { userId } = req.params;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  const now = Date.now();
  const last = user.dailyReward || 0;
  let canClaim = now - last > MS_PER_DAY;

  res.json({
    canClaim,
    timeLeft: canClaim ? 0 : (MS_PER_DAY - (now - last))
  });
});

// Günlük ödül toplama
app.post("/api/daily", (req, res) => {
  const { userId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  const now = Date.now();
  const last = user.dailyReward || 0;
  if (now - last < MS_PER_DAY) {
    return res.status(400).json({ error: "Daha önce ödül toplandı! Bekle." });
  }
  // ÖDÜL: 25 coin + 15 xp
  user.coins = (user.coins || 0) + 25;
  user.xp = (user.xp || 0) + 15;
  user.dailyReward = now;

  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  res.json({ message: "Günlük ödülünü aldın! 25 coin + 15 xp kazandın." });
});


// Sunucu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`KAISSAVA WebApp çalışıyor! Port: ${PORT}`);
});
