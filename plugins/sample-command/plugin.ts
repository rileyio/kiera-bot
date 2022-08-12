/**
 * @name sample-command
 * @pluginURL https://raw.githubusercontent.com/rileyio/sample-command/master/plugin.ts
 * @repo rileyio/sample-command
 * @version 1.0.1
 */

import { Plugin } from '../../src/index'

export class SampleCommandPlugin extends Plugin {
  config = { testProp: false }

  constructor() {
    super()
    console.log('SampleCommand Plugin Loaded')
  }
}

export default function () {
  return new SampleCommandPlugin()
}
