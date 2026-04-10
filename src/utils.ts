import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { readFile } from 'fs/promises';

import { ManifestOptions, ManifestValue } from "./types";

export const modifiedManifest = async (outputPath: string | undefined, options: ManifestOptions): Promise<void> => {
  try {
    const manifestPath = resolve(`${outputPath ?? ""}/${options.fileName}`);
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));

    const result: Record<string, ManifestValue> = {};
    const basePath = options.basePath ?? '';

    for (const key in manifest) {
      if (Object.hasOwnProperty.call(manifest, key)) {
        if (options.filter && !options.filter({ key, value: manifest[key] })) {
          delete manifest[key];
          continue;
        }

        const publicPath = options.publicPath ?? "/";
        const separator = publicPath.endsWith('/') ? '' : '/';
        manifest[key].file = `${publicPath}${separator}${manifest[key].file}`;

        if(Object.hasOwnProperty.call(manifest[key], 'css')) {
          for (const cssKey in manifest[key].css) {
            manifest[key].css[cssKey] = `${publicPath}${separator}${manifest[key].css[cssKey]}`;
          }
        }

        if(Object.hasOwnProperty.call(manifest[key], 'assets')) {
          for (const assetKey in manifest[key].assets) {
            manifest[key].assets[assetKey] = `${publicPath}${separator}${manifest[key].assets[assetKey]}`;
          }
        }

        let processedKey = key;
        if (options.removeKeyHash !== false && options.removeKeyHash) {
          options.removeKeyHash.lastIndex = 0;
          processedKey = key.replace(options.removeKeyHash, '');
        }

        if (options.map) {
          const mapped = options.map({ key: processedKey, value: manifest[key] });
          const newKey = basePath ? `${basePath}${mapped.key}` : mapped.key;
          result[newKey] = mapped.value;
        } else {
          const newKey = basePath ? `${basePath}${processedKey}` : processedKey;
          result[newKey] = manifest[key];
        }
      }
    }

    writeFileSync(manifestPath, JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('An error occurred:', error);
    // Continue running the program
  }
}
