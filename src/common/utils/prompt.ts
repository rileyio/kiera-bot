// import * as Utils from '#utils'

// import { Collection, Message, TextChannel } from 'discord.js'

// import { RouterRouted } from '#router/index'

// export interface PromptUserInput {
//   expectedTerminator?: string
//   // deleteFirstMessageAtEnd?: boolean
//   // deleteResponseAtEnd?: boolean
//   firstMessage: string
//   maxToCollect?: number
//   onTimeoutErrorMessage?: string
//   waitFor?: number
// }

// export interface PromptUserConfirm {
//   expectedValidResponse?: string
//   expectedValidCancel?: string
//   deleteFirstMessageAtEnd?: boolean
//   deleteResponseAtEnd?: boolean
//   firstMessage: string
//   onTimeoutErrorMessage?: string
//   waitFor?: number
// }

// export async function promptUserInput(routed: RouterRouted, options: PromptUserInput) {
//   return new Promise<Collection<string, Message>>(async (resolve) => {
//     // Send first message in prompt process
//     const firstMessage = await routed.message.reply(options.firstMessage)

//     // Filter to watch for the correct user (OPTIONAL: & text to be sent)
//     const filter = (response: Message) => response.author.id === routed.author.id

//     // Message collector w/Filter - Wait up to a max of 5 mins for user input
//     const collector = routed.message.channel.createMessageCollector({ filter, max: options.maxToCollect, time: options.waitFor || 300000 })

//     collector.on('collect', (m: Message) => {
//       if (m.cleanContent.replace(/\s/m, '') === ':end') {
//         // Remove :end from collected
//         collector.collected.delete(collector.collected.lastKey())
//         console.log('Reason ended manually!')
//         collector.stop('Manually Ended')
//       }
//     })

//     collector.on('end', async (collected) => {
//       console.log(`Collected ${collected.size} items`)
//       if (collector.endReason === 'time') await routed.message.channel.send(options.onTimeoutErrorMessage)

//       return resolve(collector.collected)
//     })
//   })
// }

// export async function promptUserConfirm(routed: RouterRouted, options: PromptUserConfirm) {
//   try {
//     // Send first message in prompt process
//     const firstMessage = await routed.message.reply(options.firstMessage)

//     // Filter to watch fo the correct user (OPTIONAL: & text to be sent)
//     const filter =
//       typeof options.expectedValidResponse === 'string'
//         ? options.expectedValidCancel === 'string'
//           ? (response: Message) =>
//               (response.content.toLowerCase().replace(' ', '') === options.expectedValidResponse ||
//                 response.content.toLowerCase().replace(' ', '') === options.expectedValidCancel) &&
//               response.author.id === routed.author.id
//           : (response: Message) => response.content.toLowerCase().replace(' ', '') === options.expectedValidResponse && response.author.id === routed.author.id
//         : (response: Message) => response.author.id === routed.author.id

//     // Message collector w/Filter - Wait up to a max of 1 min for exactly 1 reply from the required user
//     const collected = await routed.message.channel.awaitMessages({ errors: ['time'], filter, max: 1, time: options.waitFor || 60000 })

//     if (options.deleteFirstMessageAtEnd) {
//       // Delete the first message send at this stage
//       await Utils.Channel.deleteMessage(routed.message.channel as TextChannel, firstMessage.id)
//     }

//     if (options.deleteResponseAtEnd) {
//       // Delete the previous message at this stage
//       await Utils.Channel.deleteMessage(routed.message.channel as TextChannel, collected.first().id)
//     }

//     // If expected response was to cancel, return false
//     if (options.expectedValidResponse) {
//       if (collected.first().cleanContent.toLowerCase().replace(' ', '') === options.expectedValidCancel) return false
//     }

//     // Boolean only if searching for an exact match
//     return options.expectedValidResponse ? true : collected
//   } catch (error) {
//     if (options.onTimeoutErrorMessage) await routed.message.channel.send(options.onTimeoutErrorMessage)
//     return false
//   }
// }
