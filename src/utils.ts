import * as Discord from 'discord.js'
import { Message, Channel, TextChannel } from "discord.js";

export interface TypeValidation {
  name: string
  type: string
  required?: boolean
  value?: boolean | number | string
  valid?: boolean
}

/**
 * Deletes a message from a textChannel
 * @export
 * @param {*} textChannel
 * @param {string} messageId
 */
export async function deleteMessage(textChannel: any, messageId: string, debug: debug.IDebugger) {
  // Find message in channel
  const msg: Discord.Message = await textChannel.fetchMessage(messageId)
  // Race Condition check: Double check something was found (that it wasn't deleted by a user too quick)
  // Delete message
  await msg.delete()
  debug(`deleted message id:${messageId} channelId:${textChannel.id}`)
}

export async function deleteAllMessages(textChannel: any) {
  const messages = await textChannel.fetchMessages()
  await messages.deleteAll()
}

/**
 * Get channel from a collection
 * @export
 * @template T
 * @param {Discord.Collection<string, Discord.Channel>} channelCollection
 * @param {string} channelId
 * @returns
 */
export function getChannel(channelCollection: Discord.Collection<string, Discord.Channel>, channelId: string) {
  const channel = channelCollection.array().find(ch => ch.id === channelId)
  return channel
}

export function getArgs(msg: string) {
  return msg.replace(/^\!/, '').split(' ')
}

export function validateArgs(args: Array<string>, validation: Array<TypeValidation>) {
  var allValid = true
  var ret: any = {}
  var validated = validation.map((v: TypeValidation, i: number) => {
    // Check if type matches
    v.valid = validateType(v.type, args[i])
    v.value = args[i]
    // Update allValid
    if (!v.valid) allValid = false
    // Add v to ret
    ret[v.name] = v.value
    return v
  })

  return { valid: allValid, validated: validated, o: ret }
}

export function validateType(expected: string, value: boolean | number | string) {
  if (expected === 'user')
    return /^(\@((?!@|#|:|`).)*\#[0-9]{4,5})$/i.test(value.toString())
  if (expected === 'string')
    return typeof value === 'string'
  if (expected === 'number') {
    return Number.isNaN(Number(value)) === false
  }
  if (expected === 'boolean')
    return value.toString().toLowerCase() === 'true' || value.toString().toLowerCase() === 'false'
  return false
}