import {
  HomeIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'

export const navigationItems = [
  {
    name: 'dashboard',
    path: '',
    icon: HomeIcon,
    roles: []
  },
  {
    name: 'therapists',
    path: '/therapists',
    icon: UserGroupIcon,
    roles: ['patient']
  },
  {
    name: 'patients',
    path: '/patients',
    icon: UserGroupIcon,
    roles: ['therapist', 'admin']
  },
  {
    name: 'schedule',
    path: '/schedule',
    icon: CalendarIcon,
    roles: []
  },
  {
    name: 'messages',
    path: '/messages',
    icon: ChatBubbleLeftRightIcon,
    roles: []
  },
  {
    name: 'resources',
    path: '/resources',
    icon: BookOpenIcon,
    roles: []
  },
  {
    name: 'admin',
    path: '/admin',
    icon: BuildingOfficeIcon,
    roles: ['admin'],
    children: [
      {
        name: 'users',
        path: '/admin/users',
        icon: UserGroupIcon
      },
      {
        name: 'tenants',
        path: '/admin/tenants',
        icon: BuildingOfficeIcon
      },
      {
        name: 'audit',
        path: '/admin/audit',
        icon: DocumentTextIcon
      }
    ]
  }
]

export const mobileNavigationItems = [
  {
    name: 'dashboard',
    path: '',
    icon: HomeIcon,
    roles: []
  },
  {
    name: 'schedule',
    path: '/schedule',
    icon: CalendarIcon,
    roles: []
  },
  {
    name: 'messages',
    path: '/messages',
    icon: ChatBubbleLeftRightIcon,
    roles: []
  },
  {
    name: 'profile',
    path: '/profile',
    icon: UserIcon,
    roles: []
  },
  {
    name: 'settings',
    path: '/settings',
    icon: Cog6ToothIcon,
    roles: []
  }
]
