// import { Task } from '@/objects/task'
// import { TrackedBotSetting } from '@/objects/setting'

// export class ChastiKeyEventRoleMonitor extends Task {
//   public reload: boolean = true
//   public eventRole: string
//   public previousRefresh: number = 0

//   run = this.process
//   isAsync = true
//   useTaskRunner = false

//   protected async process() {
//     // If Debug block is in place, stop here
//     if (process.env.BOT_BLOCK_EVENT) {
//       console.log('Event Role Monitor::Blocking Event update per debug setting in .env file.')
//       this.previousRefresh = Date.now()
//       return true
//     }

//     if (this.reload) {
//       // Get the schedule from the DB - this allow's for dynamic changes without re-writing code
//       var dbSchedule = await this.Bot.DB.get<TrackedBotSetting>('settings', { key: `bot.task.chastikey.schedule.event.${this.name}` })
//       // If there is a schedule configured in the DB
//       if (dbSchedule) this.schedule = dbSchedule.value
//       // When no Schedule is configured in the DB, make one to have
//       else {
//         dbSchedule = new TrackedBotSetting({
//           added: Date.now(),
//           author: 'kiera-bot',
//           env: '*',
//           key: `bot.task.chastikey.schedule.event.${this.name}`,
//           value: this.schedule || '* * * * *',
//           updated: Date.now()
//         })
//       }

//       // Store new schedule
//       await this.Bot.DB.update<TrackedBotSetting>('settings', { key: `bot.task.chastikey.schedule.event.${this.name}` }, dbSchedule, { upsert: true })
//       this.reload = false
//     }

//     try {
//       // Get users who are eligible from the db, but only users who have verified their discord ID
//       const stored = await this.Bot.DB.getMultiple<{ username: string; discordID: string }>('ck-locktober', { discordID: { $ne: null } })
//       const guilds = this.Bot.client.guilds.filter(g => g.id === '473856867768991744' || g.id === '389204362959781899').array()

//       console.log(`Event Role Monitor::Users Eligible = ${stored.length}`)

//       // Loop through guilds
//       for (let guildIndex = 0; guildIndex < guilds.length; guildIndex++) {
//         const guild = guilds[guildIndex]
//         const guildMembers = guild.members.array()
//         const role = guild.roles.find(r => r.name === this.eventRole)
//         const usersWithRoleAlready = role.members.filter(m => m.roles.find(r => r.name === this.eventRole) !== undefined).array()

//         console.log(`Event Role Monitor::Guild = ${guild.name} (${guild.members.size}), Role = ${this.eventRole}, Users w/Role = ${usersWithRoleAlready.length}`)

//         // Set users to add the role to
//         for (let memberIndex = 0; memberIndex < guildMembers.length; memberIndex++) {
//           const member = guildMembers[memberIndex]
//           // Are they in the stored collection? Yes:
//           if (stored.findIndex(sm => sm.discordID === member.id) > -1) {
//             // Do they NOT already have the role? If this is the case, add it
//             if (!member.roles.has(role.id)) {
//               console.log(`Event Role Monitor::Giving event role = ${role.name}, To = @${member.user.username}#${member.user.discriminator}`)
//               // Assign event role
//               await member.addRole(role)
//               await this.sleep(250)
//               // Print in Audit log
//               await this.Bot.auditLogChannel.send(
//                 `:robot: **Event Role Monitor**\nGiving event role = \`${role.name}\`\nServer = \`${guild.name}\`\nTo = \`@${member.nickname || member.user.username}#${member.user.discriminator}\``
//               )
//               await this.sleep(250)
//             }
//           }
//           // If they have the role but wernt caught by the above
//           else {
//             // Remove as they should not have it
//             if (member.roles.has(role.id)) {
//               console.log(`Event Role Monitor::Removing event role = ${role.name}, From = @${member.user.username}#${member.user.discriminator}`)
//               // Remove event role
//               await member.removeRole(role)
//               await this.sleep(250)
//               //Print in Audit log
//               await this.Bot.auditLogChannel.send(
//                 `:robot: **Event Role Monitor**\nRemoving event role = \`${role.name}\`\nServer = \`${guild.name}\`\nFrom = \`@${member.nickname || member.user.username}#${
//                   member.user.discriminator
//                 }\``
//               )
//               await this.sleep(250)
//             }
//           }
//         }
//       }

//       this.previousRefresh = Date.now()
//       return true
//     } catch (error) {
//       console.log(error)
//       this.previousRefresh = Date.now()
//       return false
//     }
//   }

//   private sleep(time: number) {
//     return new Promise(resolve => setTimeout(resolve, time))
//   }
// }
