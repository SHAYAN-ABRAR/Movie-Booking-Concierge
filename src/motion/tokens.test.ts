import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { duration, cssDuration } from './tokens';

/**
 * The CSS and JS motion scales are one vocabulary expressed twice — once for
 * plain transitions, once for Framer Motion. Nothing enforces that at compile
 * time, and they had already drifted apart once: `--dur-fast` was 120ms while
 * the JS `fast` token was 190ms, so a card's CSS hover and its layout animation
 * ran at visibly different speeds.
 */
describe('the motion scale', () => {
  // Vitest resolves `import.meta.url` to an http-style URL under its
  // transform pipeline, so read from the project root instead.
  const css = readFileSync(path.join(process.cwd(), 'src/styles/globals.css'), 'utf8');

  const cssMilliseconds = (name: string) => {
    const match = new RegExp(`${name}:\\s*(\\d+)ms`).exec(css);
    if (!match) throw new Error(`${name} is not declared in globals.css`);
    return Number(match[1]);
  };

  it('declares every JS token as a CSS custom property with the same value', () => {
    for (const [property, token] of Object.entries(cssDuration)) {
      const fromJs = Math.round(duration[token] * 1000);
      expect(cssMilliseconds(property), `${property} vs duration.${token}`).toBe(fromJs);
    }
  });

  it('keeps the scale ordered, so "fast" is never slower than "base"', () => {
    expect(duration.instant).toBeLessThan(duration.fast);
    expect(duration.fast).toBeLessThan(duration.base);
    expect(duration.base).toBeLessThan(duration.layout);
    expect(duration.reveal).toBeLessThan(duration.cinematic);
  });

  it('keeps interactive feedback inside the range a press still feels immediate', () => {
    // Beyond about 140ms a press stops reading as the same frame as the click.
    expect(duration.instant * 1000).toBeLessThanOrEqual(140);
    // And hover past ~240ms reads as lag rather than response.
    expect(duration.fast * 1000).toBeLessThanOrEqual(240);
  });
});
