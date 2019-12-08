declare module 'blizzard.js' {
  export function initialize(options: BlizzardJSInitializeOptions): Blizzard

  interface BlizzardJSInitializeOptions {
    key: string
    secret: string
    token?: string
    origin?: string
    locale?: string
  }

  interface BlizzardJSWoWCharacterParams {
    origin: string
    realm: string
    name: string
  }

  interface wow {
    achievement({ id: string, ...args }): Promise<any>
    auction({ realm: string, ...args }): Promise<any>
    boss({ id: string, ...args }): Promise<any>
    challenge({ realm: string, ...args }): Promise<any>
    character(keys: Array<string>, params: BlizzardJSWoWCharacterParams): Promise<{ data: BattleNet.WoW.CharacterProfile }>
    data(key: string, ...args): Promise<any>
  }

  export class Blizzard {
    version: string
    account: {
      userInfo: () => Promise<any>
    }
    wow: wow
    getApplicationToken()
    // wow: {

    // battlegroups: (...args) => Promise<any>,
    // characterRaces: ({ }) => Promise<any>,
    // characterClasses: ({ }) => Promise<any>,
    // characterAchievements: ({ }) => Promise<any>,
    // guildRewards: ({ }) => Promise<any>,
    // guildPerks: ({ }) => Promise<any>,
    // guildAchievements: ({ }) => Promise<any>,
    // itemClasses: ({ }) => Promise<any>,
    // talents: ({ }) => Promise<any>,
    // petTypes: ({ }) => Promise<any>,
    // guild: ({ }) => Promise<any>,
    // item: ({ }) => Promise<any>,
    // mount: ({ }) => Promise<any>,
    // pet: ({ }) => Promise<any>,
    // petAbility: ({ }) => Promise<any>,
    // petSpecies: ({ }) => Promise<any>,
    // petStats: ({ }) => Promise<any>,
    // pvp: ({ }) => Promise<any>,
    // quest: ({ }) => Promise<any>,
    // realmStatus: ({ }) => Promise<any>,
    // recipe: ({ }) => Promise<any>,
    // spell: ({ }) => Promise<any>,
    // userCharacters: ({ }) => Promise<any>,
    // zone: ({ }) => Promise<any>,
    // connectedRealm: ({ }) => Promise<any>,
    // keystoneAffix: ({ }) => Promise<any>,
    // mythicRaidLeaderboard: ({ }) => Promise<any>,
    // mythicDungeonKeystone: ({ }) => Promise<any>,
    // mythicKeystoneLeaderboard: ({ }) => Promise<any>,
    // playableClass: ({ }) => Promise<any>,
    // pvpTalentSlots: ({ }) => Promise<any>,
    // playableSpecialization: ({ }) => Promise<any>,
    // powerType: ({ }) => Promise<any>,
    // playableRace: ({ }) => Promise<any>,
    // realm: ({ }) => Promise<any>,
    // region: ({ }) => Promise<any>,
    // token: ({ }) => Promise<any>,
    // }
  }

  interface Profile {}
  interface D3 {}
  interface SC2 {}
}

namespace BattleNet {
  namespace WoW {
    export type ProfileGender = 0 | 1
    export type ProfileFaction = 0 | 1

    export interface CharacterProfile {
      lastModified: number
      name: string
      realm: string
      battlegroup: string
      class: number
      race: number
      gender: ProfileGender
      level: number
      achievementPoints: number
      thumbnail: string
      calcClass: string
      faction: ProfileFaction
      totalHonorableKills: number
      // Needs to be added upon call
      items?: {
        averageItemLevel: number
        averageItemLevelEquipped: number
        // Gear
        head: CharacterProfileItem
        neck: CharacterProfileItem
        shoulder: CharacterProfileItem
        back: CharacterProfileItem
        chest: CharacterProfileItem
        shirt: CharacterProfileItem
        tabard: CharacterProfileItem
        wrist: CharacterProfileItem
        hands: CharacterProfileItem
        waist: CharacterProfileItem
        legs: CharacterProfileItem
        feet: CharacterProfileItem
        finger1: CharacterProfileItem
        finger2: CharacterProfileItem
        trinket1: CharacterProfileItem
        trinket2: CharacterProfileItem
        mainHand: CharacterProfileItem
        offhand: CharacterProfileItem
      }
    }

    export interface CharacterProfileItem {
      id: number
      name: string
      icon: string
      quality: number
      itemLevel: number
      tooltipParams: {
        timewalkerLevel: number
        azeritePower0: number
        azeritePower1: number
        azeritePower2: number
        azeritePower3: number
        azeritePowerLevel: number
        azeritePower4: number
      }
      stats: Array<{ stat: number; amount: number }>
      armor: number
      context: string
      bonusLists: Array<number>
      displayInfoId: number
      artifactId: number
      artifactAppearanceId: number
      artifactTraits: Array<number>
      relics: Array<number>
      appearance: {
        itemAppearanceModId: number
      }
      azeriteItem: {
        azeriteLevel: number
        azeriteExperience: number
        azeriteExperienceRemaining: number
      }
      azeriteEmpoweredItem: {
        azeritePowers: Array<{ id: number; tier: number; spellId: number; bonusListId: number }>
      }
    }
  }
}
