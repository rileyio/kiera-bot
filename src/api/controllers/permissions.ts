// import * as Middleware from '@/api/middleware'
// import * as Validation from '@/api/validations'
// import * as errors from 'restify-errors'

// import { WebRoute, WebRouted } from '@/api/web-router'

// import { ObjectId } from 'bson'
// import { sb } from '@/utils'
// import { validate } from '@/api/utils/validate'

// const GLOBAL_PREFIX = process.env.BOT_MESSAGE_PREFIX

// export const Routes: Array<WebRoute> = [
//   {
//     controller: getAll,
//     method: 'post',
//     middleware: [Middleware.isAuthenticatedOwner],
//     name: 'permissions-get-all',
//     path: '/api/permissions'
//   },
//   {
//     controller: updateGlobal,
//     method: 'post',
//     middleware: [Middleware.isAuthenticatedOwner],
//     name: 'permission-update-global',
//     path: '/api/permission/global/update'
//   },
//   {
//     controller: deleteGlobal,
//     method: 'delete',
//     middleware: [Middleware.isAuthenticatedOwner],
//     name: 'permission-delete-global',
//     path: '/api/permission/global/delete'
//   },
//   {
//     controller: updateAllowed,
//     method: 'post',
//     middleware: [Middleware.isAuthenticatedOwner],
//     name: 'permission-update-allowed',
//     path: '/api/permission/allowed/update'
//   }
// ]

// export async function getAll(routed: WebRouted) {
//   const v = await validate(Validation.Permissions.getAll(), routed.req.body)
//   // await validate(Validation.Permissions.getAll(), req.body)

//   console.log(v)
//   // this.DEBUG_WEBAPI('req params', v.o)

//   if (v.valid) {
//     const server = await routed.Bot.DB.get('servers', { id: v.o.serverID })
//     const prefix = server.prefix || GLOBAL_PREFIX

//     // Get the same routes the router loader uses
//     const routes = routed.Bot.Router.routes
//     const query = {
//       key: undefined as string,
//       serverID: v.o.serverID,
//       state: undefined as boolean
//     }

//     // Check ChastiKey enabled state in db
//     const ckEnabledState = (await routed.Bot.DB.get('server-settings', {
//       key: 'server.chastikey.enabled',
//       serverID: v.o.serverID,
//       state: true
//     })) || { state: true, value: false }

//     if (!ckEnabledState.value && ckEnabledState.state) {
//       query['command'] = { $not: /^ck-/ }
//     }

//     console.log(ckEnabledState, query)

//     // Get permissions stored in the db
//     const permissions = await routed.Bot.DB.getMultiple('command-permissions', query)
//     // Sort by permission name
//     permissions.sort((a, b) => {
//       const x = a.command.toLowerCase()
//       const y = b.command.toLowerCase()
//       if (x < y) {
//         return -1
//       }
//       if (x > y) {
//         return 1
//       }
//       return 0
//     })

//     // Map in the route examples & categories
//     permissions.map((p) => {
//       // console.log(p)
//       const matchingRoute = routes.find((r) => r.name === p.command)
//       if (matchingRoute) {
//         // console.log(matchingRoute)
//         p.example = sb(matchingRoute.example, { prefix })
//         p.category = matchingRoute.category
//       }
//     })

//     return routed.res.send(permissions)
//   }

//   // On error
//   return routed.next(new errors.BadRequestError())
// }

// export async function get(routed: WebRouted) {
//   const v = await validate(Validation.Permissions.get(), routed.req.body)

//   // this.DEBUG_WEBAPI('req params', v.o)

//   // if (v.valid) {
//   //   var permission = await routed.Bot.Permissions.get({
//   //     _id: new ObjectId(v.o.id),
//   //   })

//   //   // If session does not exist, return error
//   //   if (!permission) return routed.next(new errors.BadRequestError());
//   //   return routed.res.send(permission);
//   // }

//   // On error
//   return routed.next(new errors.BadRequestError())
// }

// export async function updateGlobal(routed: WebRouted) {
//   const v = await validate(Validation.Permissions.updateGlobal(), routed.req.body)

//   if (v.valid) {
//     // Update global permission in db
//     const updateCount = await routed.Bot.DB.update('command-permissions', { _id: new ObjectId(v.o._id) }, { enabled: v.o.state })
//     if (updateCount > 0) return routed.res.send({ status: 'updated', success: true })
//     return routed.res.send({ status: 'failed', success: false })
//   }

//   // On error
//   return routed.next(new errors.BadRequestError())
// }

// export async function deleteGlobal(routed: WebRouted) {
//   const v = await validate(Validation.Permissions.deleteGlobal(), routed.req.body)

//   if (v.valid) {
//     // Update allowed permission in db
//     const deleteCount = await routed.Bot.DB.remove('command-permissions', {
//       _id: new ObjectId(v.o._id)
//     })
//     if (deleteCount > 0) return routed.res.send({ status: 'deleted', success: true })
//     return routed.res.send({ status: 'failed', success: false })
//   }

//   // On error
//   return routed.next(new errors.BadRequestError())
// }

// export async function updateAllowed(routed: WebRouted) {
//   const v = await validate(Validation.Permissions.updateAllowed(), routed.req.body)

//   if (v.valid) {
//     // Update allowed permission in db
//     const updateCount = await routed.Bot.DB.update(
//       'command-permissions',
//       {
//         _id: new ObjectId(v.o._id),
//         'allowed.target': v.o.target,
//         command: v.o.command
//       },
//       {
//         $set: {
//           'allowed.$.allow': v.o.state
//         }
//       },
//       { atomic: true }
//     )
//     if (updateCount > 0) return routed.res.send({ status: 'updated', success: true })
//     return routed.res.send({ status: 'failed', success: false })
//   }

//   // On error
//   return routed.next(new errors.BadRequestError())
// }
