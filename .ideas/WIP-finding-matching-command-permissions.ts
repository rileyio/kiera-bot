db.getCollection("command-permissions").aggregate([
    // Only look at the current server
    { $match: { serverID: "473856867768991744" } },
    // Group together all matching entries by command name
    {
        $group: {
            _id: "$command",
            matches: {
                $push: { _id: "$_id" }
            },
            original: { $first: "$_id" },
            count: { $sum: 1 },
        }
    },
    // Filter out only ones that contain dups
    { $match: { count: { '$gt': 1 } } },
])