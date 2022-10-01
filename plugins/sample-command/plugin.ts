/**
 * @name sample-command
 * @pluginURL https://raw.githubusercontent.com/rileyio/sample-command/main/plugin.ts
 * @repo rileyio/sample-command
 * @version 1.0.1
 */

import { Plugin } from '../../src/index'
import { RoutedInteraction } from '../../src/router'
import { SlashCommandBuilder } from 'discord.js'

export class SampleCommandPlugin extends Plugin {
  config = { testProp: false }

  constructor() {
    super()
    console.log('SampleCommand Plugin Loaded')
  }

  public async onEnabled() {
    await this.bot.Router.addRoute({
      category: 'Plugin',
      controller: this.routeCommand,
      name: 'test',
      permissions: {
        defaultEnabled: false,
        serverOnly: false
      },
      plugin: this,
      slash: new SlashCommandBuilder().setName('test').setDescription('Testing Plugin'),
      type: 'interaction'
    })
  }

  public async onDisabled() {
    await this.bot.Router.removeRoute('test')
  }

  public async routeCommand(plugin: SampleCommandPlugin, routed: RoutedInteraction) {
    console.log('routeCommand')
    return await routed.reply('Should Reply', true)
  }
}

export default function () {
  return new SampleCommandPlugin()
}
