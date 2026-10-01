# FileThrough

**FileThrough** is a browser extension that automatically prepares files to meet website upload requirements.

It detects file-upload fields, reads available upload constraints, and can transform selected images and PDFs by converting formats, resizing, and compressing them before the file is submitted.

## Features

* **Automatic upload detection** — Detects `<input type="file">` fields on web pages, including dynamically added upload fields.
* **Constraint detection** — Reads upload requirements from HTML attributes and nearby page instructions, including supported formats, file-size limits, and image dimensions.
* **Automatic transformation** — Creates a transformation plan based on the detected requirements.
* **Image processing** — Resizes and compresses supported image files to meet upload constraints.
* **Format conversion** — Converts images between supported output formats such as JPEG, PNG, and WebP when required.
* **PDF processing** — Supports PDF transformation and size handling when PDF upload requirements are detected.
* **Validation** — Validates the processed file against the detected requirements before replacing the selected upload file.
* **Dynamic page support** — Watches for file-upload inputs added to the page after initial page load.
* **Custom transformation rules** — Provides an Options page for configuring transformation plans and automatic processing behavior.
* **Local processing** — File processing is performed locally in the browser; the extension does not require uploading files to a FileThrough server.
* **Processed-file download** — The extension popup can download the most recently processed file.

## How It Works

FileThrough follows a processing pipeline:

```text
Upload Field
     ↓
Detect Upload Context
     ↓
Parse Requirements
     ↓
Inspect Selected File
     ↓
Validate File
     ↓
Create Transformation Plan
     ↓
Transform File
     ↓
Compress if Required
     ↓
Validate Again
     ↓
Replace Upload File
```

When a user selects a file, FileThrough analyzes the upload field and the selected file. If the file already satisfies the detected requirements, it can remain unchanged. Otherwise, FileThrough creates a transformation plan and processes the file.

The processed file is then validated again before it is injected back into the upload field.

## Supported Requirements

FileThrough can detect requirements from sources such as:

* HTML `accept` attributes
* Nearby upload instructions
* File-size requirements
* Image dimension requirements
* Supported image formats
* PDF requirements
* Certain format-specific instructions

The format parser currently recognizes formats including:

* JPEG / JPG
* PNG
* WebP
* GIF
* BMP
* TIFF
* HEIC
* AVIF
* PDF

Not every listed format is necessarily a supported **output transformation format**. The formats that FileThrough can generate depend on the transformation pipeline implemented for the specific file type.

## Image Processing

For image uploads, FileThrough can perform operations such as:

* Format conversion
* Resizing
* Compression
* Minimum file-size handling
* Maximum file-size handling
* Post-transformation validation

PNG compression uses a dedicated PNG encoder rather than relying only on the browser canvas quality parameter.

## PDF Processing

FileThrough also includes PDF processing using `pdf-lib` and PDF-related browser functionality.

PDF processing can include:

* PDF transformation
* PDF size reduction
* PDF minimum-size handling
* Final validation against detected file-size requirements

PDF processing is performed locally in the browser.

## Automatic Processing

FileThrough automatically monitors pages for file-upload inputs.

It handles:

1. File inputs already present when the page loads.
2. File inputs added dynamically after page load.
3. Multiple upload fields on the same page.
4. Files selected by the user through those upload fields.
5. Re-validation after transformation.

FileThrough avoids re-registering the same upload input more than once.

## Options

FileThrough includes an Options page where users can configure:

* Whether automatic processing is enabled.
* Whether files should be automatically processed on upload pages.
* A maximum file size setting.
* Custom transformation plans.

Transformation plans can currently define operations such as:

* Output format
* Resize width
* Resize height
* Maximum file size

Settings are stored using browser extension storage.

## Privacy

FileThrough is designed around local processing.

Files selected through supported upload fields are processed in the browser rather than being uploaded to a FileThrough processing server.

The extension does not require an external file-processing service to perform its core transformations.

For more information, see the [FileThrough Privacy Policy](https://getfilethrough.com/privacy).

## Permissions

The current extension manifest requests the following permissions:

* **`storage`** — Used to store extension settings.
* **`downloads`** — Used by the popup to allow users to download the most recently processed file.
* **Host permission for `<all_urls>`** — Required so the content script can detect and process file-upload fields on web pages.

FileThrough does **not** currently request the `scripting` permission.

## Technology Stack

FileThrough is built with:

* **TypeScript**
* **React**
* **WXT**
* **Vite** through the WXT build system
* **pdf-lib** for PDF manipulation
* **pdfjs-dist** for PDF-related browser functionality
* **UPNG.js** for PNG encoding/compression
* **Playwright** for browser testing

## Project Structure

```text
filethrough/
├── entrypoints/
│   ├── popup/              # Extension popup UI
│   ├── options/            # Extension options page
│   ├── background.ts       # Background service worker
│   └── content.ts         # File-upload detection and processing
│
├── core/
│   ├── detector/           # Upload context detection
│   ├── inspector/          # File inspection
│   ├── parser/             # Upload constraint parsing
│   ├── planner/            # Transformation planning
│   ├── transformer/        # Image and PDF transformation
│   ├── validator/          # File validation
│   └── types/              # Shared type declarations
│
├── tests/                  # Playwright tests
├── website/                # FileThrough website
├── public/                 # Static extension assets
├── test-upload.html        # Local upload testing page
├── playwright.config.ts    # Playwright configuration
├── wxt.config.ts           # WXT and extension configuration
├── package.json            # Project configuration and scripts
└── README.md
```

## Development

### Prerequisites

* Node.js
* pnpm
* Git

### Install Dependencies

```bash
pnpm install
```

### Start Development Mode

```bash
pnpm dev
```

For Firefox development:

```bash
pnpm dev:firefox
```

### Type Check

```bash
pnpm compile
```

### Build for Production

```bash
pnpm build
```

For a Firefox production build:

```bash
pnpm build:firefox
```

### Create Distribution ZIP

```bash
pnpm zip
```

For Firefox:

```bash
pnpm zip:firefox
```

## Testing

FileThrough includes Playwright-based browser tests.

Install the Playwright browser required for testing:

```bash
pnpm exec playwright install chromium
```

Run the test suite with:

```bash
pnpm exec playwright test
```

For interactive testing:

```bash
pnpm exec playwright test --headed
```

The repository also contains `test-upload.html`, which can be used to manually test upload-field detection and file processing behavior.

## Website

The project includes a separate website under:

```text
website/
```

Website development:

```bash
pnpm website:dev
```

Website production build:

```bash
pnpm website:build
```

The website can be deployed using the project's configured deployment tooling.

## Chrome Web Store

FileThrough is built as a Manifest V3 browser extension.

The production extension includes:

* Manifest V3
* Extension icons
* Popup
* Options page
* Background service worker
* Content script
* Local file-processing functionality

Before publishing a new version, verify the generated production build and Chrome Web Store permissions/data disclosures against the actual implementation.

## Manual Installation

To test a production build locally:

1. Build the extension:

```bash
pnpm build
```

2. Open Chrome:

```text
chrome://extensions/
```

3. Enable **Developer mode**.

4. Click **Load unpacked**.

5. Select the generated Chrome build directory:

```text
.output/chrome-mv3
```

For development, WXT can also launch the extension directly with:

```bash
pnpm dev
```

## Contributing

Contributions are welcome.

A typical workflow is:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Run type checking and tests.
5. Build the extension.
6. Verify the generated extension manually when appropriate.
7. Submit a pull request.

Before submitting changes, make sure documentation and configuration remain consistent with the actual implementation.

## Support

For bug reports, feature requests, and technical issues, use the GitHub issue tracker:

https://github.com/vikasgupta1132/filethrough/issues

For general information about FileThrough:

https://getfilethrough.com

## License

FileThrough is released under the MIT License.

See [LICENSE](LICENSE) for the complete license text.

---

**Repository:** https://github.com/vikasgupta1132/filethrough

**Website:** https://getfilethrough.com

**License:** MIT
