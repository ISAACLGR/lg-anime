export interface VideoSource {
  url: string;
  label: string;
  quality?: string;
}

export interface EpisodeVideo {
  episode: number;
  animeSlug: string;
  sources: VideoSource[];
}

export function convertJikanSlugToAnFireSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function extractEpisodeVideoLinks(_animeSlug: string, _episodeNumber: number): Promise<EpisodeVideo> {
  return {
    episode: _episodeNumber,
    animeSlug: _animeSlug,
    sources: [],
  };
}

