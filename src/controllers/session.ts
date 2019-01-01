import { RouterRouted } from '../utils/router';
import { DeviceSession } from '../objects/sessions';
import { ObjectID } from 'bson';

export namespace Session {
  export async function createNewSession(routed: RouterRouted) {
    // var userArgType = undefined;
    // var userAt = undefined;
    // // if a session is started where a user is passed
    // if (routed.v.o['user'] !== undefined) {
    //   userArgType = Utils.User.verifyUserRefType(routed.v.o.user)
    //   userAt = Utils.User.buildUserChatAt(routed.v.o.user, userArgType)
    // }

    const type = routed.v.o.type
    var typeLimit = false
    var typeMatched = false

    // Determine if session type passed is limited to a single instance active
    // at a time
    switch (type) {
      case 'lovense':
        typeLimit = true
        typeMatched = true
        break;
      default:
        typeMatched = false
        break;
    }

    // Block going any further if the type is not valid
    if (typeMatched === false) return;

    // Check if session is in the db
    const user = await routed.bot.Users.get({ id: routed.message.author.id })
    const server = await routed.bot.Servers.get({ id: routed.message.guild.id })
    // Get all current sessions
    const sessions = await routed.bot.Sessions.getMultiple({
      uid: user._id,
      sid: server._id,
      type: type,
      isDeactivated: false,
      $or: [{ isActive: true }, { activateTimestamp: 0 }]
    })

    // Filter sessions where they are not yet ended or have been created and not yet activated
    const activeSessions = sessions.filter(s => { return s.isActive === true && s.deactivateTimestamp === 0 })
    // Block going further if any sessions are currently active
    if (activeSessions.length > 0 && typeLimit) {
      await routed.message.reply('You have an active session, it must be completed before you can start a new one!')
      return; // Stop here
    }

    // Filter down pending but not yet active session(s)
    const pendingSessions = sessions.filter(s => { return s.isActive === false || s.activateTimestamp === 0 });
    // If user is not allowed multiple sessions of this type, warn them
    if (pendingSessions.length >= 1 && typeLimit) {
      var messageBlock = 'Unable to create a new session of this type while one is active or pending activation!\n\
    You can delete a pending-activation session by typing `!session deactivate <sessionID>`\n\n\
    The following session(s) are pending activation:'
      // Add session id(s) to message block
      pendingSessions.forEach((s, i) => messageBlock += `\n   ${i + 1}: \`${s._id}\``)

      await routed.message.reply(messageBlock)
      return; // Stop here
    }

    ///////////////////////////////////
    // Create new session
    var newSession

    switch (type) {
      case 'lovense':
        newSession = new DeviceSession({
          sid: server._id,
          uid: user._id,
          type: type,
        })
        break;
    }

    // Commit record to db
    const insertedRecordID = await routed.bot.Sessions.add(newSession)

    await routed.message.channel.send(`New Device session (id:\`${insertedRecordID}\`) created!`)
    routed.bot.DEBUG_MSG_COMMAND(`!session new ${type}`)
  }

  export async function activateSession(routed: RouterRouted) {
    // Check if session is in the db
    var session = await routed.bot.Sessions.get({ _id: new ObjectID(routed.v.o.id) })
    var nsession: DeviceSession
    if (session) {
      // Verify if the session is still active - block if so
      if (session.isActive) {
        await routed.message.reply(`Cannot activate a session (id:\`${session._id}\`) thats already in progress!`)
        return; // Stop here
      }

      switch (session.type) {
        case 'lovense':
          nsession = new DeviceSession(session)
          break;
      }

      // Get the user who is calling the activate command to record their uid
      const user = await routed.bot.Users.get({ id: routed.message.author.id })

      // Update session details
      nsession.activateTimestamp = Date.now()
      // Update the record
      nsession.update()
      nsession.isActive = true
      nsession.activatedBy = user._id

      // Update db record
      const updateResult = await routed.bot.Sessions.update({ _id: session._id }, nsession)
      if (updateResult) await routed.message.reply(`Session id:\`${routed.v.o.id}\` activated!`)
      return; // Stop here
    }

    await routed.message.reply(`Session id:\`${routed.v.o.id}\` was not found!`)
  }

  export async function deactivateSession(routed: RouterRouted) {
    // Check if session is in the db
    var session = await routed.bot.Sessions.get({ _id: new ObjectID(routed.v.o.id) })
    if (session) {
      // Verify if the session is still active - block if so
      if (session.isActive) {
        await routed.message.reply(`Cannot deactivate a session (id:\`${session._id}\`) thats still in progress!`)
        return; // Stop here
      }

      switch (session.type) {
        case 'lovense':
          session = new DeviceSession(session)
          break;
      }

      // Get the user who is calling the deactivate command to record their uid
      const user = await routed.bot.Users.get({ id: routed.message.author.id })

      // Update session details
      session.deactivateTimestamp = Date.now()
      session.isActive = false
      session.isDeactivated = true
      session.deactivatedBy = user._id

      // Update db record
      const updateResult = await routed.bot.Sessions.update({ _id: session._id }, session)
      if (updateResult) await routed.message.reply(`Session id:\`${routed.v.o.id}\` deactivated!`)
      return; // Stop here
    }

    await routed.message.reply(`Session id:\`${routed.v.o.id}\` was not found!`)
  }
}