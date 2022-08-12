import * as fs from 'fs'
import * as glob from 'fast-glob'
import * as path from 'path'

import { Plugin, PluginRegexPatterns } from '@/objects/plugin'

import { Bot } from '.'
import { Logger } from '@/utils'
import axios from 'axios'
import gitly from 'gitly'

import importFresh = require('import-fresh')

enum UpdateType {
  None,
  Patch,
  Minor,
  Major
}

type PluginLoaded = {
  name: string
  path: string
  plugin: Plugin
  reloadRequested?: boolean
}

type PluginVerified = {
  name: string
  repo: string
}

export class PluginManager {
  private bot: Bot
  private folder: string
  private log: Logger.Debug
  private plugins: Array<PluginLoaded> = []
  private verified: Array<PluginVerified> = [{ name: 'sample-command', repo: 'rileyio/sample-command' }]

  constructor(bot: Bot) {
    this.bot = bot
    this.log = this.bot.Log.Plugin

    // Configure the PluginManager
    this.folder = path.resolve(path.join(`${__dirname}/../plugins`))
    this.log.debug('🧩 Configired Path for Plugin Storage:', this.folder)
    this.log.debug(
      '🧩 Items in Plugins Folder:',
      fs
        .readdirSync(this.folder, { withFileTypes: true })
        .filter((dir) => dir.isDirectory())
        .map((dir) => dir.name)
    )

    // Load whatever is in /Plugins
    ;(async () => await this.loader())()
  }

  private async loader() {
    const pluginFiles = glob.sync([path.resolve(`${this.folder}/**/{index,plugin}.ts`)])
    this.log.verbose('🗂️  Plugins Scan Found:', pluginFiles.length, ', Currently Loaded:', this.plugins.length)

    // Process each plugin and perform On-load checks
    for (let index = 0; index < pluginFiles.length; index++) {
      const pluginFile = pluginFiles[index]

      // Skip Plugins that have been loaded already (unless upon rescan a reload has been flagged)
      const found = this.plugins.find((p) => p.path === pluginFile)
      const reload = found ? found.reloadRequested || false : false
      if (found && !reload) continue

      // Wrapped in a try to make more safe when loading and errors are present
      try {
        const pluginBodyString = fs.readFileSync(pluginFile, 'utf-8')
        const pluginName = (pluginBodyString.match(PluginRegexPatterns.name) || [])[1]
        const pluginRepo = (pluginBodyString.match(PluginRegexPatterns.repo) || [])[1]

        // If plugin file/folder  is renamed but is a duplicate by name, stop it from loading
        if (this.plugins.find((p) => p.name === pluginName)) continue

        // Check if plugin is on the verified list
        const pluginVerified = this.verified.findIndex((p) => p.name === pluginName && p.repo === pluginRepo) > -1

        // Load file
        const requiredFile = importFresh(pluginFile) as { default: () => Plugin }
        // Test if file returns undefined
        if (requiredFile !== undefined) {
          const loaded = requiredFile.default()

          // Try to register the Bot instance with the plugin
          await loaded.register(this.bot, this.folder, pluginBodyString, true, pluginVerified)
          this.log.verbose(`🧩 Plugin Loaded: ${loaded.name}@${loaded.version}`)

          // If Auto Updating is enabled
          if (loaded.autoCheckForUpdate) this.checkForUpdate(loaded)

          // Track loaded Plugin
          this.plugins.push({
            name: loaded.name,
            path: pluginFile,
            plugin: loaded
          })
        } else {
          throw new Error(`🧩 Plugin Load Failure: ${pluginFile}`)
        }
      } catch (error) {
        this.log.error(error.message)
      }
    }
  }

  private checkVersionDiff(oldVersion: string, newVersion: string) {
    const oldVersionSplit = oldVersion.split('.').map((i) => Number(i))
    const newVersionSplit = newVersion.split('.').map((i) => Number(i))

    const major = newVersionSplit[0] > oldVersionSplit[0]
    const minor = newVersionSplit[1] > oldVersionSplit[1]
    const patch = newVersionSplit[2] > oldVersionSplit[2]

    if (major) return { type: UpdateType.Major }
    if (minor && newVersionSplit[0] >= oldVersionSplit[0]) return { type: UpdateType.Minor }
    if (patch && newVersionSplit[0] >= oldVersionSplit[0] && newVersionSplit[1] >= oldVersionSplit[1]) return { type: UpdateType.Patch }
    return { type: UpdateType.None }
  }

  public async checkForUpdate(plugin: Plugin) {
    this.log.verbose(`🧩 Checking for update for '${plugin.name}@${plugin.version}' at ${plugin.pluginURL}`)

    try {
      const { data, status } = await axios.get(plugin.pluginURL)
      if (status === 200 && data) {
        // When an Update is available
        const onlneVersion = (data.match(PluginRegexPatterns.version) || [])[1]
        if (this.checkVersionDiff(plugin.version, onlneVersion).type !== UpdateType.None) {
          this.log.verbose(`🧩 Plugin Update Available '${plugin.name}'@${onlneVersion}`)
          plugin.updateAvailable = true
          plugin.updateVersion = onlneVersion
          await this.downloadUpdate(plugin, data)
        }
      }
    } catch (error) {
      this.log.error(`🧩 Unable to check for update '${plugin.name}'`, error)
    }
  }

  public async downloadUpdate(plugin: Plugin, newPluginData?: string) {
    this.log.log(`🧩 Fetching Update '${plugin.name}@${plugin.updateVersion}'...`)

    // Verified plugins can download the entire repo
    if (plugin.verified && plugin.repo) {
      this.log.verbose('🧩 Downloading Repo:', plugin.repo)

      // Target path of plugin
      const targetDir = `${this.folder}/${plugin.name}`

      // Delete old
      fs.rmSync(targetDir, { force: true, recursive: true })

      // Download repo
      await gitly(plugin.repo, targetDir, { force: true })
      this.log.verbose(`🧩 Extracted '${plugin.name}@${plugin.updateVersion}' to:`, targetDir)
    }
    // UnVerified plugins only download the single plugin.ts file
    else {
      if (!fs.existsSync(`${this.folder}/${plugin.name}`)) fs.mkdirSync(`${this.folder}/${plugin.name}`)
      fs.writeFileSync(`${this.folder}/${plugin.name}/plugin.ts`, newPluginData)
    }

    // Unload existing plugin
    await this.unloadPlugin(plugin)

    // Perform .loader() scan to pick up the changed plugin files
    this.loader()
  }

  public async unloadPlugin(plugin: string | Plugin) {
    const pluginIndex = this.plugins.findIndex((p) => p.name === (typeof plugin === 'string' ? (plugin as string) : (plugin as Plugin).name))
    const pluginFound = pluginIndex > -1 ? this.plugins[pluginIndex] : undefined

    // Prevent race condition and ensure plugin could still be found in collection
    if (pluginFound)
      try {
        await pluginFound.plugin.unRegister()
        this.plugins.splice(pluginIndex, 1)
        this.log.log(`🧩 Unloaded Plugin '${pluginFound.name}'`)
      } catch (error) {
        this.log.error(`🧩 Unable to process .unloadPlugin for '${pluginFound.name}'`, error)
      }
  }
}