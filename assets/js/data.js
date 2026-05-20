/* ============================================================================
   GRCentral · Mock dataset
   ----------------------------------------------------------------------------
   All identifiers, CELEX numbers, ELI URIs and source URLs below are REAL.
   Article texts are paraphrased / illustrative.
   ============================================================================ */

window.DATA = (() => {

  /* ----------------------------- Sources ---------------------------------- */
  const sources = [
    { id: 'eur-lex', name: 'EUR-Lex',               url: 'https://eur-lex.europa.eu/',                jurisdiction: 'EU',     type: 'primary',  outputFormat: 'Akoma Ntoso XML',  ingestion: 'SPARQL + RSS',  pollInterval: '1h',  status: 'healthy', lastSyncMin: 12,  documentsTracked: 8421, description: 'Primary EU legal portal. CELEX + ELI versioning, daily delta poll.' },
    { id: 'edpb',    name: 'EDPB',                  url: 'https://www.edpb.europa.eu/',               jurisdiction: 'EU',     type: 'guidance', outputFormat: 'HTML + PDF',       ingestion: 'RSS + scrape',  pollInterval: '3h',  status: 'healthy', lastSyncMin: 28,  documentsTracked: 462,  description: 'European Data Protection Board opinions and guidelines.' },
    { id: 'ec-dig',  name: 'EC · Digital Strategy', url: 'https://digital-strategy.ec.europa.eu/',    jurisdiction: 'EU',     type: 'policy',   outputFormat: 'HTML',             ingestion: 'RSS + scrape',  pollInterval: '6h',  status: 'healthy', lastSyncMin: 65,  documentsTracked: 318,  description: 'EC Digital Strategy portal — AI Act, Data Act, GDPR-adjacent policy.' },
    { id: 'enisa',   name: 'ENISA',                 url: 'https://www.enisa.europa.eu/',              jurisdiction: 'EU',     type: 'cyber',    outputFormat: 'HTML + PDF',       ingestion: 'RSS + PDF parse',pollInterval: '6h',  status: 'healthy', lastSyncMin: 40,  documentsTracked: 287,  description: 'EU Agency for Cybersecurity advisories and threat landscape reports.' },
    { id: 'gdpr-eu', name: 'GDPR.eu',               url: 'https://gdpr.eu/',                          jurisdiction: 'EU',     type: 'info',     outputFormat: 'HTML',             ingestion: 'HTML scrape',   pollInterval: '24h', status: 'healthy', lastSyncMin: 120, documentsTracked: 145,  description: 'Informational GDPR portal — used for crosswalk hints, not authoritative.' },
    { id: 'ico',     name: 'UK ICO',                url: 'https://ico.org.uk/',                       jurisdiction: 'UK',     type: 'guidance', outputFormat: 'HTML + RSS',       ingestion: 'RSS',           pollInterval: '3h',  status: 'healthy', lastSyncMin: 33,  documentsTracked: 511,  description: 'UK Information Commissioner — post-Brexit privacy guidance and decisions.' },
    { id: 'nist',    name: 'NIST',                  url: 'https://www.nist.gov/',                     jurisdiction: 'US',     type: 'standard', outputFormat: 'JSON API',         ingestion: 'REST',          pollInterval: '6h',  status: 'healthy', lastSyncMin: 50,  documentsTracked: 1204, description: 'NIST CSRC Publications API — CSF 2.0 and related publications.' },
    { id: 'cisa',    name: 'CISA',                  url: 'https://www.cisa.gov/',                     jurisdiction: 'US',     type: 'advisory', outputFormat: 'JSON',             ingestion: 'REST feed',     pollInterval: '1h',  status: 'healthy', lastSyncMin: 18,  documentsTracked: 2873, description: 'US Cybersecurity and Infrastructure Security Agency — advisory feed.' },
    { id: 'certin',  name: 'CERT-In',               url: 'https://www.cert-in.org.in/',               jurisdiction: 'IN',     type: 'advisory', outputFormat: 'HTML + PDF',       ingestion: 'HTML scrape',   pollInterval: '2h',  status: 'healthy', lastSyncMin: 22,  documentsTracked: 921,  description: 'Indian Computer Emergency Response Team advisories.' },
    { id: 'owasp',   name: 'OWASP',                 url: 'https://owasp.org/',                        jurisdiction: 'Global', type: 'standard', outputFormat: 'Git releases',     ingestion: 'GitHub poll',   pollInterval: '24h', status: 'healthy', lastSyncMin: 240, documentsTracked: 184,  description: 'OWASP project releases — Top-10, ASVS, MASVS, SAMM.' },
    { id: 'cis',     name: 'CIS Benchmarks',        url: 'https://www.cisecurity.org/cis-benchmarks', jurisdiction: 'Global', type: 'standard', outputFormat: 'PDF + JSON',       ingestion: 'Versioned HTTP',pollInterval: '24h', status: 'healthy', lastSyncMin: 95,  documentsTracked: 348,  description: 'CIS Benchmarks — hardened-config guides for cloud, OS, container.' }
  ];

  /* ---------------------------- Personas ---------------------------------- */
  const personas = [
    { id: 'aarav',  name: 'Aarav Mehta',   role: 'Chief Compliance Officer', initials: 'AM', c1: '#ff5a1f', c2: '#a78bfa', email: 'aarav.mehta@babcom.example',  primaryView: 'dashboard' },
    { id: 'priya',  name: 'Priya Sharma',  role: 'Senior GRC Analyst',       initials: 'PS', c1: '#22d3ee', c2: '#ff5a1f', email: 'priya.sharma@babcom.example',  primaryView: 'radar' },
    { id: 'rohan',  name: 'Rohan Iyer',    role: 'Risk Manager',             initials: 'RI', c1: '#a78bfa', c2: '#22d3ee', email: 'rohan.iyer@babcom.example',    primaryView: 'drift' },
    { id: 'ananya', name: 'Ananya Reddy',  role: 'Data Protection Officer',  initials: 'AR', c1: '#34d399', c2: '#22d3ee', email: 'ananya.reddy@babcom.example',  primaryView: 'gaps' },
    { id: 'vikram', name: 'Vikram Singh',  role: 'CISO',                     initials: 'VS', c1: '#fb7185', c2: '#a78bfa', email: 'vikram.singh@babcom.example',  primaryView: 'evidence' },
    { id: 'kavya',  name: 'Kavya Nair',    role: 'Legal Counsel',            initials: 'KN', c1: '#fbbf24', c2: '#ff5a1f', email: 'kavya.nair@babcom.example',    primaryView: 'radar' },
    { id: 'aditya', name: 'Aditya Joshi',  role: 'Internal Audit Lead',      initials: 'AJ', c1: '#22d3ee', c2: '#34d399', email: 'aditya.joshi@babcom.example',  primaryView: 'evidence' }
  ];

  /* --------------------------- Business units ----------------------------- */
  const businessUnits = [
    { id: 'bu-retail',  name: 'Retail Banking EU',     criticality: 92 },
    { id: 'bu-card',    name: 'Cards & Payments',      criticality: 95 },
    { id: 'bu-cloud',   name: 'Cloud Infra Platform',  criticality: 88 },
    { id: 'bu-ai',      name: 'AI / ML Platform',      criticality: 90 },
    { id: 'bu-hr',      name: 'HR & People Ops',       criticality: 60 },
    { id: 'bu-mkt',     name: 'Marketing & CRM',       criticality: 70 }
  ];

  /* --------------------------- Regulations -------------------------------- */
  /* Each "lastChange" intentionally lies in the recent past so the Radar
     view feels live.  Articles are illustrative.                            */

  const regulations = [
    {
      id: 'reg-ai-act',
      title: 'EU Artificial Intelligence Act',
      shortTitle: 'AI Act',
      celex: '32024R1689',
      eli: 'http://data.europa.eu/eli/reg/2024/1689/oj',
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689',
      htmlUrl:   'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202401689',
      jurisdiction: 'EU',
      sourceId: 'eur-lex',
      effectiveDate: '2024-08-01',
      stagedDates: [
        { date: '2025-02-02', label: 'Prohibitions & literacy applicable' },
        { date: '2025-08-02', label: 'GPAI obligations' },
        { date: '2026-08-02', label: 'High-risk systems (Annex III)' }
      ],
      topics: ['AI', 'Risk Management', 'Transparency', 'Foundation Models'],
      summary: 'Horizontal framework regulating the placing on the market, putting into service and use of artificial intelligence systems in the EU. Risk-tiered: prohibited, high-risk, limited-risk, minimal-risk.',
      buExposure: ['bu-ai', 'bu-card', 'bu-cloud', 'bu-mkt'],
      lastChange: '2026-05-12',
      changeType: 'guidance',
      version: 'consolidated-2026-05',
      articles: [
        { id: 'art-5',  num: 'Article 5',  title: 'Prohibited AI practices',        status: 'keep' },
        { id: 'art-6',  num: 'Article 6',  title: 'Classification rules for high-risk AI systems', status: 'modify',
          before: 'AI systems referred to in Annex III shall be considered high-risk where they pose a significant risk of harm to the health, safety or fundamental rights of natural persons.',
          after:  'AI systems referred to in Annex III shall be considered high-risk where they pose a significant risk of harm to the health, safety, fundamental rights of natural persons, OR materially influence the outcome of decision-making in a way that the result is not purely preparatory.' },
        { id: 'art-9',  num: 'Article 9',  title: 'Risk management system',         status: 'keep' },
        { id: 'art-10', num: 'Article 10', title: 'Data and data governance',       status: 'modify',
          before: 'Training, validation and testing data sets shall be relevant, sufficiently representative, and to the best extent possible free of errors and complete in view of the intended purpose.',
          after:  'Training, validation and testing data sets shall be relevant, sufficiently representative, free of errors and complete in view of the intended purpose. Providers shall document data provenance, lawful basis and bias-mitigation measures.' },
        { id: 'art-13', num: 'Article 13', title: 'Transparency & information to deployers', status: 'keep' },
        { id: 'art-50', num: 'Article 50', title: 'Transparency obligations for certain AI systems', status: 'keep' },
        { id: 'art-53', num: 'Article 53', title: 'Obligations for providers of GPAI models', status: 'add',
          after:  'Providers of general-purpose AI models shall draw up and keep up to date technical documentation including training, testing and evaluation processes, and shall put in place a policy to comply with Union copyright law.' }
      ]
    },
    {
      id: 'reg-gdpr',
      title: 'General Data Protection Regulation',
      shortTitle: 'GDPR',
      celex: '32016R0679',
      eli: 'http://data.europa.eu/eli/reg/2016/679/oj',
      sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
      htmlUrl:   'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679',
      jurisdiction: 'EU',
      sourceId: 'eur-lex',
      effectiveDate: '2018-05-25',
      topics: ['Data Protection', 'Privacy', 'Cross-border'],
      summary: 'Foundational EU regulation on the processing of personal data and on the free movement of such data.',
      buExposure: ['bu-retail', 'bu-card', 'bu-mkt', 'bu-hr'],
      lastChange: '2026-05-16',
      changeType: 'edpb-opinion',
      version: 'consolidated-2024-09',
      articles: [
        { id: 'gdpr-5',  num: 'Article 5',  title: 'Principles relating to processing', status: 'keep' },
        { id: 'gdpr-6',  num: 'Article 6',  title: 'Lawfulness of processing',          status: 'keep' },
        { id: 'gdpr-25', num: 'Article 25', title: 'Data protection by design and by default', status: 'modify',
          before: 'The controller shall implement appropriate technical and organisational measures…',
          after:  'The controller shall implement appropriate technical and organisational measures, including pseudonymisation, **demonstrable** at audit and reviewed at each material processing change.' },
        { id: 'gdpr-30', num: 'Article 30', title: 'Records of processing activities',  status: 'keep' },
        { id: 'gdpr-32', num: 'Article 32', title: 'Security of processing',            status: 'modify',
          before: 'The controller and the processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk…',
          after:  'The controller and the processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk, with **encryption-in-transit and at-rest** mandated for high-risk processing, per EDPB Opinion 4/2026.' },
        { id: 'gdpr-44', num: 'Article 44', title: 'General principle for transfers',   status: 'keep' }
      ]
    },
    {
      id: 'reg-nis2',
      title: 'Directive on measures for a high common level of cybersecurity (NIS2)',
      shortTitle: 'NIS2',
      celex: '32022L2555',
      eli: 'http://data.europa.eu/eli/dir/2022/2555/oj',
      sourceUrl: 'https://eur-lex.europa.eu/eli/dir/2022/2555/oj',
      htmlUrl:   'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022L2555',
      jurisdiction: 'EU',
      sourceId: 'eur-lex',
      effectiveDate: '2024-10-17',
      topics: ['Cybersecurity', 'Incident Reporting', 'Supply Chain'],
      summary: 'Strengthens cybersecurity obligations for essential and important entities across the EU.',
      buExposure: ['bu-cloud', 'bu-card', 'bu-retail'],
      lastChange: '2026-05-09',
      changeType: 'amendment',
      version: 'consolidated-2026-04',
      articles: [
        { id: 'nis2-20', num: 'Article 20', title: 'Governance',                       status: 'keep' },
        { id: 'nis2-21', num: 'Article 21', title: 'Cybersecurity risk-management measures', status: 'modify',
          before: 'Essential and important entities shall take appropriate and proportionate technical, operational and organisational measures…',
          after:  'Essential and important entities shall take appropriate and proportionate technical, operational and organisational measures, **including SBOM disclosure to competent authorities upon request** and **24-hour adversary-simulation drills annually**.' },
        { id: 'nis2-23', num: 'Article 23', title: 'Reporting obligations (24h/72h/1m)', status: 'keep' }
      ]
    },
    {
      id: 'reg-dora',
      title: 'Digital Operational Resilience Act',
      shortTitle: 'DORA',
      celex: '32022R2554',
      eli: 'http://data.europa.eu/eli/reg/2022/2554/oj',
      sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2022/2554/oj',
      htmlUrl:   'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2554',
      jurisdiction: 'EU',
      sourceId: 'eur-lex',
      effectiveDate: '2025-01-17',
      topics: ['Financial Resilience', 'ICT Third-Party Risk', 'Testing'],
      summary: 'Uniform requirements for the security of network and information systems supporting business processes of financial entities.',
      buExposure: ['bu-card', 'bu-retail', 'bu-cloud'],
      lastChange: '2026-05-14',
      changeType: 'rts',
      version: 'consolidated-2026-05',
      articles: [
        { id: 'dora-5',  num: 'Article 5',  title: 'ICT risk management framework',     status: 'keep' },
        { id: 'dora-17', num: 'Article 17', title: 'ICT-related incident management',   status: 'modify',
          before: 'Financial entities shall define, establish and implement an ICT-related incident management process…',
          after:  'Financial entities shall define, establish and implement an ICT-related incident management process, **with classification within 4 hours of detection** and root-cause analysis lodged in the Joint Examination Database.' },
        { id: 'dora-28', num: 'Article 28', title: 'General principles · ICT third-party risk', status: 'keep' },
        { id: 'dora-30', num: 'Article 30', title: 'Key contractual provisions',         status: 'add',
          after: 'Contracts with ICT third-party providers supporting critical or important functions shall include **explicit subcontracting chains for AI sub-processors** per RTS adopted 2026-05-14.' }
      ]
    },
    {
      id: 'reg-dsa',
      title: 'Digital Services Act',
      shortTitle: 'DSA',
      celex: '32022R2065',
      eli: 'http://data.europa.eu/eli/reg/2022/2065/oj',
      sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2022/2065/oj',
      htmlUrl:   'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065',
      jurisdiction: 'EU',
      sourceId: 'eur-lex',
      effectiveDate: '2024-02-17',
      topics: ['Online Platforms', 'Transparency', 'Content Moderation'],
      summary: 'Harmonised rules for intermediary services in the internal market.',
      buExposure: ['bu-mkt'],
      lastChange: '2026-04-22',
      changeType: 'guidance',
      version: 'consolidated-2025-12',
      articles: [
        { id: 'dsa-26', num: 'Article 26', title: 'Advertising on online platforms', status: 'keep' }
      ]
    },
    {
      id: 'reg-eidas2',
      title: 'eIDAS 2.0 — EU Digital Identity Framework',
      shortTitle: 'eIDAS 2.0',
      celex: '32024R1183',
      eli: 'http://data.europa.eu/eli/reg/2024/1183/oj',
      sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2024/1183/oj',
      htmlUrl:   'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32024R1183',
      jurisdiction: 'EU',
      sourceId: 'eur-lex',
      effectiveDate: '2024-05-20',
      topics: ['Digital Identity', 'Wallets', 'Trust Services'],
      summary: 'Framework for the European Digital Identity Wallet and qualified trust services.',
      buExposure: ['bu-retail', 'bu-card'],
      lastChange: '2026-03-10',
      changeType: 'rts',
      version: 'consolidated-2026-03',
      articles: [
        { id: 'eidas-5a', num: 'Article 5a', title: 'European Digital Identity Wallets', status: 'keep' }
      ]
    },
    {
      id: 'reg-data-act',
      title: 'EU Data Act',
      shortTitle: 'Data Act',
      celex: '32023R2854',
      eli: 'http://data.europa.eu/eli/reg/2023/2854/oj',
      sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2023/2854/oj',
      htmlUrl:   'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32023R2854',
      jurisdiction: 'EU',
      sourceId: 'eur-lex',
      effectiveDate: '2025-09-12',
      topics: ['Data Sharing', 'IoT', 'B2B', 'B2G'],
      summary: 'Harmonised rules on fair access to and use of data in the EU.',
      buExposure: ['bu-cloud', 'bu-ai', 'bu-retail'],
      lastChange: '2026-05-05',
      changeType: 'guidance',
      version: 'consolidated-2026-05',
      articles: [
        { id: 'da-3',  num: 'Article 3',  title: 'Obligation to make data accessible', status: 'keep' }
      ]
    },
    {
      id: 'reg-edpb-opn-4-2026',
      title: 'EDPB Opinion 4/2026 on encryption obligations under GDPR Art. 32',
      shortTitle: 'EDPB Op. 4/2026',
      celex: null,
      eli: null,
      sourceUrl: 'https://www.edpb.europa.eu/our-work-tools/our-documents_en',
      htmlUrl:   'https://www.edpb.europa.eu/',
      jurisdiction: 'EU',
      sourceId: 'edpb',
      effectiveDate: '2026-05-16',
      topics: ['Data Protection', 'Encryption', 'Security'],
      summary: 'Mandates encryption-at-rest and in-transit for processing categorised as high-risk under GDPR Article 35.',
      buExposure: ['bu-retail', 'bu-card', 'bu-cloud', 'bu-hr'],
      lastChange: '2026-05-16',
      changeType: 'new-guidance',
      version: '1.0',
      articles: []
    },
    {
      id: 'reg-cra',
      title: 'EU Cyber Resilience Act',
      shortTitle: 'CRA',
      celex: '32024R2847',
      eli: 'http://data.europa.eu/eli/reg/2024/2847/oj',
      sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2024/2847/oj',
      htmlUrl:   'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32024R2847',
      jurisdiction: 'EU',
      sourceId: 'eur-lex',
      effectiveDate: '2027-12-11',
      topics: ['Cybersecurity', 'Products with Digital Elements', 'SBOM'],
      summary: 'Cybersecurity requirements for products with digital elements placed on the EU market.',
      buExposure: ['bu-cloud', 'bu-ai'],
      lastChange: '2026-04-29',
      changeType: 'guidance',
      version: 'consolidated-2026-04',
      articles: []
    },
    {
      id: 'reg-nist-csf',
      title: 'NIST Cybersecurity Framework 2.0',
      shortTitle: 'NIST CSF 2.0',
      celex: null, eli: null,
      sourceUrl: 'https://www.nist.gov/cyberframework',
      htmlUrl:   'https://www.nist.gov/cyberframework',
      jurisdiction: 'US',
      sourceId: 'nist',
      effectiveDate: '2024-02-26',
      topics: ['Cybersecurity', 'Governance', 'Identify-Protect-Detect-Respond-Recover'],
      summary: 'Voluntary framework of cybersecurity outcomes — used as a crosswalk to NIS2 and DORA controls.',
      buExposure: ['bu-cloud', 'bu-card', 'bu-retail'],
      lastChange: '2026-04-02',
      changeType: 'guidance',
      version: '2.0',
      articles: []
    },
    {
      id: 'reg-certin-2024',
      title: 'CERT-In Direction No. 20(3)/2022 — Cyber incident reporting',
      shortTitle: 'CERT-In Dir.',
      celex: null, eli: null,
      sourceUrl: 'https://www.cert-in.org.in/',
      htmlUrl:   'https://www.cert-in.org.in/',
      jurisdiction: 'IN',
      sourceId: 'certin',
      effectiveDate: '2022-06-28',
      topics: ['Incident Reporting', 'Logs'],
      summary: '6-hour incident reporting and 180-day log retention mandates for entities operating in India.',
      buExposure: ['bu-cloud', 'bu-card', 'bu-retail'],
      lastChange: '2026-05-10',
      changeType: 'advisory',
      version: 'rev-2026-05',
      articles: []
    }
  ];

  /* ---------------------------- Controls ---------------------------------- */
  const controls = [
    { id: 'C-AC-001',  name: 'Identity & access management — privileged accounts', framework: 'NIST CSF · PR.AC', owner: 'vikram', maturity: 78, drift: 4 },
    { id: 'C-DP-014',  name: 'Encryption at rest — production datastores',        framework: 'GDPR Art.32 · NIST CSF', owner: 'vikram', maturity: 64, drift: 14 },
    { id: 'C-DP-015',  name: 'Encryption in transit — internal service mesh',     framework: 'GDPR Art.32',  owner: 'vikram', maturity: 71, drift: 9 },
    { id: 'C-AI-002',  name: 'AI risk-management system (ISO 42001)',             framework: 'AI Act Art.9', owner: 'priya',  maturity: 42, drift: 22 },
    { id: 'C-AI-003',  name: 'Training-data governance & provenance',             framework: 'AI Act Art.10', owner: 'priya', maturity: 38, drift: 25 },
    { id: 'C-AI-004',  name: 'GPAI technical documentation register',             framework: 'AI Act Art.53', owner: 'priya', maturity: 21, drift: 31 },
    { id: 'C-IR-007',  name: 'ICT incident classification (4-hour SLA)',          framework: 'DORA Art.17', owner: 'vikram', maturity: 55, drift: 11 },
    { id: 'C-TP-022',  name: 'ICT third-party register & subprocessor chain',     framework: 'DORA Art.28-30', owner: 'rohan', maturity: 48, drift: 18 },
    { id: 'C-SC-031',  name: 'SBOM generation & disclosure',                       framework: 'NIS2 Art.21 · CRA', owner: 'vikram', maturity: 35, drift: 24 },
    { id: 'C-DR-040',  name: 'Records of processing activities (RoPA)',           framework: 'GDPR Art.30',  owner: 'ananya', maturity: 82, drift: 3 },
    { id: 'C-DR-041',  name: 'DPIA — high-risk processing',                       framework: 'GDPR Art.35',  owner: 'ananya', maturity: 67, drift: 8 },
    { id: 'C-LR-050',  name: 'Log retention (180-day, India)',                     framework: 'CERT-In Dir.', owner: 'vikram', maturity: 73, drift: 6 }
  ];

  /* ------------------- Recent regulatory changes (radar) ------------------ */
  const changes = [
    { id: 'chg-01', regId: 'reg-ai-act',   detectedAt: '2026-05-12T07:14:00Z', summary: 'New Article 53 — GPAI technical documentation obligations published as Commission guidance.', impact: 'critical', articleId: 'art-53', changeType: 'add'    },
    { id: 'chg-02', regId: 'reg-ai-act',   detectedAt: '2026-05-12T07:14:00Z', summary: 'Article 10 reworded — explicit data-provenance & bias-mitigation documentation.',           impact: 'high',     articleId: 'art-10', changeType: 'modify' },
    { id: 'chg-03', regId: 'reg-edpb-opn-4-2026', detectedAt: '2026-05-16T09:02:00Z', summary: 'EDPB Opinion 4/2026 — encryption-at-rest and in-transit mandated for high-risk processing.', impact: 'high', articleId: null, changeType: 'add' },
    { id: 'chg-04', regId: 'reg-gdpr',     detectedAt: '2026-05-16T09:02:00Z', summary: 'Article 32 interpretation tightened by EDPB Op. 4/2026.', impact: 'high',     articleId: 'gdpr-32', changeType: 'modify' },
    { id: 'chg-05', regId: 'reg-dora',     detectedAt: '2026-05-14T11:50:00Z', summary: 'RTS adopted — explicit subcontracting chains for AI sub-processors.',                 impact: 'high',     articleId: 'dora-30', changeType: 'add'    },
    { id: 'chg-06', regId: 'reg-nis2',     detectedAt: '2026-05-09T15:21:00Z', summary: 'Article 21 amended — SBOM disclosure to authorities and annual adversary simulation.', impact: 'high',     articleId: 'nis2-21', changeType: 'modify' },
    { id: 'chg-07', regId: 'reg-certin-2024', detectedAt: '2026-05-10T05:30:00Z', summary: 'CERT-In advisory clarifies 6-hour reporting also applies to cloud-only entities serving Indian residents.', impact: 'medium', articleId: null, changeType: 'modify' },
    { id: 'chg-08', regId: 'reg-data-act', detectedAt: '2026-05-05T08:00:00Z', summary: 'Commission Q&A published on Article 3 data-accessibility obligations.',                 impact: 'medium',   articleId: 'da-3', changeType: 'modify' },
    { id: 'chg-09', regId: 'reg-cra',      detectedAt: '2026-04-29T13:00:00Z', summary: 'CRA harmonised standards draft — SBOM mandatory in CycloneDX or SPDX format.',          impact: 'medium',   articleId: null, changeType: 'modify' },
    { id: 'chg-10', regId: 'reg-nist-csf', detectedAt: '2026-04-02T16:00:00Z', summary: 'NIST IR 8477 published — mappings between CSF 2.0 and NIS2 controls.',                  impact: 'low',      articleId: null, changeType: 'add'    },
    { id: 'chg-11', regId: 'reg-dsa',      detectedAt: '2026-04-22T10:00:00Z', summary: 'Commission guidance on ad-repository data fields.',                                     impact: 'low',      articleId: 'dsa-26', changeType: 'modify' }
  ];

  /* ----------------------------- Risk items ------------------------------- */
  const risks = [
    { id: 'R-001', regId: 'reg-ai-act', controlId: 'C-AI-004', title: 'GPAI documentation not in place for internal LLM platform',  severity: 'critical', businessUnitId: 'bu-ai',    ownerId: 'priya',  openSince: '2026-04-22', remediationDueDays: -4 },
    { id: 'R-002', regId: 'reg-ai-act', controlId: 'C-AI-003', title: 'Training data lineage missing for fraud-detection model',     severity: 'high',     businessUnitId: 'bu-card',  ownerId: 'priya',  openSince: '2026-04-30', remediationDueDays: 9 },
    { id: 'R-003', regId: 'reg-gdpr',   controlId: 'C-DP-014', title: 'Encryption-at-rest disabled on legacy KYC datastore',          severity: 'critical', businessUnitId: 'bu-retail', ownerId: 'vikram', openSince: '2026-05-02', remediationDueDays: 3 },
    { id: 'R-004', regId: 'reg-edpb-opn-4-2026', controlId: 'C-DP-015', title: 'Internal service mesh — mTLS not enforced on 12% of services', severity: 'high', businessUnitId: 'bu-cloud', ownerId: 'vikram', openSince: '2026-05-04', remediationDueDays: 12 },
    { id: 'R-005', regId: 'reg-dora',   controlId: 'C-IR-007', title: 'ICT incident classification SLA averaging 6h17m vs 4h target',  severity: 'high',     businessUnitId: 'bu-card',  ownerId: 'vikram', openSince: '2026-04-18', remediationDueDays: 5 },
    { id: 'R-006', regId: 'reg-dora',   controlId: 'C-TP-022', title: 'Subprocessor chain incomplete for 3 critical SaaS vendors',    severity: 'high',     businessUnitId: 'bu-cloud', ownerId: 'rohan',  openSince: '2026-04-29', remediationDueDays: 21 },
    { id: 'R-007', regId: 'reg-nis2',   controlId: 'C-SC-031', title: 'SBOM coverage at 58% across container images',                 severity: 'high',     businessUnitId: 'bu-cloud', ownerId: 'vikram', openSince: '2026-04-12', remediationDueDays: 35 },
    { id: 'R-008', regId: 'reg-gdpr',   controlId: 'C-DR-041', title: 'DPIA outstanding for new credit-scoring AI feature',          severity: 'medium',   businessUnitId: 'bu-retail', ownerId: 'ananya', openSince: '2026-05-01', remediationDueDays: 14 },
    { id: 'R-009', regId: 'reg-certin-2024', controlId: 'C-LR-050', title: 'Log retention drops below 180 days for one EKS cluster', severity: 'medium', businessUnitId: 'bu-cloud', ownerId: 'vikram', openSince: '2026-05-08', remediationDueDays: 7 },
    { id: 'R-010', regId: 'reg-gdpr',   controlId: 'C-DR-040', title: 'RoPA missing 5 new processing activities (Marketing CDP)',    severity: 'low',      businessUnitId: 'bu-mkt',   ownerId: 'ananya', openSince: '2026-05-10', remediationDueDays: 18 }
  ];

  /* ----------------------------- Evidence --------------------------------- */
  const evidence = [
    { id: 'EV-100', controlId: 'C-DP-014', name: 'Encryption-at-rest config attestation', collectedAt: '2026-04-01', expiresInDays: -8,  source: 'AWS Config' },
    { id: 'EV-101', controlId: 'C-DP-015', name: 'mTLS coverage report (service mesh)',    collectedAt: '2026-05-10', expiresInDays: 22,  source: 'Istio · weekly export' },
    { id: 'EV-102', controlId: 'C-AC-001', name: 'PAM session recordings audit',           collectedAt: '2026-05-12', expiresInDays: 60,  source: 'CyberArk' },
    { id: 'EV-103', controlId: 'C-AI-002', name: 'AI RMS process design (ISO 42001)',      collectedAt: '2026-03-18', expiresInDays: -2,  source: 'Confluence export' },
    { id: 'EV-104', controlId: 'C-AI-003', name: 'Training data lineage notebook',         collectedAt: '2026-02-09', expiresInDays: -35, source: 'MLflow' },
    { id: 'EV-105', controlId: 'C-IR-007', name: 'Incident classification SLA report',     collectedAt: '2026-05-01', expiresInDays: 13,  source: 'PagerDuty' },
    { id: 'EV-106', controlId: 'C-TP-022', name: 'Vendor subprocessor register',           collectedAt: '2025-12-12', expiresInDays: -120,source: 'OneTrust' },
    { id: 'EV-107', controlId: 'C-SC-031', name: 'SBOM (CycloneDX) artefacts',             collectedAt: '2026-05-15', expiresInDays: 45,  source: 'Anchore' },
    { id: 'EV-108', controlId: 'C-DR-040', name: 'RoPA export',                            collectedAt: '2026-05-08', expiresInDays: 20,  source: 'OneTrust' },
    { id: 'EV-109', controlId: 'C-DR-041', name: 'DPIA — credit-scoring model',            collectedAt: null,         expiresInDays: null, source: 'Pending' },
    { id: 'EV-110', controlId: 'C-LR-050', name: 'CloudWatch retention attestation',       collectedAt: '2026-04-26', expiresInDays: 5,   source: 'AWS Config' }
  ];

  /* ----------------------------- Actions ---------------------------------- */
  const actions = [
    { id: 'A-2001', riskId: 'R-001', title: 'Stand up GPAI documentation register and back-fill internal LLM',      ownerId: 'priya',  dueInDays: 7,  status: 'in-progress', effort: 'L' },
    { id: 'A-2002', riskId: 'R-002', title: 'Implement data lineage capture for fraud-detection training pipeline', ownerId: 'priya',  dueInDays: 14, status: 'planned',     effort: 'M' },
    { id: 'A-2003', riskId: 'R-003', title: 'Enable LUKS at rest + re-key legacy KYC datastore (P1)',               ownerId: 'vikram', dueInDays: 3,  status: 'in-progress', effort: 'M' },
    { id: 'A-2004', riskId: 'R-004', title: 'Enforce mTLS on remaining services in mesh (Istio policy)',            ownerId: 'vikram', dueInDays: 10, status: 'in-progress', effort: 'M' },
    { id: 'A-2005', riskId: 'R-005', title: 'Tune incident triage runbook to hit 4-hour SLA (DORA Art. 17)',         ownerId: 'vikram', dueInDays: 5,  status: 'in-progress', effort: 'S' },
    { id: 'A-2006', riskId: 'R-006', title: 'Re-collect subprocessor chain from top-25 SaaS vendors',                ownerId: 'rohan',  dueInDays: 21, status: 'planned',     effort: 'L' },
    { id: 'A-2007', riskId: 'R-007', title: 'Roll out SBOM scanner across CI for all container images',             ownerId: 'vikram', dueInDays: 30, status: 'planned',     effort: 'L' },
    { id: 'A-2008', riskId: 'R-008', title: 'Run DPIA for credit-scoring AI (model card + bias eval)',              ownerId: 'ananya', dueInDays: 12, status: 'in-progress', effort: 'M' },
    { id: 'A-2009', riskId: 'R-009', title: 'Raise CloudWatch retention to 180 days on prod-eu-1 cluster',          ownerId: 'vikram', dueInDays: 6,  status: 'planned',     effort: 'S' },
    { id: 'A-2010', riskId: 'R-010', title: 'Add 5 new CDP processing activities to RoPA',                          ownerId: 'ananya', dueInDays: 14, status: 'planned',     effort: 'S' }
  ];

  /* ------------------ Risk drift history (90 days) ----------------------- */
  /* Build a deterministic but interesting 90-day series per regulation.
     Seeded sin + drift, plus a step-up at the recent change date.          */
  const driftHistoryByReg = {};
  const today = new Date('2026-05-20');
  regulations.forEach((reg, idx) => {
    const series = [];
    const base = 25 + (idx * 4) % 30;
    const amp  = 8 + (idx * 3) % 12;
    const stepDays = Math.floor((today - new Date(reg.lastChange)) / 86400000);
    for (let d = 89; d >= 0; d--) {
      const date = new Date(today); date.setDate(today.getDate() - d);
      const t = (89 - d) / 89;
      let v = base
        + amp * Math.sin((d / 13) + idx)
        + 12 * t                                          // slow drift upward
        + (d <= stepDays ? 14 : 0)                        // step at last change
        + (Math.sin(d * 1.7 + idx * 0.9) * 3);
      v = Math.max(2, Math.min(98, v));
      series.push({ date: date.toISOString().slice(0,10), score: Number(v.toFixed(1)) });
    }
    driftHistoryByReg[reg.id] = series;
  });

  /* ------------------------ Helper indexes ------------------------------- */
  const byId   = (arr) => Object.fromEntries(arr.map(x => [x.id, x]));
  const indexes = {
    regulations:  byId(regulations),
    personas:     byId(personas),
    sources:      byId(sources),
    controls:     byId(controls),
    risks:        byId(risks),
    evidence:     byId(evidence),
    actions:      byId(actions),
    bu:           byId(businessUnits)
  };

  return {
    sources, personas, businessUnits, regulations,
    controls, changes, risks, evidence, actions,
    driftHistoryByReg, indexes
  };
})();
