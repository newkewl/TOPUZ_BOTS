// Telegram Web App obyektini ishga tushiramiz
const tg = window.Telegram.WebApp;

// Ilova tayyor bo'lganini Telegram'ga bildiramiz
tg.ready();
tg.expand(); // Oynani to'liq ekranga ochish

// Telegram'dan foydalanuvchi ma'lumotlarini olish
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    
    // Interfeysga foydalanuvchi ma'lumotlarini yozish
    document.getElementById('user-name').innerText = user.first_name || "Foydalanuvchi";
    document.getElementById('user-tag').innerText = user.username ? `@${user.username}` : '';
    
    if (user.first_name) {
        document.getElementById('user-avatar').innerText = user.first_name.charAt(0).toUpperCase();
    }
}

// Tugmalarga bosilish hodisasini (Click event) biriktirish
document.getElementById('btn-topup').addEventListener('click', () => {
    tg.showAlert("Hisobni to'ldirish bo'limi yaqinda ishga tushadi!");
});

document.getElementById('btn-bonus').addEventListener('click', () => {
    tg.showPopup({
        title: 'Bonus Kod',
        message: 'Hozircha faol bonus kodlar mavjud emas.',
        buttons: [{type: 'ok'}]
    });
});

document.getElementById('btn-support').addEventListener('click', () => {
    // Bot adminiga yo'naltirish yoki xabar yuborish
    tg.sendData("support_request"); 
    tg.close(); // Xabarni yuborib ilovani yopish
});

// O'yinlar tanlanganda ishlaydigan funksiya
function selectGame(gameName) {
    tg.showAlert(`${gameName.toUpperCase()} bo'limi tanlandi. Tez orada mahsulotlar ro'yxati qo'shiladi.`);
}
