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
        manifest[key].file = `${options.publicPath ?? "/"}${manifest[key].file}`;

        if(manifest[key].hasOwnProperty('css')) {
          for (const cssKey in manifest[key].css) {
            manifest[key].css[cssKey] = `${options.publicPath ?? "/"}${manifest[key].css[cssKey]}`;
          }
        }
      }
    }

    if (manifest['index.html']) {
      var newCss = []
      for (var idx in manifest['index.html'].css) {
        newCss.push(`${options.publicPath ?? "/"}${manifest['index.html'].css[idx]}`)
      }
      manifest['index.html'].css = newCss
    }

    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  } catch (error) {
    console.error('An error occurred:', error);
    // Continue running the program
  }
}