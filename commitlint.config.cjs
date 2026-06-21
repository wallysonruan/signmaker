module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Scopes map to workspace package names for traceability.
    'scope-enum': [
      2,
      'always',
      [
        'fsw',
        'layout',
        'editor',
        'renderer',
        'interactions',
        'vue',
        'app',
        'ci',
        'release',
        'deps',
      ],
    ],
  },
};
