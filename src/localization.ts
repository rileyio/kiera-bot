import * as Handlebars from 'handlebars'
import * as YAML from 'yaml'
import * as dotProp from 'dot-prop'
import * as fs from 'fs'
import * as glob from 'fast-glob'

import { Logger } from '@/utils'

const DEFAULT_LOCALE = process.env.BOT_LOCALE

export default class Localization {
  private loaded: {
    [locale: string]: {
      strings: { [key: string]: string }
    }
  } = {}
  private logger: Logger.Debug

  /**
   * Get short codes of locales loaded
   * @readonly
   * @type {string}
   * @memberof Localization
   */
  public get langs(): string {
    return `[${Object.keys(this.loaded).join(', ')}]`
  }

  /**
   * Strings count for default locale
   * @readonly
   * @type {number}
   * @memberof Localization
   */
  public get stringsCount(): number {
    return this.countStrings(this.loaded[DEFAULT_LOCALE].strings)
  }

  constructor(logger: Logger.Debug) {
    this.logger = logger
    // Load Localization Files into Memory for better performance times on responses
    try {
      this.localeLoader()
    } catch (error) {
      console.error('ResponseRenderer.localeLoader() => Fatal error!')
    }
  }

  /**
   * Count of strings available under the given locale
   * @private
   * @memberof Localization
   */
  private countStrings = (o: object): number => Object.keys(o).reduce((t, k) => (typeof o[k] === 'object' ? (t += this.countStrings(o[k])) : (t += 1)), 0)

  /**
   * Locale file loader
   * @private
   * @memberof Localization
   */
  private localeLoader() {
    // Load lang strings from folder
    const localizationFiles = glob.sync(['locales/**/*.yml'], { deep: 5 })

    // Load each file using the name as the root key
    localizationFiles.forEach((locFile) => {
      // Wrapped in a try to make more safe when loading and errors are present
      this.logger.verbose('Loading localization file:', locFile)
      try {
        const loadedFile = this.yamlFileParse(locFile, fs.readFileSync(locFile.toString(), 'utf8'))
        // Test if file returns undefined
        if (loadedFile) {
          // If lang is not yet loaded, create space for it
          if (!this.loaded[loadedFile.locale]) {
            this.loaded[loadedFile.locale] = { strings: loadedFile.strings }
          } else {
            Object.assign(this.loaded[loadedFile.locale].strings, loadedFile.strings)
          }
        }
      } catch (e) {
        this.logger.warn(`ResponseRenderer.localeLoader() [ERROR] => ${locFile.toString()}, ${e.message}`)
      }
    })
  }

  /**
   * Internal Yaml file's string parser
   * @private
   * @param {string} filePath
   * @param {string} data
   * @returns
   * @memberof Localization
   */
  private yamlFileParse(filePath: string, data: string) {
    try {
      const fromPath = String(filePath)
        .split('/')
        .map((s) => s.replace(/\.|yml/g, ''))

      const lang = fromPath[1]
      const strings = YAML.parse(data)

      return { locale: lang, strings: strings }
    } catch (error) {
      console.error('Error loading Localization', error)
      return null
    }
  }

  // /**
  //  * Download/Refresh locales from POEditor
  //  * @memberof Localization
  //  */
  // public async download() {
  //   const resp = await got('https://api.poeditor.com/v2/projects/export', { method: 'POST', responseType: 'json' })
  // }

  /**
   * Render localized string
   * @template T
   * @param {string} locale - The locale to use
   * @param {string} key - Key path to find the locale string
   * @param {(boolean | object | T)} [fallback] - `[Optional]` Override for if fallback to the base locale should happen
   * @returns {string} - Rendered string as output in target locale
   * @memberof Localization
   */
  public $render<T>(locale: string, key: string, fallback?: boolean | object | T): string
  /**
   * Render localized string
   * @template T
   * @param {string} locale - The locale to use
   * @param {string} key - Key path to find the locale string
   * @param {(boolean | object | T)} [data] - `[Optional]` Arguments for template rendering
   * @returns {string} - Rendered string as output in target locale
   * @memberof Localization
   */
  public $render<T>(locale: string, key: string, data?: boolean | object | T) {
    // Check if locale exists
    if (this.loaded[locale]) {
      const targetString: string = dotProp.get(this.loaded[locale].strings, key)
      // Check if string is translated - if not: fallback
      if (targetString) {
        const templ = Handlebars.compile(targetString, data as T | object)
        return templ(data)
      }
    }

    // Check if its fallback being passed for the 3rd arg
    if (typeof data === 'boolean' && data === false) return
    // Fallback
    const templ = Handlebars.compile(dotProp.get(this.loaded[DEFAULT_LOCALE].strings, key))
    return templ(data)
  }

  /**
   * Check if locale exists
   * @param {string} locale - Locale short code
   * @returns {boolean}
   * @memberof Localization
   */
  public $localeExists(locale: string): boolean {
    return !!this.loaded[locale]
  }

  /**
   * Check if locale string exists
   * @param {string} locale - Locale short code
   * @param {string} key - String key path
   * @returns {boolean}
   * @memberof Localization
   */
  public $localeStringExists(locale: string, key: string): boolean {
    return !!dotProp.get(this.loaded[locale].strings, key)
  }

  /**
   * Helper to return Locale Contributors for the given locale
   * @param {string} locale - Locale short code
   * @returns {string}
   * @memberof Localization
   */
  public $localeContributors(locale: string) {
    return dotProp.get(this.loaded[locale].strings, 'Locale.Contributors')
  }

  /**
   * Helper to return locale options
   * @returns {string}
   * @memberof Localization
   */
  public $locales() {
    const longestLocaleCode = 5
    let longestLocaleName = 0

    // Find longest name
    Object.keys(this.loaded).forEach((l) => {
      const localeName = (dotProp.get(this.loaded[l].strings, 'Locale.Name') as string) || '<Missing Locale Description>'
      if (localeName) longestLocaleName = longestLocaleName < localeName.length ? localeName.length : longestLocaleName
    })

    return (
      '```' +
      Object.keys(this.loaded)
        .map((l) => {
          const stringsTranslated = this.countStrings(this.loaded[l])
          const localeCodeExists = this.$localeStringExists(l, 'Locale.Code')
          const localeNameExists = this.$localeStringExists(l, 'Locale.Name')
          const localeDescExists = this.$localeStringExists(l, 'Locale.ShortDescription')
          const localeCode = localeCodeExists ? this.$render(l, 'Locale.Code', l === DEFAULT_LOCALE ? undefined : false) : ''
          const localeName = localeNameExists ? this.$render(l, 'Locale.Name', l === DEFAULT_LOCALE ? undefined : false) : '<Missing Locale Name>'
          const localeDesc = localeDescExists ? this.$render(l, 'Locale.ShortDescription', l === DEFAULT_LOCALE ? undefined : false) : '<Missing Locale Description>'

          // Format # with leading 0 if below 10%
          const percTranslated = Math.round((stringsTranslated / this.stringsCount) * 100)
          const percTranslatedStr =
            (stringsTranslated / this.stringsCount) * 100 < 10 ? ` 0${percTranslated}%` : percTranslated === 100 ? `${percTranslated}%` : ` ${percTranslated}%`

          if (localeCodeExists) {
            return `[${percTranslatedStr}] ${localeCode} ${Array.from(Array(longestLocaleCode + 2 - localeCode.length)).join('.')} ${localeName} ${Array.from(
              Array(longestLocaleName + 2 - localeName.length)
            ).join('.')} ${localeDesc}`
          }

          // Fallback: return empty string
          return ''
        })
        .join('\n') +
      '```'
    )
  }
}
