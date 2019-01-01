const { Bot } = require('./app/index')

// Start bot (may be moved elsewhere later)
const bot = new Bot();
bot.start()
bot.startWebAPI()