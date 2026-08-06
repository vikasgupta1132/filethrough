import type { UploadConstraints } from './types';

export function parseDimensions(
    text: string
): UploadConstraints['dimensions'] | undefined {

    const normalizedText = text
        .replace(/\s+/g, ' ')
        .trim();

    // Examples:
    // Dimensions: 200 x 230 pixels
    // 200x230 px
    // 200 × 230 pixels
    // Image size: 200 X 230

    const patterns = [
        /(?:dimensions?|image\s+dimensions?|image\s+size)\s*:?\s*(\d+)\s*[x×]\s*(\d+)\s*(?:px|pixels?)?/i,

        /(\d+)\s*[x×]\s*(\d+)\s*(?:px|pixels?)/i,
    ];

    for (const pattern of patterns) {
        const match = normalizedText.match(pattern);

        if (match) {
            const width = match[1];
            const height = match[2];

            if (!width || !height) {
                continue;
            }

            return {
                width: Number.parseInt(width, 10),
                height: Number.parseInt(height, 10),
            };
        }
    }

    return undefined;
}