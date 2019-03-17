/// Get EVERYONE who has a running lock and is not null in lockedByField

db.getCollection("ck-running-locks").aggregate([
    { $match: { lockedBy: { "$exists": true, "$ne": null } } },
    {
        $group: {
            _id: "$username",
            locks: {
                $addToSet: "$lockedBy"
            },
            count: { $sum: 1 }
        }
    },
    { $sort: { count: -1 } }
]);



/// Get everyone who has multiple KHs

db.getCollection("ck-running-locks").aggregate([
    {
        $match: { lockedBy: { "$ne": null } }
    },
    {
        $group: {
            _id: "$username",
            locks: {
                $addToSet: "$lockedBy"
            },
            count: { $sum: 1 }
        }
    },
    {
        $project: {
            uniqueKHCount: { $cond: { if: { $isArray: "$locks" }, then: { $size: "$locks" }, else: 0 } },
            locks: 1,
            count: 1
        }
    },
    { $match: { count: { $gt: 1 }, uniqueKHCount: { $gt: 1 } } },
    { $sort: { count: -1 } },
]);



/// Get everyone who has multiple KHs (Where a kh = NAME)

db.getCollection("ck-running-locks").aggregate([
    {
        $match: { lockedBy: { "$ne": null } }
    },
    {
        $group: {
            _id: "$username",
            keyholders: {
                $addToSet: "$lockedBy"
            },
            count: { $sum: 1 }
        }
    },
    {
        $project: {
            uniqueKHCount: { $cond: { if: { $isArray: "$keyholders" }, then: { $size: "$keyholders" }, else: 0 } },
            keyholders: 1,
            count: 1
        }
    },
    { $match: { count: { $gt: 1 }, uniqueKHCount: { $gt: 1 }, keyholders: { $in: [ /NAME/i ] } } },
    { $sort: { count: -1 } },
]);