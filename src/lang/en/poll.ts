export const newPollCreated = `New Poll ID: \`{{id}}\`

The following parameters may be modified to finish setting up your poll:

  - public (Default: true) **\`true\`** | **\`false\`** - Allows the poll to be viewed on the website
  - open (Default: true) **\`true\`** | **\`false\`** - Allows user votes to count on the poll
  - question: \`{{question}}\`

Use the following commands to edit the above values:
  \`{{prefix}}poll edit {{id}} open false\`
  \`{{prefix}}poll edit {{id}} public false\`
  \`{{prefix}}poll edit {{id}} title "Add a title here"\`
  \`{{prefix}}poll edit {{id}} question "Your edited text here"\`
  \`{{prefix}}poll edit {{id}} footer "Add a footer here"\`

To begin the poll use (this will print the message people actually vote on):
  \`{{prefix}}poll start {{id}}\`
`

export const pollNotFoundInDB = `Could not find that poll in the Database!`
export const pollPropertyNotFound = `Could not find the specified poll property!`
export const pollPropertyUpdated = `Poll ID \`{{id}}\` property \`{{property}}\` updated!

**From:** \`{{from}}\` 🡒 **To:** \`{{to}}\`
`

export const pollVoteCast = `Vote Cast!`
export const pollVoteRemoved = `Vote Retracted!`
export const pollExpired = `Vote **not** cast! Poll has expired.`
export const pollDifferentAuthorID = `Only the Poll's author may call {{prefix}} this command!`
export const pollRandomVoteSelected = `Randomly selected: {{emoji}} by: {{by}}`