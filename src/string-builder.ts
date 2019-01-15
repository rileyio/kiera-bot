export function sb(baseString: string, data?: any) {
  var final = baseString || ``

  if (data !== undefined) {
    for (const key in data) {
      final = final.replace(new RegExp(`{{${key}}}`, 'img'), data[key])
    }
  }

  return final
}

export * from './strings/en';