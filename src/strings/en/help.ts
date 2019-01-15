export const main = `
**Commands Available**

Commands will always begin with the \`{{prefix}}\` prefix.

- Times will always be in minutes & Ranges such as \`1-10\` means \`1\` is the lowest and \`10\` is the highest
- User/Lockee commands won't use any @user#0000 arguments unless specified
- Keyholder commands must always specify a @user#0000 if command is to target a user

To see more about a specific command's usage, type \`{{prefix}}help command\`

**[Everyone] Generic/Stats/User**
\`{{prefix}}register\` - Registers the user with the bot (Required before access to most commands becomes available)
\`{{prefix}}ck\` - ChastiKey Commands

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

export const react = `
**\`{{prefix}}react\` Command Usage**

Constraints: [Keyholder's Only]
Available Range (Per react): \`1-10\`

Sets how much time to be added/removed per react.

Usage Example:
\`\`\`md
{{prefix}}react @user#0000 time 10
\`\`\`
`

export const duration = `
**\`{{prefix}}duration\` Command Usage**

Constraints: [Keyholder's Only]
Available Range: \`1-10\`

Sets a duration of the session, time can be added to this via reacts.

Usage Example:
\`\`\`md
{{prefix}}duration @user#0000 time 60
\`\`\`
`

export const intensity = `
**\`{{prefix}}intensity\` Command Usage**

Constraints: [Keyholder's Only]
Available Range: \`0-100\`

Sets intensity thresholds for the session (10 = 10%), reacts will remain at or below the
lockee's defined limit.

Setting the modifier means when a react (for example using :rolling_eyes:) will only result
in nudging the intensity towards 100%. A modifier of 10 where a intensity min is also 10
when \`:rolling_eyes:\` is used would nudge the intensity up/down by { -10%, -5%, 0, +5%, +10% }

Example: Where modifier (%) is 10    { \`-%\`, \`-%/2\`, \`no-change\`, \`+%*2\`,\`+%\` }

Usage Example:
\`\`\`md
{{prefix}}intensity @user#0000 set min 10
{{prefix}}intensity @user#0000 set max 80
{{prefix}}intensity @user#0000 set modifier 10
\`\`\`
`

export const limit = `
**\`{{prefix}}limit\` Command Usage**

Constraints: [Lockee's Only]
Available Limits: \`time\` \`intensity\`

Sets intensity lockee's thresholds/limits.

Usage Example:
\`\`\`md
{{prefix}}limit intensity 80
{{prefix}}limit time 75
\`\`\`
`

export const ck = `
**\`{{prefix}}ck\` Command Usage**

Constraints: [Keyholder or Lockees]

Used to configure and return from ChastiKey API.
Currently returns:
  - Tickers (Keyholder and Lockees)

Usage Example
\`\`\`sh
// Returns your ticker
{{prefix}}ck ticker

// Configures ChastiKey username
{{prefix}}ck username YourUsername

// Configures if your ticker should return as a (1) Keyholder or (2) Lockee
{{prefix}}ck ticker set type 2
\`\`\`
`