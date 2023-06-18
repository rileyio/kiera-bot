import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'

import { Plugin, PluginRegexPatterns } from '#objects/plugin'

import { Bot } from '.'
import { Logger } from '#utils'
import axios from 'axios'
import gitly from 'gitly'
import glob from 'fast-glob'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

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
  private verified: Array<PluginVerified> = [
    { name: 'sample-command', repo: 'rileyio/sample-command' },
    { name: 'raider-io', repo: 'rileyio/raider-io' }
  ]

  public get pluginsCount() {
    return this.plugins.length
  }

  public get pluginsActive() {
    return [
      ...this.plugins.map((p) => {
        return {
          name: p.name,
          path: p.path,
          updateAvailable: p.plugin.updateAvailable,
          updateVersion: p.plugin.updateVersion,
          version: p.plugin.version
        }
      })
    ]
  }

  constructor(bot: Bot) {
    this.bot = bot
    this.log = this.bot.Log.Plugin

    // Configure the PluginManager
    console.log(path.resolve(path.join(`${__dirname}/../plugins`)))
    this.folder = path.resolve(path.join(`${__dirname}/../plugins`))
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
        const pluginVersion = (pluginBodyString.match(PluginRegexPatterns.version) || [])[1]

        // If plugin file/folder  is renamed but is a duplicate by name, stop it from loading
        if (this.plugins.find((p) => p.name === pluginName)) continue

        // Check if plugin is on the verified list
        const pluginVerified = this.verified?.findIndex((p) => p.name === pluginName && p.repo === pluginRepo) > -1

        // Load file
        const requiredFile = (await import(`${pluginFile}?version=${pluginVersion || Date.now()}`)) as { default: () => Plugin }

        // Test if file returns undefined
        if (requiredFile !== undefined) {
          const loaded = requiredFile.default()

          // Try to register the Bot instance with the plugin
          await loaded.register(this.bot, this.folder, pluginBodyString, true, pluginVerified)
          this.log.verbose(`🧩 Plugin Loaded ${pluginVerified ? '(✔)' : ''}: ${loaded.name}@${loaded.version}`)

          // Load any routes for the plugin
          if (loaded.routes && loaded.routes.length) loaded.routes.forEach((route) => this.bot.Router.addRoute(route))

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

  private async loadExisting(plugin: Plugin) {
    // Try to register the Bot instance with the plugin
    await plugin.register(this.bot, this.folder, plugin.pluginBodyString, true, plugin.verified)
    this.log.verbose(`🧩 Plugin Loaded ${plugin.verified ? '(✔)' : ''}: ${plugin.name}@${plugin.version}`)

    // Load any routes for the plugin
    if (plugin.routes && plugin.routes.length) plugin.routes.forEach((route) => this.bot.Router.addRoute(route))

    // If Auto Updating is enabled
    if (plugin.autoCheckForUpdate) this.checkForUpdate(plugin)
  }

  public async checkForUpdates() {
    console.log('checking for updates')
    for (let index = 0; index < this.plugins.length; index++) {
      const { plugin } = this.plugins[index]

      // Check for plugin update
      if (plugin.isEnabled) await this.checkForUpdate(plugin)
    }
  }

  public async checkForUpdate(plugin: Plugin, download?: boolean) {
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
          if (download) await this.downloadUpdate(plugin, data)
        } else this.log.verbose(`🧩 '${plugin.name}'@${onlneVersion} no update available.`)
      }
    } catch (error) {
      this.log.error(`🧩 Unable to check for update '${plugin.name}'`, error)
    }
  }

  public async downloadUpdate(plugin: Plugin, newPluginData?: string) {
    this.log.log(`🧩 Fetching Update '${plugin.name}@${plugin.updateVersion}'...`)
    try {
      // Verified plugins can download the entire repo
      if (plugin.verified && plugin.repo) {
        this.log.verbose('🧩 Downloading Repo:', plugin.repo)

        // Target path of plugin
        const targetDir = `${this.folder}/${plugin.name}`

        // Delete old
        // if a .git folder is detected, remove everything else
        const isGitDir = fs.existsSync(`${targetDir}/.git`)
        if (isGitDir) {
          fs.readdir(targetDir, (err, items) => {
            if (err) this.log.error('🧩 Error Clearing .git project directory in prep for an update')

            items.forEach((f) => {
              if (f === '.git') return
              const item = path.join(targetDir, '/', f)
              const itemStat = fs.lstatSync(item)
              this.log.verbose('🗑️ Deleting', item, fs.lstatSync(item).isDirectory() ? 'directory' : 'file')
              if (itemStat.isDirectory()) fs.rmSync(item, { force: true, recursive: true })
              if (itemStat.isFile()) fs.rmSync(item, { force: true })
            })
          })
        } else fs.rmSync(targetDir, { force: true, recursive: true })

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
      await this.loader()

      // Check to see if new plugin version was loaded in .loader() scan
      const newVersionPlugin = this.getPlugin(plugin.name)

      if (newVersionPlugin) await this.bot.reloadSlashCommands()

      console.log('newVersionPlugin', newVersionPlugin.plugin.version === plugin.updateVersion)

      return newVersionPlugin.plugin.version === plugin.updateVersion
    } catch (error) {
      return false
    }
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

  public async setup() {
    this.log.debug('🧩 Configired Path for Plugin Storage:', this.folder)
    this.log.debug(
      '🧩 Items in Plugins Folder:',
      fs
        .readdirSync(this.folder, { withFileTypes: true })
        .filter((dir) => dir.isDirectory())
        .map((dir) => dir.name)
    )

    // Load whatever is in /Plugins
    await this.loader()
  }

  public getPlugin(plugin: string | Plugin) {
    return this.plugins.find((p) => p.name === (typeof plugin === 'string' ? (plugin as string) : (plugin as Plugin).name))
  }

  public async reloadPlugin(plugin: string | Plugin) {
    const pluginFound = this.getPlugin(plugin)
    console.log('pluginFound', pluginFound)

    if (!pluginFound) return { error: 'Plugin not found', successful: false }
    await this.unloadPlugin(pluginFound.plugin)
    await this.loadExisting(pluginFound.plugin)
    return { error: undefined, successful: true }
  }
}
