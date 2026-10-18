import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import { readFileSync } from 'node:fs';

const newModules = ['NonogramBoard.tsx', 'ReasoningPuzzleBoard.tsx', 'ChangeDetectorBoard.tsx', 'AudioControls.tsx', 'GameBoard.tsx', 'GamePage.tsx', 'audio.ts', 'achievements.ts', 'difficulty.ts', 'puzzle-engine.ts', 'puzzle-engine.test.ts', 'gameplay.integration.test.tsx', 'audio.test.tsx', 'quality.test.ts'];
describe('repository lint and accessibility guardrails', () => {
  it('runs the full lint scan and rejects errors in the new gameplay modules', async () => {
    const results = await new ESLint().lintFiles(['src', 'vite.config.ts', 'vitest.config.ts']);
    const baseline = results.flatMap(result => result.messages.filter(message => message.severity === 2).map(message => `${result.filePath}:${message.line} ${message.ruleId}: ${message.message}`));
    if (baseline.length) console.warn('Full repository lint diagnostics (includes pre-existing code):\n' + baseline.join('\n'));
    const introduced = results.filter(result => newModules.some(name => result.filePath.split('\\').join('/').endsWith('/' + name))).flatMap(result => result.messages.filter(message => message.severity === 2));
    expect(introduced).toEqual([]);
  }, 30000);
  it('keeps all animations covered by OS and app reduced-motion overrides', () => {
    const css = readFileSync('src/globals.css', 'utf8');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('.reduce-motion *');
    expect(css.indexOf('@keyframes gv-enter')).toBeLessThan(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  });
});
