# r00t Clip — Build Instructions

## Requirements
- Node.js 18+
- npm

## Run in dev

```bash
cd tools/r00t-clip
npm install
npm start
```

## Build Windows installer (.exe)

```bash
npm run build
```

Output: `dist/r00t Clip Setup 1.0.0.exe`

## App icon

Place a 256×256 `.ico` file at `assets/icon.ico` before building.
You can convert any PNG to ICO at https://icoconvert.com/

## What gets saved

Clips are saved to `C:\Users\<you>\r00t-clip\clips.txt` by default.
You can change the path inside the app.

Each entry looks like:
```
[2026-05-16 14:32:01]
Your copied text here
────────────────────────────────────────────────
```

Notes saved manually are marked `[NOTE]`.
