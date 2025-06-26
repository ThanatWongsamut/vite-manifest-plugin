import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { readFile } from 'fs/promises';

import { ManifestOptions } from "./types";

export const modifiedManifest = async (outputPath: string | undefined, options: ManifestOptions): Promise<void> => {
  try {
    const manifestPath = resolve(`${outputPath ?? ""}/${options.fileName}`);
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));

    for (const key in manifest) {
      if (Object.prototype.hasOwnProperty.call(manifest, key)) {
        const publicPath = options.publicPath ?? "/";
        const separator = publicPath.endsWith('/') ? '' : '/';
        manifest[key].file = `${publicPath}${separator}${manifest[key].file}`;

        if(manifest[key].hasOwnProperty('css')) {
          for (const cssKey in manifest[key].css) {
            manifest[key].css[cssKey] = `${publicPath}${separator}${manifest[key].css[cssKey]}`;
          }
        }
      }
    }

    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  } catch (error) {
    console.error('An error occurred:', error);
    // Continue running the program
  }
}