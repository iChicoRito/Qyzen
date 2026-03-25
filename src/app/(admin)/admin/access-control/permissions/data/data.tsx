import { IconCircleOff, IconShieldCheck } from '@tabler/icons-react'

export const statuses = [
  {
    value: 'active',
    label: 'Active',
    icon: IconShieldCheck,
  },
  {
    value: 'inactive',
    label: 'Inactive',
    icon: IconCircleOff,
  },
]

export const roles = [
  {
    value: 'Administrator',
    label: 'Administrator',
  },
  {
    value: 'Registrar',
    label: 'Registrar',
  },
  {
    value: 'Department Staff',
    label: 'Department Staff',
  },
]

export const actions = [
  {
    value: 'view',
    label: 'View',
  },
  {
    value: 'create',
    label: 'Create',
  },
  {
    value: 'update',
    label: 'Update',
  },
  {
    value: 'delete',
    label: 'Delete',
  },
]

export const modules = [
  {
    value: 'Users',
    label: 'Users',
  },
  {
    value: 'Roles',
    label: 'Roles',
  },
  {
    value: 'Permissions',
    label: 'Permissions',
  },
  {
    value: 'Academic Settings',
    label: 'Academic Settings',
  },
]
