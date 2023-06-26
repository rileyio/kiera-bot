/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Utils from '#utils'

import { BotStatistics, ServerStatistic } from '#objects/statistics'
import { BulkWriteOptions, Db, Filter, MongoClient, MongoClientOptions, MongoError, ObjectId, UpdateFilter } from 'mongodb'
import { TrackedDecision, TrackedDecisionLogEntry } from '#objects/decision'
import { TrackedMutedUser, TrackedUser } from '#objects/user/index'

import { AuditEntry } from '#objects/audit'
import { ManagedChannel } from '#objects/managed'
import { StoredServer } from '#objects/server'
import { TrackedMessage } from '#objects/message'
import { TrackedPoll } from '#objects/poll'
import { TrackedSession } from '#objects/session'
import { read as getSecret } from '#secrets'
import { mongoDot_lvl2 } from 'mongo_dottype'
import { performance } from 'perf_hooks'

export type Collections = {
  'audit-log': AuditEntry
  'available-server-settings': any
  'command-permissions': any
  decision: TrackedDecision
  'decision-log': TrackedDecisionLogEntry
  managed: ManagedChannel
  messages: TrackedMessage
  'muted-users': TrackedMutedUser
  notifications: any
  polls: TrackedPoll
  'scheduled-jobs': any
  'server-settings': any
  servers: StoredServer
  settings: any
  sessions: TrackedSession
  'stats-settings': any
  'stats-servers': ServerStatistic
  'stats-bot': BotStatistics
  users: TrackedUser
}

export async function MongoDBLoader(logger: Utils.Logger.Debug) {
  return new Promise<MongoDB>(async (ret) => {
    return ret(new MongoDB(logger || undefined))
  })
}

export class MongoDB {
  private log: Utils.Logger.Debug
  private connection: {
    db: Db
    client: MongoClient
    error: MongoError
  }
  private dbName = `${process.env.DB_NAME}`
  private dbOpts: MongoClientOptions = {
    readPreference: 'primary'
  }

  constructor(logger: Utils.Logger.Debug) {
    this.log = logger
  }

  public async connect() {
    try {
      // Test if connection already exists, no need to open a new one if so
      if (!this.connection) {
        // console.log('new db connection on', targetCollection)
        this.log.log('new db connection required!')
        await this.newConnection()
      } else {
        // Check if connection client is set
        if (this.connection.client) {
          // Else reuse current connection
          // console.log('reuse db connection on', targetCollection)
        } else {
          // console.log('new db connection on', targetCollection)
          this.log.log('new db connection required!')
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
    const client = new MongoClient(
      getSecret('DB_STRING', this.log),
      Object.assign(this.dbOpts, {
        readPreference: process.env.DB_READ_PREFERENCE ? process.env.DB_READ_PREFERENCE : undefined,
        useNewUrlParser: String(process.env.DB_USE_NEWURLPARSER || '').toLowerCase() === 'true',
        useUnifiedTopology: String(process.env.DB_USE_UNIFIEDTOPOLOGY || '').toLowerCase()
      })
    )

    try {
      await client.connect()
      this.connection = {
        client: client,
        db: client.db(this.dbName),
        error: undefined
      }
      this.log.log('new db connection: database connected!')
      return true
    } catch (error) {
      this.log.error('>>> failed to connect to Database!')
      this.connection.error = error
      return false
    }
  }

  public async ping() {
    let status: boolean
    try {
      const connection = await this.connect()
      const pingStatus = await connection.db.command({ ping: 1 })
      status = pingStatus ? true : false
      this.log.debug(`ping success!`)
    } catch (error) {
      this.log.error(`ping failed!`, error)
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
  public async add<T extends keyof Collections>(targetCollection: T, record: Filter<Collections[T]>): Promise<ObjectId> {
    const performanceStart = performance.now()
    this.log.debug(`[${targetCollection}].add =>`, targetCollection)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const results = await collection.insertOne(record)
      this.log.debug(`[${targetCollection}].add results [${Math.round(performance.now() - performanceStart)}ms] => inserted: ${results.acknowledged}, id: ${results.insertedId}`)
      return results.acknowledged ? results.insertedId : null
    } catch (error) {
      this.log.warn(`[${targetCollection}].add error`, error)
      return null
    }
  }

  /**
   * Adds multiple records to the DB
   * @param {T} record
   * @returns
   * @memberof DB
   */
  public async addMany<T extends keyof Collections>(targetCollection: T, record: Array<Partial<Collections[T]>>, opts?: BulkWriteOptions): Promise<number> {
    const performanceStart = performance.now()
    this.log.debug(`[${targetCollection}].addMany =>`, targetCollection)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const results = await collection.insertMany(record, opts)
      this.log.debug(`[${targetCollection}].addMany results [${Math.round(performance.now() - performanceStart)}ms] => inserted: ${results.insertedCount}`)
      return results.insertedCount === 1 ? results.insertedCount : null
    } catch (error) {
      this.log.error(`[${targetCollection}].addMany error`, error)
      return null
    }
  }

  /**
   * Check if record is in the db
   * @param {string} id
   * @returns
   * @memberof DB
   */
  public async verify<T extends keyof Collections>(targetCollection: T, query: Filter<Collections[T]>): Promise<boolean> {
    const performanceStart = performance.now()
    this.log.debug(`.verify =>`, targetCollection)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const results = collection.find(query as any)
      this.log.debug(`[${targetCollection}].verify [${Math.round(performance.now() - performanceStart)}ms] => ${results.count()}`, query)
      return (await results.count()) > 0
    } catch (error) {
      this.log.error(`[${targetCollection}].verify error`, error)
      return null
    }
  }

  /**
   * Remove record from db
   * @param {string} id
   * @returns
   * @memberof DB
   */
  public async remove<T extends keyof Collections>(targetCollection: T, query: Filter<Collections[T]>, opts?: { deleteOne?: boolean }): Promise<number> {
    const performanceStart = performance.now()
    this.log.debug(`.remove =>`, targetCollection)
    try {
      const deleteOptions = Object.assign({ deleteOne: true }, opts)
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const deletionMethod = deleteOptions.deleteOne ? 'deleteOne' : 'deleteMany'
      const result = await collection[deletionMethod](query as any)
      this.log.debug(`[${targetCollection}].update results [${Math.round(performance.now() - performanceStart)}ms] => removed: ${result.deletedCount}`)
      return result.deletedCount
    } catch (error) {
      this.log.error(`[${targetCollection}].remove error`, error)
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
    query: Omit<mongoDot_lvl2<Collections[T] & Filter<Collections[T]>>, '_id'>,
    update: UpdateFilter<Collections[T]> | Partial<Collections[T]>,
    opts?: { upsert?: boolean; updateOne?: boolean; atomic?: boolean }
  ): Promise<number> {
    const performanceStart = performance.now()
    this.log.debug(`.update =>`, targetCollection)
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
      this.log.debug(`[${targetCollection}].update results [${Math.round(performance.now() - performanceStart)}ms] =>`, result.modifiedCount)
      // connection.client.close()
      return result.modifiedCount
    } catch (error) {
      this.log.error(`[${targetCollection}].update error`, error)
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
    query: Omit<mongoDot_lvl2<Collections[T] & Filter<Collections[T]>>, '_id'>,
    returnFields?: { [key in keyof Collections[T]]: number }
  ): Promise<Collections[T]> {
    const performanceStart = performance.now()
    this.log.debug(`[${targetCollection}].get => ${targetCollection}`)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const result = await collection.findOne<Collections[T]>(query, returnFields ? { projection: returnFields } : undefined)
      this.log.debug(`[${targetCollection}].get [${Math.round(performance.now() - performanceStart)}ms] =>`, result ? true : false)
      return result
    } catch (error) {
      this.log.error(`[${targetCollection}].get error`, error)
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
    query: Omit<mongoDot_lvl2<Collections[T] & Filter<Collections[T]>>, '_id'>,
    opts: { returnFields?: { [key: string]: number }; limit?: number } = {}
  ): Promise<Array<Collections[T]>> {
    const performanceStart = performance.now()
    this.log.debug(`[${targetCollection}].getLatest => ${targetCollection}`)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const result = collection
        .find<Collections[T]>(query)
        .sort({ _id: -1 })
        .limit(opts.hasOwnProperty('limit') ? opts.limit : 1)
        .project(opts.hasOwnProperty('returnFields') ? opts.returnFields : undefined)
      this.log.debug(`[${targetCollection}].get [${Math.round(performance.now() - performanceStart)}ms] =>`, result ? true : false)
      // connection.client.close()
      return await result.toArray()
    } catch (error) {
      this.log.error(`[${targetCollection}].getLatest error`, error)
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
    query: Omit<mongoDot_lvl2<Collections[T] & Filter<Collections[T]>>, '_id'>,
    returnFields?: { [key: string]: number }
  ) {
    const performanceStart = performance.now()
    this.log.debug(`[${targetCollection}].getMultiple => ${targetCollection}`)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const result = collection.find<Collections[T]>(query, returnFields ? { projection: returnFields } : undefined)
      this.log.debug(`[${targetCollection}].getMultiple [${Math.round(performance.now() - performanceStart)}ms] =>`, await result.count())
      // connection.client.close()
      return result.toArray()
    } catch (error) {
      this.log.error(`[${targetCollection}].getMultiple error`, error)
      return []
    }
  }

  public async count<T extends keyof Collections>(targetCollection: T, query: Omit<mongoDot_lvl2<Collections[T] & Filter<Collections[T]>>, '_id'>, options?: any) {
    const performanceStart = performance.now()
    this.log.debug(`[${targetCollection}].count => ${targetCollection}`)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection, options)
      const result = await collection.countDocuments(query)
      this.log.debug(`[${targetCollection}].count [${Math.round(performance.now() - performanceStart)}ms] =>`, result)
      // connection.client.close()
      return <number>result
    } catch (error) {
      this.log.error(`[${targetCollection}].count error`, error)
      return null
    }
  }

  public async aggregate<T>(targetCollection: keyof Collections, query: Array<object>) {
    const performanceStart = performance.now()
    this.log.debug(`[${targetCollection}].aggregate => ${targetCollection}`)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const result = collection.aggregate(query)
      this.log.debug(`.aggregate results [${Math.round(performance.now() - performanceStart)}ms] =>`, result.batchSize)
      // connection.client.close()
      return (await result.toArray()) as Array<T>
    } catch (error) {
      this.log.error(`[${targetCollection}].aggregate error`, error)
      return null
    }
  }

  public async distinct<T extends keyof Collections>(targetCollection: T, field: string): Promise<Array<string>> {
    const performanceStart = performance.now()
    this.log.debug(`[${targetCollection}].distinct => ${targetCollection}`)
    try {
      const connection = await this.connect()
      const collection = connection.db.collection(targetCollection)
      const result = await collection.distinct(field)
      this.log.debug(`[${targetCollection}].distinct [${Math.round(performance.now() - performanceStart)}ms] =>`, result ? true : false)
      // connection.client.close()
      return result
    } catch (error) {
      this.log.error(`[${targetCollection}].distinct error`, error)
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
