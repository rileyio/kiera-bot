import * as joi from 'joi'

export namespace Lists {
  export function get() {
    return joi
      .object()
      .keys({
        input: joi
          .string()
          .alphanum()
          .min(2)
          .max(24)
          .required()
      })
      .required()
  }
}
