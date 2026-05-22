/**
 * The ONLY seeded data in the entire application.
 * These are fictional personas representing different roles in a GRC team.
 * Everything else (risks, controls, gaps, evidence, actions, drift) is
 * derived dynamically from uploaded policy documents scanned against
 * real framework controls.
 */
import type { Persona } from '@/types'

export const SEED_PERSONAS: Persona[] = [
  {
    id: 'aarav',
    name: 'Aarav Mehta',
    role: 'Chief Compliance Officer',
    email: 'aarav@grcentral.io',
    avatar: 'AM',
    primaryView: '/dashboard',
    businessUnitId: 'org',
  },
  {
    id: 'priya',
    name: 'Priya Sharma',
    role: 'AI Governance Lead',
    email: 'priya@grcentral.io',
    avatar: 'PS',
    primaryView: '/actions',
    businessUnitId: 'org',
  },
  {
    id: 'rohan',
    name: 'Rohan Iyer',
    role: 'DPO / Privacy Counsel',
    email: 'rohan@grcentral.io',
    avatar: 'RI',
    primaryView: '/gaps',
    businessUnitId: 'org',
  },
  {
    id: 'ananya',
    name: 'Ananya Reddy',
    role: 'Risk & Controls Manager',
    email: 'ananya@grcentral.io',
    avatar: 'AR',
    primaryView: '/controls',
    businessUnitId: 'org',
  },
  {
    id: 'vikram',
    name: 'Vikram Singh',
    role: 'CISO / Security Director',
    email: 'vikram@grcentral.io',
    avatar: 'VS',
    primaryView: '/evidence',
    businessUnitId: 'org',
  },
  {
    id: 'kavya',
    name: 'Kavya Nair',
    role: 'Regulatory Affairs Lead',
    email: 'kavya@grcentral.io',
    avatar: 'KN',
    primaryView: '/radar',
    businessUnitId: 'org',
  },
  {
    id: 'aditya',
    name: 'Aditya Joshi',
    role: 'Internal Audit Lead',
    email: 'aditya@grcentral.io',
    avatar: 'AJ',
    primaryView: '/evidence',
    businessUnitId: 'org',
  },
]
