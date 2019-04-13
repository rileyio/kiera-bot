var dates = [
  {
    "lockID": 0,
    "lockDeleted": 0,
    "lockedBy": "hans",
    "lockFrozen": 0,
    "timestampLocked": 1537040497,
    "timestampUnlocked": 1537960926,
    "status": "UnlockedReal",
    "combination": "60680723"
  },
  {
    "lockID": 1546339774,
    "lockDeleted": 0,
    "lockedBy": "",
    "lockFrozen": 0,
    "timestampLocked": 1546339774,
    "timestampUnlocked": 1546585606,
    "status": "UnlockedReal",
    "combination": "628"
  },
  {
    "lockID": 1547339140,
    "lockDeleted": 0,
    "lockedBy": "Blaine",
    "lockFrozen": 0,
    "timestampLocked": 1547339140,
    "timestampUnlocked": 1549957172,
    "status": "UnlockedReal",
    "combination": "716"
  },
  {
    "lockID": 1549957337,
    "lockDeleted": 0,
    "lockedBy": "hans",
    "lockFrozen": 0,
    "timestampLocked": 1549957337,
    "timestampUnlocked": 0,
    "status": "ReadyToUnlock",
    "combination": ""
  },
  {
    "lockID": 1549957337,
    "lockDeleted": 0,
    "lockedBy": "hans",
    "lockFrozen": 0,
    "timestampLocked": 1549957337,
    "timestampUnlocked": 0,
    "status": "ReadyToUnlock",
    "combination": ""
  },
  {
    "lockID": 1549957337,
    "lockDeleted": 0,
    "lockedBy": "hans",
    "lockFrozen": 0,
    "timestampLocked": 1549957337,
    "timestampUnlocked": 0,
    "status": "ReadyToUnlock",
    "combination": ""
  },
  {
    "lockID": 1549957337,
    "lockDeleted": 0,
    "lockedBy": "hans",
    "lockFrozen": 0,
    "timestampLocked": 1549957337,
    "timestampUnlocked": 0,
    "status": "ReadyToUnlock",
    "combination": ""
  },
  {
    "lockID": 1549957337,
    "lockDeleted": 0,
    "lockedBy": "hans",
    "lockFrozen": 0,
    "timestampLocked": 1549957337,
    "timestampUnlocked": 0,
    "status": "ReadyToUnlock",
    "combination": ""
  },
  {
    "lockID": 1549957337,
    "lockDeleted": 0,
    "lockedBy": "hans",
    "lockFrozen": 0,
    "timestampLocked": 1549957337,
    "timestampUnlocked": 0,
    "status": "ReadyToUnlock",
    "combination": ""
  },
  // Deleted
  {
    "lockID": 0,
    "lockDeleted": 1,
    "lockedBy": "Chase",
    "lockFrozen": 0,
    "timestampLocked": 1520456604,
    "timestampUnlocked": 1520515944,
    "status": "UnlockedReal",
    "combination": "444"
  },
  {
    "lockID": 0,
    "lockDeleted": 1,
    "lockedBy": "Chase",
    "lockFrozen": 0,
    "timestampLocked": 1520457819,
    "timestampUnlocked": 1520578501,
    "status": "UnlockedReal",
    "combination": "5001"
  },
  {
    "lockID": 0,
    "lockDeleted": 1,
    "lockedBy": "",
    "lockFrozen": 0,
    "timestampLocked": 1528857619,
    "timestampUnlocked": 0,
    "status": "Locked",
    "combination": ""
  },
  {
    "lockID": 0,
    "lockDeleted": 1,
    "lockedBy": "hans",
    "lockFrozen": 0,
    "timestampLocked": 1536868919,
    "timestampUnlocked": 1537039723,
    "status": "UnlockedReal",
    "combination": "686"
  },
  {
    "lockID": 0,
    "lockDeleted": 1,
    "lockedBy": "hans",
    "lockFrozen": 0,
    "timestampLocked": 1537040208,
    "timestampUnlocked": 1537040416,
    "status": "UnlockedReal",
    "combination": "53427406"
  }
]

// For any dates with a { ... end: 0 } set the 0 to the current timestamp (still active)
dates = dates.map(d => {
  // Insert current date on existing locked locks that are not deleted
  console.log(d.timestampUnlocked === 0 && d.status === 'Locked' && d.lockDeleted === 0, d.timestampLocked)

  // Remove unlocked time if the lock status is: Locked, Deleted and has a Completion timestamp
  if (d.timestampUnlocked > 0 && d.status === 'Locked' && d.lockDeleted === 1) {
    // console.log('set to:', 0)
    d.timestampUnlocked = 0
  }

  if (d.timestampUnlocked === 0 && (d.status === 'Locked' || d.status === 'ReadyToUnlock') && d.lockDeleted === 0) {
    console.log('set to:', Math.round(Date.now() / 1000))
    d.timestampUnlocked = Math.round(Date.now() / 1000)
  }

  // Transform data a little
  return { start: d.timestampLocked, end: d.timestampUnlocked }
})

// Ensure they are sorted by start times
dates.sort((a, b) => {
  var x = a.start;
  var y = b.start;
  if (x < y) { return -1; }
  if (x > y) { return 1; }
  return 0;
})

// Sanity check on dates array (negatives)
console.log('=========================')
var negatives = dates.filter(d => (d.end - d.start) < 0)
console.log(`Found (${negatives.length}) that are negatives (excluding active dates)`)
console.log(negatives)
// Remove it/them
for (let index = 0; index < negatives.length; index++) {
  const negativeRange = negatives[index];
  const negativeIndex = dates.findIndex(dd => dd.start === negativeRange.start && dd.end === negativeRange.end)
  console.log('negative index being removed:', negativeRange)
  // Remove
  dates.splice(negativeIndex, 1)
}
console.log('=========================')
console.log(dates)

//////////////////////
///  Actual Code
///////////////////
var cumulative = [];
var cIndex = 0;
var cTime = 0

// Use the first pair in the index as the starting point
cumulative.push(dates[0]);

for (var i = 1; i < dates.length; i++) {
  // Complete overlap, remove from consideration
  if (
    dates[i].start >= cumulative[cIndex].start &&
    dates[i].end <= cumulative[cIndex].end
  ) {
    console.log(`index: ${i}, Condition 1 Met (Skip)`, dates[i]);
    continue; // Stop here
  }

  // New range beyond current range - set new range
  if (dates[i].start >= cumulative[cIndex].end) {
    console.log(`index: ${i}, Condition 3 Met (New)`, dates[i]);
    cIndex++;
    cumulative.push(dates[i]);
    continue; // Stop here
  }

  // Extend the current range
  if (
    dates[i].start >= cumulative[cIndex].start &&
    dates[i].end > cumulative[cIndex].end
  ) {
    console.log(`index: ${i}, Condition 2 Met (Extend)`, dates[i]);
    cumulative[cIndex].end = dates[i].end;
    continue; // Stop here
  }

  // All unmatched
  console.log('Unmatched range:', dates[i], 'current cumulative:', cumulative[cIndex]);
}

// Calculate sums
cTime = cumulative.reduce((s, c) => s += c.end - c.start, 0)

//////////////////////
///  Actual Code END
///////////////////

// Print results
console.log('=========================')
console.log(`Started with ${dates.length} ranges (${dates.reduce((s, c) => s += c.end - c.start, 0)}), reduced to ${cumulative.length}`)
console.log('results:', cumulative);
console.log(`cumulative time: ${cTime} seconds, (${cTime / 2592000})`)
