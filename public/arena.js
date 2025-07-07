// Arena görselleri
const arenas = [
  "stonearena.png",
  "airarena.png",
  "junglearena.png",
  "coldarena.png",
  "lavaarena.png"
];

// Rastgele bir arena seç
const selectedArena = arenas[Math.floor(Math.random() * arenas.length)];
document.getElementById("arena-background").src = `assets/arenas/${selectedArena}`;

// Başlangıç HP
let player1HP = 100;
let player2HP = 100;

// Oyuncu adları (ileride dinamik alınabilir)
const player1Name = "Player 1";
const player2Name = "Player 2";

// HTML öğeleri
const bar1 = document.getElementById("bar1");
const bar2 = document.getElementById("bar2");
const name1 = document.getElementById("name1");
const name2 = document.getElementById("name2");
const damageText = document.getElementById("damage-text");
const char1 = document.getElementById("char1");
const char2 = document.getElementById("char2");
const winnerText = document.getElementById("winner-text");
const rewardText = document.getElementById("reward-text");

// Adları göster
name1.innerText = player1Name;
name2.innerText = player2Name;

// Can barlarını güncelle
function updateHealthBars() {
  bar1.style.width = player1HP + "%";
  bar2.style.width = player2HP + "%";
  bar1.innerText = player1HP;
  bar2.innerText = player2HP;
}

// Hasar metnini göster
function showDamage(text) {
  damageText.innerText = text;
  damageText.style.opacity = 1;
  setTimeout(() => {
    damageText.style.opacity = 0;
  }, 1000);
}

// Kazananı göster
function showWinner(winner, xp = 30, coins = 50) {
  winnerText.innerText = `${winner} Kazandı!`;
  rewardText.innerText = `Kazanç: +${xp} XP | +${coins} Coin`;
}

// Karakter saldırı efekti (ileri-geri zıplama)
function attackAnimation(attackerId) {
  const attacker = attackerId === 1 ? char1 : char2;
  attacker.classList.add("attack");
  setTimeout(() => {
    attacker.classList.remove("attack");
  }, 400);
}

// Savaşı başlat
function startFight() {
  const interval = setInterval(() => {
    if (player1HP <= 0 || player2HP <= 0) {
      clearInterval(interval);
      const winner = player1HP <= 0 ? player2Name : player1Name;
      showWinner(winner);
      return;
    }

    const attacker = Math.random() < 0.5 ? 1 : 2;
    const damage = Math.floor(Math.random() * 15) + 5;

    if (attacker === 1) {
      player2HP = Math.max(0, player2HP - damage);
      showDamage(`${player1Name} ${damage} vurdu!`);
    } else {
      player1HP = Math.max(0, player1HP - damage);
      showDamage(`${player2Name} ${damage} vurdu!`);
    }

    attackAnimation(attacker);
    updateHealthBars();
  }, 1500);
}

// Başlat
updateHealthBars();
startFight();
