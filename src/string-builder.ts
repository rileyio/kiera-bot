export function sb(baseString: string, data?: any) {
  // Defaults to use if not passed in data
  var globals = {
    prefix: process.env.BOT_MESSAGE_PREFIX
  }

  // Merge data with global defaults
  Object.assign(globals, data || {})

  var final = baseString || ``

  for (const key in globals) {
    final = final.replace(new RegExp(`{{${key}}}`, 'img'), globals[key])
  }

  return final
}

export * from './strings/en';