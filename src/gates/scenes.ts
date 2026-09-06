/**
 * The picture of a world, by gate id.
 *
 * Artwork is picked up from `src/assets/scenes` by file name, so replacing a
 * scene — or the whole set — means dropping in a file called `<gate-id>.webp`.
 * No code changes, and no list to keep in step. A gate with no picture yet
 * simply has none: everything that draws a scene is written to disappear when
 * the file is missing, so the set can be filled in one image at a time.
 *
 * What a scene may show is not this file's business, but it is a rule:
 * `AGENTS.md` requires that every animal drawn is one the gate's own records
 * name. The reconstruction — the poses, the colours, the light — is the
 * artist's; who is in it is the record's.
 */

function collect(files: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(files).map(([path, url]) => [path.replace(/^.*\//, "").replace(/\.[^.]+$/, ""), url]),
  );
}

const scenes = collect(import.meta.glob("../assets/scenes/*.{png,jpg,jpeg,webp}", {
  eager: true, query: "?url", import: "default",
}) as Record<string, string>);

/** Gates that currently have a picture. */
export const sceneIds: readonly string[] = Object.keys(scenes).sort();

export function sceneSource(gateId: string): string | undefined {
  return scenes[gateId];
}
