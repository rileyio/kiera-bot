import * as joi from 'joi';

export namespace User {
  export function get() {
    return joi.object().keys({
      id: joi.string().alphanum().min(2).max(24).required()
    }).required();
  }

  export function update() {
    return joi.object().keys({
      key: joi.string().required(),
      value: joi.required()
    }).required();
  }

  export function oauth() {
    return joi.object().keys({
      username: joi.string().min(2).max(32).required(),
      locale: joi.string().min(2).max(8).required(),
      premium_type: joi.number().optional(),
      mfa_enabled: joi.boolean().required(),
      flags: joi.number().required(),
      avatar: joi.string().alphanum().min(32).max(32).required(),
      discriminator: joi.string().alphanum().min(4).max(4).required(),
      id: joi.string().alphanum().min(2).max(24).required(),
      provider: joi.string().required(),
      accessToken: joi.string().alphanum().min(28).max(30).required(),
      guilds: joi.array().required(),
      fetchedAt: joi.string().required()
    }).required();
  }
}