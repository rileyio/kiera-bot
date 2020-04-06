import * as Agenda from 'agenda'
import { MongoClient, MongoClientOptions, Cursor, Db, MongoError, CollectionInsertManyOptions } from 'mongodb'
import { Logging } from '@/utils'

export * from './promise'
export * from './message-tracker'

export type Collections =
  | 'audit-log'
  | 'authkeys'
  | 'available-server-settings'
  | 'ck-running-locks'
  | 'ck-locktober'
  | 'ck-stats-hourly'
  | 'ck-users'
  | 'command-permissions'
  | 'decision'
  | 'decision-log'
  | 'messages'
  | 'muted-users'
  | 'notifications'
  | 'polls'
  | 'server-settings'
  | 'servers'
  | 'settings'
  | 'sessions'
  | 'stats-settings'
  | 'stats-servers'
  | 'stats-bot'
  | 'users'

export async function MongoDBLoader() {
  return new Promise<MongoDB>(async (ret) => {
    var db = new MongoDB()
    return ret(db)
  })
}

export class MongoDB {
  private connection: {
    db: Db
    client: MongoClient
    error: MongoError
  } = { db: undefined, client: undefined, error: undefined }
  private DEBUG_DB: Logging.Debug
  private dbName = `${process.env.DB_NAME}`
  private dbUrl = process.env.DB_STRING
  private dbOpts: MongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true, readPreference: 'primary' }

  constructor() {
    this.DEBUG_DB = new Logging.Debug(`database`, { console: false })
  }

  public async connect() {
    try {
      // Test if connection already exists, no need to open a new one if so
      if (this.connection.client) {
        // Check if connection is active
        if (!this.connection.client.isConnected()) await this.newConnection()
        // Else reuse current connection
        // console.log('reuse db connection on', targetCollection)
      } else {
        // console.log('new db connection on', targetCollection)
        this.DEBUG_DB.log('new db connection required!')
        await this.newConnection()
      }
    } catch (error) {
      this.connection.error = error
    }

    return this.connection
  }

  private async newConnection() {
    return new Promise((resolve, reject) => {
      const client = new MongoClient(this.dbUrl, this.dbOpts)
      client.connect((err) => {
        if (!err) {
          this.connection = { db: client.db(this.dbName), client: client, error: undefined }
          this.DEBUG_DB.log('new db connection: database connected!')
          return resolve()
        } else {
          this.DEBUG_DB.log('>>> failed to connect to Database!')

          this.connection.error = err
          return reject(err)
        }
      })
    })
  }

  public async ping() {
    var status: boolean
    try {
      const connection = await this.connect()

      const pingStatus = await connection.db.command({ ping: 1 })
      status = pingStatus ? true : false
    } catch (error) {
      // console.log('###### Test error failed to connect')
      status = false
    }
    return status
  }

  /**
   * Adds a new record to the DB
   * @param {T} record
   * @returns
   * @memberof DB
   */
  public async add<T>(targetCollection: Collections, record: T, opts?: {}) {
    const insertOptions = Object.assign({}, opts)
    this.DEBUG_DB.log(`.add =>`, targetCollection)
    const connection = await this.connect()
    const collection = connection.db.collection(targetCollection)
    const results = await collection.insertOne(record)
    this.DEBUG_DB.log(`.add results => inserted: ${results.insertedCount}, id: ${results.insertedId}`)
    // connection.client.close()
    return results.result.n === 1 ? results.insertedId : null
  }

  /**
   * Adds multiple records to the DB
   * @param {T} record
   * @returns
   * @memberof DB
   */
  public async addMany<T>(targetCollection: Collections, record: T[], opts?: CollectionInsertManyOptions) {
    this.DEBUG_DB.log(`.add =>`, targetCollection)
    const connection = await this.connect()
    const collection = connection.db.collection(targetCollection)
    const results = await collection.insertMany(record, opts)
    this.DEBUG_DB.log(`.add results => inserted: ${results.insertedCount}`)
    // connection.client.close()
    return results.result.n === 1 ? results.insertedCount : null
  }

  /**
   * Check if record is in the db
   * @param {string} id
   * @returns
   * @memberof DB
   */
  public async verify<T>(targetCollection: Collections, query: string | Partial<T>) {
    this.DEBUG_DB.log(`.verify => in`, targetCollection)
    const connection = await this.connect()
    const collection = connection.db.collection(targetCollection)
    const results = await collection.find<T>(typeof query === 'string' ? { id: query } : query)
    return (await results.count()) > 0
  }

  /**
   * Remove record from db
   * @param {string} id
   * @returns
   * @memberof DB
   */
  public async remove<T>(targetCollection: Collections, query: string | Partial<T>, opts?: { deleteOne?: boolean }) {
    const deleteOptions = Object.assign({ deleteOne: true }, opts)
    const connection = await this.connect()
    const collection = connection.db.collection(targetCollection)
    const deletionMethod = deleteOptions.deleteOne ? 'deleteOne' : 'deleteMany'
    const result = await collection[deletionMethod](typeof query === 'string' ? { id: query } : query)
    this.DEBUG_DB.log(`.update results => removed: ${result.result.n}`)
    // connection.client.close()
    return result.result.n
  }

  /**
   * Update stored record (or insert a new record if does not exist)
   * @param {Q} query
   * @param {T} update
   * @param {boolean} [upsert]
   * @returns
   * @memberof DB
   */
  public async update<T>(targetCollection: Collections, query: Partial<T>, update: any, opts?: { upsert?: boolean; updateOne?: boolean; atomic?: boolean }) {
    // this.DEBUG_DB.log(`.update =>`, query, update)
    const uopts = Object.assign({ atomic: false, upsert: false, updateOne: true }, opts)
    const connection = await this.connect()
    const collection = connection.db.collection(targetCollection)
    const result = uopts.updateOne
      ? await collection.updateOne(query, uopts.atomic ? update : { $set: update }, { upsert: uopts.upsert })
      : await collection.updateMany(query, uopts.atomic ? update : { $set: update }, { upsert: uopts.upsert })
    this.DEBUG_DB.log(`.update results =>`, result.result.n)
    // connection.client.close()
    return result.result.n
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
  public async get<T>(targetCollection: Collections, query: any, returnFields?: { [key: string]: number }) {
    this.DEBUG_DB.log(`.get => ${targetCollection}`)
    const connection = await this.connect()
    const collection = connection.db.collection(targetCollection)
    const result = await collection.findOne<T>(query, returnFields ? { projection: returnFields } : undefined)
    this.DEBUG_DB.log(`.get results [${targetCollection}] =>`, result ? true : false)
    // connection.client.close()
    return <T>result
  }

  /**
   * Fetch the latest record from the db
   *
   * This can accept one of the following formats in q:
   * - `object` `{ id: '146439529824256000', username: 'emma', discriminator: '1336' }`
   *
   * @param {Q} q
   * @returns
   * @memberof DB
   */
  public async getLatest<T>(targetCollection: Collections, query: any, opts: { returnFields?: { [key: string]: number }; limit?: number } = {}) {
    this.DEBUG_DB.log(`.getLatest => ${targetCollection}`)
    const connection = await this.connect()
    const collection = connection.db.collection(targetCollection)
    const result = collection
      .find<T>(query)
      .sort({ _id: -1 })
      .limit(opts.hasOwnProperty('limit') ? opts.limit : 1)
      .project(opts.hasOwnProperty('returnFields') ? opts.returnFields : undefined)
    this.DEBUG_DB.log(`.get results [${targetCollection}] =>`, result ? true : false)
    // connection.client.close()
    return await (<Cursor<T>>result).toArray()
  }

  /**
   * Fetch records from the db
   *
   * This can accept one of the following formats in q:
   * - `object` `{ id: '146439529824256000', username: 'emma', discriminator: '1336' }`
   *
   * @param {Q} q
   * @returns
   * @memberof DB
   */
  public async getMultiple<T>(targetCollection: Collections, query: any, returnFields?: { [key: string]: number }) {
    this.DEBUG_DB.log(`.getMultiple => ${targetCollection}`)
    const connection = await this.connect()
    const collection = connection.db.collection(targetCollection)
    const result = await collection.find<T>(query, returnFields ? { projection: returnFields } : undefined)
    this.DEBUG_DB.log(`.getMultiple results [${targetCollection}] =>`, await result.count())
    // connection.client.close()
    return (<Cursor<T>>result).toArray()
  }

  public async count<T>(targetCollection: Collections, query: Partial<T>, options?: any) {
    this.DEBUG_DB.log(`.count => ${targetCollection}`)
    const connection = await this.connect()
    const collection = connection.db.collection(targetCollection, options)
    const result = await collection.countDocuments(query)
    this.DEBUG_DB.log(`.count results [${targetCollection}] =>`, result)
    // connection.client.close()
    return <number>result
  }

  public async aggregate<T>(targetCollection: Collections, query: any) {
    this.DEBUG_DB.log(`.aggregate => ${targetCollection}`)
    const connection = await this.connect()
    const collection = connection.db.collection(targetCollection)
    const result = collection.aggregate(query)
    // this.DEBUG_DB.log(`.aggregate results [${targetCollection}] =>`, result)
    // connection.client.close()
    return (await result.toArray()) as Array<T>
  }

  // public get<Q, T>(query: Q, discriminator?: string) {
  //   return new Promise<T>(r => {
  //     this.connect(async (db: Db, client: MongoClient, err: MongoError) => {
  //       const collection = db.collection(targetCollection)
  //       const result = await collection.findOne<T>(query)
  //       client.close()
  //       r(result)
  //     })
  //   })
  // }
}
