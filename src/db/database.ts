import * as NEDB from 'nedb';
import * as Debug from 'debug';

export interface ConfiguredDatabase {
  [key: string]: NEDB.DataStoreOptions
}

export const Databases: ConfiguredDatabase = {
  MESSAGES: { filename: './db/MESSAGES.db' },
  SERVERS: { filename: './db/SERVERS.db' },
  USERS: { filename: './db/USERS.db' }
}

export async function DBLoader<T>(connectionConfig: NEDB.DataStoreOptions) {
  return new Promise<DB<T>>((ret) => {
    var db = new DB<T>(connectionConfig);
    db.loadDB()
    return ret(db)
  })
}

export class DB<T> {
  public dbConnection: NEDB
  public DEBUG_DB: Debug.IDebugger

  constructor(connectionConfig: NEDB.DataStoreOptions) {
    this.DEBUG_DB = Debug('ldi:database')
    this.dbConnection = new NEDB(connectionConfig)

    this.DEBUG_DB(`starting up db: ${connectionConfig.filename}`)
  }

  public loadDB() {
    return this.dbConnection.loadDatabase()
  }

  /**
   * Adds a new record to the DB
   * @param {T} record
   * @returns
   * @memberof DB
   */
  public add(record: T) {
    return new Promise<T>((ret) => {
      this.dbConnection.insert<T>(record, (err, record) => {
        if (err) throw err
        return ret(record)
      })
    })
  }

  /**
   * Check if record is in the db
   * @param {string} id
   * @returns
   * @memberof DB
   */
  public verify<Q>(id: string) {
    return new Promise<boolean>((ret) => {
      this.dbConnection.find<T[]>({ id: id }, (err, record) => {
        if (err) throw err
        return ret(record.length > 0)
      })
    })
  }

  /**
   * Remove record from db
   * @param {string} id
   * @returns
   * @memberof DB
   */
  public remove<Q>(query: string | Q) {
    return new Promise<number>((ret) => {
      this.dbConnection.remove(typeof query === 'string' ? { id: query } : query, {}, (err, removed) => {
        if (err) throw err
        return ret(removed)
      })
    })
  }

  /**
   * Update stored record (or insert a new record if does not exist)
   * @param {Q} query
   * @param {T} update
   * @param {boolean} [upsert]
   * @returns
   * @memberof DB
   */
  public update<Q>(query: Q, update: T, upsert?: boolean) {
    return new Promise<number>((ret) => {
      // Need to remove _id from any updates sent as it will cause issues
      delete update['_id']

      this.dbConnection.update<T>(query, update, { upsert: upsert || false }, (err, updated) => {
        if (err) throw err
        return ret(updated)
      })
    })

  }

  /**
   * Fetch a record from the db
   * 
   * This can accept one of the following formats in q:
   * - `object` `{ id: '146439529824256000', username: 'emma', discriminator: '1336' }`
   * 
   * @param {Q} q
   * @returns
   * @memberof DB
   */
  public get<Q>(query: Q, discriminator?: string) {
    return new Promise<T>((ret) => {
      this.dbConnection.findOne<T>(query, (err, record) => {
        if (err) throw err
        return ret(record)
      })
    })
  }
}

export * from './messages'
export * from './users'