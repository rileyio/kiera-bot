import { BattleNet } from '../BNet';

declare module 'blizzard.js' {
  export function initialize(options: BlizzardJSInitializeOptions): Blizzard

  interface BlizzardJSInitializeOptions {
    key: string,
    secret: string,
    token?: string,
    origin?: string,
    locale?: string
  }

  class WoW {
    achievement({ id: string, ...args }): Promise<any> { }
    auction({ realm: string, ...args }): Promise<any>
    boss({ id: string, ...args }): Promise<any>
    challenge({ realm: string, ...args }): Promise<any>
    character(keys: Array<string>, {
      origin: string, realm: string, name: string, ...args
    }): Promise<any> { }
    data(key: string, ...args): Promise<any>
  }

  export class Blizzard {
    version: string
    account: {
      userInfo: () => Promise<any>
    }
    wow: WoW
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

  class Profile { }
  class D3 { }
  class SC2 { }

  export = initialize
}


