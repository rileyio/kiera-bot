// import { Request, Response } from 'restify'
// import { parse, serialize } from 'cookie'

// export type Cookies = { [key: string]: string }

// export function parseCookies(req: Request): Cookies {
//   return req.headers.cookie ? parse(req.headers.cookie) : {}
// }

// export function setCookie(res: Response, name: string, value: string, options: { maxAge: number }): void {
//   console.warn('More Dev needed!')
//   const currentCookies = res.getHeader('Set-Cookie')
//   // When 'Set-Cookie' is already set, we need to append the new cookie to the existing ones
//   if (currentCookies) {
//     const cookiesArray = Array.isArray(currentCookies) ? currentCookies : [currentCookies as string]
//     cookiesArray.push(serialize(name, value, options))
//     res.setHeader('Set-Cookie', cookiesArray)

//     return // Stop here
//   }

//   // No 'Set-Cookie' header set yet, so we can just set it
//   res.set('Set-Cookie', serialize(name, value, options))
// }
