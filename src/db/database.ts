import { BotStatistics, ServerStatistic } from '@/objects/statistics'
import { CollectionInsertManyOptions, Db, FilterQuery, MongoClient, MongoClientOptions, MongoError, ObjectId, QuerySelector, UpdateQuery } from 'mongodb'
import { RunningLocksLock, UserData } from 'chastikey.js/app/objects'
import { TrackedDecision, TrackedDecisionLogEntry } from '@/objects/decision'
import { TrackedMutedUser, TrackedUser } from '@/objects/user'

import { AuditEntry } from '@/objects/audit'
import { Bot } from '../'
import { ChastiKeyLocktoberData } from '@/objects/chastikey'
import { TrackedMessage } from '@/objects/message'
import { TrackedPoll } from '@/objects/poll'
import { TrackedServer } from '@/objects/server'
import { TrackedSession } from '@/objects/session'
import { read as getSecret } from '@/secrets'
import { mongoDot_lvl2 } from 'mongo_dottype'
import { performance } from 'perf_hooks'

export * from './promise'
export * from './message-tracker'

export type Collections = {
  'audit-log': AuditEntry
  'available-server-settings': any
  'ck-running-locks': RunningLocksLock
  'ck-locktober-2019': ChastiKeyLocktoberData
  'ck-locktober-2020': ChastiKeyLocktoberData
  'ck-locktober-2021': ChastiKeyLocktoberData
  'ck-stats-daily': any
  'ck-users': UserData
  'command-permissions': any
  decision: TrackedDecision
  'decision-log': TrackedDecisionLogEntry
  messages: TrackedMessage
  'muted-users': TrackedMutedUser
  notifications: any
  polls: TrackedPoll
  'scheduled-jobs': any
  'server-settings': any
  servers: TrackedServer
  settings: any
  sessions: TrackedSession
  'stats-settings': any
  'stats-servers': ServerStatistic
  'stats-bot': BotStatistics
  users: TrackedUser
}

export async function MongoDBLoader(bot: Bot) {
  return new Promise<MongoDB>(async (ret) => {
    return ret(new MongoDB(bot || undefined))
  })
}

export class MongoDB {
  private Bot: Partial<Bot>
  private connection: {
    db: Db
    client: MongoClient
    error: MongoError
  }
  private dbName = `${process.env.DB_NAME}`
  private dbUrl: string
  private dbOpts: MongoClientOptions = {
    readPreference: 'primary',
    useNewUrlParser: true,
    useUnifiedTopology: true
  }

  constructor(bot: Bot) {
    this.Bot = bot
    this.dbUrl = getSecret('DB_STRING', this.Bot.Log.Bot)
  }

  public async connect() {
    try {
      // Test if connection already exists, no need to open a new one if so
      if (!this.connection) {
        // console.log('new db connection on', targetCollection)
        this.Bot.Log.Database.log('new db connection required!')
        await this.newConnection()
      } else {
        // Check if connection client is set
        if (this.connection.client) {
          // Check if connection is active
          if (!this.connection.client.isConnected()) await this.newConnection()
          // Else reuse current connection
          // console.log('reuse db connection on', targetCollection)
        } else {
          // console.log('new db connection on', targetCollection)
          this.Bot.Log.Database.log('new db connection required!')
          await this.newConnection()
        }
      }
    } catch (error) {
      console.log('❌ db connection rejection error', error)
      this.connection.error = error
    }

    return this.connection
  }

  private async newConnection() {
    return new Promise((resolve, reject) => {
      const client = new MongoClient(
        this.dbUrl,
        Object.assign(this.dbOpts, {
          readPreference: process.env.DB_READ_PREFERENCE ? process.env.DB_READ_PREFERENCE : undefined,
          useNewUrlParser: String(process.env.DB_USE_NEWURLPARSER || '').toLowerCase() === 'true',
          useUnifiedTopology: String(process.env.DB_USE_UNIFIEDTOPOLOGY || '').toLowerCase()
        })
      )

      client.connect((err) => {
        if (!err) {
          this.connection = {
            client: client,
            db: client.db(this.dbName),
            error: undefined
          }
          this.Bot.Log.Database.log('new db connection: database connected!')
          return resolve(true)
        } else {
          this.Bot.Log.Database.error('>>> failed to connect to Database!')

          this.connection.error = err
          return reject(err)
        }
      })
    })
  }

  public async ping() {
    let status: boolean
    try {
      const connection = await this.connect()
      const pingStatus = await connection.db.command({ ping: 1 })
      status = pingStatus ? true : false
      this.Bot.Log.Database.debug(`ping success!`)
    } catch (error) {
      this.Bot.Log.Database.error(`ping failed!`, error)
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
  public async add<T extends keyof Collections>(
    targetCollection: T,
    record: Omit<mongoDot_lvl2<Collections[T]>, '_id'> & { _id?: ObjectId | object } & QuerySelector<Collections[T]>
  ): Promise<boolean> {
    const performanceStart = performance.now()
    this.Bot.Log.Database.debug(`[${targetCollection}].add =>`, targetCollection)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const results = await collection.insertOne(record)
      this.Bot.Log.Database.debug(
        `[${targetCollection}].add results [${Math.round(performance.now() - performanceStart)}ms] => inserted: ${results.insertedCount}, id: ${results.insertedId}`
      )
      return results.result.n === 1 ? results.insertedId : null
    } catch (error) {
      this.Bot.Log.Database.warn(`[${targetCollection}].add error`, error)
      return null
    }
  }

  /**
   * Adds multiple records to the DB
   * @param {T} record
   * @returns
   * @memberof DB
   */
  public async addMany<T extends keyof Collections>(targetCollection: T, record: Array<Partial<Collections[T]>>, opts?: CollectionInsertManyOptions): Promise<number> {
    const performanceStart = performance.now()
    this.Bot.Log.Database.debug(`[${targetCollection}].addMany =>`, targetCollection)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const results = await collection.insertMany(record, opts)
      this.Bot.Log.Database.debug(`[${targetCollection}].addMany results [${Math.round(performance.now() - performanceStart)}ms] => inserted: ${results.insertedCount}`)
      return results.result.n === 1 ? results.insertedCount : null
    } catch (error) {
      this.Bot.Log.Database.error(`[${targetCollection}].addMany error`, error)
      return null
    }
  }

  /**
   * Check if record is in the db
   * @param {string} id
   * @returns
   * @memberof DB
   */
  public async verify<T extends keyof Collections>(
    targetCollection: T,
    query: string | (Omit<mongoDot_lvl2<Collections[T]>, '_id'> & { _id?: ObjectId | object } & QuerySelector<Collections[T]>)
  ): Promise<boolean> {
    const performanceStart = performance.now()
    this.Bot.Log.Database.debug(`.verify =>`, targetCollection)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const results = collection.find<T>(typeof query === 'string' ? { id: query } : query)
      this.Bot.Log.Database.debug(`[${targetCollection}].verify [${Math.round(performance.now() - performanceStart)}ms] => ${results.count()}`, query)
      return (await results.count()) > 0
    } catch (error) {
      this.Bot.Log.Database.error(`[${targetCollection}].verify error`, error)
      return null
    }
  }

  /**
   * Remove record from db
   * @param {string} id
   * @returns
   * @memberof DB
   */
  public async remove<T extends keyof Collections>(
    targetCollection: T,
    query: string | (Omit<mongoDot_lvl2<Collections[T]>, '_id'> & { _id?: ObjectId | object } & QuerySelector<Collections[T]>),
    opts?: { deleteOne?: boolean }
  ): Promise<number> {
    const performanceStart = performance.now()
    this.Bot.Log.Database.debug(`.remove =>`, targetCollection)
    try {
      const deleteOptions = Object.assign({ deleteOne: true }, opts)
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const deletionMethod = deleteOptions.deleteOne ? 'deleteOne' : 'deleteMany'
      const result = await collection[deletionMethod](typeof query === 'string' ? { id: query } : query)
      this.Bot.Log.Database.debug(`[${targetCollection}].update results [${Math.round(performance.now() - performanceStart)}ms] => removed: ${result.result.n}`)
      return result.result.n
    } catch (error) {
      this.Bot.Log.Database.error(`[${targetCollection}].remove error`, error)
      return null
    }
  }

  /**
   * Update stored record (or insert a new record if does not exist)
   * @param {Q} query
   * @param {T} update
   * @param {boolean} [upsert]
   * @returns
   * @memberof DB
   */
  public async update<T extends keyof Collections>(
    targetCollection: T,
    query: Omit<mongoDot_lvl2<Collections[T] & FilterQuery<Collections[T]>>, '_id'>,
    update: UpdateQuery<Collections[T]> | Partial<Collections[T]>,
    opts?: { upsert?: boolean; updateOne?: boolean; atomic?: boolean }
  ): Promise<number> {
    const performanceStart = performance.now()
    this.Bot.Log.Database.debug(`.update =>`, targetCollection)
    try {
      const uopts = Object.assign(
        {
          atomic: false,
          updateOne: true,
          upsert: false
        },
        opts
      )
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const result = uopts.updateOne
        ? await collection.updateOne(query, uopts.atomic ? update : { $set: update }, { upsert: uopts.upsert })
        : await collection.updateMany(query, uopts.atomic ? update : { $set: update }, { upsert: uopts.upsert })
      this.Bot.Log.Database.debug(`[${targetCollection}].update results [${Math.round(performance.now() - performanceStart)}ms] =>`, result.result.n)
      // connection.client.close()
      return result.result.n
    } catch (error) {
      this.Bot.Log.Database.error(`[${targetCollection}].update error`, error)
      return null
    }
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
  public async get<T extends keyof Collections>(
    targetCollection: T,
    query: Omit<mongoDot_lvl2<Collections[T] & FilterQuery<Collections[T]>>, '_id'>,
    returnFields?: { [key in keyof Collections[T]]: number }
  ): Promise<Collections[T]> {
    const performanceStart = performance.now()
    this.Bot.Log.Database.debug(`[${targetCollection}].get => ${targetCollection}`)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const result = await collection.findOne<Collections[T]>(query, returnFields ? { projection: returnFields } : undefined)
      this.Bot.Log.Database.debug(`[${targetCollection}].get [${Math.round(performance.now() - performanceStart)}ms] =>`, result ? true : false)
      return result
    } catch (error) {
      this.Bot.Log.Database.error(`[${targetCollection}].get error`, error)
      return null
    }
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
  public async getLatest<T extends keyof Collections>(
    targetCollection: T,
    query: Omit<mongoDot_lvl2<Collections[T] & FilterQuery<Collections[T]>>, '_id'>,
    opts: { returnFields?: { [key: string]: number }; limit?: number } = {}
  ): Promise<Array<Collections[T]>> {
    const performanceStart = performance.now()
    this.Bot.Log.Database.debug(`[${targetCollection}].getLatest => ${targetCollection}`)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const result = collection
        .find<Collections[T]>(query)
        .sort({ _id: -1 })
        .limit(opts.hasOwnProperty('limit') ? opts.limit : 1)
        .project(opts.hasOwnProperty('returnFields') ? opts.returnFields : undefined)
      this.Bot.Log.Database.debug(`[${targetCollection}].get [${Math.round(performance.now() - performanceStart)}ms] =>`, result ? true : false)
      // connection.client.close()
      return await result.toArray()
    } catch (error) {
      this.Bot.Log.Database.error(`[${targetCollection}].getLatest error`, error)
      return []
    }
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
  public async getMultiple<T extends keyof Collections>(
    targetCollection: T,
    query: Omit<mongoDot_lvl2<Collections[T] & FilterQuery<Collections[T]>>, '_id'>,
    returnFields?: { [key: string]: number }
  ) {
    const performanceStart = performance.now()
    this.Bot.Log.Database.debug(`[${targetCollection}].getMultiple => ${targetCollection}`)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const result = collection.find<Collections[T]>(query, returnFields ? { projection: returnFields } : undefined)
      this.Bot.Log.Database.debug(`[${targetCollection}].getMultiple [${Math.round(performance.now() - performanceStart)}ms] =>`, await result.count())
      // connection.client.close()
      return result.toArray()
    } catch (error) {
      this.Bot.Log.Database.error(`[${targetCollection}].getMultiple error`, error)
      return []
    }
  }

  public async count<T extends keyof Collections>(targetCollection: T, query: Omit<mongoDot_lvl2<Collections[T] & FilterQuery<Collections[T]>>, '_id'>, options?: any) {
    const performanceStart = performance.now()
    this.Bot.Log.Database.debug(`[${targetCollection}].count => ${targetCollection}`)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection, options)
      const result = await collection.countDocuments(query)
      this.Bot.Log.Database.debug(`[${targetCollection}].count [${Math.round(performance.now() - performanceStart)}ms] =>`, result)
      // connection.client.close()
      return <number>result
    } catch (error) {
      this.Bot.Log.Database.error(`[${targetCollection}].count error`, error)
      return null
    }
  }

  public async aggregate<T>(targetCollection: keyof Collections, query: Array<object>) {
    const performanceStart = performance.now()
    this.Bot.Log.Database.debug(`[${targetCollection}].aggregate => ${targetCollection}`)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const result = collection.aggregate(query)
      this.Bot.Log.Database.debug(`.aggregate results [${Math.round(performance.now() - performanceStart)}ms] =>`, result.readableLength)
      // connection.client.close()
      return (await result.toArray()) as Array<T>
    } catch (error) {
      this.Bot.Log.Database.error(`[${targetCollection}].aggregate error`, error)
      return null
    }
  }

  public async distinct<T extends keyof Collections>(targetCollection: T, field: string): Promise<Array<string>> {
    const performanceStart = performance.now()
    this.Bot.Log.Database.debug(`[${targetCollection}].distinct => ${targetCollection}`)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const result = await collection.distinct(field)
      this.Bot.Log.Database.debug(`[${targetCollection}].distinct [${Math.round(performance.now() - performanceStart)}ms] =>`, result ? true : false)
      // connection.client.close()
      return result
    } catch (error) {
      this.Bot.Log.Database.error(`[${targetCollection}].distinct error`, error)
      return null
    }
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
