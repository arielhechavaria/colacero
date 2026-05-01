/** @type {import('@lhci/cli').LHCIConfig} */
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3001/el-fogon'],
      numberOfRuns: 3,
      settings: {
        throttlingMethod: 'simulate',
        emulatedFormFactor: 'mobile',
        // Simula red 3G lenta
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
      },
    },
    assert: {
      assertions: {
        // TTI < 3s en móvil 3G — warn (no fail) para primer pass
        'interactive':              ['warn', { maxNumericValue: 3000 }],
        'first-contentful-paint':   ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift':  ['warn', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
