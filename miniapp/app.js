// Telegram Web App API faollashtirish
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand(); // Ekranni to'liq yoyish

// Foydalanuvchi ma'lumotlarini olish
const user = tg.initDataUnsafe?.user;

if (user) {
    // Ism yoki usernameni htmlga chiqarish
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = user.username ? `@${user.username}` : `${user.first_name}`;
    }

    // Avatar bosh harfini o'zgartirish
    const avatarElement = document.getElementById('user-avatar');
    if (avatarElement) {
        const firstLetter = user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U';
        avatarElement.textContent = firstLetter;
    }
}

// "Hisobni to'ldirish" tugmasi bosilganda
const topupBtn = document.getElementById('topup-btn');
if (topupBtn) {
    topupBtn.addEventListener('click', () => {
        tg.showAlert("To'lov tizimi (Click/Payme) tez orada ishga tushadi!");
    });
}

// "Bonus kodlar" tugmasi bosilganda
const bonusBtn = document.getElementById('bonus-btn');
if (bonusBtn) {
    bonusBtn.addEventListener('click', () => {
        tg.showPopup({
            title: 'Bonus tizimi',
            message: 'Hozircha faol bonus kodlar mavjud emas.',
            buttons: [{ type: 'ok', text: 'Yopish' }]
        });
    });
}
