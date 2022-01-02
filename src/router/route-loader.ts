import * as Path from 'path'
import * as glob from 'fast-glob'

import { Logger } from '@/utils'
import { RouteConfiguration } from '@/router'
import { performance } from 'perf_hooks'

export async function routeLoader(logger: Logger.Debug) {
  logger.log('loading command routes...', process.env.NODE_ENV ? `mode: ${process.env.NODE_ENV}` : '')

  // Load routes from commands folder
  const _routeFiles = glob.sync(
    process.env.NODE_ENV === 'development'
      ? ['src/commands/**/*.ts', '!src/commands/index.ts', '!src/commands/admin.ts']
      : ['app/commands/**/*.js', '!app/commands/index.js', '!app/commands/admin.js'],
    { deep: 3 }
  )

  // Collection of routes
  const routes: Array<RouteConfiguration> = []

  // Load each route configured into the routes array
  for (let index = 0; index < _routeFiles.length; index++) {
    const routeFile = _routeFiles[index]

    // Wrapped in a try to make more safe when loading and errors are present
    const start = performance.now()
    //logger.debug('Trying to load', routeFile.toString())
    try {
      const _requiredFile = (await import(Path.join('../../', routeFile.toString()))) as { Routes: Array<RouteConfiguration> }
      // Test if file returns undefined
      if (_requiredFile !== undefined) {
        // console.log(`routeLoader() => ${routeFile.toString()}, ${_requiredFile.Routes.map(r => Array.isArray(r)).length}`)

        for (let index = 0; index < _requiredFile.Routes.length; index++) {
          const route = _requiredFile.Routes[index]
          routes.push(route)
        }

        logger.verbose(`routeLoader() => route [${routeFile.toString()}] loaded (${Math.round(performance.now() - start)}ms)`)
      }
    } catch (e) {
      logger.error(`routeLoader() [ERROR] => ${routeFile.toString()}, ${e.message}`)
    }
  }

  logger.verbose(`routeLoader() => routes loaded: ${routes.length}`)

  return routes
}
