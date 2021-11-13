import { ExportRoutes, RouterRouted } from '@/router'

export const Routes = ExportRoutes({
  category: 'Admin',
  controller: checkPermissions,
  description: 'Help.Admin.CheckPermissions.Description',
  example: '{{prefix}}check permissions',
  name: 'admin-check-permissions',
  permissions: {
    defaultEnabled: true
  },
  type: 'message',
  validate: '/check:string/permissions:string/user?=string'
})

export async function checkPermissions(routed: RouterRouted) {
  const botUser = routed.message.guild.members.cache.get(routed.bot.client.user.id)
  const requestingUser = routed.message.member

  await routed.message.reply(`\`\`\`json
${JSON.stringify(
  {
    bot: {
      channel: {
        ADD_REACTIONS: botUser.permissions.has('ADD_REACTIONS'),
        ATTACH_FILES: botUser.permissions.has('ATTACH_FILES'),
        EMBED_LINKS: botUser.permissions.has('EMBED_LINKS'),
        MANAGE_MESSAGES: botUser.permissions.has('MANAGE_MESSAGES'),
        READ_MESSAGE_HISTORY: botUser.permissions.has('READ_MESSAGE_HISTORY'),
        SEND_TTS_MESSAGES: botUser.permissions.has('SEND_TTS_MESSAGES'),
        USE_EXTERNAL_EMOJIS: botUser.permissions.has('USE_EXTERNAL_EMOJIS')
      },
      guild: {
        ADMINISTRATOR: botUser.permissions.has('ADMINISTRATOR'),
        BAN_MEMBERS: botUser.permissions.has('BAN_MEMBERS'),
        CHANGE_NICKNAME: botUser.permissions.has('CHANGE_NICKNAME'),
        CREATE_INSTANT_INVITE: botUser.permissions.has('CREATE_INSTANT_INVITE'),
        KICK_MEMBERS: botUser.permissions.has('KICK_MEMBERS'),
        MANAGE_CHANNELS: botUser.permissions.has('MANAGE_CHANNELS'),
        MANAGE_EMOJIS: botUser.permissions.has('MANAGE_EMOJIS_AND_STICKERS'),
        MANAGE_GUILD: botUser.permissions.has('MANAGE_GUILD'),
        MANAGE_NICKNAMES: botUser.permissions.has('MANAGE_NICKNAMES'),
        MANAGE_ROLES: botUser.permissions.has('MANAGE_ROLES'),
        VIEW_AUDIT_LOG: botUser.permissions.has('VIEW_AUDIT_LOG')
      }
    },
    user: {
      channel: {
        ADD_REACTIONS: requestingUser.permissions.has('ADD_REACTIONS'),
        ATTACH_FILES: requestingUser.permissions.has('ATTACH_FILES'),
        EMBED_LINKS: requestingUser.permissions.has('EMBED_LINKS'),
        MANAGE_MESSAGES: requestingUser.permissions.has('MANAGE_MESSAGES'),
        READ_MESSAGE_HISTORY: requestingUser.permissions.has('READ_MESSAGE_HISTORY'),
        SEND_MESSAGES: requestingUser.permissions.has('SEND_MESSAGES'),
        SEND_TTS_MESSAGES: requestingUser.permissions.has('SEND_TTS_MESSAGES'),
        USE_EXTERNAL_EMOJIS: requestingUser.permissions.has('USE_EXTERNAL_EMOJIS'),
        VIEW_CHANNEL: requestingUser.permissions.has('VIEW_CHANNEL')
      },
      guild: {
        ADMINISTRATOR: requestingUser.permissions.has('ADMINISTRATOR'),
        BAN_MEMBERS: requestingUser.permissions.has('BAN_MEMBERS'),
        CHANGE_NICKNAME: requestingUser.permissions.has('CHANGE_NICKNAME'),
        CREATE_INSTANT_INVITE: requestingUser.permissions.has('CREATE_INSTANT_INVITE'),
        KICK_MEMBERS: requestingUser.permissions.has('KICK_MEMBERS'),
        MANAGE_CHANNELS: requestingUser.permissions.has('MANAGE_CHANNELS'),
        MANAGE_EMOJIS: requestingUser.permissions.has('MANAGE_EMOJIS_AND_STICKERS'),
        MANAGE_GUILD: requestingUser.permissions.has('MANAGE_GUILD'),
        MANAGE_NICKNAMES: requestingUser.permissions.has('MANAGE_NICKNAMES'),
        MANAGE_ROLES: requestingUser.permissions.has('MANAGE_ROLES'),
        VIEW_AUDIT_LOG: requestingUser.permissions.has('VIEW_AUDIT_LOG')
      }
    }
  },
  null,
  2
)}
  \`\`\``)

  return true
}
