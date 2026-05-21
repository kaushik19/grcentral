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
    { id: 'ec-dig',  name: 'EC · Digital Strategy', url: 'https://digital-strategy.ec.europa.eu/',    jurisdiction: 'EU',     type: 'policy',   outputFormat: 'HTML',             ingestion: 'RSS + scrape',  pollInterval: '6h',  status: 'healthy', lastSyncMin: 65,  documentsTracked: 318,  description: 'EC Digital Strategy portal: AI Act, Data Act, GDPR-adjacent policy.' },
    { id: 'enisa',   name: 'ENISA',                 url: 'https://www.enisa.europa.eu/',              jurisdiction: 'EU',     type: 'cyber',    outputFormat: 'HTML + PDF',       ingestion: 'RSS + PDF parse',pollInterval: '6h',  status: 'healthy', lastSyncMin: 40,  documentsTracked: 287,  description: 'EU Agency for Cybersecurity advisories and threat landscape reports.' },
    { id: 'gdpr-eu', name: 'GDPR.eu',               url: 'https://gdpr.eu/',                          jurisdiction: 'EU',     type: 'info',     outputFormat: 'HTML',             ingestion: 'HTML scrape',   pollInterval: '24h', status: 'healthy', lastSyncMin: 120, documentsTracked: 145,  description: 'Informational GDPR portal: used for crosswalk hints, not authoritative.' },
    { id: 'ico',     name: 'UK ICO',                url: 'https://ico.org.uk/',                       jurisdiction: 'UK',     type: 'guidance', outputFormat: 'HTML + RSS',       ingestion: 'RSS',           pollInterval: '3h',  status: 'healthy', lastSyncMin: 33,  documentsTracked: 511,  description: 'UK Information Commissioner: post-Brexit privacy guidance and decisions.' },
    { id: 'nist',    name: 'NIST',                  url: 'https://www.nist.gov/',                     jurisdiction: 'US',     type: 'standard', outputFormat: 'JSON API',         ingestion: 'REST',          pollInterval: '6h',  status: 'healthy', lastSyncMin: 50,  documentsTracked: 1204, description: 'NIST CSRC Publications API: CSF 2.0 and related publications.' },
    { id: 'cisa',    name: 'CISA',                  url: 'https://www.cisa.gov/',                     jurisdiction: 'US',     type: 'advisory', outputFormat: 'JSON',             ingestion: 'REST feed',     pollInterval: '1h',  status: 'healthy', lastSyncMin: 18,  documentsTracked: 2873, description: 'US Cybersecurity and Infrastructure Security Agency: advisory feed.' },
    { id: 'certin',  name: 'CERT-In',               url: 'https://www.cert-in.org.in/',               jurisdiction: 'IN',     type: 'advisory', outputFormat: 'HTML + PDF',       ingestion: 'HTML scrape',   pollInterval: '2h',  status: 'healthy', lastSyncMin: 22,  documentsTracked: 921,  description: 'Indian Computer Emergency Response Team advisories.' },
    { id: 'owasp',   name: 'OWASP',                 url: 'https://owasp.org/',                        jurisdiction: 'Global', type: 'standard', outputFormat: 'Git releases',     ingestion: 'GitHub poll',   pollInterval: '24h', status: 'healthy', lastSyncMin: 240, documentsTracked: 184,  description: 'OWASP project releases: Top-10, ASVS, MASVS, SAMM.' },
    { id: 'cis',     name: 'CIS Benchmarks',        url: 'https://www.cisecurity.org/cis-benchmarks', jurisdiction: 'Global', type: 'standard', outputFormat: 'PDF + JSON',       ingestion: 'Versioned HTTP',pollInterval: '24h', status: 'healthy', lastSyncMin: 95,  documentsTracked: 348,  description: 'CIS Benchmarks: hardened-config guides for cloud, OS, container.' }
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
      title: 'eIDAS 2.0: EU Digital Identity Framework',
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
      summary: 'Voluntary framework of cybersecurity outcomes: used as a crosswalk to NIS2 and DORA controls.',
      buExposure: ['bu-cloud', 'bu-card', 'bu-retail'],
      lastChange: '2026-04-02',
      changeType: 'guidance',
      version: '2.0',
      articles: []
    },
    {
      id: 'reg-certin-2024',
      title: 'CERT-In Direction No. 20(3)/2022: Cyber incident reporting',
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
    { id: 'C-AC-001',  name: 'Identity & access management: privileged accounts', framework: 'NIST CSF · PR.AC', owner: 'vikram', maturity: 78, drift: 4 },
    { id: 'C-DP-014',  name: 'Encryption at rest: production datastores',        framework: 'GDPR Art.32 · NIST CSF', owner: 'vikram', maturity: 64, drift: 14 },
    { id: 'C-DP-015',  name: 'Encryption in transit: internal service mesh',     framework: 'GDPR Art.32',  owner: 'vikram', maturity: 71, drift: 9 },
    { id: 'C-AI-002',  name: 'AI risk-management system (ISO 42001)',             framework: 'AI Act Art.9', owner: 'priya',  maturity: 42, drift: 22 },
    { id: 'C-AI-003',  name: 'Training-data governance & provenance',             framework: 'AI Act Art.10', owner: 'priya', maturity: 38, drift: 25 },
    { id: 'C-AI-004',  name: 'GPAI technical documentation register',             framework: 'AI Act Art.53', owner: 'priya', maturity: 21, drift: 31 },
    { id: 'C-IR-007',  name: 'ICT incident classification (4-hour SLA)',          framework: 'DORA Art.17', owner: 'vikram', maturity: 55, drift: 11 },
    { id: 'C-TP-022',  name: 'ICT third-party register & subprocessor chain',     framework: 'DORA Art.28-30', owner: 'rohan', maturity: 48, drift: 18 },
    { id: 'C-SC-031',  name: 'SBOM generation & disclosure',                       framework: 'NIS2 Art.21 · CRA', owner: 'vikram', maturity: 35, drift: 24 },
    { id: 'C-DR-040',  name: 'Records of processing activities (RoPA)',           framework: 'GDPR Art.30',  owner: 'ananya', maturity: 82, drift: 3 },
    { id: 'C-DR-041',  name: 'DPIA: high-risk processing',                       framework: 'GDPR Art.35',  owner: 'ananya', maturity: 67, drift: 8 },
    { id: 'C-LR-050',  name: 'Log retention (180-day, India)',                     framework: 'CERT-In Dir.', owner: 'vikram', maturity: 73, drift: 6 }
  ];

  /* ------------------- Recent regulatory changes (radar) ------------------ */
  const changes = [
    { id: 'chg-01', regId: 'reg-ai-act',   detectedAt: '2026-05-12T07:14:00Z', summary: 'New Article 53: GPAI technical documentation obligations published as Commission guidance.', impact: 'critical', articleId: 'art-53', changeType: 'add'    },
    { id: 'chg-02', regId: 'reg-ai-act',   detectedAt: '2026-05-12T07:14:00Z', summary: 'Article 10 reworded: explicit data-provenance & bias-mitigation documentation.',           impact: 'high',     articleId: 'art-10', changeType: 'modify' },
    { id: 'chg-03', regId: 'reg-edpb-opn-4-2026', detectedAt: '2026-05-16T09:02:00Z', summary: 'EDPB Opinion 4/2026: encryption-at-rest and in-transit mandated for high-risk processing.', impact: 'high', articleId: null, changeType: 'add' },
    { id: 'chg-04', regId: 'reg-gdpr',     detectedAt: '2026-05-16T09:02:00Z', summary: 'Article 32 interpretation tightened by EDPB Op. 4/2026.', impact: 'high',     articleId: 'gdpr-32', changeType: 'modify' },
    { id: 'chg-05', regId: 'reg-dora',     detectedAt: '2026-05-14T11:50:00Z', summary: 'RTS adopted: explicit subcontracting chains for AI sub-processors.',                 impact: 'high',     articleId: 'dora-30', changeType: 'add'    },
    { id: 'chg-06', regId: 'reg-nis2',     detectedAt: '2026-05-09T15:21:00Z', summary: 'Article 21 amended: SBOM disclosure to authorities and annual adversary simulation.', impact: 'high',     articleId: 'nis2-21', changeType: 'modify' },
    { id: 'chg-07', regId: 'reg-certin-2024', detectedAt: '2026-05-10T05:30:00Z', summary: 'CERT-In advisory clarifies 6-hour reporting also applies to cloud-only entities serving Indian residents.', impact: 'medium', articleId: null, changeType: 'modify' },
    { id: 'chg-08', regId: 'reg-data-act', detectedAt: '2026-05-05T08:00:00Z', summary: 'Commission Q&A published on Article 3 data-accessibility obligations.',                 impact: 'medium',   articleId: 'da-3', changeType: 'modify' },
    { id: 'chg-09', regId: 'reg-cra',      detectedAt: '2026-04-29T13:00:00Z', summary: 'CRA harmonised standards draft: SBOM mandatory in CycloneDX or SPDX format.',          impact: 'medium',   articleId: null, changeType: 'modify' },
    { id: 'chg-10', regId: 'reg-nist-csf', detectedAt: '2026-04-02T16:00:00Z', summary: 'NIST IR 8477 published: mappings between CSF 2.0 and NIS2 controls.',                  impact: 'low',      articleId: null, changeType: 'add'    },
    { id: 'chg-11', regId: 'reg-dsa',      detectedAt: '2026-04-22T10:00:00Z', summary: 'Commission guidance on ad-repository data fields.',                                     impact: 'low',      articleId: 'dsa-26', changeType: 'modify' }
  ];

  /* ----------------------------- Risk items ------------------------------- */
  const risks = [
    { id: 'R-001', regId: 'reg-ai-act', controlId: 'C-AI-004', title: 'GPAI documentation not in place for internal LLM platform',  severity: 'critical', businessUnitId: 'bu-ai',    ownerId: 'priya',  openSince: '2026-04-22', remediationDueDays: -4 },
    { id: 'R-002', regId: 'reg-ai-act', controlId: 'C-AI-003', title: 'Training data lineage missing for fraud-detection model',     severity: 'high',     businessUnitId: 'bu-card',  ownerId: 'priya',  openSince: '2026-04-30', remediationDueDays: 9 },
    { id: 'R-003', regId: 'reg-gdpr',   controlId: 'C-DP-014', title: 'Encryption-at-rest disabled on legacy KYC datastore',          severity: 'critical', businessUnitId: 'bu-retail', ownerId: 'vikram', openSince: '2026-05-02', remediationDueDays: 3 },
    { id: 'R-004', regId: 'reg-edpb-opn-4-2026', controlId: 'C-DP-015', title: 'Internal service mesh: mTLS not enforced on 12% of services', severity: 'high', businessUnitId: 'bu-cloud', ownerId: 'vikram', openSince: '2026-05-04', remediationDueDays: 12 },
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
    { id: 'EV-109', controlId: 'C-DR-041', name: 'DPIA: credit-scoring model',            collectedAt: null,         expiresInDays: null, source: 'Pending' },
    { id: 'EV-110', controlId: 'C-LR-050', name: 'CloudWatch retention attestation',       collectedAt: '2026-04-26', expiresInDays: 5,   source: 'AWS Config' }
  ];

  /* ----------------------------- Actions ----------------------------------
     Each Preventive Action is a workflow object that closes a specific risk.
     It carries:
       * steps[]                : ordered checklist (toggleable at runtime)
       * evidenceRequirements[] : artifacts that prove it's actually done
                                    kinds: document (upload file), policy-section
                                    (link a policy + section), link (external URL),
                                    confirmation (typed attestation)
       * expectedDriftReduction : numeric estimate (drift points) that the
                                    closing of the linked risk will remove
                                    from the enterprise gauge -- drives the
                                    "Next best action" ranking
       * approverId             : separation of duties: owner != approver
       * status                 : planned -> in-progress -> review -> done
                                  (with a side-channel `blocked` state)
       * history[]              : append-only audit log of state transitions */
  const actions = [
    {
      id: 'A-2001', riskId: 'R-001', title: 'Stand up GPAI documentation register and back-fill internal LLM',
      ownerId: 'priya',  approverId: 'aarav', dueInDays: 7,  status: 'in-progress', effort: 'L', expectedDriftReduction: 14,
      summary: 'AI Act Art. 53 obliges providers of general-purpose AI models to maintain technical documentation. The internal LLM was not in the register.',
      steps: [
        { id: 's1', label: 'Draft a GPAI register schema (model name, version, training data summary, evaluation, copyright policy)', done: true,  doneAt: '2026-05-08', doneBy: 'priya' },
        { id: 's2', label: 'Back-fill register row for the internal LLM',                                                              done: true,  doneAt: '2026-05-13', doneBy: 'priya' },
        { id: 's3', label: 'Wire deployment pipeline to refuse promotion without a register entry',                                    done: false },
        { id: 's4', label: 'Walk the register through Legal + Privacy review',                                                          done: false }
      ],
      evidenceRequirements: [
        { id: 'e1', kind: 'document',       label: 'Signed GPAI register PDF',                                  fulfilled: false },
        { id: 'e2', kind: 'policy-section', label: 'Link Responsible AI Use Policy section that mandates this', fulfilled: false }
      ],
      history: [
        { at: '2026-05-05', who: 'priya', what: 'created the action and assigned it to herself' },
        { at: '2026-05-08', who: 'priya', what: 'completed step "Draft GPAI register schema"' },
        { at: '2026-05-13', who: 'priya', what: 'completed step "Back-fill register row"' }
      ]
    },
    {
      id: 'A-2002', riskId: 'R-002', title: 'Implement data lineage capture for fraud-detection training pipeline',
      ownerId: 'priya',  approverId: 'ananya', dueInDays: 14, status: 'planned',     effort: 'M', expectedDriftReduction: 9,
      summary: 'AI Act Art. 10 demands provenance and bias-mitigation evidence for training data; lineage is the cheapest way to demonstrate it.',
      steps: [
        { id: 's1', label: 'Inventory current data sources feeding the model',                                  done: false },
        { id: 's2', label: 'Stand up OpenLineage emission in the feature-store ETL',                            done: false },
        { id: 's3', label: 'Backfill lineage for the last two production training runs',                        done: false }
      ],
      evidenceRequirements: [
        { id: 'e1', kind: 'document',       label: 'OpenLineage export (JSON) for the latest run',              fulfilled: false },
        { id: 'e2', kind: 'link',           label: 'Lineage dashboard URL (internal)',                          fulfilled: false }
      ],
      history: [
        { at: '2026-05-09', who: 'priya', what: 'created the action and is scoping it' }
      ]
    },
    {
      id: 'A-2003', riskId: 'R-003', title: 'Enable LUKS at rest + re-key legacy KYC datastore (P1)',
      ownerId: 'vikram', approverId: 'aarav', dueInDays: 3,  status: 'in-progress', effort: 'M', expectedDriftReduction: 18,
      summary: 'GDPR Art. 32 (post-EDPB Op. 4/2026) now mandates encryption at rest for high-risk processing. The legacy datastore is the last gap.',
      steps: [
        { id: 's1', label: 'Cut a maintenance window with KYC ops',                                              done: true,  doneAt: '2026-05-14', doneBy: 'vikram' },
        { id: 's2', label: 'Enable LUKS on the legacy volume',                                                   done: true,  doneAt: '2026-05-16', doneBy: 'vikram' },
        { id: 's3', label: 'Rotate the keys via KMS (yearly rotation enforced)',                                 done: false },
        { id: 's4', label: 'Update the Encryption Standard policy section to reflect the new key cadence',       done: false }
      ],
      evidenceRequirements: [
        { id: 'e1', kind: 'document',       label: 'KMS rotation audit log (PDF or CSV)',                       fulfilled: false },
        { id: 'e2', kind: 'policy-section', label: 'Link Encryption Standard §3 (Encryption at rest)',          fulfilled: false }
      ],
      history: [
        { at: '2026-05-12', who: 'vikram', what: 'created the action and pulled in vikram + aarav' },
        { at: '2026-05-14', who: 'vikram', what: 'started the action' }
      ]
    },
    {
      id: 'A-2004', riskId: 'R-004', title: 'Enforce mTLS on remaining services in mesh (Istio policy)',
      ownerId: 'vikram', approverId: 'rohan', dueInDays: 10, status: 'in-progress', effort: 'M', expectedDriftReduction: 7,
      summary: 'NIS2 Art. 21 calls for cryptography in transit. 82% of services are mTLS-only; 18% still allow plaintext.',
      steps: [
        { id: 's1', label: 'Identify the 23 services still allowing plaintext',                                  done: true,  doneAt: '2026-05-11', doneBy: 'vikram' },
        { id: 's2', label: 'Open PRs to flip the Istio PeerAuthentication policy to STRICT',                     done: false },
        { id: 's3', label: 'Watch error budgets for 72h after rollout',                                          done: false }
      ],
      evidenceRequirements: [
        { id: 'e1', kind: 'document',       label: 'PeerAuthentication YAML showing mode: STRICT',              fulfilled: false },
        { id: 'e2', kind: 'confirmation',   label: 'Confirm no plaintext traffic in the last 24h dashboard',     fulfilled: false }
      ],
      history: [
        { at: '2026-05-09', who: 'vikram', what: 'created the action' },
        { at: '2026-05-11', who: 'vikram', what: 'completed inventory step' }
      ]
    },
    {
      id: 'A-2005', riskId: 'R-005', title: 'Tune incident triage runbook to hit 4-hour SLA (DORA Art. 17)',
      ownerId: 'vikram', approverId: 'aarav', dueInDays: 5,  status: 'in-progress', effort: 'S', expectedDriftReduction: 6,
      summary: 'DORA Art. 17 expects sub-4h triage. Current MTTR P95 is 4h45m.',
      steps: [
        { id: 's1', label: 'Move PagerDuty primary on-call to follow-the-sun',                                   done: true,  doneAt: '2026-05-13', doneBy: 'vikram' },
        { id: 's2', label: 'Add a Sev-1 triage checklist to the runbook',                                        done: false }
      ],
      evidenceRequirements: [
        { id: 'e1', kind: 'link',           label: 'PagerDuty schedule URL after change',                       fulfilled: false }
      ],
      history: [
        { at: '2026-05-12', who: 'vikram', what: 'created the action' },
        { at: '2026-05-13', who: 'vikram', what: 'moved on-call rotation' }
      ]
    },
    {
      id: 'A-2006', riskId: 'R-006', title: 'Re-collect subprocessor chain from top-25 SaaS vendors',
      ownerId: 'rohan',  approverId: 'aarav', dueInDays: 21, status: 'planned',     effort: 'L', expectedDriftReduction: 8,
      summary: 'EDPB Opinion 4/2026 sharpens the documented LIA + subprocessor chain. Top-25 vendors cover 92% of EU personal-data flow.',
      steps: [
        { id: 's1', label: 'Send subprocessor-disclosure questionnaire to top-25 vendors',                       done: false },
        { id: 's2', label: 'Capture responses in the vendor register',                                            done: false },
        { id: 's3', label: 'Update privacy notice with the new chain',                                            done: false }
      ],
      evidenceRequirements: [
        { id: 'e1', kind: 'document',       label: 'Vendor register export (CSV)',                              fulfilled: false }
      ],
      history: [{ at: '2026-05-15', who: 'rohan', what: 'created the action' }]
    },
    {
      id: 'A-2007', riskId: 'R-007', title: 'Roll out SBOM scanner across CI for all container images',
      ownerId: 'vikram', approverId: 'aarav', dueInDays: 30, status: 'planned',     effort: 'L', expectedDriftReduction: 11,
      summary: 'CRA Art. 13 mandates SBOM disclosure. We need every image to ship an SPDX/CycloneDX manifest.',
      steps: [
        { id: 's1', label: 'Add syft to the base CI image',                                                       done: false },
        { id: 's2', label: 'Fail the pipeline if the SBOM is missing',                                            done: false },
        { id: 's3', label: 'Backfill SBOMs for the 12 already-released services',                                done: false }
      ],
      evidenceRequirements: [
        { id: 'e1', kind: 'document',       label: 'Sample CycloneDX JSON from CI',                             fulfilled: false },
        { id: 'e2', kind: 'confirmation',   label: 'Confirm SBOM-presence gate is enforced for all repos',       fulfilled: false }
      ],
      history: [{ at: '2026-05-15', who: 'vikram', what: 'created the action' }]
    },
    {
      id: 'A-2008', riskId: 'R-008', title: 'Run DPIA for credit-scoring AI (model card + bias eval)',
      ownerId: 'ananya', approverId: 'aarav', dueInDays: 12, status: 'in-progress', effort: 'M', expectedDriftReduction: 10,
      summary: 'GDPR Art. 35 + AI Act Art. 9: high-risk automated decision-making needs a DPIA before promotion.',
      steps: [
        { id: 's1', label: 'Draft model card (intended use, dataset, limits)',                                    done: true,  doneAt: '2026-05-13', doneBy: 'ananya' },
        { id: 's2', label: 'Run bias evaluation across protected classes',                                        done: false },
        { id: 's3', label: 'Walk the DPIA through DPO + Legal',                                                   done: false }
      ],
      evidenceRequirements: [
        { id: 'e1', kind: 'document',       label: 'Signed DPIA report (PDF)',                                  fulfilled: false },
        { id: 'e2', kind: 'policy-section', label: 'Link Responsible AI Use Policy §3 (high-risk reviews)',     fulfilled: false }
      ],
      history: [
        { at: '2026-05-10', who: 'ananya', what: 'created the action' },
        { at: '2026-05-13', who: 'ananya', what: 'drafted model card' }
      ]
    },
    {
      id: 'A-2009', riskId: 'R-009', title: 'Raise CloudWatch retention to 180 days on prod-eu-1 cluster',
      ownerId: 'vikram', approverId: 'aarav', dueInDays: 6,  status: 'planned',     effort: 'S', expectedDriftReduction: 5,
      summary: 'CERT-In §5: ICT systems must retain logs for 180 days. Currently 90.',
      steps: [
        { id: 's1', label: 'Flip CloudWatch retention to 180 days',                                               done: false },
        { id: 's2', label: 'Backfill the last 90 days from S3 archive',                                           done: false }
      ],
      evidenceRequirements: [
        { id: 'e1', kind: 'confirmation',   label: 'Confirm retention setting via AWS console screenshot',       fulfilled: false }
      ],
      history: [{ at: '2026-05-15', who: 'vikram', what: 'created the action' }]
    },
    {
      id: 'A-2010', riskId: 'R-010', title: 'Add 5 new CDP processing activities to RoPA',
      ownerId: 'ananya', approverId: 'aarav', dueInDays: 14, status: 'planned',     effort: 'S', expectedDriftReduction: 4,
      summary: 'GDPR Art. 30: every processing activity must be recorded. The new CDP introduced 5 untracked activities.',
      steps: [
        { id: 's1', label: 'Walk through CDP with the data engineering lead',                                     done: false },
        { id: 's2', label: 'Write 5 RoPA entries (purpose, basis, retention, recipients)',                        done: false }
      ],
      evidenceRequirements: [
        { id: 'e1', kind: 'document',       label: 'Updated RoPA register PDF',                                 fulfilled: false }
      ],
      history: [{ at: '2026-05-15', who: 'ananya', what: 'created the action' }]
    }
  ];

  /* --------------------- Internal policies (seeded) ----------------------
     The company's OWN policy documents. A regulation says WHAT, a policy says
     HOW we comply, and a control is the technical implementation.
     `source: 'seeded'`  → ships with GRCentral
     `source: 'uploaded'` → user-uploaded at runtime (lives in localStorage)
     ---------------------------------------------------------------------- */
  const seededPolicies = [
    {
      id: 'pol-data-protection',
      title: 'Data Protection Policy',
      version: '3.2',
      status: 'published',
      ownerId: 'ananya',
      approverId: 'aarav',
      effectiveDate: '2025-09-01',
      nextReviewDate: '2026-09-01',
      source: 'seeded',
      format: 'pdf',
      documentUrl: 'https://gdpr.eu/',                              // illustrative external link
      fileName: 'data-protection-policy-v3.2.pdf',
      fileSize: 482103,
      uploadedAt: null,
      description: 'Defines lawful basis, data minimisation, retention windows and DSR procedures for all personal data processing across Babcom.',
      mapsToRegulations: ['reg-gdpr', 'reg-edpb-opn-4-2026'],
      mapsToArticles: ['gdpr-5', 'gdpr-6', 'gdpr-25', 'gdpr-30'],
      implementedByControls: ['C-DR-040', 'C-DR-041'],
      attestations: { required: 1200, completed: 1145 },
      tags: ['privacy', 'mandatory'],
      sections: [
        { id: 's1', num: '1', title: 'Scope and applicability', body: 'Applies to every business unit, contractor and processor handling personal data of EU/EEA, UK or Indian data subjects, regardless of where the processing happens.' },
        { id: 's2', num: '2', title: 'Lawful basis and consent', body: 'Each processing activity is recorded against one of six lawful bases per GDPR Art. 6. Consent, where used, is unbundled, granular and revocable through the customer portal.' },
        { id: 's3', num: '3', title: 'Data minimisation and retention', body: 'Default retention is 24 months for marketing, 7 years for KYC, 10 years for accounting. Anything beyond requires a documented business case approved by the DPO.' },
        { id: 's4', num: '4', title: 'Data subject rights (DSR)', body: 'Access, rectification, erasure and portability requests are answered within 30 calendar days. The DSR queue is monitored daily; SLAs are tracked in PagerDuty.' },
        { id: 's5', num: '5', title: 'International transfers', body: 'Transfers outside the EEA rely on Standard Contractual Clauses 2021/914, supplemented by a Transfer Impact Assessment refreshed annually.' }
      ]
    },
    {
      id: 'pol-acceptable-use',
      title: 'Acceptable Use Policy',
      version: '2.4',
      status: 'published',
      ownerId: 'vikram',
      approverId: 'aarav',
      effectiveDate: '2025-04-15',
      nextReviewDate: '2026-04-15',
      source: 'seeded',
      format: 'pdf',
      documentUrl: 'https://owasp.org/',
      fileName: 'acceptable-use-v2.4.pdf',
      fileSize: 198432,
      uploadedAt: null,
      description: 'Governs employee use of corporate systems, BYOD, removable media, generative-AI tools and remote-access conduct.',
      mapsToRegulations: [],
      mapsToArticles: [],
      implementedByControls: ['C-AC-001'],
      attestations: { required: 1200, completed: 1199 },
      tags: ['mandatory', 'org-wide'],
      sections: [
        { id: 's1', num: '1', title: 'Acceptable use of corporate systems', body: 'Corporate laptops, accounts and cloud services may only be used for work or de-minimis personal use. No mining, no scraping at scale, no automated harvesting of third-party services.' },
        { id: 's2', num: '2', title: 'Generative AI tools', body: 'Public LLM services may not receive customer personal data, source code, or confidential decks. Approved enterprise LLM endpoints (Azure OpenAI tenanted, Vertex AI tenanted) are available via the AI Gateway.' },
        { id: 's3', num: '3', title: 'Removable media and BYOD', body: 'Personal USB drives, SD cards and portable HDDs are blocked at the endpoint. BYOD phones must be enrolled in MDM with separate work profile and FDE.' },
        { id: 's4', num: '4', title: 'Remote access', body: 'Remote access is exclusively over the Zscaler tunnel; split tunnelling is disabled. RDP/SSH to production is brokered through the PAM with session recording.' }
      ]
    },
    {
      id: 'pol-encryption-standard',
      title: 'Encryption Standard',
      version: '4.1',
      status: 'published',
      ownerId: 'vikram',
      approverId: 'aarav',
      effectiveDate: '2025-11-01',
      nextReviewDate: '2026-07-01',                                 // due in <90d: surfaces in KPI
      source: 'seeded',
      format: 'pdf',
      documentUrl: 'https://www.edpb.europa.eu/',
      fileName: 'encryption-standard-v4.1.pdf',
      fileSize: 612844,
      uploadedAt: null,
      description: 'Approved ciphers, key-rotation cadences and TLS profiles. Mandates encryption-at-rest and in-transit for all high-risk processing (EDPB Op. 4/2026).',
      mapsToRegulations: ['reg-gdpr', 'reg-edpb-opn-4-2026', 'reg-nis2'],
      mapsToArticles: ['gdpr-32'],
      implementedByControls: ['C-DP-014', 'C-DP-015'],
      attestations: { required: 320, completed: 280 },
      tags: ['security', 'technical'],
      sections: [
        { id: 's1', num: '1', title: 'Cipher suites', body: 'TLS 1.2 with PFS-only suites, TLS 1.3 preferred. AES-256-GCM, ChaCha20-Poly1305. RSA-2048 minimum; ECDSA P-256/P-384 preferred. No RC4, no 3DES, no SHA-1.' },
        { id: 's2', num: '2', title: 'Encryption at rest', body: 'All production datastores (RDS, S3, DocumentDB, EFS, EBS) are encrypted at rest with KMS CMKs. Backups inherit the same key policy. Keys rotated annually; per-tenant CMKs for the SaaS plane.' },
        { id: 's3', num: '3', title: 'Encryption in transit', body: 'Every internal service-to-service hop is mutual TLS through the Istio mesh. Edge traffic terminates at the ALB with HSTS preload.' },
        { id: 's4', num: '4', title: 'Key management', body: 'AWS KMS is the system of record. Customer-managed keys are stored in KMS Custody for regulated tenants. Manual key handling is forbidden outside the HSM workflow.' },
        { id: 's5', num: '5', title: 'High-risk processing (EDPB Op. 4/2026)', body: 'Any processing classified as high-risk under GDPR Art. 35 must apply encryption-at-rest AND in-transit, with a documented residual-risk acceptance from the DPO.' }
      ]
    },
    {
      id: 'pol-ai-use',
      title: 'Responsible AI Use Policy',
      version: '1.3',
      status: 'published',
      ownerId: 'priya',
      approverId: 'kavya',
      effectiveDate: '2026-02-12',
      nextReviewDate: '2026-08-12',                                 // due ~90d
      source: 'seeded',
      format: 'markdown',
      documentUrl: 'https://digital-strategy.ec.europa.eu/',
      fileName: 'responsible-ai-use-v1.3.md',
      fileSize: 84210,
      uploadedAt: null,
      description: 'Covers AI risk-tiering per AI Act, prohibited use cases, GPAI documentation requirements and human-in-the-loop overrides.',
      mapsToRegulations: ['reg-ai-act'],
      mapsToArticles: ['art-5', 'art-9', 'art-10', 'art-53'],
      implementedByControls: ['C-AI-002', 'C-AI-003', 'C-AI-004'],
      attestations: { required: 240, completed: 162 },
      tags: ['ai', 'mandatory'],
      sections: [
        { id: 's1', num: '1', title: 'Risk-tiering of AI systems', body: 'Every internal or vendor AI system is classified at intake: prohibited, high-risk, limited-risk or minimal-risk. The classification is reviewed quarterly and at every material model change.' },
        { id: 's2', num: '2', title: 'Prohibited use cases (AI Act Art. 5)', body: 'Social scoring, real-time biometric ID in public spaces, manipulative or exploitative systems, and untargeted scraping of facial images are not permitted. No exception process.' },
        { id: 's3', num: '3', title: 'High-risk system obligations (AI Act Annex III)', body: 'High-risk systems require a documented risk-management system (ISO 42001), conformity assessment, human oversight controls and post-market monitoring. See Article 6, Article 9 of the AI Act.' },
        { id: 's4', num: '4', title: 'Training data governance (AI Act Art. 10)', body: 'Training, validation and test sets must be relevant, representative and free of obvious errors. Provenance is recorded in the data card; bias-mitigation steps are logged.' },
        { id: 's5', num: '5', title: 'GPAI providers (AI Act Art. 53)', body: 'For foundation models we either deploy as a deployer (vendor obligations) or, where Babcom is the provider, we maintain the technical documentation register, copyright-policy and downstream-disclosure pack.' },
        { id: 's6', num: '6', title: 'Human-in-the-loop overrides', body: 'For any AI-assisted decision affecting a natural person\u2019s rights, the customer-facing workflow exposes a one-click human-review path with a 5-day SLA.' }
      ]
    },
    {
      id: 'pol-incident-response',
      title: 'Incident Response Plan',
      version: '5.0',
      status: 'published',
      ownerId: 'vikram',
      approverId: 'aarav',
      effectiveDate: '2025-10-01',
      nextReviewDate: '2026-10-01',
      source: 'seeded',
      format: 'pdf',
      documentUrl: 'https://www.enisa.europa.eu/',
      fileName: 'incident-response-plan-v5.0.pdf',
      fileSize: 1024560,
      uploadedAt: null,
      description: 'End-to-end runbook: detection, classification (DORA 4-hour SLA), escalation, NIS2 24/72-hour notifications, CERT-In 6-hour reporting and post-incident review.',
      mapsToRegulations: ['reg-nis2', 'reg-dora', 'reg-certin-2024'],
      mapsToArticles: ['nis2-23', 'dora-17'],
      implementedByControls: ['C-IR-007', 'C-LR-050'],
      attestations: { required: 110, completed: 110 },
      tags: ['security', 'operational'],
      sections: [
        { id: 's1', num: '1', title: 'Detection', body: 'SOC operates 24x7 on Sentinel + a Splunk back-end. Detections cover the MITRE ATT&CK enterprise matrix; weekly purple-team exercises tune the noisiest analytics.' },
        { id: 's2', num: '2', title: 'Classification (DORA Art. 17)', body: 'Incidents are classified within 4 hours of detection against the DORA criteria (clients affected, data lost, geographic reach, reputational impact, economic impact, duration, criticality).' },
        { id: 's3', num: '3', title: 'Notifications', body: 'NIS2 24h early-warning, 72h notification, 1-month final report. CERT-In 6h reporting for India-presence incidents. DORA major-incident reporting through the JRA portal.' },
        { id: 's4', num: '4', title: 'Containment and eradication', body: 'Runbooks per attack family (ransomware, identity-compromise, supply-chain, web-app). Each runbook ends with a forensic-preservation step that is logged into the JEDB.' },
        { id: 's5', num: '5', title: 'Post-incident review', body: 'Blameless review within 10 business days, RCA and corrective-actions tracked to closure. Findings feed the next quarter\u2019s purple-team scope.' }
      ]
    },
    {
      id: 'pol-third-party-risk',
      title: 'Third-Party Risk Management Policy',
      version: '2.1',
      status: 'draft',                                              // intentionally not yet approved
      ownerId: 'rohan',
      approverId: 'aarav',
      effectiveDate: null,
      nextReviewDate: '2026-06-30',
      source: 'seeded',
      format: 'pdf',
      documentUrl: 'https://www.cisecurity.org/cis-benchmarks',
      fileName: 'third-party-risk-v2.1-DRAFT.pdf',
      fileSize: 348221,
      uploadedAt: null,
      description: 'Vendor due-diligence, ICT subprocessor register (DORA Art.28-30), SBOM expectations (CRA, NIS2) and contractual minima for critical-or-important suppliers.',
      mapsToRegulations: ['reg-dora', 'reg-nis2', 'reg-cra'],
      mapsToArticles: ['dora-28', 'dora-30', 'nis2-21'],
      implementedByControls: ['C-TP-022', 'C-SC-031'],
      attestations: { required: 80, completed: 0 },
      tags: ['vendor', 'draft'],
      sections: [
        { id: 's1', num: '1', title: 'Vendor tiering', body: 'Vendors are tiered T1 to T4 by the criticality of the function they support. T1 (critical-or-important per DORA) carry the strictest contractual minima and an annual on-site assurance review.' },
        { id: 's2', num: '2', title: 'Due diligence', body: 'Pre-contract: SIG-Lite, SOC 2 Type II, ISO 27001, financial-stability check. Post-contract: continuous monitoring through SecurityScorecard + concentration analysis quarterly.' },
        { id: 's3', num: '3', title: 'Contractual minima (DORA Art. 28-30)', body: 'Right to audit, sub-contractor disclosure, exit plan, encryption in transit and at rest, incident notification within 24h, and explicit subcontracting chains for any AI sub-processor.' },
        { id: 's4', num: '4', title: 'SBOM expectations', body: 'For products with digital elements (CRA scope): CycloneDX or SPDX SBOM at every release, signed, with a 7-day SLA for known-vulnerable component disclosure.' },
        { id: 's5', num: '5', title: 'Exit and concentration', body: 'Every T1 vendor has an exit plan reviewed annually. The combined Tier-1 cloud + payments concentration is capped per the board\u2019s risk appetite (currently 60% of any single hyperscaler).' }
      ]
    }
  ];

  /* --------------------- Persistence shim (localStorage) -----------------
     The test sandbox has no `localStorage`; fall back to an in-memory Map so
     the same code path works in both browser and Node-VM contexts. */
  const _store = (typeof localStorage !== 'undefined') ? localStorage : (() => {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)),
      removeItem: (k) => m.delete(k)
    };
  })();

  const K_USER_POLICIES = 'grc.userPolicies';
  const K_CTRL_MAP      = 'grc.controlPolicyMap';
  const K_FILE_PREFIX   = 'grc.policyFile.';
  const MAX_FILE_BYTES  = 3 * 1024 * 1024;                          // 3 MB cap per upload

  function _loadJSON(key, fallback) {
    try { const raw = _store.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (_) { return fallback; }
  }
  function _saveJSON(key, value) {
    try { _store.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }

  let userPolicies     = _loadJSON(K_USER_POLICIES, []);
  let controlPolicyMap = _loadJSON(K_CTRL_MAP, {});
  /* Policies that live on the server (Vercel Blob). Populated by
     refreshServerPolicies(); empty in local/offline mode. */
  let serverPolicies   = [];

  function getAllPolicies() {
    /* Seeded first (immutable), then server uploads (newest first),
       then this-browser-only local uploads (newest first). */
    const seen = new Set();
    const out = [];
    seededPolicies.forEach(function (p) { if (!seen.has(p.id)) { seen.add(p.id); out.push(p); } });
    serverPolicies.slice().forEach(function (p) { if (p && !seen.has(p.id)) { seen.add(p.id); out.push(p); } });
    userPolicies.slice().reverse().forEach(function (p) { if (p && !seen.has(p.id)) { seen.add(p.id); out.push(p); } });
    return out;
  }

  function getServerPolicies()  { return serverPolicies.slice(); }
  function _hydrateServerPolicies(arr) {
    serverPolicies = Array.isArray(arr) ? arr.slice() : [];
  }
  /* Async loader: pulls the catalogue from /api/policies and stores it in
     the in-memory cache. Safe to call repeatedly. Returns the array on
     success or `null` if cloud mode is not available.

     After hydrating, we deterministically re-derive compliance gaps for
     every server policy that the current session has not derived yet.
     This is what makes the Compliance Gaps + Evidence Vault pages look
     the same for every visitor without us needing to persist the derived
     rows on Blob -- the inputs (policy + frameworkControls) are identical
     everywhere, so the outputs are too. */
  function refreshServerPolicies() {
    if (typeof window === 'undefined' || !window.CloudPolicies) return Promise.resolve(null);
    return window.CloudPolicies.ping().then(function (ok) {
      if (!ok) { _hydrateServerPolicies([]); return null; }
      return window.CloudPolicies.list().then(function (list) {
        _hydrateServerPolicies(list);
        (list || []).forEach(function (p) {
          if (!p || !p.id) return;
          const alreadyDerived = risks.some(function (r) { return r.sourcePolicyId === p.id; });
          if (alreadyDerived) return;
          try {
            const scan = scanPolicyCompliance(p);
            applyComplianceGaps(p.id, scan);
          } catch (_) { /* skip on individual failure */ }
        });
        return serverPolicies.slice();
      });
    });
  }
  /* Add to the in-memory cache without making a round-trip. Used after a
     successful upload so the new policy shows up immediately. */
  function _ingestServerPolicy(p) {
    if (!p || !p.id) return;
    serverPolicies = [p].concat(serverPolicies.filter(function (x) { return x && x.id !== p.id; }));
  }
  function _evictServerPolicy(id) {
    serverPolicies = serverPolicies.filter(function (x) { return x && x.id !== id; });
  }
  function getPolicyById(id) {
    return getAllPolicies().find(p => p.id === id) || null;
  }
  function addUserPolicy(meta, fileBase64, mimeType) {
    /* Validate metadata. */
    if (!meta || !meta.title || !meta.title.trim()) {
      return { ok: false, error: 'Title is required' };
    }
    const allowedFormats = ['pdf', 'markdown', 'html', 'text', 'link'];
    const fmt = (meta.format || 'pdf').toLowerCase();
    if (allowedFormats.indexOf(fmt) === -1) {
      return { ok: false, error: 'Unsupported format (allowed: ' + allowedFormats.join(', ') + ')' };
    }
    /* Generate id and persist file content (if any). */
    const id = 'pol-usr-' + Math.random().toString(36).slice(2, 8);
    let stored = false;
    if (fileBase64 && fmt !== 'link') {
      const bytes = Math.ceil((fileBase64.length * 3) / 4);
      if (bytes > MAX_FILE_BYTES) {
        return { ok: false, error: 'File too large (max ' + (MAX_FILE_BYTES / 1024 / 1024) + ' MB for in-browser storage)' };
      }
      stored = _saveJSON(K_FILE_PREFIX + id, { mimeType: mimeType || 'application/octet-stream', base64: fileBase64 });
    }
    const policy = {
      id: id,
      title:           String(meta.title).trim(),
      version:         String(meta.version || '1.0').trim(),
      status:          meta.status === 'draft' ? 'draft' : 'published',
      ownerId:         meta.ownerId    || null,
      approverId:      meta.approverId || null,
      effectiveDate:   meta.effectiveDate   || new Date().toISOString().slice(0, 10),
      nextReviewDate:  meta.nextReviewDate  || null,
      source:          'uploaded',
      format:          fmt,
      documentUrl:     fmt === 'link' ? (meta.documentUrl || null) : null,
      fileName:        meta.fileName || null,
      fileSize:        meta.fileSize || 0,
      uploadedAt:      new Date().toISOString(),
      description:     String(meta.description || '').trim(),
      mapsToRegulations:    Array.isArray(meta.mapsToRegulations)    ? meta.mapsToRegulations.slice()    : [],
      mapsToArticles:       Array.isArray(meta.mapsToArticles)       ? meta.mapsToArticles.slice()       : [],
      implementedByControls:Array.isArray(meta.implementedByControls)? meta.implementedByControls.slice(): [],
      attestations:    { required: 0, completed: 0 },
      tags:            Array.isArray(meta.tags) ? meta.tags.slice() : [],
      hasFile:         stored
    };
    userPolicies.push(policy);
    _saveJSON(K_USER_POLICIES, userPolicies);
    return { ok: true, policy: policy };
  }
  function deleteUserPolicy(id) {
    const before = userPolicies.length;
    userPolicies = userPolicies.filter(p => p.id !== id);
    _saveJSON(K_USER_POLICIES, userPolicies);
    _store.removeItem(K_FILE_PREFIX + id);
    /* Unlink any controls pointing at this policy. */
    let changed = false;
    Object.keys(controlPolicyMap).forEach(k => {
      if (controlPolicyMap[k] === id) { delete controlPolicyMap[k]; changed = true; }
    });
    if (changed) _saveJSON(K_CTRL_MAP, controlPolicyMap);
    return userPolicies.length < before;
  }
  function getPolicyFile(id) {
    /* Local-storage path (this browser's uploads). For server-hosted policies
       the binary lives on the Vercel Blob CDN and is loaded via policy.fileUrl,
       not through this function. */
    return _loadJSON(K_FILE_PREFIX + id, null);
  }

  /* ====================================================================== */
  /*  Cloud upload + delete (Vercel Blob via /api/policies)                 */
  /*  --------------------------------------------------------------------- */
  /*  These are async wrappers around the CloudPolicies fetch helper. They  */
  /*  return a result shape that mirrors addUserPolicy({ ok, policy/error}) */
  /*  so the calling view code can treat both paths uniformly.              */
  /* ====================================================================== */
  function addServerPolicy(meta, fileBase64, mimeType) {
    if (typeof window === 'undefined' || !window.CloudPolicies) {
      return Promise.resolve({ ok: false, error: 'Cloud client not loaded' });
    }
    return window.CloudPolicies.upload(meta, fileBase64, mimeType).then(function (res) {
      if (res.ok && res.policy) {
        _ingestServerPolicy(res.policy);
        return { ok: true, policy: res.policy };
      }
      return { ok: false, error: res.error || 'Upload failed' };
    });
  }
  function deleteServerPolicy(id) {
    if (typeof window === 'undefined' || !window.CloudPolicies) {
      return Promise.resolve(false);
    }
    return window.CloudPolicies.remove(id).then(function (res) {
      if (res.ok) {
        _evictServerPolicy(id);
        /* Also drop any controlPolicyMap rows pointing at this server policy. */
        let changed = false;
        Object.keys(controlPolicyMap).forEach(function (k) {
          if (controlPolicyMap[k] === id) { delete controlPolicyMap[k]; changed = true; }
        });
        if (changed) _saveJSON(K_CTRL_MAP, controlPolicyMap);
        /* Evict the derived risks + evidence we materialised on hydration so
           the Compliance Gaps page doesn't show ghost rows after a delete. */
        for (let i = risks.length - 1; i >= 0; i--) {
          if (risks[i].sourcePolicyId === id) {
            delete indexes.risks[risks[i].id];
            risks.splice(i, 1);
          }
        }
        for (let j = evidence.length - 1; j >= 0; j--) {
          if (evidence[j].policyId === id) {
            delete indexes.evidence[evidence[j].id];
            evidence.splice(j, 1);
          }
        }
        return true;
      }
      return false;
    });
  }
  function linkControlToPolicy(controlId, policyId) {
    if (!controlId) return false;
    if (policyId) controlPolicyMap[controlId] = policyId;
    else delete controlPolicyMap[controlId];
    return _saveJSON(K_CTRL_MAP, controlPolicyMap);
  }
  function getPolicyForControl(controlId) {
    /* Explicit user mapping wins; otherwise infer from seeded
       `implementedByControls` arrays. */
    const explicitId = controlPolicyMap[controlId];
    if (explicitId) {
      const p = getPolicyById(explicitId);
      if (p) return p;
    }
    return getAllPolicies().find(p =>
      Array.isArray(p.implementedByControls) && p.implementedByControls.indexOf(controlId) !== -1
    ) || null;
  }

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

  /* ====================================================================== */
  /*  Framework Controls                                                    */
  /*  ---------------------------------------------------------------------- */
  /*  In the PO's language a *framework* = a regulation (GDPR, AI Act,      */
  /*  DORA, ...) and a *control* = a specific clause / article / annex of   */
  /*  that framework that an internal policy must address.                  */
  /*                                                                        */
  /*  Each control carries a small set of `keywords` that the compliance    */
  /*  scanner uses to decide whether a policy actually covers it. Severity  */
  /*  drives how badly a *missing* control hurts the drift score.           */
  /* ====================================================================== */
  const frameworkControls = {
    'reg-gdpr': [
      { id: 'gdpr-fc-art5',  code: 'Art. 5',  title: 'Principles relating to processing',          severity: 'high',     summary: 'Lawful basis, purpose limitation, data minimisation, accuracy, storage limitation and integrity.', keywords: ['lawful basis', 'purpose limitation', 'data minimisation', 'minimisation', 'storage limitation', 'principles'] },
      { id: 'gdpr-fc-art6',  code: 'Art. 6',  title: 'Lawfulness of processing',                   severity: 'high',     summary: 'A processing activity must rest on one of six lawful bases.', keywords: ['lawful basis', 'consent', 'legitimate interest', 'article 6', 'art. 6'] },
      { id: 'gdpr-fc-art25', code: 'Art. 25', title: 'Data protection by design and by default',   severity: 'high',     summary: 'Technical and organisational measures built into processing from the outset.', keywords: ['by design', 'by default', 'pseudonymisation', 'data protection by design'] },
      { id: 'gdpr-fc-art30', code: 'Art. 30', title: 'Records of processing activities',           severity: 'medium',   summary: 'A documented inventory of every processing activity and its purposes.', keywords: ['records of processing', 'ropa', 'inventory', 'processing activities'] },
      { id: 'gdpr-fc-art32', code: 'Art. 32', title: 'Security of processing',                     severity: 'critical', summary: 'Appropriate technical and organisational measures, encryption at rest and in transit for high-risk processing.', keywords: ['encryption', 'art. 32', 'article 32', 'security of processing', 'integrity', 'availability'] },
      { id: 'gdpr-fc-art33', code: 'Art. 33', title: 'Personal-data breach notification',          severity: 'high',     summary: 'Breach notification to the supervisory authority within 72 hours.', keywords: ['breach notification', '72 hours', 'personal data breach'] },
      { id: 'gdpr-fc-art35', code: 'Art. 35', title: 'Data protection impact assessment',          severity: 'medium',   summary: 'DPIA for high-risk processing operations.', keywords: ['dpia', 'data protection impact assessment'] },
      { id: 'gdpr-fc-art44', code: 'Art. 44', title: 'Transfers to third countries',               severity: 'medium',   summary: 'Adequacy, SCCs or BCRs for international transfers.', keywords: ['international transfer', 'scc', 'standard contractual clauses', 'cross-border', 'third country'] }
    ],
    'reg-ai-act': [
      { id: 'aia-fc-art5',   code: 'Art. 5',   title: 'Prohibited AI practices',                   severity: 'critical', summary: 'Bans on manipulative, social-scoring, biometric-categorisation and untargeted-scraping systems.', keywords: ['prohibited', 'manipulation', 'social scoring', 'subliminal'] },
      { id: 'aia-fc-art6',   code: 'Art. 6',   title: 'Classification rules for high-risk systems', severity: 'high',    summary: 'When an AI system counts as "high-risk" and triggers Annex III obligations.', keywords: ['high-risk', 'high risk', 'article 6', 'annex iii', 'classification'] },
      { id: 'aia-fc-art9',   code: 'Art. 9',   title: 'Risk-management system',                    severity: 'high',     summary: 'Continuous risk-management process across the AI system lifecycle.', keywords: ['risk management', 'risk management system', 'rms', 'lifecycle'] },
      { id: 'aia-fc-art10',  code: 'Art. 10',  title: 'Data and data governance',                  severity: 'high',     summary: 'Training, validation and testing data quality, bias mitigation and provenance.', keywords: ['data governance', 'training data', 'bias', 'provenance', 'representative'] },
      { id: 'aia-fc-art13',  code: 'Art. 13',  title: 'Transparency to deployers',                 severity: 'medium',   summary: 'Instructions for use, intended purpose, accuracy and robustness disclosed to deployers.', keywords: ['transparency', 'instructions for use', 'deployer', 'intended purpose'] },
      { id: 'aia-fc-art14',  code: 'Art. 14',  title: 'Human oversight',                           severity: 'high',     summary: 'Effective human-oversight measures over high-risk AI systems.', keywords: ['human oversight', 'human-in-the-loop', 'oversight'] },
      { id: 'aia-fc-art50',  code: 'Art. 50',  title: 'Transparency for certain AI systems',       severity: 'medium',   summary: 'Disclosure obligations for chatbots, deepfakes and emotion-recognition systems.', keywords: ['chatbot', 'deepfake', 'synthetic content', 'emotion recognition'] },
      { id: 'aia-fc-art53',  code: 'Art. 53',  title: 'GPAI provider obligations',                 severity: 'high',     summary: 'Documentation, copyright policy and serious-incident reporting for general-purpose models.', keywords: ['gpai', 'general-purpose', 'general purpose ai', 'foundation model', 'copyright'] }
    ],
    'reg-nis2': [
      { id: 'nis2-fc-art20', code: 'Art. 20', title: 'Governance of cybersecurity risk',           severity: 'high',     summary: 'Management bodies approve and oversee cybersecurity risk-management measures.', keywords: ['governance', 'board oversight', 'management body', 'accountability'] },
      { id: 'nis2-fc-art21', code: 'Art. 21', title: 'Cybersecurity risk-management measures',     severity: 'critical', summary: 'Risk analyses, incident handling, BCM, supply-chain security, vulnerability handling, cryptography.', keywords: ['risk analysis', 'business continuity', 'supply chain', 'cryptography', 'vulnerability handling', 'sbom'] },
      { id: 'nis2-fc-art23', code: 'Art. 23', title: 'Incident reporting (24h/72h/1m)',            severity: 'critical', summary: 'Early warning within 24 h, full notification within 72 h, final report within 1 month.', keywords: ['24 hours', '72 hours', 'incident reporting', 'early warning'] },
      { id: 'nis2-fc-art32', code: 'Art. 32', title: 'Supervisory measures',                       severity: 'medium',   summary: 'Audit, inspection and information-request obligations toward competent authorities.', keywords: ['audit', 'inspection', 'competent authority', 'supervisory'] }
    ],
    'reg-dora': [
      { id: 'dora-fc-art5',  code: 'Art. 5',  title: 'ICT risk-management framework',              severity: 'high',     summary: 'Documented ICT risk-management framework approved by the management body.', keywords: ['ict risk', 'risk management framework', 'ict governance'] },
      { id: 'dora-fc-art17', code: 'Art. 17', title: 'ICT-related incident management',            severity: 'high',     summary: 'Detection, classification, response and reporting of ICT-related incidents.', keywords: ['ict incident', 'incident management', 'incident classification'] },
      { id: 'dora-fc-art24', code: 'Art. 24', title: 'Digital operational resilience testing',     severity: 'high',     summary: 'Threat-led penetration testing and resilience scenarios.', keywords: ['penetration test', 'tlpt', 'resilience testing', 'threat-led'] },
      { id: 'dora-fc-art28', code: 'Art. 28', title: 'ICT third-party risk management',            severity: 'critical', summary: 'Lifecycle management of contracts with ICT third-party providers, concentration risk.', keywords: ['third-party', 'third party', 'subcontract', 'concentration risk', 'ict provider'] },
      { id: 'dora-fc-art30', code: 'Art. 30', title: 'Contractual provisions',                     severity: 'medium',   summary: 'Mandatory clauses in ICT-services contracts (audit rights, exit strategies, locations).', keywords: ['exit strategy', 'audit rights', 'service location'] }
    ],
    'reg-dsa': [
      { id: 'dsa-fc-art14',  code: 'Art. 14',  title: 'Terms and conditions',                      severity: 'medium',   summary: 'Clear, machine-readable terms covering content moderation and algorithmic rules.', keywords: ['terms and conditions', 'community guidelines', 'machine-readable'] },
      { id: 'dsa-fc-art16',  code: 'Art. 16',  title: 'Notice-and-action mechanism',               severity: 'high',     summary: 'Easy-to-use channel for any user to flag illegal content.', keywords: ['notice and action', 'illegal content', 'flagging', 'report content'] },
      { id: 'dsa-fc-art22',  code: 'Art. 22',  title: 'Trusted flaggers',                          severity: 'medium',   summary: 'Priority handling for entities designated as trusted flaggers by Digital Services Coordinators.', keywords: ['trusted flagger', 'priority handling'] },
      { id: 'dsa-fc-art24',  code: 'Art. 24',  title: 'Transparency reporting',                    severity: 'medium',   summary: 'Annual transparency report on content moderation activities.', keywords: ['transparency report', 'transparency reporting', 'annual report'] }
    ],
    'reg-eidas2': [
      { id: 'eidas2-fc-wallet', code: 'Art. 6a', title: 'European Digital Identity Wallet',         severity: 'high',     summary: 'Issuance, use and revocation of the EUDI Wallet.', keywords: ['eudi wallet', 'digital identity wallet', 'wallet'] },
      { id: 'eidas2-fc-qts',    code: 'Art. 24', title: 'Qualified trust services',                 severity: 'high',     summary: 'Requirements applicable to qualified trust service providers.', keywords: ['qualified trust', 'qtsp', 'trust service'] },
      { id: 'eidas2-fc-eid',    code: 'Art. 9',  title: 'Electronic identification schemes',        severity: 'medium',   summary: 'Notified eID schemes and assurance levels.', keywords: ['electronic identification', 'eid scheme', 'assurance level'] }
    ],
    'reg-data-act': [
      { id: 'da-fc-share',  code: 'Art. 4',  title: 'User access to IoT data',                     severity: 'high',     summary: 'Users of connected products have the right to access the data they generate.', keywords: ['data sharing', 'user access', 'iot data', 'connected product'] },
      { id: 'da-fc-portab', code: 'Art. 23', title: 'Switching between data-processing services',  severity: 'high',     summary: 'Cloud switching and interoperability obligations.', keywords: ['switching', 'cloud switching', 'interoperability', 'portability'] },
      { id: 'da-fc-gov',    code: 'Art. 14', title: 'Business-to-government data sharing',         severity: 'medium',   summary: 'Exceptional-need access for public-sector bodies.', keywords: ['b2g', 'public body', 'exceptional need'] }
    ],
    'reg-edpb-opn-4-2026': [
      { id: 'edpb4-fc-li',   code: '§3',  title: 'Legitimate-interest test',                       severity: 'high',     summary: 'Three-step legitimate-interest assessment (purpose, necessity, balancing).', keywords: ['legitimate interest', 'lia', 'balancing test'] },
      { id: 'edpb4-fc-doc',  code: '§5',  title: 'Documentation of the LIA',                       severity: 'medium',   summary: 'Maintain a written, reviewable legitimate-interest assessment.', keywords: ['documentation', 'lia documentation'] },
      { id: 'edpb4-fc-info', code: '§7',  title: 'Information to data subjects',                   severity: 'medium',   summary: 'Inform the data subject of the legitimate interest pursued.', keywords: ['transparency', 'inform data subject', 'privacy notice'] }
    ],
    'reg-cra': [
      { id: 'cra-fc-sbom',   code: 'Art. 13', title: 'SBOM disclosure',                            severity: 'critical', summary: 'Maintain and disclose a Software Bill of Materials per CycloneDX/SPDX.', keywords: ['sbom', 'cyclonedx', 'spdx', 'software bill of materials'] },
      { id: 'cra-fc-vdp',    code: 'Art. 11', title: 'Coordinated vulnerability disclosure',       severity: 'high',     summary: 'A documented process for receiving and acting on vulnerability reports.', keywords: ['vulnerability disclosure', 'vdp', 'coordinated disclosure'] },
      { id: 'cra-fc-secdev', code: 'Annex I', title: 'Essential cybersecurity requirements',       severity: 'high',     summary: 'Secure-by-design, secure-by-default, no known exploitable vulnerabilities at shipping.', keywords: ['secure by design', 'secure-by-default', 'known exploitable'] }
    ],
    'reg-nist-csf': [
      { id: 'nist-fc-id',  code: 'ID', title: 'Identify',                                          severity: 'medium',   summary: 'Asset management, business environment, governance, risk assessment.', keywords: ['identify', 'asset management', 'business environment'] },
      { id: 'nist-fc-pr',  code: 'PR', title: 'Protect',                                           severity: 'high',     summary: 'Access control, data security, training, maintenance, protective technology.', keywords: ['protect', 'access control', 'data security', 'awareness training'] },
      { id: 'nist-fc-de',  code: 'DE', title: 'Detect',                                            severity: 'high',     summary: 'Anomalies, continuous monitoring and detection processes.', keywords: ['detect', 'monitoring', 'anomaly detection', 'continuous monitoring'] },
      { id: 'nist-fc-rs',  code: 'RS', title: 'Respond',                                           severity: 'high',     summary: 'Response planning, communications, analysis, mitigation, improvements.', keywords: ['respond', 'response plan', 'incident response'] },
      { id: 'nist-fc-rc',  code: 'RC', title: 'Recover',                                           severity: 'medium',   summary: 'Recovery planning, improvements, communications.', keywords: ['recover', 'recovery plan', 'business continuity', 'bcm'] },
      { id: 'nist-fc-gv',  code: 'GV', title: 'Govern (CSF 2.0)',                                  severity: 'high',     summary: 'Organisational context, risk-management strategy, roles, policies, oversight.', keywords: ['govern', 'governance', 'csf 2.0', 'risk strategy'] }
    ],
    'reg-certin-2024': [
      { id: 'certin-fc-6h',   code: '§4', title: 'Six-hour incident reporting',                    severity: 'critical', summary: 'Cyber incidents must be reported to CERT-In within six hours of noticing.', keywords: ['6 hours', 'six hours', 'cert-in', 'incident reporting', 'sahyog'] },
      { id: 'certin-fc-logs', code: '§5', title: 'Log retention (180 days, India)',                severity: 'high',     summary: 'ICT systems must retain logs for 180 days within Indian jurisdiction.', keywords: ['log retention', '180 days', 'india'] },
      { id: 'certin-fc-kyc',  code: '§7', title: 'KYC by VPN and data-centre providers',           severity: 'medium',   summary: 'VPN, VPS and data-centre providers must collect and retain KYC.', keywords: ['kyc', 'vpn provider', 'vps', 'data centre'] }
    ]
  };

  /* ====================================================================== */
  /*  Policy analyzer                                                       */
  /*  ---------------------------------------------------------------------- */
  /*  Heuristic checks over (a) the metadata the user filled in and         */
  /*  (b) the textual body of the uploaded file when available.             */
  /*  Returns a structured `findings[]` array, a severity summary, and a    */
  /*  projected drift delta keyed by regulation id so the upload modal can  */
  /*  preview the risk impact before the user clicks Save.                  */
  /* ====================================================================== */

  const REG_KEYWORDS = {
    'reg-gdpr':         ['article 32', 'encryption', 'data subject', 'retention', 'breach notification'],
    'reg-ai-act':       ['high-risk', 'conformity', 'annex iii', 'fundamental rights'],
    'reg-nis2':         ['incident', '24 hours', 'reporting obligation'],
    'reg-dora':         ['third-party', 'ict provider', 'concentration risk'],
    'reg-cra':          ['sbom', 'vulnerability disclosure', 'cyclonedx'],
    'reg-dsa':          ['transparency report', 'illegal content', 'trusted flagger'],
    'reg-eidas2':       ['wallet', 'qualified trust', 'electronic identification'],
    'reg-data-act':     ['data sharing', 'interoperability', 'switching'],
    'reg-nist-csf':     ['identify', 'protect', 'detect', 'respond', 'recover'],
    'reg-certin-2024':  ['6 hours', 'cert-in', 'incident reporting'],
    'reg-edpb-opn-4-2026': ['legitimate interest', 'lia']
  };

  function _decodeBase64Text(b64, mimeType) {
    if (!b64) return '';
    if (mimeType && /pdf/.test(mimeType)) return '';   // we can't text-extract PDF in-browser cheaply
    try {
      if (typeof atob === 'function') {
        const bin = atob(b64);
        if (typeof TextDecoder !== 'undefined') {
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          return new TextDecoder('utf-8').decode(bytes);
        }
        return bin;
      }
      if (typeof Buffer !== 'undefined') return Buffer.from(b64, 'base64').toString('utf8');
    } catch (_) { /* ignore */ }
    return '';
  }

  function analyzePolicy(meta, base64, mimeType) {
    meta = meta || {};
    const findings = [];
    const today = new Date();
    let fidSeed = 0;
    const fid = () => 'finding-' + (Date.now().toString(36)) + '-' + (++fidSeed);

    const push = (f) => {
      findings.push(Object.assign({
        id: fid(),
        category: 'governance',
        severity: 'low',
        regImpact: {}
      }, f));
    };

    /* ---------- metadata-only checks ---------- */
    if (!meta.description || String(meta.description).trim().length < 25) {
      push({
        category: 'metadata',
        severity: 'low',
        title: 'Policy lacks a meaningful description',
        detail: 'A short summary helps reviewers grasp scope at a glance.',
        recommendation: 'Add one or two sentences describing what this policy governs.'
      });
    }
    if (!meta.ownerId) {
      push({ category: 'governance', severity: 'medium',
        title: 'No policy owner assigned',
        detail: 'Without an owner, change requests will not have a clear recipient.',
        recommendation: 'Assign an owner accountable for keeping the policy current.' });
    }
    if (!meta.approverId) {
      push({ category: 'governance', severity: 'medium',
        title: 'No approver recorded',
        detail: 'Approver is required for evidencing sign-off during audits.',
        recommendation: 'Record the executive sponsor who approved this policy.' });
    }
    if (meta.status === 'draft') {
      push({ category: 'governance', severity: 'low',
        title: 'Policy is still in draft',
        detail: 'Draft policies do not satisfy control objectives for audit evidence.',
        recommendation: 'Move to "Published" once formally approved.' });
    }
    if (meta.nextReviewDate) {
      const nr = new Date(meta.nextReviewDate);
      if (!isNaN(nr.getTime())) {
        if (nr < today) {
          push({ category: 'governance', severity: 'high',
            title: 'Policy review is already overdue',
            detail: 'The "next review" date is in the past, so the policy is stale on day one.',
            recommendation: 'Schedule a review within the next 30 days.' });
        } else if ((nr - today) / 86400000 < 30) {
          push({ category: 'governance', severity: 'medium',
            title: 'Policy review is due within 30 days',
            detail: 'Reviews this close to expiry typically slip past their deadline.',
            recommendation: 'Either complete the review now or extend the cycle.' });
        }
      }
    }
    if (!Array.isArray(meta.mapsToRegulations) || meta.mapsToRegulations.length === 0) {
      push({ category: 'coverage', severity: 'high',
        title: 'Policy is not mapped to any regulation',
        detail: 'An unmapped policy will not be picked up by any compliance evidence chain.',
        recommendation: 'Map the policy to at least one regulation it satisfies.' });
    }
    if (!Array.isArray(meta.implementedByControls) || meta.implementedByControls.length === 0) {
      push({ category: 'coverage', severity: 'medium',
        title: 'No technical controls are linked to this policy',
        detail: 'Without linked controls, drift in this policy area cannot be measured.',
        recommendation: 'Link the controls that operationalise this policy.' });
    }

    /* ---------- duplicate-title check (against currently known policies) ---- */
    if (meta.title) {
      const tl = String(meta.title).trim().toLowerCase();
      const dupes = getAllPolicies().filter(p => p.title && p.title.toLowerCase() === tl);
      if (dupes.length > 0) {
        push({ category: 'governance', severity: 'medium',
          title: 'Title overlaps with an existing policy',
          detail: 'A policy named "' + dupes[0].title + '" already exists in the catalogue.',
          recommendation: 'Use a distinguishing name or version (e.g. v2) to avoid confusion.' });
      }
    }

    /* ---------- content-based checks (when we have readable text) ---------- */
    const text = (base64 && mimeType && !/pdf/.test(mimeType))
      ? _decodeBase64Text(base64, mimeType)
      : '';
    if (text) {
      const stripped  = text.replace(/<[^>]+>/g, ' ');
      const lower     = stripped.toLowerCase();
      const wordCount = stripped.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 0 && wordCount < 150) {
        push({ category: 'content', severity: 'medium',
          title: 'Policy body is unusually short (under 150 words)',
          detail: 'A ' + wordCount + '-word policy rarely covers obligations comprehensively.',
          recommendation: 'Expand sections that describe scope, responsibilities and controls.' });
      }
      (meta.mapsToRegulations || []).forEach(function (regId) {
        const expected = REG_KEYWORDS[regId] || [];
        if (!expected.length) return;
        const missing = expected.filter(function (kw) { return lower.indexOf(kw) === -1; });
        if (missing.length >= 2) {
          const reg  = indexes.regulations[regId];
          const name = reg ? reg.shortTitle : regId;
          push({ category: 'coverage', severity: 'high',
            title: 'Policy may not cover key ' + name + ' obligations',
            detail: 'No reference found for: ' + missing.slice(0, 3).join(', ') + '.',
            recommendation: 'Add explicit sections that address ' + missing.slice(0, 3).join(', ') + '.',
            regImpact: { [regId]: 8 } });
        }
      });
    } else if (base64 && mimeType && /pdf/.test(mimeType)) {
      push({ category: 'content', severity: 'low',
        title: 'PDF body could not be text-extracted in-browser',
        detail: 'Coverage analysis is limited to metadata for PDF uploads.',
        recommendation: 'Upload a Markdown or HTML copy alongside for deeper analysis.' });
    }

    /* ---------- per-regulation projected drift delta ---------- */
    const projectedDriftDelta = {};
    const regs = (meta.mapsToRegulations || []);
    findings.forEach(function (f) {
      if (f.regImpact && Object.keys(f.regImpact).length > 0) {
        Object.keys(f.regImpact).forEach(function (rid) {
          projectedDriftDelta[rid] = (projectedDriftDelta[rid] || 0) + f.regImpact[rid];
        });
      } else if (regs.length > 0 && (f.severity === 'high' || f.severity === 'critical')) {
        const per = f.severity === 'critical' ? 6 : 4;
        regs.forEach(function (rid) {
          projectedDriftDelta[rid] = (projectedDriftDelta[rid] || 0) + per;
        });
      }
    });

    const summary = {
      total:    findings.length,
      critical: findings.filter(function (f) { return f.severity === 'critical'; }).length,
      high:     findings.filter(function (f) { return f.severity === 'high';     }).length,
      medium:   findings.filter(function (f) { return f.severity === 'medium';   }).length,
      low:      findings.filter(function (f) { return f.severity === 'low';      }).length
    };
    summary.opensRisks = summary.critical + summary.high;
    summary.worstRegId =
      Object.keys(projectedDriftDelta).sort(function (a, b) {
        return projectedDriftDelta[b] - projectedDriftDelta[a];
      })[0] || null;

    return { findings: findings, summary: summary, projectedDriftDelta: projectedDriftDelta };
  }

  /* Apply analyzer findings: open risks against linked regulations and
     nudge linked-control drift so the risk-engine immediately reflects
     the new gap. Returns a summary of what changed so the UI can toast. */
  function applyPolicyFindings(policyId, analysis) {
    const policy = getPolicyById(policyId);
    const out = { openedRisks: [], driftBumped: {}, perRegulationDelta: {} };
    if (!policy || !analysis || !Array.isArray(analysis.findings)) return out;

    const linkedRegs   = (policy.mapsToRegulations    || []).slice();
    const linkedCtrls  = (policy.implementedByControls || []).slice();
    const fallbackReg  = linkedRegs[0] || 'reg-gdpr';
    const fallbackCtrl = linkedCtrls[0] || (controls[0] && controls[0].id) || null;

    analysis.findings.forEach(function (f) {
      if (f.severity !== 'high' && f.severity !== 'critical') return;
      const targetRegs = f.regImpact && Object.keys(f.regImpact).length > 0
        ? Object.keys(f.regImpact)
        : (linkedRegs.length ? linkedRegs : [fallbackReg]);
      targetRegs.forEach(function (regId) {
        const risk = {
          id:                'R-pol-' + Math.random().toString(36).slice(2, 8),
          regId:             regId,
          controlId:         fallbackCtrl,
          title:             f.title + ' (uploaded policy: ' + policy.title + ')',
          severity:          f.severity,
          businessUnitId:    'bu-cloud',
          ownerId:           policy.ownerId || (personas[0] && personas[0].id) || null,
          openSince:         new Date().toISOString().slice(0, 10),
          remediationDueDays: f.severity === 'critical' ? 7 : 21,
          sourcePolicyId:    policy.id,
          sourceFindingId:   f.id
        };
        risks.push(risk);
        indexes.risks[risk.id] = risk;
        out.openedRisks.push(risk);
        out.perRegulationDelta[regId] = (out.perRegulationDelta[regId] || 0) + 1;
      });
    });

    /* Nudge control drift on linked controls so coverage/control scores move. */
    const bump = Math.min(20, (analysis.summary.high || 0) * 2 + (analysis.summary.critical || 0) * 4);
    if (bump > 0) {
      linkedCtrls.forEach(function (cid) {
        const c = indexes.controls[cid];
        if (!c) return;
        c.drift = Math.min(60, (c.drift || 0) + bump);
        out.driftBumped[cid] = bump;
      });
    }

    return out;
  }

  /* ====================================================================== */
  /*  Compliance scanner                                                    */
  /*  ---------------------------------------------------------------------- */
  /*  Walks every framework the policy claims to satisfy and, for each      */
  /*  framework control, checks whether the policy's text actually covers   */
  /*  it. Returns a structured `byFramework[]` array used by:               */
  /*    - the upload-modal compliance-breakdown panel,                       */
  /*    - the per-policy "View gaps" modal,                                  */
  /*    - the Compliance Gaps table (Policy + Framework Control columns).   */
  /* ====================================================================== */

  function _buildScanCorpus(policy) {
    /* The corpus is a list of { sectionId, sectionRef, text } entries.     */
    const corpus = [];
    if (policy.title)       corpus.push({ sectionRef: 'Title',       text: String(policy.title) });
    if (policy.description) corpus.push({ sectionRef: 'Description', text: String(policy.description) });
    if (Array.isArray(policy.sections)) {
      policy.sections.forEach(function (s) {
        corpus.push({
          sectionId:  s.id,
          sectionRef: '\u00a7' + (s.num || '') + ' ' + (s.title || ''),
          text:       (s.title || '') + '. ' + (s.body || '')
        });
      });
    }
    if (Array.isArray(policy.tags) && policy.tags.length) {
      corpus.push({ sectionRef: 'Tags', text: policy.tags.join(' ') });
    }
    /* For user-uploaded text-format policies, decode the body too.          */
    if (policy.source === 'uploaded' && policy.hasFile && policy.format !== 'pdf') {
      const f = getPolicyFile(policy.id);
      if (f && f.base64) {
        const body = _decodeBase64Text(f.base64, f.mimeType);
        if (body) corpus.push({ sectionRef: 'Body', text: body });
      }
    }
    return corpus;
  }

  function scanPolicyCompliance(policy) {
    if (!policy) return { byFramework: [], summary: { totalControls: 0, compliantControls: 0, partialControls: 0, missingControls: 0, coveragePct: 0 }, evidenceItems: [] };

    const corpus = _buildScanCorpus(policy);
    const linkedRegs = Array.isArray(policy.mapsToRegulations) ? policy.mapsToRegulations : [];

    const byFramework = [];
    const evidenceItems = [];

    linkedRegs.forEach(function (regId) {
      const fcs = frameworkControls[regId];
      const reg = indexes.regulations[regId];
      if (!Array.isArray(fcs) || !fcs.length || !reg) return;

      const fwEntry = {
        regId:      regId,
        name:       reg.shortTitle,
        total:      fcs.length,
        compliant:  0,
        partial:    0,
        missing:    0,
        coveragePct: 0,
        controls:   []
      };

      fcs.forEach(function (fc) {
        const matchedKeywords    = [];
        const evidenceSectionIds = [];
        const evidenceRefs       = [];
        const evidenceSnippets   = [];

        fc.keywords.forEach(function (kw) {
          const kwLower = kw.toLowerCase();
          for (let i = 0; i < corpus.length; i++) {
            const c = corpus[i];
            if (!c.text) continue;
            if (c.text.toLowerCase().indexOf(kwLower) >= 0) {
              matchedKeywords.push(kw);
              if (c.sectionId && evidenceSectionIds.indexOf(c.sectionId) === -1) {
                evidenceSectionIds.push(c.sectionId);
                evidenceRefs.push(c.sectionRef);
                /* Pull a 140-char window around the first hit for the audit snippet. */
                const idx = c.text.toLowerCase().indexOf(kwLower);
                const from = Math.max(0, idx - 40);
                const to   = Math.min(c.text.length, idx + kwLower.length + 80);
                evidenceSnippets.push((from > 0 ? '\u2026' : '') + c.text.slice(from, to).replace(/\s+/g, ' ').trim() + (to < c.text.length ? '\u2026' : ''));
              } else if (!c.sectionId && evidenceRefs.indexOf(c.sectionRef) === -1) {
                evidenceRefs.push(c.sectionRef);
              }
              break;
            }
          }
        });

        let status;
        if (matchedKeywords.length === 0)      status = 'missing';
        else if (matchedKeywords.length === 1) status = 'partial';
        else                                    status = 'compliant';

        fwEntry[status]++;
        fwEntry.controls.push({
          id:                fc.id,
          code:              fc.code,
          title:             fc.title,
          summary:           fc.summary,
          severity:          fc.severity,
          status:            status,
          matchedKeywords:   matchedKeywords,
          evidenceSectionIds: evidenceSectionIds,
          evidenceRefs:      evidenceRefs,
          evidenceSnippets:  evidenceSnippets
        });

        /* Auto-evidence for compliant controls (audit trail). */
        if (status === 'compliant' && evidenceRefs.length > 0) {
          evidenceItems.push({
            policyId:          policy.id,
            regId:              regId,
            frameworkControlId: fc.id,
            frameworkControl:   fc.code + ' \u2014 ' + fc.title,
            policySectionRef:   evidenceRefs[0],
            policySectionId:    evidenceSectionIds[0] || null,
            snippet:            evidenceSnippets[0] || '',
            matchedKeywords:    matchedKeywords
          });
        }
      });

      fwEntry.coveragePct = fwEntry.total > 0
        ? Math.round(((fwEntry.compliant + fwEntry.partial * 0.5) / fwEntry.total) * 100)
        : 0;
      byFramework.push(fwEntry);
    });

    /* Aggregate. */
    let c = 0, p = 0, m = 0, t = 0;
    byFramework.forEach(function (bf) {
      c += bf.compliant; p += bf.partial; m += bf.missing; t += bf.total;
    });
    const summary = {
      totalControls:     t,
      compliantControls: c,
      partialControls:   p,
      missingControls:   m,
      coveragePct:       t > 0 ? Math.round(((c + p * 0.5) / t) * 100) : 0
    };
    /* The worst framework by missing-controls count surfaces in toasts/CTAs. */
    summary.worstFramework = byFramework.slice().sort(function (a, b) {
      return (b.missing + b.partial * 0.5) - (a.missing + a.partial * 0.5);
    })[0] || null;

    return { byFramework: byFramework, summary: summary, evidenceItems: evidenceItems };
  }

  /* Open Risks for every missing / partial framework control, and persist  */
  /* auto-evidence for every compliant one so the Evidence Vault is useful. */
  function applyComplianceGaps(policyId, scan) {
    const policy = getPolicyById(policyId);
    const out = { openedRisks: [], evidence: [], perFramework: {} };
    if (!policy || !scan || !Array.isArray(scan.byFramework)) return out;

    const fallbackCtrl = (policy.implementedByControls || [])[0] || (controls[0] && controls[0].id) || null;

    function downshiftSeverity(sev) {
      if (sev === 'critical') return 'high';
      if (sev === 'high')     return 'medium';
      if (sev === 'medium')   return 'low';
      return 'low';
    }

    scan.byFramework.forEach(function (fw) {
      out.perFramework[fw.regId] = { missing: fw.missing, partial: fw.partial, compliant: fw.compliant };

      fw.controls.forEach(function (fc) {
        if (fc.status === 'compliant') return;
        const sev = fc.status === 'missing' ? fc.severity : downshiftSeverity(fc.severity);
        const due = sev === 'critical' ? 7 : sev === 'high' ? 21 : 45;
        const risk = {
          id:                 'R-comp-' + Math.random().toString(36).slice(2, 8),
          regId:              fw.regId,
          controlId:          fallbackCtrl,
          frameworkControlId: fc.id,
          policyId:           policy.id,
          title:              (fc.status === 'missing' ? 'Missing coverage of ' : 'Partial coverage of ') + fc.code + ' \u2014 ' + fc.title,
          summary:            fc.summary,
          severity:           sev,
          businessUnitId:    'bu-cloud',
          ownerId:            policy.ownerId || (personas[0] && personas[0].id) || null,
          openSince:          new Date().toISOString().slice(0, 10),
          remediationDueDays: due,
          sourcePolicyId:     policy.id,
          sourceFindingId:    fc.id,
          gapType:            fc.status,                                  /* missing | partial */
          status:             'open'
        };
        risks.push(risk);
        indexes.risks[risk.id] = risk;
        out.openedRisks.push(risk);
      });
    });

    /* Auto-evidence: drop one entry per compliant control. */
    if (Array.isArray(scan.evidenceItems)) {
      scan.evidenceItems.forEach(function (e) {
        const ev = {
          id:                 'E-comp-' + Math.random().toString(36).slice(2, 8),
          name:               e.frameworkControl + ' \u2014 ' + policy.title,
          controlId:          fallbackCtrl,
          frameworkControlId: e.frameworkControlId,
          regId:              e.regId,
          policyId:           policy.id,
          policySectionId:    e.policySectionId,
          policySectionRef:   e.policySectionRef,
          snippet:            e.snippet,
          source:             'policy section',
          collectedAt:        new Date().toISOString().slice(0, 10),
          expiresInDays:      365,
          auto:               true
        };
        evidence.push(ev);
        indexes.evidence[ev.id] = ev;
        out.evidence.push(ev);
      });
    }

    /* Nudge linked-control drift so coverage/control-drift sub-scores move. */
    const bump = Math.min(20, scan.summary.missingControls * 3 + scan.summary.partialControls);
    if (bump > 0) {
      (policy.implementedByControls || []).forEach(function (cid) {
        const c2 = indexes.controls[cid];
        if (!c2) return;
        c2.drift = Math.min(60, (c2.drift || 0) + bump);
      });
    }

    return out;
  }

  /* ============================================================
     ============ Preventive-Action lifecycle API ===============
     ============================================================

     Status state machine (with side-channel `blocked`):

         planned ─► in-progress ─► review ─► done
                        │             ▲
                        └── blocked ──┘    (unblock returns to in-progress)

     The shape of a fully-fledged action lives at the top of this
     file (search "Each Preventive Action is a workflow object").

     What approval actually DOES is the interesting bit:
       1. closes the linked risk         (risk.status = 'closed')
       2. drops the linked-control drift (by expectedDriftReduction)
       3. writes an Evidence Vault row   (one per fulfilled requirement)
       4. logs a "live" activity event   (so it shows up in the feed)
       5. fires a toast at the UI layer

     The pure-data layer doesn't import the UI or the live engine;
     instead it exposes hooks (`__sideEffectHooks`) that the browser
     wires up on boot. This keeps the data layer Node-testable.
  -------------------------------------------------------------- */

  const SEVERITY_WEIGHT = { critical: 1.6, high: 1.3, medium: 1.0, low: 0.7 };
  const STATUS_ORDER    = { planned: 0, 'in-progress': 1, blocked: 1, review: 2, done: 3 };

  /* External listeners: app.js + live.js can subscribe. */
  const __sideEffectHooks = {
    onActionApproved: []   // (payload) => void
  };
  function onActionApproved(fn) {
    if (typeof fn === 'function') __sideEffectHooks.onActionApproved.push(fn);
  }
  function _fireApproved(payload) {
    __sideEffectHooks.onActionApproved.forEach(function (fn) {
      try { fn(payload); } catch (_) {}
    });
  }

  function _findAction(id) {
    for (let i = 0; i < actions.length; i++) if (actions[i].id === id) return actions[i];
    return null;
  }

  function _ensureHistory(a) {
    if (!Array.isArray(a.history)) a.history = [];
    return a.history;
  }
  function _logHistory(a, who, what) {
    _ensureHistory(a).push({
      at: new Date().toISOString().slice(0, 10),
      who: who || a.ownerId || 'system',
      what: what
    });
  }

  function actionProgress(action) {
    const a = (typeof action === 'string') ? _findAction(action) : action;
    if (!a) return { stepsDone: 0, stepsTotal: 0, evidenceDone: 0, evidenceTotal: 0, percent: 0, complete: false };
    const steps = a.steps || [];
    const reqs  = a.evidenceRequirements || [];
    const sDone = steps.filter(function (s) { return s.done; }).length;
    const eDone = reqs.filter(function (r) { return r.fulfilled; }).length;
    const total = steps.length + reqs.length;
    const done  = sDone + eDone;
    return {
      stepsDone: sDone,
      stepsTotal: steps.length,
      evidenceDone: eDone,
      evidenceTotal: reqs.length,
      percent: total === 0 ? 0 : Math.round((done / total) * 100),
      complete: total > 0 && done === total
    };
  }

  /* Rank open actions by expected impact × severity of the linked risk.
     Used by the "Next best action" hero on the Actions page. */
  function nextBestAction() {
    const open = actions.filter(function (a) {
      return a.status === 'planned' || a.status === 'in-progress' || a.status === 'blocked';
    });
    if (!open.length) return null;
    return open.slice().sort(function (a, b) {
      const ra = indexes.risks[a.riskId];
      const rb = indexes.risks[b.riskId];
      const wa = SEVERITY_WEIGHT[(ra && ra.severity) || 'medium'] || 1;
      const wb = SEVERITY_WEIGHT[(rb && rb.severity) || 'medium'] || 1;
      const sa = (a.expectedDriftReduction || 0) * wa;
      const sb = (b.expectedDriftReduction || 0) * wb;
      if (sb !== sa) return sb - sa;
      return (a.dueInDays || 999) - (b.dueInDays || 999);
    })[0];
  }

  function startAction(actionId, who) {
    const a = _findAction(actionId);
    if (!a) return { ok: false, error: 'Action not found' };
    if (a.status === 'done') return { ok: false, error: 'Action already done' };
    if (a.status === 'planned' || a.status === 'blocked') {
      a.status = 'in-progress';
      delete a.blockedReason;
      a.startedAt = a.startedAt || new Date().toISOString().slice(0, 10);
      _logHistory(a, who || a.ownerId, 'started the action');
    }
    return { ok: true, action: a };
  }

  function toggleActionStep(actionId, stepId, who) {
    const a = _findAction(actionId);
    if (!a) return { ok: false, error: 'Action not found' };
    if (a.status === 'done') return { ok: false, error: 'Cannot edit a completed action' };
    const step = (a.steps || []).find(function (s) { return s.id === stepId; });
    if (!step) return { ok: false, error: 'Step not found' };
    step.done = !step.done;
    if (step.done) {
      step.doneAt = new Date().toISOString().slice(0, 10);
      step.doneBy = who || a.ownerId;
      _logHistory(a, who || a.ownerId, 'completed step "' + step.label + '"');
      if (a.status === 'planned') {
        a.status = 'in-progress';
        a.startedAt = a.startedAt || new Date().toISOString().slice(0, 10);
        _logHistory(a, who || a.ownerId, 'started the action');
      }
    } else {
      delete step.doneAt; delete step.doneBy;
      _logHistory(a, who || a.ownerId, 're-opened step "' + step.label + '"');
    }
    return { ok: true, action: a, step: step };
  }

  /* Attach an artifact (or typed confirmation) against an evidence requirement.
     `payload` shape depends on `req.kind`:
       document       -> { fileName, fileSize, dataUrl? }
       policy-section -> { policyId, sectionId, sectionTitle }
       link           -> { url }
       confirmation   -> { text }
  */
  function attachActionEvidence(actionId, evReqId, payload, who) {
    const a = _findAction(actionId);
    if (!a) return { ok: false, error: 'Action not found' };
    if (a.status === 'done') return { ok: false, error: 'Cannot edit a completed action' };
    const req = (a.evidenceRequirements || []).find(function (r) { return r.id === evReqId; });
    if (!req) return { ok: false, error: 'Evidence requirement not found' };
    if (!payload || typeof payload !== 'object') return { ok: false, error: 'Missing payload' };

    if (req.kind === 'link') {
      if (!payload.url || !/^https?:\/\//i.test(payload.url)) return { ok: false, error: 'A http(s) URL is required' };
    } else if (req.kind === 'confirmation') {
      if (!payload.text || String(payload.text).trim().length < 3) return { ok: false, error: 'Type at least a few words to confirm' };
    } else if (req.kind === 'policy-section') {
      if (!payload.policyId) return { ok: false, error: 'Pick a policy section' };
    } else if (req.kind === 'document') {
      if (!payload.fileName) return { ok: false, error: 'Attach a file' };
    }

    req.fulfilled = true;
    req.fulfilledAt = new Date().toISOString().slice(0, 10);
    req.fulfilledBy = who || a.ownerId;
    req.payload = Object.assign({}, payload);
    _logHistory(a, who || a.ownerId, 'attached evidence for "' + req.label + '"');
    if (a.status === 'planned') {
      a.status = 'in-progress';
      a.startedAt = a.startedAt || new Date().toISOString().slice(0, 10);
      _logHistory(a, who || a.ownerId, 'started the action');
    }
    return { ok: true, action: a, req: req };
  }

  function markActionBlocked(actionId, reason, who) {
    const a = _findAction(actionId);
    if (!a) return { ok: false, error: 'Action not found' };
    if (a.status === 'done') return { ok: false, error: 'Action already done' };
    if (!reason || String(reason).trim().length < 3) return { ok: false, error: 'Tell us why this is blocked' };
    a.status = 'blocked';
    a.blockedReason = String(reason).trim();
    _logHistory(a, who || a.ownerId, 'marked the action blocked: ' + a.blockedReason);
    return { ok: true, action: a };
  }

  function unblockAction(actionId, who) {
    const a = _findAction(actionId);
    if (!a) return { ok: false, error: 'Action not found' };
    if (a.status !== 'blocked') return { ok: false, error: 'Action is not blocked' };
    a.status = 'in-progress';
    delete a.blockedReason;
    _logHistory(a, who || a.ownerId, 'un-blocked the action');
    return { ok: true, action: a };
  }

  function submitActionForReview(actionId, who) {
    const a = _findAction(actionId);
    if (!a) return { ok: false, error: 'Action not found' };
    if (a.status === 'done')   return { ok: false, error: 'Action already done' };
    if (a.status === 'review') return { ok: false, error: 'Action already in review' };
    const prog = actionProgress(a);
    if (!prog.complete) {
      return {
        ok: false,
        error: 'Finish ' + (prog.stepsTotal - prog.stepsDone) + ' step(s) and ' +
               (prog.evidenceTotal - prog.evidenceDone) + ' evidence requirement(s) before submitting'
      };
    }
    a.status = 'review';
    a.submittedAt = new Date().toISOString().slice(0, 10);
    _logHistory(a, who || a.ownerId, 'submitted the action for ' + (indexes.personas[a.approverId] ? indexes.personas[a.approverId].name : 'approval'));
    return { ok: true, action: a };
  }

  /* The big one: approve closes the risk + applies all side-effects. */
  function approveAction(actionId, who) {
    const a = _findAction(actionId);
    if (!a) return { ok: false, error: 'Action not found' };
    if (a.status === 'done')   return { ok: false, error: 'Action already done' };
    if (a.status !== 'review') return { ok: false, error: 'Only actions in review can be approved' };

    a.status = 'done';
    a.completedAt = new Date().toISOString().slice(0, 10);
    a.approvedAt  = a.completedAt;
    _logHistory(a, who || a.approverId || 'approver', 'approved the action');

    /* --- side-effect 1: close the risk ----------------------------- */
    const risk = indexes.risks[a.riskId];
    if (risk) {
      risk.status     = 'closed';
      risk.closedAt   = a.completedAt;
      risk.closedById = a.id;
    }

    /* --- side-effect 2: drop the linked-control drift -------------- */
    const drop = a.expectedDriftReduction || 0;
    let control = null;
    if (risk && risk.controlId) {
      control = indexes.controls[risk.controlId];
      if (control) {
        control.drift    = Math.max(0, (control.drift || 0) - drop);
        control.maturity = Math.min(100, (control.maturity || 0) + Math.round(drop / 2));
      }
    }

    /* --- side-effect 3: write Evidence Vault row(s) ---------------- */
    const writtenEvidence = [];
    const today = new Date().toISOString().slice(0, 10);
    (a.evidenceRequirements || []).forEach(function (req, idx) {
      if (!req.fulfilled) return;
      const evId = 'EV-A-' + a.id.replace(/^A-/, '') + '-' + (idx + 1);
      const row = {
        id: evId,
        controlId: (risk && risk.controlId) || null,
        name: req.label,
        collectedAt: today,
        expiresInDays: 365,
        source: 'Preventive Action ' + a.id,
        actionId: a.id,
        policyId: (req.payload && req.payload.policyId) || null,
        url: (req.payload && req.payload.url) || ((req.payload && req.payload.dataUrl) || null),
        note: (req.payload && req.payload.text) || (req.payload && req.payload.fileName) || (req.payload && req.payload.sectionTitle) || null,
        autoDerived: false
      };
      evidence.push(row);
      indexes.evidence[evId] = row;
      writtenEvidence.push(row);
    });

    /* --- side-effect 4: notify hook subscribers (live feed, toasts) */
    const payload = {
      action:   a,
      risk:     risk || null,
      control:  control || null,
      evidence: writtenEvidence,
      driftDropped: drop
    };
    _fireApproved(payload);

    return Object.assign({ ok: true }, payload);
  }

  /* Bulk-create one action per open risk that lacks one.
     Used by the "Generate preventive actions" button on Compliance Gaps. */
  function generateActionsFromRisks(riskIds) {
    const ids = Array.isArray(riskIds) && riskIds.length ? riskIds : risks.map(function (r) { return r.id; });
    const existing = {};
    actions.forEach(function (a) { existing[a.riskId] = true; });

    const created = [];
    ids.forEach(function (rid) {
      if (existing[rid]) return;
      const r = indexes.risks[rid];
      if (!r) return;
      if (r.status === 'closed') return;

      const reg = indexes.regulations[r.regId];
      const fc  = r.frameworkControlId ? (function () {
        const all = Object.keys(frameworkControls);
        for (let i = 0; i < all.length; i++) {
          const arr = frameworkControls[all[i]];
          for (let j = 0; j < arr.length; j++) if (arr[j].id === r.frameworkControlId) return arr[j];
        }
        return null;
      })() : null;

      const sevToDrift = { critical: 16, high: 11, medium: 7, low: 4 };
      const drift = sevToDrift[r.severity] || 7;
      const newId = 'A-' + (3000 + created.length + actions.length);

      const action = {
        id: newId,
        riskId: rid,
        title: 'Close: ' + r.title,
        ownerId: r.ownerId,
        approverId: 'aarav',
        dueInDays: r.remediationDueDays > 0 ? r.remediationDueDays : 14,
        status: 'planned',
        effort: r.severity === 'critical' ? 'L' : (r.severity === 'high' ? 'M' : 'S'),
        expectedDriftReduction: drift,
        summary: 'Generated from compliance gap' + (reg ? ' on ' + reg.title : '') + (fc ? ' (' + fc.code + ' — ' + fc.title + ')' : '') + '.',
        steps: [
          { id: 's1', label: 'Scope the gap and identify the owning team',                                                  done: false },
          { id: 's2', label: fc ? ('Draft policy text covering "' + fc.title + '"') : 'Draft policy text covering this gap', done: false },
          { id: 's3', label: 'Implement the operational control change',                                                     done: false },
          { id: 's4', label: 'Capture evidence and walk it through ' + (indexes.personas['aarav'] ? indexes.personas['aarav'].name : 'the approver'), done: false }
        ],
        evidenceRequirements: [
          { id: 'e1', kind: 'document',       label: 'Upload the artefact that proves the gap is closed', fulfilled: false },
          { id: 'e2', kind: 'policy-section', label: fc ? ('Link the policy section that covers ' + fc.code) : 'Link the policy section that covers this gap', fulfilled: false }
        ],
        history: [{ at: new Date().toISOString().slice(0, 10), who: 'system', what: 'auto-generated from compliance gap ' + rid }]
      };
      actions.push(action);
      indexes.actions[newId] = action;
      existing[rid] = true;
      created.push(action);
    });

    return { ok: true, created: created };
  }

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
    driftHistoryByReg, indexes,
    /* ---------- Internal Policies (seeded + user-uploaded) ---------- */
    seededPolicies: seededPolicies,
    get userPolicies()     { return userPolicies; },
    get controlPolicyMap() { return controlPolicyMap; },
    getAllPolicies:        getAllPolicies,
    getPolicyById:         getPolicyById,
    addUserPolicy:         addUserPolicy,
    deleteUserPolicy:      deleteUserPolicy,
    getPolicyFile:         getPolicyFile,
    linkControlToPolicy:   linkControlToPolicy,
    getPolicyForControl:   getPolicyForControl,
    analyzePolicy:         analyzePolicy,
    applyPolicyFindings:   applyPolicyFindings,
    /* ---------- Server-hosted (Vercel Blob) policies ---------- */
    getServerPolicies:     getServerPolicies,
    refreshServerPolicies: refreshServerPolicies,
    addServerPolicy:       addServerPolicy,
    deleteServerPolicy:    deleteServerPolicy,
    /* ---------- Framework controls + compliance scanner ---------- */
    frameworkControls:     frameworkControls,
    getFrameworkControlsForReg: function (regId) { return (frameworkControls[regId] || []).slice(); },
    getFrameworkControlById:    function (fcId) {
      const keys = Object.keys(frameworkControls);
      for (let i = 0; i < keys.length; i++) {
        const arr = frameworkControls[keys[i]];
        for (let j = 0; j < arr.length; j++) if (arr[j].id === fcId) return Object.assign({ regId: keys[i] }, arr[j]);
      }
      return null;
    },
    allFrameworkControls:  function () {
      const out = [];
      Object.keys(frameworkControls).forEach(function (regId) {
        frameworkControls[regId].forEach(function (fc) { out.push(Object.assign({ regId: regId }, fc)); });
      });
      return out;
    },
    scanPolicyCompliance:  scanPolicyCompliance,
    applyComplianceGaps:   applyComplianceGaps,
    /* ---------- Preventive-Action lifecycle ---------- */
    actionProgress:          actionProgress,
    nextBestAction:          nextBestAction,
    startAction:             startAction,
    toggleActionStep:        toggleActionStep,
    attachActionEvidence:    attachActionEvidence,
    markActionBlocked:       markActionBlocked,
    unblockAction:           unblockAction,
    submitActionForReview:   submitActionForReview,
    approveAction:           approveAction,
    generateActionsFromRisks: generateActionsFromRisks,
    onActionApproved:        onActionApproved,
    MAX_POLICY_FILE_BYTES: MAX_FILE_BYTES
  };
})();
