export const SECTION_PERMISSION_STRINGS = {
  view: 'sections:view',
  create: 'sections:create',
  update: 'sections:update',
  delete: 'sections:delete',
} as const

export interface SectionPermissions {
  canView: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

// hasPermissionString - check if permission string exists
export function hasPermissionString(permissionStrings: string[], permissionString: string) {
  return permissionStrings.includes(permissionString)
}

// getSectionPermissions - map permission strings to section actions
export function getSectionPermissions(permissionStrings: string[]): SectionPermissions {
  return {
    canView: hasPermissionString(permissionStrings, SECTION_PERMISSION_STRINGS.view),
    canCreate: hasPermissionString(permissionStrings, SECTION_PERMISSION_STRINGS.create),
    canUpdate: hasPermissionString(permissionStrings, SECTION_PERMISSION_STRINGS.update),
    canDelete: hasPermissionString(permissionStrings, SECTION_PERMISSION_STRINGS.delete),
  }
}
