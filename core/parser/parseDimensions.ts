import type { UploadConstraints } from './types';

export function parseDimensions(
    text: string
): Pick<UploadConstraints, 'dimensions' | 'dimensionOptions'> {
    const normalizedText = text
        .replace(/\s+/g, ' ')
        .trim();

    const result: Pick<UploadConstraints, 'dimensions' | 'dimensionOptions'> = {};

    // --------------------------------------------------
    // 1. MULTIPLE DIMENSION OPTIONS
    // --------------------------------------------------
    // Examples:
    // 1,280 x 800 or 640 x 400
    // 1920x1080 or 1280x720 or 640x480
    // Dimensions: 200x200 or 400x400

    const multiplePattern = /(\d{1,5})\s*[x×X]\s*(\d{1,5})(?:\s+or\s+(\d{1,5})\s*[x×X]\s*(\d{1,5}))+/gi;
    const multipleMatches = normalizedText.matchAll(multiplePattern);

    for (const match of multipleMatches) {
        const options: Array<{ width: number; height: number }> = [];
        const fullMatch = match[0];

        // Extract all dimension pairs from the matched text
        const dimensionPattern = /(\d{1,5})\s*[x×X]\s*(\d{1,5})/gi;
        const dimensionMatches = fullMatch.matchAll(dimensionPattern);

        for (const dimMatch of dimensionMatches) {
            const width = Number.parseInt(dimMatch[1], 10);
            const height = Number.parseInt(dimMatch[2], 10);

            if (width > 0 && height > 0 && width <= 99999 && height <= 99999) {
                options.push({ width, height });
            }
        }

        if (options.length >= 2) {
            result.dimensionOptions = options;
            // Use the first (typically largest) as the default
            result.dimensions = options[0];
            return result;
        }
    }

    // --------------------------------------------------
    // 2. SINGLE DIMENSION WITH CONTEXT
    // --------------------------------------------------
    // Examples:
    // Dimensions: 200 x 230 pixels
    // 200x230 px
    // 200 × 230 pixels
    // Image size: 200 X 230
    // Recommended: 1280 x 800

    const patterns = [
        /(?:dimensions?|image\s+dimensions?|image\s+size|recommended\s+size|recommended|size)\s*:?\s*(\d{1,5})\s*[x×X]\s*(\d{1,5})\s*(?:px|pixels?)?/i,

        /(\d{1,5})\s*[x×X]\s*(\d{1,5})\s*(?:px|pixels?|image)/i,

        /(\d{1,5})\s*[x×X]\s*(\d{1,5})/i,
    ];

    for (const pattern of patterns) {
        const match = normalizedText.match(pattern);

        if (match) {
            const width = Number.parseInt(match[1], 10);
            const height = Number.parseInt(match[2], 10);

            if (width > 0 && height > 0 && width <= 99999 && height <= 99999) {
                result.dimensions = { width, height };
                return result;
            }
        }
    }

    return result;
}
