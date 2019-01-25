export const main = `
**Commands Available**

Commands will always begin with the \`{{prefix}}\` prefix.

- Times will always be in minutes & Ranges such as \`1-10\` means \`1\` is the lowest and \`10\` is the highest

To see more about a specific command's usage, type \`{{prefix}}help command\`

**[Everyone] Generic/Stats/User**
\`{{prefix}}register\` - Registers the user with the bot (Required before access to most commands becomes available)
\`{{prefix}}ck\` - ChastiKey Commands
\`{{prefix}}decision\` Create, Edit or Roll to make a decision

**[Lockee] Commands (*Must be entered by the device owner*)**
\`{{prefix}}session\` - Creates a new session for playing with a device (required for: \`{{prefix}}limit\` \`{{prefix}}duration\` \`{{prefix}}react\`)
\`{{prefix}}limit\` - Lockee defined limits (Cannot be surpassed by KH.. at this time..)
\`{{prefix}}task\` - *Coming Soon*
\`{{prefix}}punishment\` - *Coming Soon*

**[Keyholder] Commands**
\`{{prefix}}react\` - Sets how much time to be added per react
\`{{prefix}}duration\` - Sets base duration (reacts can add to this)
\`{{prefix}}task\` - *Coming Soon*
\`{{prefix}}punishment\` - *Coming Soon*
`

export const register = `
**\`{{prefix}}register\` Command Usage**

**Constraints:** [None]

Registers (opt-in) the user to use the full suite of bot commands.
Using this means you agree to having some basic information stored (IDs, etc) for proper bot usage.

Usage Example:
\`\`\`md
{{prefix}}register
\`\`\`
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
**\`{{prefix}}ck\` Command Usage**

Constraints: [Keyholder or Lockees]

Used to configure and return from ChastiKey API.
Currently returns:
  - Tickers (Keyholder and Lockees)

Usage Example
\`\`\`md
Returns your ticker
{{prefix}}ck ticker

Returns a specific ticker type regardless of your saved type (1) Keyholder, (2) Lockee, (3) Both
{{prefix}}ck ticker #

Configures ChastiKey username
{{prefix}}ck username YourUsername

Configures if your ticker should return as a (1) Keyholder, Default: (2) Lockee, (3) Both
{{prefix}}ck ticker set type 2
\`\`\`
`

export const decision = `
**\`{{prefix}}decision\` Command Usage**

A random decision maker based on given or saved outcomes.

Usage Example
\`\`\`
Run a random decision (without saving)
{{prefix}}decision "Your question here!" "Answers like" "this"

Create a new saved decision (reusable)
{{prefix}}decision new "Your decision question here"

Add options to an existing saved decision
{{prefix}}decision "DecisionID" add "Your decision result entry here"

Roll for a result from a saved decision
{{prefix}}decision roll 'DecisionID'
\`\`\`
`

export const duration = `
**\`{{prefix}}duration\` Command Usage**

Constraints: [Keyholder's Only]

Sets a duration of the session, time can be added to this via reacts.

Usage Example:
\`\`\`md
Set the base time, this is a period of time when initially starting the
session to wait for incoming reactions, nothing will happen until a reaction
is added
{{prefix}}duration @user#0000 min 5

Sets the maximum time that cannot be exceeded by added reactions
{{prefix}}duration @user#0000 max 10
\`\`\`
`

export const limit = `
**\`{{prefix}}limit\` Command Usage**

Constraints: [Lockee's Only]

Sets intensity lockee's thresholds/limits.

Usage Example:
\`\`\`md
{{prefix}}limit intensity 80
{{prefix}}limit time 75
\`\`\`
`

export const react = `
**\`{{prefix}}react\` Command Usage**

Constraints: [Keyholder's Only]

Sets how much time to be added/removed per react.

Usage Example:
\`\`\`md
{{prefix}}react @user#0000 time 10
\`\`\`
`


export const roll = `
**\`{{prefix}}roll\` Command Usage**

Roll die/dice

Usage Example
\`\`\`
Roll a single die
{{prefix}}roll

Roll a single die with 20 sides
{{prefix}}roll 20

Roll multiple (Example: 10) dice with given number of sides (Example: 6)
{{prefix}}roll 10 6
\`\`\`
`