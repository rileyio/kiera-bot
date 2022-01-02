// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

import * as modAlias from 'module-alias'

// Set Module Aliases
modAlias.addAlias('@', process.env.NODE_ENV === 'development' ? __dirname + '/../src' : '../app')

// Bot Import MUST come after Alias setting
import { Bot } from '@/index' // Stop From Sorting

// Start bot (may be moved elsewhere later)
const bot = new Bot()
bot.start()
