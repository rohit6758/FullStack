const express = require('express');
const router = express.Router();
const dns = require('dns').promises;

// Clean domain input helper
function sanitizeDomain(input) {
  if (!input) return 'sms-frontend.vercel.app';
  let clean = input.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//i, '');
  clean = clean.replace(/\/.*$/, '');
  clean = clean.replace(/:\d+$/, '');
  return clean;
}

// POST /api/dns/lookup - Perform live DNS lookups for domain
router.post('/lookup', async (req, res) => {
  const domain = sanitizeDomain(req.body.domain);
  const startTime = Date.now();

  const results = {
    domain,
    queryTimeMs: 0,
    records: {
      a: [],
      cname: [],
      txt: [],
      mx: [],
    },
    error: null,
  };

  try {
    // 1. Resolve A records (IPv4)
    try {
      results.records.a = await dns.resolve4(domain);
    } catch (e) {
      // If direct A fails, try dns.lookup (system resolver)
      try {
        const lookup = await dns.lookup(domain);
        if (lookup && lookup.address) {
          results.records.a = [lookup.address];
        }
      } catch (err) {
        results.records.a = [];
      }
    }

    // 2. Resolve CNAME records
    try {
      results.records.cname = await dns.resolveCname(domain);
    } catch (e) {
      results.records.cname = [];
    }

    // 3. Resolve TXT records
    try {
      const txtRecords = await dns.resolveTxt(domain);
      results.records.txt = txtRecords.map((t) => (Array.isArray(t) ? t.join(' ') : t));
    } catch (e) {
      results.records.txt = [];
    }

    // 4. Resolve MX records
    try {
      results.records.mx = await dns.resolveMx(domain);
    } catch (e) {
      results.records.mx = [];
    }

    results.queryTimeMs = Date.now() - startTime;

    if (results.records.a.length === 0 && results.records.cname.length === 0) {
      results.error = 'No A or CNAME records found for this domain.';
    }

    return res.status(200).json({ success: true, ...results });
  } catch (error) {
    results.queryTimeMs = Date.now() - startTime;
    return res.status(400).json({
      success: false,
      domain,
      queryTimeMs: results.queryTimeMs,
      error: error.message || 'DNS Resolution failed',
    });
  }
});

// POST /api/dns/trace - Simulate and return hierarchical DNS trace steps
router.post('/trace', async (req, res) => {
  const domain = sanitizeDomain(req.body.domain);
  const parts = domain.split('.');
  const tld = parts.length > 1 ? parts[parts.length - 1] : 'com';
  const sld = parts.length > 2 ? parts[parts.length - 2] : parts[0];
  const subdomain = parts.length > 2 ? parts.slice(0, parts.length - 2).join('.') : '@';

  // Live query to get actual resolved IP
  let resolvedIp = '76.76.21.21';
  let resolvedCname = null;
  try {
    const a = await dns.resolve4(domain);
    if (a && a.length > 0) resolvedIp = a[0];
  } catch (e) {
    try {
      const c = await dns.resolveCname(domain);
      if (c && c.length > 0) resolvedCname = c[0];
    } catch (err) {}
  }

  // Determine authoritative nameserver based on provider
  let authServer = 'ns1.generic-dns.com';
  if (domain.includes('vercel.app')) authServer = 'ns1.vercel-dns.com';
  else if (domain.includes('render.com')) authServer = 'dns1.p01.nsone.net (Render DNS)';
  else if (domain.includes('mongodb.com')) authServer = 'ns-cloud-e1.googledomains.com';
  else if (domain.includes('google.com')) authServer = 'ns1.google.com';

  const traceSteps = [
    {
      step: 1,
      name: 'Client Browser & OS Cache',
      queriedEntity: 'Local Resolver / hosts file',
      status: 'Cache Miss',
      description: `Browser inspects internal memory cache and OS resolver cache for "${domain}". Record not found locally.`,
      latencyMs: 1,
    },
    {
      step: 2,
      name: 'Recursive DNS Resolver',
      queriedEntity: '8.8.8.8 (Google Public DNS) / ISP Gateway',
      status: 'Query Dispatched',
      description: 'The recursive resolver assumes ownership of the request and initiates the iterative DNS lookup chain.',
      latencyMs: 12,
    },
    {
      step: 3,
      name: 'Root Nameserver (.)',
      queriedEntity: 'a.root-servers.net (198.41.0.4)',
      status: 'Referral',
      description: `Root zone server does not store "${domain}". It refers the resolver to the responsible Top-Level Domain (TLD) server for ".${tld}".`,
      latencyMs: 24,
    },
    {
      step: 4,
      name: `TLD Nameserver (.${tld})`,
      queriedEntity: `ns1.nic.${tld} (TLD Registry)`,
      status: 'Referral',
      description: `The .${tld} registry server examines "${sld}.${tld}" and delegates query to the Authoritative Nameserver (${authServer}).`,
      latencyMs: 38,
    },
    {
      step: 5,
      name: 'Authoritative Nameserver',
      queriedEntity: authServer,
      status: 'Authoritative Answer (AA)',
      description: `The authoritative server inspects its zone file for "${domain}" and provides the final resource record.`,
      record: resolvedCname ? `CNAME ${resolvedCname}` : `A ${resolvedIp}`,
      latencyMs: 45,
    },
    {
      step: 6,
      name: 'HTTP / TLS Connection Phase',
      queriedEntity: `${resolvedIp}:443 (HTTPS)`,
      status: 'Connected',
      description: `Browser establishes TCP 3-way handshake with ${resolvedIp} on Port 443, completes TLS 1.3 handshake, and requests web files.`,
      latencyMs: 18,
    },
  ];

  res.status(200).json({
    success: true,
    domain,
    anatomy: {
      protocol: 'https://',
      subdomain,
      secondLevelDomain: sld,
      topLevelDomain: tld,
      fullDomain: domain,
    },
    resolvedIp,
    resolvedCname,
    steps: traceSteps,
    totalLatencyMs: traceSteps.reduce((acc, s) => acc + s.latencyMs, 0),
  });
});

// GET /api/dns/hosting-info - Returns hosting & cloud architecture context
router.get('/hosting-info', (req, res) => {
  const hostingData = {
    server: {
      runtime: `Node.js ${process.version}`,
      platform: `${process.platform} (${process.arch})`,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      environment: process.env.NODE_ENV || 'development',
    },
    tiers: [
      {
        tier: 'Frontend Web Hosting',
        platform: 'Vercel',
        role: 'Static & Edge SPA Hosting',
        keyFeatures: [
          'Global Anycast Content Delivery Network (CDN)',
          'Instant client-side routing fallback via vercel.json rewrites',
          'Automated SSL/TLS certificate issuing & termination',
          'Atomic deployments and Git-triggered build pipeline',
        ],
        exampleDomain: 'sms-frontend.vercel.app',
      },
      {
        tier: 'Backend API Hosting',
        platform: 'Render',
        role: 'Platform-as-a-Service (PaaS) Web Service',
        keyFeatures: [
          'Continuous Linux container execution for Node/Express processes',
          'Dynamic $PORT binding with automatic reverse proxy routing',
          'Persistent TCP connections to database clusters',
          'Zero-downtime rolling deploys with automated health checks',
        ],
        exampleDomain: 'sms-backend.onrender.com',
      },
      {
        tier: 'Cloud Database',
        platform: 'MongoDB Atlas',
        role: 'Database-as-a-Service (DBaaS)',
        keyFeatures: [
          'Managed document store with 3-node replica set high availability',
          'TLS encrypted data-in-transit & disk encryption-at-rest',
          'DNS Seedlist connection strings (mongodb+srv://...)',
          'IP Whitelisting & role-based database authentication',
        ],
        exampleDomain: 'cluster0.abcde.mongodb.net',
      },
    ],
  };

  res.status(200).json({ success: true, ...hostingData });
});

module.exports = router;
