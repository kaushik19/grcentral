<script setup lang="ts">
import { useDataStore } from '@/stores/data'
const data = useDataStore()
</script>

<template>
  <div class="space-y-6 fade-up">
    <div>
      <h1 class="text-xl font-extrabold">Regulatory Sources</h1>
      <p class="text-xs text-white/40 mt-1">11 real regulatory feeds polled by the /api/radar Vercel function</p>
    </div>
    <div class="gr-card p-5">
      <div class="text-xs text-white/50 mb-4">
        These are the actual public data sources that the <span class="font-mono text-babcom-300">/api/radar</span> Vercel serverless
        function polls in production. EUR-Lex and EDPB are polled via RSS. NIST is polled via the CSRC REST API.
        CISA is polled via their advisories RSS feed. Results are cached for 1 hour at the Vercel edge.
      </div>
      <table class="gr-table">
        <thead><tr><th>Source</th><th>Jurisdiction</th><th>Method</th><th>URL</th></tr></thead>
        <tbody>
          <tr v-for="s in [
            { name:'EUR-Lex', j:'EU', m:'SPARQL + RSS', url:'https://eur-lex.europa.eu/' },
            { name:'EDPB', j:'EU', m:'RSS + scrape', url:'https://www.edpb.europa.eu/' },
            { name:'EC Digital Strategy', j:'EU', m:'RSS + scrape', url:'https://digital-strategy.ec.europa.eu/' },
            { name:'ENISA', j:'EU', m:'RSS + PDF', url:'https://www.enisa.europa.eu/' },
            { name:'NIST CSRC', j:'US', m:'REST API', url:'https://csrc.nist.gov/' },
            { name:'CISA', j:'US', m:'RSS feed', url:'https://www.cisa.gov/' },
            { name:'CERT-In', j:'IN', m:'HTML scrape', url:'https://www.cert-in.org.in/' },
            { name:'UK ICO', j:'UK', m:'RSS', url:'https://ico.org.uk/' },
            { name:'OWASP', j:'Global', m:'GitHub poll', url:'https://owasp.org/' },
            { name:'CIS Benchmarks', j:'Global', m:'Versioned HTTP', url:'https://www.cisecurity.org/' },
            { name:'GDPR.eu', j:'EU', m:'HTML scrape', url:'https://gdpr.eu/' },
          ]" :key="s.name">
            <td><div class="font-semibold text-xs">{{ s.name }}</div></td>
            <td><span class="chip text-[10px]">{{ s.j }}</span></td>
            <td><span class="text-[10px] text-white/50">{{ s.m }}</span></td>
            <td><a :href="s.url" target="_blank" rel="noopener noreferrer" class="text-[10px] text-babcom-400 hover:underline truncate block max-w-[200px]">{{ s.url }}</a></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="gr-card p-5">
      <div class="text-[10px] uppercase tracking-widest text-white/40 mb-3">Tracked Frameworks</div>
      <div class="space-y-3">
        <div v-for="fw in data.frameworks" :key="fw.id" class="flex items-start justify-between gap-4">
          <div>
            <div class="font-semibold text-sm">{{ fw.title }}</div>
            <div class="text-[10px] text-white/40 mt-0.5">{{ fw.jurisdiction }} · {{ fw.controls.length }} controls · In force: {{ fw.effectiveDate }}</div>
          </div>
          <a :href="fw.sourceUrl" target="_blank" rel="noopener noreferrer" class="btn btn-ghost text-[10px] px-2 py-1 shrink-0">Source ↗</a>
        </div>
      </div>
    </div>
  </div>
</template>
