import { RouteConfiguration } from '../../utils/router';
import * as Commands from '../../commands';
import * as Middleware from '../../middleware';

export const Routes: Array<RouteConfiguration> = [
  /////// Clear channel messages
  {
    type: 'message',
    commandTarget: 'none',
    controller: Commands.Admin.Channel.purgeChannelMessages,
    example: '!admin channel purge',
    name: 'admin-channel-purge',
    validate: '/admin:string/channel:string/purge:string',
    middleware: [
      Middleware.hasRole('developer')
    ]
  },
]