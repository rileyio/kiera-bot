import { ObjectID } from 'bson'
import * as crypto from 'crypto-js'

export class AuthKey {
  public readonly _id: ObjectID
  public uid: ObjectID
  public hash: string
  public used: number = 0
  public isActive: boolean = true

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
    const key = `${username}:${index}:${crypto
      .SHA256(Math.random().toString())
      .toString()
      .substr(0, 8)}`
    this.hash = username + `:${index}:` + crypto.SHA256(key)

    // Return user's key and not storing
    return key
  }
}
