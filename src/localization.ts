import * as YAML from 'yaml'
import * as fs from 'fs'
import * as glob from 'fast-glob'
import * as dotProp from 'dot-prop'
import * as Handlebars from 'handlebars'

// TODO: Remove following later - using for Local & rendering setup
import { sb } from '@/utils'

export default class Localization {
  private loaded: {
    [locale: string]: {
      strings: { [key: string]: string }
    }
  } = {}

  public get langs(): string {
    return `[${Object.keys(this.loaded).join(', ')}]`
  }

  public get stringsCount(): number {
    return this.countStrings(this.loaded.en.strings)
  }

  constructor() {
    // Load Localization Files into Memory for better performance times on responses
    try {
      this.templateLoader()
    } catch (error) {
      console.error('ResponseRenderer.templateLoader() => Fatal error!')
    }
  }

  private countStrings = (o: object): number => Object.keys(o).reduce((t, k) => (typeof o[k] === 'object' ? (t += this.countStrings(o[k])) : (t += 1)), 0)

  private templateLoader() {
    // Load lang strings from folder
    const localizationFiles = glob.sync(['locales/**/*.yml'], { deep: 5 })

    // Load each file using the name as the root key
    localizationFiles.forEach((locFile) => {
      // Wrapped in a try to make more safe when loading and errors are present
      console.log('Loading localization file:', locFile)
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
        console.log(`ResponseRenderer.templateLoader() [ERROR] => ${locFile.toString()}, ${e.message}`)
      }
    })
  }

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

  public $render<T>(locale: string, key: string, fallback?: boolean | object | T): string
  public $render<T>(locale: string, key: string, data?: boolean | object | T) {
    // Check if its fallback being passed for the 3rd arg
    if (typeof data === 'boolean' && data === false) return
    // Check if locale exists
    if (this.loaded[locale]) {
      const targetString: string = dotProp.get(this.loaded[locale].strings, key)
      // Check if string is translated - if not: fallback to en
      if (targetString) {
        return sb(targetString, data)
      }
    }
    // Fallback: en
    // return sb(dotProp.get(this.loaded['en'].strings, key), data)
    const templ = Handlebars.compile(dotProp.get(this.loaded['en'].strings, key))
    return templ(data)
  }

  public $localeExists(locale: string) {
    return !!this.loaded[locale]
  }

  public $localeStringExists(locale: string, key: string) {
    return !!dotProp.get(this.loaded[locale].strings, key)
  }

  public $localeContributors(locale: string) {
    return dotProp.get(this.loaded[locale].strings, 'Locale.Contributors')
  }

  public $locales() {
    return Object.keys(this.loaded)
      .map((l) =>
        this.$localeStringExists(l, 'Locale.Code')
          ? `\`${this.$render(l, 'Locale.Code', l === 'en' ? undefined : false)}\` - (\`${this.$render(l, 'Locale.Language', l === 'en' ? undefined : false)}\`) ${this.$render(
              l,
              'Locale.ShortDescription',
              l === 'en' ? undefined : false
            )}`
          : ''
      )
      .join('\n')
  }
}
