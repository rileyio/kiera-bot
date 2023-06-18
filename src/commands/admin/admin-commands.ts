import { AcceptedResponse, ExportRoutes, RouteConfiguration, Routed } from '#router/index'

import { SlashCommandBuilder } from '@discordjs/builders'

export const Routes = ExportRoutes(
  new RouteConfiguration({
    category: 'Admin',
    controller: listCommandCategories,
    description: 'Help.Admin.CommandCategories.Description',
    example: '{{prefix}}admin commands',
    name: 'admin-commands-slash',
    permissions: {
      serverAdminOnly: true
    },
    slash: new SlashCommandBuilder().setName('admin').setDescription('Server Administrator Commands to adjust functionality of Kiera'),
    type: 'discord-chat-interaction',
    validate: '/admin:string/commands:string'
  })
  // {
  //   category: 'Admin',
  //   controller: listCommandCategories,
  //   description: 'Help.Admin.CommandCategories.Description',
  //   example: '{{prefix}}admin commands',
  //   name: 'admin-command-categories',
  //   permissions: {
  //     serverAdminOnly: true
  //   },
  //   type: 'message',
  //   validate: '/admin:string/commands:string'
  // },
  // {
  //   category: 'Admin',
  //   controller: listCategoryCommands,
  //   description: 'Help.Admin.CategoryCommands.Description',
  //   example: '{{prefix}}admin category Fun',
  //   name: 'admin-category-commands',
  //   permissions: {
  //     serverAdminOnly: true
  //   },
  //   type: 'message',
  //   validate: '/admin:string/commands:string/category:string/category=string'
  // },
  // {
  //   category: 'Admin',
  //   controller: commandRestrict,
  //   description: 'Help.Admin.CommandRestrict',
  //   example: '{{prefix}}admin restrict command 8ball',
  //   name: 'admin-command-restrict',
  //   permissions: {
  //     serverAdminOnly: true
  //   },
  //   type: 'message',
  //   validate: '/admin:string/commands:string/category:string/category=string'
  // },
  // {
  //   category: 'Admin',
  //   controller: setPrefix,
  //   description: 'Help.Admin.SetPrefix.Description',
  //   example: '{{prefix}}admin prefix use #',
  //   name: 'admin-prefix-use',
  //   permissions: {
  //     serverAdminOnly: true,
  //     serverOnly: true
  //   },
  //   type: 'message',
  //   validate: '/admin:string/prefix:string/use:string/newPrefix=string',
  //   validateAlias: ['/admin:string/prefix:string/newPrefix=string']
  // }
)

/**
 * Generate print out of commands by category breakdown
 * @export
 * @param {RouterRouted} routed
 * @returns
 */
export async function listCommandCategories(routed: Routed<'discord-chat-interaction'>): AcceptedResponse {
  const categories = {}
  let responseString: string
  let longestName = 0
  let largestNumber = 0

  routed.bot.Router.routes.forEach((route) => {
    // Track category and how many times its seen across all commands
    categories[route.category] === undefined ? (categories[route.category] = { count: 1 }) : (categories[route.category].count += 1)

    // Track which category name is the longest
    if (longestName < route.category.length) longestName = route.category.length
    if (largestNumber < String(route.category || 0).length) largestNumber = String(route.category || 0).length
  })

  const categoryNames = Object.keys(categories)

  // Sort A > Z
  categoryNames.sort((a, b) => {
    const x = a.toLowerCase()
    const y = b.toLowerCase()
    if (x < y) {
      return -1
    }
    if (x > y) {
      return 1
    }
    return 0
  })

  // Add each command category's name & total
  categoryNames.forEach((catName, index) => {
    responseString += `${catName} ${Array.from(Array(longestName + 3 - catName.length)).join('.')} Commands: ${categories[catName].count}${
      index < categoryNames.length - 1 ? '\n' : ''
    }`
  })

  return await routed.reply(routed.$render('Admin.CommandCategoriesList', { categories: responseString }))
}

// /**
//  * Genrate print out of commands under the given category
//  * @export
//  * @param {RouterRouted} routed
//  * @returns
//  */
// export async function listCategoryCommands(routed: Routed<'discord-chat-interaction'>) {
//   const commands = []
//   let responseString: string
//   let longestName = 0
//   let largestNumber = 0

//   // Get commands under this category
//   routed.bot.Router.routes.forEach((route) => {
//     if (route.category.toLowerCase() === routed.v.o.category.toLowerCase()) {
//       // Track command name, example, and if it's restricted
//       commands.push({
//         example: route.example,
//         name: route.name,
//         restricted: route.permissions.restrictedTo.length > 0 || route.permissions.serverAdminOnly || !route.permissions.defaultEnabled
//       })
//       // Track which command name is the longest
//       if (longestName < route.name.length) longestName = route.name.length
//       if (largestNumber < String(route.name || 0).length) largestNumber = String(route.name || 0).length
//     }
//   })

//   // Sort A > Z
//   commands.sort((a, b) => {
//     const x = a.name.toLowerCase()
//     const y = b.name.toLowerCase()
//     if (x < y) {
//       return -1
//     }
//     if (x > y) {
//       return 1
//     }
//     return 0
//   })

//   // Add each command category's name & total
//   commands.forEach((command, index) => {
//     responseString += `${command.name} ${Array.from(Array(longestName + 3 - command.name.length)).join('.')} Example: ${routed.$sb(command.example)}${
//       index < commands.length - 1 ? '\n' : ''
//     }`
//   })

//   await routed.reply(routed.$render('Admin.CommandCategoryCommands', { category: routed.v.o.category, commands: responseString }))
//   return true // Successful
// }

// export async function commandRestrict(routed: Routed<'discord-chat-interaction'>) {
//   await routed.reply(routed.$render('Generic.Warn.CommandUnderMaintenance'))
//   return true // Successful
// }

// export async function setPrefix(routed: Routed<'discord-chat-interaction'>) {
//   try {
//     const updated = await routed.bot.DB.update('servers', { id: routed.guild.id }, { prefix: routed.v.o.newPrefix })
//     if (updated) await routed.reply(routed.$render('Admin.PrefixUpdated', { newPrefix: routed.v.o.newPrefix }))
//     else routed.reply(routed.$render('Admin.PrefixNotUpdated'))
//   } catch (error) {
//     return routed.reply(routed.$render('Admin.PrefixUpdateError'))
//   }
// }
