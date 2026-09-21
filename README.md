# FileThrough

Automatically prepares files for upload requirements - compresses images, converts formats, and resizes to meet platform constraints.

## Features

- **Smart Detection** - Automatically detects file input fields on any website
- **Auto Optimization** - Compresses images, converts formats (JPEG, PNG, WebP, AVIF), and resizes to fit requirements
- **Format Conversion** - Converts between image formats and PDFs to match platform specifications
- **Privacy First** - All processing happens locally in your browser. No files are uploaded to any server
- **Custom Rules** - Create custom transformation rules for specific sites or file types
- **Works Everywhere** - Compatible with GitHub, LinkedIn, Twitter, Facebook, and any site with file uploads

## Installation

### From Chrome Web Store (Recommended)
[Install FileThrough](https://chromewebstore.google.com/detail/filethrough)

### Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/yourusername/filethrough/releases)
2. Unzip the file
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the unzipped folder

## Development

### Prerequisites
- Node.js 18+
- pnpm

### Setup
```bash
pnpm install
```

### Development
```bash
pnpm dev
```

### Build for Production
```bash
pnpm build
```

### Create Zip for Chrome Web Store
```bash
pnpm zip
```

### Build Website
```bash
pnpm website:build
```

## Project Structure

```
filethrough/
├── entrypoints/
│   ├── popup/           # Extension popup UI
│   ├── options/         # Extension options page
│   ├── background.ts    # Background service worker
│   └── content.ts       # Content script for file detection
├── core/                # Core processing logic
│   ├── detector/        # Upload context detection
│   ├── inspector/       # File inspection
│   ├── parser/          # Constraint parsing
│   ├── planner/         # Transformation planning
│   ├── transformer/     # Image/PDF transformation
│   └── validator/       # File validation
├── website/             # Marketing website
└── public/              # Static assets (icons, website build output)
```

## Chrome Web Store Compliance

This extension is designed to meet Chrome Web Store requirements:

- ✅ Manifest V3
- ✅ Proper icons (16, 32, 48, 96, 128)
- ✅ Clear name, description, and version
- ✅ Privacy policy (/privacy)
- ✅ Terms of service (/terms)
- ✅ Minimal permissions (storage, activeTab, scripting, host_permissions)
- ✅ No remote code execution
- ✅ No external analytics/tracking
- ✅ Open source

## Privacy

FileThrough processes all files locally in your browser. No files, images, or documents are ever uploaded to our servers or any third-party servers.

See [Privacy Policy](https://filethrough.io/privacy) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Support

- GitHub Issues: [github.com/yourusername/filethrough/issues](https://github.com/yourusername/filethrough/issues)
- Email: support@filethrough.io