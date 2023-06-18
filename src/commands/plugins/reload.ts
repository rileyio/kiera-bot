import { AcceptedResponse, Routed } from '#router/index'

export async function reload(routed: Routed<'discord-chat-interaction'>): AcceptedResponse {
  const name = routed.options.get('name')?.value as string
  const result = await routed.bot.Plugin.reloadPlugin(name)
  if (result) return await routed.reply(`🧩 Plugin \`${name}\` reloaded!`, true)
  return await routed.reply(`🧩 Plugin \`${name}\` failed to reload!`, true)
}
