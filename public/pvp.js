const arenas = [
  "stonearena.png",
  "airarena.png",
  "junglearena.png",
  "coldarena.png",
  "lavaarena.png"
];
const selectedArena = arenas[Math.floor(Math.random() * arenas.length)];
document.getElementById("arena-background").src = `assets/arenas/${selectedArena}`;

// Vuruş sırası simülasyonu
let player1HP = 100;
let player2HP = 100;

function updateBars() {
  document.getElementById("bar1").style.width = player1HP + "%";
  document.getElementById("bar2").style.width = player2HP + "%";
  document.getElementById("bar1").innerText = player1HP;
  document.getElementById("bar2").innerText = player2HP;
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
  document.getElementById("winner-text").innerText = `${winner} Kazandı!`;
  document.getElementById("back-btn").style.display = "block";
}

function startFight() {
  document.querySelector(".versus-text").style.display = "none";
  const interval = setInterval(() => {
    if (player1HP <= 0 || player2HP <= 0) {
      clearInterval(interval);
      showWinner(player1HP <= 0 ? "Player 2" : "Player 1");
      return;
    }

    const attacker = Math.random() < 0.5 ? 1 : 2;
    const damage = Math.floor(Math.random() * 20) + 5;

    if (attacker === 1) {
      player2HP = Math.max(0, player2HP - damage);
      showDamage(`Player 1 ${damage} vurdu`);
    } else {
      player1HP = Math.max(0, player1HP - damage);
      showDamage(`Player 2 ${damage} vurdu`);
    }

    updateBars();
  }, 1500);
}

setTimeout(startFight, 3000);
updateBars();
