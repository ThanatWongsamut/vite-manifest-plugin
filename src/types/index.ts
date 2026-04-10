/**
 * Represents a manifest entry with its key and value.
 */
export type ManifestEntry = {
  /** The manifest key (e.g., "src/main.js") */
  key: string;
  /** The manifest value object */
  value: Record<string, any>;
}

/**
 * Options for modifing manifest.
 */
export type ManifestOptions = {
  /** The file name of manifest file */
  fileName: string;
  /** The public path to be append in front of asset path*/
  publicPath?: string;
  /** Filter function to include/exclude manifest entries. Return true to keep the entry. */
  filter?: (entry: ManifestEntry) => boolean;
}