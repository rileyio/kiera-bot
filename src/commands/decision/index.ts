import * as DecisionAdd from './add.cmd'
import * as DecisionCreation from './create.cmd'
import * as DecisionDelete from './delete.cmd'
import * as DecisionNickname from '@/commands/decision/nickname.cmd'
import * as DecisionPrefix from '@/commands/decision/prefix.cmd'
import * as DecisionRemove from '@/commands/decision/remove.cmd'
import * as DecisionRoll from '@/commands/decision/roll.cmd'
import * as DecisionRollCustomize from '@/commands/decision/customize'
import * as DecisionRollList from '@/commands/decision/list.cmd'
import * as Middleware from '@/middleware'

import { AcceptedResponse, ExportRoutes, RouteConfiguration, Routed } from '@/router'

import { SlashCommandBuilder } from '@discordjs/builders'

export const Routes = ExportRoutes(
  new RouteConfiguration({
    category: 'Fun',
    controller: decisionRouterSub,
    middleware: [Middleware.isUserRegistered],
    name: 'decision',
    permissions: {
      defaultEnabled: false,
      serverOnly: false
    },
    slash: new SlashCommandBuilder()
      .setName('decision')
      .setDescription('Decision Rolls Utilize User Generated Outcomes')
      // * Add to decision roller
      .addSubcommand((subcommand) =>
        subcommand
          .setName('add')
          .setDescription('Add Something to Decision Roll')
          .addStringOption((option) => option.setName('id').setDescription('Specify the ID or Nickname of the Decision Roller').setRequired(true))
          .addStringOption((option) => option.setName('target').setDescription('What do you wish to add?').setRequired(true).addChoices({ name: 'Outcome', value: 'outcome' }))
          .addStringOption((option) => option.setName('value').setDescription('Please supply the value to add').setRequired(true))
          .addStringOption((option) =>
            option
              .setName('type')
              .setDescription('Change the display type of the outcome value')
              .setRequired(false)
              .setChoices(
                { name: 'Text (Default)', value: 'string' },
                { name: 'Image URL', value: 'image' },
                { name: 'Web Address', value: 'url' },
                { name: 'Markdown (Beta)', value: 'markdown' }
              )
          )
      )
      // * Create a new decision roller
      .addSubcommand((subcommand) =>
        subcommand
          .setName('create')
          .setDescription('Create new Decision Roll')
          .addStringOption((option) => option.setName('title').setDescription('Please Supply the new Decision Roller with a Title').setRequired(true))
      )
      // * Delete from/decision roller
      .addSubcommand((subcommand) => subcommand.setName('delete').setDescription('Delete a Decision Roller'))
      // * Directly interact with Decision Rolls
      .addSubcommand((subcommand) =>
        subcommand
          .setName('roll')
          .setDescription('Roll User Generated Decision')
          .addStringOption((option) => option.setName('id').setDescription('Specify the ID or Nickname of the Decision Roller').setRequired(true))
      )
      // * Set Nickname for Decision Roller
      .addSubcommand((subcommand) =>
        subcommand
          .setName('nickname')
          .setDescription('A Nicknamed Roller is Easier to Share With Other Users and is More Memorable')
          .addStringOption((option) => option.setName('id').setDescription('Specify the ID or Nickname of the Decision Roller').setRequired(true))
          .addStringOption((option) => option.setName('nickname').setDescription('A Nicknamed Roller is Easier to Share With Other Users and is More Memorable').setRequired(true))
      )
      // * Set Prefix for Decision Rolls that have a Nickname
      .addSubcommand((subcommand) =>
        subcommand
          .setName('prefix')
          .setDescription('Set a Custom Prefix for your Decision Rollers, Example: emma:nickname')
          .addStringOption((option) => option.setName('prefix').setDescription('Specify Prefix to use for your Authored Decision Rollers').setRequired(true))
      )
      // * Remove Decision Roller Outcome
      .addSubcommand((subcommand) => subcommand.setName('remove').setDescription('Remove Outcome from Decision Roll'))
      // * List Owned or Managed Decision Rollers
      .addSubcommand((subcommand) => subcommand.setName('list').setDescription('Fetch a List of Decision Rolls Where You are the Creator or are Listed as a Manager.')),
    // .addSubcommand((subcommand) =>
    //   subcommand.setName('web').setDescription('View Web Decision Editor')
    // )
    type: 'discord-chat-interaction'
  })
)

async function decisionRouterSub(routed: Routed<'discord-chat-interaction'>): AcceptedResponse {
  const subCommand = routed.options.getSubcommand() as 'add' | 'create' | 'delete' | 'nickname' | 'prefix' | 'remove' | 'roll' | 'manage' | 'list'
  const idOrNickname = routed.interaction.options.get('id')?.value
  // const interactionType = routed.interaction.options.get('type')?.value

  // Roll w/ID or Nickname is specified
  if (subCommand === 'roll' && idOrNickname) {
    return await DecisionRoll.runSavedDecision(routed)
  }

  // Customize Roller
  if (subCommand === 'manage' && idOrNickname) {
    return await DecisionRollCustomize.customUsername(routed)
  }

  // List Decisions
  if (subCommand === 'list') {
    return await DecisionRollList.list(routed)
  }

  // New Decision
  if (subCommand === 'create') {
    return await DecisionCreation.newDecision(routed)
  }

  // New Decision Outcome
  if (subCommand === 'add') {
    const interactionTarget = routed.interaction.options.get('target')?.value
    if (interactionTarget === 'outcome') return await DecisionAdd.addOutcome(routed)
  }

  // Delete Decision Roller
  if (subCommand === 'delete') {
    return await DecisionDelete.deleteDecision(routed)
  }

  // Remove Outcome from Decision Roller
  if (subCommand === 'remove') {
    return await DecisionRemove.removeOutcome(routed)
  }

  // Set Decision Roll Nickname
  if (subCommand === 'nickname') {
    return await DecisionNickname.setNickname(routed)
  }

  // Set Decision Roller Nickname Prefix
  if (subCommand === 'prefix') {
    return await DecisionPrefix.setPrefix(routed)
  }

  // Nothing has been specified
  return await routed.reply('A Decision Menu Option Must be Selected.')
}
