import * as Path from 'path'

import { Logger } from '#utils'
import { RouteConfiguration } from '#/router'
import glob from 'fast-glob'
import { performance } from 'perf_hooks'

export async function routeLoader(logger: Logger.Debug) {
  logger.log('loading command routes...', process.env.NODE_ENV ? `mode: ${process.env.NODE_ENV}` : '')

  // Load routes from commands folder
  const _routeFiles = glob.sync(['src/commands/**/*', '!src/commands/**/*.{cmd,embed}', '!src/commands/**/shared'])

  // Collection of routes
  const routes: Array<RouteConfiguration<'placeolder-type'>> = []

  // Load each route configured into the routes array
  for (let index = 0; index < _routeFiles.length; index++) {
    const routeFile = _routeFiles[index]

    // Wrapped in a try to make more safe when loading and errors are present
    const start = performance.now()
    //logger.debug('Trying to load', routeFile.toString())
    try {
      const _requiredFile = (await import(Path.join('../../', routeFile.toString()))) as { Routes: Array<RouteConfiguration<'placeolder-type'>> }
      // Test if file returns undefined
      if (_requiredFile === undefined) continue
      logger.log(`routeLoader() => ${routeFile.toString()}, ${_requiredFile.Routes.map((r) => Array.isArray(r)).length}`)

      // When no array is returned
      if (Object.keys(_requiredFile).includes('Routes') === false) {
        logger.debug(`routeLoader() [WARN] => ${routeFile.toString()}, no Routes array found (${Math.round(performance.now() - start)}ms)`)
        continue
      }

      // Add route to routes array
      for (let index = 0; index < _requiredFile.Routes.length; index++) routes.push(_requiredFile.Routes[index])

      logger.verbose(`routeLoader() => route [${routeFile.toString()}] loaded (${Math.round(performance.now() - start)}ms)`)
    } catch (e) {
      logger.error(`routeLoader() [ERROR] => ${routeFile.toString()}, ${e.message} (${Math.round(performance.now() - start)}ms)`)
    }
  }

  logger.verbose(`routeLoader() => routes loaded: ${routes.length}`)

  return routes
}
