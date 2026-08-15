import { Bot, InlineKeyboard } from 'grammy';

export function startBot() {
  const token = process.env.BOT_TOKEN;
  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  if (!token) {
    console.warn('BOT_TOKEN не задан, бот не запущен');
    return;
  }

  const bot = new Bot(token);

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
      'Budget App помогает планировать доход на месяц.\n\n' +
        'Команды:\n' +
        '/start \u2014 открыть приложение\n' +
        '/expense \u2014 добавить расход\n' +
        '/plan \u2014 планирование\n' +
        '/goals \u2014 цели\n' +
        '/help \u2014 справка',
      { reply_markup: new InlineKeyboard().webApp('Открыть Budget App', appUrl) },
    );
  });

  bot.command('expense', async (ctx) => {
    const keyboard = new InlineKeyboard().webApp('Добавить расход', `${appUrl}?startapp=expense`);
    await ctx.reply('Открываю форму расхода:', { reply_markup: keyboard });
  });

  bot.command('plan', async (ctx) => {
    const keyboard = new InlineKeyboard().webApp('Планирование', `${appUrl}?startapp=plan`);
    await ctx.reply('Открываю планирование:', { reply_markup: keyboard });
  });

  bot.command('goals', async (ctx) => {
    const keyboard = new InlineKeyboard().webApp('Мои цели', `${appUrl}?startapp=goals`);
    await ctx.reply('Открываю цели:', { reply_markup: keyboard });
  });

  bot.catch((err) => {
    console.error('Ошибка бота:', err.error);
  });

  bot.start();
  console.log('Бот запущен (long polling)');
}
