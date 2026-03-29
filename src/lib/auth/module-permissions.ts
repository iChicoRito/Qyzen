export const MODULE_PERMISSION_STRINGS = {
  view: 'modules:view',
  create: 'modules:create',
  update: 'modules:update',
  delete: 'modules:delete',
} as const

export interface ModulePermissions {
  canView: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

// hasModulePermissionString - check if module permission string exists
export function hasModulePermissionString(permissionStrings: string[], permissionString: string) {
  return permissionStrings.includes(permissionString)
}

// getModulePermissions - map permission strings to module actions
export function getModulePermissions(permissionStrings: string[]): ModulePermissions {
  return {
    canView: hasModulePermissionString(permissionStrings, MODULE_PERMISSION_STRINGS.view),
    canCreate: hasModulePermissionString(permissionStrings, MODULE_PERMISSION_STRINGS.create),
    canUpdate: hasModulePermissionString(permissionStrings, MODULE_PERMISSION_STRINGS.update),
    canDelete: hasModulePermissionString(permissionStrings, MODULE_PERMISSION_STRINGS.delete),
  }
}
