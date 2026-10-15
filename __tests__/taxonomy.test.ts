import { describe, expect, it } from 'vitest';
import { CATEGORY_TAXA, gbifCategoryOf, inatCategoryOf, matchesGbifCategory, matchesInatCategory } from '../src/api/taxonomy';

describe('Category classification', () => {
  it('uses distinct iNaturalist identifiers for birds, mammals and ants', () => {
    expect(CATEGORY_TAXA.mammals.inatIds).toContain(40151);
    expect(CATEGORY_TAXA.birds.inatIds).toContain(3);
    expect(CATEGORY_TAXA.ants.inatIds).toContain(47336);
    expect(CATEGORY_TAXA.fish.inatIds).not.toContain(3);
  });

  it('does not confuse ray-finned fish, birds and mammals', () => {
    expect(matchesGbifCategory({ class: 'Actinopterygii', kingdom: 'Animalia' }, 'fish')).toBe(true);
    expect(matchesGbifCategory({ class: 'Aves', kingdom: 'Animalia' }, 'fish')).toBe(false);
    expect(matchesGbifCategory({ class: 'Aves' }, 'mammals')).toBe(false);
    expect(matchesGbifCategory({ class: 'Mammalia' }, 'mammals')).toBe(true);
    expect(gbifCategoryOf({ class: 'Actinopterygii' })).toBe('fish');
  });

  it('supports ants as an insect subcategory', () => {
    const ant = { iconic_taxon_id: 47157, ancestor_ids: [47157, 47336] };
    expect(inatCategoryOf(ant)).toBe('ants');
    expect(matchesInatCategory(ant, 'ants')).toBe(true);
    expect(matchesInatCategory(ant, 'other-insects')).toBe(true);
    expect(matchesGbifCategory({ class: 'Insecta', family: 'Formicidae' }, 'ants')).toBe(true);
  });

  it('does not invent a category when the taxonomy is missing', () => {
    expect(inatCategoryOf({})).toBeUndefined();
    expect(gbifCategoryOf({})).toBeUndefined();
    expect(matchesGbifCategory({}, 'mammals')).toBe(false);
    expect(matchesInatCategory({}, 'birds')).toBe(false);
  });
});
