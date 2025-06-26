import { describe, it, expect, vi, beforeEach } from 'vitest';
import { viteManifestPlugin } from './index';
import { ManifestOptions } from './types';
import { readFile } from 'fs/promises';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

// Mock fs modules
vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

vi.mock('path', () => ({
  resolve: vi.fn((...args: string[]) => args.join('/')),
}));

describe('Vite Manifest Plugin Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should work end-to-end with a typical Vite manifest', async () => {
    // Simulate a typical Vite manifest
    const originalManifest = {
      'index.html': {
        file: 'index.html',
        css: ['assets/index-abc123.css']
      },
      'src/main.js': {
        file: 'assets/main-def456.js',
        css: ['assets/main-def456.css']
      },
      'src/components/App.vue': {
        file: 'assets/App-ghi789.js',
        css: ['assets/App-ghi789.css']
      }
    };

    const options: ManifestOptions = {
      fileName: 'manifest.json',
      publicPath: 'https://cdn.example.com/assets/'
    };

    // Mock file system
    (readFile as any).mockResolvedValue(JSON.stringify(originalManifest));

    // Create plugin
    const plugin = await viteManifestPlugin(options);

    // Simulate Vite build completion
    if (typeof plugin.writeBundle === 'function') {
      await plugin.writeBundle.call({} as any, { dir: 'dist' } as any, {} as any);
    } else if (plugin.writeBundle && 'handler' in plugin.writeBundle) {
      await plugin.writeBundle.handler.call({} as any, { dir: 'dist' } as any, {} as any);
    }

    // Verify the manifest was read from the correct path
    expect(readFile).toHaveBeenCalledWith('dist/manifest.json', 'utf-8');

    // Verify the manifest was written with correct modifications
    expect(writeFileSync).toHaveBeenCalledWith(
      'dist/manifest.json',
      JSON.stringify({
        'index.html': {
          file: 'https://cdn.example.com/assets/index.html',
          css: ['https://cdn.example.com/assets/assets/index-abc123.css']
        },
        'src/main.js': {
          file: 'https://cdn.example.com/assets/assets/main-def456.js',
          css: ['https://cdn.example.com/assets/assets/main-def456.css']
        },
        'src/components/App.vue': {
          file: 'https://cdn.example.com/assets/assets/App-ghi789.js',
          css: ['https://cdn.example.com/assets/assets/App-ghi789.css']
        }
      }, null, 2)
    );
  });

  it('should handle production build scenario with hashed filenames', async () => {
    const originalManifest = {
      'index.html': {
        file: 'index.html',
        css: ['assets/index-a1b2c3d4.css', 'assets/vendor-e5f6g7h8.css']
      },
      'src/main.ts': {
        file: 'assets/main-i9j0k1l2.js',
        css: ['assets/main-i9j0k1l2.css']
      },
      'src/assets/logo.png': {
        file: 'assets/logo-m3n4o5p6.png'
      }
    };

    const options: ManifestOptions = {
      fileName: '.vite/manifest.json',
      publicPath: '/static/'
    };

    (readFile as any).mockResolvedValue(JSON.stringify(originalManifest));

    const plugin = await viteManifestPlugin(options);
    if (typeof plugin.writeBundle === 'function') {
      await plugin.writeBundle.call({} as any, { dir: 'build' } as any, {} as any);
    } else if (plugin.writeBundle && 'handler' in plugin.writeBundle) {
      await plugin.writeBundle.handler.call({} as any, { dir: 'build' } as any, {} as any);
    }

    expect(readFile).toHaveBeenCalledWith('build/.vite/manifest.json', 'utf-8');
    expect(writeFileSync).toHaveBeenCalledWith(
      'build/.vite/manifest.json',
      JSON.stringify({
        'index.html': {
          file: '/static/index.html',
          css: ['/static/assets/index-a1b2c3d4.css', '/static/assets/vendor-e5f6g7h8.css']
        },
        'src/main.ts': {
          file: '/static/assets/main-i9j0k1l2.js',
          css: ['/static/assets/main-i9j0k1l2.css']
        },
        'src/assets/logo.png': {
          file: '/static/assets/logo-m3n4o5p6.png'
        }
      }, null, 2)
    );
  });

  it('should handle build failure gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const options: ManifestOptions = {
      fileName: 'manifest.json',
      publicPath: '/static/'
    };

    (readFile as any).mockRejectedValue(new Error('ENOENT: no such file or directory'));

    const plugin = await viteManifestPlugin(options);
    
    // Should not throw an error
    const callWriteBundle = async () => {
      if (typeof plugin.writeBundle === 'function') {
        await plugin.writeBundle.call({} as any, { dir: 'dist' } as any, {} as any);
      } else if (plugin.writeBundle && 'handler' in plugin.writeBundle) {
        await plugin.writeBundle.handler.call({} as any, { dir: 'dist' } as any, {} as any);
      }
    };
    await expect(callWriteBundle()).resolves.not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith('An error occurred:', expect.any(Error));
    expect(writeFileSync).not.toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('should work with module federation setup', async () => {
    const originalManifest = {
      'remoteEntry.js': {
        file: 'assets/remoteEntry-abc123.js'
      },
      'src/bootstrap.js': {
        file: 'assets/bootstrap-def456.js',
        css: ['assets/bootstrap-def456.css']
      }
    };

    const options: ManifestOptions = {
      fileName: 'manifest.json',
      publicPath: 'https://microfrontend.example.com/'
    };

    (readFile as any).mockResolvedValue(JSON.stringify(originalManifest));

    const plugin = await viteManifestPlugin(options);
    if (typeof plugin.writeBundle === 'function') {
      await plugin.writeBundle.call({} as any, { dir: 'dist' } as any, {} as any);
    } else if (plugin.writeBundle && 'handler' in plugin.writeBundle) {
      await plugin.writeBundle.handler.call({} as any, { dir: 'dist' } as any, {} as any);
    }

    expect(writeFileSync).toHaveBeenCalledWith(
      'dist/manifest.json',
      JSON.stringify({
        'remoteEntry.js': {
          file: 'https://microfrontend.example.com/assets/remoteEntry-abc123.js'
        },
        'src/bootstrap.js': {
          file: 'https://microfrontend.example.com/assets/bootstrap-def456.js',
          css: ['https://microfrontend.example.com/assets/bootstrap-def456.css']
        }
      }, null, 2)
    );
  });
}); 