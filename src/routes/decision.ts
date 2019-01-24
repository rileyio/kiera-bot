import { RouteConfiguration } from '../router/router';
import * as Commands from '../commands';
import * as Middleware from '../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    type: 'message',
    commandTarget: 'author',
    controller: Commands.Decision.newDecision,
    example: '{{prefix}}decision new "name"',
    name: 'decision-new',
    validate: '/decision:string/new:string/name=string',
    middleware: [
      Middleware.isUserRegistered
    ]
  },
  {
    type: 'message',
    commandTarget: 'author',
    controller: Commands.Decision.newDecisionEntry,
    example: '{{prefix}}decision "id" add "Your decision entry here"',
    name: 'decision-new-option',
    validate: '/decision:string/id=string/add:string/text=string',
    middleware: [
      Middleware.isUserRegistered
    ]
  },
  {
    type: 'message',
    commandTarget: 'author',
    controller: Commands.Decision.runSavedDecision,
    example: '{{prefix}}decision roll "id"',
    name: 'decision-new-option',
    validate: '/decision:string/roll:string/id=string',
    middleware: [
      Middleware.isUserRegistered
    ]
  },
  {
    type: 'message',
    commandTarget: 'author',
    controller: Commands.Decision.runRealtimeDecision,
    example: '{{prefix}}decision "Question here" "Option 1" "Option 2" "etc.."',
    name: 'decision-realtime',
    validate: '/decision:string/name=string/args...string',
    middleware: [
      Middleware.isUserRegistered
    ]
  }
]