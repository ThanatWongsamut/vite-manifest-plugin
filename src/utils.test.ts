import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { readFile } from 'fs/promises';
import { modifiedManifest } from './utils';
import { ManifestOptions } from './types';

// Mocking the fs and path modules
vi.mock('fs', () => ({
    writeFileSync: vi.fn(),
}));
vi.mock('path', () => ({
    resolve: vi.fn((...args) => args.join('/')),
}));
vi.mock('fs/promises', () => ({
    readFile: vi.fn(),
}));

describe('modifiedManifest', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should modify the manifest file correctly', async () => {
        const mockManifest = {
            "main.js": { "file": "main.js" },
            "vendor.js": { "file": "vendor.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/'
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('output', options);

        expect(readFile).toHaveBeenCalledWith('output/manifest.json', 'utf-8');
        expect(writeFileSync).toHaveBeenCalledWith(
            'output/manifest.json',
            JSON.stringify({
                "main.js": { "file": "/static/main.js" },
                "vendor.js": { "file": "/static/vendor.js" }
            }, null, 2)
        );
    });

    it('should handle absence of outputPath and publicPath', async () => {
        const mockManifest = {
            "main.js": { "file": "main.js" },
            "vendor.js": { "file": "vendor.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json'
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest(undefined, options);

        expect(readFile).toHaveBeenCalledWith('/manifest.json', 'utf-8');
        expect(writeFileSync).toHaveBeenCalledWith(
            '/manifest.json',
            JSON.stringify({
                "main.js": { "file": "/main.js" },
                "vendor.js": { "file": "/vendor.js" }
            }, null, 2)
        );
    });

    it('should handle CSS files in manifest entries', async () => {
        const mockManifest = {
            "main.js": {
                "file": "main.js",
                "css": ["styles.css", "theme.css"]
            },
            "vendor.js": {
                "file": "vendor.js",
                "css": ["vendor.css"]
            }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/assets/'
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({
                "main.js": {
                    "file": "/assets/main.js",
                    "css": ["/assets/styles.css", "/assets/theme.css"]
                },
                "vendor.js": {
                    "file": "/assets/vendor.js",
                    "css": ["/assets/vendor.css"]
                }
            }, null, 2)
        );
    });

    it('should handle index.html entry with CSS files', async () => {
        const mockManifest = {
            "index.html": {
                "file": "index.html",
                "css": ["main.css", "vendor.css"]
            },
            "main.js": { "file": "main.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/'
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('build', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'build/manifest.json',
            JSON.stringify({
                "index.html": {
                    "file": "/static/index.html",
                    "css": ["/static/main.css", "/static/vendor.css"]
                },
                "main.js": { "file": "/static/main.js" }
            }, null, 2)
        );
    });

    it('should handle index.html without CSS files', async () => {
        const mockManifest = {
            "index.html": {
                "file": "index.html"
            },
            "main.js": { "file": "main.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/'
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('build', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'build/manifest.json',
            JSON.stringify({
                "index.html": {
                    "file": "/static/index.html"
                },
                "main.js": { "file": "/static/main.js" }
            }, null, 2)
        );
    });

    it('should handle complex manifest with multiple file types and CSS', async () => {
        const mockManifest = {
            "index.html": {
                "file": "index.html",
                "css": ["main.css"]
            },
            "main.js": {
                "file": "assets/main-abc123.js",
                "css": ["assets/main-def456.css"]
            },
            "vendor.js": {
                "file": "assets/vendor-789xyz.js"
            },
            "polyfills.js": {
                "file": "assets/polyfills-111aaa.js",
                "css": ["assets/polyfills-222bbb.css", "assets/normalize-333ccc.css"]
            }
        };
        const options: ManifestOptions = {
            fileName: '.vite/manifest.json',
            publicPath: 'https://cdn.example.com/'
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/.vite/manifest.json',
            JSON.stringify({
                "index.html": {
                    "file": "https://cdn.example.com/index.html",
                    "css": ["https://cdn.example.com/main.css"]
                },
                "main.js": {
                    "file": "https://cdn.example.com/assets/main-abc123.js",
                    "css": ["https://cdn.example.com/assets/main-def456.css"]
                },
                "vendor.js": {
                    "file": "https://cdn.example.com/assets/vendor-789xyz.js"
                },
                "polyfills.js": {
                    "file": "https://cdn.example.com/assets/polyfills-111aaa.js",
                    "css": ["https://cdn.example.com/assets/polyfills-222bbb.css", "https://cdn.example.com/assets/normalize-333ccc.css"]
                }
            }, null, 2)
        );
    });

    it('should filter out entries when filter returns false', async () => {
        const mockManifest = {
            "main.js": { "file": "assets/main.js" },
            "vendor.js": { "file": "assets/vendor.js" },
            "polyfills.js": { "file": "assets/polyfills.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/',
            filter: (entry) => entry.key !== 'polyfills.js'
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({
                "main.js": { "file": "/static/assets/main.js" },
                "vendor.js": { "file": "/static/assets/vendor.js" }
            }, null, 2)
        );
    });

    it('should keep all entries when filter always returns true', async () => {
        const mockManifest = {
            "main.js": { "file": "main.js" },
            "vendor.js": { "file": "vendor.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/',
            filter: () => true
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({
                "main.js": { "file": "/static/main.js" },
                "vendor.js": { "file": "/static/vendor.js" }
            }, null, 2)
        );
    });

    it('should remove all entries when filter always returns false', async () => {
        const mockManifest = {
            "main.js": { "file": "main.js" },
            "vendor.js": { "file": "vendor.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/',
            filter: () => false
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({}, null, 2)
        );
    });

    it('should filter based on entry value properties', async () => {
        const mockManifest = {
            "main.js": { "file": "assets/main.js", "isEntry": true },
            "vendor.js": { "file": "assets/vendor.js" },
            "style.css": { "file": "assets/style.css", "isEntry": true }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/',
            filter: (entry) => entry.value.isEntry === true
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({
                "main.js": { "file": "/static/assets/main.js", "isEntry": true },
                "style.css": { "file": "/static/assets/style.css", "isEntry": true }
            }, null, 2)
        );
    });

    it('should transform entries with map option', async () => {
        const mockManifest = {
            "main.js": { "file": "assets/main.js" },
            "vendor.js": { "file": "assets/vendor.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/',
            map: (entry) => ({
                key: entry.key.toUpperCase(),
                value: { ...entry.value, mapped: true }
            })
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({
                "MAIN.JS": { "file": "/static/assets/main.js", "mapped": true },
                "VENDOR.JS": { "file": "/static/assets/vendor.js", "mapped": true }
            }, null, 2)
        );
    });

    it('should apply map after path rewriting', async () => {
        const mockManifest = {
            "main.js": { "file": "assets/main.js" }
        };
        const mapFn = vi.fn((entry) => entry);
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/',
            map: mapFn
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(mapFn).toHaveBeenCalledWith({
            key: 'main.js',
            value: { file: '/static/assets/main.js' }
        });
    });

    it('should allow map to rename keys', async () => {
        const mockManifest = {
            "src/main.js": { "file": "assets/main.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/',
            map: (entry) => ({
                key: entry.key.replace('src/', ''),
                value: entry.value
            })
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({
                "main.js": { "file": "/static/assets/main.js" }
            }, null, 2)
        );
    });

    it('should prepend basePath to manifest keys', async () => {
        const mockManifest = {
            "main.js": { "file": "main.js" },
            "vendor.js": { "file": "vendor.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/',
            basePath: 'dist/'
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('output', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'output/manifest.json',
            JSON.stringify({
                "dist/main.js": { "file": "/static/main.js" },
                "dist/vendor.js": { "file": "/static/vendor.js" }
            }, null, 2)
        );
    });

    it('should not modify keys when basePath is empty', async () => {
        const mockManifest = {
            "main.js": { "file": "main.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/',
            basePath: ''
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('output', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'output/manifest.json',
            JSON.stringify({
                "main.js": { "file": "/static/main.js" }
            }, null, 2)
        );
    });

    it('should not modify keys when basePath is not provided', async () => {
        const mockManifest = {
            "main.js": { "file": "main.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/'
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('output', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'output/manifest.json',
            JSON.stringify({
                "main.js": { "file": "/static/main.js" }
            }, null, 2)
        );
    });

    it('should remove hashes from keys with removeKeyHash', async () => {
        const mockManifest = {
            "assets/main-a1b2c3d4.js": { "file": "assets/main-a1b2c3d4.js" },
            "assets/vendor-e5f6a7b8.js": { "file": "assets/vendor-e5f6a7b8.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/',
            removeKeyHash: /[-][a-f0-9]{8}/gi
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({
                "assets/main.js": { "file": "/static/assets/main-a1b2c3d4.js" },
                "assets/vendor.js": { "file": "/static/assets/vendor-e5f6a7b8.js" }
            }, null, 2)
        );
    });

    it('should not remove hashes when removeKeyHash is false', async () => {
        const mockManifest = {
            "assets/main-a1b2c3d4.js": { "file": "assets/main-a1b2c3d4.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/',
            removeKeyHash: false
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({
                "assets/main-a1b2c3d4.js": { "file": "/static/assets/main-a1b2c3d4.js" }
            }, null, 2)
        );
    });

    it('should not modify keys when removeKeyHash is not provided', async () => {
        const mockManifest = {
            "assets/main-a1b2c3d4.js": { "file": "assets/main-a1b2c3d4.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/'
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({
                "assets/main-a1b2c3d4.js": { "file": "/static/assets/main-a1b2c3d4.js" }
            }, null, 2)
        );
    });

    it('should use custom serialize function', async () => {
        const mockManifest = {
            "main.js": { "file": "main.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/',
            serialize: (manifest) => `# Custom\n${JSON.stringify(manifest)}`
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            '# Custom\n{"main.js":{"file":"/static/main.js"}}'
        );
    });

    it('should use default JSON serialization when serialize is not provided', async () => {
        const mockManifest = {
            "main.js": { "file": "main.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/'
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({ "main.js": { "file": "/static/main.js" } }, null, 2)
        );
    });

    it('should merge seed into manifest', async () => {
        const mockManifest = {
            "main.js": { "file": "main.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/',
            seed: { "version": "1.0.0", "buildTime": "2024-01-01" }
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({
                "version": "1.0.0",
                "buildTime": "2024-01-01",
                "main.js": { "file": "/static/main.js" }
            }, null, 2)
        );
    });

    it('should let manifest entries override seed keys', async () => {
        const mockManifest = {
            "main.js": { "file": "main.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/',
            seed: { "main.js": { "custom": true } }
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({
                "main.js": { "file": "/static/main.js" }
            }, null, 2)
        );
    });

    it('should use empty seed without affecting manifest', async () => {
        const mockManifest = {
            "main.js": { "file": "main.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/',
            seed: {}
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({
                "main.js": { "file": "/static/main.js" }
            }, null, 2)
        );
    });

    it('should use generate function for custom manifest output', async () => {
        const mockManifest = {
            "main.js": { "file": "assets/main.js" },
            "vendor.js": { "file": "assets/vendor.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            generate: (seed, files) => {
                const result: Record<string, string> = { ...seed as Record<string, string> };
                for (const key in files) {
                    result[key] = files[key].file;
                }
                return result;
            },
            seed: { "version": "1.0.0" }
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({
                "version": "1.0.0",
                "main.js": "assets/main.js",
                "vendor.js": "assets/vendor.js"
            }, null, 2)
        );
    });

    it('should skip path rewriting when generate is provided', async () => {
        const mockManifest = {
            "main.js": { "file": "assets/main.js" }
        };
        const generateFn = vi.fn((_seed, files) => files);
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/',
            generate: generateFn
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        // generate receives raw files (no path rewriting applied)
        expect(generateFn).toHaveBeenCalledWith(
            {},
            { "main.js": { "file": "assets/main.js" } }
        );
    });

    it('should pass empty seed to generate when seed is not provided', async () => {
        const mockManifest = {
            "main.js": { "file": "main.js" }
        };
        const generateFn = vi.fn((seed) => seed);
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            generate: generateFn
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(generateFn).toHaveBeenCalledWith({}, expect.any(Object));
    });

    it('should handle empty manifest', async () => {
        const mockManifest = {};
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/'
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('output', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'output/manifest.json',
            JSON.stringify({}, null, 2)
        );
    });

    it('should handle assets array in manifest entries', async () => {
        const mockManifest = {
            "main.js": {
                "file": "assets/main-abc123.js",
                "assets": ["assets/logo-def456.png", "assets/font-ghi789.woff2"]
            },
            "vendor.js": {
                "file": "assets/vendor-xyz.js",
                "assets": ["assets/icon-abc.svg"]
            }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/'
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({
                "main.js": {
                    "file": "/static/assets/main-abc123.js",
                    "assets": ["/static/assets/logo-def456.png", "/static/assets/font-ghi789.woff2"]
                },
                "vendor.js": {
                    "file": "/static/assets/vendor-xyz.js",
                    "assets": ["/static/assets/icon-abc.svg"]
                }
            }, null, 2)
        );
    });

    it('should handle manifest entries with both css and assets', async () => {
        const mockManifest = {
            "main.js": {
                "file": "assets/main-abc123.js",
                "css": ["assets/main-def456.css"],
                "assets": ["assets/logo-ghi789.png"]
            }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: 'https://cdn.example.com/'
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({
                "main.js": {
                    "file": "https://cdn.example.com/assets/main-abc123.js",
                    "css": ["https://cdn.example.com/assets/main-def456.css"],
                    "assets": ["https://cdn.example.com/assets/logo-ghi789.png"]
                }
            }, null, 2)
        );
    });

    it('should handle invalid JSON in manifest file', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/static/'
        };

        (readFile as any).mockResolvedValue('invalid json content');

        await modifiedManifest('output', options);

        expect(consoleErrorSpy).toHaveBeenCalledWith('An error occurred:', expect.any(SyntaxError));
        expect(writeFileSync).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });

    it('should handle errors when file is not found', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const options: ManifestOptions = {
            fileName: 'manifest.json'
        };

        (readFile as any).mockRejectedValue(new Error('File not found'));

        await modifiedManifest('output', options);

        expect(readFile).toHaveBeenCalledWith('output/manifest.json', 'utf-8');
        expect(consoleErrorSpy).toHaveBeenCalledWith('An error occurred:', expect.any(Error));
        expect(writeFileSync).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });

    it('should handle when outputPath is not found', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const options: ManifestOptions = {
            fileName: 'manifest.json'
        };

        (resolve as any).mockImplementation(() => {
            throw new Error('Output path not found');
        });

        await modifiedManifest('invalidPath', options);

        expect(consoleErrorSpy).toHaveBeenCalledWith('An error occurred:', expect.any(Error));
        expect(readFile).not.toHaveBeenCalled();
        expect(writeFileSync).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });

    it('should handle publicPath with trailing slash correctly', async () => {
        const mockManifest = {
            "main.js": { "file": "main.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/assets/' // Already has trailing slash
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));
        (resolve as any).mockReturnValue('dist/manifest.json');

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({
                "main.js": { "file": "/assets/main.js" }
            }, null, 2)
        );
    });

    it('should handle publicPath without trailing slash correctly', async () => {
        const mockManifest = {
            "main.js": { "file": "main.js" }
        };
        const options: ManifestOptions = {
            fileName: 'manifest.json',
            publicPath: '/assets' // No trailing slash
        };

        (readFile as any).mockResolvedValue(JSON.stringify(mockManifest));
        (resolve as any).mockReturnValue('dist/manifest.json');

        await modifiedManifest('dist', options);

        expect(writeFileSync).toHaveBeenCalledWith(
            'dist/manifest.json',
            JSON.stringify({
                "main.js": { "file": "/assets/main.js" }
            }, null, 2)
        );
    });
});
