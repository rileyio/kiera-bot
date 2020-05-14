import { RouterRouted, ExportRoutes } from '@/router'

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
  36: `Mag'har Orc`,
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

export const Routes = ExportRoutes({
  type: 'message',
  category: 'BNet',
  controller: wowCharacterProfile,
  example: '{{prefix}}wow character us stormreaver thejaydox',
  name: 'bnet-wow-character',
  validate: '/wow:string/character:string/region=string/server=string/name=string'
})

/**
 * Blizzard WoW Character Lookup
 * @export
 * @param {RouterRouted} routed
 */
export async function wowCharacterProfile(routed: RouterRouted) {
  try {
    const { data } = await routed.bot.Service.BattleNet.Client.wow.character(['profile', 'items'], {
      origin: routed.v.o.region,
      realm: routed.v.o.server,
      name: routed.v.o.name
    })

    routed.bot.Service.BattleNet.DEBUG_BNET.log('BattleNet -> Request successful!,', `/${routed.v.o.region}/${routed.v.o.server}/${routed.v.o.name}/`)

    await routed.message.channel.send({
      embed: {
        title: data.name,
        description: `${BlizzardWoWClassRace[data.race]} ${BlizzardWoWClassID[data.class]}\n${BlizzardWoWClassFaction[data.faction]}`,
        url: `https://worldofwarcraft.com/en-us/character/${routed.v.o.region}/${data.realm}/${data.name}`,
        color: 12457659,
        timestamp: new Date(data.lastModified),
        footer: {
          text: 'Last Updated'
        },
        thumbnail: {
          url: `http://render-${routed.v.o.region}.worldofwarcraft.com/character/${data.thumbnail}`
        },
        image: {
          url: `http://render-${routed.v.o.region}.worldofwarcraft.com/character/${data.thumbnail.replace('avatar', 'main')}`
        },

        fields: [
          {
            name: 'Region-Realm',
            value: `${routed.v.o.region.toString().toUpperCase()}-${data.realm}`,
            inline: true
          },
          {
            name: 'Level',
            value: data.level.toString(),
            inline: true
          },
          {
            name: 'Achievement Points',
            value: data.achievementPoints.toString(),
            inline: false
          },
          {
            name: 'Total Honorable Kills',
            value: data.totalHonorableKills.toString(),
            inline: false
          },

          {
            name: 'Average Item Level',
            value: data.items.averageItemLevel.toString(),
            inline: true
          },
          {
            name: '(Equipped)',
            value: data.items.averageItemLevelEquipped.toString(),
            inline: true
          }
        ]
      }
    })
  } catch (error) {
    routed.bot.Service.BattleNet.DEBUG_BNET.log('BattleNet -> Error:', error.message)
    if (error.response.data.status === 'nok') await routed.message.reply(routed.$render('BattleNet.Error.CharacterNotFound'))
  }

  return true
}
