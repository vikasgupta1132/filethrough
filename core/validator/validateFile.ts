import type { UploadConstraints } from '../parser/types';
import type { FileInfo } from '../inspector/inspectFile';

export interface ValidationIssue {
    type: 'format' | 'size-too-large' | 'size-too-small' | 'dimensions';
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    issues: ValidationIssue[];
}

export function validateFile(
    file: FileInfo,
    constraints: UploadConstraints
): ValidationResult {
    const issues: ValidationIssue[] = [];

    // ----------------------------------------
    // Format
    // ----------------------------------------

    if (
        constraints.allowedFormats &&
        constraints.allowedFormats.length > 0
    ) {
        const fileFormat = file.extension.toLowerCase();

        const allowed = constraints.allowedFormats.some(
            (format) => format.toLowerCase() === fileFormat
        );

        if (!allowed) {
            issues.push({
                type: 'format',
                message: `File format "${fileFormat}" is not allowed.`,
            });
        }
    }

    // ----------------------------------------
    // Maximum file size
    // ----------------------------------------

    if (
        constraints.maxBytes !== undefined &&
        file.sizeBytes > constraints.maxBytes
    ) {
        issues.push({
            type: 'size-too-large',
            message: `File is too large. Maximum allowed size is ${formatBytes(
                constraints.maxBytes
            )}.`,
        });
    }

    // ----------------------------------------
    // Minimum file size
    // ----------------------------------------

    if (
        constraints.minBytes !== undefined &&
        file.sizeBytes < constraints.minBytes
    ) {
        issues.push({
            type: 'size-too-small',
            message: `File is too small. Minimum required size is ${formatBytes(
                constraints.minBytes
            )}.`,
        });
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
            issues.push({
                type: 'dimensions',
                message: `Image dimensions must be ${width} × ${height}px.`,
            });
        }
    }

    return {
        isValid: issues.length === 0,
        issues,
    };
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${Math.round(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}