const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

const USERS_FILE = path.join(__dirname, "data", "users.json"); // data/users.json

app.use(express.json());
app.use(express.static("public"));

// Kullanıcı çekme (ID ile)
app.get("/api/user/:id", (req, res) => {
  const userId = req.params.id;
  // users.json bir array ise:
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

  // Rakip bul (kendisi hariç)
  let rivals = users.filter(u => u.id !== userId);
  if (rivals.length === 0) return res.status(400).json({ error: "Hiç rakip yok!" });
  let opponent = rivals[Math.floor(Math.random() * rivals.length)];

  // Savaş mantığı
  let userScore = user.power + Math.random() * 20 + user.level;
  let oppScore = opponent.power + Math.random() * 20 + opponent.level;
  let userWins = userScore >= oppScore;
  let xpGain = userWins ? 50 : 15;
  let coinGain = userWins ? 30 : 10;
  user.xp += xpGain;
  user.coins = (user.coins || 0) + coinGain;

  // Güncelleme ve kaydetme
  users = users.map(u => (u.id === userId ? user : u));
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  res.json({
    result: userWins ? "Kazandın!" : "Kaybettin!",
    xp: xpGain,
    coins: coinGain,
    opponent: { name: opponent.name }
  });
});
//arena
app.post("/api/arena", (req, res) => {
  const { userId } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  let user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı!" });

  // Takıma random bir kullanıcı ekle (kendisi hariç)
  let available = users.filter(u => u.id !== userId);
  if (available.length < 3) return res.status(400).json({ error: "Yeterli oyuncu yok!" });

  // Takım: user + random bir oyuncu
  let teammate = available[Math.floor(Math.random() * available.length)];
  let rest = available.filter(u => u.id !== teammate.id);

  // Rakip takım: random iki kişi
  let rival1 = rest[Math.floor(Math.random() * rest.length)];
  let rival2 = rest.filter(u => u.id !== rival1.id)[0];

  // Savaş mantığı: toplam güç + random
  let teamScore = user.power + teammate.power + Math.random() * 30;
  let rivalScore = rival1.power + rival2.power + Math.random() * 30;
  let win = teamScore >= rivalScore;
  let xpGain = win ? 80 : 30;
  let coinGain = win ? 50 : 15;

  user.xp += xpGain;
  user.coins = (user.coins || 0) + coinGain;

  // users dizisini güncelle
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

// Sunucu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`KAISSAVA WebApp çalışıyor! Port: ${PORT}`);
});
