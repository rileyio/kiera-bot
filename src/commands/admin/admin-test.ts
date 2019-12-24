// import { RouterRouted, ExportRoutes } from '@/router'

// export const Routes = ExportRoutes({
//   type: 'message',
//   category: 'Admin',
//   commandTarget: 'none',
//   controller: test,
//   example: '{{prefix}}admin test',
//   name: 'admin-test',
//   permissions: {
//     defaultEnabled: true,
//     serverAdminOnly: true,
//     restricted: true
//   },
//   validate: '/admin:string/test:string/input?=string'
// })

// /**
//  * Test Block
//  * @export
//  * @param {RouterRouted} routed
//  */
// export async function test(routed: RouterRouted) {
//   await routed.message.channel.send(`${routed.v.o.input}`)

//   return true
// }
