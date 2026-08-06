import type { UploadContext } from '../detector/extractUploadContext';

export function parseFormats(
    context: UploadContext
): string[] {
    const formats = new Set<string>();

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
        'pdf',
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

    return Array.from(formats);
}