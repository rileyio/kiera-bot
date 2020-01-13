export const main = `
Commands will always begin with the \`{{prefix}}\` prefix.
To see more about a specific command's usage, type \`{{prefix}}help command\`
You can also begin entering a command like \`{{prefix}}poll\` and if its incomplete
examples will be presented.
`

export const mainRegister = `(Required for access to some commands)
\`{{prefix}}register\` - Registers the user with the bot
`

export const main8Ball = `\`{{prefix}}8ball\` - Ask a question, receive an answer`
export const mainBNet = `\`{{prefix}}bnet\`, \`{{prefix}}wow\` - BattleNet Commands`
export const mainCK = `\`{{prefix}}ck\` - ChastiKey Commands - \`username\` \`ticker\` \`stats\``
export const mainDecision = `\`{{prefix}}decision\` - Create, Edit or Roll - \`new\` \`roll\``
export const mainFlip = `\`{{prefix}}flip\` - Flip a coin`
export const mainPoll = `\`{{prefix}}poll\` - Create a poll to vote on`
export const mainRoll = `\`{{prefix}}roll\` - Dice roller`
export const mainStats = `\`{{prefix}}stats\` - Bot tracked statistics`

export const register = `
Registers (opt-in) the user to use the full suite of bot commands.
Using this means you agree to having some basic information stored (IDs, etc) for proper bot usage.

Usage Example:
\`{{prefix}}register\`
`

export const ck = `
Used to configure and return from ChastiKey API.
Currently returns: (1) Keyholder, (2) Lockee, (3) Both

\`{{prefix}}ck verify\` - Verify your Discord Account to ChastiKey
\`{{prefix}}ck update\` - Update your Roles: Locked/Unlocked, Experience, Event Specific

\`{{prefix}}ck ticker\` - Returns your ticker
\`{{prefix}}ck ticker #\` - Returns a specific ticker type (replace \`#\`)
\`{{prefix}}ck ticker set type 2\` - Set default ticker
\`{{prefix}}ck ticker set date 2019-01-27\` - Start date for ticker data
\`{{prefix}}ck ticker set rating show\` - To display rating or not \`show\` or \`hide\`

\`{{prefix}}ck stats lockee\` - Get your lockee stats (by saved username)
\`{{prefix}}ck stats keyholder\` - Get your keyholder stats (by saved username)
\`{{prefix}}ck stats lockee UsernameHere\` - Get stats for defined username
\`{{prefix}}ck stats locktober\` - Display Locktober stats

\`{{prefix}}ck keyholder lockees UsernameHere\` - Get list of lockee names
\`{{prefix}}ck keyholder set average show\` - Enable/Disable the average visibility in stats commands

\`{{prefix}}ck check multilocked UsernameHere\` - Get list of KH's lockees who have 2 or more KHs

\`{{prefix}}ck recover combos\` - Retrieve past unlock combinations
`

export const decision = `
A random decision maker based on given or saved outcomes.

\`{{prefix}}decision "Question here!" "Answers" "here"\` - Run a random decision (without saving)
\`{{prefix}}decision new "Your decision question here"\` - Create a new saved decision (reusable)
\`{{prefix}}decision "DecisionID" add "New outcome here"\` - Add options to saved decision
\`{{prefix}}decision roll 'DecisionID'\` - Roll for a result from a saved decision
`
export const bnet = `
BattleNet Commands

\`{{prefix}}wow\` - Lookup WoW Characters/Data/Info
`

export const flip = `
Flip a coin

\`{{prefix}}flip\` - Heads or Tails
`

export const roll = `
Roll die/dice

\`{{prefix}}roll\` - Roll a single die
\`{{prefix}}roll 20\` - Roll a single die with 20 sides
\`{{prefix}}roll 10 6\` - Roll multiple (10) dice with given number of sides (6)
`

export const stats = `
\`{{prefix}}stats commands\` - Print the top 10 commands and their usage stats
`

export const poll = `
Poll

\`{{prefix}}poll new "Is Kiera the cat cute?"\` - Create a new poll
\`{{prefix}}poll edit 5cfcf44614e8a64034ca89f3 public false\` - Used to edit a paramater of the poll
\`{{prefix}}poll start 5cfcf44614e8a64034ca89f3\` - Used to display the block which users may vote upon
\`{{prefix}}poll pick random 5cfcf44614e8a64034ca89f3 :thumbsup:\` - Pick a random react from the specified emoji

Poll Paramaters: \`open\`, \`public\`, \`title\`, \`question\`, \`footer\`
`
