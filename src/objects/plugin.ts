/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs'
import * as path from 'path'

import { Bot } from '..'

export const PluginRegexPatterns = {
  author: /@author\s([a-z0-9\-]+)/i,
  name: /@name\s([a-z0-9\-]+)/i,
  pluginURL: /@pluginURL\s(https\:\/\/.*|[a-z0-9\-]+\/.*)/i,
  repo: /@repo\s(gitlab\:.*|github\:.*|https\:\/\/.*|[a-z0-9\-]+\/.*)/i,
  version: /@version\s([0-9]+\.[0-9]+\.[0-9]+)/i
}

export class Plugin {
  protected bot: Bot

  public autoCheckForUpdate?: boolean = true
  public config: {
    [key: string]: boolean | number | string | object
    plugin?: {
      enabled: boolean
      name: string
      repo
    }
  }
  public configFilePath: string
  public enabled?: boolean = false
  public name: string
  public pluginBodyString: string
  public pluginURL?: string
  public repo?: string
  public updateAvailable?: boolean = false
  public updateVersion?: string
  public verified?: boolean = false
  public version: string

  // Lifecycle points end plugin can set
  //public onDisabled?: void
  //public onEnabled?: void

  public get isEnabled() {
    return this.isEnabled
  }

  constructor(init?: Partial<Plugin>) {
    if (init) {
      this.name = init.name
      this.version = init.version
    }
  }

  private loadConfig(folder: string) {
    try {
      // Config files should be auto generated in the root of /plugins
      this.configFilePath = path.join(folder, `${this.name}.config.json`)
      console.log('🧩 Plugin config file expected:', this.configFilePath)
      // Check if config file exists in plugin root directory
      const exists = fs.existsSync(this.configFilePath)

      // When config exists for this plugin in the expected spot load it
      if (exists) Object.assign({}, this.config, this.loadConfigFromFile())
      // If not, make it
      else this.saveConfigToFile()
    } catch (error) {
      console.error(`🧩 Unable to process plugin config file for '${this.name}'`, error)
    }
  }

  private loadConfigFromFile() {
    return JSON.parse(fs.readFileSync(this.configFilePath, 'utf-8'))
  }

  private saveConfigToFile() {
    fs.writeFileSync(
      this.configFilePath,
      JSON.stringify(
        Object.assign(
          {
            plugin: {
              enabled: this.enabled,
              name: this.name,
              pluginURL: this.pluginURL,
              repo: this.repo,
              verified: this.verified,
              version: this.version
            }
          },
          this.config
        ),
        null,
        2
      )
    )
  }

  public async register(bot: Bot, pluginsDir: string, pluginBody: string, enabled: boolean, verified: boolean) {
    this.pluginBodyString = pluginBody

    // Set/Update Plugin Props from comment block
    this.name = (this.pluginBodyString.match(PluginRegexPatterns.name) || [])[1]
    this.pluginURL = (this.pluginBodyString.match(PluginRegexPatterns.pluginURL) || [])[1]
    this.repo = (this.pluginBodyString.match(PluginRegexPatterns.repo) || [])[1]
    this.version = (this.pluginBodyString.match(PluginRegexPatterns.version) || [])[1]

    // Prep Plugin
    this.bot = bot
    this.verified = verified
    this.enabled = enabled
    this.loadConfig(pluginsDir)

    if ((this as any).onEnabled) await (this as any).onEnabled()
  }

  public async unRegister() {
    try {
      if ((this as any).onDisabled) await (this as any).onDisabled()
    } catch (error) {
      console.error(`🧩 Unable to process .onDisabled for '${this.name}'`, error)
    }

    this.saveConfigToFile()
    this.enabled = false
    this.bot = undefined
  }
}
