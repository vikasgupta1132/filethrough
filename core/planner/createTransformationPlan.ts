import type { UploadConstraints } from '../parser/types';
import type { FileInfo } from '../inspector/inspectFile';
import type { TransformationPlan } from './types';

export function createTransformationPlan(
    file: FileInfo,
    constraints: UploadConstraints
): TransformationPlan {
    const plan: TransformationPlan = {};

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
                constraints.allowedFormats
            );

            if (targetFormat) {
                plan.convertTo = targetFormat;
            }
        }
    }

    // ----------------------------------------
    // Dimensions
    // ----------------------------------------

    if (constraints.dimensions) {
        const { width, height } = constraints.dimensions;

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
            constraints.allowedFormats
        ),
    };
}

    return plan;
}

function chooseTargetFormat(
    allowedFormats: string[]
): TransformationPlan['convertTo'] {
    const normalized = allowedFormats.map((format) =>
        format.toLowerCase()
    );

    if (normalized.includes('jpeg')) {
        return 'jpeg';
    }

    if (normalized.includes('jpg')) {
        return 'jpeg';
    }

    if (normalized.includes('png')) {
        return 'png';
    }

    if (normalized.includes('webp')) {
        return 'webp';
    }

    return undefined;
}

function chooseCompressionFormat(
    allowedFormats?: string[]
): 'jpeg' | 'png' | 'webp' {
    const normalized =
        allowedFormats?.map((format) =>
            format.toLowerCase()
        ) ?? [];

    if (
        normalized.includes('jpeg') ||
        normalized.includes('jpg')
    ) {
        return 'jpeg';
    }

    if (normalized.includes('png')) {
        return 'png';
    }

    if (normalized.includes('webp')) {
        return 'webp';
    }

    return 'jpeg';
}