import { RouterRouted, ExportRoutes } from '@/router'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Utility',
    controller: displayRoles,
    example: '{{prefix}}util roles show',
    name: 'util-roles-stats',
    validate: '/util:string/roles:string/show:string'
  },
  {
    type: 'message',
    category: 'Utility',
    controller: displayRoleRange,
    example: '{{prefix}}util roles show 0 to 10',
    name: 'util-role-stats',
    validate: '/util:string/roles:string/show:string/from=number/to:string/until=number'
  },
  {
    type: 'message',
    category: 'Utility',
    controller: displayRolesLike,
    example: '{{prefix}}util roles show like RolesContainingWord',
    name: 'util-role-stats-bystring-search',
    validate: '/util:string/roles:string/show:string/like:string/name=string'
  },
  {
    type: 'message',
    category: 'Utility',
    controller: displayRole,
    example: '{{prefix}}util role show RoleNameHere',
    name: 'util-role-specific-stats',
    validate: '/util:string/role:string/show:string/name=string'
  }
)

/**
 * Show roles and counts
 * @export
 * @param {RouterRouted} routed
 */
export async function displayRoles(routed: RouterRouted) {
  var longestName = 0
  var largestNumber = 0

  var roles = routed.message.guild.roles.cache.array().map((r) => {
    // Track current longest name & largest member count number
    if (longestName < r.name.length) longestName = r.name.length
    if (largestNumber < String(r.members || 0).length) largestNumber = String(r.members || 0).length

    return { name: r.name, hexColor: r.hexColor, members: r.members.size, position: r.position }
  })

  // Sort roles by position
  roles.sort((a, b) => {
    var x = a.position
    var y = b.position
    if (x > y) {
      return -1
    }
    if (x < y) {
      return 1
    }
    return 0
  })

  var message = `\n**Server Roles**\n`

  message += `\`\`\``

  roles.forEach((r) => {
    message += `(${r.position < 10 ? `0` + r.position : r.position}) ${r.name} ${Array.from(Array(longestName + 3 - r.name.length)).join('.')} [${r.members}]\n`
  })

  message += `\`\`\``

  // If message exceeds the 2000 character return a message informing the user
  if (message.length >= 2000) {
    // Recreate the message
    message = `\n**Server Roles (Because there are too many roles there have been some cutbacks!, try searching using the range command like \`!util roles show 5 to 15\`)**`
    await routed.message.channel.send(message)

    // Successful end
    return true
  }

  await routed.message.channel.send(message)

  // Successful end
  return true
}

/**
 * Show specific role range
 * @export
 * @param {RouterRouted} routed
 */
export async function displayRoleRange(routed: RouterRouted) {
  const roles = routed.message.guild.roles.cache.array().map((r) => {
    return { name: r.name, hexColor: r.hexColor, members: r.members.size, position: r.position }
  })

  // Sort roles by position
  roles.sort((a, b) => {
    var x = a.position
    var y = b.position
    if (x < y) {
      return -1
    }
    if (x > y) {
      return 1
    }
    return 0
  })

  // Splice out only what the user wants
  const slicedRoles = roles.slice(routed.v.o.from, routed.v.o.until + 1)

  if (slicedRoles.length > 0) {
    var message = `\n**Server Role(s)**\n`

    message += `\`\`\``

    slicedRoles.forEach((r, i) => {
      message += `${r.name} [${r.members}]\n`
      if (i < slicedRoles.length - 1) message += `\n` // Add extra space between roles
    })

    message += `\`\`\``

    await routed.message.channel.send(message)
  } else routed.message.channel.send('Count not find roles in the given range!')
  // Successful end
  return true
}

/**
 * Show Roles that contain
 * @export
 * @param {RouterRouted} routed
 */
export async function displayRolesLike(routed: RouterRouted) {
  var longestName = 0
  var largestNumber = 0

  const roles = routed.message.guild.roles.cache.array().map((r) => {
    // Track current longest name & largest member count number
    if (longestName < r.name.length) longestName = r.name.length
    if (largestNumber < String(r.members || 0).length) largestNumber = String(r.members || 0).length

    return { name: r.name, hexColor: r.hexColor, members: r.members.size, position: r.position }
  })

  // Splice out only what the user wants
  const slicedRoles = roles.filter((r) => {
    const regex = new RegExp(`(${routed.v.o.name})`, 'i')
    var matched = regex.test(r.name)

    console.log(r.name, ' ', matched)

    if (matched) {
      // Add matched role to array
      return r
    }
  })

  // Sort roles by position
  roles.sort((a, b) => {
    var x = a.position
    var y = b.position
    if (x < y) {
      return -1
    }
    if (x > y) {
      return 1
    }
    return 0
  })

  if (slicedRoles.length > 0) {
    var message = `\n**Server Role(s) that contain \`${routed.v.o.name}\` (${slicedRoles.length})**\n`

    message += `\`\`\``

    slicedRoles.forEach((r, i) => {
      message += `(${r.position < 10 ? `0` + r.position : r.position}) ${r.name} ${Array.from(Array(longestName + 3 - r.name.length)).join('.')} [${r.members}]`
      if (i < slicedRoles.length - 1) message += `\n` // Add extra space between roles
    })

    message += `\`\`\``

    await routed.message.channel.send(message)
  } else routed.message.channel.send(`Count not find roles that contain \`${routed.v.o.name}\``)
  // Successful end
  return true
}

/**
 * Show specific role
 * @export
 * @param {RouterRouted} routed
 */
export async function displayRole(routed: RouterRouted) {
  const role = routed.message.guild.roles.cache.array().find((r) => r.name.toLocaleLowerCase().replace(' ', '') === routed.v.o.name.toLocaleLowerCase().replace(' ', ''))

  // If Role was found: Show details about it
  if (role) {
    var message = `\n**Server Role**\n`

    message += `\`\`\``

    message += `Position     ${role.position}\n`
    message += `Name         ${role.name}\n`
    message += `Member Count ${role.members.size}\n`
    message += `Hex color    ${role.hexColor}`

    message += `\`\`\``

    await routed.message.channel.send(message)
  } else {
    await routed.message.channel.send(`Count not find role by the given name \`${routed.v.o.name}\`!`)
  }

  // Successful end
  return true
}
