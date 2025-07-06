const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
let userId = null;

if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
  userId = tg.initDataUnsafe.user.id.toString();
  localStorage.setItem("kaissava_userid", userId);
} else {
  userId = localStorage.getItem("kaissava_userid");
}

function startPVP() {
  document.querySelector(".pvp-btn").style.display = "none";
  document.getElementById("matchmaking").style.display = "block";
  document.getElementById("matchText").innerText = "Rakip bulunuyor...";

  fetch('/api/pvp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      document.getElementById("matchText").innerText = "Hata: " + data.error;
      return;
    }

    document.getElementById("matchText").innerText = `${data.opponent.name} ile eşleştin!`;
    document.getElementById("arenaLoading").innerText = "Arena yükleniyor...`;

    // PvP verisi
localStorage.setItem("kaissava_pvp_data", JSON.stringify(data));


    setTimeout(() => {
      window.location.href = "arena.html";
    }, 3000);
  });
}
