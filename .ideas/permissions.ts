//// Object
export class Permission {
  public readonly _id: ObjectID = new ObjectID()
  public readonly name: string
  public enabled: boolean = false
  public allowed: Array<PermissionScopeTarget> = []
  public denied: Array<PermissionScopeTarget> = []
  public scope: 'api' | 'channel' | 'dm' | 'server' | 'role' | 'user' |'web'
  public appliesTo: string
  public priority: number = 100

  public denyAll: boolean = false
  public allowAll: boolean = false

  public author: ObjectID
  public editedBy: Array<ObjectID> = []
  public description: string

  constructor(init: Partial<Permission>) {
    Object.assign(this, init)
    // Create the unique name
    this.name = this.nameGenerator()
  }

  private nameGenerator(){
    return `${this.appliesTo}.${this.scope}.${this.priority}`
  }
}


////// Helpers

export const PermissionsPriority = {
  user: 0,
  channel: 1,
  role: 2,
  server: 3
}

export class VerifyPermissionsBuilder {
  private readonly permissions: Array<Permission> = []
  private filtered: Array<Permission> = []

  constructor(permissions: Array<Permission>) {
    this.permissions = permissions
    // Sort based on PermissionsPriority
    this.filtered = this.permissions.sort((a, b) => {
      return PermissionsPriority[a.scope] - PermissionsPriority[b.scope]
    })
  }

  public appliesTo(name: string) {
    this.filtered = this.filtered.filter(p => p.appliesTo === name)
    return this
  }

  public end(lookFor: { user?: string; channel?: string; role?: string; server?: string }) {
    var allowed = false
    // Look through the filtered chain to find any matching
    for (let index = 0; index < this.filtered.length; index++) {
      const permission = this.filtered[index]
      const _containsAllow = permission.allowed.findIndex(p => {
        return p.target
      })
    }
  }
}

export function VerifyPermissions(permissions: Array<Permission>) {
  return new VerifyPermissionsBuilder(permissions)
}