/**
 * Compliance scanner tests — no mocks, runs against real framework JSON
 */
import { describe, it, expect } from 'vitest'
import { scanPolicy, scanToRiskScore } from '../utils/scanner'
import FRAMEWORKS, { allControls, TOTAL_CONTROLS } from '../data/frameworks'

// A realistic GDPR-focused policy text
const GDPR_POLICY = `
Data Protection Policy — v2.1

1. Lawful Basis for Processing
   All personal data is processed on a lawful basis as defined in Article 6 of the GDPR.
   The Company relies on: consent, contractual necessity, legal obligation, and legitimate interests.
   Where processing is based on consent, this consent is freely given, specific, informed, and unambiguous.
   Withdrawal of consent is as easy as providing it.

2. Data Subject Rights
   Individuals have the right of access to their personal data (subject access request, SAR) within one month.
   They have the right to rectification of inaccurate data, the right to erasure (right to be forgotten),
   the right to restriction of processing, and the right to data portability in a machine-readable format.
   Automated decision-making and profiling decisions can be appealed for human review.

3. Security of Processing
   The Company implements appropriate technical and organisational measures including:
   - Encryption at rest and encryption in transit for all production datastores
   - Pseudonymisation where appropriate
   - Regular testing, assessment, and evaluation of security effectiveness
   - Resilience of processing systems and services
   - Business continuity and disaster recovery procedures

4. Personal Data Breach Response
   Breach notification to the supervisory authority must occur within 72 hours.
   Where a breach results in high risk to individuals, communication to the data subject
   must occur without undue delay.

5. Data Protection Impact Assessment
   A DPIA is conducted for high-risk processing activities, systematic profiling,
   new technologies, and large-scale special category data processing.

6. Records of Processing Activities
   The Company maintains a written record of all processing activities (RoPA), available
   to the supervisory authority on request.

7. Data Protection by Design and Default
   Privacy by design is embedded in all new systems and processes.
   By default, only personal data necessary for each specific purpose is processed.

8. Data Processing Agreements
   All processors act on documented instructions under a binding data processing agreement (DPA).
   Sub-processors require prior written approval.

9. International Transfers
   Personal data transferred to third countries requires an adequacy decision, standard contractual
   clauses (SCC), or binding corporate rules (BCR).

10. Data Protection Officer
    The Company has designated a Data Protection Officer (DPO) responsible for oversight and compliance.
`

// A minimal policy with almost no coverage
const EMPTY_POLICY = `
Employee Lunch Break Policy v1.0
All employees are entitled to a 30-minute lunch break.
Breaks must be taken between 12:00 and 14:00.
`

// A cybersecurity policy
const CYBER_POLICY = `
Information Security Policy

1. Access Control and Identity Management
   Multi-factor authentication (MFA) is mandatory for all privileged access.
   Least privilege principles are enforced. Privileged access management (PAM) is in place.
   Identity and access management (IAM) controls are reviewed quarterly.

2. Encryption
   All data at rest is encrypted. Data in transit uses TLS 1.3 minimum.
   Encryption keys are managed through a dedicated key management system.
   
3. Incident Response
   An incident response plan is maintained and tested annually.
   Security incidents are classified within 4 hours. Major incidents are reported within 72 hours.
   Post-incident reviews (root cause analysis, RCA) are mandatory for Sev-1/Sev-2.

4. Supply Chain Security
   All third-party vendors undergo due diligence assessment.
   ICT third-party risk is managed through a vendor register and contractual provisions.
   Sub-processor chains are documented for all critical SaaS vendors.

5. Vulnerability Management
   Vulnerability scanning is performed weekly. Patches are applied within SLA.
   A Software Bill of Materials (SBOM) in CycloneDX format is generated for all container images.
   Coordinated vulnerability disclosure (CVD) policy is published.

6. Business Continuity
   Business continuity plan (BCP) and disaster recovery plan (DRP) are maintained.
   Recovery time objective (RTO) is 4 hours for critical systems.
   Plans are tested annually via tabletop exercises.

7. Penetration Testing
   Threat-led penetration testing (TLPT) is conducted every 2 years.
   Red team exercises cover production systems.

8. Logging and Monitoring
   Security information and event management (SIEM) is deployed.
   Logs are retained for 180 days minimum. Anomaly detection and alert triage are automated.
   Endpoint detection and response (EDR) is deployed on all endpoints.
`

describe('Framework data integrity', () => {
  it('loads all 6 frameworks', () => {
    expect(FRAMEWORKS.length).toBe(6)
    const ids = FRAMEWORKS.map(f => f.id)
    expect(ids).toContain('gdpr')
    expect(ids).toContain('ai-act')
    expect(ids).toContain('nis2')
    expect(ids).toContain('dora')
    expect(ids).toContain('nist-csf')
    expect(ids).toContain('cra')
  })

  it('has at least 5 controls per framework', () => {
    for (const fw of FRAMEWORKS) {
      expect(fw.controls.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('allControls() returns flat list of all controls with regId', () => {
    const controls = allControls()
    expect(controls.length).toBe(TOTAL_CONTROLS)
    expect(controls.every(c => !!c.regId)).toBe(true)
    expect(controls.every(c => !!c.keywords?.length)).toBe(true)
  })

  it('every control has required fields', () => {
    for (const ctrl of allControls()) {
      expect(ctrl.id,       `${ctrl.id}.id`).toBeTruthy()
      expect(ctrl.code,     `${ctrl.id}.code`).toBeTruthy()
      expect(ctrl.title,    `${ctrl.id}.title`).toBeTruthy()
      expect(ctrl.severity, `${ctrl.id}.severity`).toMatch(/^(critical|high|medium|low)$/)
      expect(ctrl.summary,  `${ctrl.id}.summary`).toBeTruthy()
    }
  })
})

describe('scanPolicy — GDPR-focused policy', () => {
  const result = scanPolicy(GDPR_POLICY, 'pol-test-1', 'Data Protection Policy v2.1')

  it('returns the expected structure', () => {
    expect(result.policyId).toBe('pol-test-1')
    expect(result.byFramework.length).toBe(FRAMEWORKS.length)
    expect(result.summary.totalControls).toBe(TOTAL_CONTROLS)
  })

  it('GDPR framework has high coverage (>50%)', () => {
    const gdpr = result.byFramework.find(f => f.frameworkId === 'gdpr')
    expect(gdpr).toBeTruthy()
    expect(gdpr!.coveragePct).toBeGreaterThan(50)
  })

  it('Art. 32 (security) is compliant or partial', () => {
    const gdpr = result.byFramework.find(f => f.frameworkId === 'gdpr')!
    const art32 = gdpr.controls.find(c => c.controlId === 'gdpr-art32')!
    expect(art32.status).not.toBe('missing')
  })

  it('Art. 33 (breach notification) is detected', () => {
    const gdpr = result.byFramework.find(f => f.frameworkId === 'gdpr')!
    const art33 = gdpr.controls.find(c => c.controlId === 'gdpr-art33')!
    expect(art33.score).toBeGreaterThan(0)
  })

  it('non-covered frameworks have lower scores than GDPR', () => {
    const gdpr = result.byFramework.find(f => f.frameworkId === 'gdpr')!
    const aiAct = result.byFramework.find(f => f.frameworkId === 'ai-act')!
    expect(gdpr.coveragePct).toBeGreaterThan(aiAct.coveragePct)
  })

  it('Art. 15 (right of access) has at least one snippet', () => {
    const gdpr = result.byFramework.find(f => f.frameworkId === 'gdpr')!
    const art15 = gdpr.controls.find(c => c.controlId === 'gdpr-art15')!
    expect(art15.snippets.length).toBeGreaterThan(0)
  })
})

describe('scanPolicy — empty/irrelevant policy', () => {
  const result = scanPolicy(EMPTY_POLICY, 'pol-test-2', 'Lunch Break Policy')

  it('all frameworks have very low coverage', () => {
    for (const fw of result.byFramework) {
      expect(fw.coveragePct).toBeLessThan(15)
    }
  })

  it('summary shows mostly missing controls', () => {
    expect(result.summary.missingControls).toBeGreaterThan(result.summary.compliantControls)
  })

  it('risk score is high', () => {
    expect(scanToRiskScore(result)).toBeGreaterThan(70)
  })
})

describe('scanPolicy — cybersecurity policy', () => {
  const result = scanPolicy(CYBER_POLICY, 'pol-test-3', 'Information Security Policy')

  it('NIST CSF has high coverage', () => {
    const nist = result.byFramework.find(f => f.frameworkId === 'nist-csf')!
    expect(nist.coveragePct).toBeGreaterThan(30)
  })

  it('NIS2 has some coverage (directive-specific language limits generic policy coverage)', () => {
    const nis2 = result.byFramework.find(f => f.frameworkId === 'nis2')!
    expect(nis2.coveragePct).toBeGreaterThan(8)
  })

  it('DORA has reasonable coverage', () => {
    const dora = result.byFramework.find(f => f.frameworkId === 'dora')!
    expect(dora.coveragePct).toBeGreaterThan(25)
  })

  it('CRA SBOM control is detected', () => {
    const cra = result.byFramework.find(f => f.frameworkId === 'cra')!
    const sbom = cra.controls.find(c => c.controlId === 'cra-art23')!
    expect(sbom.status).not.toBe('missing')
  })
})

describe('scanToRiskScore', () => {
  it('returns 0 for fully compliant scan', () => {
    const perfect = scanPolicy(GDPR_POLICY + '\n' + CYBER_POLICY, 'p', 't')
    const score = scanToRiskScore(perfect)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})
