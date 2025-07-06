// PvP verisini localStorage’tan al
const pvpData = JSON.parse(localStorage.getItem("kaissava_pvp_data"));

// Oyuncu isimleri ve sınıfları
const playerName = pvpData.player.name;
const playerClass = pvpData.player.class;
const opponentName = pvpData.opponent.name;
const opponentClass = pvpData.opponent.class;

// Arena görselleri
const arenas = [
  "stonearena.png",
  "airarena.png",
  "junglearena.png",
  "coldarena.png",
  "lavaarena.png"
];

// Rasgele bir arena seç
const selectedArena = arenas[Math.floor(Math.random() * arenas.length)];
document.getElementById("arena-background").src = `/assets/arenas/${selectedArena}`;

// Karakter görsellerini yükle
document.getElementById("player1").src = `/assets/characters/${playerClass}.png`;
document.getElementById("player2").src = `/assets/characters/${opponentClass}.png`;

// İsimleri yaz
document.getElementById("name1").innerText = playerName;
document.getElementById("name2").innerText = opponentName;

// Başlangıç can değerleri
let player1HP = 100;
let player2HP = 100;

function updateHealthBars() {
  const bar1 = document.getElementById("bar1");
  const bar2 = document.getElementById("bar2");

  bar1.style.width = player1HP + "%";
  bar2.style.width = player2HP + "%";

  bar1.innerText = player1HP;
  bar2.innerText = player2HP;
}

function showDamage(text) {
  const dmg = document.getElementById("damage-text");
  dmg.innerText = text;
  dmg.style.opacity = 1;
  setTimeout(() => {
    dmg.style.opacity = 0;
  }, 1000);
}

function showWinner(winner) {
  const winnerText = document.getElementById("winner-text");
  winnerText.innerHTML = `
    <div class="fade-text">
      ${winner} Kazandı!<br>
      <span style="font-size: 20px;">+${pvpData.xp} XP | +${pvpData.coins} Coin</span>
      <br><br>
      <button class="back-btn" onclick="location.href='index.html'">Ana Menü</button>
    </div>
  `;
}

function startFight() {
  const interval = setInterval(() => {
    if (player1HP <= 0 || player2HP <= 0) {
      clearInterval(interval);
      showWinner(player1HP <= 0 ? opponentName : playerName);
      return;
    }

    const attacker = Math.random() < 0.5 ? 1 : 2;
    const damage = Math.floor(Math.random() * 20) + 5;

    if (attacker === 1) {
      player2HP = Math.max(0, player2HP - damage);
      showDamage(`${playerName} ${damage} vurdu`);
    } else {
      player1HP = Math.max(0, player1HP - damage);
      showDamage(`${opponentName} ${damage} vurdu`);
    }

    updateHealthBars();
  }, 1500);
}

updateHealthBars();
startFight();
