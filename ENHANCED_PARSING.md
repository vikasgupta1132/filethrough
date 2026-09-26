# Enhanced Constraint Parsing Features

## Overview

FileThrough now intelligently parses complex upload requirements that real websites use, including multiple dimension options, file quantity limits, format-specific constraints, and required/optional indicators.

## New Features Added (2026-09-26)

### 1. **Multiple Dimension Options**

Websites often provide multiple acceptable dimension choices (e.g., "1,280 x 800 or 640 x 400"). FileThrough now:

- Parses all dimension options from text
- Automatically selects the best fit based on the original image's aspect ratio
- Falls back to the first (usually largest) option if aspect ratios are equal

**Example Input:**
```
Image dimensions: 1,280 x 800 or 640 x 400
Accepted sizes: 1920x1080 or 1280x720 or 640x480
```

**Parsed Output:**
```typescript
{
  dimensions: { width: 1280, height: 800 },
  dimensionOptions: [
    { width: 1280, height: 800 },
    { width: 640, height: 400 }
  ]
}
```

### 2. **File Quantity Constraints**

Parses minimum and maximum file count requirements:

**Patterns Detected:**
- "Up to a maximum of 5"
- "Maximum 10 files"
- "Upload up to 3 photos"
- "At least one is required"
- "Minimum 2 files"
- "Must upload at least 3 images"

**Example Input:**
```
Up to a maximum of 5
At least one is required
```

**Parsed Output:**
```typescript
{
  maxFiles: 5,
  minFiles: 1,
  required: true
}
```

### 3. **Format-Specific Constraints**

#### PNG Constraints

Detects PNG-specific requirements like bit depth and alpha channel restrictions:

**Patterns Detected:**
- "24-bit PNG (no alpha)"
- "32-bit PNG"
- "PNG without transparency"
- "PNG without alpha"
- "Opaque PNG"

**Example Input:**
```
JPEG or 24-bit PNG (no alpha)
```

**Parsed Output:**
```typescript
{
  allowedFormats: ['jpeg', 'png'],
  formatConstraints: {
    png: {
      bitDepth: 24,
      noAlpha: true
    }
  }
}
```

**Behavior:**
- 24-bit PNG automatically implies `noAlpha: true`
- If PNG needs no alpha and file has alpha, converts to JPEG (if allowed)
- Otherwise removes alpha channel

#### JPEG Constraints

Detects JPEG quality requirements:

**Patterns Detected:**
- "JPEG quality 90%"
- "High quality JPEG"

**Example Input:**
```
JPEG quality: 85%
```

**Parsed Output:**
```typescript
{
  formatConstraints: {
    jpeg: {
      quality: 85
    }
  }
}
```

### 4. **Required/Optional Field Detection**

Automatically detects if a file upload is required or optional:

**Required Patterns:**
- "Required"
- "* Required"
- "This field is required"
- "Mandatory"
- "Must upload"
- "Must provide"

**Optional Patterns:**
- "Optional"
- "Not required"

**Example:**
```typescript
// "Profile picture (required)" →
{ required: true, minFiles: 1 }

// "Additional documents (optional)" →
{ required: false }
```

## Real-World Example

### Input (from a typical upload form):

```
Product Images
Up to a maximum of 5
1,280 x 800 or 640 x 400
JPEG or 24-bit PNG (no alpha)
At least one is required
```

### Parsed Constraints:

```typescript
{
  // Dimensions
  dimensions: { width: 1280, height: 800 },
  dimensionOptions: [
    { width: 1280, height: 800 },
    { width: 640, height: 400 }
  ],
  
  // Formats
  allowedFormats: ['jpeg', 'png'],
  formatConstraints: {
    png: {
      bitDepth: 24,
      noAlpha: true
    }
  },
  
  // Quantity
  maxFiles: 5,
  minFiles: 1,
  required: true
}
```

### How FileThrough Responds:

For an uploaded PNG image with transparency (2500x1500, 4MB):

1. **Dimension Selection**: Chooses 1280x800 (matches 16:10 aspect ratio better than 640x400)
2. **Format Handling**: Detects PNG has alpha channel, converts to JPEG (allowed format, no alpha issues)
3. **Resize**: Scales to 1280x800
4. **Compress**: Reduces to meet any size constraints
5. **Result**: JPEG, 1280x800, optimized file size, no alpha channel

## Technical Implementation

### Updated Types

```typescript
interface UploadConstraints {
  // Existing
  minBytes?: number;
  maxBytes?: number;
  allowedFormats?: string[];
  dimensions?: { width: number; height: number };
  
  // New
  dimensionOptions?: Array<{ width: number; height: number }>;
  maxFiles?: number;
  minFiles?: number;
  required?: boolean;
  formatConstraints?: {
    png?: {
      noAlpha?: boolean;
      bitDepth?: number;
    };
    jpeg?: {
      quality?: number;
    };
  };
}
```

### New Parser Functions

1. **`parseFileQuantity(text: string)`** - Parses min/max file counts and required status
2. **Enhanced `parseDimensions(text: string)`** - Now detects multiple dimension options
3. **Enhanced `parseFormats(context: UploadContext)`** - Now detects format-specific constraints

### Updated Planner Logic

The transformation planner now:

- Selects best dimension from multiple options based on aspect ratio
- Handles PNG alpha removal (converts to JPEG or removes alpha)
- Respects format-specific constraints during conversion
- Prefers JPEG when PNG needs no alpha

## Browser Compatibility

All parsing runs client-side with no external dependencies. Works in all modern browsers that support:
- RegExp with named groups
- Array.from()
- Set()

## Testing

Run the test suite:

```bash
pnpm test core/parser/__tests__/enhanced-parsing.test.ts
```

Tests cover:
- ✅ Multiple dimension options with "or"
- ✅ 24-bit PNG (no alpha) detection
- ✅ PNG transparency constraints
- ✅ File quantity limits ("up to maximum of 5")
- ✅ Required field detection ("at least one is required")
- ✅ Complete real-world example parsing

## Performance

All parsing operations are:
- **Fast**: Regex-based, runs in <5ms for typical input
- **Non-blocking**: Runs during upload detection, not during transformation
- **Memory efficient**: No external libraries, minimal allocations

## Future Enhancements

Potential additions:
- [ ] Aspect ratio constraints ("16:9 only")
- [ ] Color space requirements ("sRGB", "Adobe RGB")
- [ ] DPI/PPI constraints ("300 DPI minimum")
- [ ] File naming patterns ("alphanumeric only")
- [ ] Date-based constraints ("photos from last 30 days")

## Examples from Real Websites

### E-commerce Sites
```
Product photos: Up to 8 images
1200x1200 or 800x800 or 600x600
JPEG or PNG (no transparency)
At least 1 main image required
```

### Government Portals
```
Photo requirements:
Size: 2 x 2 inches (51 x 51 mm) or 600 x 600 pixels
JPEG format only
File size: 240 KB maximum
```

### Job Sites
```
Profile picture
Dimensions: 400x400 or 200x200
JPEG or PNG
Optional
Maximum file size: 2 MB
```

### College Applications
```
Supporting documents
Up to a maximum of 5 files
PDF or JPEG
At least one transcript required
```

All of these complex requirements are now automatically parsed and handled by FileThrough!
