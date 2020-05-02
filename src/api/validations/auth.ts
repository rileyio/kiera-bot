import * as joi from '@hapi/joi'

export namespace Auth {
  export function otl() {
    return joi
      .object()
      .keys({
        otl: joi.string().alphanum().length(8).required()
      })
      .required()
  }
  export function oauth() {
    return joi
      .object()
      .keys({
        id: joi.string().alphanum().min(2).max(24).required(),
        username: joi.string().min(2).max(32).required(),
        discriminator: joi.string().alphanum().min(4).max(4).required(),
        avatar: joi.string().alphanum().min(32).max(32).allow(null).required(),
        fetchedAt: joi.string().required(),
        locale: joi.string().min(2).max(8).required()
      })
      .required()
  }
}
