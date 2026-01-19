# quartz-chinese - Claude Code Instructions

## What This Is

This is the **Quartz build system** for chinese.garrettjamespeterson.com

This is NOT where lesson content lives. Lesson `.md` files belong in the Obsidian vault.

## Critical Paths

| Purpose | Path |
|---------|------|
| Lesson content (SOURCE) | `/Users/garebear/Library/CloudStorage/ProtonDrive-grandmascooking@protonmail.com-folder/中文VAULT/` |
| This Quartz site | `~/quartz-chinese/` |
| Publish script | `~/publish.sh` |
| Full system docs | See `Quartz_Publishing_System.md` in the vault |

## ⚠️ WARNING: content/ Folder

The `content/` folder in this directory gets **WIPED AND REBUILT** every time `publish.sh` runs.

**NEVER create lesson files in `~/quartz-chinese/content/`**

They will be deleted on the next publish.

## What DOES Belong Here

### Custom CSS for lessons
```
~/quartz-chinese/quartz/static/*.css
```
These persist across publishes and are bundled into the site.

### Audio and media files
```
~/quartz-chinese/static/
```
Referenced in markdown as `/static/filename.mp3`

### Quartz plugins
```
~/quartz-chinese/quartz/plugins/transformers/
```
Custom plugins already installed:
- `AudioLines.ts` - Audio playback
- `zhongwen.ts` - Chinese + pinyin rendering
- `TypingInputs.ts` - Interactive typing
- `MultipleChoice.ts` - Quiz questions

### Quartz configuration
```
~/quartz-chinese/quartz.config.ts
```

## File Creation Rules

| File Type | Create In | Example |
|-----------|-----------|---------|
| Lesson `.md` | **VAULT** (not here!) | `/Users/garebear/.../中文VAULT/lesson.md` |
| Lesson CSS | `quartz/static/` | `quartz/static/lesson-styles.css` |
| Audio files | `static/` | `static/audio/tone1.mp3` |
| New plugins | `quartz/plugins/transformers/` | `quartz/plugins/transformers/NewFeature.ts` |

## Pre-Flight Check

Before creating ANY file:
1. Is this a `.md` lesson file? → **STOP. Create in the vault instead.**
2. Is this CSS/JS? → Create in `quartz/static/`
3. Is this audio? → Create in `static/`
4. Output the full path and wait for confirmation

## Publishing

Content flows ONE DIRECTION:

```
中文VAULT/ → (publish.sh) → quartz-chinese/content/ → GitHub → Live site
```

To publish after vault changes:
```bash
~/publish.sh
```

## Site Details

- **URL:** chinese.garrettjamespeterson.com
- **GitHub:** garrettjamespeterson/quartz-chinese
- **Branch:** v4
- **Build:** GitHub Actions on push

## Dependencies

If adding new npm packages:
```bash
npm install [package] --save
git add package.json package-lock.json
git commit -m "Add [package] dependency"
```

Required: `pinyin-pro` (for zhongwen blocks)
