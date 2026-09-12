import UPNG from '@upng/upng-js';
export async function compressImage(
  file: File,
  options: {
    minBytes?: number;
    maxBytes?: number;
    format?: 'jpeg' | 'png' | 'webp';
  }
): Promise<File> {
  const {
    minBytes,
    maxBytes,
    format = 'jpeg',
  } = options;

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

  // File is below the minimum size.
  if (
    minBytes !== undefined &&
    file.size < minBytes
  ) {
    const blob = await canvasToBlob(
      canvas,
      1,
      format
    );

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
      (maxBytes === undefined ||
        blob.size <= maxBytes)
    ) {
      return createCompressedFile(
        file,
        blob,
        format
      );
    }

    if (
      blob.size < minBytes &&
      (maxBytes === undefined ||
        blob.size <= maxBytes)
    ) {
      let paddedBlob: Blob | null = null;

      if (format === 'jpeg') {
        paddedBlob =
          await padJpegToMinimum(
            blob,
            minBytes
          );
      }

      if (format === 'png') {
        paddedBlob =
          await padPngToMinimum(
            blob,
            minBytes
          );
      }

      if (
        paddedBlob &&
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

    throw new Error(
      `Unable to produce an image between ${minBytes} and ${
        maxBytes ?? 'unlimited'
      } bytes at the required dimensions.`
    );
  }

  // File is above the maximum size.
  if (maxBytes === undefined) {
    throw new Error(
      'Cannot compress image without a maximum byte limit.'
    );
  }

let bestBlob: Blob | null = null;

if (format === 'png') {
    let lowColors = 2;
    let highColors = 256;

    for (let attempt = 0; attempt < 10; attempt++) {
        const colorCount = Math.floor(
            (lowColors + highColors) / 2
        );

        const blob = await canvasToPngBlob(
            canvas,
            colorCount
        );

        console.log(
            `[FileThrough] PNG compression attempt ${attempt + 1}:`,
            {
                colorCount,
                sizeBytes: blob.size,
                minBytes,
                maxBytes,
            }
        );

        if (blob.size > maxBytes) {
            highColors = colorCount - 1;
            continue;
        }

        if (
            minBytes !== undefined &&
            blob.size < minBytes
        ) {
            lowColors = colorCount + 1;
            continue;
        }

        bestBlob = blob;
        break;
    }
} else {
    let low = 0.05;
    let high = 1;

    for (let attempt = 0; attempt < 10; attempt++) {
        const quality =
            (low + high) / 2;

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
        break;
    }
}

if (!bestBlob) {
    throw new Error(
        `Unable to produce an image between ${
            minBytes ?? 0
        } and ${maxBytes} bytes.`
    );
}
  return createCompressedFile(
    file,
    bestBlob,
    format
  );
}

async function canvasToPngBlob(
    canvas: HTMLCanvasElement,
    colorCount: number
): Promise<Blob> {
    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Could not create canvas context.');
    }

    const imageData = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const buffer = UPNG.encode(
        [imageData.data.buffer],
        canvas.width,
        canvas.height,
        colorCount
    );

    return new Blob(
        [buffer],
        {
            type: 'image/png',
        }
    );
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

function padPngToMinimum(
  blob: Blob,
  minBytes: number
): Promise<Blob> {
  return blob.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);

    if (
      bytes.length < 12 ||
      bytes[0] !== 0x89 ||
      bytes[1] !== 0x50 ||
      bytes[2] !== 0x4e ||
      bytes[3] !== 0x47 ||
      bytes[4] !== 0x0d ||
      bytes[5] !== 0x0a ||
      bytes[6] !== 0x1a ||
      bytes[7] !== 0x0a
    ) {
      throw new Error(
        'Cannot pad PNG: invalid PNG data.'
      );
    }

    const paddingBytes =
      minBytes - bytes.length;

    if (paddingBytes <= 0) {
      return blob;
    }

    const chunkDataLength =
      paddingBytes - 12;

    if (chunkDataLength < 0) {
      throw new Error(
        'Cannot pad PNG: padding is too small.'
      );
    }

    const chunk = createPngTextChunk(
      chunkDataLength
    );

    const iendIndex =
      bytes.length - 12;

    const output = new Uint8Array(
      bytes.length + chunk.length
    );

    output.set(
      bytes.slice(0, iendIndex),
      0
    );

    output.set(
      chunk,
      iendIndex
    );

    output.set(
      bytes.slice(iendIndex),
      iendIndex + chunk.length
    );

    return new Blob(
      [output],
      { type: 'image/png' }
    );
  });
}

function createPngTextChunk(
  dataLength: number
): Uint8Array {
  const chunk = new Uint8Array(
    12 + dataLength
  );

  // Chunk length
  chunk[0] =
    (dataLength >> 24) & 0xff;

  chunk[1] =
    (dataLength >> 16) & 0xff;

  chunk[2] =
    (dataLength >> 8) & 0xff;

  chunk[3] =
    dataLength & 0xff;

  // Chunk type: tEXt
  chunk[4] = 0x74;
  chunk[5] = 0x45;
  chunk[6] = 0x58;
  chunk[7] = 0x74;

  // Leave the text data as zero bytes.
  // CRC is calculated below.
  const crc = crc32(
    chunk.slice(4, 8 + dataLength)
  );

  chunk[8] =
    (crc >>> 24) & 0xff;

  chunk[9] =
    (crc >>> 16) & 0xff;

  chunk[10] =
    (crc >>> 8) & 0xff;

  chunk[11] =
    crc & 0xff;

  return chunk;
}

function crc32(
  bytes: Uint8Array
): number {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;

    for (let bit = 0; bit < 8; bit++) {
      crc =
        (crc >>> 1) ^
        (crc & 1
          ? 0xedb88320
          : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
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
};