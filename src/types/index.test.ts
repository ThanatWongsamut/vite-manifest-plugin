import { describe, it, expect } from 'vitest';
import { ManifestOptions } from './index';

describe('ManifestOptions Type', () => {
  it('should accept valid ManifestOptions with fileName only', () => {
    const options: ManifestOptions = {
      fileName: 'manifest.json'
    };

    expect(options.fileName).toBe('manifest.json');
    expect(options.publicPath).toBeUndefined();
  });

  it('should accept valid ManifestOptions with fileName and publicPath', () => {
    const options: ManifestOptions = {
      fileName: 'manifest.json',
      publicPath: '/static/'
    };

    expect(options.fileName).toBe('manifest.json');
    expect(options.publicPath).toBe('/static/');
  });

  it('should accept different file names', () => {
    const options: ManifestOptions = {
      fileName: '.vite/manifest.json',
      publicPath: 'https://cdn.example.com/'
    };

    expect(options.fileName).toBe('.vite/manifest.json');
    expect(options.publicPath).toBe('https://cdn.example.com/');
  });

  it('should accept empty string as publicPath', () => {
    const options: ManifestOptions = {
      fileName: 'manifest.json',
      publicPath: ''
    };

    expect(options.fileName).toBe('manifest.json');
    expect(options.publicPath).toBe('');
  });

  it('should validate that fileName is required', () => {
    // This test ensures TypeScript compilation will fail if fileName is missing
    // @ts-expect-error - fileName is required
    const invalidOptions: ManifestOptions = {
      publicPath: '/static/'
    };

    expect(true).toBe(true); // This test is mainly for TypeScript validation
  });
}); 