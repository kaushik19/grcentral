import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/',            redirect: '/dashboard' },
  { path: '/dashboard',   component: () => import('@/views/DashboardView.vue'),  meta: { section: 'Workspace',     page: 'Dashboard' } },
  { path: '/radar',       component: () => import('@/views/RadarView.vue'),       meta: { section: 'Workspace',     page: 'Regulatory Radar' } },
  { path: '/drift',       component: () => import('@/views/DriftView.vue'),       meta: { section: 'Workspace',     page: 'Risk Drift' } },
  { path: '/gaps',        component: () => import('@/views/GapsView.vue'),        meta: { section: 'Compliance',    page: 'Compliance Gaps' } },
  { path: '/actions',     component: () => import('@/views/ActionsView.vue'),     meta: { section: 'Compliance',    page: 'Preventive Actions' } },
  { path: '/controls',    component: () => import('@/views/ControlsView.vue'),    meta: { section: 'Compliance',    page: 'Controls' } },
  { path: '/policies',    component: () => import('@/views/PoliciesView.vue'),    meta: { section: 'Compliance',    page: 'Internal Policies' } },
  { path: '/evidence',    component: () => import('@/views/EvidenceView.vue'),    meta: { section: 'Compliance',    page: 'Evidence Vault' } },
  { path: '/sources',     component: () => import('@/views/SourcesView.vue'),     meta: { section: 'Configuration', page: 'Sources' } },
  { path: '/team',        component: () => import('@/views/TeamView.vue'),        meta: { section: 'Configuration', page: 'Team' } },
  { path: '/about',       component: () => import('@/views/AboutView.vue'),       meta: { section: 'Configuration', page: 'About' } },
  {
    path: '/regulation/:id',
    component: () => import('@/views/RegulationDetailView.vue'),
    meta: { section: 'Workspace', page: 'Regulation' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
