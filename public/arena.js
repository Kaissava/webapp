window.addEventListener("DOMContentLoaded", () => {
  const arenas = ["stonearena.png", "lavaarena.png", "junglearena.png", "coldarena.png", "airarena.png"];
  const randomArena = arenas[Math.floor(Math.random() * arenas.length)];
  const arenaBg = document.getElementById("arena-background");
  if (arenaBg) {
    arenaBg.src = `assets/arenas/${randomArena}`;
  }
});


window.onload = async () => {
  const loadingScreen = document.getElementById("loading-screen");
  const arenaContainer = document.getElementById("arena-container");
  loadingScreen.style.display = "flex";

  await new Promise(resolve => setTimeout(resolve, 1500));

  loadingScreen.style.display = "none";
  arenaContainer.style.display = "block";

  let count = 3;
  const countdown = document.getElementById("countdown");
  countdown.style.display = "block";

  const countdownInterval = setInterval(() => {
    countdown.innerText = count;
    count--;
    if (count < 0) {
      clearInterval(countdownInterval);
      countdown.innerText = "FIGHT!";
      setTimeout(() => {
        countdown.style.display = "none";
        startBattle();
      }, 1000);
    }
  }, 1000);
};

function startBattle() {
  let hp1 = 100;
  let hp2 = 100;
  const bar1 = document.getElementById("bar1");
  const bar2 = document.getElementById("bar2");
  const char1 = document.getElementById("char1");
  const char2 = document.getElementById("char2");
  const damageText = document.getElementById("damage-text");
  const winnerText = document.getElementById("winner-text");
  const rewardText = document.getElementById("reward-text");
  const backButton = document.getElementById("back-button");

  let turn = 1;

  const interval = setInterval(() => {
    const damage = Math.floor(Math.random() * 15) + 5;

    if (turn === 1) {
      hp2 = Math.max(0, hp2 - damage);
      bar2.style.width = hp2 + "%";
      bar2.innerText = hp2;
      char1.style.transform = "translateX(20px)";
      setTimeout(() => {
        char1.style.transform = "translateX(0)";
      }, 300);
      damageText.innerText = `Player 1 ${damage} vurdu`;
    } else {
      hp1 = Math.max(0, hp1 - damage);
      bar1.style.width = hp1 + "%";
      bar1.innerText = hp1;
      char2.style.transform = "translateX(-20px) scaleX(-1)";
      setTimeout(() => {
        char2.style.transform = "translateX(0) scaleX(-1)";
      }, 300);
      damageText.innerText = `Player 2 ${damage} vurdu`;
    }

    damageText.style.opacity = 1;
    setTimeout(() => {
      damageText.style.opacity = 0;
    }, 1000);

    if (hp1 <= 0 || hp2 <= 0) {
      clearInterval(interval);
      const winner = hp1 > hp2 ? "Player 1" : "Player 2";
      winnerText.innerText = `${winner} kazandı!`;
      rewardText.innerText = `Ödül: +10 XP +5 Coin`;
      winnerText.style.display = "block";
      rewardText.style.display = "block";
      backButton.style.display = "block";
    }

    turn = turn === 1 ? 2 : 1;
  }, 1300);
}
