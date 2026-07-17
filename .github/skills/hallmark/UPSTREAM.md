# Hallmark upstream

- Repository: <https://github.com/nutlope/hallmark>
- Version: `1.1.0`
- Pinned commit: `aeb42fb354ff4efa36ab475773a082315a3af2ce`
- Canonical source: `skills/hallmark/SKILL.md` and all files under `skills/hallmark/references/`
- License: MIT; see [`LICENSE`](./LICENSE)

`SKILL.md` and `references/**` are vendored byte-for-byte from the pinned commit. `LICENSE` is copied from the upstream repository root. This file is local provenance metadata and is not part of the canonical skill.

The canonical `SKILL.md` contains one link to `../../site/css/tokens.css`. The upstream demo site is intentionally outside this vendoring scope, so that demo-only link is not resolved locally; all links from `SKILL.md` into `references/**` are included.

## Reproducible update

1. Select and review a new upstream commit and version.
2. Fetch that exact commit into a temporary directory:

   ```bash
   upstream=https://github.com/nutlope/hallmark.git
   commit=<full-commit-sha>
   tmp=$(mktemp -d)
   git init -q "$tmp"
   git -C "$tmp" remote add origin "$upstream"
   git -C "$tmp" fetch --depth 1 origin "$commit"
   git -C "$tmp" checkout --detach FETCH_HEAD
   test "$(git -C "$tmp" rev-parse HEAD)" = "$commit"
   ```

3. Replace only the canonical content and license:

   ```bash
   rm -rf .github/skills/hallmark/SKILL.md .github/skills/hallmark/references
   cp "$tmp/skills/hallmark/SKILL.md" .github/skills/hallmark/SKILL.md
   cp -R "$tmp/skills/hallmark/references" .github/skills/hallmark/references
   cp "$tmp/LICENSE" .github/skills/hallmark/LICENSE
   ```

4. Update the repository, version, commit, and source metadata above.
5. Verify identical relative file lists and compare every canonical file byte-for-byte:

   ```bash
   find "$tmp/skills/hallmark" -type f | sed "s|$tmp/skills/hallmark/||" | sort > "$tmp/upstream-files"
   find .github/skills/hallmark -type f ! -name LICENSE ! -name UPSTREAM.md | sed 's|.github/skills/hallmark/||' | sort > "$tmp/vendored-files"
   diff -u "$tmp/upstream-files" "$tmp/vendored-files"
   while IFS= read -r file; do
     cmp "$tmp/skills/hallmark/$file" ".github/skills/hallmark/$file"
   done < "$tmp/upstream-files"
   cmp "$tmp/LICENSE" .github/skills/hallmark/LICENSE
   ```

6. Remove the temporary directory after validation.
