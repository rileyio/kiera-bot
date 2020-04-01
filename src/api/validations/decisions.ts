import * as joi from '@hapi/joi'

export namespace Decisions {
  export function getDecision() {
    return joi
      .object()
      .keys({
        _id: joi.string().required()
      })
      .required()
  }
  export function deleteDecision() {
    return joi
      .object()
      .keys({
        _id: joi.string().required()
      })
      .required()
  }
  export function updateOutcomeName() {
    return joi
      .object()
      .keys({
        _id: joi.string().required(),
        name: joi.string().required()
      })
      .required()
  }
  export function updateOutcomeDescription() {
    return joi
      .object()
      .keys({
        _id: joi.string().required(),
        description: joi
          .string()
          .allow('')
          .optional()
      })
      .required()
  }
  export function updateConsumeMode() {
    return joi
      .object()
      .keys({
        _id: joi.string().required(),
        consumeMode: joi.string().required()
      })
      .required()
  }
  export function updateConsumeReset() {
    return joi
      .object()
      .keys({
        _id: joi.string().required(),
        consumeReset: joi.number().required()
      })
      .required()
  }
  export function deleteOutcome() {
    return joi
      .object()
      .keys({
        _id: joi.string().required()
      })
      .required()
  }
  export function update() {
    return joi
      .object()
      .keys({
        _id: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().required()
      })
      .required()
  }
  export function addOutcome() {
    return joi
      .object()
      .keys({
        _id: joi.string().required(),
        type: joi.string().required(),
        text: joi.string().required()
      })
      .required()
  }
  export function addDecision() {
    return joi.object().keys({
      name: joi.string().required()
    })
  }
  export function enableDecision() {
    return joi.object().keys({
      _id: joi.string().required(),
      enabled: joi.bool().required()
    })
  }
  export function resetConsumed() {
    return joi.object().keys({
      _id: joi.string().required()
    })
  }
}
