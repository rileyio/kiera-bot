import * as joi from '@hapi/joi';

export namespace ChastiKey {
  export function khLockees() {
    return joi.object().keys({
      username: joi.string().alphanum().min(2).max(24).required()
    }).required();
  }
}