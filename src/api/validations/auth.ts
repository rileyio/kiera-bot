import * as joi from 'joi'

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
        id: joi.string().alphanum().min(2).max(24).required()
      })
      .required()
  }
}
