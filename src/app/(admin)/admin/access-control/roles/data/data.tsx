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

export const systemRoleOptions = [
  {
    value: 'true',
    label: 'System Roles',
  },
  {
    value: 'false',
    label: 'Custom Roles',
  },
]
