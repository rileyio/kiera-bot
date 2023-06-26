import { ObjectId } from 'bson'

export interface ManagedChannel {
  _id?: ObjectId
  authorID: string
  channelID: string
  enabled: boolean
  name: string
  serverID: string
  type: 'countdown'
  updated: number
  value: number
}
