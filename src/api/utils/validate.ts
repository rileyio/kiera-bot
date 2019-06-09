import * as joi from '@hapi/joi';

export function validate<T>(schema: joi.ObjectSchema, inc: T) {
  return new Promise<{ error: any, o: any, valid: Boolean }>(r => {
    joi.validate(typeof inc === 'string' ? JSON.parse(inc) : inc, schema, {
      abortEarly: false
    }, (err, result) => {
      r({ error: err, o: result, valid: !err })
    })
  })
}