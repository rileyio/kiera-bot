import * as Random from 'random'

export function sb<T>(baseString: string, data?: Partial<T>) {
  // Defaults to use if not passed in data
  const globals = {
    prefix: process.env.BOT_MESSAGE_PREFIX,
    'roll-[0-9]{1,3}-[0-9]{1,3}': (str: string) => roll(str)
  }

  // Merge data with global defaults
  Object.assign(globals, data || {})

  let final = String(baseString || ``)

  for (const key in globals) {
    const isFunc = typeof globals[key] === 'function'
    final = final.replace(new RegExp(`{{${key}}}`, 'img'), isFunc ? (matched: string) => globals[key](matched) : globals[key])
  }

  return final
}

function roll(str: string) {
  const regex = /{{roll-([0-9]{1,3})-([0-9]{1,3})}}/gim
  let m: RegExpExecArray
  let v1 = 0
  let v2 = 100

  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }

    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      // console.log(`Found match, group ${groupIndex}: ${match}`)
      if (groupIndex === 1) v1 = Number(match)
      if (groupIndex === 2) v2 = Number(match)
    })
  }

  // Perform randomize - with some added protections for out of bounds numbers
  const value = (Random as any).int(v1 <= v2 ? v1 : 0, v2 >= v1 ? v2 : v1)

  return value
}
