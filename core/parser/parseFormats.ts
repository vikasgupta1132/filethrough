import type { UploadContext } from '../detector/extractUploadContext';
import type { UploadConstraints } from './types';

export function parseFormats(
    context: UploadContext
): Pick<UploadConstraints, 'allowedFormats' | 'formatConstraints'> {
    const formats = new Set<string>();
    const formatConstraints: UploadConstraints['formatConstraints'] = {};

    // Highest-confidence source: HTML accept attribute
    if (context.accept) {
        const acceptParts = context.accept.split(',');

        for (const part of acceptParts) {
            const value = part.trim().toLowerCase();

            if (value.startsWith('.')) {
                formats.add(value.slice(1));
            }

            if (value === 'image/jpeg') {
                formats.add('jpg');
                formats.add('jpeg');
            }

            if (value === 'image/png') {
                formats.add('png');
            }

            if (value === 'image/webp') {
                formats.add('webp');
            }

            if (value === 'application/pdf') {
                formats.add('pdf');
            }
        }
    }

    // Second source: nearby instructions
    const text = context.nearbyText.toLowerCase();

    const knownFormats = [
        'jpg',
        'jpeg',
        'png',
        'webp',
        'gif',
        'bmp',
        'tiff',
        'pdf',
        'heic',
        'avif',
    ];

    for (const format of knownFormats) {
        const pattern = new RegExp(
            `\\b${format}\\b`,
            'i'
        );

        if (pattern.test(text)) {
            formats.add(format);
        }
    }

    // --------------------------------------------------
    // Parse PNG-specific constraints
    // --------------------------------------------------
    // Examples:
    // "24-bit PNG (no alpha)"
    // "PNG without transparency"
    // "32-bit PNG"

    if (formats.has('png')) {
        formatConstraints.png = {};

        // Check for bit depth
        const bitDepthMatch = text.match(/(\d+)-?bit\s+png/i);
        if (bitDepthMatch) {
            const bitDepth = Number.parseInt(bitDepthMatch[1], 10);
            if (bitDepth === 24 || bitDepth === 32 || bitDepth === 8) {
                formatConstraints.png.bitDepth = bitDepth;
            }
        }

        // Check for "no alpha" or "no transparency"
        const noAlphaPatterns = [
            /no\s+alpha/i,
            /without\s+alpha/i,
            /no\s+transparency/i,
            /without\s+transparency/i,
            /opaque/i,
        ];

        for (const pattern of noAlphaPatterns) {
            if (pattern.test(text)) {
                formatConstraints.png.noAlpha = true;
                break;
            }
        }

        // 24-bit PNG implies no alpha channel
        if (formatConstraints.png.bitDepth === 24) {
            formatConstraints.png.noAlpha = true;
        }
    }

    // --------------------------------------------------
    // Parse JPEG-specific constraints
    // --------------------------------------------------
    // Examples:
    // "JPEG quality 90%"
    // "High quality JPEG"

    if (formats.has('jpeg') || formats.has('jpg')) {
        const qualityMatch = text.match(/(?:jpeg|jpg)\s+quality\s*:?\s*(\d+)%?/i);
        if (qualityMatch) {
            const quality = Number.parseInt(qualityMatch[1], 10);
            if (quality >= 1 && quality <= 100) {
                formatConstraints.jpeg = { quality };
            }
        }
    }

    return {
        allowedFormats: formats.size > 0 ? Array.from(formats) : undefined,
        formatConstraints: Object.keys(formatConstraints).length > 0 ? formatConstraints : undefined,
    };
}
