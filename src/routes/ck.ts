import { RouteConfiguration } from '../utils/router';
import * as Commands from '../controllers/commands';

export const Routes: Array<RouteConfiguration> = [
  {
    controller: Commands.setUsername,
    example: '!ck username MyUsername',
    name: 'ck-set-username',
    validate: '/ck:string/username:string/ckusername=string'
  },
  {
    controller: Commands.setTickerType,
    example: '!ck ticker set type 2',
    name: 'ck-set-tickerType',
    validate: '/ck:string/ticker:string/set:string/type:string/number=number'
  },
  {
    controller: Commands.getTicker,
    example: '!ck ticker',
    name: 'ck-get-ticker',
    validate: '/ck:string/ticker:string'
  },
]