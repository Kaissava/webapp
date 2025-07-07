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
document.getElementById("arena-background").src = `assets/arenas/${selectedArena}`;

// Oyuncu isimleri
document.getElementById("name1").innerText = "Player 1";
document.getElementById("name2").innerText = "Player 2";

// Oyuncu karakterleri (sınıfa göre değiştirilecekse burada kontrol yapılır)
document.getElementById("char1").src = "assets/characters/gladiator.png";
document.getElementById("char2").src = "assets/characters/assassin.png";

// Başlangıç can değerleri
let player1HP = 100;
let player2HP = 100;

function updateHealthBars() {
  document.getElementById("bar1").style.width = player1HP + "%";
  document.getElementById("bar1").innerText = player1HP;
  document.getElementById("bar2").style.width = player2HP + "%";
  document.getElementById("bar2").innerText = player2HP;
}

function showDamage(text) {
  const dmg = document.getElementById("damage-text");
  dmg.innerText = text;
  dmg.style.opacity = 1;
  setTimeout(() => {
    dmg.style.opacity = 0;
  }, 1200);
}

function showWinner(winner, xp = 20, coins = 15) {
  document.getElementById("winner-text").innerText = `${winner} Kazandı!`;
  document.getElementById("reward-text").innerText = `+${xp} XP, +${coins} Coin kazandın`;
}

function attackAnimation(attackerId) {
  const attacker = document.getElementById(attackerId);
  attacker.style.transform = "translateX(" + (attackerId === "char1" ? "+30px" : "-30px") + ")";
  setTimeout(() => {
    attacker.style.transform = "translateX(0)";
  }, 400);
}

function startFight() {
  const interval = setInterval(() => {
    if (player1HP <= 0 || player2HP <= 0) {
      clearInterval(interval);
      const winner = player1HP <= 0 ? "Player 2" : "Player 1";
      showWinner(winner);
      return;
    }

    const attacker = Math.random() < 0.5 ? 1 : 2;
    const damage = Math.floor(Math.random() * 15) + 5;

    if (attacker === 1) {
      player2HP = Math.max(0, player2HP - damage);
      attackAnimation("char1");
      showDamage(`Player 1 ${damage} hasar verdi`);
    } else {
      player1HP = Math.max(0, player1HP - damage);
      attackAnimation("char2");
      showDamage(`Player 2 ${damage} hasar verdi`);
    }

    updateHealthBars();
  }, 1600);
}

// Sayfa yüklendiğinde başlat
updateHealthBars();
startFight();
