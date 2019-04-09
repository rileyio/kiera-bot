export namespace Date {
  export function calculateCumulativeRange(dates: Array<{ start: number, end: number }>) {
    // Ensure they are sorted by start times
    dates.sort((a, b) => {
      var x = a.start;
      var y = b.start;
      if (x < y) { return -1; }
      if (x > y) { return 1; }
      return 0;
    })
    // Sanity check on dates array (negatives)
    // console.log('=========================')
    var negatives = dates.filter(d => (d.end - d.start) < 0)
    // console.log(`Found (${negatives.length}) that are negatives (excluding active dates)`)
    // console.log(negatives)
    // Remove it/them
    for (let index = 0; index < negatives.length; index++) {
      const negativeRange = negatives[index];
      const negativeIndex = dates.findIndex(dd => dd.start === negativeRange.start && dd.end === negativeRange.end)
      // console.log('negative index being removed:', negativeRange)
      // Remove
      dates.splice(negativeIndex, 1)
    }
    // console.log('=========================')
    // console.log(dates)

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
        // console.log(`index: ${i}, Condition 1 Met (Skip)`, dates[i]);
        continue; // Stop here
      }

      // New range beyond current range - set new range
      if (dates[i].start >= cumulative[cIndex].end) {
        // console.log(`index: ${i}, Condition 3 Met (New)`, dates[i]);
        cIndex++;
        cumulative.push(dates[i]);
        continue; // Stop here
      }

      // Extend the current range
      if (
        dates[i].start >= cumulative[cIndex].start &&
        dates[i].end > cumulative[cIndex].end
      ) {
        // console.log(`index: ${i}, Condition 2 Met (Extend)`, dates[i]);
        cumulative[cIndex].end = dates[i].end;
        continue; // Stop here
      }

      // All unmatched
      // console.log('Unmatched range:', dates[i], 'current cumulative:', cumulative[cIndex]);
    }

    // Calculate sums
    cTime = cumulative.reduce((s, c) => s += c.end - c.start, 0)

    //////////////////////
    ///  Actual Code END
    ///////////////////

    // Print results
    // console.log('=========================')
    // console.log(`Started with ${dates.length} ranges (${dates.reduce((s, c) => s += c.end - c.start, 0)}), reduced to ${cumulative.length}`)
    // console.log('results:', cumulative);
    // console.log(`cumulative time: ${cTime} seconds, (${cTime / 2592000})`)

    return cTime
  }
}