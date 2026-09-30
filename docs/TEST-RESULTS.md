# FileThrough Extension - Test Results

## Scope

This document records the upload-constraint detection tests that were run during development.

**Date:** September 25, 2026  
**Total tests recorded:** 43  
**Status:** All recorded detection tests passed.

The results are development test evidence, not a guarantee that FileThrough will work with every website or upload implementation.

## Test categories

### Upload constraint detection
The recorded tests cover file-size, dimension, and format patterns from HTML attributes and nearby page text.

### Real-world page patterns
The recorded suite includes examples representing common frameworks and upload implementations such as React, Vue, Angular, Bootstrap, Tailwind, Material UI, Dropzone-style components, and dynamically created inputs.

### Edge cases
The recorded tests include hidden inputs, multiple formats, dynamic inputs, nested structures, modals, internationalized text, and other parsing cases.

## Important product-scope note

FileThrough currently focuses on standard browser file inputs and automatic preparation of supported image and PDF files. Passing these tests does not mean every custom upload component or every file format is supported.

## Known limitations

- Constraint parsing is primarily optimized for English-language instructions.
- CSS pseudo-element content is not available as ordinary DOM text.
- Heavily customized or obfuscated upload implementations may require additional support.
- The extension should be tested against a specific website before claiming compatibility with that website.

## Test command

```bash
pnpm exec playwright test
```
