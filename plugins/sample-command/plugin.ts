/**
 * @name sample-command
 * @pluginURL https://raw.githubusercontent.com/rileyio/sample-command/main/plugin.ts
 * @repo rileyio/sample-command
 * @version 1.0.3
 */

import { RouteConfiguration, Routed } from '../../src/router/index'

import { Plugin } from '../../src/index'
import { SlashCommandBuilder } from 'discord.js'

export class SampleCommandPlugin extends Plugin {
  config = { testProp: false }
  routes = [
    new RouteConfiguration({
      category: 'Plugin/Sample',
      controller: this.routeCommand,
      name: 'test',
      permissions: {
        defaultEnabled: false,
        serverOnly: false
      },
      plugin: this,
      slash: new SlashCommandBuilder().setName('test').setDescription('Testing Plugin'),
      type: 'discord-chat-interaction'
    })
  ]

  constructor() {
    super()
    console.log('SampleCommand Plugin Loaded')
  }

  onEnabled = async () => {
    console.log('test loaded')
  }

  onDisabled = async () => {
    console.log('test unloaded')
  }

  public async routeCommand(plugin: SampleCommandPlugin, routed: Routed<'discord-chat-interaction'>) {
    console.log('routeCommand')
    return await routed.reply('Should Reply', true)
  }
}

export default function () {
  return new SampleCommandPlugin()
}
