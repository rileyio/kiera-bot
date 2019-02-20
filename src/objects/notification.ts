import { ObjectID } from 'bson';

export class TrackedNotification {
  public _id: ObjectID
  /**
   * Discord Snowflake
   * @type {string}
   * @memberof TrackedNotification
   */
  public authorID: string
  /**
   * Discord Server ID
   * @type {ObjectID}
   * @memberof TrackedNotification
   */
  public serverID: string
  /**
   * Name of notification
   * @type {''}
   * @memberof TrackedNotification
   */
  public name: ''
  /**
   * Where to notify
   * @type {('Discord' | 'Web')}
   * @memberof TrackedNotification
   */
  public where: 'Discord' | 'Web'
  /**
   * State of notification
   * @type {boolean}
   * @memberof TrackedNotification
   */
  public state: boolean = false
}