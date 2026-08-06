import type { UploadContext } from '../detector/extractUploadContext';
import type { UploadConstraints } from './types';

import { parseFileSize } from './parseFileSize';
import { parseFormats } from './parseFormats';
import { parseDimensions } from './parseDimensions';

export function parseConstraints(
    context: UploadContext
): UploadConstraints {
    const sizeConstraints = parseFileSize(context.nearbyText);
    const allowedFormats = parseFormats(context);
    const dimensions = parseDimensions(context.nearbyText);

    return {
        ...sizeConstraints,

        ...(allowedFormats.length > 0 && {
            allowedFormats,
        }),

        ...(dimensions && {
            dimensions,
        }),
    };
}