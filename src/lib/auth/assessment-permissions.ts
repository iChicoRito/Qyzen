export const ASSESSMENT_PERMISSION_STRINGS = {
  view: 'assessments:view',
  create: 'assessments:create',
  update: 'assessments:update',
  delete: 'assessments:delete',
} as const

export interface AssessmentPermissions {
  canView: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

// hasAssessmentPermissionString - check if assessment permission string exists
export function hasAssessmentPermissionString(permissionStrings: string[], permissionString: string) {
  return permissionStrings.includes(permissionString)
}

// getAssessmentPermissions - map permission strings to assessment actions
export function getAssessmentPermissions(permissionStrings: string[]): AssessmentPermissions {
  return {
    canView: hasAssessmentPermissionString(permissionStrings, ASSESSMENT_PERMISSION_STRINGS.view),
    canCreate: hasAssessmentPermissionString(permissionStrings, ASSESSMENT_PERMISSION_STRINGS.create),
    canUpdate: hasAssessmentPermissionString(permissionStrings, ASSESSMENT_PERMISSION_STRINGS.update),
    canDelete: hasAssessmentPermissionString(permissionStrings, ASSESSMENT_PERMISSION_STRINGS.delete),
  }
}

