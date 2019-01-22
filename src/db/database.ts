import { MongoClient, MongoClientOptions, Cursor, Db, MongoError } from 'mongodb';
import { Debug } from '../logger';

export * from './promise'
export * from './messages'

export async function MongoDBLoader<T>(collection: string) {
  return new Promise<MongoDB<T>>(async (ret) => {
    var db = new MongoDB<T>(collection);
    // await db.connectionTest()
    return ret(db)
  })
}

export class MongoDB<T>  {
  private connection: {
    db: Db;
    client: MongoClient;
    error: MongoError;
  } = { db: undefined, client: undefined, error: undefined }
  public DEBUG_DB: Debug

  public dbName = `${process.env.DB_NAME}`
  public dbUrl = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${this.dbName}`
  public dbOpts: MongoClientOptions = {
    useNewUrlParser: true,
    auth: {
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
    }
  }
  public dbCollection: string

  constructor(collection: string) {
    this.dbCollection = collection
    this.DEBUG_DB = new Debug(`ldi:database::${collection}`)
  }

  // private queryWrapper<T>(promise: Promise<T>, fallback: T) {

  // }

  public async connect() {
    try {
      // Test if connection already exists, no need to open a new one if so
      if (this.connection.client) {
        // Check if connection is active
        if (!this.connection.client.isConnected()) await this.newConnection()
        // Else reuse current connection
        // tslint:disable-next-line:no-console
        console.log('reuse db connection on', this.dbCollection)
      }
      else {
        // tslint:disable-next-line:no-console
        console.log('new db connection on', this.dbCollection)
        await this.newConnection()
      }
    } catch (error) {
      this.connection.error = error
    }

    return this.connection
  }

  private async newConnection() {
    await MongoClient.connect(this.dbUrl, this.dbOpts)
      .then((_client) => {
        this.connection = { db: _client.db(this.dbName), client: _client, error: undefined }
      })
      .catch(_error => {
        // tslint:disable-next-line:no-console
        console.log('>>>>> Failed to connect to db for query', this.dbCollection)
        this.connection.error = _error
      })
  }

  public async ping() {
    var status: boolean;
    try {
      const connection = await this.connect()
      // tslint:disable-next-line:no-console
      const pingStatus = await connection.db.command({ ping: 1 })
      status = pingStatus ? true : false
    } catch (error) {
      // tslint:disable-next-line:no-console
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
  public async add<T>(record: T, opts?: {}) {
    const insertOptions = Object.assign({}, opts)
    this.DEBUG_DB.log(`.add =>`, record)
    const connection = await this.connect()
    const collection = connection.db.collection(this.dbCollection)
    const results = await collection.insertOne(record)
    this.DEBUG_DB.log(`.add results => inserted: ${results.insertedCount}, id: ${results.insertedId}`)
    // connection.client.close()
    return results.result.n === 1 ? results.insertedId : null
  }

  /**
   * Check if record is in the db
   * @param {string} id
   * @returns
   * @memberof DB
   */
  public async verify<Q, T>(query: string | Q) {
    this.DEBUG_DB.log(`.verify => in`, this.dbCollection)
    const connection = await this.connect()
    const collection = connection.db.collection(this.dbCollection)
    const results = await collection.find<T>(typeof query === 'string' ? { id: query } : query)
    return await results.count() > 0
  }

  /**
   * Remove record from db
   * @param {string} id
   * @returns
   * @memberof DB
   */
  public async remove<Q>(query: string | Q, opts?: { deleteOne?: boolean }) {
    const deleteOptions = Object.assign({ deleteOne: true }, opts)
    const connection = await this.connect()
    const collection = connection.db.collection(this.dbCollection)
    const deletionMethod = deleteOptions.deleteOne ? 'deleteOne' : 'deleteMany'
    const result = await collection[deletionMethod](typeof query === 'string' ? { id: query } : query)
    this.DEBUG_DB.log(`.update results => updated: ${result.result.n}`)
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
  public async update<Q, T>(query: Q, update: T, opts?: { upsert?: boolean, updateOne?: boolean, atomic?: boolean }) {
    // this.DEBUG_DB.log(`.update =>`, query, update)
    const uopts = Object.assign({ atomic: false, upsert: false, updateOne: true }, opts)
    const connection = await this.connect()
    const collection = connection.db.collection(this.dbCollection)
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
  public async get<Q>(query: Q, returnFields?: { [key: string]: number }) {
    this.DEBUG_DB.log(`.get =>`, query)
    const connection = await this.connect()
    const collection = connection.db.collection(this.dbCollection)
    const result = await collection.findOne<T>(query, returnFields ? { projection: returnFields } : undefined)
    this.DEBUG_DB.log(`.get results =>`, result)
    // connection.client.close()
    return (<T>result)
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
  public async getMultiple<Q>(query: Q, returnFields?: { [key: string]: number }) {
    this.DEBUG_DB.log(`.getMultiple =>`, query, returnFields)
    const connection = await this.connect()
    const collection = connection.db.collection(this.dbCollection)
    const result = await collection.find<T>(query, returnFields ? { projection: returnFields } : undefined)
    this.DEBUG_DB.log(`.getMultiple results =>`, await result.count())
    // connection.client.close()
    return (<Cursor<T>>result).toArray()
  }

  // public get<Q, T>(query: Q, discriminator?: string) {
  //   return new Promise<T>(r => {
  //     this.connect(async (db: Db, client: MongoClient, err: MongoError) => {
  //       const collection = db.collection(this.dbCollection)
  //       const result = await collection.findOne<T>(query)
  //       client.close()
  //       r(result)
  //     })
  //   })
  // }
}
