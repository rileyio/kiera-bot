import Joi = require('@hapi/joi')

export function validate<T>(schema: Joi.ObjectSchema, inc: T) {
  return new Promise<{ error: any; o: any; valid: Boolean }>((r) => {
    const _inc = typeof inc === 'string' ? JSON.parse(inc) : inc
    const result = schema.validate(_inc, { abortEarly: false })

    r({
      error: result.error,
      o: !result.error ? result.value : null,
      valid: !result.error
    })
  })
}
