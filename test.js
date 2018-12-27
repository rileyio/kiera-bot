const MongoClient = require('mongodb').MongoClient
const assert = require('assert')

// Connection URL
const url = 'mongodb://ldi-bot:lkjhfOHF0394hf3@ds157614.mlab.com:57614/ldi'

// Database Name
const dbName = 'ldi'

// Use connect method to connect to the server
MongoClient.connect(url, function (err, client) {
  assert.equal(null, err)
  console.log('Connected successfully to server')

  const db = client.db(dbName)

  findDocuments(db, function () {
    client.close()
  })
})

const findDocuments = function (db, callback) {
  // Get the documents collection
  const collection = db.collection('documents')
  // Find some documents
  collection.find({}).toArray(function (err, docs) {
    assert.equal(err, null)
    console.log('Found the following records')
    console.log(docs)
    callback(docs)
  })
}
