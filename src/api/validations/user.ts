import * as joi from 'joi';

export namespace User {
  export function get() {
    return joi.object().keys({
      _id: joi.string().alphanum().min(24).max(24).required(),
      id: joi.string().alphanum().min(2).max(24).required(),
    }).or('_id', 'id');
  }

  export function oauth() {
    return joi.object().keys({
      _id: joi.string().alphanum().min(24).max(24).required(),
      accessToken: joi.string().alphanum().min(28).max(30).required(),
      avatar: joi.string().alphanum().min(32).max(32).required(),
      createdTimestamp: joi.any().optional(),
      discriminator: joi.string().alphanum().min(4).max(4).required(),
      flags: joi.number().required(),
      id: joi.string().alphanum().min(2).max(24).required(),
      locale: joi.string().alphanum().min(2).max(8).required(),
      mfa_enabled: joi.boolean().required(),
      premium_type: joi.number().required(),
      provider: joi.string().required(),
      username: joi.string().required(),
      fetchedAt: joi.string().required()
    }).required();
  }
}