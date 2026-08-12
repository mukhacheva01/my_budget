import 'dotenv/config';
import { Bot, InlineKeyboard } from 'grammy';

const token = process.env.BOT_TOKEN;
const appUrl = process.env.APP_URL || 'http://localhost:5173';

if (!token) {
  console.warn('BOT_TOKEN не задан — бот не запущен.');
  process.exit(0);
}

const bot = new Bot(token);

bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard().webApp('Открыть Мани.точку', appUrl);
  await ctx.reply(
    'Привет! Добро пожаловать в Мани.точку 🍂\n\n' +
      'Планируйте месячный бюджет, распределяйте доход по категориям и копите на мечту.',
    { reply_markup: keyboard },
  );
});

bot.catch((err) => {
  console.error('Ошибка бота:', err.error);
});

bot.start();
console.log('Бот запущен (long polling).');