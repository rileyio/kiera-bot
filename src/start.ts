import 'dotenv/config'

// import * as modAlias from 'module-alias'

// Set Module Aliases
// modAlias.addAlias('@', process.env.NODE_ENV === 'development' ? __dirname + '/../src' : '../app')
// modAlias.addAlias('@', __dirname + '/../src')

// Bot Import MUST come after Alias setting
import { Bot } from './index.ts' // Stop From Sorting

// Start bot (may be moved elsewhere later)
const bot = new Bot()
bot.start()