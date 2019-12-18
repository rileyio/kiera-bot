import { Task } from '@/objects/task'
import { TrackedUser } from '@/objects/user'

export class ChastiKeyVerifiedRoleMonitor extends Task {
  public verifiedRole: string
  public previousRefresh: number = 0

  run = this.process
  isAsync = true

  protected async process() {
    if (Date.now() - this.previousRefresh < this.frequency) return // Stop here

    // If Debug block is in place, stop here
    if (process.env.BOT_BLOCK_CKVERIFY) {
      console.log('Verified Role Monitor::Blocking Verified Role update per debug setting in .env file.')
      this.previousRefresh = Date.now()
      return true
    }

    try {
      // Get users who are eligible from the db, but only users who have verified their discord ID
      const stored = await this.Bot.DB.getMultiple<TrackedUser>('users', { 'ChastiKey.isVerified': true })
      const guilds = this.Bot.client.guilds.filter(g => g.id === '473856867768991744' || g.id === '389204362959781899').array()

      console.log(`CK Verified Role Monitor::Users Eligible (from users) = ${stored.length}`)

      // Loop through guilds
      for (let guildIndex = 0; guildIndex < guilds.length; guildIndex++) {
        const guild = guilds[guildIndex]
        const guildMembers = guild.members.array()
        const role = guild.roles.find(r => r.name === this.verifiedRole)
        const usersWithRoleAlready = role.members.filter(m => m.roles.find(r => r.name === this.verifiedRole) !== undefined).array()

        console.log(`CK Verified Role Monitor::Guild = ${guild.name} (${guild.members.size}), Role = ${this.verifiedRole}, Users w/Role = ${usersWithRoleAlready.length}`)

        // Set users to add the role to
        for (let memberIndex = 0; memberIndex < guildMembers.length; memberIndex++) {
          const member = guildMembers[memberIndex]
          // Are they in the stored collection? Yes:
          if (stored.findIndex(sm => sm.id === member.id) > -1) {
            // Do they NOT already have the role? If this is the case, add it
            if (!member.roles.has(role.id)) {
              console.log(`CK Verified Role Monitor::Giving verified role = ${role.name}, To = @${member.user.username}#${member.user.discriminator}`)
              // Assign ChastiKey Verified role
              await member.addRole(role)
              await this.sleep(100)
              // Print in Audit log
              await this.Bot.auditLogChannel.send(
                `:robot: **CK Verified Role Monitor**\nGiving verified role = \`${role.name}\`\nServer = \`${guild.name}\`\nTo = \`@${member.nickname || member.user.username}#${
                  member.user.discriminator
                }\``
              )
              await this.sleep(100)
            }
          }
          // If they have the role but wernt caught by the above
          else {
            // Remove as they should not have it
            if (member.roles.has(role.id)) {
              console.log(`CK Verified Role Monitor::Removing verified role = ${role.name}, From = @${member.user.username}#${member.user.discriminator}`)
              // Remove ChastiKey Verified role
              await member.removeRole(role)
              await this.sleep(100)
              //Print in Audit log
              await this.Bot.auditLogChannel.send(
                `:robot: **CK Verified Role Monitor**\nRemoving verified role = \`${role.name}\`\nServer = \`${guild.name}\`\nFrom = \`@${member.nickname || member.user.username}#${
                  member.user.discriminator
                }\``
              )
              await this.sleep(100)
            }
          }
        }
      }

      this.previousRefresh = Date.now()
      return true
    } catch (error) {
      console.log(error)
      this.previousRefresh = Date.now()
      return false
    }
  }

  private sleep(time: number) {
    return new Promise(resolve => setTimeout(resolve, time))
  }
}
