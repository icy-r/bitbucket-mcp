import { describe, it, expect } from 'vitest';
import { filterDiffByPath } from '../../../src/utils/diff-filter.js';

const fileA =
  'diff --git a/src/a.ts b/src/a.ts\n--- a/src/a.ts\n+++ b/src/a.ts\n@@ -1 +1 @@\n-a\n+A\n';
const fileB =
  'diff --git a/src/sub/b.ts b/src/sub/b.ts\n--- a/src/sub/b.ts\n+++ b/src/sub/b.ts\n@@ -1 +1 @@\n-b\n+B\n';
const renamed =
  'diff --git a/old/c.ts b/docs/c.ts\nsimilarity index 100%\nrename from old/c.ts\nrename to docs/c.ts\n';
const diff = fileA + fileB + renamed;

describe('filterDiffByPath', () => {
  it('should keep the section of an exact file path', () => {
    expect(filterDiffByPath(diff, 'src/a.ts')).toBe(fileA);
  });

  it('should keep every file under a directory', () => {
    expect(filterDiffByPath(diff, 'src/')).toBe(fileA + fileB);
  });

  it('should not treat a path as a prefix of a longer name', () => {
    expect(filterDiffByPath(diff, 'src/su')).toBe('');
  });

  it('should match a renamed file by its old or new path', () => {
    expect(filterDiffByPath(diff, 'old/c.ts')).toBe(renamed);
    expect(filterDiffByPath(diff, 'docs')).toBe(renamed);
  });

  it('should return an empty string when nothing matches', () => {
    expect(filterDiffByPath(diff, 'missing.ts')).toBe('');
  });
});
