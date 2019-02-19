import * as joi from 'joi';

export namespace Decisions {
  export function get() {
    return joi.object().keys({
      serverLimited: joi.bool().required()
    }).optional()
  }
  export function deleteOne() {
    return joi.object().keys({
      _id: joi.string().required()
    }).required()
  }
  export function updateOutcome() {
    return joi.object().keys({
      _id: joi.string().required()
    }).required()
  }
  export function deleteOutcome() {
    return joi.object().keys({
      _id: joi.string().required()
    }).required()
  }
  export function update() {
    return joi.object().keys({
      _id: joi.string().required(),
      text: joi.string().required()
    }).required()
  }
  export function addOutcome() {
    return joi.object().keys({
      _id: joi.string().required(),
      text: joi.string().required()
    }).required()
  }

}