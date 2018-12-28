import * as Nedb from 'nedb';
import * as Debug from 'debug';

export interface ConfiguredNEDBDatabase {
  [key: string]: Nedb.DataStoreOptions
}

export const Databases: ConfiguredNEDBDatabase = {
  MESSAGES: { filename: './db/MESSAGES.db' },
  SERVERS: { filename: './db/SERVERS.db' },
  USERS: { filename: './db/USERS.db' }
}

export async function NEDBLoader<T>(connectionConfig: Nedb.DataStoreOptions) {
  return new Promise<NEDB<T>>((ret) => {
    var db = new NEDB<T>(connectionConfig);
    db.loadDB()
    return ret(db)
  })
}

export class NEDB<T> {
  public dbConnection: Nedb
  public DEBUG_DB: Debug.IDebugger

  // public dbUrl = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}`
  // public dbName = `${process.env.DB_NAME}`
  // public client = new MongoClient(this.dbUrl);

  constructor(connectionConfig: Nedb.DataStoreOptions) {
    this.DEBUG_DB = Debug('ldi:database')
    this.dbConnection = new Nedb(connectionConfig)

    this.DEBUG_DB(`starting up db: ${connectionConfig.filename}`)
  }

  // public connectTest() {
  //   return new Promise(r => {
  //     this.client.connect(async (err) => {
  //       assert.equal(null, err);
  //       console.log("Connected successfully to server");
  //       const db = this.client.db(this.dbName);

  //       r(this.client.close())
  //     });
  //   })
  // }

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

export * from './database-mongo'
export * from './messages'
export * from './users'