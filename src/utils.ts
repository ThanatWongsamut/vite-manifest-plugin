import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { readFile } from 'fs/promises';

import { ManifestOptions, ManifestValue } from "./types";

const prependPath = (publicPath: string, filePath: string): string => {
  const separator = publicPath.endsWith('/') ? '' : '/';
  return `${publicPath}${separator}${filePath}`;
};

const rewritePaths = (entry: ManifestValue, publicPath: string): void => {
  entry.file = prependPath(publicPath, entry.file);

  if (Object.hasOwnProperty.call(entry, 'css')) {
    for (const cssKey in entry.css) {
      entry.css![cssKey] = prependPath(publicPath, entry.css![cssKey]);
    }
  }

  if (Object.hasOwnProperty.call(entry, 'assets')) {
    for (const assetKey in entry.assets) {
      entry.assets![assetKey] = prependPath(publicPath, entry.assets![assetKey]);
    }
  }
};

const processKey = (key: string, removeKeyHash: RegExp | false | undefined): string => {
  if (removeKeyHash !== false && removeKeyHash) {
    removeKeyHash.lastIndex = 0;
    return key.replace(removeKeyHash, '');
  }
  return key;
};

const processManifest = (manifest: Record<string, ManifestValue>, options: ManifestOptions): Record<string, ManifestValue> => {
  const result: Record<string, ManifestValue> = {};
  const basePath = options.basePath ?? '';
  const publicPath = options.publicPath ?? "/";

  for (const key in manifest) {
    if (Object.hasOwnProperty.call(manifest, key)) {
      if (options.filter && !options.filter({ key, value: manifest[key] })) {
        continue;
      }

      rewritePaths(manifest[key], publicPath);

      const processedKey = processKey(key, options.removeKeyHash);

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

  return result;
};

const serializeResult = (result: Record<string, ManifestValue>, options: ManifestOptions): string => {
  const finalResult: Record<string, unknown> = options.seed ? { ...options.seed, ...result } : result;

  return options.serialize
    ? options.serialize(finalResult as Record<string, ManifestValue>)
    : JSON.stringify(finalResult, null, 2);
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

    const result = processManifest(manifest, options);
    const output = serializeResult(result, options);

    writeFileSync(manifestPath, output);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}
