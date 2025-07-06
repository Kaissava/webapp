const arenas = [
  "stonearena.png",
  "airarena.png",
  "junglearena.png",
  "coldarena.png",
  "lavaarena.png"
];

const selectedArena = arenas[Math.floor(Math.random() * arenas.length)];
document.getElementById("arena-background").src = `assets/arenas/${selectedArena}`;

// Oyuncu bilgileri (ileride sunucudan alınacak)
let player1 = {
  name: "Player 1",
  hp: 100,
  maxHP: 100,
  class: "gladiator"
};
let player2 = {
  name: "Player 2",
  hp: 100,
  maxHP: 100,
  class: "assassin"
};

document.getElementById("name1").innerText = player1.name;
document.getElementById("name2").innerText = player2.name;
document.getElementById("char1").src = `assets/characters/${player1.class}.png`;
document.getElementById("char2").src = `assets/characters/${player2.class}.png`;

function updateHealthBars() {
  document.getElementById("bar1").style.width = (player1.hp / player1.maxHP) * 100 + "%";
  document.getElementById("bar2").style.width = (player2.hp / player2.maxHP) * 100 + "%";
}

function showDamage(text) {
  const dmg = document.getElementById("damage-text");
  dmg.innerText = text;
  dmg.style.opacity = 1;
  setTimeout(() => { dmg.style.opacity = 0; }, 1000);
}

function showWinner(winner, reward) {
  const winText = document.getElementById("winner-text");
  winText.innerText = `${winner} kazandı!\nXP: ${reward.xp} | Coin: ${reward.coins}`;
  winText.style.display = "block";
}

function startFight() {
  const char1 = document.getElementById("char1");
  const char2 = document.getElementById("char2");

  const interval = setInterval(() => {
    if (player1.hp <= 0 || player2.hp <= 0) {
      clearInterval(interval);
      const winner = player1.hp <= 0 ? player2.name : player1.name;
      showWinner(winner, { xp: 50, coins: 20 });
      return;
    }

    const attacker = Math.random() < 0.5 ? 1 : 2;
    const damage = Math.floor(Math.random() * 15) + 5;

    if (attacker === 1) {
      char1.style.transform = "translateX(50px)";
      player2.hp = Math.max(0, player2.hp - damage);
      showDamage(`${player1.name} ${damage} vurdu`);
      setTimeout(() => { char1.style.transform = "translateX(0px)"; }, 300);
    } else {
      char2.style.transform = "translateX(-50px) scaleX(-1)";
      player1.hp = Math.max(0, player1.hp - damage);
      showDamage(`${player2.name} ${damage} vurdu`);
      setTimeout(() => { char2.style.transform = "translateX(0px) scaleX(-1)"; }, 300);
    }

    updateHealthBars();
  }, 1500);
}

updateHealthBars();
startFight();
