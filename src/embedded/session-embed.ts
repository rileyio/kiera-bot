import { DeviceSession } from '../objects/sessions';

export function sessionInteractive(id: string, session: DeviceSession) {
  const react1 = session.reacts.filter(n => n.level === 1).length
  const react2 = session.reacts.filter(n => n.level === 2).length
  const react3 = session.reacts.filter(n => n.level === 3).length
  const react4 = session.reacts.filter(n => n.level === 4).length
  const react5 = session.reacts.filter(n => n.level === 5).length
  var sec = Math.floor(session.timeRemaining / 1000)
  var min = Math.floor(sec / 60)
  sec = sec % 60
  var hrs = Math.floor(min / 60)
  min = min % 60

  const timeToShowHours = hrs.toString()
  const timeToShowMins = `${min > 9 ? + min : '0' + min}`
  const timeToShowSecs = `${sec > 9 ? + sec : '0' + sec}`

  const props = {
    sessionId: id,
    timestamp: new Date().toISOString(),
    timePerReact: session.react.time,
    duration: {
      min: session.duration.min,
      max: session.duration.max
    },
    timeRemaining: {
      sec: timeToShowSecs,
      min: timeToShowMins,
      hrs: timeToShowHours
    },
    totals: {
      r1: react1,
      r2: react2,
      r3: react3,
      r4: react4,
      r5: react5
    }
  }

  return {
    content: `Session \`${props.sessionId}\` Activated!`,
    embed: {
      description: "Registered users may interact with this message to provide intensity changes\
       & time to the user's session! The following reactions are valid:\
       \n\n😄 = Low\n😏 = Low-medium\n😬 = Medium\n😭 = Medium-high\n🙄 = High",
      color: 34353,
      timestamp: props.timestamp,
      footer: {
        text: "Last updated"
      },
      fields: [
        {
          name: "Session Paramaters",
          value: "------------------------"
        },
        {
          name: "Duration",
          value: `Min: \`${props.duration.min}\`   Max: \`${props.duration.max}\``
        },
        {
          name: "React",
          value: `Time added per reaction: \`${props.timePerReact}\` minutes`
        },
        {
          name: "Time Remaining (__as of Last updated__)",
          value: `🕐  ${props.timeRemaining.hrs}hr ${props.timeRemaining.min}m ${props.timeRemaining.sec}s`,
          inline: true
        },
        {
          name: "Reacts Registered",
          value: `\`😄  ${props.totals.r1}\` \`😏  ${props.totals.r2}\` \`😬  ${props.totals.r3}\` \`😭  ${props.totals.r4}\` \`🙄  ${props.totals.r5}\``,
          inline: true
        }
      ]
    }
  }
}