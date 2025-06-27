const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

function getLeagueName(level) {
  if (level >= 10) return "Şampiyonlar Ligi";
  if (level === 9) return "9. Lig";
  if (level === 8) return "8. Lig";
  if (level === 7) return "7. Lig";
  if (level === 6) return "6. Lig";
  if (level === 5) return "5. Lig";
  if (level === 4) return "4. Lig";
  if (level === 3) return "3. Lig";
  if (level === 2) return "2. Lig";
  return "1. Lig";
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/user/:id", (req, res) => {
  const userId = req.params.id;
  const users = JSON.parse(fs.readFileSync("users.json", "utf-8"));
  const user = users[userId];

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "Kullanıcı bulunamadı." });
  }
});

app.get("/api/market", (req, res) => {
  const items = [
    { id: "iron_sword", name: "🗡️ Iron Sword", price: 30 },
    { id: "steel_armor", name: "🦺 Steel Armor", price: 50 },
    { id: "magic_gloves", name: "🧤 Magic Gloves", price: 40 }
  ];
  res.json(items);
});

app.get("/api/tasks/:id", (req, res) => {
  const userId = req.params.id;
  const users = JSON.parse(fs.readFileSync("users.json", "utf-8"));
  const allTasks = JSON.parse(fs.readFileSync("tasks.json", "utf-8"));

  const user = users[userId];
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

  const response = user.tasks.map(taskId => {
    const taskDef = allTasks[taskId];
    if (!taskDef) return null;

    return {
      id: taskId,
      description: taskDef.description,
      reward: taskDef.reward,
      completed: user.completed_tasks.includes(taskId),
      claimed: (user.claimed_tasks && user.claimed_tasks.includes(taskId)) || false
    };
  }).filter(t => t !== null);

  res.json(response);
});

app.listen(PORT, () => {
  console.log(`KAISSAVA WebApp çalışıyor! Port: ${PORT}`);
});
