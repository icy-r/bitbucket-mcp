/**
 * Keep only the file sections of a unified git diff whose path equals `path` or lies under it.
 * Matches the old and the new path, so a renamed or deleted file is found by either name.
 */
export function filterDiffByPath(diff: string, path: string): string {
  const prefix = path.replace(/\/+$/, '');
  const matches = (file: string): boolean => file === prefix || file.startsWith(`${prefix}/`);

  const sections = diff.split(/^(?=diff --git )/m);
  return sections
    .filter((section) => {
      const header = /^diff --git a\/(.+?) b\/(.+)$/m.exec(section);
      return header !== null && (matches(header[1]) || matches(header[2]));
    })
    .join('');
}
