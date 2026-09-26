import type { UploadContext } from '../detector/extractUploadContext';
import type { UploadConstraints } from './types';

import { parseFileSize } from './parseFileSize';
import { parseFormats } from './parseFormats';
import { parseDimensions } from './parseDimensions';
import { parseFileQuantity } from './parseFileQuantity';

export function parseConstraints(
    context: UploadContext
): UploadConstraints {
    const sizeConstraints = parseFileSize(context.nearbyText);
    const formatConstraints = parseFormats(context);
    const dimensionConstraints = parseDimensions(context.nearbyText);
    const quantityConstraints = parseFileQuantity(context.nearbyText);

    return {
        ...sizeConstraints,
        ...formatConstraints,
        ...dimensionConstraints,
        ...quantityConstraints,
    };
}