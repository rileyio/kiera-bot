import { RouteConfiguration } from '../../router/router';
import * as Commands from '../../commands';
import * as Middleware from '../../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    type: 'message',
    commandTarget: 'none',
    controller: Commands.Admin.Channel.purgeChannelMessages,
    example: '{{prefix}}admin channel purge',
    name: 'admin-channel-purge',
    permissions: {
      restricted: true
    },
    validate: '/admin:string/channel:string/purge:string',
    middleware: [
      Middleware.hasRole('developer')
    ]
  },
]