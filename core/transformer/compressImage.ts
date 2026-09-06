export async function compressImage(
  file: File,
  options: {
    minBytes?: number;
    maxBytes?: number;
    format?: 'jpeg' | 'png' | 'webp';
  }
): Promise<File> {
  const {minBytes,maxBytes,format = 'jpeg',} = options;

  if (!file.type.startsWith('image/')) {
    throw new Error(
      `Cannot compress non-image file: ${file.type}`
    );
  }

  // Already within the required range.
  if (
    (minBytes === undefined || file.size >= minBytes) &&
    (maxBytes === undefined || file.size <= maxBytes)
  ) {
    return file;
  }

  const image = await loadImage(file);

  const canvas = document.createElement('canvas');

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not create canvas context.');
  }

  context.fillStyle = '#ffffff';

  context.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  context.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height
  );

  // If the file is too small, try maximum JPEG quality.
    if (
    minBytes !== undefined &&
    file.size < minBytes
  ) {
    const blob = await canvasToBlob(canvas, 1, format);

    console.log(
      '[FileThrough] Minimum-size attempt:',
      {
        quality: 1,
        sizeBytes: blob.size,
        minBytes,
        maxBytes,
      }
    );

    if (
      blob.size >= minBytes &&
      (maxBytes === undefined || blob.size <= maxBytes)
    ) {
      return createCompressedFile(file, blob, format);
    }

   if (
  blob.size < minBytes &&
  (maxBytes === undefined || blob.size <= maxBytes)
) {
  if (format === 'jpeg') {
    const paddedBlob =
      await padJpegToMinimum(
        blob,
        minBytes
      );

    if (
      paddedBlob.size >= minBytes &&
      (maxBytes === undefined ||
        paddedBlob.size <= maxBytes)
    ) {
      return createCompressedFile(
        file,
        paddedBlob,
        format
      );
    }
  }
}

    throw new Error(
      `Unable to produce an image between ${minBytes} and ${
        maxBytes ?? 'unlimited'
      } bytes at the required dimensions.`
    );
  }

  // At this point the file is too large.
  if (maxBytes === undefined) {
    throw new Error(
      'Cannot compress image without a maximum byte limit.'
    );
  }

  let low = 0.05;
  let high = 1;
  let bestBlob: Blob | null = null;

  for (let attempt = 0; attempt < 10; attempt++) {
    const quality = (low + high) / 2;

    const blob = await canvasToBlob(
      canvas,
      quality,
      format
    );

    console.log(
      `[FileThrough] Compression attempt ${attempt + 1}:`,
      {
        quality,
        sizeBytes: blob.size,
        minBytes,
        maxBytes,
      }
    );

    if (blob.size > maxBytes) {
      high = quality;
      continue;
    }

    if (
      minBytes !== undefined &&
      blob.size < minBytes
    ) {
      low = quality;
      continue;
    }

    bestBlob = blob;
    low = quality;
  }

  if (!bestBlob) {
    throw new Error(
      `Unable to produce an image between ${
        minBytes ?? 0
      } and ${maxBytes} bytes.`
    );
  }

  return createCompressedFile(file, bestBlob, format);
}

function createCompressedFile(
  originalFile: File,
  blob: Blob,
  format: 'jpeg' | 'png' | 'webp'
): File {
  const extension =
    format === 'jpeg'
      ? 'jpg'
      : format;

  const mimeType =
    format === 'jpeg'
      ? 'image/jpeg'
      : format === 'png'
        ? 'image/png'
        : 'image/webp';

  return new File(
    [blob],
    replaceExtension(
      originalFile.name,
      extension
    ),
    {
      type: mimeType,
      lastModified: Date.now(),
    }
  );
}

function loadImage(
  file: File
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);

    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);

      reject(
        new Error('Unable to decode image.')
      );
    };

    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
  format: 'jpeg' | 'png' | 'webp'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType =
      format === 'jpeg'
        ? 'image/jpeg'
        : format === 'png'
          ? 'image/png'
          : 'image/webp';

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error(
              `Failed to create ${format} image.`
            )
          );

          return;
        }

        resolve(blob);
      },
      mimeType,
      format === 'png'
        ? undefined
        : quality
    );
  });
}

function padJpegToMinimum(
  blob: Blob,
  minBytes: number
): Promise<Blob> {
  return blob.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);

    if (
      bytes.length < 4 ||
      bytes[0] !== 0xff ||
      bytes[1] !== 0xd8 ||
      bytes[bytes.length - 2] !== 0xff ||
      bytes[bytes.length - 1] !== 0xd9
    ) {
      throw new Error(
        'Cannot pad JPEG: invalid JPEG data.'
      );
    }

    const paddingBytes =
      minBytes - bytes.length;

    if (paddingBytes <= 0) {
      return blob;
    }

    const commentDataLength =
      paddingBytes;

    const commentLength =
      commentDataLength + 2;

    if (commentLength > 65535) {
      throw new Error(
        'Cannot pad JPEG: padding is too large.'
      );
    }

    const comment = new Uint8Array(
      commentDataLength + 4
    );

    // JPEG COM marker
    comment[0] = 0xff;
    comment[1] = 0xfe;

    // Length includes these two length bytes.
    comment[2] =
      (commentLength >> 8) & 0xff;

    comment[3] =
      commentLength & 0xff;

    const eoiIndex =
      bytes.length - 2;

    const output = new Uint8Array(
      bytes.length + comment.length
    );

    // Everything before EOI
    output.set(
      bytes.slice(0, eoiIndex),
      0
    );

    // Comment segment
    output.set(
      comment,
      eoiIndex
    );

    // Original EOI marker
    output.set(
      bytes.slice(eoiIndex),
      eoiIndex + comment.length
    );

    return new Blob(
      [output],
      { type: 'image/jpeg' }
    );
  });
}

function replaceExtension(
  fileName: string,
  extension: string
): string {
  const lastDot = fileName.lastIndexOf('.');

  if (lastDot === -1) {
    return `${fileName}.${extension}`;
  }

  return `${fileName.slice(0, lastDot)}.${extension}`;
}