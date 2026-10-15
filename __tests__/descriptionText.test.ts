import { describe, expect, it } from 'vitest';
import { plainDescription } from '../src/api/descriptionText';

describe('Plain-text descriptions', () => {
  it('removes raw and escaped HTML markup', () => {
    expect(plainDescription('The <b>fox</b> is <i>red</i>.')).toBe('The fox is red.');
    expect(plainDescription('A &lt;b&gt;bird&lt;/b&gt;')).toBe('A bird');
  });

  it('decodes named and numeric entities and normalizes spacing', () => {
    expect(plainDescription('Fish&nbsp;&amp;&nbsp;birds &#8212; &#x1F41F;')).toBe('Fish & birds — 🐟');
    expect(plainDescription('Hello<br>world')).toBe('Hello world');
  });

  it('handles blank descriptions and invalid numeric entities safely', () => {
    expect(plainDescription('   ')).toBeUndefined();
    expect(plainDescription(undefined)).toBeUndefined();
    expect(plainDescription('bad &#xD800; value')).toBe('bad &#xD800; value');
  });
});
