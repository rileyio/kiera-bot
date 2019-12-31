import * as joi from '@hapi/joi'

export namespace Auth {
  export function otl() {
    return joi
      .object()
      .keys({
        otl: joi
          .string()
          .alphanum()
          .length(8)
          .required()
      })
      .required()
  }
}
