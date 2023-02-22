export function calculateHumanTimeDDHHMM(seconds: number, options?: { dropZeros?: boolean; dropMinutes?: boolean }): string {
  const opts = Object.assign(
    {
      dropMinutes: false,
      dropZeros: false
    },
    options
  )
  // Calculate human readible time for lock from seconds
  const timelocked = seconds
  let min = Math.floor(timelocked / 60)
  let hrs = Math.floor(min / 60)
  min = min % 60
  const days = Math.floor(hrs / 24)
  hrs = hrs % 24

  const timeToShowDays = `${days > 9 ? +days : '0' + days}d`
  const timeToShowHours = `${hrs > 9 ? +hrs : '0' + hrs}h`
  const timeToShowMins = `${min > 9 ? +min : '0' + min}m`

  if (opts.dropZeros && days === 0 && hrs === 0) return `${timeToShowMins}`
  if (opts.dropZeros && days === 0)
    if (opts.dropMinutes) return `${timeToShowHours}`
    else return `${timeToShowHours} ${timeToShowMins}`
  if (opts.dropMinutes) return `${timeToShowDays} ${timeToShowHours}`
  return `${timeToShowDays} ${timeToShowHours} ${timeToShowMins}`
}
