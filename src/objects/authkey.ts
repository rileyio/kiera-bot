import * as crypto from 'crypto-js'

import { ObjectId } from 'bson'

export class AuthKey {
  public readonly _id: ObjectId
  public uid: ObjectId
  public hash: string
  public used = 0
  public isActive = true

  constructor(init?: Partial<AuthKey>) {
    Object.assign(this, init || {})
  }

  public test(key: string) {
    // console.log(key)
    const keyHashed = crypto.SHA256(key).toString()
    // console.log('keyHashed', keyHashed)
    const hashSplit = this.hash.split(':')
    // console.log('hashSplit', hashSplit[2])
    return keyHashed === hashSplit[2]
  }

  public generate(username: string, index: number) {
    const key = `${username}:${index}:${crypto.SHA256(Math.random().toString()).toString().substr(0, 8)}`
    this.hash = username + `:${index}:` + crypto.SHA256(key)

    // Return user's key and not storing
    return key
  }
}
