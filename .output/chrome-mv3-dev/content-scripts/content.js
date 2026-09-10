(function() {
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_ji_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/define-content-script.mjs
	function defineContentScript(definition) {
		return definition;
	}
	//#endregion
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_ji_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/browser.mjs
	/**
	* Contains the `browser` export which you should use to access the extension
	* APIs in your project:
	*
	* ```ts
	* import { browser } from 'wxt/browser';
	*
	* browser.runtime.onInstalled.addListener(() => {
	*   // ...
	* });
	* ```
	*
	* @module wxt/browser
	*/
	var browser = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
	//#endregion
	//#region core/parser/parseFileSize.ts
	function toBytes(value, unit) {
		switch (unit.toLowerCase()) {
			case "kb": return Math.round(value * 1024);
			case "mb": return Math.round(value * 1024 * 1024);
			case "gb": return Math.round(value * 1024 * 1024 * 1024);
			default: return Math.round(value);
		}
	}
	function parseFileSize(text) {
		const result = {};
		const normalizedText = text.replace(/\s+/g, " ").trim();
		for (const pattern of [/between\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)\s+and\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i, /(\d+(?:\.\d+)?)\s*(kb|mb|gb)\s*(?:to|-|–|—)\s*(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i]) {
			const match = normalizedText.match(pattern);
			if (match) {
				const minValue = match[1];
				const minUnit = match[2];
				const maxValue = match[3];
				const maxUnit = match[4];
				if (!minValue || !minUnit || !maxValue || !maxUnit) continue;
				result.minBytes = toBytes(Number.parseFloat(minValue), minUnit);
				result.maxBytes = toBytes(Number.parseFloat(maxValue), maxUnit);
				return result;
			}
		}
		for (const pattern of [
			/(?:maximum|max)\s+(?:file\s+)?size\s*:?\s*(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i,
			/(?:file\s+)?size\s+(?:should\s+)?not\s+exceed\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i,
			/(?:file\s+)?(?:must\s+be\s+)?under\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i,
			/less\s+than\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i
		]) {
			const match = normalizedText.match(pattern);
			if (match) {
				const value = match[1];
				const unit = match[2];
				if (!value || !unit) continue;
				result.maxBytes = toBytes(Number.parseFloat(value), unit);
				return result;
			}
		}
		return result;
	}
	//#endregion
	//#region core/parser/parseFormats.ts
	function parseFormats(context) {
		const formats = /* @__PURE__ */ new Set();
		if (context.accept) {
			const acceptParts = context.accept.split(",");
			for (const part of acceptParts) {
				const value = part.trim().toLowerCase();
				if (value.startsWith(".")) formats.add(value.slice(1));
				if (value === "image/jpeg") {
					formats.add("jpg");
					formats.add("jpeg");
				}
				if (value === "image/png") formats.add("png");
				if (value === "image/webp") formats.add("webp");
				if (value === "application/pdf") formats.add("pdf");
			}
		}
		const text = context.nearbyText.toLowerCase();
		for (const format of [
			"jpg",
			"jpeg",
			"png",
			"webp",
			"pdf"
		]) if (new RegExp(`\\b${format}\\b`, "i").test(text)) formats.add(format);
		return Array.from(formats);
	}
	//#endregion
	//#region core/parser/parseDimensions.ts
	function parseDimensions(text) {
		const normalizedText = text.replace(/\s+/g, " ").trim();
		for (const pattern of [/(?:dimensions?|image\s+dimensions?|image\s+size)\s*:?\s*(\d+)\s*[x×]\s*(\d+)\s*(?:px|pixels?)?/i, /(\d+)\s*[x×]\s*(\d+)\s*(?:px|pixels?)/i]) {
			const match = normalizedText.match(pattern);
			if (match) {
				const width = match[1];
				const height = match[2];
				if (!width || !height) continue;
				return {
					width: Number.parseInt(width, 10),
					height: Number.parseInt(height, 10)
				};
			}
		}
	}
	//#endregion
	//#region core/parser/parseConstraints.ts
	function parseConstraints(context) {
		const sizeConstraints = parseFileSize(context.nearbyText);
		const allowedFormats = parseFormats(context);
		const dimensions = parseDimensions(context.nearbyText);
		return {
			...sizeConstraints,
			...allowedFormats.length > 0 && { allowedFormats },
			...dimensions && { dimensions }
		};
	}
	//#endregion
	//#region core/detector/extractUploadContext.ts
	function extractUploadContext(input) {
		let label = null;
		if (input.id) label = document.querySelector(`label[for="${CSS.escape(input.id)}"]`)?.textContent?.trim() || null;
		if (!label) label = input.closest("label")?.textContent?.trim() || null;
		const nearbyText = input.parentElement?.innerText?.replace(/\s+/g, " ").trim() || "";
		return {
			label,
			nearbyText,
			accept: input.getAttribute("accept")
		};
	}
	//#endregion
	//#region core/inspector/inspectFile.ts
	async function inspectFile(file) {
		const extension = getExtension(file.name);
		const info = {
			name: file.name,
			mimeType: file.type,
			sizeBytes: file.size,
			extension
		};
		if (file.type.startsWith("image/")) {
			const dimensions = await getImageDimensions(file);
			info.width = dimensions.width;
			info.height = dimensions.height;
		}
		return info;
	}
	function getExtension(fileName) {
		const lastDot = fileName.lastIndexOf(".");
		if (lastDot === -1) return "";
		return fileName.slice(lastDot + 1).toLowerCase();
	}
	function getImageDimensions(file) {
		return new Promise((resolve, reject) => {
			const url = URL.createObjectURL(file);
			const image = new Image();
			image.onload = () => {
				resolve({
					width: image.naturalWidth,
					height: image.naturalHeight
				});
				URL.revokeObjectURL(url);
			};
			image.onerror = () => {
				URL.revokeObjectURL(url);
				reject(/* @__PURE__ */ new Error("Unable to read image dimensions."));
			};
			image.src = url;
		});
	}
	//#endregion
	//#region core/validator/validateFile.ts
	function validateFile(file, constraints) {
		const issues = [];
		if (constraints.allowedFormats && constraints.allowedFormats.length > 0) {
			const fileFormat = file.extension.toLowerCase();
			if (!constraints.allowedFormats.some((format) => format.toLowerCase() === fileFormat)) issues.push({
				type: "format",
				message: `File format "${fileFormat}" is not allowed.`
			});
		}
		if (constraints.maxBytes !== void 0 && file.sizeBytes > constraints.maxBytes) issues.push({
			type: "size-too-large",
			message: `File is too large. Maximum allowed size is ${formatBytes(constraints.maxBytes)}.`
		});
		if (constraints.minBytes !== void 0 && file.sizeBytes < constraints.minBytes) issues.push({
			type: "size-too-small",
			message: `File is too small. Minimum required size is ${formatBytes(constraints.minBytes)}.`
		});
		if (constraints.dimensions) {
			const { width, height } = constraints.dimensions;
			if (file.width !== width || file.height !== height) issues.push({
				type: "dimensions",
				message: `Image dimensions must be ${width} × ${height}px.`
			});
		}
		return {
			isValid: issues.length === 0,
			issues
		};
	}
	function formatBytes(bytes) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
		return `${(bytes / 1048576).toFixed(2)} MB`;
	}
	//#endregion
	//#region core/planner/createTransformationPlan.ts
	function createTransformationPlan(file, constraints) {
		const plan = {};
		if (constraints.allowedFormats && constraints.allowedFormats.length > 0) {
			const currentFormat = file.extension.toLowerCase();
			if (!constraints.allowedFormats.includes(currentFormat)) {
				const targetFormat = chooseTargetFormat(constraints.allowedFormats);
				if (targetFormat) plan.convertTo = targetFormat;
			}
		}
		if (constraints.dimensions) {
			const { width, height } = constraints.dimensions;
			if (file.width !== width || file.height !== height) plan.resize = {
				width,
				height
			};
		}
		if (constraints.minBytes !== void 0 && file.sizeBytes < constraints.minBytes || constraints.maxBytes !== void 0 && file.sizeBytes > constraints.maxBytes) plan.compress = {
			...constraints.minBytes !== void 0 && { minBytes: constraints.minBytes },
			...constraints.maxBytes !== void 0 && { maxBytes: constraints.maxBytes },
			format: chooseCompressionFormat(constraints.allowedFormats)
		};
		return plan;
	}
	function chooseTargetFormat(allowedFormats) {
		const normalized = allowedFormats.map((format) => format.toLowerCase());
		if (normalized.includes("jpeg")) return "jpeg";
		if (normalized.includes("jpg")) return "jpeg";
		if (normalized.includes("png")) return "png";
		if (normalized.includes("webp")) return "webp";
	}
	function chooseCompressionFormat(allowedFormats) {
		const normalized = allowedFormats?.map((format) => format.toLowerCase()) ?? [];
		if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpeg";
		if (normalized.includes("png")) return "png";
		if (normalized.includes("webp")) return "webp";
		return "jpeg";
	}
	//#endregion
	//#region core/transformer/transformImage.ts
	async function transformImage(file, plan) {
		if (!file.type.startsWith("image/")) throw new Error(`Cannot transform non-image file: ${file.type}`);
		const image = await loadImage$1(file);
		const width = plan.resize?.width ?? image.naturalWidth;
		const height = plan.resize?.height ?? image.naturalHeight;
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Could not create canvas context.");
		if (plan.convertTo === "jpeg") {
			context.fillStyle = "#ffffff";
			context.fillRect(0, 0, width, height);
		}
		context.drawImage(image, 0, 0, width, height);
		const outputType = getOutputMimeType(plan.convertTo, file.type);
		const blob = await canvasToBlob$1(canvas, outputType);
		const extension = getExtensionForMimeType(outputType);
		const outputName = replaceExtension$1(file.name, extension);
		return new File([blob], outputName, {
			type: outputType,
			lastModified: Date.now()
		});
	}
	function loadImage$1(file) {
		return new Promise((resolve, reject) => {
			const url = URL.createObjectURL(file);
			const image = new Image();
			image.onload = () => {
				URL.revokeObjectURL(url);
				resolve(image);
			};
			image.onerror = () => {
				URL.revokeObjectURL(url);
				reject(/* @__PURE__ */ new Error("Unable to decode image."));
			};
			image.src = url;
		});
	}
	function canvasToBlob$1(canvas, type) {
		return new Promise((resolve, reject) => {
			canvas.toBlob((blob) => {
				if (!blob) {
					reject(/* @__PURE__ */ new Error("Failed to create image."));
					return;
				}
				resolve(blob);
			}, type);
		});
	}
	function getOutputMimeType(format, originalType) {
		switch (format) {
			case "jpeg": return "image/jpeg";
			case "png": return "image/png";
			case "webp": return "image/webp";
			default: return originalType;
		}
	}
	function getExtensionForMimeType(mimeType) {
		switch (mimeType) {
			case "image/jpeg": return "jpg";
			case "image/png": return "png";
			case "image/webp": return "webp";
			default: return "img";
		}
	}
	function replaceExtension$1(fileName, extension) {
		const lastDot = fileName.lastIndexOf(".");
		if (lastDot === -1) return `${fileName}.${extension}`;
		return `${fileName.slice(0, lastDot)}.${extension}`;
	}
	//#endregion
	//#region core/transformer/compressImage.ts
	async function compressImage(file, options) {
		const { minBytes, maxBytes, format = "jpeg" } = options;
		if (!file.type.startsWith("image/")) throw new Error(`Cannot compress non-image file: ${file.type}`);
		if ((minBytes === void 0 || file.size >= minBytes) && (maxBytes === void 0 || file.size <= maxBytes)) return file;
		const image = await loadImage(file);
		const canvas = document.createElement("canvas");
		canvas.width = image.naturalWidth;
		canvas.height = image.naturalHeight;
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Could not create canvas context.");
		context.fillStyle = "#ffffff";
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.drawImage(image, 0, 0, canvas.width, canvas.height);
		if (minBytes !== void 0 && file.size < minBytes) {
			const blob = await canvasToBlob(canvas, 1, format);
			console.log("[FileThrough] Minimum-size attempt:", {
				quality: 1,
				sizeBytes: blob.size,
				minBytes,
				maxBytes
			});
			if (blob.size >= minBytes && (maxBytes === void 0 || blob.size <= maxBytes)) return createCompressedFile(file, blob, format);
			if (blob.size < minBytes && (maxBytes === void 0 || blob.size <= maxBytes)) {
				let paddedBlob = null;
				if (format === "jpeg") paddedBlob = await padJpegToMinimum(blob, minBytes);
				if (format === "png") paddedBlob = await padPngToMinimum(blob, minBytes);
				if (paddedBlob && paddedBlob.size >= minBytes && (maxBytes === void 0 || paddedBlob.size <= maxBytes)) return createCompressedFile(file, paddedBlob, format);
			}
			throw new Error(`Unable to produce an image between ${minBytes} and ${maxBytes ?? "unlimited"} bytes at the required dimensions.`);
		}
		if (maxBytes === void 0) throw new Error("Cannot compress image without a maximum byte limit.");
		let low = .05;
		let high = 1;
		let bestBlob = null;
		for (let attempt = 0; attempt < 10; attempt++) {
			const quality = (low + high) / 2;
			const blob = await canvasToBlob(canvas, quality, format);
			console.log(`[FileThrough] Compression attempt ${attempt + 1}:`, {
				quality,
				sizeBytes: blob.size,
				minBytes,
				maxBytes
			});
			if (blob.size > maxBytes) {
				high = quality;
				continue;
			}
			if (minBytes !== void 0 && blob.size < minBytes) {
				low = quality;
				continue;
			}
			bestBlob = blob;
			low = quality;
		}
		if (!bestBlob) throw new Error(`Unable to produce an image between ${minBytes ?? 0} and ${maxBytes} bytes.`);
		return createCompressedFile(file, bestBlob, format);
	}
	function createCompressedFile(originalFile, blob, format) {
		const extension = format === "jpeg" ? "jpg" : format;
		const mimeType = format === "jpeg" ? "image/jpeg" : format === "png" ? "image/png" : "image/webp";
		return new File([blob], replaceExtension(originalFile.name, extension), {
			type: mimeType,
			lastModified: Date.now()
		});
	}
	function loadImage(file) {
		return new Promise((resolve, reject) => {
			const url = URL.createObjectURL(file);
			const image = new Image();
			image.onload = () => {
				URL.revokeObjectURL(url);
				resolve(image);
			};
			image.onerror = () => {
				URL.revokeObjectURL(url);
				reject(/* @__PURE__ */ new Error("Unable to decode image."));
			};
			image.src = url;
		});
	}
	function canvasToBlob(canvas, quality, format) {
		return new Promise((resolve, reject) => {
			const mimeType = format === "jpeg" ? "image/jpeg" : format === "png" ? "image/png" : "image/webp";
			canvas.toBlob((blob) => {
				if (!blob) {
					reject(/* @__PURE__ */ new Error(`Failed to create ${format} image.`));
					return;
				}
				resolve(blob);
			}, mimeType, format === "png" ? void 0 : quality);
		});
	}
	function padJpegToMinimum(blob, minBytes) {
		return blob.arrayBuffer().then((buffer) => {
			const bytes = new Uint8Array(buffer);
			if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216 || bytes[bytes.length - 2] !== 255 || bytes[bytes.length - 1] !== 217) throw new Error("Cannot pad JPEG: invalid JPEG data.");
			const paddingBytes = minBytes - bytes.length;
			if (paddingBytes <= 0) return blob;
			const commentDataLength = paddingBytes;
			const commentLength = commentDataLength + 2;
			if (commentLength > 65535) throw new Error("Cannot pad JPEG: padding is too large.");
			const comment = new Uint8Array(commentDataLength + 4);
			comment[0] = 255;
			comment[1] = 254;
			comment[2] = commentLength >> 8 & 255;
			comment[3] = commentLength & 255;
			const eoiIndex = bytes.length - 2;
			const output = new Uint8Array(bytes.length + comment.length);
			output.set(bytes.slice(0, eoiIndex), 0);
			output.set(comment, eoiIndex);
			output.set(bytes.slice(eoiIndex), eoiIndex + comment.length);
			return new Blob([output], { type: "image/jpeg" });
		});
	}
	function padPngToMinimum(blob, minBytes) {
		return blob.arrayBuffer().then((buffer) => {
			const bytes = new Uint8Array(buffer);
			if (bytes.length < 12 || bytes[0] !== 137 || bytes[1] !== 80 || bytes[2] !== 78 || bytes[3] !== 71 || bytes[4] !== 13 || bytes[5] !== 10 || bytes[6] !== 26 || bytes[7] !== 10) throw new Error("Cannot pad PNG: invalid PNG data.");
			const paddingBytes = minBytes - bytes.length;
			if (paddingBytes <= 0) return blob;
			const chunkDataLength = paddingBytes - 12;
			if (chunkDataLength < 0) throw new Error("Cannot pad PNG: padding is too small.");
			const chunk = createPngTextChunk(chunkDataLength);
			const iendIndex = bytes.length - 12;
			const output = new Uint8Array(bytes.length + chunk.length);
			output.set(bytes.slice(0, iendIndex), 0);
			output.set(chunk, iendIndex);
			output.set(bytes.slice(iendIndex), iendIndex + chunk.length);
			return new Blob([output], { type: "image/png" });
		});
	}
	function createPngTextChunk(dataLength) {
		const chunk = new Uint8Array(12 + dataLength);
		chunk[0] = dataLength >> 24 & 255;
		chunk[1] = dataLength >> 16 & 255;
		chunk[2] = dataLength >> 8 & 255;
		chunk[3] = dataLength & 255;
		chunk[4] = 116;
		chunk[5] = 69;
		chunk[6] = 88;
		chunk[7] = 116;
		const crc = crc32(chunk.slice(4, 8 + dataLength));
		chunk[8] = crc >>> 24 & 255;
		chunk[9] = crc >>> 16 & 255;
		chunk[10] = crc >>> 8 & 255;
		chunk[11] = crc & 255;
		return chunk;
	}
	function crc32(bytes) {
		let crc = 4294967295;
		for (const byte of bytes) {
			crc ^= byte;
			for (let bit = 0; bit < 8; bit++) crc = crc >>> 1 ^ (crc & 1 ? 3988292384 : 0);
		}
		return (crc ^ 4294967295) >>> 0;
	}
	function replaceExtension(fileName, extension) {
		const lastDot = fileName.lastIndexOf(".");
		if (lastDot === -1) return `${fileName}.${extension}`;
		return `${fileName.slice(0, lastDot)}.${extension}`;
	}
	//#endregion
	//#region entrypoints/content.ts
	var content_default = defineContentScript({
		matches: ["<all_urls>"],
		main() {
			console.log("[FileThrough] Content script loaded");
			const detectedInputs = /* @__PURE__ */ new WeakSet();
			function registerFileInput(input) {
				if (detectedInputs.has(input)) return;
				detectedInputs.add(input);
				console.log("[FileThrough] Upload field detected", {
					accept: input.accept || "Not specified",
					multiple: input.multiple,
					name: input.name || "Not specified",
					id: input.id || "Not specified"
				});
				const context = extractUploadContext(input);
				console.log("[FileThrough] Upload context", context);
				const constraints = parseConstraints(context);
				console.log("[FileThrough] Upload constraints", constraints);
				input.addEventListener("change", async (event) => {
					if (event.isTrusted === false) return;
					const file = input.files?.[0];
					if (!file) return;
					try {
						const fileInfo = await inspectFile(file);
						console.log("[FileThrough] Selected file", fileInfo);
						const validation = validateFile(fileInfo, constraints);
						console.log("[FileThrough] Validation result", validation);
						const plan = createTransformationPlan(fileInfo, constraints);
						console.log("[FileThrough] Transformation plan", plan);
						if (Object.keys(plan).length > 0) {
							let transformedFile = file;
							try {
								transformedFile = await transformImage(file, plan);
								const transformedInfo = await inspectFile(transformedFile);
								console.log("[FileThrough] Transformed file", transformedInfo);
							} catch (error) {
								console.error("[FileThrough] Transformation failed", error);
							}
							let finalFile = transformedFile;
							if (plan.compress) try {
								finalFile = await compressImage(transformedFile, {
									minBytes: plan.compress.minBytes,
									maxBytes: plan.compress.maxBytes,
									format: plan.compress.format
								});
								const finalInfo = await inspectFile(finalFile);
								console.log("[FileThrough] Compressed file", finalInfo);
							} catch (error) {
								console.error("[FileThrough] Compression failed", error);
							}
							replaceInputFile(input, finalFile);
							input.dispatchEvent(new Event("change", { bubbles: true }));
							console.log("[FileThrough] Final file injected", {
								name: finalFile.name,
								type: finalFile.type,
								sizeBytes: finalFile.size
							});
							const message = {
								type: "file-processed",
								file: {
									name: finalFile.name,
									type: finalFile.type,
									sizeBytes: finalFile.size
								}
							};
							browser.runtime.sendMessage(message);
						}
					} catch (error) {
						console.error("[FileThrough] Could not inspect file", error);
					}
				});
			}
			function replaceInputFile(input, file) {
				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				input.files = dataTransfer.files;
			}
			function scanForFileInputs(root = document) {
				root.querySelectorAll("input[type=\"file\"]").forEach(registerFileInput);
			}
			scanForFileInputs();
			new MutationObserver((mutations) => {
				for (const mutation of mutations) for (const node of mutation.addedNodes) {
					if (!(node instanceof HTMLElement)) continue;
					if (node instanceof HTMLInputElement && node.type === "file") registerFileInput(node);
					scanForFileInputs(node);
				}
			}).observe(document.documentElement, {
				childList: true,
				subtree: true
			});
		}
	});
	//#endregion
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_ji_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/internal/logger.mjs
	function print$1(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger$1 = {
		debug: (...args) => print$1(console.debug, ...args),
		log: (...args) => print$1(console.log, ...args),
		warn: (...args) => print$1(console.warn, ...args),
		error: (...args) => print$1(console.error, ...args)
	};
	//#endregion
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_ji_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/internal/custom-events.mjs
	var WxtLocationChangeEvent = class WxtLocationChangeEvent extends Event {
		static EVENT_NAME = getUniqueEventName("wxt:locationchange");
		constructor(newUrl, oldUrl) {
			super(WxtLocationChangeEvent.EVENT_NAME, {});
			this.newUrl = newUrl;
			this.oldUrl = oldUrl;
		}
	};
	/**
	* Returns an event name unique to the extension and content script that's
	* running.
	*/
	function getUniqueEventName(eventName) {
		return `${browser?.runtime?.id}:content:${eventName}`;
	}
	//#endregion
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_ji_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/internal/location-watcher.mjs
	var supportsNavigationApi = typeof globalThis.navigation?.addEventListener === "function";
	/**
	* Create a util that watches for URL changes, dispatching the custom event when
	* detected. Stops watching when content script is invalidated. Uses Navigation
	* API when available, otherwise falls back to polling.
	*/
	function createLocationWatcher(ctx) {
		let lastUrl;
		let watching = false;
		return { run() {
			if (watching) return;
			watching = true;
			lastUrl = new URL(location.href);
			if (supportsNavigationApi) globalThis.navigation.addEventListener("navigate", (event) => {
				const newUrl = new URL(event.destination.url);
				if (newUrl.href === lastUrl.href) return;
				window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
				lastUrl = newUrl;
			}, { signal: ctx.signal });
			else ctx.setInterval(() => {
				const newUrl = new URL(location.href);
				if (newUrl.href !== lastUrl.href) {
					window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
					lastUrl = newUrl;
				}
			}, 1e3);
		} };
	}
	//#endregion
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_ji_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/content-script-context.mjs
	/**
	* Implements
	* [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).
	* Used to detect and stop content script code when the script is invalidated.
	*
	* It also provides several utilities like `ctx.setTimeout` and
	* `ctx.setInterval` that should be used in content scripts instead of
	* `window.setTimeout` or `window.setInterval`.
	*
	* To create context for testing, you can use the class's constructor:
	*
	* ```ts
	* import { ContentScriptContext } from 'wxt/utils/content-scripts-context';
	*
	* test('storage listener should be removed when context is invalidated', () => {
	*   const ctx = new ContentScriptContext('test');
	*   const item = storage.defineItem('local:count', { defaultValue: 0 });
	*   const watcher = vi.fn();
	*
	*   const unwatch = item.watch(watcher);
	*   ctx.onInvalidated(unwatch); // Listen for invalidate here
	*
	*   await item.setValue(1);
	*   expect(watcher).toBeCalledTimes(1);
	*   expect(watcher).toBeCalledWith(1, 0);
	*
	*   ctx.notifyInvalidated(); // Use this function to invalidate the context
	*   await item.setValue(2);
	*   expect(watcher).toBeCalledTimes(1);
	* });
	* ```
	*/
	var ContentScriptContext = class ContentScriptContext {
		static SCRIPT_STARTED_MESSAGE_TYPE = getUniqueEventName("wxt:content-script-started");
		id;
		abortController;
		locationWatcher = createLocationWatcher(this);
		constructor(contentScriptName, options) {
			this.contentScriptName = contentScriptName;
			this.options = options;
			this.id = Math.random().toString(36).slice(2);
			this.abortController = new AbortController();
			this.stopOldScripts();
			this.listenForNewerScripts();
		}
		get signal() {
			return this.abortController.signal;
		}
		abort(reason) {
			return this.abortController.abort(reason);
		}
		get isInvalid() {
			if (browser.runtime?.id == null) this.notifyInvalidated();
			return this.signal.aborted;
		}
		get isValid() {
			return !this.isInvalid;
		}
		/**
		* Add a listener that is called when the content script's context is
		* invalidated.
		*
		* @example
		*   browser.runtime.onMessage.addListener(cb);
		*   const removeInvalidatedListener = ctx.onInvalidated(() => {
		*     browser.runtime.onMessage.removeListener(cb);
		*   });
		*   // ...
		*   removeInvalidatedListener();
		*
		* @returns A function to remove the listener.
		*/
		onInvalidated(cb) {
			this.signal.addEventListener("abort", cb);
			return () => this.signal.removeEventListener("abort", cb);
		}
		/**
		* Return a promise that never resolves. Useful if you have an async function
		* that shouldn't run after the context is expired.
		*
		* @example
		*   const getValueFromStorage = async () => {
		*     if (ctx.isInvalid) return ctx.block();
		*
		*     // ...
		*   };
		*/
		block() {
			return new Promise(() => {});
		}
		/**
		* Wrapper around `window.setInterval` that automatically clears the interval
		* when invalidated.
		*
		* Intervals can be cleared by calling the normal `clearInterval` function.
		*/
		setInterval(handler, timeout) {
			const id = setInterval(() => {
				if (this.isValid) handler();
			}, timeout);
			this.onInvalidated(() => clearInterval(id));
			return id;
		}
		/**
		* Wrapper around `window.setTimeout` that automatically clears the interval
		* when invalidated.
		*
		* Timeouts can be cleared by calling the normal `setTimeout` function.
		*/
		setTimeout(handler, timeout) {
			const id = setTimeout(() => {
				if (this.isValid) handler();
			}, timeout);
			this.onInvalidated(() => clearTimeout(id));
			return id;
		}
		/**
		* Wrapper around `window.requestAnimationFrame` that automatically cancels
		* the request when invalidated.
		*
		* Callbacks can be canceled by calling the normal `cancelAnimationFrame`
		* function.
		*/
		requestAnimationFrame(callback) {
			const id = requestAnimationFrame((...args) => {
				if (this.isValid) callback(...args);
			});
			this.onInvalidated(() => cancelAnimationFrame(id));
			return id;
		}
		/**
		* Wrapper around `window.requestIdleCallback` that automatically cancels the
		* request when invalidated.
		*
		* Callbacks can be canceled by calling the normal `cancelIdleCallback`
		* function.
		*/
		requestIdleCallback(callback, options) {
			const id = requestIdleCallback((...args) => {
				if (!this.signal.aborted) callback(...args);
			}, options);
			this.onInvalidated(() => cancelIdleCallback(id));
			return id;
		}
		addEventListener(target, type, handler, options) {
			if (type === "wxt:locationchange") {
				if (this.isValid) this.locationWatcher.run();
			}
			target.addEventListener?.(type.startsWith("wxt:") ? getUniqueEventName(type) : type, handler, {
				...options,
				signal: this.signal
			});
		}
		/**
		* @internal
		* Abort the abort controller and execute all `onInvalidated` listeners.
		*/
		notifyInvalidated() {
			this.abort("Content script context invalidated");
			logger$1.debug(`Content script "${this.contentScriptName}" context invalidated`);
		}
		stopOldScripts() {
			document.dispatchEvent(new CustomEvent(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, { detail: {
				contentScriptName: this.contentScriptName,
				messageId: this.id
			} }));
			if (!this.options?.noScriptStartedPostMessage) window.postMessage({
				type: ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
				contentScriptName: this.contentScriptName,
				messageId: this.id
			}, "*");
		}
		verifyScriptStartedEvent(event) {
			const isSameContentScript = event.detail?.contentScriptName === this.contentScriptName;
			const isFromSelf = event.detail?.messageId === this.id;
			return isSameContentScript && !isFromSelf;
		}
		listenForNewerScripts() {
			const cb = (event) => {
				if (!(event instanceof CustomEvent) || !this.verifyScriptStartedEvent(event)) return;
				this.notifyInvalidated();
			};
			document.addEventListener(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, cb);
			this.onInvalidated(() => document.removeEventListener(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, cb));
		}
	};
	//#endregion
	//#region \0virtual:wxt-content-script-isolated-world-entrypoint?D:/filethrough/filethrough/entrypoints/content.ts
	function print(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger = {
		debug: (...args) => print(console.debug, ...args),
		log: (...args) => print(console.log, ...args),
		warn: (...args) => print(console.warn, ...args),
		error: (...args) => print(console.error, ...args)
	};
	//#endregion
	return (async () => {
		try {
			const { main, ...options } = content_default;
			return await main(new ContentScriptContext("content", options));
		} catch (err) {
			logger.error(`The content script "content" crashed on startup!`, err);
			throw err;
		}
	})();
})();

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiLCJwcmludCIsImxvZ2dlciJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfamlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1jb250ZW50LXNjcmlwdC5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vQHd4dC1kZXYrYnJvd3NlckAwLjIuNS9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIxLjNfZXNsaW50QDkuMzkuNF9qaV80OGI2MjkwNDU4MGY1MTI3Mzc3NmIwNDMwYzI4OWIwNC9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci5tanMiLCIuLi8uLi8uLi9jb3JlL3BhcnNlci9wYXJzZUZpbGVTaXplLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VGb3JtYXRzLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VEaW1lbnNpb25zLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VDb25zdHJhaW50cy50cyIsIi4uLy4uLy4uL2NvcmUvZGV0ZWN0b3IvZXh0cmFjdFVwbG9hZENvbnRleHQudHMiLCIuLi8uLi8uLi9jb3JlL2luc3BlY3Rvci9pbnNwZWN0RmlsZS50cyIsIi4uLy4uLy4uL2NvcmUvdmFsaWRhdG9yL3ZhbGlkYXRlRmlsZS50cyIsIi4uLy4uLy4uL2NvcmUvcGxhbm5lci9jcmVhdGVUcmFuc2Zvcm1hdGlvblBsYW4udHMiLCIuLi8uLi8uLi9jb3JlL3RyYW5zZm9ybWVyL3RyYW5zZm9ybUltYWdlLnRzIiwiLi4vLi4vLi4vY29yZS90cmFuc2Zvcm1lci9jb21wcmVzc0ltYWdlLnRzIiwiLi4vLi4vLi4vZW50cnlwb2ludHMvY29udGVudC50cyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfamlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2xvZ2dlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjEuM19lc2xpbnRAOS4zOS40X2ppXzQ4YjYyOTA0NTgwZjUxMjczNzc2YjA0MzBjMjg5YjA0L25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9pbnRlcm5hbC9jdXN0b20tZXZlbnRzLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfamlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2xvY2F0aW9uLXdhdGNoZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIxLjNfZXNsaW50QDkuMzkuNF9qaV80OGI2MjkwNDU4MGY1MTI3Mzc3NmIwNDMwYzI4OWIwNC9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvY29udGVudC1zY3JpcHQtY29udGV4dC5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8jcmVnaW9uIHNyYy91dGlscy9kZWZpbmUtY29udGVudC1zY3JpcHQudHNcbmZ1bmN0aW9uIGRlZmluZUNvbnRlbnRTY3JpcHQoZGVmaW5pdGlvbikge1xuXHRyZXR1cm4gZGVmaW5pdGlvbjtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgZGVmaW5lQ29udGVudFNjcmlwdCB9O1xuIiwiLy8gI3JlZ2lvbiBzbmlwcGV0XG5leHBvcnQgY29uc3QgYnJvd3NlciA9IGdsb2JhbFRoaXMuYnJvd3Nlcj8ucnVudGltZT8uaWRcbiAgPyBnbG9iYWxUaGlzLmJyb3dzZXJcbiAgOiBnbG9iYWxUaGlzLmNocm9tZTtcbi8vICNlbmRyZWdpb24gc25pcHBldFxuIiwiaW1wb3J0IHsgYnJvd3NlciBhcyBicm93c2VyJDEgfSBmcm9tIFwiQHd4dC1kZXYvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy9icm93c2VyLnRzXG4vKipcbiogQ29udGFpbnMgdGhlIGBicm93c2VyYCBleHBvcnQgd2hpY2ggeW91IHNob3VsZCB1c2UgdG8gYWNjZXNzIHRoZSBleHRlbnNpb25cbiogQVBJcyBpbiB5b3VyIHByb2plY3Q6XG4qXG4qIGBgYHRzXG4qIGltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICd3eHQvYnJvd3Nlcic7XG4qXG4qIGJyb3dzZXIucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4qICAgLy8gLi4uXG4qIH0pO1xuKiBgYGBcbipcbiogQG1vZHVsZSB3eHQvYnJvd3NlclxuKi9cbmNvbnN0IGJyb3dzZXIgPSBicm93c2VyJDE7XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGJyb3dzZXIgfTtcbiIsImltcG9ydCB0eXBlIHsgVXBsb2FkQ29uc3RyYWludHMgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmZ1bmN0aW9uIHRvQnl0ZXModmFsdWU6IG51bWJlciwgdW5pdDogc3RyaW5nKTogbnVtYmVyIHtcclxuICAgIGNvbnN0IG5vcm1hbGl6ZWRVbml0ID0gdW5pdC50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgIHN3aXRjaCAobm9ybWFsaXplZFVuaXQpIHtcclxuICAgICAgICBjYXNlICdrYic6XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlICogMTAyNCk7XHJcblxyXG4gICAgICAgIGNhc2UgJ21iJzpcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgKiAxMDI0ICogMTAyNCk7XHJcblxyXG4gICAgICAgIGNhc2UgJ2diJzpcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgKiAxMDI0ICogMTAyNCAqIDEwMjQpO1xyXG5cclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZpbGVTaXplKHRleHQ6IHN0cmluZyk6IFVwbG9hZENvbnN0cmFpbnRzIHtcclxuICAgIGNvbnN0IHJlc3VsdDogVXBsb2FkQ29uc3RyYWludHMgPSB7fTtcclxuXHJcbiAgICBjb25zdCBub3JtYWxpemVkVGV4dCA9IHRleHRcclxuICAgICAgICAucmVwbGFjZSgvXFxzKy9nLCAnICcpXHJcbiAgICAgICAgLnRyaW0oKTtcclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gMS4gUkFOR0UgUEFUVEVSTlNcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgLy8gRXhhbXBsZXM6XHJcbiAgICAvLyAyMCBLQiB0byAxMDAgS0JcclxuICAgIC8vIDIwS0IgLSAxMDBLQlxyXG4gICAgLy8gQmV0d2VlbiA1MCBLQiBhbmQgMjAwIEtCXHJcblxyXG4gICAgY29uc3QgcmFuZ2VQYXR0ZXJucyA9IFtcclxuICAgICAgICAvYmV0d2VlblxccysoXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKVxccythbmRcXHMrKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYikvaSxcclxuXHJcbiAgICAgICAgLyhcXGQrKD86XFwuXFxkKyk/KVxccyooa2J8bWJ8Z2IpXFxzKig/OnRvfC184oCTfOKAlClcXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYikvaSxcclxuICAgIF07XHJcblxyXG4gICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHJhbmdlUGF0dGVybnMpIHtcclxuICAgICAgICBjb25zdCBtYXRjaCA9IG5vcm1hbGl6ZWRUZXh0Lm1hdGNoKHBhdHRlcm4pO1xyXG5cclxuICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgY29uc3QgbWluVmFsdWUgPSBtYXRjaFsxXTtcclxuICAgICAgICAgICAgY29uc3QgbWluVW5pdCA9IG1hdGNoWzJdO1xyXG4gICAgICAgICAgICBjb25zdCBtYXhWYWx1ZSA9IG1hdGNoWzNdO1xyXG4gICAgICAgICAgICBjb25zdCBtYXhVbml0ID0gbWF0Y2hbNF07XHJcblxyXG4gICAgICAgICAgICBpZiAoIW1pblZhbHVlIHx8ICFtaW5Vbml0IHx8ICFtYXhWYWx1ZSB8fCAhbWF4VW5pdCkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJlc3VsdC5taW5CeXRlcyA9IHRvQnl0ZXMoXHJcbiAgICAgICAgICAgICAgICBOdW1iZXIucGFyc2VGbG9hdChtaW5WYWx1ZSksXHJcbiAgICAgICAgICAgICAgICBtaW5Vbml0XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICByZXN1bHQubWF4Qnl0ZXMgPSB0b0J5dGVzKFxyXG4gICAgICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQobWF4VmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgbWF4VW5pdFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIDIuIE1BWElNVU0gUEFUVEVSTlNcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgLy8gRXhhbXBsZXM6XHJcbiAgICAvLyBNYXhpbXVtIGZpbGUgc2l6ZTogMjAwIEtCXHJcbiAgICAvLyBNYXggc2l6ZSAyIE1CXHJcbiAgICAvLyBGaWxlIHNpemUgc2hvdWxkIG5vdCBleGNlZWQgNTAwIEtCXHJcbiAgICAvLyBGaWxlIG11c3QgYmUgdW5kZXIgMzAwIEtCXHJcbiAgICAvLyBMZXNzIHRoYW4gMSBNQlxyXG5cclxuICAgIGNvbnN0IG1heFBhdHRlcm5zID0gW1xyXG4gICAgICAgIC8oPzptYXhpbXVtfG1heClcXHMrKD86ZmlsZVxccyspP3NpemVcXHMqOj9cXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYikvaSxcclxuXHJcbiAgICAgICAgLyg/OmZpbGVcXHMrKT9zaXplXFxzKyg/OnNob3VsZFxccyspP25vdFxccytleGNlZWRcXHMrKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYikvaSxcclxuXHJcbiAgICAgICAgLyg/OmZpbGVcXHMrKT8oPzptdXN0XFxzK2JlXFxzKyk/dW5kZXJcXHMrKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYikvaSxcclxuXHJcbiAgICAgICAgL2xlc3NcXHMrdGhhblxccysoXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKS9pLFxyXG4gICAgXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgbWF4UGF0dGVybnMpIHtcclxuICAgICAgICBjb25zdCBtYXRjaCA9IG5vcm1hbGl6ZWRUZXh0Lm1hdGNoKHBhdHRlcm4pO1xyXG5cclxuXHJcbiAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gbWF0Y2hbMV07XHJcbiAgICAgICAgICAgIGNvbnN0IHVuaXQgPSBtYXRjaFsyXTtcclxuXHJcbiAgICAgICAgICAgIGlmICghdmFsdWUgfHwgIXVuaXQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXN1bHQubWF4Qnl0ZXMgPSB0b0J5dGVzKFxyXG4gICAgICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQodmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgdW5pdFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufSIsImltcG9ydCB0eXBlIHsgVXBsb2FkQ29udGV4dCB9IGZyb20gJy4uL2RldGVjdG9yL2V4dHJhY3RVcGxvYWRDb250ZXh0JztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZvcm1hdHMoXHJcbiAgICBjb250ZXh0OiBVcGxvYWRDb250ZXh0XHJcbik6IHN0cmluZ1tdIHtcclxuICAgIGNvbnN0IGZvcm1hdHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcclxuXHJcbiAgICAvLyBIaWdoZXN0LWNvbmZpZGVuY2Ugc291cmNlOiBIVE1MIGFjY2VwdCBhdHRyaWJ1dGVcclxuICAgIGlmIChjb250ZXh0LmFjY2VwdCkge1xyXG4gICAgICAgIGNvbnN0IGFjY2VwdFBhcnRzID0gY29udGV4dC5hY2NlcHQuc3BsaXQoJywnKTtcclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBwYXJ0IG9mIGFjY2VwdFBhcnRzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcGFydC50cmltKCkudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZS5zdGFydHNXaXRoKCcuJykpIHtcclxuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKHZhbHVlLnNsaWNlKDEpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnaW1hZ2UvanBlZycpIHtcclxuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKCdqcGcnKTtcclxuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKCdqcGVnJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJ2ltYWdlL3BuZycpIHtcclxuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKCdwbmcnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnaW1hZ2Uvd2VicCcpIHtcclxuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKCd3ZWJwJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJ2FwcGxpY2F0aW9uL3BkZicpIHtcclxuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKCdwZGYnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBTZWNvbmQgc291cmNlOiBuZWFyYnkgaW5zdHJ1Y3Rpb25zXHJcbiAgICBjb25zdCB0ZXh0ID0gY29udGV4dC5uZWFyYnlUZXh0LnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgY29uc3Qga25vd25Gb3JtYXRzID0gW1xyXG4gICAgICAgICdqcGcnLFxyXG4gICAgICAgICdqcGVnJyxcclxuICAgICAgICAncG5nJyxcclxuICAgICAgICAnd2VicCcsXHJcbiAgICAgICAgJ3BkZicsXHJcbiAgICBdO1xyXG5cclxuICAgIGZvciAoY29uc3QgZm9ybWF0IG9mIGtub3duRm9ybWF0cykge1xyXG4gICAgICAgIGNvbnN0IHBhdHRlcm4gPSBuZXcgUmVnRXhwKFxyXG4gICAgICAgICAgICBgXFxcXGIke2Zvcm1hdH1cXFxcYmAsXHJcbiAgICAgICAgICAgICdpJ1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChwYXR0ZXJuLnRlc3QodGV4dCkpIHtcclxuICAgICAgICAgICAgZm9ybWF0cy5hZGQoZm9ybWF0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIEFycmF5LmZyb20oZm9ybWF0cyk7XHJcbn0iLCJpbXBvcnQgdHlwZSB7IFVwbG9hZENvbnN0cmFpbnRzIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VEaW1lbnNpb25zKFxyXG4gICAgdGV4dDogc3RyaW5nXHJcbik6IFVwbG9hZENvbnN0cmFpbnRzWydkaW1lbnNpb25zJ10gfCB1bmRlZmluZWQge1xyXG5cclxuICAgIGNvbnN0IG5vcm1hbGl6ZWRUZXh0ID0gdGV4dFxyXG4gICAgICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJylcclxuICAgICAgICAudHJpbSgpO1xyXG5cclxuICAgIC8vIEV4YW1wbGVzOlxyXG4gICAgLy8gRGltZW5zaW9uczogMjAwIHggMjMwIHBpeGVsc1xyXG4gICAgLy8gMjAweDIzMCBweFxyXG4gICAgLy8gMjAwIMOXIDIzMCBwaXhlbHNcclxuICAgIC8vIEltYWdlIHNpemU6IDIwMCBYIDIzMFxyXG5cclxuICAgIGNvbnN0IHBhdHRlcm5zID0gW1xyXG4gICAgICAgIC8oPzpkaW1lbnNpb25zP3xpbWFnZVxccytkaW1lbnNpb25zP3xpbWFnZVxccytzaXplKVxccyo6P1xccyooXFxkKylcXHMqW3jDl11cXHMqKFxcZCspXFxzKig/OnB4fHBpeGVscz8pPy9pLFxyXG5cclxuICAgICAgICAvKFxcZCspXFxzKlt4w5ddXFxzKihcXGQrKVxccyooPzpweHxwaXhlbHM/KS9pLFxyXG4gICAgXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcGF0dGVybnMpIHtcclxuICAgICAgICBjb25zdCBtYXRjaCA9IG5vcm1hbGl6ZWRUZXh0Lm1hdGNoKHBhdHRlcm4pO1xyXG5cclxuICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBtYXRjaFsxXTtcclxuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gbWF0Y2hbMl07XHJcblxyXG4gICAgICAgICAgICBpZiAoIXdpZHRoIHx8ICFoZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgd2lkdGg6IE51bWJlci5wYXJzZUludCh3aWR0aCwgMTApLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBOdW1iZXIucGFyc2VJbnQoaGVpZ2h0LCAxMCksXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbn0iLCJpbXBvcnQgdHlwZSB7IFVwbG9hZENvbnRleHQgfSBmcm9tICcuLi9kZXRlY3Rvci9leHRyYWN0VXBsb2FkQ29udGV4dCc7XHJcbmltcG9ydCB0eXBlIHsgVXBsb2FkQ29uc3RyYWludHMgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmltcG9ydCB7IHBhcnNlRmlsZVNpemUgfSBmcm9tICcuL3BhcnNlRmlsZVNpemUnO1xyXG5pbXBvcnQgeyBwYXJzZUZvcm1hdHMgfSBmcm9tICcuL3BhcnNlRm9ybWF0cyc7XHJcbmltcG9ydCB7IHBhcnNlRGltZW5zaW9ucyB9IGZyb20gJy4vcGFyc2VEaW1lbnNpb25zJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNvbnN0cmFpbnRzKFxyXG4gICAgY29udGV4dDogVXBsb2FkQ29udGV4dFxyXG4pOiBVcGxvYWRDb25zdHJhaW50cyB7XHJcbiAgICBjb25zdCBzaXplQ29uc3RyYWludHMgPSBwYXJzZUZpbGVTaXplKGNvbnRleHQubmVhcmJ5VGV4dCk7XHJcbiAgICBjb25zdCBhbGxvd2VkRm9ybWF0cyA9IHBhcnNlRm9ybWF0cyhjb250ZXh0KTtcclxuICAgIGNvbnN0IGRpbWVuc2lvbnMgPSBwYXJzZURpbWVuc2lvbnMoY29udGV4dC5uZWFyYnlUZXh0KTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIC4uLnNpemVDb25zdHJhaW50cyxcclxuXHJcbiAgICAgICAgLi4uKGFsbG93ZWRGb3JtYXRzLmxlbmd0aCA+IDAgJiYge1xyXG4gICAgICAgICAgICBhbGxvd2VkRm9ybWF0cyxcclxuICAgICAgICB9KSxcclxuXHJcbiAgICAgICAgLi4uKGRpbWVuc2lvbnMgJiYge1xyXG4gICAgICAgICAgICBkaW1lbnNpb25zLFxyXG4gICAgICAgIH0pLFxyXG4gICAgfTtcclxufSIsImV4cG9ydCBpbnRlcmZhY2UgVXBsb2FkQ29udGV4dCB7XHJcbiAgICBsYWJlbDogc3RyaW5nIHwgbnVsbDtcclxuICAgIG5lYXJieVRleHQ6IHN0cmluZztcclxuICAgIGFjY2VwdDogc3RyaW5nIHwgbnVsbDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RVcGxvYWRDb250ZXh0KFxyXG4gICAgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnRcclxuKTogVXBsb2FkQ29udGV4dCB7XHJcbiAgICBsZXQgbGFiZWw6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgIC8vIEZpbmQgPGxhYmVsIGZvcj1cImlucHV0LWlkXCI+XHJcbiAgICBpZiAoaW5wdXQuaWQpIHtcclxuICAgICAgICBjb25zdCBsYWJlbEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxMYWJlbEVsZW1lbnQ+KFxyXG4gICAgICAgICAgICBgbGFiZWxbZm9yPVwiJHtDU1MuZXNjYXBlKGlucHV0LmlkKX1cIl1gXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbGFiZWwgPSBsYWJlbEVsZW1lbnQ/LnRleHRDb250ZW50Py50cmltKCkgfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBIYW5kbGUgaW5wdXRzIHdyYXBwZWQgaW5zaWRlIDxsYWJlbD5cclxuICAgIGlmICghbGFiZWwpIHtcclxuICAgICAgICBjb25zdCBwYXJlbnRMYWJlbCA9IGlucHV0LmNsb3Nlc3QoJ2xhYmVsJyk7XHJcblxyXG4gICAgICAgIGxhYmVsID0gcGFyZW50TGFiZWw/LnRleHRDb250ZW50Py50cmltKCkgfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGb3Igbm93LCBpbnNwZWN0IHRoZSBpbnB1dCdzIHBhcmVudCBjb250YWluZXIuXHJcbiAgICBjb25zdCBwYXJlbnQgPSBpbnB1dC5wYXJlbnRFbGVtZW50O1xyXG5cclxuICAgIGNvbnN0IG5lYXJieVRleHQgPVxyXG4gICAgICAgIHBhcmVudD8uaW5uZXJUZXh0XHJcbiAgICAgICAgICAgID8ucmVwbGFjZSgvXFxzKy9nLCAnICcpXHJcbiAgICAgICAgICAgIC50cmltKCkgfHwgJyc7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBsYWJlbCxcclxuICAgICAgICBuZWFyYnlUZXh0LFxyXG4gICAgICAgIGFjY2VwdDogaW5wdXQuZ2V0QXR0cmlidXRlKCdhY2NlcHQnKSxcclxuICAgIH07XHJcbn0iLCJleHBvcnQgaW50ZXJmYWNlIEZpbGVJbmZvIHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIG1pbWVUeXBlOiBzdHJpbmc7XHJcbiAgICBzaXplQnl0ZXM6IG51bWJlcjtcclxuICAgIGV4dGVuc2lvbjogc3RyaW5nO1xyXG4gICAgd2lkdGg/OiBudW1iZXI7XHJcbiAgICBoZWlnaHQ/OiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnNwZWN0RmlsZShmaWxlOiBGaWxlKTogUHJvbWlzZTxGaWxlSW5mbz4ge1xyXG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZ2V0RXh0ZW5zaW9uKGZpbGUubmFtZSk7XHJcblxyXG4gICAgY29uc3QgaW5mbzogRmlsZUluZm8gPSB7XHJcbiAgICAgICAgbmFtZTogZmlsZS5uYW1lLFxyXG4gICAgICAgIG1pbWVUeXBlOiBmaWxlLnR5cGUsXHJcbiAgICAgICAgc2l6ZUJ5dGVzOiBmaWxlLnNpemUsXHJcbiAgICAgICAgZXh0ZW5zaW9uLFxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoZmlsZS50eXBlLnN0YXJ0c1dpdGgoJ2ltYWdlLycpKSB7XHJcbiAgICAgICAgY29uc3QgZGltZW5zaW9ucyA9IGF3YWl0IGdldEltYWdlRGltZW5zaW9ucyhmaWxlKTtcclxuXHJcbiAgICAgICAgaW5mby53aWR0aCA9IGRpbWVuc2lvbnMud2lkdGg7XHJcbiAgICAgICAgaW5mby5oZWlnaHQgPSBkaW1lbnNpb25zLmhlaWdodDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaW5mbztcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0RXh0ZW5zaW9uKGZpbGVOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgbGFzdERvdCA9IGZpbGVOYW1lLmxhc3RJbmRleE9mKCcuJyk7XHJcblxyXG4gICAgaWYgKGxhc3REb3QgPT09IC0xKSB7XHJcbiAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmaWxlTmFtZVxyXG4gICAgICAgIC5zbGljZShsYXN0RG90ICsgMSlcclxuICAgICAgICAudG9Mb3dlckNhc2UoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0SW1hZ2VEaW1lbnNpb25zKFxyXG4gICAgZmlsZTogRmlsZVxyXG4pOiBQcm9taXNlPHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBjb25zdCB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGZpbGUpO1xyXG4gICAgICAgIGNvbnN0IGltYWdlID0gbmV3IEltYWdlKCk7XHJcblxyXG4gICAgICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICB3aWR0aDogaW1hZ2UubmF0dXJhbFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBpbWFnZS5uYXR1cmFsSGVpZ2h0LFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpbWFnZS5vbmVycm9yID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XHJcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1VuYWJsZSB0byByZWFkIGltYWdlIGRpbWVuc2lvbnMuJykpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGltYWdlLnNyYyA9IHVybDtcclxuICAgIH0pO1xyXG59IiwiaW1wb3J0IHR5cGUgeyBVcGxvYWRDb25zdHJhaW50cyB9IGZyb20gJy4uL3BhcnNlci90eXBlcyc7XHJcbmltcG9ydCB0eXBlIHsgRmlsZUluZm8gfSBmcm9tICcuLi9pbnNwZWN0b3IvaW5zcGVjdEZpbGUnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBWYWxpZGF0aW9uSXNzdWUge1xyXG4gICAgdHlwZTogJ2Zvcm1hdCcgfCAnc2l6ZS10b28tbGFyZ2UnIHwgJ3NpemUtdG9vLXNtYWxsJyB8ICdkaW1lbnNpb25zJztcclxuICAgIG1lc3NhZ2U6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBWYWxpZGF0aW9uUmVzdWx0IHtcclxuICAgIGlzVmFsaWQ6IGJvb2xlYW47XHJcbiAgICBpc3N1ZXM6IFZhbGlkYXRpb25Jc3N1ZVtdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVGaWxlKFxyXG4gICAgZmlsZTogRmlsZUluZm8sXHJcbiAgICBjb25zdHJhaW50czogVXBsb2FkQ29uc3RyYWludHNcclxuKTogVmFsaWRhdGlvblJlc3VsdCB7XHJcbiAgICBjb25zdCBpc3N1ZXM6IFZhbGlkYXRpb25Jc3N1ZVtdID0gW107XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gRm9ybWF0XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaWYgKFxyXG4gICAgICAgIGNvbnN0cmFpbnRzLmFsbG93ZWRGb3JtYXRzICYmXHJcbiAgICAgICAgY29uc3RyYWludHMuYWxsb3dlZEZvcm1hdHMubGVuZ3RoID4gMFxyXG4gICAgKSB7XHJcbiAgICAgICAgY29uc3QgZmlsZUZvcm1hdCA9IGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGFsbG93ZWQgPSBjb25zdHJhaW50cy5hbGxvd2VkRm9ybWF0cy5zb21lKFxyXG4gICAgICAgICAgICAoZm9ybWF0KSA9PiBmb3JtYXQudG9Mb3dlckNhc2UoKSA9PT0gZmlsZUZvcm1hdFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmICghYWxsb3dlZCkge1xyXG4gICAgICAgICAgICBpc3N1ZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnZm9ybWF0JyxcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBGaWxlIGZvcm1hdCBcIiR7ZmlsZUZvcm1hdH1cIiBpcyBub3QgYWxsb3dlZC5gLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gTWF4aW11bSBmaWxlIHNpemVcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBpZiAoXHJcbiAgICAgICAgY29uc3RyYWludHMubWF4Qnl0ZXMgIT09IHVuZGVmaW5lZCAmJlxyXG4gICAgICAgIGZpbGUuc2l6ZUJ5dGVzID4gY29uc3RyYWludHMubWF4Qnl0ZXNcclxuICAgICkge1xyXG4gICAgICAgIGlzc3Vlcy5wdXNoKHtcclxuICAgICAgICAgICAgdHlwZTogJ3NpemUtdG9vLWxhcmdlJyxcclxuICAgICAgICAgICAgbWVzc2FnZTogYEZpbGUgaXMgdG9vIGxhcmdlLiBNYXhpbXVtIGFsbG93ZWQgc2l6ZSBpcyAke2Zvcm1hdEJ5dGVzKFxyXG4gICAgICAgICAgICAgICAgY29uc3RyYWludHMubWF4Qnl0ZXNcclxuICAgICAgICAgICAgKX0uYCxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBNaW5pbXVtIGZpbGUgc2l6ZVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGlmIChcclxuICAgICAgICBjb25zdHJhaW50cy5taW5CeXRlcyAhPT0gdW5kZWZpbmVkICYmXHJcbiAgICAgICAgZmlsZS5zaXplQnl0ZXMgPCBjb25zdHJhaW50cy5taW5CeXRlc1xyXG4gICAgKSB7XHJcbiAgICAgICAgaXNzdWVzLnB1c2goe1xyXG4gICAgICAgICAgICB0eXBlOiAnc2l6ZS10b28tc21hbGwnLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBgRmlsZSBpcyB0b28gc21hbGwuIE1pbmltdW0gcmVxdWlyZWQgc2l6ZSBpcyAke2Zvcm1hdEJ5dGVzKFxyXG4gICAgICAgICAgICAgICAgY29uc3RyYWludHMubWluQnl0ZXNcclxuICAgICAgICAgICAgKX0uYCxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBEaW1lbnNpb25zXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaWYgKGNvbnN0cmFpbnRzLmRpbWVuc2lvbnMpIHtcclxuICAgICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IGNvbnN0cmFpbnRzLmRpbWVuc2lvbnM7XHJcblxyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgICAgZmlsZS53aWR0aCAhPT0gd2lkdGggfHxcclxuICAgICAgICAgICAgZmlsZS5oZWlnaHQgIT09IGhlaWdodFxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICBpc3N1ZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnZGltZW5zaW9ucycsXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBgSW1hZ2UgZGltZW5zaW9ucyBtdXN0IGJlICR7d2lkdGh9IMOXICR7aGVpZ2h0fXB4LmAsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGlzVmFsaWQ6IGlzc3Vlcy5sZW5ndGggPT09IDAsXHJcbiAgICAgICAgaXNzdWVzLFxyXG4gICAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gZm9ybWF0Qnl0ZXMoYnl0ZXM6IG51bWJlcik6IHN0cmluZyB7XHJcbiAgICBpZiAoYnl0ZXMgPCAxMDI0KSB7XHJcbiAgICAgICAgcmV0dXJuIGAke2J5dGVzfSBCYDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYnl0ZXMgPCAxMDI0ICogMTAyNCkge1xyXG4gICAgICAgIHJldHVybiBgJHtNYXRoLnJvdW5kKGJ5dGVzIC8gMTAyNCl9IEtCYDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYCR7KGJ5dGVzIC8gKDEwMjQgKiAxMDI0KSkudG9GaXhlZCgyKX0gTUJgO1xyXG59IiwiaW1wb3J0IHR5cGUgeyBVcGxvYWRDb25zdHJhaW50cyB9IGZyb20gJy4uL3BhcnNlci90eXBlcyc7XHJcbmltcG9ydCB0eXBlIHsgRmlsZUluZm8gfSBmcm9tICcuLi9pbnNwZWN0b3IvaW5zcGVjdEZpbGUnO1xyXG5pbXBvcnQgdHlwZSB7IFRyYW5zZm9ybWF0aW9uUGxhbiB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRyYW5zZm9ybWF0aW9uUGxhbihcclxuICAgIGZpbGU6IEZpbGVJbmZvLFxyXG4gICAgY29uc3RyYWludHM6IFVwbG9hZENvbnN0cmFpbnRzXHJcbik6IFRyYW5zZm9ybWF0aW9uUGxhbiB7XHJcbiAgICBjb25zdCBwbGFuOiBUcmFuc2Zvcm1hdGlvblBsYW4gPSB7fTtcclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBGb3JtYXQgY29udmVyc2lvblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGlmIChcclxuICAgICAgICBjb25zdHJhaW50cy5hbGxvd2VkRm9ybWF0cyAmJlxyXG4gICAgICAgIGNvbnN0cmFpbnRzLmFsbG93ZWRGb3JtYXRzLmxlbmd0aCA+IDBcclxuICAgICkge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRGb3JtYXQgPSBmaWxlLmV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBmb3JtYXRBbGxvd2VkID1cclxuICAgICAgICAgICAgY29uc3RyYWludHMuYWxsb3dlZEZvcm1hdHMuaW5jbHVkZXMoY3VycmVudEZvcm1hdCk7XHJcblxyXG4gICAgICAgIGlmICghZm9ybWF0QWxsb3dlZCkge1xyXG4gICAgICAgICAgICBjb25zdCB0YXJnZXRGb3JtYXQgPSBjaG9vc2VUYXJnZXRGb3JtYXQoXHJcbiAgICAgICAgICAgICAgICBjb25zdHJhaW50cy5hbGxvd2VkRm9ybWF0c1xyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRhcmdldEZvcm1hdCkge1xyXG4gICAgICAgICAgICAgICAgcGxhbi5jb252ZXJ0VG8gPSB0YXJnZXRGb3JtYXQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gRGltZW5zaW9uc1xyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGlmIChjb25zdHJhaW50cy5kaW1lbnNpb25zKSB7XHJcbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBjb25zdHJhaW50cy5kaW1lbnNpb25zO1xyXG5cclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgIGZpbGUud2lkdGggIT09IHdpZHRoIHx8XHJcbiAgICAgICAgICAgIGZpbGUuaGVpZ2h0ICE9PSBoZWlnaHRcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgcGxhbi5yZXNpemUgPSB7XHJcbiAgICAgICAgICAgICAgICB3aWR0aCxcclxuICAgICAgICAgICAgICAgIGhlaWdodCxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gRmlsZSBzaXplXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5pZiAoXHJcbiAgICAoY29uc3RyYWludHMubWluQnl0ZXMgIT09IHVuZGVmaW5lZCAmJlxyXG4gICAgICAgIGZpbGUuc2l6ZUJ5dGVzIDwgY29uc3RyYWludHMubWluQnl0ZXMpIHx8XHJcbiAgICAoY29uc3RyYWludHMubWF4Qnl0ZXMgIT09IHVuZGVmaW5lZCAmJlxyXG4gICAgICAgIGZpbGUuc2l6ZUJ5dGVzID4gY29uc3RyYWludHMubWF4Qnl0ZXMpXHJcbikge1xyXG4gICAgcGxhbi5jb21wcmVzcyA9IHtcclxuICAgICAgICAuLi4oY29uc3RyYWludHMubWluQnl0ZXMgIT09IHVuZGVmaW5lZCAmJiB7XHJcbiAgICAgICAgICAgIG1pbkJ5dGVzOiBjb25zdHJhaW50cy5taW5CeXRlcyxcclxuICAgICAgICB9KSxcclxuXHJcbiAgICAgICAgLi4uKGNvbnN0cmFpbnRzLm1heEJ5dGVzICE9PSB1bmRlZmluZWQgJiYge1xyXG4gICAgICAgICAgICBtYXhCeXRlczogY29uc3RyYWludHMubWF4Qnl0ZXMsXHJcbiAgICAgICAgfSksXHJcblxyXG4gICAgICAgIGZvcm1hdDogY2hvb3NlQ29tcHJlc3Npb25Gb3JtYXQoXHJcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLmFsbG93ZWRGb3JtYXRzXHJcbiAgICAgICAgKSxcclxuICAgIH07XHJcbn1cclxuXHJcbiAgICByZXR1cm4gcGxhbjtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hvb3NlVGFyZ2V0Rm9ybWF0KFxyXG4gICAgYWxsb3dlZEZvcm1hdHM6IHN0cmluZ1tdXHJcbik6IFRyYW5zZm9ybWF0aW9uUGxhblsnY29udmVydFRvJ10ge1xyXG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IGFsbG93ZWRGb3JtYXRzLm1hcCgoZm9ybWF0KSA9PlxyXG4gICAgICAgIGZvcm1hdC50b0xvd2VyQ2FzZSgpXHJcbiAgICApO1xyXG5cclxuICAgIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKCdqcGVnJykpIHtcclxuICAgICAgICByZXR1cm4gJ2pwZWcnO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKCdqcGcnKSkge1xyXG4gICAgICAgIHJldHVybiAnanBlZyc7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoJ3BuZycpKSB7XHJcbiAgICAgICAgcmV0dXJuICdwbmcnO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKCd3ZWJwJykpIHtcclxuICAgICAgICByZXR1cm4gJ3dlYnAnO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNob29zZUNvbXByZXNzaW9uRm9ybWF0KFxyXG4gICAgYWxsb3dlZEZvcm1hdHM/OiBzdHJpbmdbXVxyXG4pOiAnanBlZycgfCAncG5nJyB8ICd3ZWJwJyB7XHJcbiAgICBjb25zdCBub3JtYWxpemVkID1cclxuICAgICAgICBhbGxvd2VkRm9ybWF0cz8ubWFwKChmb3JtYXQpID0+XHJcbiAgICAgICAgICAgIGZvcm1hdC50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgKSA/PyBbXTtcclxuXHJcbiAgICBpZiAoXHJcbiAgICAgICAgbm9ybWFsaXplZC5pbmNsdWRlcygnanBlZycpIHx8XHJcbiAgICAgICAgbm9ybWFsaXplZC5pbmNsdWRlcygnanBnJylcclxuICAgICkge1xyXG4gICAgICAgIHJldHVybiAnanBlZyc7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoJ3BuZycpKSB7XHJcbiAgICAgICAgcmV0dXJuICdwbmcnO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKCd3ZWJwJykpIHtcclxuICAgICAgICByZXR1cm4gJ3dlYnAnO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAnanBlZyc7XHJcbn0iLCJpbXBvcnQgdHlwZSB7IFRyYW5zZm9ybWF0aW9uUGxhbiB9IGZyb20gJy4uL3BsYW5uZXIvdHlwZXMnO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRyYW5zZm9ybUltYWdlKFxyXG4gICAgZmlsZTogRmlsZSxcclxuICAgIHBsYW46IFRyYW5zZm9ybWF0aW9uUGxhblxyXG4pOiBQcm9taXNlPEZpbGU+IHtcclxuICAgIGlmICghZmlsZS50eXBlLnN0YXJ0c1dpdGgoJ2ltYWdlLycpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICAgICBgQ2Fubm90IHRyYW5zZm9ybSBub24taW1hZ2UgZmlsZTogJHtmaWxlLnR5cGV9YFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgaW1hZ2UgPSBhd2FpdCBsb2FkSW1hZ2UoZmlsZSk7XHJcblxyXG4gICAgY29uc3Qgd2lkdGggPVxyXG4gICAgICAgIHBsYW4ucmVzaXplPy53aWR0aCA/PyBpbWFnZS5uYXR1cmFsV2lkdGg7XHJcblxyXG4gICAgY29uc3QgaGVpZ2h0ID1cclxuICAgICAgICBwbGFuLnJlc2l6ZT8uaGVpZ2h0ID8/IGltYWdlLm5hdHVyYWxIZWlnaHQ7XHJcblxyXG4gICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcblxyXG4gICAgY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG5cclxuICAgIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICBpZiAoIWNvbnRleHQpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBjcmVhdGUgY2FudmFzIGNvbnRleHQuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUHJldmVudCB0cmFuc3BhcmVudCBQTkcgYmFja2dyb3VuZHMgZnJvbSBiZWNvbWluZyBibGFja1xyXG4gICAgLy8gd2hlbiBjb252ZXJ0aW5nIHRvIEpQRUcuXHJcbiAgICBpZiAocGxhbi5jb252ZXJ0VG8gPT09ICdqcGVnJykge1xyXG4gICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gJyNmZmZmZmYnO1xyXG4gICAgICAgIGNvbnRleHQuZmlsbFJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29udGV4dC5kcmF3SW1hZ2UoXHJcbiAgICAgICAgaW1hZ2UsXHJcbiAgICAgICAgMCxcclxuICAgICAgICAwLFxyXG4gICAgICAgIHdpZHRoLFxyXG4gICAgICAgIGhlaWdodFxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBvdXRwdXRUeXBlID0gZ2V0T3V0cHV0TWltZVR5cGUoXHJcbiAgICAgICAgcGxhbi5jb252ZXJ0VG8sXHJcbiAgICAgICAgZmlsZS50eXBlXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGJsb2IgPSBhd2FpdCBjYW52YXNUb0Jsb2IoXHJcbiAgICAgICAgY2FudmFzLFxyXG4gICAgICAgIG91dHB1dFR5cGVcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZ2V0RXh0ZW5zaW9uRm9yTWltZVR5cGUoXHJcbiAgICAgICAgb3V0cHV0VHlwZVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBvdXRwdXROYW1lID0gcmVwbGFjZUV4dGVuc2lvbihcclxuICAgICAgICBmaWxlLm5hbWUsXHJcbiAgICAgICAgZXh0ZW5zaW9uXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiBuZXcgRmlsZShcclxuICAgICAgICBbYmxvYl0sXHJcbiAgICAgICAgb3V0cHV0TmFtZSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHR5cGU6IG91dHB1dFR5cGUsXHJcbiAgICAgICAgICAgIGxhc3RNb2RpZmllZDogRGF0ZS5ub3coKSxcclxuICAgICAgICB9XHJcbiAgICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb2FkSW1hZ2UoXHJcbiAgICBmaWxlOiBGaWxlXHJcbik6IFByb21pc2U8SFRNTEltYWdlRWxlbWVudD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBjb25zdCB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGZpbGUpO1xyXG4gICAgICAgIGNvbnN0IGltYWdlID0gbmV3IEltYWdlKCk7XHJcblxyXG4gICAgICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xyXG4gICAgICAgICAgICByZXNvbHZlKGltYWdlKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpbWFnZS5vbmVycm9yID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XHJcbiAgICAgICAgICAgIHJlamVjdChcclxuICAgICAgICAgICAgICAgIG5ldyBFcnJvcignVW5hYmxlIHRvIGRlY29kZSBpbWFnZS4nKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGltYWdlLnNyYyA9IHVybDtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjYW52YXNUb0Jsb2IoXHJcbiAgICBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50LFxyXG4gICAgdHlwZTogc3RyaW5nXHJcbik6IFByb21pc2U8QmxvYj4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBjYW52YXMudG9CbG9iKFxyXG4gICAgICAgICAgICAoYmxvYikgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFibG9iKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBjcmVhdGUgaW1hZ2UuJylcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGJsb2IpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0eXBlXHJcbiAgICAgICAgKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRPdXRwdXRNaW1lVHlwZShcclxuICAgIGZvcm1hdDogVHJhbnNmb3JtYXRpb25QbGFuWydjb252ZXJ0VG8nXSxcclxuICAgIG9yaWdpbmFsVHlwZTogc3RyaW5nXHJcbik6IHN0cmluZyB7XHJcbiAgICBzd2l0Y2ggKGZvcm1hdCkge1xyXG4gICAgICAgIGNhc2UgJ2pwZWcnOlxyXG4gICAgICAgICAgICByZXR1cm4gJ2ltYWdlL2pwZWcnO1xyXG5cclxuICAgICAgICBjYXNlICdwbmcnOlxyXG4gICAgICAgICAgICByZXR1cm4gJ2ltYWdlL3BuZyc7XHJcblxyXG4gICAgICAgIGNhc2UgJ3dlYnAnOlxyXG4gICAgICAgICAgICByZXR1cm4gJ2ltYWdlL3dlYnAnO1xyXG5cclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4gb3JpZ2luYWxUeXBlO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRFeHRlbnNpb25Gb3JNaW1lVHlwZShcclxuICAgIG1pbWVUeXBlOiBzdHJpbmdcclxuKTogc3RyaW5nIHtcclxuICAgIHN3aXRjaCAobWltZVR5cGUpIHtcclxuICAgICAgICBjYXNlICdpbWFnZS9qcGVnJzpcclxuICAgICAgICAgICAgcmV0dXJuICdqcGcnO1xyXG5cclxuICAgICAgICBjYXNlICdpbWFnZS9wbmcnOlxyXG4gICAgICAgICAgICByZXR1cm4gJ3BuZyc7XHJcblxyXG4gICAgICAgIGNhc2UgJ2ltYWdlL3dlYnAnOlxyXG4gICAgICAgICAgICByZXR1cm4gJ3dlYnAnO1xyXG5cclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4gJ2ltZyc7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlcGxhY2VFeHRlbnNpb24oXHJcbiAgICBmaWxlTmFtZTogc3RyaW5nLFxyXG4gICAgZXh0ZW5zaW9uOiBzdHJpbmdcclxuKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IGxhc3REb3QgPSBmaWxlTmFtZS5sYXN0SW5kZXhPZignLicpO1xyXG5cclxuICAgIGlmIChsYXN0RG90ID09PSAtMSkge1xyXG4gICAgICAgIHJldHVybiBgJHtmaWxlTmFtZX0uJHtleHRlbnNpb259YDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYCR7ZmlsZU5hbWUuc2xpY2UoMCwgbGFzdERvdCl9LiR7ZXh0ZW5zaW9ufWA7XHJcbn0iLCJleHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tcHJlc3NJbWFnZShcclxuICBmaWxlOiBGaWxlLFxyXG4gIG9wdGlvbnM6IHtcclxuICAgIG1pbkJ5dGVzPzogbnVtYmVyO1xyXG4gICAgbWF4Qnl0ZXM/OiBudW1iZXI7XHJcbiAgICBmb3JtYXQ/OiAnanBlZycgfCAncG5nJyB8ICd3ZWJwJztcclxuICB9XHJcbik6IFByb21pc2U8RmlsZT4ge1xyXG4gIGNvbnN0IHtcclxuICAgIG1pbkJ5dGVzLFxyXG4gICAgbWF4Qnl0ZXMsXHJcbiAgICBmb3JtYXQgPSAnanBlZycsXHJcbiAgfSA9IG9wdGlvbnM7XHJcblxyXG4gIGlmICghZmlsZS50eXBlLnN0YXJ0c1dpdGgoJ2ltYWdlLycpKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgIGBDYW5ub3QgY29tcHJlc3Mgbm9uLWltYWdlIGZpbGU6ICR7ZmlsZS50eXBlfWBcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvLyBBbHJlYWR5IHdpdGhpbiB0aGUgcmVxdWlyZWQgcmFuZ2UuXHJcbiAgaWYgKFxyXG4gICAgKG1pbkJ5dGVzID09PSB1bmRlZmluZWQgfHwgZmlsZS5zaXplID49IG1pbkJ5dGVzKSAmJlxyXG4gICAgKG1heEJ5dGVzID09PSB1bmRlZmluZWQgfHwgZmlsZS5zaXplIDw9IG1heEJ5dGVzKVxyXG4gICkge1xyXG4gICAgcmV0dXJuIGZpbGU7XHJcbiAgfVxyXG5cclxuICBjb25zdCBpbWFnZSA9IGF3YWl0IGxvYWRJbWFnZShmaWxlKTtcclxuXHJcbiAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcblxyXG4gIGNhbnZhcy53aWR0aCA9IGltYWdlLm5hdHVyYWxXaWR0aDtcclxuICBjYW52YXMuaGVpZ2h0ID0gaW1hZ2UubmF0dXJhbEhlaWdodDtcclxuXHJcbiAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICBpZiAoIWNvbnRleHQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGNyZWF0ZSBjYW52YXMgY29udGV4dC4nKTtcclxuICB9XHJcblxyXG4gIGNvbnRleHQuZmlsbFN0eWxlID0gJyNmZmZmZmYnO1xyXG5cclxuICBjb250ZXh0LmZpbGxSZWN0KFxyXG4gICAgMCxcclxuICAgIDAsXHJcbiAgICBjYW52YXMud2lkdGgsXHJcbiAgICBjYW52YXMuaGVpZ2h0XHJcbiAgKTtcclxuXHJcbiAgY29udGV4dC5kcmF3SW1hZ2UoXHJcbiAgICBpbWFnZSxcclxuICAgIDAsXHJcbiAgICAwLFxyXG4gICAgY2FudmFzLndpZHRoLFxyXG4gICAgY2FudmFzLmhlaWdodFxyXG4gICk7XHJcblxyXG4gIC8vIEZpbGUgaXMgYmVsb3cgdGhlIG1pbmltdW0gc2l6ZS5cclxuICBpZiAoXHJcbiAgICBtaW5CeXRlcyAhPT0gdW5kZWZpbmVkICYmXHJcbiAgICBmaWxlLnNpemUgPCBtaW5CeXRlc1xyXG4gICkge1xyXG4gICAgY29uc3QgYmxvYiA9IGF3YWl0IGNhbnZhc1RvQmxvYihcclxuICAgICAgY2FudmFzLFxyXG4gICAgICAxLFxyXG4gICAgICBmb3JtYXRcclxuICAgICk7XHJcblxyXG4gICAgY29uc29sZS5sb2coXHJcbiAgICAgICdbRmlsZVRocm91Z2hdIE1pbmltdW0tc2l6ZSBhdHRlbXB0OicsXHJcbiAgICAgIHtcclxuICAgICAgICBxdWFsaXR5OiAxLFxyXG4gICAgICAgIHNpemVCeXRlczogYmxvYi5zaXplLFxyXG4gICAgICAgIG1pbkJ5dGVzLFxyXG4gICAgICAgIG1heEJ5dGVzLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIGlmIChcclxuICAgICAgYmxvYi5zaXplID49IG1pbkJ5dGVzICYmXHJcbiAgICAgIChtYXhCeXRlcyA9PT0gdW5kZWZpbmVkIHx8XHJcbiAgICAgICAgYmxvYi5zaXplIDw9IG1heEJ5dGVzKVxyXG4gICAgKSB7XHJcbiAgICAgIHJldHVybiBjcmVhdGVDb21wcmVzc2VkRmlsZShcclxuICAgICAgICBmaWxlLFxyXG4gICAgICAgIGJsb2IsXHJcbiAgICAgICAgZm9ybWF0XHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICBibG9iLnNpemUgPCBtaW5CeXRlcyAmJlxyXG4gICAgICAobWF4Qnl0ZXMgPT09IHVuZGVmaW5lZCB8fFxyXG4gICAgICAgIGJsb2Iuc2l6ZSA8PSBtYXhCeXRlcylcclxuICAgICkge1xyXG4gICAgICBsZXQgcGFkZGVkQmxvYjogQmxvYiB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgICAgaWYgKGZvcm1hdCA9PT0gJ2pwZWcnKSB7XHJcbiAgICAgICAgcGFkZGVkQmxvYiA9XHJcbiAgICAgICAgICBhd2FpdCBwYWRKcGVnVG9NaW5pbXVtKFxyXG4gICAgICAgICAgICBibG9iLFxyXG4gICAgICAgICAgICBtaW5CeXRlc1xyXG4gICAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGZvcm1hdCA9PT0gJ3BuZycpIHtcclxuICAgICAgICBwYWRkZWRCbG9iID1cclxuICAgICAgICAgIGF3YWl0IHBhZFBuZ1RvTWluaW11bShcclxuICAgICAgICAgICAgYmxvYixcclxuICAgICAgICAgICAgbWluQnl0ZXNcclxuICAgICAgICAgICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChcclxuICAgICAgICBwYWRkZWRCbG9iICYmXHJcbiAgICAgICAgcGFkZGVkQmxvYi5zaXplID49IG1pbkJ5dGVzICYmXHJcbiAgICAgICAgKG1heEJ5dGVzID09PSB1bmRlZmluZWQgfHxcclxuICAgICAgICAgIHBhZGRlZEJsb2Iuc2l6ZSA8PSBtYXhCeXRlcylcclxuICAgICAgKSB7XHJcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUNvbXByZXNzZWRGaWxlKFxyXG4gICAgICAgICAgZmlsZSxcclxuICAgICAgICAgIHBhZGRlZEJsb2IsXHJcbiAgICAgICAgICBmb3JtYXRcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICBgVW5hYmxlIHRvIHByb2R1Y2UgYW4gaW1hZ2UgYmV0d2VlbiAke21pbkJ5dGVzfSBhbmQgJHtcclxuICAgICAgICBtYXhCeXRlcyA/PyAndW5saW1pdGVkJ1xyXG4gICAgICB9IGJ5dGVzIGF0IHRoZSByZXF1aXJlZCBkaW1lbnNpb25zLmBcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvLyBGaWxlIGlzIGFib3ZlIHRoZSBtYXhpbXVtIHNpemUuXHJcbiAgaWYgKG1heEJ5dGVzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgJ0Nhbm5vdCBjb21wcmVzcyBpbWFnZSB3aXRob3V0IGEgbWF4aW11bSBieXRlIGxpbWl0LidcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBsZXQgbG93ID0gMC4wNTtcclxuICBsZXQgaGlnaCA9IDE7XHJcbiAgbGV0IGJlc3RCbG9iOiBCbG9iIHwgbnVsbCA9IG51bGw7XHJcblxyXG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgMTA7IGF0dGVtcHQrKykge1xyXG4gICAgY29uc3QgcXVhbGl0eSA9XHJcbiAgICAgIChsb3cgKyBoaWdoKSAvIDI7XHJcblxyXG4gICAgY29uc3QgYmxvYiA9IGF3YWl0IGNhbnZhc1RvQmxvYihcclxuICAgICAgY2FudmFzLFxyXG4gICAgICBxdWFsaXR5LFxyXG4gICAgICBmb3JtYXRcclxuICAgICk7XHJcblxyXG4gICAgY29uc29sZS5sb2coXHJcbiAgICAgIGBbRmlsZVRocm91Z2hdIENvbXByZXNzaW9uIGF0dGVtcHQgJHthdHRlbXB0ICsgMX06YCxcclxuICAgICAge1xyXG4gICAgICAgIHF1YWxpdHksXHJcbiAgICAgICAgc2l6ZUJ5dGVzOiBibG9iLnNpemUsXHJcbiAgICAgICAgbWluQnl0ZXMsXHJcbiAgICAgICAgbWF4Qnl0ZXMsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgaWYgKGJsb2Iuc2l6ZSA+IG1heEJ5dGVzKSB7XHJcbiAgICAgIGhpZ2ggPSBxdWFsaXR5O1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoXHJcbiAgICAgIG1pbkJ5dGVzICE9PSB1bmRlZmluZWQgJiZcclxuICAgICAgYmxvYi5zaXplIDwgbWluQnl0ZXNcclxuICAgICkge1xyXG4gICAgICBsb3cgPSBxdWFsaXR5O1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuXHJcbiAgICBiZXN0QmxvYiA9IGJsb2I7XHJcbiAgICBsb3cgPSBxdWFsaXR5O1xyXG4gIH1cclxuXHJcbiAgaWYgKCFiZXN0QmxvYikge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICBgVW5hYmxlIHRvIHByb2R1Y2UgYW4gaW1hZ2UgYmV0d2VlbiAke1xyXG4gICAgICAgIG1pbkJ5dGVzID8/IDBcclxuICAgICAgfSBhbmQgJHttYXhCeXRlc30gYnl0ZXMuYFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBjcmVhdGVDb21wcmVzc2VkRmlsZShcclxuICAgIGZpbGUsXHJcbiAgICBiZXN0QmxvYixcclxuICAgIGZvcm1hdFxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZUNvbXByZXNzZWRGaWxlKFxyXG4gIG9yaWdpbmFsRmlsZTogRmlsZSxcclxuICBibG9iOiBCbG9iLFxyXG4gIGZvcm1hdDogJ2pwZWcnIHwgJ3BuZycgfCAnd2VicCdcclxuKTogRmlsZSB7XHJcbiAgY29uc3QgZXh0ZW5zaW9uID1cclxuICAgIGZvcm1hdCA9PT0gJ2pwZWcnXHJcbiAgICAgID8gJ2pwZydcclxuICAgICAgOiBmb3JtYXQ7XHJcblxyXG4gIGNvbnN0IG1pbWVUeXBlID1cclxuICAgIGZvcm1hdCA9PT0gJ2pwZWcnXHJcbiAgICAgID8gJ2ltYWdlL2pwZWcnXHJcbiAgICAgIDogZm9ybWF0ID09PSAncG5nJ1xyXG4gICAgICAgID8gJ2ltYWdlL3BuZydcclxuICAgICAgICA6ICdpbWFnZS93ZWJwJztcclxuXHJcbiAgcmV0dXJuIG5ldyBGaWxlKFxyXG4gICAgW2Jsb2JdLFxyXG4gICAgcmVwbGFjZUV4dGVuc2lvbihcclxuICAgICAgb3JpZ2luYWxGaWxlLm5hbWUsXHJcbiAgICAgIGV4dGVuc2lvblxyXG4gICAgKSxcclxuICAgIHtcclxuICAgICAgdHlwZTogbWltZVR5cGUsXHJcbiAgICAgIGxhc3RNb2RpZmllZDogRGF0ZS5ub3coKSxcclxuICAgIH1cclxuICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb2FkSW1hZ2UoXHJcbiAgZmlsZTogRmlsZVxyXG4pOiBQcm9taXNlPEhUTUxJbWFnZUVsZW1lbnQ+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgY29uc3QgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChmaWxlKTtcclxuXHJcbiAgICBjb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG5cclxuICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xyXG4gICAgICByZXNvbHZlKGltYWdlKTtcclxuICAgIH07XHJcblxyXG4gICAgaW1hZ2Uub25lcnJvciA9ICgpID0+IHtcclxuICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xyXG5cclxuICAgICAgcmVqZWN0KFxyXG4gICAgICAgIG5ldyBFcnJvcignVW5hYmxlIHRvIGRlY29kZSBpbWFnZS4nKVxyXG4gICAgICApO1xyXG4gICAgfTtcclxuXHJcbiAgICBpbWFnZS5zcmMgPSB1cmw7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNhbnZhc1RvQmxvYihcclxuICBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50LFxyXG4gIHF1YWxpdHk6IG51bWJlcixcclxuICBmb3JtYXQ6ICdqcGVnJyB8ICdwbmcnIHwgJ3dlYnAnXHJcbik6IFByb21pc2U8QmxvYj4ge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBjb25zdCBtaW1lVHlwZSA9XHJcbiAgICAgIGZvcm1hdCA9PT0gJ2pwZWcnXHJcbiAgICAgICAgPyAnaW1hZ2UvanBlZydcclxuICAgICAgICA6IGZvcm1hdCA9PT0gJ3BuZydcclxuICAgICAgICAgID8gJ2ltYWdlL3BuZydcclxuICAgICAgICAgIDogJ2ltYWdlL3dlYnAnO1xyXG5cclxuICAgIGNhbnZhcy50b0Jsb2IoXHJcbiAgICAgIChibG9iKSA9PiB7XHJcbiAgICAgICAgaWYgKCFibG9iKSB7XHJcbiAgICAgICAgICByZWplY3QoXHJcbiAgICAgICAgICAgIG5ldyBFcnJvcihcclxuICAgICAgICAgICAgICBgRmFpbGVkIHRvIGNyZWF0ZSAke2Zvcm1hdH0gaW1hZ2UuYFxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlc29sdmUoYmxvYik7XHJcbiAgICAgIH0sXHJcbiAgICAgIG1pbWVUeXBlLFxyXG4gICAgICBmb3JtYXQgPT09ICdwbmcnXHJcbiAgICAgICAgPyB1bmRlZmluZWRcclxuICAgICAgICA6IHF1YWxpdHlcclxuICAgICk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhZEpwZWdUb01pbmltdW0oXHJcbiAgYmxvYjogQmxvYixcclxuICBtaW5CeXRlczogbnVtYmVyXHJcbik6IFByb21pc2U8QmxvYj4ge1xyXG4gIHJldHVybiBibG9iLmFycmF5QnVmZmVyKCkudGhlbigoYnVmZmVyKSA9PiB7XHJcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICBieXRlcy5sZW5ndGggPCA0IHx8XHJcbiAgICAgIGJ5dGVzWzBdICE9PSAweGZmIHx8XHJcbiAgICAgIGJ5dGVzWzFdICE9PSAweGQ4IHx8XHJcbiAgICAgIGJ5dGVzW2J5dGVzLmxlbmd0aCAtIDJdICE9PSAweGZmIHx8XHJcbiAgICAgIGJ5dGVzW2J5dGVzLmxlbmd0aCAtIDFdICE9PSAweGQ5XHJcbiAgICApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICdDYW5ub3QgcGFkIEpQRUc6IGludmFsaWQgSlBFRyBkYXRhLidcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwYWRkaW5nQnl0ZXMgPVxyXG4gICAgICBtaW5CeXRlcyAtIGJ5dGVzLmxlbmd0aDtcclxuXHJcbiAgICBpZiAocGFkZGluZ0J5dGVzIDw9IDApIHtcclxuICAgICAgcmV0dXJuIGJsb2I7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY29tbWVudERhdGFMZW5ndGggPVxyXG4gICAgICBwYWRkaW5nQnl0ZXM7XHJcblxyXG4gICAgY29uc3QgY29tbWVudExlbmd0aCA9XHJcbiAgICAgIGNvbW1lbnREYXRhTGVuZ3RoICsgMjtcclxuXHJcbiAgICBpZiAoY29tbWVudExlbmd0aCA+IDY1NTM1KSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAnQ2Fubm90IHBhZCBKUEVHOiBwYWRkaW5nIGlzIHRvbyBsYXJnZS4nXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY29tbWVudCA9IG5ldyBVaW50OEFycmF5KFxyXG4gICAgICBjb21tZW50RGF0YUxlbmd0aCArIDRcclxuICAgICk7XHJcblxyXG4gICAgLy8gSlBFRyBDT00gbWFya2VyXHJcbiAgICBjb21tZW50WzBdID0gMHhmZjtcclxuICAgIGNvbW1lbnRbMV0gPSAweGZlO1xyXG5cclxuICAgIC8vIExlbmd0aCBpbmNsdWRlcyB0aGVzZSB0d28gbGVuZ3RoIGJ5dGVzLlxyXG4gICAgY29tbWVudFsyXSA9XHJcbiAgICAgIChjb21tZW50TGVuZ3RoID4+IDgpICYgMHhmZjtcclxuXHJcbiAgICBjb21tZW50WzNdID1cclxuICAgICAgY29tbWVudExlbmd0aCAmIDB4ZmY7XHJcblxyXG4gICAgY29uc3QgZW9pSW5kZXggPVxyXG4gICAgICBieXRlcy5sZW5ndGggLSAyO1xyXG5cclxuICAgIGNvbnN0IG91dHB1dCA9IG5ldyBVaW50OEFycmF5KFxyXG4gICAgICBieXRlcy5sZW5ndGggKyBjb21tZW50Lmxlbmd0aFxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBFdmVyeXRoaW5nIGJlZm9yZSBFT0lcclxuICAgIG91dHB1dC5zZXQoXHJcbiAgICAgIGJ5dGVzLnNsaWNlKDAsIGVvaUluZGV4KSxcclxuICAgICAgMFxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBDb21tZW50IHNlZ21lbnRcclxuICAgIG91dHB1dC5zZXQoXHJcbiAgICAgIGNvbW1lbnQsXHJcbiAgICAgIGVvaUluZGV4XHJcbiAgICApO1xyXG5cclxuICAgIC8vIE9yaWdpbmFsIEVPSSBtYXJrZXJcclxuICAgIG91dHB1dC5zZXQoXHJcbiAgICAgIGJ5dGVzLnNsaWNlKGVvaUluZGV4KSxcclxuICAgICAgZW9pSW5kZXggKyBjb21tZW50Lmxlbmd0aFxyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IEJsb2IoXHJcbiAgICAgIFtvdXRwdXRdLFxyXG4gICAgICB7IHR5cGU6ICdpbWFnZS9qcGVnJyB9XHJcbiAgICApO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYWRQbmdUb01pbmltdW0oXHJcbiAgYmxvYjogQmxvYixcclxuICBtaW5CeXRlczogbnVtYmVyXHJcbik6IFByb21pc2U8QmxvYj4ge1xyXG4gIHJldHVybiBibG9iLmFycmF5QnVmZmVyKCkudGhlbigoYnVmZmVyKSA9PiB7XHJcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICBieXRlcy5sZW5ndGggPCAxMiB8fFxyXG4gICAgICBieXRlc1swXSAhPT0gMHg4OSB8fFxyXG4gICAgICBieXRlc1sxXSAhPT0gMHg1MCB8fFxyXG4gICAgICBieXRlc1syXSAhPT0gMHg0ZSB8fFxyXG4gICAgICBieXRlc1szXSAhPT0gMHg0NyB8fFxyXG4gICAgICBieXRlc1s0XSAhPT0gMHgwZCB8fFxyXG4gICAgICBieXRlc1s1XSAhPT0gMHgwYSB8fFxyXG4gICAgICBieXRlc1s2XSAhPT0gMHgxYSB8fFxyXG4gICAgICBieXRlc1s3XSAhPT0gMHgwYVxyXG4gICAgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAnQ2Fubm90IHBhZCBQTkc6IGludmFsaWQgUE5HIGRhdGEuJ1xyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBhZGRpbmdCeXRlcyA9XHJcbiAgICAgIG1pbkJ5dGVzIC0gYnl0ZXMubGVuZ3RoO1xyXG5cclxuICAgIGlmIChwYWRkaW5nQnl0ZXMgPD0gMCkge1xyXG4gICAgICByZXR1cm4gYmxvYjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjaHVua0RhdGFMZW5ndGggPVxyXG4gICAgICBwYWRkaW5nQnl0ZXMgLSAxMjtcclxuXHJcbiAgICBpZiAoY2h1bmtEYXRhTGVuZ3RoIDwgMCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgJ0Nhbm5vdCBwYWQgUE5HOiBwYWRkaW5nIGlzIHRvbyBzbWFsbC4nXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY2h1bmsgPSBjcmVhdGVQbmdUZXh0Q2h1bmsoXHJcbiAgICAgIGNodW5rRGF0YUxlbmd0aFxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBpZW5kSW5kZXggPVxyXG4gICAgICBieXRlcy5sZW5ndGggLSAxMjtcclxuXHJcbiAgICBjb25zdCBvdXRwdXQgPSBuZXcgVWludDhBcnJheShcclxuICAgICAgYnl0ZXMubGVuZ3RoICsgY2h1bmsubGVuZ3RoXHJcbiAgICApO1xyXG5cclxuICAgIG91dHB1dC5zZXQoXHJcbiAgICAgIGJ5dGVzLnNsaWNlKDAsIGllbmRJbmRleCksXHJcbiAgICAgIDBcclxuICAgICk7XHJcblxyXG4gICAgb3V0cHV0LnNldChcclxuICAgICAgY2h1bmssXHJcbiAgICAgIGllbmRJbmRleFxyXG4gICAgKTtcclxuXHJcbiAgICBvdXRwdXQuc2V0KFxyXG4gICAgICBieXRlcy5zbGljZShpZW5kSW5kZXgpLFxyXG4gICAgICBpZW5kSW5kZXggKyBjaHVuay5sZW5ndGhcclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBCbG9iKFxyXG4gICAgICBbb3V0cHV0XSxcclxuICAgICAgeyB0eXBlOiAnaW1hZ2UvcG5nJyB9XHJcbiAgICApO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVQbmdUZXh0Q2h1bmsoXHJcbiAgZGF0YUxlbmd0aDogbnVtYmVyXHJcbik6IFVpbnQ4QXJyYXkge1xyXG4gIGNvbnN0IGNodW5rID0gbmV3IFVpbnQ4QXJyYXkoXHJcbiAgICAxMiArIGRhdGFMZW5ndGhcclxuICApO1xyXG5cclxuICAvLyBDaHVuayBsZW5ndGhcclxuICBjaHVua1swXSA9XHJcbiAgICAoZGF0YUxlbmd0aCA+PiAyNCkgJiAweGZmO1xyXG5cclxuICBjaHVua1sxXSA9XHJcbiAgICAoZGF0YUxlbmd0aCA+PiAxNikgJiAweGZmO1xyXG5cclxuICBjaHVua1syXSA9XHJcbiAgICAoZGF0YUxlbmd0aCA+PiA4KSAmIDB4ZmY7XHJcblxyXG4gIGNodW5rWzNdID1cclxuICAgIGRhdGFMZW5ndGggJiAweGZmO1xyXG5cclxuICAvLyBDaHVuayB0eXBlOiB0RVh0XHJcbiAgY2h1bmtbNF0gPSAweDc0O1xyXG4gIGNodW5rWzVdID0gMHg0NTtcclxuICBjaHVua1s2XSA9IDB4NTg7XHJcbiAgY2h1bmtbN10gPSAweDc0O1xyXG5cclxuICAvLyBMZWF2ZSB0aGUgdGV4dCBkYXRhIGFzIHplcm8gYnl0ZXMuXHJcbiAgLy8gQ1JDIGlzIGNhbGN1bGF0ZWQgYmVsb3cuXHJcbiAgY29uc3QgY3JjID0gY3JjMzIoXHJcbiAgICBjaHVuay5zbGljZSg0LCA4ICsgZGF0YUxlbmd0aClcclxuICApO1xyXG5cclxuICBjaHVua1s4XSA9XHJcbiAgICAoY3JjID4+PiAyNCkgJiAweGZmO1xyXG5cclxuICBjaHVua1s5XSA9XHJcbiAgICAoY3JjID4+PiAxNikgJiAweGZmO1xyXG5cclxuICBjaHVua1sxMF0gPVxyXG4gICAgKGNyYyA+Pj4gOCkgJiAweGZmO1xyXG5cclxuICBjaHVua1sxMV0gPVxyXG4gICAgY3JjICYgMHhmZjtcclxuXHJcbiAgcmV0dXJuIGNodW5rO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmMzMihcclxuICBieXRlczogVWludDhBcnJheVxyXG4pOiBudW1iZXIge1xyXG4gIGxldCBjcmMgPSAweGZmZmZmZmZmO1xyXG5cclxuICBmb3IgKGNvbnN0IGJ5dGUgb2YgYnl0ZXMpIHtcclxuICAgIGNyYyBePSBieXRlO1xyXG5cclxuICAgIGZvciAobGV0IGJpdCA9IDA7IGJpdCA8IDg7IGJpdCsrKSB7XHJcbiAgICAgIGNyYyA9XHJcbiAgICAgICAgKGNyYyA+Pj4gMSkgXlxyXG4gICAgICAgIChjcmMgJiAxXHJcbiAgICAgICAgICA/IDB4ZWRiODgzMjBcclxuICAgICAgICAgIDogMCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gKGNyYyBeIDB4ZmZmZmZmZmYpID4+PiAwO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZXBsYWNlRXh0ZW5zaW9uKFxyXG4gIGZpbGVOYW1lOiBzdHJpbmcsXHJcbiAgZXh0ZW5zaW9uOiBzdHJpbmdcclxuKTogc3RyaW5nIHtcclxuICBjb25zdCBsYXN0RG90ID0gZmlsZU5hbWUubGFzdEluZGV4T2YoJy4nKTtcclxuXHJcbiAgaWYgKGxhc3REb3QgPT09IC0xKSB7XHJcbiAgICByZXR1cm4gYCR7ZmlsZU5hbWV9LiR7ZXh0ZW5zaW9ufWA7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gYCR7ZmlsZU5hbWUuc2xpY2UoMCwgbGFzdERvdCl9LiR7ZXh0ZW5zaW9ufWA7XHJcbn07IiwiaW1wb3J0IHR5cGUgeyBGaWxlUHJvY2Vzc2VkTWVzc2FnZSB9IGZyb20gJy4uL2NvcmUvbWVzc2FnZXMnO1xyXG5pbXBvcnQgeyBwYXJzZUNvbnN0cmFpbnRzIH0gZnJvbSAnLi4vY29yZS9wYXJzZXIvcGFyc2VDb25zdHJhaW50cyc7XHJcbmltcG9ydCB7IGV4dHJhY3RVcGxvYWRDb250ZXh0IH0gZnJvbSAnLi4vY29yZS9kZXRlY3Rvci9leHRyYWN0VXBsb2FkQ29udGV4dCc7XHJcbmltcG9ydCB7IGluc3BlY3RGaWxlIH0gZnJvbSAnLi4vY29yZS9pbnNwZWN0b3IvaW5zcGVjdEZpbGUnO1xyXG5pbXBvcnQgeyB2YWxpZGF0ZUZpbGUgfSBmcm9tICcuLi9jb3JlL3ZhbGlkYXRvci92YWxpZGF0ZUZpbGUnO1xyXG5pbXBvcnQgeyBjcmVhdGVUcmFuc2Zvcm1hdGlvblBsYW4gfSBmcm9tICcuLi9jb3JlL3BsYW5uZXIvY3JlYXRlVHJhbnNmb3JtYXRpb25QbGFuJztcclxuaW1wb3J0IHsgdHJhbnNmb3JtSW1hZ2UgfSBmcm9tICcuLi9jb3JlL3RyYW5zZm9ybWVyL3RyYW5zZm9ybUltYWdlJztcclxuaW1wb3J0IHsgY29tcHJlc3NJbWFnZSB9IGZyb20gJy4uL2NvcmUvdHJhbnNmb3JtZXIvY29tcHJlc3NJbWFnZSc7XHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbnRlbnRTY3JpcHQoe1xyXG4gIG1hdGNoZXM6IFsnPGFsbF91cmxzPiddLFxyXG5cclxuICBtYWluKCkge1xyXG4gICAgY29uc29sZS5sb2coJ1tGaWxlVGhyb3VnaF0gQ29udGVudCBzY3JpcHQgbG9hZGVkJyk7XHJcblxyXG4gICAgY29uc3QgZGV0ZWN0ZWRJbnB1dHMgPSBuZXcgV2Vha1NldDxIVE1MSW5wdXRFbGVtZW50PigpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyRmlsZUlucHV0KGlucHV0OiBIVE1MSW5wdXRFbGVtZW50KSB7XHJcbiAgICAgIC8vIERvbid0IHByb2Nlc3MgdGhlIHNhbWUgaW5wdXQgdHdpY2VcclxuICAgICAgaWYgKGRldGVjdGVkSW5wdXRzLmhhcyhpbnB1dCkpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGRldGVjdGVkSW5wdXRzLmFkZChpbnB1dCk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZygnW0ZpbGVUaHJvdWdoXSBVcGxvYWQgZmllbGQgZGV0ZWN0ZWQnLCB7XHJcbiAgICAgICAgYWNjZXB0OiBpbnB1dC5hY2NlcHQgfHwgJ05vdCBzcGVjaWZpZWQnLFxyXG4gICAgICAgIG11bHRpcGxlOiBpbnB1dC5tdWx0aXBsZSxcclxuICAgICAgICBuYW1lOiBpbnB1dC5uYW1lIHx8ICdOb3Qgc3BlY2lmaWVkJyxcclxuICAgICAgICBpZDogaW5wdXQuaWQgfHwgJ05vdCBzcGVjaWZpZWQnLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vMS5FeHRyYWN0IGNvbnRleHRcclxuICAgICAgY29uc3QgY29udGV4dCA9IGV4dHJhY3RVcGxvYWRDb250ZXh0KGlucHV0KTtcclxuICAgICAgY29uc29sZS5sb2coJ1tGaWxlVGhyb3VnaF0gVXBsb2FkIGNvbnRleHQnLCBjb250ZXh0KTtcclxuICAgICAgLy8yLlBhcnNlIGNvbnN0cmFpbnRzXHJcbiAgICAgIGNvbnN0IGNvbnN0cmFpbnRzID0gcGFyc2VDb25zdHJhaW50cyhjb250ZXh0KTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICdbRmlsZVRocm91Z2hdIFVwbG9hZCBjb25zdHJhaW50cycsXHJcbiAgICAgICAgY29uc3RyYWludHNcclxuICAgICAgKTtcclxuICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgYXN5bmMgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgaWYgKGV2ZW50LmlzVHJ1c3RlZCA9PT0gZmFsc2UpIHtcclxuICByZXR1cm47XHJcbn1cclxuICAgICAgICBjb25zdCBmaWxlID0gaW5wdXQuZmlsZXM/LlswXTtcclxuXHJcbiAgICAgICAgaWYgKCFmaWxlKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgZmlsZUluZm8gPSBhd2FpdCBpbnNwZWN0RmlsZShmaWxlKTtcclxuXHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgJ1tGaWxlVGhyb3VnaF0gU2VsZWN0ZWQgZmlsZScsXHJcbiAgICAgICAgICAgIGZpbGVJbmZvXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgLy8zLlZhbGlkYXRlIHRoZSBmaWxlXHJcbiAgICAgICAgICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVGaWxlKGZpbGVJbmZvLCBjb25zdHJhaW50cyk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgJ1tGaWxlVGhyb3VnaF0gVmFsaWRhdGlvbiByZXN1bHQnLFxyXG4gICAgICAgICAgICB2YWxpZGF0aW9uXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIC8vNC5DcmVhdGUgdHJhbnNmb3JtYXRpb24gcGxhblxyXG4gICAgICAgICAgY29uc3QgcGxhbiA9IGNyZWF0ZVRyYW5zZm9ybWF0aW9uUGxhbihmaWxlSW5mbywgY29uc3RyYWludHMpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ1tGaWxlVGhyb3VnaF0gVHJhbnNmb3JtYXRpb24gcGxhbicsIHBsYW4pO1xyXG4gICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHBsYW4pLmxlbmd0aCA+IDApIHtcclxuICBsZXQgdHJhbnNmb3JtZWRGaWxlID0gZmlsZTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIHRyYW5zZm9ybWVkRmlsZSA9XHJcbiAgICAgIGF3YWl0IHRyYW5zZm9ybUltYWdlKGZpbGUsIHBsYW4pO1xyXG5cclxuICAgIGNvbnN0IHRyYW5zZm9ybWVkSW5mbyA9XHJcbiAgICAgIGF3YWl0IGluc3BlY3RGaWxlKHRyYW5zZm9ybWVkRmlsZSk7XHJcblxyXG4gICAgY29uc29sZS5sb2coXHJcbiAgICAgICdbRmlsZVRocm91Z2hdIFRyYW5zZm9ybWVkIGZpbGUnLFxyXG4gICAgICB0cmFuc2Zvcm1lZEluZm9cclxuICAgICk7XHJcbiAgfVxyXG4gIGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcignW0ZpbGVUaHJvdWdoXSBUcmFuc2Zvcm1hdGlvbiBmYWlsZWQnLCBlcnJvcik7XHJcbiAgfVxyXG5cclxuICBsZXQgZmluYWxGaWxlID0gdHJhbnNmb3JtZWRGaWxlO1xyXG5cclxuICBpZiAocGxhbi5jb21wcmVzcykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgZmluYWxGaWxlID0gYXdhaXQgY29tcHJlc3NJbWFnZShcclxuICAgICAgICB0cmFuc2Zvcm1lZEZpbGUsXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgbWluQnl0ZXM6IHBsYW4uY29tcHJlc3MubWluQnl0ZXMsXHJcbiAgICAgICAgICBtYXhCeXRlczogcGxhbi5jb21wcmVzcy5tYXhCeXRlcyxcclxuICAgICAgICAgIGZvcm1hdDogcGxhbi5jb21wcmVzcy5mb3JtYXQsXHJcbiAgICAgICAgfVxyXG4gICAgICApO1xyXG5cclxuICAgICAgY29uc3QgZmluYWxJbmZvID1cclxuICAgICAgICBhd2FpdCBpbnNwZWN0RmlsZShmaW5hbEZpbGUpO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgJ1tGaWxlVGhyb3VnaF0gQ29tcHJlc3NlZCBmaWxlJyxcclxuICAgICAgICBmaW5hbEluZm9cclxuICAgICAgKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFxyXG4gICAgICAgICdbRmlsZVRocm91Z2hdIENvbXByZXNzaW9uIGZhaWxlZCcsXHJcbiAgICAgICAgZXJyb3JcclxuICAgICAgKTtcclxuICAgIH1cclxuICB9XHJcbiAgcmVwbGFjZUlucHV0RmlsZShpbnB1dCwgZmluYWxGaWxlKTtcclxuXHJcbiAgaW5wdXQuZGlzcGF0Y2hFdmVudChcclxuICBuZXcgRXZlbnQoJ2NoYW5nZScsIHtcclxuICAgIGJ1YmJsZXM6IHRydWUsXHJcbiAgfSlcclxuKTtcclxuXHJcbmNvbnNvbGUubG9nKFxyXG4gICdbRmlsZVRocm91Z2hdIEZpbmFsIGZpbGUgaW5qZWN0ZWQnLFxyXG4gIHtcclxuICAgIG5hbWU6IGZpbmFsRmlsZS5uYW1lLFxyXG4gICAgdHlwZTogZmluYWxGaWxlLnR5cGUsXHJcbiAgICBzaXplQnl0ZXM6IGZpbmFsRmlsZS5zaXplLFxyXG4gIH1cclxuKTtcclxuY29uc3QgbWVzc2FnZTogRmlsZVByb2Nlc3NlZE1lc3NhZ2UgPSB7XHJcbiAgdHlwZTogJ2ZpbGUtcHJvY2Vzc2VkJyxcclxuICBmaWxlOiB7XHJcbiAgICBuYW1lOiBmaW5hbEZpbGUubmFtZSxcclxuICAgIHR5cGU6IGZpbmFsRmlsZS50eXBlLFxyXG4gICAgc2l6ZUJ5dGVzOiBmaW5hbEZpbGUuc2l6ZSxcclxuICB9LFxyXG59O1xyXG5cclxuYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKG1lc3NhZ2UpO1xyXG59XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tGaWxlVGhyb3VnaF0gQ291bGQgbm90IGluc3BlY3QgZmlsZScsIGVycm9yKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJlcGxhY2VJbnB1dEZpbGUoXHJcbiAgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQsXHJcbiAgZmlsZTogRmlsZVxyXG4pIHtcclxuICBjb25zdCBkYXRhVHJhbnNmZXIgPSBuZXcgRGF0YVRyYW5zZmVyKCk7XHJcblxyXG4gIGRhdGFUcmFuc2Zlci5pdGVtcy5hZGQoZmlsZSk7XHJcblxyXG4gIGlucHV0LmZpbGVzID0gZGF0YVRyYW5zZmVyLmZpbGVzO1xyXG59XHJcblxyXG4gICAgZnVuY3Rpb24gc2NhbkZvckZpbGVJbnB1dHMocm9vdDogUGFyZW50Tm9kZSA9IGRvY3VtZW50KSB7XHJcbiAgICAgIGNvbnN0IGlucHV0cyA9XHJcbiAgICAgICAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxJbnB1dEVsZW1lbnQ+KCdpbnB1dFt0eXBlPVwiZmlsZVwiXScpO1xyXG5cclxuICAgICAgaW5wdXRzLmZvckVhY2gocmVnaXN0ZXJGaWxlSW5wdXQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNjYW4gaW5wdXRzIGFscmVhZHkgcHJlc2VudCBvbiB0aGUgcGFnZVxyXG4gICAgc2NhbkZvckZpbGVJbnB1dHMoKTtcclxuXHJcbiAgICAvLyBXYXRjaCBmb3IgaW5wdXRzIGFkZGVkIGxhdGVyXHJcbiAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcclxuICAgICAgZm9yIChjb25zdCBtdXRhdGlvbiBvZiBtdXRhdGlvbnMpIHtcclxuICAgICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgbXV0YXRpb24uYWRkZWROb2Rlcykge1xyXG4gICAgICAgICAgaWYgKCEobm9kZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBUaGUgYWRkZWQgZWxlbWVudCBpdHNlbGYgbWlnaHQgYmUgYSBmaWxlIGlucHV0XHJcbiAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgIG5vZGUgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50ICYmXHJcbiAgICAgICAgICAgIG5vZGUudHlwZSA9PT0gJ2ZpbGUnXHJcbiAgICAgICAgICApIHtcclxuICAgICAgICAgICAgcmVnaXN0ZXJGaWxlSW5wdXQobm9kZSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gT3IgaXQgbWlnaHQgY29udGFpbiBmaWxlIGlucHV0c1xyXG4gICAgICAgICAgc2NhbkZvckZpbGVJbnB1dHMobm9kZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwge1xyXG4gICAgICBjaGlsZExpc3Q6IHRydWUsXHJcbiAgICAgIHN1YnRyZWU6IHRydWUsXHJcbiAgICB9KTtcclxuICB9LFxyXG59KTsiLCIvLyNyZWdpb24gc3JjL3V0aWxzL2ludGVybmFsL2xvZ2dlci50c1xuZnVuY3Rpb24gcHJpbnQobWV0aG9kLCAuLi5hcmdzKSB7XG5cdGlmIChpbXBvcnQubWV0YS5lbnYuTU9ERSA9PT0gXCJwcm9kdWN0aW9uXCIpIHJldHVybjtcblx0aWYgKHR5cGVvZiBhcmdzWzBdID09PSBcInN0cmluZ1wiKSBtZXRob2QoYFt3eHRdICR7YXJncy5zaGlmdCgpfWAsIC4uLmFyZ3MpO1xuXHRlbHNlIG1ldGhvZChcIlt3eHRdXCIsIC4uLmFyZ3MpO1xufVxuLyoqIFdyYXBwZXIgYXJvdW5kIGBjb25zb2xlYCB3aXRoIGEgXCJbd3h0XVwiIHByZWZpeCAqL1xuY29uc3QgbG9nZ2VyID0ge1xuXHRkZWJ1ZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZGVidWcsIC4uLmFyZ3MpLFxuXHRsb2c6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmxvZywgLi4uYXJncyksXG5cdHdhcm46ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLndhcm4sIC4uLmFyZ3MpLFxuXHRlcnJvcjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZXJyb3IsIC4uLmFyZ3MpXG59O1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBsb2dnZXIgfTtcbiIsImltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvdXRpbHMvaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy50c1xudmFyIFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgPSBjbGFzcyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50IGV4dGVuZHMgRXZlbnQge1xuXHRzdGF0aWMgRVZFTlRfTkFNRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcInd4dDpsb2NhdGlvbmNoYW5nZVwiKTtcblx0Y29uc3RydWN0b3IobmV3VXJsLCBvbGRVcmwpIHtcblx0XHRzdXBlcihXeHRMb2NhdGlvbkNoYW5nZUV2ZW50LkVWRU5UX05BTUUsIHt9KTtcblx0XHR0aGlzLm5ld1VybCA9IG5ld1VybDtcblx0XHR0aGlzLm9sZFVybCA9IG9sZFVybDtcblx0fVxufTtcbi8qKlxuKiBSZXR1cm5zIGFuIGV2ZW50IG5hbWUgdW5pcXVlIHRvIHRoZSBleHRlbnNpb24gYW5kIGNvbnRlbnQgc2NyaXB0IHRoYXQnc1xuKiBydW5uaW5nLlxuKi9cbmZ1bmN0aW9uIGdldFVuaXF1ZUV2ZW50TmFtZShldmVudE5hbWUpIHtcblx0cmV0dXJuIGAke2Jyb3dzZXI/LnJ1bnRpbWU/LmlkfToke2ltcG9ydC5tZXRhLmVudi5FTlRSWVBPSU5UfToke2V2ZW50TmFtZX1gO1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50LCBnZXRVbmlxdWVFdmVudE5hbWUgfTtcbiIsImltcG9ydCB7IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgfSBmcm9tIFwiLi9jdXN0b20tZXZlbnRzLm1qc1wiO1xuLy8jcmVnaW9uIHNyYy91dGlscy9pbnRlcm5hbC9sb2NhdGlvbi13YXRjaGVyLnRzXG5jb25zdCBzdXBwb3J0c05hdmlnYXRpb25BcGkgPSB0eXBlb2YgZ2xvYmFsVGhpcy5uYXZpZ2F0aW9uPy5hZGRFdmVudExpc3RlbmVyID09PSBcImZ1bmN0aW9uXCI7XG4vKipcbiogQ3JlYXRlIGEgdXRpbCB0aGF0IHdhdGNoZXMgZm9yIFVSTCBjaGFuZ2VzLCBkaXNwYXRjaGluZyB0aGUgY3VzdG9tIGV2ZW50IHdoZW5cbiogZGV0ZWN0ZWQuIFN0b3BzIHdhdGNoaW5nIHdoZW4gY29udGVudCBzY3JpcHQgaXMgaW52YWxpZGF0ZWQuIFVzZXMgTmF2aWdhdGlvblxuKiBBUEkgd2hlbiBhdmFpbGFibGUsIG90aGVyd2lzZSBmYWxscyBiYWNrIHRvIHBvbGxpbmcuXG4qL1xuZnVuY3Rpb24gY3JlYXRlTG9jYXRpb25XYXRjaGVyKGN0eCkge1xuXHRsZXQgbGFzdFVybDtcblx0bGV0IHdhdGNoaW5nID0gZmFsc2U7XG5cdHJldHVybiB7IHJ1bigpIHtcblx0XHRpZiAod2F0Y2hpbmcpIHJldHVybjtcblx0XHR3YXRjaGluZyA9IHRydWU7XG5cdFx0bGFzdFVybCA9IG5ldyBVUkwobG9jYXRpb24uaHJlZik7XG5cdFx0aWYgKHN1cHBvcnRzTmF2aWdhdGlvbkFwaSkgZ2xvYmFsVGhpcy5uYXZpZ2F0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJuYXZpZ2F0ZVwiLCAoZXZlbnQpID0+IHtcblx0XHRcdGNvbnN0IG5ld1VybCA9IG5ldyBVUkwoZXZlbnQuZGVzdGluYXRpb24udXJsKTtcblx0XHRcdGlmIChuZXdVcmwuaHJlZiA9PT0gbGFzdFVybC5ocmVmKSByZXR1cm47XG5cdFx0XHR3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgV3h0TG9jYXRpb25DaGFuZ2VFdmVudChuZXdVcmwsIGxhc3RVcmwpKTtcblx0XHRcdGxhc3RVcmwgPSBuZXdVcmw7XG5cdFx0fSwgeyBzaWduYWw6IGN0eC5zaWduYWwgfSk7XG5cdFx0ZWxzZSBjdHguc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0Y29uc3QgbmV3VXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcblx0XHRcdGlmIChuZXdVcmwuaHJlZiAhPT0gbGFzdFVybC5ocmVmKSB7XG5cdFx0XHRcdHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50KG5ld1VybCwgbGFzdFVybCkpO1xuXHRcdFx0XHRsYXN0VXJsID0gbmV3VXJsO1xuXHRcdFx0fVxuXHRcdH0sIDFlMyk7XG5cdH0gfTtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgY3JlYXRlTG9jYXRpb25XYXRjaGVyIH07XG4iLCJpbXBvcnQgeyBsb2dnZXIgfSBmcm9tIFwiLi9pbnRlcm5hbC9sb2dnZXIubWpzXCI7XG5pbXBvcnQgeyBnZXRVbmlxdWVFdmVudE5hbWUgfSBmcm9tIFwiLi9pbnRlcm5hbC9jdXN0b20tZXZlbnRzLm1qc1wiO1xuaW1wb3J0IHsgY3JlYXRlTG9jYXRpb25XYXRjaGVyIH0gZnJvbSBcIi4vaW50ZXJuYWwvbG9jYXRpb24td2F0Y2hlci5tanNcIjtcbmltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvdXRpbHMvY29udGVudC1zY3JpcHQtY29udGV4dC50c1xuLyoqXG4qIEltcGxlbWVudHNcbiogW2BBYm9ydENvbnRyb2xsZXJgXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQWJvcnRDb250cm9sbGVyKS5cbiogVXNlZCB0byBkZXRlY3QgYW5kIHN0b3AgY29udGVudCBzY3JpcHQgY29kZSB3aGVuIHRoZSBzY3JpcHQgaXMgaW52YWxpZGF0ZWQuXG4qXG4qIEl0IGFsc28gcHJvdmlkZXMgc2V2ZXJhbCB1dGlsaXRpZXMgbGlrZSBgY3R4LnNldFRpbWVvdXRgIGFuZFxuKiBgY3R4LnNldEludGVydmFsYCB0aGF0IHNob3VsZCBiZSB1c2VkIGluIGNvbnRlbnQgc2NyaXB0cyBpbnN0ZWFkIG9mXG4qIGB3aW5kb3cuc2V0VGltZW91dGAgb3IgYHdpbmRvdy5zZXRJbnRlcnZhbGAuXG4qXG4qIFRvIGNyZWF0ZSBjb250ZXh0IGZvciB0ZXN0aW5nLCB5b3UgY2FuIHVzZSB0aGUgY2xhc3MncyBjb25zdHJ1Y3RvcjpcbipcbiogYGBgdHNcbiogaW1wb3J0IHsgQ29udGVudFNjcmlwdENvbnRleHQgfSBmcm9tICd3eHQvdXRpbHMvY29udGVudC1zY3JpcHRzLWNvbnRleHQnO1xuKlxuKiB0ZXN0KCdzdG9yYWdlIGxpc3RlbmVyIHNob3VsZCBiZSByZW1vdmVkIHdoZW4gY29udGV4dCBpcyBpbnZhbGlkYXRlZCcsICgpID0+IHtcbiogICBjb25zdCBjdHggPSBuZXcgQ29udGVudFNjcmlwdENvbnRleHQoJ3Rlc3QnKTtcbiogICBjb25zdCBpdGVtID0gc3RvcmFnZS5kZWZpbmVJdGVtKCdsb2NhbDpjb3VudCcsIHsgZGVmYXVsdFZhbHVlOiAwIH0pO1xuKiAgIGNvbnN0IHdhdGNoZXIgPSB2aS5mbigpO1xuKlxuKiAgIGNvbnN0IHVud2F0Y2ggPSBpdGVtLndhdGNoKHdhdGNoZXIpO1xuKiAgIGN0eC5vbkludmFsaWRhdGVkKHVud2F0Y2gpOyAvLyBMaXN0ZW4gZm9yIGludmFsaWRhdGUgaGVyZVxuKlxuKiAgIGF3YWl0IGl0ZW0uc2V0VmFsdWUoMSk7XG4qICAgZXhwZWN0KHdhdGNoZXIpLnRvQmVDYWxsZWRUaW1lcygxKTtcbiogICBleHBlY3Qod2F0Y2hlcikudG9CZUNhbGxlZFdpdGgoMSwgMCk7XG4qXG4qICAgY3R4Lm5vdGlmeUludmFsaWRhdGVkKCk7IC8vIFVzZSB0aGlzIGZ1bmN0aW9uIHRvIGludmFsaWRhdGUgdGhlIGNvbnRleHRcbiogICBhd2FpdCBpdGVtLnNldFZhbHVlKDIpO1xuKiAgIGV4cGVjdCh3YXRjaGVyKS50b0JlQ2FsbGVkVGltZXMoMSk7XG4qIH0pO1xuKiBgYGBcbiovXG52YXIgQ29udGVudFNjcmlwdENvbnRleHQgPSBjbGFzcyBDb250ZW50U2NyaXB0Q29udGV4dCB7XG5cdHN0YXRpYyBTQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUgPSBnZXRVbmlxdWVFdmVudE5hbWUoXCJ3eHQ6Y29udGVudC1zY3JpcHQtc3RhcnRlZFwiKTtcblx0aWQ7XG5cdGFib3J0Q29udHJvbGxlcjtcblx0bG9jYXRpb25XYXRjaGVyID0gY3JlYXRlTG9jYXRpb25XYXRjaGVyKHRoaXMpO1xuXHRjb25zdHJ1Y3Rvcihjb250ZW50U2NyaXB0TmFtZSwgb3B0aW9ucykge1xuXHRcdHRoaXMuY29udGVudFNjcmlwdE5hbWUgPSBjb250ZW50U2NyaXB0TmFtZTtcblx0XHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXHRcdHRoaXMuaWQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKTtcblx0XHR0aGlzLmFib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcblx0XHR0aGlzLnN0b3BPbGRTY3JpcHRzKCk7XG5cdFx0dGhpcy5saXN0ZW5Gb3JOZXdlclNjcmlwdHMoKTtcblx0fVxuXHRnZXQgc2lnbmFsKCkge1xuXHRcdHJldHVybiB0aGlzLmFib3J0Q29udHJvbGxlci5zaWduYWw7XG5cdH1cblx0YWJvcnQocmVhc29uKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWJvcnRDb250cm9sbGVyLmFib3J0KHJlYXNvbik7XG5cdH1cblx0Z2V0IGlzSW52YWxpZCgpIHtcblx0XHRpZiAoYnJvd3Nlci5ydW50aW1lPy5pZCA9PSBudWxsKSB0aGlzLm5vdGlmeUludmFsaWRhdGVkKCk7XG5cdFx0cmV0dXJuIHRoaXMuc2lnbmFsLmFib3J0ZWQ7XG5cdH1cblx0Z2V0IGlzVmFsaWQoKSB7XG5cdFx0cmV0dXJuICF0aGlzLmlzSW52YWxpZDtcblx0fVxuXHQvKipcblx0KiBBZGQgYSBsaXN0ZW5lciB0aGF0IGlzIGNhbGxlZCB3aGVuIHRoZSBjb250ZW50IHNjcmlwdCdzIGNvbnRleHQgaXNcblx0KiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIEBleGFtcGxlXG5cdCogICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKGNiKTtcblx0KiAgIGNvbnN0IHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIgPSBjdHgub25JbnZhbGlkYXRlZCgoKSA9PiB7XG5cdCogICAgIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UucmVtb3ZlTGlzdGVuZXIoY2IpO1xuXHQqICAgfSk7XG5cdCogICAvLyAuLi5cblx0KiAgIHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIoKTtcblx0KlxuXHQqIEByZXR1cm5zIEEgZnVuY3Rpb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lci5cblx0Ki9cblx0b25JbnZhbGlkYXRlZChjYikge1xuXHRcdHRoaXMuc2lnbmFsLmFkZEV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBjYik7XG5cdFx0cmV0dXJuICgpID0+IHRoaXMuc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBjYik7XG5cdH1cblx0LyoqXG5cdCogUmV0dXJuIGEgcHJvbWlzZSB0aGF0IG5ldmVyIHJlc29sdmVzLiBVc2VmdWwgaWYgeW91IGhhdmUgYW4gYXN5bmMgZnVuY3Rpb25cblx0KiB0aGF0IHNob3VsZG4ndCBydW4gYWZ0ZXIgdGhlIGNvbnRleHQgaXMgZXhwaXJlZC5cblx0KlxuXHQqIEBleGFtcGxlXG5cdCogICBjb25zdCBnZXRWYWx1ZUZyb21TdG9yYWdlID0gYXN5bmMgKCkgPT4ge1xuXHQqICAgICBpZiAoY3R4LmlzSW52YWxpZCkgcmV0dXJuIGN0eC5ibG9jaygpO1xuXHQqXG5cdCogICAgIC8vIC4uLlxuXHQqICAgfTtcblx0Ki9cblx0YmxvY2soKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKCgpID0+IHt9KTtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnNldEludGVydmFsYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2xlYXJzIHRoZSBpbnRlcnZhbFxuXHQqIHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBJbnRlcnZhbHMgY2FuIGJlIGNsZWFyZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBjbGVhckludGVydmFsYCBmdW5jdGlvbi5cblx0Ki9cblx0c2V0SW50ZXJ2YWwoaGFuZGxlciwgdGltZW91dCkge1xuXHRcdGNvbnN0IGlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgaGFuZGxlcigpO1xuXHRcdH0sIHRpbWVvdXQpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjbGVhckludGVydmFsKGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cuc2V0VGltZW91dGAgdGhhdCBhdXRvbWF0aWNhbGx5IGNsZWFycyB0aGUgaW50ZXJ2YWxcblx0KiB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogVGltZW91dHMgY2FuIGJlIGNsZWFyZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBzZXRUaW1lb3V0YCBmdW5jdGlvbi5cblx0Ki9cblx0c2V0VGltZW91dChoYW5kbGVyLCB0aW1lb3V0KSB7XG5cdFx0Y29uc3QgaWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcblx0XHR9LCB0aW1lb3V0KTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJUaW1lb3V0KGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2FuY2Vsc1xuXHQqIHRoZSByZXF1ZXN0IHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBDYWxsYmFja3MgY2FuIGJlIGNhbmNlbGVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgY2FuY2VsQW5pbWF0aW9uRnJhbWVgXG5cdCogZnVuY3Rpb24uXG5cdCovXG5cdHJlcXVlc3RBbmltYXRpb25GcmFtZShjYWxsYmFjaykge1xuXHRcdGNvbnN0IGlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCguLi5hcmdzKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSBjYWxsYmFjayguLi5hcmdzKTtcblx0XHR9KTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2FuY2VsQW5pbWF0aW9uRnJhbWUoaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5yZXF1ZXN0SWRsZUNhbGxiYWNrYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2FuY2VscyB0aGVcblx0KiByZXF1ZXN0IHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBDYWxsYmFja3MgY2FuIGJlIGNhbmNlbGVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgY2FuY2VsSWRsZUNhbGxiYWNrYFxuXHQqIGZ1bmN0aW9uLlxuXHQqL1xuXHRyZXF1ZXN0SWRsZUNhbGxiYWNrKGNhbGxiYWNrLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgaWQgPSByZXF1ZXN0SWRsZUNhbGxiYWNrKCguLi5hcmdzKSA9PiB7XG5cdFx0XHRpZiAoIXRoaXMuc2lnbmFsLmFib3J0ZWQpIGNhbGxiYWNrKC4uLmFyZ3MpO1xuXHRcdH0sIG9wdGlvbnMpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjYW5jZWxJZGxlQ2FsbGJhY2soaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0YWRkRXZlbnRMaXN0ZW5lcih0YXJnZXQsIHR5cGUsIGhhbmRsZXIsIG9wdGlvbnMpIHtcblx0XHRpZiAodHlwZSA9PT0gXCJ3eHQ6bG9jYXRpb25jaGFuZ2VcIikge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgdGhpcy5sb2NhdGlvbldhdGNoZXIucnVuKCk7XG5cdFx0fVxuXHRcdHRhcmdldC5hZGRFdmVudExpc3RlbmVyPy4odHlwZS5zdGFydHNXaXRoKFwid3h0OlwiKSA/IGdldFVuaXF1ZUV2ZW50TmFtZSh0eXBlKSA6IHR5cGUsIGhhbmRsZXIsIHtcblx0XHRcdC4uLm9wdGlvbnMsXG5cdFx0XHRzaWduYWw6IHRoaXMuc2lnbmFsXG5cdFx0fSk7XG5cdH1cblx0LyoqXG5cdCogQGludGVybmFsXG5cdCogQWJvcnQgdGhlIGFib3J0IGNvbnRyb2xsZXIgYW5kIGV4ZWN1dGUgYWxsIGBvbkludmFsaWRhdGVkYCBsaXN0ZW5lcnMuXG5cdCovXG5cdG5vdGlmeUludmFsaWRhdGVkKCkge1xuXHRcdHRoaXMuYWJvcnQoXCJDb250ZW50IHNjcmlwdCBjb250ZXh0IGludmFsaWRhdGVkXCIpO1xuXHRcdGxvZ2dlci5kZWJ1ZyhgQ29udGVudCBzY3JpcHQgXCIke3RoaXMuY29udGVudFNjcmlwdE5hbWV9XCIgY29udGV4dCBpbnZhbGlkYXRlZGApO1xuXHR9XG5cdHN0b3BPbGRTY3JpcHRzKCkge1xuXHRcdGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSwgeyBkZXRhaWw6IHtcblx0XHRcdGNvbnRlbnRTY3JpcHROYW1lOiB0aGlzLmNvbnRlbnRTY3JpcHROYW1lLFxuXHRcdFx0bWVzc2FnZUlkOiB0aGlzLmlkXG5cdFx0fSB9KSk7XG5cdFx0aWYgKCF0aGlzLm9wdGlvbnM/Lm5vU2NyaXB0U3RhcnRlZFBvc3RNZXNzYWdlKSB3aW5kb3cucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0dHlwZTogQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLFxuXHRcdFx0Y29udGVudFNjcmlwdE5hbWU6IHRoaXMuY29udGVudFNjcmlwdE5hbWUsXG5cdFx0XHRtZXNzYWdlSWQ6IHRoaXMuaWRcblx0XHR9LCBcIipcIik7XG5cdH1cblx0dmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSB7XG5cdFx0Y29uc3QgaXNTYW1lQ29udGVudFNjcmlwdCA9IGV2ZW50LmRldGFpbD8uY29udGVudFNjcmlwdE5hbWUgPT09IHRoaXMuY29udGVudFNjcmlwdE5hbWU7XG5cdFx0Y29uc3QgaXNGcm9tU2VsZiA9IGV2ZW50LmRldGFpbD8ubWVzc2FnZUlkID09PSB0aGlzLmlkO1xuXHRcdHJldHVybiBpc1NhbWVDb250ZW50U2NyaXB0ICYmICFpc0Zyb21TZWxmO1xuXHR9XG5cdGxpc3RlbkZvck5ld2VyU2NyaXB0cygpIHtcblx0XHRjb25zdCBjYiA9IChldmVudCkgPT4ge1xuXHRcdFx0aWYgKCEoZXZlbnQgaW5zdGFuY2VvZiBDdXN0b21FdmVudCkgfHwgIXRoaXMudmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSkgcmV0dXJuO1xuXHRcdFx0dGhpcy5ub3RpZnlJbnZhbGlkYXRlZCgpO1xuXHRcdH07XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIGNiKTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIGNiKSk7XG5cdH1cbn07XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IENvbnRlbnRTY3JpcHRDb250ZXh0IH07XG4iXSwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMSwyLDE0LDE1LDE2LDE3XSwibWFwcGluZ3MiOiI7O0NBQ0EsU0FBUyxvQkFBb0IsWUFBWTtFQUN4QyxPQUFPO0NBQ1I7Ozs7Ozs7Ozs7Ozs7Ozs7O0NFYUEsSUFBTSxVRGZpQixXQUFXLFNBQVMsU0FBUyxLQUNoRCxXQUFXLFVBQ1gsV0FBVzs7O0NFRGYsU0FBUyxRQUFRLE9BQWUsTUFBc0I7RUFHbEQsUUFGdUIsS0FBSyxZQUVwQixHQUFSO0dBQ0ksS0FBSyxNQUNELE9BQU8sS0FBSyxNQUFNLFFBQVEsSUFBSTtHQUVsQyxLQUFLLE1BQ0QsT0FBTyxLQUFLLE1BQU0sUUFBUSxPQUFPLElBQUk7R0FFekMsS0FBSyxNQUNELE9BQU8sS0FBSyxNQUFNLFFBQVEsT0FBTyxPQUFPLElBQUk7R0FFaEQsU0FDSSxPQUFPLEtBQUssTUFBTSxLQUFLO0VBQy9CO0NBQ0o7Q0FFQSxTQUFnQixjQUFjLE1BQWlDO0VBQzNELE1BQU0sU0FBNEIsQ0FBQztFQUVuQyxNQUFNLGlCQUFpQixLQUNsQixRQUFRLFFBQVEsR0FBRyxDQUFDLENBQ3BCLEtBQUs7RUFpQlYsS0FBSyxNQUFNLFdBQVcsQ0FMbEIsZ0ZBRUEsNkVBR2tCLEdBQWU7R0FDakMsTUFBTSxRQUFRLGVBQWUsTUFBTSxPQUFPO0dBRTFDLElBQUksT0FBTztJQUNQLE1BQU0sV0FBVyxNQUFNO0lBQ3ZCLE1BQU0sVUFBVSxNQUFNO0lBQ3RCLE1BQU0sV0FBVyxNQUFNO0lBQ3ZCLE1BQU0sVUFBVSxNQUFNO0lBRXRCLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxTQUN2QztJQUdKLE9BQU8sV0FBVyxRQUNkLE9BQU8sV0FBVyxRQUFRLEdBQzFCLE9BQ0o7SUFFQSxPQUFPLFdBQVcsUUFDZCxPQUFPLFdBQVcsUUFBUSxHQUMxQixPQUNKO0lBRUEsT0FBTztH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