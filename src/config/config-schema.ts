export const configSchema = {
  type: 'object',
  required: ['stale', 'prTitle', 'labels', 'codeReview'],
  properties: {
    stale: {
      type: 'object',
      required: ['daysBeforeStale', 'daysBeforeClose', 'exemptLabels', 'staleLabel'],
      properties: {
        daysBeforeStale: { type: 'number', minimum: 1 },
        daysBeforeClose: { type: 'number', minimum: 1 },
        exemptLabels: {
          type: 'array',
          items: { type: 'string' }
        },
        staleLabel: { type: 'string' },
        staleMessage: { type: 'string' },
        closeMessage: { type: 'string' },
      },
    },
    prTitle: {
      type: 'object',
      required: ['types', 'patterns'],
      properties: {
        types: {
          type: 'array',
          items: { type: 'string' }
        },
        scopes: {
          type: 'array',
          items: { type: 'string' }
        },
        patterns: {
          type: 'array',
          items: { type: 'string' }
        },
      },
    },
    labels: {
      type: 'object',
      required: ['categories', 'autoLabeling'],
      properties: {
        categories: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        autoLabeling: {
          type: 'object',
          required: ['rules'],
          properties: {
            rules: {
              type: 'array',
              items: {
                type: 'object',
                required: ['pattern', 'labels'],
                properties: {
                  pattern: { type: 'string' },
                  labels: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  scope: {
                    type: 'string',
                    enum: ['title', 'body', 'both']
                  },
                  priority: { type: 'number' },
                  conditions: {
                    type: 'object',
                    properties: {
                      filePatterns: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      sizeThresholds: {
                        type: 'object',
                        properties: {
                          small: { type: 'number' },
                          medium: { type: 'number' },
                          large: { type: 'number' }
                        }
                      },
                      userTypes: {
                        type: 'object',
                        properties: {
                          firstTimeContributor: { type: 'boolean' },
                          maintainer: { type: 'boolean' }
                        }
                      },
                      excludeLabels: {
                        type: 'array',
                        items: { type: 'string' }
                      }
                    }
                  }
                }
              }
            },
            fileBased: {
              type: 'object',
              properties: {
                rules: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['filePatterns', 'labels'],
                    properties: {
                      filePatterns: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      labels: {
                        type: 'array',
                        items: { type: 'string' }
                      }
                    }
                  }
                }
              }
            },
            sizeBased: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                thresholds: {
                  type: 'object',
                  properties: {
                    small: { type: 'number' },
                    medium: { type: 'number' },
                    large: { type: 'number' }
                  }
                },
                labels: {
                  type: 'object',
                  properties: {
                    small: { type: 'string' },
                    medium: { type: 'string' },
                    large: { type: 'string' },
                    extraLarge: { type: 'string' }
                  }
                }
              }
            },
            contributorBased: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                labels: {
                  type: 'object',
                  properties: {
                    firstTimeContributor: { type: 'string' },
                    maintainer: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    codeReview: {
      type: 'object',
      required: ['skipReviewLabel'],
      properties: {
        skipReviewLabel: { type: 'string' },
        excludePatterns: {
          type: 'array',
          items: { type: 'string' }
        },
        includePatterns: {
          type: 'array',
          items: { type: 'string' }
        },
        maxFileSize: { type: 'number' },
        maxContentSize: { type: 'number' },
        confidenceThreshold: { type: 'number' },
        maxComments: { type: 'number' },
        batchSize: { type: 'number' },
        model: { type: 'string' },
        maxTokens: { type: 'number' },
        customInstructions: { type: 'string' },
        createReview: { type: 'boolean' },
        reviewHeader: { type: 'string' },
        showConfidence: { type: 'boolean' },
        addDisclaimer: { type: 'boolean' },
        includeOverallFeedback: { type: 'boolean' },
        useAzure: { type: 'boolean' }
      }
    }
  }
};
