export const SUBJECT_PERMISSION_STRINGS = {
  view: 'subjects:view',
  create: 'subjects:create',
  update: 'subjects:update',
  delete: 'subjects:delete',
} as const

export interface SubjectPermissions {
  canView: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

// hasSubjectPermissionString - check if subject permission string exists
export function hasSubjectPermissionString(permissionStrings: string[], permissionString: string) {
  return permissionStrings.includes(permissionString)
}

// getSubjectPermissions - map permission strings to subject actions
export function getSubjectPermissions(permissionStrings: string[]): SubjectPermissions {
  return {
    canView: hasSubjectPermissionString(permissionStrings, SUBJECT_PERMISSION_STRINGS.view),
    canCreate: hasSubjectPermissionString(permissionStrings, SUBJECT_PERMISSION_STRINGS.create),
    canUpdate: hasSubjectPermissionString(permissionStrings, SUBJECT_PERMISSION_STRINGS.update),
    canDelete: hasSubjectPermissionString(permissionStrings, SUBJECT_PERMISSION_STRINGS.delete),
  }
}
