import * as joi from 'joi';

export namespace Sessions {
  export function getAll() {
    return joi.object().keys({
      sid: joi.string().alphanum().min(24).max(24).required(),
      uid: joi.string().alphanum().min(24).max(24).required()
    }).required()
  }
  export function get() {
    return joi.object().keys({
      id: joi.string().alphanum().min(24).max(24).required(),
    }).required()
  }
}