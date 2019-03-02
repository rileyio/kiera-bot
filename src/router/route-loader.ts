import * as Path from 'path'
import * as glob from 'fast-glob';
import { RouteConfiguration } from './router';

export function routeLoader() {
  // Load routes from commands folder
  const _routeFiles = glob.sync([
    'app/commands/**/*.js',
    '!app/commands/index.js',
    '!app/commands/admin.js'
  ], { deep: true })

  // Collection of routes
  var routes: Array<RouteConfiguration> = []

  // Load each route configured into the routes array
  _routeFiles.forEach(routeFile => {
    const _requiredFile: { Routes: Array<RouteConfiguration> } = require(Path.join('../../', routeFile.toString()))
    // tslint:disable-next-line:no-console
    console.log(`routeLoader() => ${routeFile.toString()}, ${_requiredFile.Routes.map(r => Array.isArray(r)).length}`)

    for (let index = 0; index < _requiredFile.Routes.length; index++) {
      const route = _requiredFile.Routes[index];
      routes.push(route)
    }
  })

  // tslint:disable-next-line:no-console
  console.log(`routeLoader() => routes loaded: ${routes.length}`)

  return routes
}