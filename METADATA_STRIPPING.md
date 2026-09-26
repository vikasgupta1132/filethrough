# EXIF and GPS Metadata Stripping

## Overview

FileThrough **automatically removes all EXIF and GPS metadata** from every image it processes. This happens by design as part of the canvas-based transformation pipeline.

## What Gets Removed

When FileThrough processes an image, it strips:

### Location Data
- ✅ GPS coordinates (latitude, longitude)
- ✅ GPS altitude
- ✅ GPS timestamp
- ✅ Location name/description

### Camera Information
- ✅ Camera make and model
- ✅ Lens information
- ✅ Camera settings (ISO, aperture, shutter speed, focal length)
- ✅ Flash settings
- ✅ White balance
- ✅ Exposure data

### Timestamps
- ✅ Date and time photo was taken
- ✅ Date and time of last modification
- ✅ Digitization date

### Personal Information
- ✅ Copyright and author information
- ✅ Artist/photographer name
- ✅ Software used to edit the image
- ✅ User comments
- ✅ Image description

### Other Metadata
- ✅ Orientation flag (image is auto-rotated instead)
- ✅ Thumbnail images
- ✅ Color space information
- ✅ Scene capture type
- ✅ Subject distance
- ✅ Device serial numbers

## How It Works

FileThrough uses HTML5 Canvas for all image transformations. When an image is:
1. **Loaded into memory** - Original file with all metadata
2. **Drawn to canvas** - Only pixel data is transferred
3. **Exported from canvas** - New image file with zero metadata

The canvas API intentionally does not preserve EXIF data. This is a **security feature** of the web platform that FileThrough leverages for user privacy.

## Technical Details

```typescript
// Every image transformation automatically strips metadata
const canvas = document.createElement('canvas');
canvas.width = image.naturalWidth;
canvas.height = image.naturalHeight;
const context = canvas.getContext('2d');

// This operation strips ALL metadata
context.drawImage(image, 0, 0);

// Export contains only pixel data
canvas.toBlob((blob) => {
  // blob has NO EXIF, NO GPS, NO metadata
}, 'image/jpeg');
```

## Privacy Benefits

### 1. **Location Privacy**
Photos taken with smartphones often contain GPS coordinates showing exactly where you were when the photo was taken. This can reveal:
- Your home address
- Your workplace
- Places you visit regularly
- Travel patterns

**FileThrough removes this automatically.**

### 2. **Equipment Privacy**
EXIF data can reveal:
- What camera/phone you use
- Serial numbers that uniquely identify your device
- When you purchased your equipment

**FileThrough removes this automatically.**

### 3. **Timestamp Privacy**
Photo timestamps can reveal:
- Your daily routines
- When you're away from home
- Travel dates

**FileThrough removes this automatically.**

### 4. **Identity Privacy**
Some images contain:
- Photographer's name
- Copyright holder information
- Software signatures

**FileThrough removes this automatically.**

## Real-World Examples

### Example 1: Job Application Photo

**Before FileThrough:**
```
Camera: iPhone 15 Pro Max
GPS: 37.7749° N, 122.4194° W (San Francisco)
Date: 2026-09-26 08:34:22
Software: iOS 18.0.1
```

**After FileThrough:**
```
(No metadata)
```

### Example 2: Profile Picture

**Before FileThrough:**
```
Camera: Canon EOS R5
Lens: RF 24-70mm f/2.8
Location: Home Studio (GPS coordinates)
Artist: John Doe
Copyright: © 2026 John Doe Photography
```

**After FileThrough:**
```
(No metadata)
```

### Example 3: Product Photo for E-commerce

**Before FileThrough:**
```
Camera: Sony α7 IV
Serial Number: 1234567890
GPS: 34.0522° N, 118.2437° W
Date: 2026-09-20 14:23:10
Software: Adobe Lightroom Classic 13.0
```

**After FileThrough:**
```
(No metadata)
```

## Verification

You can verify metadata removal using tools like:

- **ExifTool** (command line):
  ```bash
  exiftool image.jpg
  # Before: Shows all metadata
  # After: Shows only basic image properties
  ```

- **Online EXIF viewers**:
  - https://exifdata.com/
  - https://jimpl.com/
  
- **Browser extensions**:
  - EXIF Viewer (Chrome/Firefox)
  - Exif Viewer (Firefox)

## When Metadata Is Preserved

FileThrough only processes images when they need transformation:
- If an image already meets all upload requirements
- And no transformation is needed
- The original file is uploaded unchanged (with metadata intact)

To **force metadata removal** even for compliant images, we could add a "Strip Metadata" toggle in settings (future enhancement).

## Comparison with Other Tools

| Tool | Strips EXIF | Strips GPS | Works Offline | Automatic |
|------|-------------|------------|---------------|-----------|
| FileThrough | ✅ | ✅ | ✅ | ✅ |
| ImageOptim | ✅ | ✅ | ✅ | ❌ Manual |
| TinyPNG | ✅ | ✅ | ❌ Server | ❌ Manual |
| ExifTool | ✅ | ✅ | ✅ | ❌ Manual |
| Photoshop | ⚠️ Optional | ⚠️ Optional | ✅ | ❌ Manual |

## Privacy Guarantee

**FileThrough's metadata removal is:**
- ✅ **Automatic** - Happens on every transformation
- ✅ **Local** - No data sent to servers
- ✅ **Complete** - All metadata removed, not just GPS
- ✅ **Transparent** - Open source code you can verify
- ✅ **Secure** - Uses browser's built-in canvas API

## Technical Limitations

**What FileThrough CANNOT remove:**
- Watermarks embedded in pixels
- Steganographic data hidden in image data
- Visual information in the image itself (faces, text, landmarks)

**Note:** Even without EXIF data, images can reveal information through their visual content. Be mindful of what appears in your photos.

## Future Enhancements

Potential improvements:
- [ ] Toggle to strip metadata from already-compliant images
- [ ] Show metadata preview before/after
- [ ] Warning when uploading images with GPS data
- [ ] Option to preserve selected metadata (e.g., copyright)
- [ ] Metadata stripping for videos (future feature)

## Standards Compliance

FileThrough's metadata stripping complies with:
- ✅ GDPR (EU data protection)
- ✅ CCPA (California privacy law)
- ✅ Privacy by design principles
- ✅ W3C canvas specification

## FAQ

**Q: Does FileThrough sell my metadata?**
A: No. All processing is local. FileThrough never sees your files or metadata.

**Q: Can I keep some metadata?**
A: Currently, no. All transformations strip all metadata. This is intentional for maximum privacy.

**Q: What about PNG files?**
A: PNG files can also contain metadata (tEXt, iTXt, zTXt chunks). FileThrough strips these too.

**Q: Does this slow down processing?**
A: No. Metadata stripping is a natural side effect of canvas processing, not an extra step.

**Q: Can I verify metadata is gone?**
A: Yes! Use any EXIF viewer tool on the processed image. You'll see it contains no metadata.

## Related Documentation

- [Privacy Policy](../docs/privacy.html)
- [Performance Optimizations](./PERFORMANCE_OPTIMIZATIONS.md)
- [Enhanced Parsing](./ENHANCED_PARSING.md)
