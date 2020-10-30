import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { TrackedServer } from '@/objects/server'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Admin',
    controller: listCommandCategories,
    description: 'Help.Admin.CommandCategories.Description',
    example: '{{prefix}}admin commands',
    name: 'admin-command-categories',
    validate: '/admin:string/commands:string',
    permissions: {
      serverAdminOnly: true
    }
  },
  {
    type: 'message',
    category: 'Admin',
    controller: listCategoryCommands,
    description: 'Help.Admin.CategoryCommands.Description',
    example: '{{prefix}}admin category Fun',
    name: 'admin-category-commands',
    validate: '/admin:string/commands:string/category:string/category=string',
    permissions: {
      serverAdminOnly: true
    }
  },
  {
    type: 'message',
    category: 'Admin',
    controller: commandRestrict,
    description: 'Help.Admin.CommandRestrict',
    example: '{{prefix}}admin restrict command 8ball',
    name: 'admin-command-restrict',
    validate: '/admin:string/commands:string/category:string/category=string',
    permissions: {
      serverAdminOnly: true
    }
  },
  {
    type: 'message',
    category: 'Admin',
    controller: setPrefix,
    description: 'Help.Admin.SetPrefix.Description',
    example: '{{prefix}}admin prefix set #',
    name: 'admin-prefix-set',
    validate: '/admin:string/prefix:string/set:string/newPrefix=string',
    permissions: {
      serverAdminOnly: true
    }
  }
)

/**
 * Generate print out of commands by category breakdown
 * @export
 * @param {RouterRouted} routed
 * @returns
 */
export async function listCommandCategories(routed: RouterRouted) {
  var categories = {}
  var responseString = ``
  var longestName = 0
  var largestNumber = 0

  routed.bot.Router.routes.forEach((route) => {
    // Track category and how many times its seen across all commands
    categories[route.category] === undefined ? (categories[route.category] = { count: 1 }) : (categories[route.category].count += 1)

    // Track which category name is the longest
    if (longestName < route.category.length) longestName = route.category.length
    if (largestNumber < String(route.category || 0).length) largestNumber = String(route.category || 0).length
  })

  var categoryNames = Object.keys(categories)

  // Sort A > Z
  categoryNames.sort((a, b) => {
    var x = a.toLowerCase()
    var y = b.toLowerCase()
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

  await routed.message.reply(routed.$render('Admin.CommandCategoriesList', { categories: responseString }))
  return true // Successful
}

/**
 * Genrate print out of commands under the given category
 * @export
 * @param {RouterRouted} routed
 * @returns
 */
export async function listCategoryCommands(routed: RouterRouted) {
  var commands = []
  var responseString = ``
  var longestName = 0
  var largestNumber = 0

  // Get commands under this category
  routed.bot.Router.routes.forEach((route) => {
    if (route.category.toLowerCase() === routed.v.o.category.toLowerCase()) {
      // Track command name, example, and if it's restricted
      commands.push({
        name: route.name,
        restricted: route.permissions.restrictedTo.length > 0 || route.permissions.serverAdminOnly || !route.permissions.defaultEnabled,
        example: route.example
      })
      // Track which command name is the longest
      if (longestName < route.name.length) longestName = route.name.length
      if (largestNumber < String(route.name || 0).length) largestNumber = String(route.name || 0).length
    }
  })

  // Sort A > Z
  commands.sort((a, b) => {
    var x = a.name.toLowerCase()
    var y = b.name.toLowerCase()
    if (x < y) {
      return -1
    }
    if (x > y) {
      return 1
    }
    return 0
  })

  // Add each command category's name & total
  commands.forEach((command, index) => {
    responseString += `${command.name} ${Array.from(Array(longestName + 3 - command.name.length)).join('.')} Example: ${routed.$sb(command.example)}${
      index < commands.length - 1 ? '\n' : ''
    }`
  })

  await routed.message.reply(routed.$render('Admin.CommandCategoryCommands', { category: routed.v.o.category, commands: responseString }))
  return true // Successful
}

export async function commandRestrict(routed: RouterRouted) {
  await routed.message.reply(routed.$render('Generic.Warn.CommandUnderMaintenance'))
  return true // Successful
}

export async function setPrefix(routed: RouterRouted) {
  await routed.bot.DB.update<TrackedServer>('servers', { id: routed.message.guild.id }, { prefix: routed.v.o.newPrefix })
  return true
}
