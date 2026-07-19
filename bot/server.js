const { Telegraf } = require('telegraf');
require('dotenv').config();

// .env faylingizdan BOT_TOKEN ni oladi
const bot = new Telegraf(process.env.BOT_TOKEN);

// Web App manzili (.env ichidagi MINIAPP_URL yoki havola)
const WEB_APP_URL = process.env.MINIAPP_URL || 'https://spiffy-sunburst-80ea7b.netlify.app';

bot.start((ctx) => {
    ctx.reply('Assalomu alaykum! Top Up botimizga xush kelibsiz. Quyidagi tugma orqali do\'konni ochishingiz mumkin:', {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🛒 Do\'konni ochish', web_app: { url: WEB_APP_URL } }
                ]
            ]
        }
    });
});

// Mini App ichidan tg.sendData() orqali ma'lumot kelsa tutib olish
bot.on('web_app_data', (ctx) => {
    const data = ctx.webAppData.data();
    if (data === 'support_request') {
        ctx.reply('Siz yordam so\'rovi yubordingiz. Operatorlarimiz tez orada siz bilan bog\'lanishadi.');
    }
});

bot.launch().then(() => {
    console.log('Bot muvaffaqiyatli ishga tushdi!');
});

// Serverni xavfsiz to'xtatish
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
