import { Plugin } from "vite"
import { ManifestOptions } from "./types"
import { modifiedManifest } from "./utils"

export type { ManifestOptions, ManifestEntry, ManifestValue } from "./types"

export const viteManifestPlugin = async (options: ManifestOptions): Promise<Plugin> => {
  const plugin: Plugin = {
    name: 'vite-manifest-plugin',
    enforce: 'post',
    apply: 'build',
    async writeBundle({ dir }) {
      await modifiedManifest(dir, options)
    },
  }

  return plugin;
}