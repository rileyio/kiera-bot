import * as Middleware from '../../middleware';
import { RouterRouted } from '../../router/router';
import { ExportRoutes } from '../../router/routes-exporter';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'BNet',
    commandTarget: 'argument',
    controller: test,
    example: '{{prefix}}bnet wow character us stormreaver thejaydox',
    name: 'bnet-wow-character',
    validate: '/bnet:string/wow:string/character:string/region=string/server=string/name=string'
  }
)

/**
 * Blizzard WoW Character Lookup
 * @export
 * @param {RouterRouted} routed
 */
export async function test(routed: RouterRouted) {
  const resp = await routed.bot.Service.BattleNet.Client.wow.character(['profile'], { origin: routed.v.o.region, realm: routed.v.o.server, name: routed.v.o.name })

  await routed.message.reply(
    '```json\n' +
    JSON.stringify(
      resp.data
      , null, 2)
    + '```'
  )

  //const response = await BNet.wow.character(['profile'], { origin: 'us', realm: 'amanthul', name: 'charni' })
  //console.log(response.data)

  // await routed.message.reply()
  // return true
}