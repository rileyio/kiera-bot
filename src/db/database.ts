import * as Debug from 'debug';
import { MongoClient, MongoClientOptions, Cursor } from 'mongodb';

export * from './messages'

export async function MongoDBLoader<T>(collection: string) {
  return new Promise<MongoDB<T>>(async (ret) => {
    var db = new MongoDB<T>(collection);
    // await db.connectionTest()
    return ret(db)
  })
}

export class MongoDB<T> {
  public DEBUG_DB: Debug.IDebugger

  public dbUrl = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/ldi`
  public dbName = `${process.env.DB_NAME}`
  public dbOpts: MongoClientOptions = {
    useNewUrlParser: true,
    auth: {
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
    }
  }
  public dbCollection: string
  public dbConnectionOK: boolean = false

  constructor(collection: string) {
    this.dbCollection = collection
    this.DEBUG_DB = Debug(`ldi:database::${collection}`)
  }

  public async connect() {
    const client = await MongoClient.connect(this.dbUrl, this.dbOpts)
    if (client.isConnected()) {
      const db = client.db(this.dbName)
      return { db: db, client: client }
    }
  }

  // MongoClient.connect(this.dbUrl, this.dbOpts, (err, client) => {
  //   assert.equal(null, err)
  //   console.log('Connected successfully to server', this.dbName)
  //   const db = client.db(this.dbName)
  //   return cb(db, client, err)
  // })

  // public async connectionTest() {
  //   try {
  //     const connection = await this.connect()
  //     const collection = connection.db.collection(this.dbCollection)
  //     const results = await collection.estimatedDocumentCount({
  //       _id: "$_id", count: { $sum: 1 }
  //     }, { limit: 10 })
  // connection.client.close()
  //     this.DEBUG_DB(`connection test results => ${results}`)
  //     this.dbConnectionOK = (results) ? true : false
  //     return (results) ? true : false
  //   } catch (error) {
  //     return false
  //   }
  // }

  /**
   * Adds a new record to the DB
   * @param {T} record
   * @returns
   * @memberof DB
   */
  public async add<T>(record: T, opts?: {}) {
    const insertOptions = Object.assign({}, opts)
    this.DEBUG_DB(`.add =>`, record)
    const connection = await this.connect()
    const collection = connection.db.collection(this.dbCollection)
    const results = await collection.insertOne(record)
    this.DEBUG_DB(`.add results => inserted: ${results.insertedCount}, id: ${results.insertedId}`)
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
    const uopts = Object.assign({ atomic: false, upsert: false, updateOne: true }, opts)
    const connection = await this.connect()
    const collection = connection.db.collection(this.dbCollection)
    const result = uopts.updateOne
      ? await collection.updateOne(query, uopts.atomic ? update : { $set: update }, { upsert: uopts.upsert })
      : await collection.updateMany(query, uopts.atomic ? update : { $set: update }, { upsert: uopts.upsert })
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
  public async get<Q>(query: Q) {
    this.DEBUG_DB(`.get =>`, query)
    const connection = await this.connect()
    const collection = connection.db.collection(this.dbCollection)
    const result = await collection.findOne<T>(query)
    this.DEBUG_DB(`.get results =>`, !!result)
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
  public async getMultiple<Q>(query: Q) {
    this.DEBUG_DB(`.get =>`, query)
    const connection = await this.connect()
    const collection = connection.db.collection(this.dbCollection)
    const result = await collection.find<T>(query)
    this.DEBUG_DB(`.get results =>`, await result.count())
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
