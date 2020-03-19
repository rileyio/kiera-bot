export const newQuestionAdded = `
New question added (id: \`{{id}}\`)
Enter your options using \`!decision {{id}} add "Decision result here"\`
Roll for an outcome using \`!decision roll {{id}}\``

export const setModeOptions = `Mode options available are:
> \`0\` = Basic (No limiting enabled)
> \`1\` = Temporarily Consume 
    (Make sure to set in seconds the reset time, Example: \`{{prefix}}decision "id" consume reset 60\`)
> \`2\` = Consume
    (Once the outcome has been used it will be out of rotation unless the author resets, Reset using: \`{{prefix}}decision "id" consume reset\`)
`
