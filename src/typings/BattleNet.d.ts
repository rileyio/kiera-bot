export namespace BattleNet {
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
      stats: Array<{ stat: number, amount: number }>
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
        azeritePowers: Array<{ id: number, tier: number, spellId: number, bonusListId: number }>
      }
    }
  }
}