import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { readFile } from 'fs/promises';

import { ManifestOptions, ManifestValue } from "./types";

const prependPath = (publicPath: string, filePath: string): string => {
  const separator = publicPath.endsWith('/') ? '' : '/';
  return `${publicPath}${separator}${filePath}`;
};

export const modifiedManifest = async (outputPath: string | undefined, options: ManifestOptions): Promise<void> => {
  try {
    const manifestPath = resolve(`${outputPath ?? ""}/${options.fileName}`);
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));

    if (options.generate) {
      const result = options.generate(options.seed ?? {}, manifest);
      writeFileSync(manifestPath, JSON.stringify(result, null, 2));
      return;
    }

    const result: Record<string, ManifestValue> = {};
    const basePath = options.basePath ?? '';
    const publicPath = options.publicPath ?? "/";

    for (const key in manifest) {
      if (Object.hasOwnProperty.call(manifest, key)) {
        if (options.filter && !options.filter({ key, value: manifest[key] })) {
          continue;
        }

        manifest[key].file = prependPath(publicPath, manifest[key].file);

        if(Object.hasOwnProperty.call(manifest[key], 'css')) {
          for (const cssKey in manifest[key].css) {
            manifest[key].css[cssKey] = prependPath(publicPath, manifest[key].css[cssKey]);
          }
        }

        if(Object.hasOwnProperty.call(manifest[key], 'assets')) {
          for (const assetKey in manifest[key].assets) {
            manifest[key].assets[assetKey] = prependPath(publicPath, manifest[key].assets[assetKey]);
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

    const finalResult: Record<string, unknown> = options.seed ? { ...options.seed, ...result } : result;

    const output = options.serialize
      ? options.serialize(finalResult as Record<string, ManifestValue>)
      : JSON.stringify(finalResult, null, 2);

    writeFileSync(manifestPath, output);
  } catch (error) {
    console.error('An error occurred:', error);
    // Continue running the program
  }
}
