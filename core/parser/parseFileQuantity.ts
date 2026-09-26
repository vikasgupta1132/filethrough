import type { UploadConstraints } from './types';

export function parseFileQuantity(
    text: string
): Pick<UploadConstraints, 'maxFiles' | 'minFiles' | 'required'> {
    const normalizedText = text
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    const result: Pick<UploadConstraints, 'maxFiles' | 'minFiles' | 'required'> = {};

    // --------------------------------------------------
    // 1. MAXIMUM FILE COUNT
    // --------------------------------------------------
    // Examples:
    // "Up to a maximum of 5"
    // "Maximum 10 files"
    // "Max 3 images"
    // "You can upload up to 5 files"
    // "Upload up to 10 images"

    const maxPatterns = [
        /up\s+to\s+(?:a\s+)?maximum\s+of\s+(\d+)/i,
        /maximum\s+(?:of\s+)?(\d+)\s+(?:files?|images?|photos?)/i,
        /max\s+(?:of\s+)?(\d+)\s+(?:files?|images?|photos?)/i,
        /(?:upload\s+)?up\s+to\s+(\d+)\s+(?:files?|images?|photos?)/i,
        /(?:select|choose)\s+up\s+to\s+(\d+)/i,
    ];

    for (const pattern of maxPatterns) {
        const match = normalizedText.match(pattern);
        if (match && match[1]) {
            const count = Number.parseInt(match[1], 10);
            if (count > 0 && count <= 1000) {
                result.maxFiles = count;
                break;
            }
        }
    }

    // --------------------------------------------------
    // 2. MINIMUM FILE COUNT
    // --------------------------------------------------
    // Examples:
    // "At least 1 is required"
    // "Minimum 3 files"
    // "Must upload at least 2 images"
    // "Requires at least one"

    const minPatterns = [
        /at\s+least\s+(?:one|1)\s+(?:is\s+)?required/i,
        /at\s+least\s+(\d+)\s+(?:is\s+|are\s+)?required/i,
        /minimum\s+(?:of\s+)?(\d+)\s+(?:files?|images?|photos?)/i,
        /min\s+(?:of\s+)?(\d+)\s+(?:files?|images?|photos?)/i,
        /must\s+upload\s+at\s+least\s+(\d+)/i,
        /requires?\s+at\s+least\s+(\d+)/i,
        /at\s+least\s+(\d+)/i,
    ];

    for (const pattern of minPatterns) {
        const match = normalizedText.match(pattern);
        if (match) {
            // Check for "at least one" specifically
            if (pattern.source.includes('one')) {
                result.minFiles = 1;
                result.required = true;
                break;
            }

            if (match[1]) {
                const count = Number.parseInt(match[1], 10);
                if (count > 0 && count <= 1000) {
                    result.minFiles = count;
                    result.required = count > 0;
                    break;
                }
            }
        }
    }

    // --------------------------------------------------
    // 3. REQUIRED FIELD DETECTION
    // --------------------------------------------------
    // Examples:
    // "Required"
    // "This field is required"
    // "* Required"
    // "Mandatory"

    if (!result.required) {
        const requiredPatterns = [
            /\brequired\b/i,
            /\bmandatory\b/i,
            /\*\s*required/i,
            /field\s+is\s+required/i,
            /must\s+(?:be\s+)?(?:upload|provide)/i,
        ];

        for (const pattern of requiredPatterns) {
            if (pattern.test(normalizedText)) {
                result.required = true;
                if (!result.minFiles) {
                    result.minFiles = 1;
                }
                break;
            }
        }
    }

    // --------------------------------------------------
    // 4. OPTIONAL FIELD DETECTION
    // --------------------------------------------------
    // Examples:
    // "Optional"
    // "Not required"

    const optionalPatterns = [
        /\boptional\b/i,
        /not\s+required/i,
    ];

    for (const pattern of optionalPatterns) {
        if (pattern.test(normalizedText)) {
            result.required = false;
            break;
        }
    }

    return result;
}
