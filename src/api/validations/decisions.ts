import * as joi from 'joi'

export namespace Decisions {
  export function getDecision() {
    return joi
      .object()
      .keys({
        _id: joi.string().length(24).required()
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
  export function updateProps() {
    return joi
      .object()
      .keys({
        _id: joi.string().required(),
        name: joi.string().required(),
        description: joi.string().allow('').required(),
        enabled: joi.bool().required(),
        serverWhitelist: joi.array().empty().required(),
        userWhitelist: joi.array().empty().required(),
        userBlacklist: joi.array().empty().required(),
        consumeMode: joi.string().required(),
        consumeReset: joi.number().required()
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
  export function updateDecisionOutcome() {
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
  export function resetConsumed() {
    return joi.object().keys({
      _id: joi.string().required()
    })
  }
}
