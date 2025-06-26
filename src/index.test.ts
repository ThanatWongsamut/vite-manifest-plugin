import { describe, it, expect, vi, beforeEach } from 'vitest';
import { viteManifestPlugin } from './index';
import { modifiedManifest } from './utils';
import { ManifestOptions } from './types';

// Mock the utils module
vi.mock('./utils', () => ({
  modifiedManifest: vi.fn(),
}));

describe('viteManifestPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to call writeBundle regardless of its type
  const callWriteBundle = async (plugin: any, options: any) => {
    if (typeof plugin.writeBundle === 'function') {
      await plugin.writeBundle(options);
    } else if (plugin.writeBundle && typeof plugin.writeBundle === 'object' && 'handler' in plugin.writeBundle) {
      await plugin.writeBundle.handler.call({} as any, options, {} as any);
    } else {
      await plugin.writeBundle(options);
    }
  };

  it('should return a plugin with correct configuration', async () => {
    const options: ManifestOptions = {
      fileName: 'manifest.json',
      publicPath: '/static/'
    };

    const plugin = await viteManifestPlugin(options);

    expect(plugin).toHaveProperty('name', 'vite-manifest-plugin');
    expect(plugin).toHaveProperty('enforce', 'post');
    expect(plugin).toHaveProperty('apply', 'build');
    expect(plugin).toHaveProperty('writeBundle');
    expect(typeof plugin.writeBundle).toBe('function');
  });

  it('should call modifiedManifest with correct parameters when writeBundle is called', async () => {
    const options: ManifestOptions = {
      fileName: 'manifest.json',
      publicPath: '/static/'
    };

    const plugin = await viteManifestPlugin(options);
    const mockBundleOptions = { dir: 'dist' };

    // Call writeBundle
    await callWriteBundle(plugin, mockBundleOptions);

    expect(modifiedManifest).toHaveBeenCalledWith('dist', options);
    expect(modifiedManifest).toHaveBeenCalledTimes(1);
  });

  it('should work with minimal options', async () => {
    const options: ManifestOptions = {
      fileName: 'manifest.json'
    };

    const plugin = await viteManifestPlugin(options);
    const mockBundleOptions = { dir: 'build' };

    await callWriteBundle(plugin, mockBundleOptions);

    expect(modifiedManifest).toHaveBeenCalledWith('build', options);
  });

  it('should handle undefined dir in writeBundle', async () => {
    const options: ManifestOptions = {
      fileName: 'manifest.json',
      publicPath: '/assets/'
    };

    const plugin = await viteManifestPlugin(options);
    const mockBundleOptions = {};

    await callWriteBundle(plugin, mockBundleOptions);

    expect(modifiedManifest).toHaveBeenCalledWith(undefined, options);
  });
}); 