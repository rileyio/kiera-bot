export namespace Date {
  export function calculateHumanTimeDDHHMM(seconds: number, dropZeros?: boolean) {
    // Calculate human readible time for lock from seconds
    const timelocked = seconds
    var min = Math.floor(timelocked / 60)
    var hrs = Math.floor(min / 60)
    min = min % 60
    var days = Math.floor(hrs / 24)
    hrs = hrs % 24

    const timeToShowDays = `${days > 9 ? +days : '0' + days}d`
    const timeToShowHours = `${hrs > 9 ? +hrs : '0' + hrs}h`
    const timeToShowMins = `${min > 9 ? +min : '0' + min}m`

    if (dropZeros && days === 0 && hrs === 0) return `${timeToShowMins}`
    if (dropZeros && days === 0) return `${timeToShowHours} ${timeToShowMins}`
    return `${timeToShowDays} ${timeToShowHours} ${timeToShowMins}`
  }
}
