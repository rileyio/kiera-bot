import * as Middleware from '../../middleware';
import { RouterRouted } from '../../router/router';
import { ExportRoutes } from '../../router/routes-exporter';
import { BattleNet } from '../../typings/BattleNet';
import { sb, en } from '../../utils/';

const BlizzardWoWClassID = {
  1: 'Warrior',
  2: 'Paladin',
  3: 'Hunter',
  4: 'Rogue',
  5: 'Priest',
  6: 'Death Knight',
  7: 'Shaman',
  8: 'Mage',
  9: 'Warlock',
  10: 'Monk',
  11: 'Druid',
  12: 'Demon Hunter'
}

const BlizzardWoWClassRace = {
  1: 'Human',
  2: 'Orc',
  3: 'Dwarf',
  4: 'Night Elf',
  5: 'Undead',
  6: 'Tauren',
  7: 'Gnome',
  8: 'Troll',
  9: 'Goblin',
  10: 'Blood Elf',
  11: 'Draenei',
  12: 'Fel Orc',
  13: 'Naga',
  14: 'Broken',
  15: 'Skeleton',
  16: 'Vrykul',
  17: 'Tuskarr',
  18: 'Forest Troll',
  19: 'Taunka',
  20: 'Northrend Skeleton',
  21: 'Ice Troll',
  22: 'Worgen',
  23: 'Gilnean',
  24: 'Pandaren',
  25: 'Pandaren',
  26: 'Pandaren',
  27: 'Nightborne',
  28: 'Highmountain Tauren',
  29: 'Void Elf',
  30: 'Lightforged Draenei',
  31: 'Zandalari Troll',
  32: 'Kul Tiran',
  33: 'Human',
  34: 'Dark Iron Dwarf',
  35: 'Vulpera',
  36: 'Mag\'har Orc',
  37: 'Mechagnome'
}

const BlizzardWoWClassGender = {
  0: 'Male',
  1: 'Female'
}

const BlizzardWoWClassFaction = {
  0: 'Alliance',
  1: 'Horde'
}

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'BNet',
    commandTarget: 'argument',
    controller: wowCharacterProfile,
    example: '{{prefix}}wow character us stormreaver thejaydox',
    name: 'bnet-wow-character',
    validate: '/wow:string/character:string/region=string/server=string/name=string'
  }
)

/**
 * Blizzard WoW Character Lookup
 * @export
 * @param {RouterRouted} routed
 */
export async function wowCharacterProfile(routed: RouterRouted) {
  try {
    const resp: { data?: BattleNet.WoW.CharacterProfile } = await routed.bot.Service.BattleNet.Client.wow.character(['profile', 'items'], {
      origin: routed.v.o.region,
      realm: routed.v.o.server,
      name: routed.v.o.name
    })

    routed.bot.Service.BattleNet.DEBUG_BNET.log('BattleNet -> Request successful!,', `/${routed.v.o.region}/${routed.v.o.server}/${routed.v.o.name}/`)

    // await routed.message.reply(
    //   '```json\n' +
    //   JSON.stringify(
    //     resp.data
    //     , null, 2)
    //   + '```'
    // )

    await routed.message.channel.send({
      embed: {
        'title': resp.data.name,
        'description': `${BlizzardWoWClassRace[resp.data.race]} ${BlizzardWoWClassID[resp.data.class]}\n${BlizzardWoWClassFaction[resp.data.faction]}`,
        'url': `https://worldofwarcraft.com/en-us/character/${routed.v.o.region}/${resp.data.realm}/${resp.data.name}`,
        'color': 12457659,
        'timestamp': new Date(resp.data.lastModified),
        'footer': {
          'text': 'Last Updated'
        },
        'thumbnail': {
          'url': `http://render-${routed.v.o.region}.worldofwarcraft.com/character/${resp.data.thumbnail}`
        },
        'image': {
          'url': `http://render-${routed.v.o.region}.worldofwarcraft.com/character/${resp.data.thumbnail.replace('avatar', 'main')}`
        },

        'fields': [
          {
            'name': 'Region-Realm',
            'value': `${routed.v.o.region.toString().toUpperCase()}-${resp.data.realm}`,
            'inline': true
          },
          {
            'name': 'Level',
            'value': resp.data.level.toString(),
            'inline': true
          },
          {
            'name': 'Achievement Points',
            'value': resp.data.achievementPoints.toString(),
            'inline': false
          },
          {
            'name': 'Total Honorable Kills',
            'value': resp.data.totalHonorableKills.toString(),
            'inline': false
          },

          {
            'name': 'Average Item Level',
            'value': resp.data.items.averageItemLevel.toString(),
            'inline': true
          },
          {
            'name': '(Equipped)',
            'value': resp.data.items.averageItemLevelEquipped.toString(),
            'inline': true
          }
        ]
      }
    })

  } catch (error) {
    routed.bot.Service.BattleNet.DEBUG_BNET.log('BattleNet -> Error:', error.message)
    if (error.response.data.status === 'nok') await routed.message.reply(sb(en.bnet.bnetCharacterNotFound))
  }

  return true
}