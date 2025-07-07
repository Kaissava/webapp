const arenas = ["stonearena.png", "airarena.png", "junglearena.png", "coldarena.png", "lavaarena.png"];
document.getElementById("arena-background").src = `assets/arenas/${arenas[Math.floor(Math.random() * arenas.length)]}`;

const char1 = document.getElementById("char1");
const char2 = document.getElementById("char2");

const bar1 = document.getElementById("bar1");
const bar2 = document.getElementById("bar2");

const winnerText = document.getElementById("winner-text");
const rewardText = document.getElementById("reward-text");
const damageText = document.getElementById("damage-text");
const exitBtn = document.getElementById("exit-btn");

let player1HP = 100;
let player2HP = 100;

function updateHealthBars() {
  bar1.style.width = player1HP + "%";
  bar1.innerText = player1HP;
  bar2.style.width = player2HP + "%";
  bar2.innerText = player2HP;
}

function showDamage(text) {
  damageText.innerText = text;
  damageText.style.opacity = 1;
  setTimeout(() => {
    damageText.style.opacity = 0;
  }, 1000);
}

function showWinner(winner) {
  winnerText.innerText = `${winner} kazandı!`;
  winnerText.style.display = "block";
  rewardText.innerText = "+30 XP | +50 Coin";
  rewardText.style.display = "block";
  exitBtn.style.display = "block";
}

function fightLoop() {
  const interval = setInterval(() => {
    if (player1HP <= 0 || player2HP <= 0) {
      clearInterval(interval);
      showWinner(player1HP <= 0 ? "Player 2" : "Player 1");
      return;
    }

    const attacker = Math.random() < 0.5 ? 1 : 2;
    const damage = Math.floor(Math.random() * 15) + 5;

    if (attacker === 1) {
      player2HP = Math.max(0, player2HP - damage);
      char1.style.transform = "translateX(30px)";
      showDamage(`Player 1 ${damage} vurdu`);
      setTimeout(() => char1.style.transform = "", 400);
    } else {
      player1HP = Math.max(0, player1HP - damage);
      char2.style.transform = "translateX(-30px) scaleX(-1)";
      showDamage(`Player 2 ${damage} vurdu`);
      setTimeout(() => char2.style.transform = "scaleX(-1)", 400);
    }

    updateHealthBars();
  }, 1500);
}

function preFight() {
  damageText.innerText = "Rakip aranıyor...";
  damageText.style.opacity = 1;
  setTimeout(() => {
    damageText.innerText = "Rakip bulundu!";
    setTimeout(() => {
      damageText.innerText = "3...";
      setTimeout(() => {
        damageText.innerText = "2...";
        setTimeout(() => {
          damageText.innerText = "1...";
          setTimeout(() => {
            damageText.innerText = "FIGHT!";
            setTimeout(() => {
              damageText.style.opacity = 0;
              updateHealthBars();
              fightLoop();
            }, 800);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1500);
}

document.getElementById("exit-btn").onclick = () => window.location.href = "index.html";

preFight();
