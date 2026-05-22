/**
 * Seeded policy documents
 * =======================
 * Realistic internal policies pre-loaded so the app shows production-like data
 * from the first launch. All text is plausible corporate policy language.
 *
 * Policy 1 — "Data Protection & Privacy Policy v3.2"
 *   Comprehensive coverage of GDPR, with explicit article references.
 *   Expected: GDPR ~70%+, some NIST coverage.
 *
 * Policy 2 — "AI Governance & Model Risk Policy v1.1"
 *   Covers AI Act controls, GDPR automated decision-making.
 *   Expected: AI Act ~60%+, GDPR Art.22 covered.
 *
 * Policy 3 — "Information Security Policy v2.0"
 *   Broad cybersecurity coverage: NIS2, DORA, NIST CSF.
 *   Expected: NIST CSF ~50%+, NIS2 ~25%+, DORA ~30%+.
 */

export interface SeedPolicyDoc {
  id:          string
  title:       string
  version:     string
  status:      'published' | 'draft' | 'under-review'
  format:      'text'
  description: string
  tags:        string[]
  uploadedBy:  string
  uploadedAt:  string
  textContent: string
}

export const SEED_POLICY_DOCS: SeedPolicyDoc[] = [

  // ─── Policy 1: Data Protection & Privacy ─────────────────────────────────
  {
    id:          'seed-pol-001',
    title:       'Data Protection & Privacy Policy',
    version:     '3.2',
    status:      'published',
    format:      'text',
    description: 'Comprehensive data protection policy covering GDPR obligations, data subject rights, breach response, and international transfer mechanisms.',
    tags:        ['gdpr', 'privacy', 'data protection', 'dpo'],
    uploadedBy:  'rohan',
    uploadedAt:  '2026-04-15T09:00:00.000Z',
    textContent: `DATA PROTECTION & PRIVACY POLICY
Version 3.2 | Effective 1 April 2026 | Owner: Data Protection Officer

1. PURPOSE AND SCOPE
   This policy establishes BABCOM's approach to personal data protection in compliance with
   the General Data Protection Regulation (GDPR) 2016/679 and applicable national data
   protection laws. It applies to all processing of personal data by BABCOM and its processors.

2. PRINCIPLES RELATING TO PROCESSING OF PERSONAL DATA (Art. 5 GDPR)
   All personal data processed by BABCOM shall be:
   (a) Processed lawfully, fairly and in a transparent manner (lawfulness, fairness, transparency)
   (b) Collected for specified, explicit and legitimate purposes and not further processed in a
       manner incompatible with those purposes (purpose limitation)
   (c) Adequate, relevant and limited to what is necessary in relation to the purposes for which
       they are processed (data minimisation)
   (d) Accurate and kept up to date; reasonable steps must be taken to ensure inaccurate data
       is erased or rectified without delay (accuracy)
   (e) Kept in a form which permits identification of data subjects for no longer than necessary
       for the purposes for which the personal data are processed (storage limitation)
   (f) Processed in a manner that ensures appropriate security of the personal data, including
       protection against unauthorised or unlawful processing and against accidental loss,
       destruction or damage, using appropriate technical and organisational measures
       (integrity and confidentiality)
   The Data Protection Officer is accountable for and must be able to demonstrate compliance
   with these principles (accountability).

3. LAWFUL BASIS FOR PROCESSING (Art. 6 GDPR)
   Processing of personal data is lawful only where at least one of the following lawful bases
   applies: consent of the data subject; necessity for performance of a contract; compliance with
   a legal obligation; protection of vital interests; performance of a task in the public interest;
   or legitimate interests pursued by BABCOM or a third party. The applicable lawful basis for
   each processing activity is documented in the Records of Processing Activities (RoPA).

4. CONDITIONS FOR CONSENT (Art. 7 GDPR)
   Where processing is based on consent, BABCOM must be able to demonstrate that the data subject
   has given consent. Consent must be freely given, specific, informed and unambiguous. Withdrawal
   of consent must be as easy as giving consent. BABCOM records the date, method and scope of
   consent obtained from data subjects.

5. SPECIAL CATEGORIES OF PERSONAL DATA (Art. 9 GDPR)
   Processing of special category data — including health data, biometric data, genetic data,
   racial or ethnic origin, political opinions, religious beliefs, trade union membership and
   sexual orientation — is prohibited unless an explicit exception under Art. 9(2) applies.
   Explicit consent or another applicable legal ground must be documented before any special
   category processing commences.

6. DATA SUBJECT RIGHTS
   6.1 Right of Access (Art. 15 GDPR)
       Data subjects have the right to obtain confirmation of whether personal data is processed
       and to receive a copy of that data. Subject access requests (SAR) must be responded to
       within one month of receipt. The response must include supplementary information such as
       the purposes of processing, the categories of data, and the retention period.

   6.2 Right to Rectification (Art. 16 GDPR)
       Data subjects have the right to rectification of inaccurate personal data. Incomplete
       data must be completed. Rectification must occur without undue delay.

   6.3 Right to Erasure — Right to be Forgotten (Art. 17 GDPR)
       Data subjects may request erasure when: data is no longer necessary; consent is withdrawn
       and no other legal ground applies; an objection is upheld; the processing was unlawful;
       or erasure is required to comply with a legal obligation.

   6.4 Right to Restriction of Processing (Art. 18 GDPR)
       Data subjects may restrict processing while contesting accuracy, pending assessment of an
       objection, where processing is unlawful but the subject opposes erasure, or where BABCOM
       no longer needs the data but the subject requires it for legal proceedings.

   6.5 Right to Data Portability (Art. 20 GDPR)
       Where processing is based on consent or contractual necessity and is automated, data
       subjects have the right to receive their data in a structured, commonly used and
       machine-readable format. Where technically feasible, the data must be transmitted directly
       to another controller upon request.

   6.6 Right to Object (Art. 21 GDPR)
       Data subjects have the right to object to processing based on legitimate interests or
       direct marketing. BABCOM must cease processing for direct marketing immediately upon
       receiving an objection. For other processing, BABCOM must demonstrate compelling legitimate
       grounds that override the data subject's interests.

   6.7 Automated Decision-Making and Profiling (Art. 22 GDPR)
       Data subjects have the right not to be subject to solely automated decisions that produce
       significant effects, including profiling. Where automated decision-making is unavoidable,
       BABCOM must ensure the right to human review, the right to obtain an explanation of the
       decision, and the right to contest the decision.

7. TRANSPARENCY (Arts. 12–14 GDPR)
   BABCOM provides privacy information to data subjects in a concise, transparent, intelligible
   and easily accessible form, using clear and plain language. At the time of collection, a privacy
   notice is provided covering: the controller's identity and contact details; the DPO's contact;
   the purposes and legal basis; the recipients; retention periods; all data subject rights; and
   the right to lodge a complaint with the supervisory authority. Where data is collected from
   third parties, the same information is provided within one month of obtaining the data.

8. DATA PROTECTION BY DESIGN AND BY DEFAULT (Art. 25 GDPR)
   Privacy by design is embedded into all new systems, services and processing activities from
   inception. Technical and organisational measures ensure that, by default, only personal data
   that is necessary for each specific purpose is processed. This includes data minimisation,
   pseudonymisation, access controls, and default-private settings.

9. DATA PROCESSING AGREEMENTS (Art. 28 GDPR)
   All processors who process personal data on behalf of BABCOM must operate under a binding
   data processing agreement (DPA). Processors may not engage sub-processors without prior
   written authorisation from BABCOM. DPAs must include the required Art. 28(3) provisions.

10. RECORDS OF PROCESSING ACTIVITIES — RoPA (Art. 30 GDPR)
    BABCOM maintains a written record of all processing activities under its responsibility.
    The RoPA includes: the name and contact details of the controller; the purposes of processing;
    a description of the categories of data subjects and personal data; the categories of
    recipients; international transfers and safeguards; retention periods; and a description
    of technical and organisational security measures. The RoPA is available to the supervisory
    authority on request.

11. SECURITY OF PROCESSING (Art. 32 GDPR)
    BABCOM implements appropriate technical and organisational measures to ensure a level of
    security appropriate to the risk, including:
    (a) Pseudonymisation and encryption of personal data
    (b) The ability to ensure ongoing confidentiality, integrity, availability and resilience
        of processing systems and services
    (c) The ability to restore availability and access to personal data in a timely manner
        in the event of a physical or technical incident (business continuity, disaster recovery)
    (d) A process for regularly testing, assessing and evaluating the effectiveness of technical
        and organisational measures (security testing)
    All production databases containing personal data are encrypted at rest using AES-256.
    Data in transit is protected using TLS 1.3 or higher.

12. PERSONAL DATA BREACH NOTIFICATION
    12.1 Notification to Supervisory Authority (Art. 33 GDPR)
         BABCOM must notify the competent supervisory authority of a personal data breach within
         72 hours of becoming aware of it, where feasible. The notification must include the
         nature of the breach, categories and approximate number of data subjects affected,
         likely consequences, and measures taken. If notification within 72 hours is not feasible,
         the reasons for delay must be provided.

    12.2 Communication to Data Subjects (Art. 34 GDPR)
         Where a breach is likely to result in a high risk to the rights and freedoms of natural
         persons, BABCOM must communicate the breach to the affected data subjects without undue
         delay, describing the nature of the breach, likely consequences, and measures taken.

13. DATA PROTECTION IMPACT ASSESSMENT — DPIA (Art. 35 GDPR)
    A data protection impact assessment is required prior to processing that is likely to result
    in a high risk, particularly for: systematic and extensive profiling with significant effects;
    large-scale processing of special category data; and systematic monitoring of publicly
    accessible areas. The DPIA must describe the processing, assess necessity and proportionality,
    and identify measures to address risks. The DPO must be consulted.

14. DATA PROTECTION OFFICER (Art. 37 GDPR)
    BABCOM has designated a Data Protection Officer (DPO). The DPO is responsible for:
    informing and advising BABCOM on GDPR obligations; monitoring compliance; providing advice
    on DPIAs; cooperating with the supervisory authority; and acting as a contact point.

15. INTERNATIONAL TRANSFERS (Arts. 44–46 GDPR)
    Personal data may only be transferred to a third country where an adequate level of protection
    is ensured. Transfers are made on the basis of: an adequacy decision by the European Commission;
    standard contractual clauses (SCC); binding corporate rules (BCR); or approved derogations.
    All international transfers are documented in the RoPA. Sub-processors in third countries
    must be bound by SCCs or equivalent safeguards.

16. REVIEW
    This policy is reviewed annually or following significant regulatory changes.
`,
  },

  // ─── Policy 2: AI Governance ──────────────────────────────────────────────
  {
    id:          'seed-pol-002',
    title:       'AI Governance & Model Risk Policy',
    version:     '1.1',
    status:      'published',
    format:      'text',
    description: 'Governance framework for AI systems covering EU AI Act obligations, model risk management, high-risk AI classification, GPAI documentation, and human oversight requirements.',
    tags:        ['ai act', 'ai governance', 'model risk', 'gpai', 'high-risk ai'],
    uploadedBy:  'priya',
    uploadedAt:  '2026-05-01T10:00:00.000Z',
    textContent: `AI GOVERNANCE & MODEL RISK POLICY
Version 1.1 | Effective 2 August 2026 (aligned with EU AI Act Chapter III/IV application)
Owner: AI Governance Lead

1. PURPOSE
   This policy establishes BABCOM's framework for responsible AI development and deployment,
   in compliance with Regulation (EU) 2024/1689 (the AI Act), GDPR requirements for automated
   decision-making (Art. 22), and BABCOM's internal standards for model risk management.

2. SCOPE
   This policy applies to all AI systems developed, deployed or procured by BABCOM, including
   machine learning models, large language models (LLMs), GPAI models, and automated
   decision-making tools used in any business process.

3. CLASSIFICATION OF AI SYSTEMS (Art. 6 AI Act)
   3.1 High-Risk Classification
       BABCOM must assess each AI system against Annex I (regulated products) and Annex III
       (high-risk use cases) of the AI Act before deployment. High-risk AI systems include those
       used in: employment and HR management; credit scoring and insurance risk assessment;
       education and vocational training; biometric identification; law enforcement; and critical
       infrastructure management. The classification assessment must be documented and reviewed
       when the system is substantially modified.

   3.2 Prohibited AI Practices
       BABCOM must not develop or deploy AI systems that: use subliminal techniques causing harm;
       exploit vulnerabilities of groups; conduct real-time remote biometric identification in
       public spaces (except permitted exceptions); engage in social scoring by public authorities.

4. RISK MANAGEMENT SYSTEM FOR HIGH-RISK AI (Art. 9 AI Act)
   BABCOM maintains a risk management system for all high-risk AI systems throughout their
   lifecycle. The risk management system must:
   (a) Identify and analyse known and reasonably foreseeable risks to health, safety and
       fundamental rights considering intended purpose and foreseeable misuse
   (b) Estimate and evaluate risks arising from deployment of the system
   (c) Evaluate risks based on data gathered from post-market monitoring
   (d) Implement mitigation and control measures
   The risk management system is documented and subject to annual review. Risk management
   records are maintained for 10 years following market placement. BABCOM's AI risk management
   system is aligned with ISO 42001 (AI Management System Standard).

5. DATA AND DATA GOVERNANCE (Art. 10 AI Act)
   5.1 Training, Validation and Testing Data
       Training datasets must meet appropriate quality criteria: relevance, representativeness,
       freedom from errors and completeness appropriate to the intended purpose. Data governance
       practices must address: the design choices for data collection and preparation; examination
       for biases that could lead to discriminatory outputs; identification of relevant data gaps
       or shortcomings. Training data provenance and lineage must be documented.

   5.2 Bias Mitigation
       Statistical biases in training data that may result in discriminatory outcomes must be
       detected and mitigated. Bias evaluation must be performed across protected characteristics
       (gender, race, age, disability status) before deployment of any high-risk AI system.
       Model cards documenting training data composition and evaluation results are mandatory.

6. TECHNICAL DOCUMENTATION (Art. 11, Annex IV AI Act)
   Before placing a high-risk AI system on the market or into service, technical documentation
   must be prepared including:
   (a) General description of the AI system, intended purpose, and version
   (b) Description of the elements and development process including data used
   (c) Information about the monitoring, functioning and control of the AI system
   (d) Description of the risk management system
   (e) Description of the changes made to the system throughout its lifecycle
   (f) Assessment of human oversight measures and list of standards applied
   Technical documentation is maintained for a minimum of 10 years and is made available to
   market surveillance authorities upon request.

7. RECORD-KEEPING AND AUTOMATIC LOGGING (Art. 12 AI Act)
   High-risk AI systems must be designed to automatically enable the logging of events relevant
   to the identification of risks. Logs must be kept for at least six months. Logs must record:
   system start/stop times; input data triggering outputs; reference database information; and
   the identity of natural persons involved in verification. Logging systems are reviewed
   quarterly to ensure completeness.

8. TRANSPARENCY AND INFORMATION TO DEPLOYERS (Art. 13 AI Act)
   High-risk AI systems must be designed to allow deployers to understand and correctly use them.
   Instructions for use must accompany the system, covering: the identity of the provider;
   the intended purpose and conditions; performance characteristics and limitations; accuracy
   metrics; the nature, degree and frequency of human oversight; expected lifetime and maintenance
   requirements; and cybersecurity measures.

9. HUMAN OVERSIGHT (Art. 14 AI Act)
   High-risk AI systems must be designed to enable natural persons to effectively oversee the
   system during its use. Oversight measures must ensure that deployers can: understand the
   capabilities and limitations of the system; monitor the operation and detect anomalies;
   override, interrupt or stop the system (stop button capability); and avoid over-reliance.
   Human oversight responsibilities are assigned to qualified persons before deployment.
   No high-risk AI decision affecting an individual may be implemented without human review
   capability (human-in-the-loop requirement).

10. ACCURACY, ROBUSTNESS AND CYBERSECURITY (Art. 15 AI Act)
    High-risk AI systems must achieve appropriate levels of accuracy, robustness and cybersecurity.
    Testing for adversarial attacks, data poisoning and model evasion is performed before
    deployment and at least annually thereafter. Accuracy benchmarks are documented in the
    technical documentation. Security testing includes red-team exercises for GPAI models.

11. QUALITY MANAGEMENT SYSTEM (Arts. 16–17 AI Act)
    BABCOM has implemented a quality management system (QMS) for AI systems aligned with
    ISO 42001 and ISO 9001. The QMS covers: risk management procedures; data and data governance
    procedures; technical documentation procedures; logging and record-keeping; corrective action
    procedures; and post-market monitoring. The QMS is audited annually by Internal Audit.

12. OBLIGATIONS FOR DEPLOYERS OF HIGH-RISK AI (Art. 26 AI Act)
    Deployers of high-risk AI systems must: assign human oversight to trained and competent
    natural persons; monitor the operation of the AI system; suspend or interrupt use when risks
    arise; inform the provider of any serious incidents; and conduct a fundamental rights impact
    assessment (FRIA) where required.

13. FUNDAMENTAL RIGHTS IMPACT ASSESSMENT (Art. 27 AI Act)
    Before deploying high-risk AI in areas including employment, financial services, education or
    public administration, a fundamental rights impact assessment (FRIA) must be conducted.
    The FRIA assesses risks to fundamental rights and identifies measures to mitigate them.
    FRIAs are registered with the competent national authority as required.

14. TRANSPARENCY FOR GENERAL-PURPOSE AI — GPAI (Arts. 50–53 AI Act)
    14.1 Disclosure Obligations (Art. 50)
         AI systems designed to interact with natural persons (chatbots) must disclose their
         AI nature. AI-generated content including images, audio, video and text must be labelled
         as AI-generated. Deepfake content must be disclosed unless exceptional circumstances apply.

    14.2 GPAI Model Documentation (Art. 53)
         Providers of general-purpose AI models must maintain a GPAI model register containing:
         technical documentation per Annex XI; model name, version and architecture; training
         data summary including sources and copyright compliance; evaluation results; and
         downstream access policy. The GPAI register is updated with each new model version.
         Training data summaries are published and copyright compliance is verified before
         any model release. Downstream providers are provided with technical documentation
         and instructions adequate for compliance.

15. POST-MARKET MONITORING (Art. 72 AI Act)
    A post-market monitoring plan is implemented for all high-risk AI systems. The plan defines:
    data collection methods; performance metrics to monitor; feedback mechanisms from deployers
    and affected persons; incident reporting procedures; and review frequency (minimum annual).
    Performance data is reviewed quarterly. Issues identified through post-market monitoring
    trigger the corrective action procedure in the QMS.

16. AUTOMATED DECISION-MAKING SAFEGUARDS (Art. 22 GDPR)
    Decisions based solely on automated processing, including profiling, that produce legal or
    similarly significant effects on individuals require: an explicit lawful basis; the right to
    obtain human review; the right to express a point of view; and the right to contest the
    decision. BABCOM maintains an inventory of all automated decision-making processes subject
    to Art. 22 obligations.

17. REVIEW
    This policy is reviewed annually or following material changes to the AI Act implementing
    acts or significant updates to BABCOM's AI system portfolio.
`,
  },

  // ─── Policy 3: Information Security (partial coverage) ───────────────────
  {
    id:          'seed-pol-003',
    title:       'Information Security Policy',
    version:     '2.0',
    status:      'published',
    format:      'text',
    description: 'Core information security policy covering access control, encryption, incident response, vulnerability management, and business continuity. Partial coverage of NIS2 and DORA-specific obligations.',
    tags:        ['security', 'infosec', 'access control', 'incident response', 'nist'],
    uploadedBy:  'vikram',
    uploadedAt:  '2026-05-10T14:00:00.000Z',
    textContent: `INFORMATION SECURITY POLICY
Version 2.0 | Effective 1 March 2026 | Owner: CISO

1. PURPOSE AND SCOPE
   This policy defines BABCOM's information security requirements to protect the confidentiality,
   integrity and availability of information assets. It applies to all employees, contractors
   and third parties with access to BABCOM's information systems.

2. GOVERNANCE AND ROLES
   The CISO is responsible for the information security programme. A dedicated Security
   Committee, chaired by the CISO, meets monthly to review the security risk landscape.
   Management bodies are informed of the cybersecurity risk posture quarterly.

3. ASSET MANAGEMENT
   An asset inventory (asset register) of all information assets including hardware, software,
   data and cloud services is maintained and reviewed quarterly. Assets are classified according
   to their criticality and sensitivity. Asset owners are assigned for all critical systems.

4. IDENTITY MANAGEMENT, AUTHENTICATION AND ACCESS CONTROL
   4.1 Least Privilege
       Access to information systems is granted on a least-privilege basis. Users are provided
       only the access necessary to perform their job functions.

   4.2 Multi-Factor Authentication
       Multi-factor authentication (MFA) is mandatory for all remote access, cloud services,
       administrator accounts, and any access to production systems. Privileged access management
       (PAM) controls are enforced for all privileged accounts. IAM systems enforce separation
       of duties and prevent accumulation of excessive permissions.

   4.3 Identity and Access Management
       An identity management system governs provisioning, modification and deprovisioning of
       user accounts. Access reviews are conducted quarterly. Joiners/movers/leavers procedures
       ensure timely provisioning and revocation.

5. DATA SECURITY AND ENCRYPTION
   5.1 Data Classification
       All data is classified as Public, Internal, Confidential or Restricted. Handling
       requirements for each classification level are defined in the Data Classification Standard.

   5.2 Encryption at Rest
       All data classified as Confidential or Restricted is encrypted at rest using AES-256.
       Encryption keys are managed through a dedicated key management system with annual
       key rotation.

   5.3 Encryption in Transit
       All data in transit is encrypted using TLS 1.3 or higher. Internal service mesh
       communication uses mutual TLS (mTLS) for all services handling Confidential data.
       Cleartext protocols are prohibited for sensitive data transmission.

6. PLATFORM SECURITY AND VULNERABILITY MANAGEMENT
   6.1 Secure Configuration
       All systems are hardened in accordance with CIS Benchmarks appropriate to the platform.
       Default passwords are changed before deployment. Unnecessary services are disabled.

   6.2 Patch Management
       Critical security patches are applied within 72 hours of release. High-severity patches
       are applied within 14 days. All patches are applied within 30 days.

   6.3 Vulnerability Scanning
       Automated vulnerability scanning is performed weekly on all systems. Penetration testing
       is conducted annually by qualified external testers. Findings are remediated within SLA.

   6.4 Software Bill of Materials
       A Software Bill of Materials (SBOM) in CycloneDX format is generated for all container
       images and released software. SBOMs are maintained in the artefact registry.
       Coordinated vulnerability disclosure (CVD) policy is published on the company website.

7. SECURITY MONITORING AND DETECTION
   7.1 Security Information and Event Management
       A SIEM platform aggregates logs from all critical systems. Security events are monitored
       24/7 by the Security Operations team. Anomaly detection rules are reviewed monthly.
       Endpoint detection and response (EDR) is deployed on all endpoints.

   7.2 Log Management
       Security logs are retained for a minimum of 180 days in accordance with CERT-In
       Directions and internal policy. Logs are stored in a tamper-evident manner.
       CloudWatch, Splunk and equivalent platforms are configured for centralised log aggregation.

   7.3 Alert Triage and Response
       All high-severity security alerts are triaged within 4 hours. The Security Operations
       team follows defined playbooks for common incident types. Automated SOAR responses
       are implemented for known attack patterns.

8. INCIDENT RESPONSE
   8.1 Incident Response Plan
       BABCOM maintains an incident response plan covering detection, containment, eradication,
       recovery and post-incident review. The plan is tested annually via tabletop exercises.

   8.2 Incident Classification
       Security incidents are classified by severity: Critical (immediate response); High
       (response within 4 hours); Medium (response within 24 hours); Low (response within 72 hours).
       Major incidents are escalated to the CISO and management body within 1 hour.

   8.3 Regulatory Reporting
       Significant cybersecurity incidents affecting critical or important infrastructure are
       reported to competent authorities within 24 hours (early warning) and within 72 hours
       (incident notification) in accordance with applicable regulatory requirements.

   8.4 Root Cause Analysis
       A post-incident review including root cause analysis (RCA) is mandatory for all
       Sev-1 and Sev-2 incidents. Corrective actions are tracked to completion.

9. BUSINESS CONTINUITY AND RESILIENCE
   9.1 Business Continuity Plan
       BABCOM maintains a business continuity plan (BCP) and disaster recovery plan (DRP)
       for all critical systems. Recovery time objective (RTO) for critical systems is 4 hours.
       Recovery point objective (RPO) is 1 hour.

   9.2 Backups
       Critical data is backed up daily. Backup integrity is tested monthly. Backups are
       stored in a geographically separate location using encrypted storage.

   9.3 Resilience Testing
       BCP and DRP are tested annually through tabletop exercises and failover tests.

10. SUPPLY CHAIN SECURITY
    10.1 Vendor Risk Management
         All ICT third-party vendors are subject to due diligence security assessment before
         onboarding. A vendor register is maintained listing all critical ICT third-party providers.
         Security requirements are included in all vendor contracts.

    10.2 Contractual Provisions
         Contracts with ICT third-party service providers include: security requirements;
         incident notification obligations (within 4 hours for major incidents); audit rights;
         exit strategy and data return procedures; and SLA commitments.

    10.3 Sub-processor Management
         Approval is required before a vendor engages sub-processors handling BABCOM data.
         The sub-processor chain is documented for all critical SaaS vendors.

11. PENETRATION TESTING
    Annual penetration testing is conducted by qualified external testers. Threat-led penetration
    testing (TLPT) exercises are conducted for critical systems every 2 years. Red team exercises
    cover production systems. All findings are remediated within defined SLAs.

12. SECURITY AWARENESS AND TRAINING
    All employees complete mandatory security awareness training annually. Phishing simulation
    exercises are conducted quarterly. Role-specific cybersecurity training is provided for
    security personnel and developers.

13. REVIEW
    This policy is reviewed annually or following significant security incidents or regulatory
    changes.
`,
  },
]
