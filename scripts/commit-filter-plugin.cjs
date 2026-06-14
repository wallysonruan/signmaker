'use strict';

/**
 * Semantic-release plugin that delegates to the standard commit-analyzer and
 * release-notes-generator after filtering context.commits to only those whose
 * conventional-commit scope matches the package being released.
 *
 * Usage in .releaserc.json:
 *   ["../../scripts/commit-filter-plugin.cjs", { "scope": "vue", ...analyzerOpts }]
 *
 * The "scope" key is consumed here and stripped before forwarding to the
 * upstream plugins so their option shapes remain unchanged.
 */

const { analyzeCommits: upstreamAnalyze } = require('@semantic-release/commit-analyzer');
const { generateNotes: upstreamNotes } = require('@semantic-release/release-notes-generator');

/**
 * Returns only commits whose scope matches the given package scope.
 * Handles both plain scopes ("vue") and hyphenated ones ("web-components").
 */
function filterCommits(commits, scope) {
  if (!scope) {
    return commits;
  }
  const pattern = new RegExp(`^[a-z]+\\(${scope}\\)[:!]`, 'i');
  return commits.filter((commit) => pattern.test(commit.message));
}

function withFilteredCommits(context, scope) {
  return { ...context, commits: filterCommits(context.commits, scope) };
}

module.exports = {
  async analyzeCommits(pluginConfig, context) {
    const { scope, ...config } = pluginConfig;
    return upstreamAnalyze(config, withFilteredCommits(context, scope));
  },

  async generateNotes(pluginConfig, context) {
    const { scope, ...config } = pluginConfig;
    return upstreamNotes(config, withFilteredCommits(context, scope));
  },
};
