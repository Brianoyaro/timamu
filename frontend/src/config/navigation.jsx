import {
  Home,
  Calendar,
  MessageCircle,
  User,
  Settings,
  Users,
  Building,
  FileText,
  BookOpen
} from 'lucide-react'

export const navigationItems = [
  {
    name: 'dashboard',
    path: '',
    icon: Home,
    roles: []
  },
  {
    name: 'therapists',
    path: '/therapists',
    icon: Users,
    roles: ['patient']
  },
  {
    name: 'patients',
    path: '/patients',
    icon: Users,
    roles: ['therapist', 'admin']
  },
  {
    name: 'schedule',
    path: '/schedule',
    icon: Calendar,
    roles: []
  },
  {
    name: 'messages',
    path: '/messages',
    icon: MessageCircle,
    roles: []
  },
  {
    name: 'resources',
    path: '/resources',
    icon: BookOpen,
    roles: []
  },
  {
    name: 'admin',
    path: '/admin',
    icon: Building,
    roles: ['admin'],
    children: [
      {
        name: 'users',
        path: '/admin/users',
        icon: Users
      },
      {
        name: 'tenants',
        path: '/admin/tenants',
        icon: Building
      },
      {
        name: 'audit',
        path: '/admin/audit',
        icon: FileText
      }
    ]
  }
]

export const mobileNavigationItems = [
  {
    name: 'dashboard',
    path: '',
    icon: Home,
    roles: []
  },
  {
    name: 'schedule',
    path: '/schedule',
    icon: Calendar,
    roles: []
  },
  {
    name: 'messages',
    path: '/messages',
    icon: MessageCircle,
    roles: []
  },
  {
    name: 'profile',
    path: '/profile',
    icon: User,
    roles: []
  },
  {
    name: 'settings',
    path: '/settings',
    icon: Settings,
    roles: []
  }
]
