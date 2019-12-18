import { RouterRouted, ExportRoutes } from '@/router'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'Admin',
  commandTarget: 'none',
  controller: checkPermissions,
  example: '{{prefix}}check permissions',
  name: 'admin-check-permissions',
  validate: '/check:string/permissions:string/user?=string',
  permissions: {
    defaultEnabled: false,
    serverAdminOnly: true,
    restrictedTo: [
      '146439529824256000' // Emma#1366
    ]
  }
})

export async function checkPermissions(routed: RouterRouted) {
  const botUser = await routed.bot.client.guilds.find(g => g.id === routed.message.guild.id).fetchMember(routed.bot.client.user.id)
  const requestingUser = routed.message.member

  await routed.message.reply(`\`\`\`json
${JSON.stringify(
  {
    bot: {
      channel: {
        ADD_REACTIONS: botUser.hasPermission('ADD_REACTIONS'),
        ATTACH_FILES: botUser.hasPermission('ATTACH_FILES'),
        EMBED_LINKS: botUser.hasPermission('EMBED_LINKS'),
        MANAGE_MESSAGES: botUser.hasPermission('MANAGE_MESSAGES'),
        USE_EXTERNAL_EMOJIS: botUser.hasPermission('USE_EXTERNAL_EMOJIS'),
        READ_MESSAGE_HISTORY: botUser.hasPermission('READ_MESSAGE_HISTORY'),
        SEND_TTS_MESSAGES: botUser.hasPermission('SEND_TTS_MESSAGES')
      },
      guild: {
        ADMINISTRATOR: botUser.hasPermission('ADMINISTRATOR'),
        BAN_MEMBERS: botUser.hasPermission('BAN_MEMBERS'),
        CHANGE_NICKNAME: botUser.hasPermission('CHANGE_NICKNAME'),
        CREATE_INSTANT_INVITE: botUser.hasPermission('CREATE_INSTANT_INVITE'),
        KICK_MEMBERS: botUser.hasPermission('KICK_MEMBERS'),
        MANAGE_CHANNELS: botUser.hasPermission('MANAGE_CHANNELS'),
        MANAGE_GUILD: botUser.hasPermission('MANAGE_GUILD'),
        MANAGE_NICKNAMES: botUser.hasPermission('MANAGE_NICKNAMES'),
        MANAGE_ROLES: botUser.hasPermission('MANAGE_ROLES'),
        MANAGE_EMOJIS: botUser.hasPermission('MANAGE_EMOJIS'),
        VIEW_AUDIT_LOG: botUser.hasPermission('VIEW_AUDIT_LOG')
      }
    },
    user: {
      channel: {
        ADD_REACTIONS: requestingUser.hasPermission('ADD_REACTIONS'),
        ATTACH_FILES: requestingUser.hasPermission('ATTACH_FILES'),
        EMBED_LINKS: requestingUser.hasPermission('EMBED_LINKS'),
        MANAGE_MESSAGES: requestingUser.hasPermission('MANAGE_MESSAGES'),
        USE_EXTERNAL_EMOJIS: requestingUser.hasPermission('USE_EXTERNAL_EMOJIS'),
        READ_MESSAGE_HISTORY: requestingUser.hasPermission('READ_MESSAGE_HISTORY'),
        SEND_MESSAGES: requestingUser.hasPermission('SEND_MESSAGES'),
        SEND_TTS_MESSAGES: requestingUser.hasPermission('SEND_TTS_MESSAGES'),
        VIEW_CHANNEL: requestingUser.hasPermission('VIEW_CHANNEL')
      },
      guild: {
        ADMINISTRATOR: requestingUser.hasPermission('ADMINISTRATOR'),
        BAN_MEMBERS: requestingUser.hasPermission('BAN_MEMBERS'),
        CHANGE_NICKNAME: requestingUser.hasPermission('CHANGE_NICKNAME'),
        CREATE_INSTANT_INVITE: requestingUser.hasPermission('CREATE_INSTANT_INVITE'),
        KICK_MEMBERS: requestingUser.hasPermission('KICK_MEMBERS'),
        MANAGE_CHANNELS: requestingUser.hasPermission('MANAGE_CHANNELS'),
        MANAGE_GUILD: requestingUser.hasPermission('MANAGE_GUILD'),
        MANAGE_NICKNAMES: requestingUser.hasPermission('MANAGE_NICKNAMES'),
        MANAGE_ROLES: requestingUser.hasPermission('MANAGE_ROLES'),
        MANAGE_EMOJIS: requestingUser.hasPermission('MANAGE_EMOJIS'),
        VIEW_AUDIT_LOG: requestingUser.hasPermission('VIEW_AUDIT_LOG')
      }
    }
  },
  null,
  2
)}
  \`\`\``)

  return true
}
