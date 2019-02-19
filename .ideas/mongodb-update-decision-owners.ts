const users = db.users.find({})
const decisions = db.decision.find({})
    .projection({})
    .sort({ _id: -1 })
    .limit(100)

var rebuilt = []

decisions.forEach(d => { 
    // Find user associated with owner
    const user = db.users.findOne({ _id: new ObjectID(d.owner) })
    d.authorID = user.id
    
    rebuilt.push(d)
})

db.decision.remove({})

db.decision.insertMany(rebuilt)