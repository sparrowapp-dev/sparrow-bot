import { logger } from './logger';

describe('Logger', () => {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;
  const originalConsoleDebug = console.debug;
  const originalEnv = process.env;

  beforeEach(() => {
    // Mock console methods
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
    
    // Reset process.env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
    console.debug = originalConsoleDebug;
    
    // Restore process.env
    process.env = originalEnv;
  });

  it('should log error messages', () => {
    logger.error('Test error');
    expect(console.error).toHaveBeenCalled();
    expect((console.error as jest.Mock).mock.calls[0][0]).toContain('[ERROR] Test error');
  });

  it('should log warning messages', () => {
    logger.warn('Test warning');
    expect(console.warn).toHaveBeenCalled();
    expect((console.warn as jest.Mock).mock.calls[0][0]).toContain('[WARN] Test warning');
  });

  it('should log info messages', () => {
    logger.info('Test info');
    expect(console.info).toHaveBeenCalled();
    expect((console.info as jest.Mock).mock.calls[0][0]).toContain('[INFO] Test info');
  });

  it('should log debug messages when log level is debug', () => {
    process.env.LOG_LEVEL = 'debug';
    
    // Create a new instance of the logger with the updated log level
    const { logger: debugLogger } = require('./logger');
    
    debugLogger.debug('Test debug');
    expect(console.debug).toHaveBeenCalled();
    expect((console.debug as jest.Mock).mock.calls[0][0]).toContain('[DEBUG] Test debug');
  });

  it('should not log debug messages when log level is info', () => {
    process.env.LOG_LEVEL = 'info';
    
    // Create a new instance of the logger with the updated log level
    const { logger: infoLogger } = require('./logger');
    
    infoLogger.debug('Test debug');
    expect(console.debug).not.toHaveBeenCalled();
  });

  it('should include metadata in log messages', () => {
    const metadata = { key: 'value' };
    logger.error('Test error', metadata);
    expect(console.error).toHaveBeenCalled();
    expect((console.error as jest.Mock).mock.calls[0][0]).toContain(JSON.stringify(metadata));
  });
});
