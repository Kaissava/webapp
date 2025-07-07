// Arenalar
const arenas = [
  "stonearena.png",
  "airarena.png",
  "junglearena.png",
  "coldarena.png",
  "lavaarena.png"
];
const selectedArena = arenas[Math.floor(Math.random() * arenas.length)];
document.getElementById("arena-background").src = `assets/arenas/${selectedArena}`;

// Oyuncu verileri
let players = [
  { id: 1, name: "Oyuncu 1", hp: 100, elementId: "bar1" },
  { id: 2, name: "Oyuncu 2", hp: 100, elementId: "bar2" },
  { id: 3, name: "Rakip 1", hp: 100, elementId: "bar3" },
  { id: 4, name: "Rakip 2", hp: 100, elementId: "bar4" }
];

let turn = 0;

function updateHealthBars() {
  players.forEach(p => {
    const el = document.getElementById(p.elementId);
    el.style.width = p.hp + "%";
    el.innerText = p.hp;
  });
}

function showDamage(text) {
  const dmg = document.getElementById("damage-text");
  dmg.innerText = text;
  dmg.style.opacity = 1;
  setTimeout(() => dmg.style.opacity = 0, 1000);
}

function showWinner(winnerTeam) {
  document.getElementById("winner-text").innerText = `${winnerTeam} Kazandı!`;
  document.getElementById("reward-text").innerText = "XP +100 | Coin +50";
}

function startFight() {
  const fightInterval = setInterval(() => {
    const attacker = players[turn % 4];
    const target = attacker.id <= 2
      ? players.find(p => p.id >= 3 && p.hp > 0)
      : players.find(p => p.id <= 2 && p.hp > 0);

    if (!target) {
      clearInterval(fightInterval);
      const winnerTeam = players.some(p => p.id <= 2 && p.hp > 0) ? "Oyuncular" : "Rakip Takım";
      showWinner(winnerTeam);
      return;
    }

    const damage = Math.floor(Math.random() * 20) + 5;
    target.hp = Math.max(0, target.hp - damage);
    showDamage(`${attacker.name}, ${target.name}’a ${damage} vurdu`);
    updateHealthBars();
    turn++;

  }, 1500);
}

// Başlat
updateHealthBars();
startFight();
