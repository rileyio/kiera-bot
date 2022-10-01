import * as joi from 'joi'

export namespace User {
  export function get() {
    return joi
      .object()
      .keys({
        id: joi.string().alphanum().min(2).max(24).required()
      })
      .required()
  }

  export function update() {
    return joi
      .object()
      .keys({
        key: joi.string().required(),
        value: joi.required()
      })
      .required()
  }

  export function oauth() {
    return joi
      .object()
      .keys({
        id: joi.string().alphanum().min(2).max(24).required(),
        accessToken: joi.string().alphanum().min(28).max(30).required()
      })
      .required()
  }
}
