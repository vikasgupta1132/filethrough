import type { UploadConstraints } from '../parser/types';
import type { FileInfo } from '../inspector/inspectFile';
import type { TransformationPlan } from './types';

export function createTransformationPlan(
    file: FileInfo,
    constraints: UploadConstraints
): TransformationPlan {
    const plan: TransformationPlan = {};
    const isPdf = file.mimeType === 'application/pdf';
    const isImage = file.mimeType.startsWith('image/');

    // ----------------------------------------
    // Format conversion
    // ----------------------------------------

    if (
        constraints.allowedFormats &&
        constraints.allowedFormats.length > 0
    ) {
        const currentFormat = file.extension.toLowerCase();

        const formatAllowed =
            constraints.allowedFormats.includes(currentFormat);

        if (!formatAllowed) {
            const targetFormat = chooseTargetFormat(
                constraints.allowedFormats,
                isPdf,
                constraints.formatConstraints
            );

            if (targetFormat) {
                plan.convertTo = targetFormat;
            }
        } else {
            // Format is allowed, but check if we need to convert due to format-specific constraints
            const needsConversion = checkFormatConstraints(
                currentFormat,
                constraints.formatConstraints
            );

            if (needsConversion) {
                plan.convertTo = chooseTargetFormat(
                    constraints.allowedFormats,
                    isPdf,
                    constraints.formatConstraints
                );
            }
        }
    }

    // ----------------------------------------
    // Dimensions (for images and PDFs)
    // ----------------------------------------

    if (isImage || isPdf) {
        let targetDimensions: { width: number; height: number } | undefined;

        // Check if we have multiple dimension options
        if (constraints.dimensionOptions && constraints.dimensionOptions.length > 0) {
            // Find the best fitting dimension option
            targetDimensions = chooseBestDimension(
                file,
                constraints.dimensionOptions
            );
        } else if (constraints.dimensions) {
            // Single dimension constraint
            targetDimensions = constraints.dimensions;
        }

        if (targetDimensions) {
            const { width, height } = targetDimensions;

            if (
                file.width !== width ||
                file.height !== height
            ) {
                plan.resize = {
                    width,
                    height,
                };
            }
        }
    }

    // ----------------------------------------
    // File size
    // ----------------------------------------

    if (
        (constraints.minBytes !== undefined &&
            file.sizeBytes < constraints.minBytes) ||
        (constraints.maxBytes !== undefined &&
            file.sizeBytes > constraints.maxBytes)
    ) {
        plan.compress = {
            ...(constraints.minBytes !== undefined && {
                minBytes: constraints.minBytes,
            }),

            ...(constraints.maxBytes !== undefined && {
                maxBytes: constraints.maxBytes,
            }),

            format: chooseCompressionFormat(
                constraints.allowedFormats,
                isPdf,
                constraints.formatConstraints
            ),
        };
    }

    // ----------------------------------------
    // Format-specific adjustments
    // ----------------------------------------

    if (constraints.formatConstraints) {
        // If converting to PNG with no alpha requirement
        if (plan.convertTo === 'png' && constraints.formatConstraints.png?.noAlpha) {
            plan.removeAlpha = true;
        }

        // If current file is PNG and needs alpha removal
        if (file.extension.toLowerCase() === 'png' && constraints.formatConstraints.png?.noAlpha) {
            // Convert to JPEG (which doesn't support alpha) if JPEG is allowed
            if (constraints.allowedFormats?.some(f => f.toLowerCase() === 'jpeg' || f.toLowerCase() === 'jpg')) {
                plan.convertTo = 'jpeg';
            } else {
                plan.removeAlpha = true;
            }
        }
    }

    return plan;
}

/**
 * Choose the best dimension from multiple options
 * Strategy: Pick the option closest to the original aspect ratio that fits the file
 */
function chooseBestDimension(
    file: FileInfo,
    options: Array<{ width: number; height: number }>
): { width: number; height: number } {
    const fileAspectRatio = file.width / file.height;

    let bestOption = options[0];
    let bestScore = Number.POSITIVE_INFINITY;

    for (const option of options) {
        const optionAspectRatio = option.width / option.height;
        const aspectRatioDiff = Math.abs(fileAspectRatio - optionAspectRatio);

        // Prefer options that match aspect ratio and can fit the original
        const sizeDiff = Math.abs(option.width - file.width) + Math.abs(option.height - file.height);
        const score = aspectRatioDiff * 1000 + sizeDiff;

        if (score < bestScore) {
            bestScore = score;
            bestOption = option;
        }
    }

    return bestOption;
}

/**
 * Check if the current format meets format-specific constraints
 */
function checkFormatConstraints(
    currentFormat: string,
    formatConstraints?: UploadConstraints['formatConstraints']
): boolean {
    if (!formatConstraints) {
        return false;
    }

    // Check PNG constraints
    if (currentFormat === 'png' && formatConstraints.png) {
        // If PNG needs no alpha, current PNG likely has alpha and needs conversion
        if (formatConstraints.png.noAlpha) {
            return true;
        }
    }

    return false;
}

function chooseTargetFormat(
    allowedFormats: string[],
    isPdf: boolean,
    formatConstraints?: UploadConstraints['formatConstraints']
): TransformationPlan['convertTo'] {
    const normalized = allowedFormats.map((format) =>
        format.toLowerCase()
    );

    if (isPdf && normalized.includes('pdf')) {
        return 'pdf';
    }

    // If PNG has no-alpha constraint, prefer JPEG
    if (formatConstraints?.png?.noAlpha) {
        if (normalized.includes('jpeg') || normalized.includes('jpg')) {
            return 'jpeg';
        }
    }

    if (normalized.includes('jpeg')) {
        return 'jpeg';
    }

    if (normalized.includes('jpg')) {
        return 'jpeg';
    }

    if (normalized.includes('webp')) {
        return 'webp';
    }

    if (normalized.includes('png')) {
        return 'png';
    }

    if (isPdf) {
        return 'pdf';
    }

    return undefined;
}

function chooseCompressionFormat(
    allowedFormats?: string[],
    isPdf: boolean = false,
    formatConstraints?: UploadConstraints['formatConstraints']
): 'jpeg' | 'png' | 'webp' | 'pdf' {
    const normalized =
        allowedFormats?.map((format) =>
            format.toLowerCase()
        ) ?? [];

    if (isPdf) {
        return 'pdf';
    }

    // If PNG needs no alpha, prefer JPEG for compression
    if (formatConstraints?.png?.noAlpha) {
        if (normalized.includes('jpeg') || normalized.includes('jpg')) {
            return 'jpeg';
        }
    }

    if (
        normalized.includes('jpeg') ||
        normalized.includes('jpg')
    ) {
        return 'jpeg';
    }

    if (normalized.includes('webp')) {
        return 'webp';
    }

    if (normalized.includes('png')) {
        return 'png';
    }

    return 'jpeg';
}
