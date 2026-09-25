import type { UploadConstraints } from './types';

function toBytes(value: number, unit: string): number {
    const normalizedUnit = unit.toLowerCase();

    switch (normalizedUnit) {
        case 'kb':
            return Math.round(value * 1024);

        case 'mb':
            return Math.round(value * 1024 * 1024);

        case 'gb':
            return Math.round(value * 1024 * 1024 * 1024);

        default:
            return Math.round(value);
    }
}

export function parseFileSize(text: string): UploadConstraints {
    const result: UploadConstraints = {};

    const normalizedText = text
        .replace(/\s+/g, ' ')
        .trim();

    // --------------------------------------------------
    // 1. RANGE PATTERNS
    // --------------------------------------------------

    // Examples:
    // 20 KB to 100 KB
    // 20KB - 100KB
    // Between 50 KB and 200 KB

    const rangePatterns = [
        /between\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)\s+and\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i,

        /(\d+(?:\.\d+)?)\s*(kb|mb|gb)\s*(?:to|-|–|—)\s*(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i,
    ];

    for (const pattern of rangePatterns) {
        const match = normalizedText.match(pattern);

        if (match) {
            const minValue = match[1];
            const minUnit = match[2];
            const maxValue = match[3];
            const maxUnit = match[4];

            if (!minValue || !minUnit || !maxValue || !maxUnit) {
                continue;
            }

            result.minBytes = toBytes(
                Number.parseFloat(minValue),
                minUnit
            );

            result.maxBytes = toBytes(
                Number.parseFloat(maxValue),
                maxUnit
            );

            return result;
        }
    }

    // --------------------------------------------------
    // 2. MAXIMUM PATTERNS
    // --------------------------------------------------

    // Examples:
    // Maximum file size: 200 KB
    // Max size 2 MB
    // File size should not exceed 500 KB
    // File must be under 300 KB
    // Less than 1 MB

    const maxPatterns = [
        /(?:maximum|max)\s+(?:file\s+)?size\s*:?\s*(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i,

        /(?:file\s+)?size\s+(?:should\s+)?not\s+exceed\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i,

        /(?:file\s+)?(?:must\s+be\s+)?under\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i,

        /less\s+than\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i,

        /(?:max|maximum)\s*[:\.]?\s*(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i,

        /up\s+to\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i,
    ];

    for (const pattern of maxPatterns) {
        const match = normalizedText.match(pattern);


        if (match) {
            const value = match[1];
            const unit = match[2];

            if (!value || !unit) {
                continue;
            }

            result.maxBytes = toBytes(
                Number.parseFloat(value),
                unit
            );

            return result;
        }
    }

    return result;
}