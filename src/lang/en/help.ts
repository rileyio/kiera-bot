export const main = `
Commands will always begin with the \`{{prefix}}\` prefix.
To see more about a specific command's usage, type \`{{prefix}}help command\`
You can also begin entering a command like \`{{prefix}}ck\` and if its incomplete
examples will be presented.

(Required before access to most commands becomes available)
\`{{prefix}}register\` - Registers the user with the bot 

\`{{prefix}}8ball\` - Ask a question, receive an answer
\`{{prefix}}ck\` - ChastiKey Commands - \`username\` \`ticker\` \`stats\`
\`{{prefix}}decision\` - Create, Edit or Roll - \`new\` \`roll\`
\`{{prefix}}flip\` - Flip a coin
\`{{prefix}}roll\` - Dice roller
\`{{prefix}}stats\` - Bot tracked statistics
`

// **[Lockee] Commands (*Must be entered by the device owner*)**
// \`{{prefix}}session\` - Creates a new session for playing with a device (required for: \`{{prefix}}limit\` \`{{prefix}}duration\` \`{{prefix}}react\`)
// \`{{prefix}}limit\` - Lockee defined limits (Cannot be surpassed by KH.. at this time..)
// \`{{prefix}}task\` - *Coming Soon*
// \`{{prefix}}punishment\` - *Coming Soon*

// **[Keyholder] Commands**
// \`{{prefix}}react\` - Sets how much time to be added per react
// \`{{prefix}}duration\` - Sets base duration (reacts can add to this)
// \`{{prefix}}task\` - *Coming Soon*
// \`{{prefix}}punishment\` - *Coming Soon*
// `

export const register = `
Registers (opt-in) the user to use the full suite of bot commands.
Using this means you agree to having some basic information stored (IDs, etc) for proper bot usage.

Usage Example:
\`{{prefix}}register\`
`

// export const intensity = `
// **\`{{prefix}}intensity\` Command Usage**

// Constraints: [Keyholder's Only]
// Available Range: \`0-100\`

// Sets intensity thresholds for the session (10 = 10%), reacts will remain at or below the
// lockee's defined limit.

// Setting the modifier means when a react (for example using :rolling_eyes:) will only result
// in nudging the intensity towards 100%. A modifier of 10 where a intensity min is also 10
// when \`:rolling_eyes:\` is used would nudge the intensity up/down by { -10%, -5%, 0, +5%, +10% }

// Example: Where modifier (%) is 10    { \`-%\`, \`-%/2\`, \`no-change\`, \`+%*2\`,\`+%\` }

// Usage Example:
// \`\`\`md
// Set initial time to receive reactions
// {{prefix}}intensity @user#0000 set min 10

// Set maximum time that added reacts cannot exceed
// {{prefix}}intensity @user#0000 set max 80


// {{prefix}}intensity @user#0000 set modifier 10
// \`\`\`
// `

export const ck = `
Used to configure and return from ChastiKey API.
Currently returns: (1) Keyholder, (2) Lockee, (3) Both

\`{{prefix}}ck username YourUsername\` - Configures ChastiKey App username for defaults

\`{{prefix}}ck ticker\` - Returns your ticker
\`{{prefix}}ck ticker #\` - Returns a specific ticker type (replace \`#\`)
\`{{prefix}}ck ticker set type 2\` - Set default ticker
\`{{prefix}}ck ticker set date 2019-01-27\` - Start date for ticker data
\`{{prefix}}ck ticker set rating show\` - To display rating or not \`show\` or \`hide\`

\`{{prefix}}ck stats lockee\` - Get your lockee stats (by saved username)
\`{{prefix}}ck stats keyholder\` - Get your keyholder stats (by saved username)
\`{{prefix}}ck stats lockee "Username"\` - Get stats for defined username

\`{{prefix}}ck keyholder lockees "Username"\` - Get list of lockee names under a KH
\`{{prefix}}ck check multilocked "Username"\` - Get list of KH's lockees who have 2 or more KHs
`

export const decision = `
A random decision maker based on given or saved outcomes.

\`{{prefix}}decision "Question here!" "Answers" "here"\` - Run a random decision (without saving)
\`{{prefix}}decision new "Your decision question here"\` - Create a new saved decision (reusable)
\`{{prefix}}decision "DecisionID" add "New outcome here"\` - Add options to saved decision
\`{{prefix}}decision roll 'DecisionID'\` - Roll for a result from a saved decision
`

// export const duration = `
// Constraints: [Keyholder's Only]

// Sets a duration of the session, time can be added to this via reacts.

// Usage Example:
// \`\`\`md
// Set the base time, this is a period of time when initially starting the
// session to wait for incoming reactions, nothing will happen until a reaction
// is added
// {{prefix}}duration @user#0000 min 5

// Sets the maximum time that cannot be exceeded by added reactions
// {{prefix}}duration @user#0000 max 10
// \`\`\`
// `

// export const limit = `
// **\`{{prefix}}limit\` Command Usage**

// Constraints: [Lockee's Only]

// Sets intensity lockee's thresholds/limits.

// Usage Example:
// \`\`\`md
// {{prefix}}limit intensity 80
// {{prefix}}limit time 75
// \`\`\`
// `

// export const react = `
// **\`{{prefix}}react\` Command Usage**

// Constraints: [Keyholder's Only]

// Sets how much time to be added/removed per react.

// Usage Example:
// \`\`\`md
// {{prefix}}react @user#0000 time 10
// \`\`\`
// `


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
Bot tracked statistics

\`{{prefix}}stats commands\` - Print the top 10 commands and their usage stats
`