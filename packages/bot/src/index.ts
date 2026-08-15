import 'dotenv/config';
import { Bot, InlineKeyboard } from 'grammy';

const token = process.env.BOT_TOKEN;
const appUrl = process.env.APP_URL || 'http://localhost:5173';

if (!token) {
  console.warn('BOT_TOKEN не задан — бот не запущен.');
  process.exit(0);
}

const bot = new Bot(token);

// Deep link: /start expense, /start goal, /start plan
bot.command('start', async (ctx) => {
  const param = ctx.match?.trim();
  const startUrl = param ? `${appUrl}?startapp=${param}` : appUrl;
  const keyboard = new InlineKeyboard().webApp('Открыть Budget App', startUrl);
  await ctx.reply(
    'Привет! Добро пожаловать в Budget App \uD83C\uDF42\n\n' +
      'Планируйте месячный бюджет, распределяйте доход по категориям и копите на мечту.',
    { reply_markup: keyboard },
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    'Budget App помогает планировать доход на месяц, вести расходы и копить на цели.\n\n' +
      'Команды:\n' +
      '/start — открыть приложение\n' +
      '/expense — добавить расход\n' +
      '/plan — планирование бюджета\n' +
      '/goals — мои цели\n' +
      '/help — эта справка\n\n' +
      'Как пользоваться:\n' +
      '1. В начале месяца создайте план\n' +
      '2. Распределите доход по категориям и целям\n' +
      '3. Добавляйте траты вручную\n' +
      '4. Следите за остатком и аналитикой',
    { reply_markup: new InlineKeyboard().webApp('Открыть Budget App', appUrl) },
  );
});

bot.command('expense', async (ctx) => {
  const keyboard = new InlineKeyboard().webApp('Добавить расход', `${appUrl}?startapp=expense`);
  await ctx.reply('Открываю форму расхода:', { reply_markup: keyboard });
});

bot.command('plan', async (ctx) => {
  const keyboard = new InlineKeyboard().webApp('Планирование', `${appUrl}?startapp=plan`);
  await ctx.reply('Открываю планирование бюджета:', { reply_markup: keyboard });
});

bot.command('goals', async (ctx) => {
  const keyboard = new InlineKeyboard().webApp('Мои цели', `${appUrl}?startapp=goals`);
  await ctx.reply('Открываю цели:', { reply_markup: keyboard });
});

bot.catch((err) => {
  console.error('Ошибка бота:', err.error);
});

bot.start();
console.log('Бот запущен (long polling).');
