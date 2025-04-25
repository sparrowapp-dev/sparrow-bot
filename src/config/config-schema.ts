export const configSchema = {
  type: 'object',
  required: ['stale', 'prTitle', 'labels'],
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
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
