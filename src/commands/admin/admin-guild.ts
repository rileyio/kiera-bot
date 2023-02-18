// import { ExportRoutes, RouterRouted } from '@/router'

// export const Routes = ExportRoutes({
//   category: 'Admin',
//   controller: checkPermissions,
//   description: 'Help.Admin.CheckPermissions.Description',
//   example: '{{prefix}}check permissions',
//   name: 'admin-check-permissions',
//   permissions: {
//     defaultEnabled: true
//   },
//   type: 'message',
//   validate: '/check:string/permissions:string/user?=string'
// })

// export async function checkPermissions(routed: RouterRouted) {
//   const botUser = routed.message.guild.members.cache.get(routed.bot.client.user.id)
//   const requestingUser = routed.message.member

//   await routed.reply(`\`\`\`json
// ${JSON.stringify(
//   {
//     bot: {
//       channel: {
//         ADD_REACTIONS: botUser.permissions.has('AddReactions'),
//         ATTACH_FILES: botUser.permissions.has('AttachFiles'),
//         EMBED_LINKS: botUser.permissions.has('EmbedLinks'),
//         MANAGE_MESSAGES: botUser.permissions.has('ManageMessages'),
//         READ_MESSAGE_HISTORY: botUser.permissions.has('ReadMessageHistory'),
//         SEND_TTS_MESSAGES: botUser.permissions.has('SendTTSMessages'),
//         USE_EXTERNAL_EMOJIS: botUser.permissions.has('UseExternalEmojis')
//       },
//       guild: {
//         ADMINISTRATOR: botUser.permissions.has('Administrator'),
//         BAN_MEMBERS: botUser.permissions.has('BanMembers'),
//         CHANGE_NICKNAME: botUser.permissions.has('ChangeNickname'),
//         CREATE_INSTANT_INVITE: botUser.permissions.has('CreateInstantInvite'),
//         KICK_MEMBERS: botUser.permissions.has('KickMembers'),
//         MANAGE_CHANNELS: botUser.permissions.has('ManageChannels'),
//         MANAGE_EMOJIS: botUser.permissions.has('ManageEmojisAndStickers'),
//         MANAGE_GUILD: botUser.permissions.has('ManageGuild'),
//         MANAGE_NICKNAMES: botUser.permissions.has('ManageNicknames'),
//         MANAGE_ROLES: botUser.permissions.has('ManageRoles'),
//         VIEW_AUDIT_LOG: botUser.permissions.has('ViewAuditLog')
//       }
//     },
//     user: {
//       channel: {
//         ADD_REACTIONS: botUser.permissions.has('AddReactions'),
//         ATTACH_FILES: botUser.permissions.has('AttachFiles'),
//         EMBED_LINKS: botUser.permissions.has('EmbedLinks'),
//         MANAGE_MESSAGES: botUser.permissions.has('ManageMessages'),
//         READ_MESSAGE_HISTORY: botUser.permissions.has('ReadMessageHistory'),
//         SEND_TTS_MESSAGES: botUser.permissions.has('SendTTSMessages'),
//         USE_EXTERNAL_EMOJIS: botUser.permissions.has('UseExternalEmojis'),
//         VIEW_CHANNEL: requestingUser.permissions.has('ViewChannel')
//       },
//       guild: {
//         ADMINISTRATOR: botUser.permissions.has('Administrator'),
//         BAN_MEMBERS: botUser.permissions.has('BanMembers'),
//         CHANGE_NICKNAME: botUser.permissions.has('ChangeNickname'),
//         CREATE_INSTANT_INVITE: botUser.permissions.has('CreateInstantInvite'),
//         KICK_MEMBERS: botUser.permissions.has('KickMembers'),
//         MANAGE_CHANNELS: botUser.permissions.has('ManageChannels'),
//         MANAGE_EMOJIS: botUser.permissions.has('ManageEmojisAndStickers'),
//         MANAGE_GUILD: botUser.permissions.has('ManageGuild'),
//         MANAGE_NICKNAMES: botUser.permissions.has('ManageNicknames'),
//         MANAGE_ROLES: botUser.permissions.has('ManageRoles'),
//         VIEW_AUDIT_LOG: botUser.permissions.has('ViewAuditLog')
//       }
//     }
//   },
//   null,
//   2
// )}
//   \`\`\``)

//   return true
// }
