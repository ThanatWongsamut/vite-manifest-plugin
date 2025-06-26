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
