import * as Utils from '#utils'
import XRegex from 'xregexp'

export const validationRegex = XRegex('(\\/(?<name>[a-z0-9]*)(?<optional>\\?\\:|\\:|\\=|\\?\\=|(?<multi>\\.\\.\\.))(?<type>[a-z\\-]*))', 'img')

export interface ValidationType {
  multi: string
  name: string
  required?: boolean
  type: string
  valid?: boolean
  value?: boolean | number | string
}

export interface ValidationRegexMatch {
  multi: boolean
  name: string
  optional?: string
  required: boolean
  type: string
}

/**
 * ## Depreciated
 *
 * This was used to validate incoming messages against a regex signature
 * to parse out the arguments. This was replaced with slash commands
 * @export
 * @class Validate
 */
export class Validate {
  public readonly validation: Array<ValidationType>
  public readonly validationString: string
  public readonly signature: string

  constructor(validate: string) {
    this.validationString = validate
    // Convert string validate to object
    this.validation = this.validateFromStringParser(validate)
    // Generate regex signature
    this.signature = this.routeSignatureFromStr(validate)
  }

  public test(message: string) {
    const regex = XRegex(this.signature, 'ig')
    const match = XRegex.test(message, regex)
    return match
  }

  /**
   * Process incoming validation string into Validation objects
   * @param {string} str
   * @returns
   * @memberof Validate
   */
  public validateFromStringParser(str: string) {
    const matches = []
    XRegex.forEach(str, validationRegex, (match: any, i: number) => {
      matches.push(this.createValidationType(match))
    })

    return matches
  }

  /**
   * Basic type validator - Validates:
   * - `user` (this can be both a snowflake or @user#0000)
   * - `string`
   * - `number`
   * - `boolean`
   * @param {string} expected
   * @param {(boolean | number | string)} value
   * @returns
   * @memberof Validate
   */
  public validateType(expected: string, value: boolean | number | string) {
    if (expected === 'user')
      // From a server channel it should look like: <@146439529824256000>
      // Check that first
      return /^\<\@([0-9]*)\>$/i.test(value.toString()) || /^(\@((?!@|#|:|`).*)\#[0-9]{4,5})$/i.test(value.toString())
    if (expected === 'string-number') return Number.isNaN(Number(value)) === false
    if (expected === 'string') return typeof value === 'string'
    if (expected === 'number') {
      return Number.isNaN(Number(value)) === false
    }
    if (expected === 'boolean') return value.toString().toLowerCase() === 'true' || value.toString().toLowerCase() === 'false'
    return false
  }

  /**
   * Validates the chat arguments against the TypeValidations provided to determine
   * if all arguments meet the defined type
   * @export
   * @param {Array<string>} args
   * @param {Array<TypeValidation>} validation
   * @returns
   */
  public validateArgs(args: Array<string>) {
    let allValid = true
    const ret: any = {}
    const validationMap = JSON.parse(JSON.stringify(this.validation))
    const validated = validationMap.map((v: ValidationType, i: number) => {
      const singleStrRegexp = /^["]([^"].+)["]\s?$/im
      const multiStrRegexp = /^["]([^"].+)["]\s?$/gim
      const isMulti = v.multi
      // If its a single non-multi arg value expected
      if (!isMulti) {
        // is wrapped by quotes
        const isWrappedByQuotes = singleStrRegexp.test(args[i])
        // Store in a temp variable to determine in the next step if something was found in the regex.exec
        const _tempValRegex = isWrappedByQuotes ? singleStrRegexp.exec(args[i]) : args[i]
        const _tempVal = Array.isArray(_tempValRegex) ? _tempValRegex[1] : args[i]

        // Check if type matches
        v.valid = this.validateType(v.type, _tempVal)

        if (v.type === 'user') v.value = Utils.User.extractUserIdFromString(args[i])
        if (v.type === 'string') v.value = _tempVal

        // Fix: If expected type is valid and is a number but for this type convert it back to a string
        if (v.type === 'string-number' && v.valid) v.value = String(_tempVal)

        // Fix: If expected type is valid and is a number, convert it to a number
        if (v.type === 'number' && v.valid) v.value = Number(_tempVal)
        // Update allValid
        if (!v.valid && v.required) {
          // If the value fails a check (or is empty) but IS required
          allValid = false
        }
        // Add v to ret
        ret[v.name] = v.value
        return v
      } else {
        const sliced = args.slice(i).map((v) => {
          return v.substr(1, v.length - 2)
        })

        // console.log('sliced', sliced)

        v.valid = multiStrRegexp.test(sliced.join(' '))
        if (!v.valid && v.required) {
          // If the value fails a check (or is empty) but IS required
          allValid = false
        }
        // Add v to ret
        ret[v.name] = sliced
        return v
      }
    })

    return {
      o: ret,
      valid: allValid,
      validated: validated
    }
  }

  public routeSignatureFromStr(str: string) {
    let sig = `^`
    const parts = [] as Array<{ name: string; optional: string }>

    XRegex.forEach(str, validationRegex, (match: any, i: number) => parts.push(match))
    parts.forEach((match: any, i: number) => {
      // // Handling for 'text block' values
      // if (match.optional === '*=') {
      //   sig += `'[\\"|\\']?([\\w-\\:\\@\\_\\#\\s+]+)[\\"|\\']?\\s?'`
      // }

      // Handling for multiple args
      if (match.optional === '...') {
        sig += `(["|']{1}.+["|']{1})\\s?`
      }

      // Handling of static route values
      if (match.optional === ':' || match.optional === '?:') {
        sig += match.optional === '?:' ? `(${match.name})` : `(${match.name})`
        // Add set space to optional if next is an optional param and there is one
        if (i < parts.length - 1)
          if (parts[i + 1].optional === '?:' || parts[i + 1].optional === '?=') sig += `\\s?`
          else sig += `\\s`
      }

      // Handling for user's input values
      if (match.optional === '=' || match.optional === '?=') {
        if (match.type === 'user') sig += `(\\@[\\w\\s-]*\\#[0-9]+|\\<\\@[0-9]*\\>)\\s?`
        else sig += match.optional === '?=' ? `(?:["]?([^"+]+)["]?\s?)?` : `["]?([^"+]+)["]?\\s?`
      }

      // console.log(`${i + 1}/${parts.length}`, sig)
      // if (i < parts.length - 1) console.log(i, parts[i + 1].optional, parts[i + 1].optional === '?:' || parts[i + 1].optional === '?=')
    })

    // Add end of string $
    sig += '$'

    // console.log(sig)

    return sig
  }

  /**
   * Generate Validation object
   * @private
   * @param {ValidationRegexMatch} match
   * @returns
   * @memberof Validate
   */
  private createValidationType(match: ValidationRegexMatch) {
    return {
      multi: match.multi !== undefined,
      name: match.name,
      required: match.optional === ':' || match.optional === '=' ? true : false,
      type: match.type,
      valid: undefined,
      value: undefined
    }
  }
}
