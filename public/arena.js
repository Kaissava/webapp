window.onload = async () => {
  document.getElementById("loading-screen").style.display = "flex";
  await new Promise(resolve => setTimeout(resolve, 1500));
  document.getElementById("loading-screen").style.display = "none";
  document.getElementById("arena-container").style.display = "block";

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

  let turn = 1;

  const interval = setInterval(() => {
    const damage = Math.floor(Math.random() * 15) + 5;
    damageText.style.opacity = 1;

    if (turn === 1) {
      hp2 -= damage;
      if (hp2 < 0) hp2 = 0;
      bar2.style.width = hp2 + "%";
      bar2.innerText = hp2;
      char1.style.transform = "translateX(40px)";
      setTimeout(() => {
        char1.style.transform = "translateX(0)";
      }, 300);
      damageText.innerText = `Player 1 ${damage} vurdu`;
    } else {
      hp1 -= damage;
      if (hp1 < 0) hp1 = 0;
      bar1.style.width = hp1 + "%";
      bar1.innerText = hp1;
      char2.style.transform = "translateX(-40px) scaleX(-1)";
      setTimeout(() => {
        char2.style.transform = "translateX(0) scaleX(-1)";
      }, 300);
      damageText.innerText = `Player 2 ${damage} vurdu`;
    }

    setTimeout(() => {
      damageText.style.opacity = 0;
    }, 800);

    if (hp1 <= 0 || hp2 <= 0) {
      clearInterval(interval);
      const winner = hp1 > hp2 ? "Player 1" : "Player 2";
      document.getElementById("winner-text").innerText = `${winner} kazandı!`;
      document.getElementById("reward-text").innerText = `Ödül: +10 XP +5 Coin`;
      document.getElementById("winner-text").style.display = "block";
      document.getElementById("reward-text").style.display = "block";
      document.getElementById("back-button").style.display = "block";
    }

    turn = turn === 1 ? 2 : 1;
  }, 1600);
}
