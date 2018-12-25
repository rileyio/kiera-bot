import * as NEDB from 'nedb';
import { TrackedUser } from '../objects/user';

var UsersDB = new NEDB({
  filename: './db/USERS.db',
  autoload: true
});

export interface TrackedUserQuery {
  id?: string
  username?: string
  discriminator?: string
}

export class UserDB {
  /**
   * Adds a new user to the DB
   * @param {TrackedUser} user
   * @returns
   * @memberof UserDB
   */
  public add(user: TrackedUser) {
    // Use update as it's setup for upserting and will prevent accidental record
    // duplication
    return this.update(user)
  }

  /**
   * Check if user is registered in the db
   * @param {string} id
   * @returns
   * @memberof UserDB
   */
  public verify(id: string) {
    return new Promise<boolean>((ret) => {
      UsersDB.find<TrackedUser[]>({ id: id }, (err, user) => {
        if (err) throw err
        return ret(user.length > 0)
      })
    })
  }

  /**
   * Remove user from db
   * @param {string} id
   * @returns
   * @memberof UserDB
   */
  public remove(query: string | TrackedUserQuery) {
    return new Promise<number>((ret) => {
      UsersDB.remove(typeof query === 'string' ? { id: query } : query, {}, (err, removed) => {
        if (err) throw err
        return ret(removed)
      })
    })
  }

  /**
   * Update stored user (or insert a new record if does not exist)
   * @param {TrackedUser} user
   * @returns
   * @memberof UserDB
   */
  public update(user: TrackedUser) {
    return new Promise<TrackedUser>((ret) => {
      UsersDB.update<TrackedUser>({ id: user.id }, user, { upsert: true }, (err, updated) => {
        if (err) throw err
        return ret(user)
      })
    })
  }

  /**
   * Fetch a user from the db
   * 
   * This can accept one of the following formats in q:
   * - `snowflake` 146439529824256000
   * - `username` @user#0000
   * - `object` `{ id: '146439529824256000', username: 'emma', discriminator: '1336' }`
   * 
   * @param {(string | TrackedUserQuery)} q
   * @returns
   * @memberof UserDB
   */
  public get(q: string | TrackedUserQuery, discriminator?: string) {
    return new Promise<TrackedUser>((ret) => {
      var query: string | TrackedUserQuery = q;

      // if passed is just an ID <@146439529824256000>
      if (typeof q === 'string' && !Number.isNaN(Number(q)))
        query = { id: q }
      // if passed is a username
      if (typeof q === 'string' && Number.isNaN(Number(q)))
        query = { username: q, discriminator: discriminator }
      // if passed is an object
      if (typeof q === 'object')
        query = q

      UsersDB.findOne<TrackedUser>(query, (err, user) => {
        if (err) throw err
        return ret(user)
      })
    })
  }
}