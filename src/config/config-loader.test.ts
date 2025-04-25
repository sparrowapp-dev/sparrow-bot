import { loadConfig } from './config-loader';
import Ajv from 'ajv';

// Mock the Ajv validator
jest.mock('ajv');

describe('Config Loader', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock Ajv implementation
    (Ajv as jest.Mock).mockImplementation(() => ({
      compile: jest.fn().mockReturnValue(() => true),
    }));
  });

  it('should load the default configuration', async () => {
    const config = await loadConfig();
    
    // Check that the config has the expected structure
    expect(config).toHaveProperty('stale');
    expect(config).toHaveProperty('prTitle');
    expect(config).toHaveProperty('labels');
    
    // Check stale config
    expect(config.stale).toHaveProperty('daysBeforeStale', 60);
    expect(config.stale).toHaveProperty('daysBeforeClose', 7);
    expect(config.stale).toHaveProperty('exemptLabels');
    expect(config.stale).toHaveProperty('staleLabel', 'stale');
    
    // Check PR title config
    expect(config.prTitle).toHaveProperty('types');
    expect(config.prTitle).toHaveProperty('patterns');
    
    // Check labels config
    expect(config.labels).toHaveProperty('categories');
    expect(config.labels).toHaveProperty('autoLabeling');
    expect(config.labels.autoLabeling).toHaveProperty('rules');
  });

  it('should throw an error if the configuration is invalid', async () => {
    // Mock the validator to return false (invalid config)
    const mockValidator = jest.fn().mockReturnValue(false);
    mockValidator.errors = [{ message: 'Invalid config' }];
    
    (Ajv as jest.Mock).mockImplementation(() => ({
      compile: jest.fn().mockReturnValue(mockValidator),
    }));
    
    await expect(loadConfig()).rejects.toThrow('Invalid configuration');
  });
});
