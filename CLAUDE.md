# quartz-chinese - Claude Code Instructions

## What This Is

**Quartz build system** for chinese.mugwortmilfoil.com

This is NOT where lesson content lives. Lesson `.md` files belong in the Obsidian vault.

---

## Critical Paths

| Purpose | Path |
|---------|------|
| Lesson content (SOURCE) | `/Users/garebear/Library/CloudStorage/ProtonDrive-grandmascooking@protonmail.com-folder/中文VAULT/` |
| This Quartz site | `~/quartz-chinese/` |
| Publish script | `~/publish.sh` |

---

## ⚠️ WARNING: content/ Folder

The `content/` folder gets **WIPED AND REBUILT** every time `publish.sh` runs.

**NEVER create lesson files in `~/quartz-chinese/content/`**

They will be deleted on the next publish.

---

## What DOES Belong Here

### Audio Files
```
~/quartz-chinese/static/audio/
├── lesson_01.mp3
├── lesson_02.mp3
├── L01/
│   ├── 這是Kevin_.mp3
│   └── ...
└── L02/
    └── ...
```

Referenced in lessons as `/static/audio/filename.mp3`

### Custom CSS
```
~/quartz-chinese/quartz/static/*.css
```
Bundled into the site build.

### Quartz Plugins
```
~/quartz-chinese/quartz/plugins/transformers/
```

Installed plugins:
- `AudioLines.ts` - Clickable audio playback
- `zhongwen.ts` - Chinese + pinyin rendering (zh-cn blocks)
- `TypingInputs.ts` - Interactive typing practice
- `MultipleChoice.ts` - Quiz questions

### Configuration
```
~/quartz-chinese/quartz.config.ts
```

---

## File Creation Rules

| File Type | Create In |
|-----------|-----------|
| Lesson `.md` | **VAULT** (not here!) |
| Audio `.mp3` | `static/audio/` |
| Lesson CSS | `quartz/static/` |
| New plugins | `quartz/plugins/transformers/` |

---

## Pre-Flight Check

Before creating ANY file:
1. Is this a `.md` lesson file? → **STOP. Create in vault instead.**
2. Is this audio? → Create in `static/audio/`
3. Is this CSS? → Create in `quartz/static/`
4. Is this a plugin? → Create in `quartz/plugins/transformers/`

---

## Publishing Flow

Content flows ONE DIRECTION:

```
中文VAULT/ → (publish.sh) → quartz-chinese/content/ → GitHub → Live site
```

To publish after vault changes:
```bash
~/publish.sh
```

---

## Site Details

| Attribute | Value |
|-----------|-------|
| URL | chinese.mugwortmilfoil.com |
| GitHub | garrettjamespeterson/quartz-chinese |
| Branch | v4 |
| Build | GitHub Actions on push |

---

## Dependencies

If adding npm packages:
```bash
npm install [package] --save
git add package.json package-lock.json
git commit -m "Add [package] dependency"
```

Required: `pinyin-pro` (for zh-cn blocks)
