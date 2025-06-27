const express = require("express");
const fs = require("fs");
const app = express();

const USERS_FILE = "users.json";

app.use(express.json());
app.use(express.static("public"));

app.get("/api/user/:id", (req, res) => {
  const userId = req.params.id;
  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  const user = users[userId];

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "Kullanıcı bulunamadı." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`KAISSAVA WebApp çalışıyor! Port: ${PORT}`);
});
