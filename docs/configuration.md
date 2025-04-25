# Sparrow Bot Configuration

Sparrow Bot can be configured using a JSON file in your repository. By default, it looks for a file at `.github/sparrow-bot.json`.

## Configuration Schema

The configuration file has the following structure:

```json
{
  "stale": {
    "daysBeforeStale": 60,
    "daysBeforeClose": 7,
    "exemptLabels": ["pinned", "security", "bug"],
    "staleLabel": "stale",
    "staleMessage": "...",
    "closeMessage": "..."
  },
  "prTitle": {
    "types": ["feat", "fix", "docs", "style", "refactor", "test", "chore"],
    "scopes": ["core", "api", "ui", "docs", "deps"],
    "patterns": ["^(feat|fix|docs|style|refactor|test|chore)(\\(\\w+\\))?!?: .+$"]
  },
  "labels": {
    "categories": {
      "type": ["feature", "bug", "enhancement", "documentation", "maintenance"],
      "priority": ["critical", "high", "medium", "low"],
      "status": ["in-progress", "review-needed", "blocked", "completed"]
    },
    "autoLabeling": {
      "rules": [
        {
          "pattern": "\\bfix(es|ed)?\\b|\\bbug\\b",
          "labels": ["bug"]
        },
        {
          "pattern": "\\bdoc(s|umentation)?\\b",
          "labels": ["documentation"]
        }
      ]
    }
  }
}
```

## Stale Configuration

The `stale` section configures how the bot handles stale issues and pull requests.

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `daysBeforeStale` | number | Number of days of inactivity before an issue/PR is marked as stale | 60 |
| `daysBeforeClose` | number | Number of days of inactivity after being marked as stale before an issue/PR is closed | 7 |
| `exemptLabels` | string[] | Labels that exempt an issue/PR from being marked as stale | ["pinned", "security", "bug"] |
| `staleLabel` | string | Label to apply when an issue/PR is marked as stale | "stale" |
| `staleMessage` | string | Message to post when an issue/PR is marked as stale | *See default config* |
| `closeMessage` | string | Message to post when an issue/PR is closed due to inactivity | *See default config* |

## PR Title Configuration

The `prTitle` section configures how the bot validates pull request titles.

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `types` | string[] | Allowed types for PR titles | ["feat", "fix", "docs", "style", "refactor", "test", "chore", "build", "ci", "revert"] |
| `scopes` | string[] | Allowed scopes for PR titles | ["core", "api", "ui", "docs", "deps"] |
| `patterns` | string[] | Regular expression patterns to validate PR titles | ["^(feat\|fix\|docs\|style\|refactor\|test\|chore)(\\(\\w+\\))?!?: .+$"] |

## Label Configuration

The `labels` section configures how the bot manages labels.

### Categories

The `categories` section defines the categories of labels and the labels within each category.

Each category is a key-value pair where the key is the category name and the value is an array of label names.

For example:

```json
"categories": {
  "type": ["feature", "bug", "enhancement", "documentation", "maintenance"],
  "priority": ["critical", "high", "medium", "low"]
}
```

This will create the following labels:
- feature
- bug
- enhancement
- documentation
- maintenance
- priority: critical
- priority: high
- priority: medium
- priority: low

### Auto-Labeling

The `autoLabeling` section defines rules for automatically applying labels to issues and pull requests based on their content.

Each rule has a `pattern` (a regular expression) and a list of `labels` to apply if the pattern matches.

For example:

```json
"autoLabeling": {
  "rules": [
    {
      "pattern": "\\bfix(es|ed)?\\b|\\bbug\\b",
      "labels": ["bug"]
    },
    {
      "pattern": "\\bdoc(s|umentation)?\\b",
      "labels": ["documentation"]
    }
  ]
}
```

This will:
- Apply the "bug" label if the content contains "fix", "fixes", "fixed", or "bug"
- Apply the "documentation" label if the content contains "doc", "docs", or "documentation"

## Environment Variables

In addition to the configuration file, Sparrow Bot can be configured using environment variables:

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub token for API access |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) |
| `CONFIG_PATH` | Path to the configuration file |
