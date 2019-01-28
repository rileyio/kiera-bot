import { RouterRouted } from '../router/router';
import { SessionTypes } from '../objects/sessions';


export interface SessionExistsParams {
  type: SessionTypes
}

export function sessionExists(params: SessionExistsParams) {
  return async (routed: RouterRouted) => {
    // Check if session already exists
    routed.bot.DB.verify('sessions', {})
  }
}