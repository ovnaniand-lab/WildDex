export interface RegionImage {
  uri: string;
  credit: string;
  sourceUrl: string;
}

export const REGION_IMAGES: Record<string, RegionImage> = {
  'western-europe': {
    uri: 'https://images.unsplash.com/photo-1724045088240-713198362a2a?auto=format&fit=crop&w=1400&q=85',
    credit: 'Wolfgang Weiser / Unsplash',
    sourceUrl: 'https://unsplash.com/photos/a-river-running-through-a-forest-filled-with-lots-of-trees-Q6k5xVpipvE',
  },
  'amazon-basin': {
    uri: 'https://images.unsplash.com/photo-1699575678956-aefa714b67f0?auto=format&fit=crop&w=1400&q=85',
    credit: 'Madeline Hogan / Unsplash',
    sourceUrl: 'https://unsplash.com/photos/looking-up-into-the-canopy-of-a-tropical-forest-AycIWyyCuVo',
  },
  'east-african-savanna': {
    uri: 'https://images.unsplash.com/photo-1762547790593-8c98788494d2?auto=format&fit=crop&w=1400&q=85',
    credit: 'Peter Jackson / Unsplash',
    sourceUrl: 'https://unsplash.com/photos/acacia-trees-in-a-grassy-savanna-under-a-cloudy-sky-xG_PaC73KaI',
  },
  'boreal-canada': {
    uri: 'https://images.unsplash.com/photo-1721962716393-53618d1993bd?auto=format&fit=crop&w=1400&q=85',
    credit: 'Peter Robbins / Unsplash',
    sourceUrl: 'https://unsplash.com/photos/a-view-of-a-lake-surrounded-by-pine-trees-08TLPZt8vT0',
  },
  'southeast-asia': {
    uri: 'https://images.unsplash.com/photo-1592303032319-515be296cb1d?auto=format&fit=crop&w=1400&q=85',
    credit: 'Ken Shono / Unsplash',
    sourceUrl: 'https://unsplash.com/photos/green-trees-in-forest-during-daytime-S35PpgCIjis',
  },
  'australian-bush': {
    uri: 'https://images.unsplash.com/photo-1790089745506-af213da70011?auto=format&fit=crop&w=1400&q=85',
    credit: 'Ines Iachelini / Unsplash',
    sourceUrl: 'https://unsplash.com/photos/eucalyptus-trees-in-green-fern-forest-1FoFv0LfXyU',
  },
};
