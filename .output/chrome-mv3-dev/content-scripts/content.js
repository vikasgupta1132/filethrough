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
							let finalFile = file;
							let finalInfo = fileInfo;
							try {
								transformedFile = await transformImage(file, plan);
								const transformedInfo = await inspectFile(transformedFile);
								console.log("[FileThrough] Transformed file", transformedInfo);
								finalFile = transformedFile;
								finalInfo = transformedInfo;
							} catch (error) {
								console.error("[FileThrough] Transformation failed", error);
							}
							if (plan.compress) try {
								finalFile = await compressImage(transformedFile, {
									minBytes: plan.compress.minBytes,
									maxBytes: plan.compress.maxBytes,
									format: plan.compress.format
								});
								finalInfo = await inspectFile(finalFile);
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
								original: fileInfo,
								final: finalInfo
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiLCJwcmludCIsImxvZ2dlciJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfamlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1jb250ZW50LXNjcmlwdC5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vQHd4dC1kZXYrYnJvd3NlckAwLjIuNS9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIxLjNfZXNsaW50QDkuMzkuNF9qaV80OGI2MjkwNDU4MGY1MTI3Mzc3NmIwNDMwYzI4OWIwNC9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci5tanMiLCIuLi8uLi8uLi9jb3JlL3BhcnNlci9wYXJzZUZpbGVTaXplLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VGb3JtYXRzLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VEaW1lbnNpb25zLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VDb25zdHJhaW50cy50cyIsIi4uLy4uLy4uL2NvcmUvZGV0ZWN0b3IvZXh0cmFjdFVwbG9hZENvbnRleHQudHMiLCIuLi8uLi8uLi9jb3JlL2luc3BlY3Rvci9pbnNwZWN0RmlsZS50cyIsIi4uLy4uLy4uL2NvcmUvdmFsaWRhdG9yL3ZhbGlkYXRlRmlsZS50cyIsIi4uLy4uLy4uL2NvcmUvcGxhbm5lci9jcmVhdGVUcmFuc2Zvcm1hdGlvblBsYW4udHMiLCIuLi8uLi8uLi9jb3JlL3RyYW5zZm9ybWVyL3RyYW5zZm9ybUltYWdlLnRzIiwiLi4vLi4vLi4vY29yZS90cmFuc2Zvcm1lci9jb21wcmVzc0ltYWdlLnRzIiwiLi4vLi4vLi4vZW50cnlwb2ludHMvY29udGVudC50cyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfamlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2xvZ2dlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjEuM19lc2xpbnRAOS4zOS40X2ppXzQ4YjYyOTA0NTgwZjUxMjczNzc2YjA0MzBjMjg5YjA0L25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9pbnRlcm5hbC9jdXN0b20tZXZlbnRzLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfamlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2xvY2F0aW9uLXdhdGNoZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIxLjNfZXNsaW50QDkuMzkuNF9qaV80OGI2MjkwNDU4MGY1MTI3Mzc3NmIwNDMwYzI4OWIwNC9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvY29udGVudC1zY3JpcHQtY29udGV4dC5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8jcmVnaW9uIHNyYy91dGlscy9kZWZpbmUtY29udGVudC1zY3JpcHQudHNcbmZ1bmN0aW9uIGRlZmluZUNvbnRlbnRTY3JpcHQoZGVmaW5pdGlvbikge1xuXHRyZXR1cm4gZGVmaW5pdGlvbjtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgZGVmaW5lQ29udGVudFNjcmlwdCB9O1xuIiwiLy8gI3JlZ2lvbiBzbmlwcGV0XG5leHBvcnQgY29uc3QgYnJvd3NlciA9IGdsb2JhbFRoaXMuYnJvd3Nlcj8ucnVudGltZT8uaWRcbiAgPyBnbG9iYWxUaGlzLmJyb3dzZXJcbiAgOiBnbG9iYWxUaGlzLmNocm9tZTtcbi8vICNlbmRyZWdpb24gc25pcHBldFxuIiwiaW1wb3J0IHsgYnJvd3NlciBhcyBicm93c2VyJDEgfSBmcm9tIFwiQHd4dC1kZXYvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy9icm93c2VyLnRzXG4vKipcbiogQ29udGFpbnMgdGhlIGBicm93c2VyYCBleHBvcnQgd2hpY2ggeW91IHNob3VsZCB1c2UgdG8gYWNjZXNzIHRoZSBleHRlbnNpb25cbiogQVBJcyBpbiB5b3VyIHByb2plY3Q6XG4qXG4qIGBgYHRzXG4qIGltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICd3eHQvYnJvd3Nlcic7XG4qXG4qIGJyb3dzZXIucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4qICAgLy8gLi4uXG4qIH0pO1xuKiBgYGBcbipcbiogQG1vZHVsZSB3eHQvYnJvd3NlclxuKi9cbmNvbnN0IGJyb3dzZXIgPSBicm93c2VyJDE7XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGJyb3dzZXIgfTtcbiIsImltcG9ydCB0eXBlIHsgVXBsb2FkQ29uc3RyYWludHMgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmZ1bmN0aW9uIHRvQnl0ZXModmFsdWU6IG51bWJlciwgdW5pdDogc3RyaW5nKTogbnVtYmVyIHtcclxuICAgIGNvbnN0IG5vcm1hbGl6ZWRVbml0ID0gdW5pdC50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgIHN3aXRjaCAobm9ybWFsaXplZFVuaXQpIHtcclxuICAgICAgICBjYXNlICdrYic6XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlICogMTAyNCk7XHJcblxyXG4gICAgICAgIGNhc2UgJ21iJzpcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgKiAxMDI0ICogMTAyNCk7XHJcblxyXG4gICAgICAgIGNhc2UgJ2diJzpcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgKiAxMDI0ICogMTAyNCAqIDEwMjQpO1xyXG5cclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZpbGVTaXplKHRleHQ6IHN0cmluZyk6IFVwbG9hZENvbnN0cmFpbnRzIHtcclxuICAgIGNvbnN0IHJlc3VsdDogVXBsb2FkQ29uc3RyYWludHMgPSB7fTtcclxuXHJcbiAgICBjb25zdCBub3JtYWxpemVkVGV4dCA9IHRleHRcclxuICAgICAgICAucmVwbGFjZSgvXFxzKy9nLCAnICcpXHJcbiAgICAgICAgLnRyaW0oKTtcclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gMS4gUkFOR0UgUEFUVEVSTlNcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgLy8gRXhhbXBsZXM6XHJcbiAgICAvLyAyMCBLQiB0byAxMDAgS0JcclxuICAgIC8vIDIwS0IgLSAxMDBLQlxyXG4gICAgLy8gQmV0d2VlbiA1MCBLQiBhbmQgMjAwIEtCXHJcblxyXG4gICAgY29uc3QgcmFuZ2VQYXR0ZXJucyA9IFtcclxuICAgICAgICAvYmV0d2VlblxccysoXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKVxccythbmRcXHMrKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYikvaSxcclxuXHJcbiAgICAgICAgLyhcXGQrKD86XFwuXFxkKyk/KVxccyooa2J8bWJ8Z2IpXFxzKig/OnRvfC184oCTfOKAlClcXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYikvaSxcclxuICAgIF07XHJcblxyXG4gICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHJhbmdlUGF0dGVybnMpIHtcclxuICAgICAgICBjb25zdCBtYXRjaCA9IG5vcm1hbGl6ZWRUZXh0Lm1hdGNoKHBhdHRlcm4pO1xyXG5cclxuICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgY29uc3QgbWluVmFsdWUgPSBtYXRjaFsxXTtcclxuICAgICAgICAgICAgY29uc3QgbWluVW5pdCA9IG1hdGNoWzJdO1xyXG4gICAgICAgICAgICBjb25zdCBtYXhWYWx1ZSA9IG1hdGNoWzNdO1xyXG4gICAgICAgICAgICBjb25zdCBtYXhVbml0ID0gbWF0Y2hbNF07XHJcblxyXG4gICAgICAgICAgICBpZiAoIW1pblZhbHVlIHx8ICFtaW5Vbml0IHx8ICFtYXhWYWx1ZSB8fCAhbWF4VW5pdCkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJlc3VsdC5taW5CeXRlcyA9IHRvQnl0ZXMoXHJcbiAgICAgICAgICAgICAgICBOdW1iZXIucGFyc2VGbG9hdChtaW5WYWx1ZSksXHJcbiAgICAgICAgICAgICAgICBtaW5Vbml0XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICByZXN1bHQubWF4Qnl0ZXMgPSB0b0J5dGVzKFxyXG4gICAgICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQobWF4VmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgbWF4VW5pdFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIDIuIE1BWElNVU0gUEFUVEVSTlNcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgLy8gRXhhbXBsZXM6XHJcbiAgICAvLyBNYXhpbXVtIGZpbGUgc2l6ZTogMjAwIEtCXHJcbiAgICAvLyBNYXggc2l6ZSAyIE1CXHJcbiAgICAvLyBGaWxlIHNpemUgc2hvdWxkIG5vdCBleGNlZWQgNTAwIEtCXHJcbiAgICAvLyBGaWxlIG11c3QgYmUgdW5kZXIgMzAwIEtCXHJcbiAgICAvLyBMZXNzIHRoYW4gMSBNQlxyXG5cclxuICAgIGNvbnN0IG1heFBhdHRlcm5zID0gW1xyXG4gICAgICAgIC8oPzptYXhpbXVtfG1heClcXHMrKD86ZmlsZVxccyspP3NpemVcXHMqOj9cXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYikvaSxcclxuXHJcbiAgICAgICAgLyg/OmZpbGVcXHMrKT9zaXplXFxzKyg/OnNob3VsZFxccyspP25vdFxccytleGNlZWRcXHMrKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYikvaSxcclxuXHJcbiAgICAgICAgLyg/OmZpbGVcXHMrKT8oPzptdXN0XFxzK2JlXFxzKyk/dW5kZXJcXHMrKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYikvaSxcclxuXHJcbiAgICAgICAgL2xlc3NcXHMrdGhhblxccysoXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKS9pLFxyXG4gICAgXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgbWF4UGF0dGVybnMpIHtcclxuICAgICAgICBjb25zdCBtYXRjaCA9IG5vcm1hbGl6ZWRUZXh0Lm1hdGNoKHBhdHRlcm4pO1xyXG5cclxuXHJcbiAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gbWF0Y2hbMV07XHJcbiAgICAgICAgICAgIGNvbnN0IHVuaXQgPSBtYXRjaFsyXTtcclxuXHJcbiAgICAgICAgICAgIGlmICghdmFsdWUgfHwgIXVuaXQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXN1bHQubWF4Qnl0ZXMgPSB0b0J5dGVzKFxyXG4gICAgICAgICAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQodmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgdW5pdFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufSIsImltcG9ydCB0eXBlIHsgVXBsb2FkQ29udGV4dCB9IGZyb20gJy4uL2RldGVjdG9yL2V4dHJhY3RVcGxvYWRDb250ZXh0JztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZvcm1hdHMoXHJcbiAgICBjb250ZXh0OiBVcGxvYWRDb250ZXh0XHJcbik6IHN0cmluZ1tdIHtcclxuICAgIGNvbnN0IGZvcm1hdHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcclxuXHJcbiAgICAvLyBIaWdoZXN0LWNvbmZpZGVuY2Ugc291cmNlOiBIVE1MIGFjY2VwdCBhdHRyaWJ1dGVcclxuICAgIGlmIChjb250ZXh0LmFjY2VwdCkge1xyXG4gICAgICAgIGNvbnN0IGFjY2VwdFBhcnRzID0gY29udGV4dC5hY2NlcHQuc3BsaXQoJywnKTtcclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBwYXJ0IG9mIGFjY2VwdFBhcnRzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcGFydC50cmltKCkudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZS5zdGFydHNXaXRoKCcuJykpIHtcclxuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKHZhbHVlLnNsaWNlKDEpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnaW1hZ2UvanBlZycpIHtcclxuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKCdqcGcnKTtcclxuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKCdqcGVnJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJ2ltYWdlL3BuZycpIHtcclxuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKCdwbmcnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnaW1hZ2Uvd2VicCcpIHtcclxuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKCd3ZWJwJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJ2FwcGxpY2F0aW9uL3BkZicpIHtcclxuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKCdwZGYnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBTZWNvbmQgc291cmNlOiBuZWFyYnkgaW5zdHJ1Y3Rpb25zXHJcbiAgICBjb25zdCB0ZXh0ID0gY29udGV4dC5uZWFyYnlUZXh0LnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgY29uc3Qga25vd25Gb3JtYXRzID0gW1xyXG4gICAgICAgICdqcGcnLFxyXG4gICAgICAgICdqcGVnJyxcclxuICAgICAgICAncG5nJyxcclxuICAgICAgICAnd2VicCcsXHJcbiAgICAgICAgJ3BkZicsXHJcbiAgICBdO1xyXG5cclxuICAgIGZvciAoY29uc3QgZm9ybWF0IG9mIGtub3duRm9ybWF0cykge1xyXG4gICAgICAgIGNvbnN0IHBhdHRlcm4gPSBuZXcgUmVnRXhwKFxyXG4gICAgICAgICAgICBgXFxcXGIke2Zvcm1hdH1cXFxcYmAsXHJcbiAgICAgICAgICAgICdpJ1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChwYXR0ZXJuLnRlc3QodGV4dCkpIHtcclxuICAgICAgICAgICAgZm9ybWF0cy5hZGQoZm9ybWF0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIEFycmF5LmZyb20oZm9ybWF0cyk7XHJcbn0iLCJpbXBvcnQgdHlwZSB7IFVwbG9hZENvbnN0cmFpbnRzIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VEaW1lbnNpb25zKFxyXG4gICAgdGV4dDogc3RyaW5nXHJcbik6IFVwbG9hZENvbnN0cmFpbnRzWydkaW1lbnNpb25zJ10gfCB1bmRlZmluZWQge1xyXG5cclxuICAgIGNvbnN0IG5vcm1hbGl6ZWRUZXh0ID0gdGV4dFxyXG4gICAgICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJylcclxuICAgICAgICAudHJpbSgpO1xyXG5cclxuICAgIC8vIEV4YW1wbGVzOlxyXG4gICAgLy8gRGltZW5zaW9uczogMjAwIHggMjMwIHBpeGVsc1xyXG4gICAgLy8gMjAweDIzMCBweFxyXG4gICAgLy8gMjAwIMOXIDIzMCBwaXhlbHNcclxuICAgIC8vIEltYWdlIHNpemU6IDIwMCBYIDIzMFxyXG5cclxuICAgIGNvbnN0IHBhdHRlcm5zID0gW1xyXG4gICAgICAgIC8oPzpkaW1lbnNpb25zP3xpbWFnZVxccytkaW1lbnNpb25zP3xpbWFnZVxccytzaXplKVxccyo6P1xccyooXFxkKylcXHMqW3jDl11cXHMqKFxcZCspXFxzKig/OnB4fHBpeGVscz8pPy9pLFxyXG5cclxuICAgICAgICAvKFxcZCspXFxzKlt4w5ddXFxzKihcXGQrKVxccyooPzpweHxwaXhlbHM/KS9pLFxyXG4gICAgXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcGF0dGVybnMpIHtcclxuICAgICAgICBjb25zdCBtYXRjaCA9IG5vcm1hbGl6ZWRUZXh0Lm1hdGNoKHBhdHRlcm4pO1xyXG5cclxuICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBtYXRjaFsxXTtcclxuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gbWF0Y2hbMl07XHJcblxyXG4gICAgICAgICAgICBpZiAoIXdpZHRoIHx8ICFoZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgd2lkdGg6IE51bWJlci5wYXJzZUludCh3aWR0aCwgMTApLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBOdW1iZXIucGFyc2VJbnQoaGVpZ2h0LCAxMCksXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbn0iLCJpbXBvcnQgdHlwZSB7IFVwbG9hZENvbnRleHQgfSBmcm9tICcuLi9kZXRlY3Rvci9leHRyYWN0VXBsb2FkQ29udGV4dCc7XHJcbmltcG9ydCB0eXBlIHsgVXBsb2FkQ29uc3RyYWludHMgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmltcG9ydCB7IHBhcnNlRmlsZVNpemUgfSBmcm9tICcuL3BhcnNlRmlsZVNpemUnO1xyXG5pbXBvcnQgeyBwYXJzZUZvcm1hdHMgfSBmcm9tICcuL3BhcnNlRm9ybWF0cyc7XHJcbmltcG9ydCB7IHBhcnNlRGltZW5zaW9ucyB9IGZyb20gJy4vcGFyc2VEaW1lbnNpb25zJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNvbnN0cmFpbnRzKFxyXG4gICAgY29udGV4dDogVXBsb2FkQ29udGV4dFxyXG4pOiBVcGxvYWRDb25zdHJhaW50cyB7XHJcbiAgICBjb25zdCBzaXplQ29uc3RyYWludHMgPSBwYXJzZUZpbGVTaXplKGNvbnRleHQubmVhcmJ5VGV4dCk7XHJcbiAgICBjb25zdCBhbGxvd2VkRm9ybWF0cyA9IHBhcnNlRm9ybWF0cyhjb250ZXh0KTtcclxuICAgIGNvbnN0IGRpbWVuc2lvbnMgPSBwYXJzZURpbWVuc2lvbnMoY29udGV4dC5uZWFyYnlUZXh0KTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIC4uLnNpemVDb25zdHJhaW50cyxcclxuXHJcbiAgICAgICAgLi4uKGFsbG93ZWRGb3JtYXRzLmxlbmd0aCA+IDAgJiYge1xyXG4gICAgICAgICAgICBhbGxvd2VkRm9ybWF0cyxcclxuICAgICAgICB9KSxcclxuXHJcbiAgICAgICAgLi4uKGRpbWVuc2lvbnMgJiYge1xyXG4gICAgICAgICAgICBkaW1lbnNpb25zLFxyXG4gICAgICAgIH0pLFxyXG4gICAgfTtcclxufSIsImV4cG9ydCBpbnRlcmZhY2UgVXBsb2FkQ29udGV4dCB7XHJcbiAgICBsYWJlbDogc3RyaW5nIHwgbnVsbDtcclxuICAgIG5lYXJieVRleHQ6IHN0cmluZztcclxuICAgIGFjY2VwdDogc3RyaW5nIHwgbnVsbDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RVcGxvYWRDb250ZXh0KFxyXG4gICAgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnRcclxuKTogVXBsb2FkQ29udGV4dCB7XHJcbiAgICBsZXQgbGFiZWw6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgIC8vIEZpbmQgPGxhYmVsIGZvcj1cImlucHV0LWlkXCI+XHJcbiAgICBpZiAoaW5wdXQuaWQpIHtcclxuICAgICAgICBjb25zdCBsYWJlbEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxMYWJlbEVsZW1lbnQ+KFxyXG4gICAgICAgICAgICBgbGFiZWxbZm9yPVwiJHtDU1MuZXNjYXBlKGlucHV0LmlkKX1cIl1gXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbGFiZWwgPSBsYWJlbEVsZW1lbnQ/LnRleHRDb250ZW50Py50cmltKCkgfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBIYW5kbGUgaW5wdXRzIHdyYXBwZWQgaW5zaWRlIDxsYWJlbD5cclxuICAgIGlmICghbGFiZWwpIHtcclxuICAgICAgICBjb25zdCBwYXJlbnRMYWJlbCA9IGlucHV0LmNsb3Nlc3QoJ2xhYmVsJyk7XHJcblxyXG4gICAgICAgIGxhYmVsID0gcGFyZW50TGFiZWw/LnRleHRDb250ZW50Py50cmltKCkgfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGb3Igbm93LCBpbnNwZWN0IHRoZSBpbnB1dCdzIHBhcmVudCBjb250YWluZXIuXHJcbiAgICBjb25zdCBwYXJlbnQgPSBpbnB1dC5wYXJlbnRFbGVtZW50O1xyXG5cclxuICAgIGNvbnN0IG5lYXJieVRleHQgPVxyXG4gICAgICAgIHBhcmVudD8uaW5uZXJUZXh0XHJcbiAgICAgICAgICAgID8ucmVwbGFjZSgvXFxzKy9nLCAnICcpXHJcbiAgICAgICAgICAgIC50cmltKCkgfHwgJyc7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBsYWJlbCxcclxuICAgICAgICBuZWFyYnlUZXh0LFxyXG4gICAgICAgIGFjY2VwdDogaW5wdXQuZ2V0QXR0cmlidXRlKCdhY2NlcHQnKSxcclxuICAgIH07XHJcbn0iLCJleHBvcnQgaW50ZXJmYWNlIEZpbGVJbmZvIHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIG1pbWVUeXBlOiBzdHJpbmc7XHJcbiAgICBzaXplQnl0ZXM6IG51bWJlcjtcclxuICAgIGV4dGVuc2lvbjogc3RyaW5nO1xyXG4gICAgd2lkdGg/OiBudW1iZXI7XHJcbiAgICBoZWlnaHQ/OiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnNwZWN0RmlsZShmaWxlOiBGaWxlKTogUHJvbWlzZTxGaWxlSW5mbz4ge1xyXG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZ2V0RXh0ZW5zaW9uKGZpbGUubmFtZSk7XHJcblxyXG4gICAgY29uc3QgaW5mbzogRmlsZUluZm8gPSB7XHJcbiAgICAgICAgbmFtZTogZmlsZS5uYW1lLFxyXG4gICAgICAgIG1pbWVUeXBlOiBmaWxlLnR5cGUsXHJcbiAgICAgICAgc2l6ZUJ5dGVzOiBmaWxlLnNpemUsXHJcbiAgICAgICAgZXh0ZW5zaW9uLFxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoZmlsZS50eXBlLnN0YXJ0c1dpdGgoJ2ltYWdlLycpKSB7XHJcbiAgICAgICAgY29uc3QgZGltZW5zaW9ucyA9IGF3YWl0IGdldEltYWdlRGltZW5zaW9ucyhmaWxlKTtcclxuXHJcbiAgICAgICAgaW5mby53aWR0aCA9IGRpbWVuc2lvbnMud2lkdGg7XHJcbiAgICAgICAgaW5mby5oZWlnaHQgPSBkaW1lbnNpb25zLmhlaWdodDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaW5mbztcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0RXh0ZW5zaW9uKGZpbGVOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgbGFzdERvdCA9IGZpbGVOYW1lLmxhc3RJbmRleE9mKCcuJyk7XHJcblxyXG4gICAgaWYgKGxhc3REb3QgPT09IC0xKSB7XHJcbiAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmaWxlTmFtZVxyXG4gICAgICAgIC5zbGljZShsYXN0RG90ICsgMSlcclxuICAgICAgICAudG9Mb3dlckNhc2UoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0SW1hZ2VEaW1lbnNpb25zKFxyXG4gICAgZmlsZTogRmlsZVxyXG4pOiBQcm9taXNlPHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBjb25zdCB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGZpbGUpO1xyXG4gICAgICAgIGNvbnN0IGltYWdlID0gbmV3IEltYWdlKCk7XHJcblxyXG4gICAgICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICB3aWR0aDogaW1hZ2UubmF0dXJhbFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBpbWFnZS5uYXR1cmFsSGVpZ2h0LFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpbWFnZS5vbmVycm9yID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XHJcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1VuYWJsZSB0byByZWFkIGltYWdlIGRpbWVuc2lvbnMuJykpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGltYWdlLnNyYyA9IHVybDtcclxuICAgIH0pO1xyXG59IiwiaW1wb3J0IHR5cGUgeyBVcGxvYWRDb25zdHJhaW50cyB9IGZyb20gJy4uL3BhcnNlci90eXBlcyc7XHJcbmltcG9ydCB0eXBlIHsgRmlsZUluZm8gfSBmcm9tICcuLi9pbnNwZWN0b3IvaW5zcGVjdEZpbGUnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBWYWxpZGF0aW9uSXNzdWUge1xyXG4gICAgdHlwZTogJ2Zvcm1hdCcgfCAnc2l6ZS10b28tbGFyZ2UnIHwgJ3NpemUtdG9vLXNtYWxsJyB8ICdkaW1lbnNpb25zJztcclxuICAgIG1lc3NhZ2U6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBWYWxpZGF0aW9uUmVzdWx0IHtcclxuICAgIGlzVmFsaWQ6IGJvb2xlYW47XHJcbiAgICBpc3N1ZXM6IFZhbGlkYXRpb25Jc3N1ZVtdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVGaWxlKFxyXG4gICAgZmlsZTogRmlsZUluZm8sXHJcbiAgICBjb25zdHJhaW50czogVXBsb2FkQ29uc3RyYWludHNcclxuKTogVmFsaWRhdGlvblJlc3VsdCB7XHJcbiAgICBjb25zdCBpc3N1ZXM6IFZhbGlkYXRpb25Jc3N1ZVtdID0gW107XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gRm9ybWF0XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaWYgKFxyXG4gICAgICAgIGNvbnN0cmFpbnRzLmFsbG93ZWRGb3JtYXRzICYmXHJcbiAgICAgICAgY29uc3RyYWludHMuYWxsb3dlZEZvcm1hdHMubGVuZ3RoID4gMFxyXG4gICAgKSB7XHJcbiAgICAgICAgY29uc3QgZmlsZUZvcm1hdCA9IGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGFsbG93ZWQgPSBjb25zdHJhaW50cy5hbGxvd2VkRm9ybWF0cy5zb21lKFxyXG4gICAgICAgICAgICAoZm9ybWF0KSA9PiBmb3JtYXQudG9Mb3dlckNhc2UoKSA9PT0gZmlsZUZvcm1hdFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmICghYWxsb3dlZCkge1xyXG4gICAgICAgICAgICBpc3N1ZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnZm9ybWF0JyxcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBGaWxlIGZvcm1hdCBcIiR7ZmlsZUZvcm1hdH1cIiBpcyBub3QgYWxsb3dlZC5gLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gTWF4aW11bSBmaWxlIHNpemVcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBpZiAoXHJcbiAgICAgICAgY29uc3RyYWludHMubWF4Qnl0ZXMgIT09IHVuZGVmaW5lZCAmJlxyXG4gICAgICAgIGZpbGUuc2l6ZUJ5dGVzID4gY29uc3RyYWludHMubWF4Qnl0ZXNcclxuICAgICkge1xyXG4gICAgICAgIGlzc3Vlcy5wdXNoKHtcclxuICAgICAgICAgICAgdHlwZTogJ3NpemUtdG9vLWxhcmdlJyxcclxuICAgICAgICAgICAgbWVzc2FnZTogYEZpbGUgaXMgdG9vIGxhcmdlLiBNYXhpbXVtIGFsbG93ZWQgc2l6ZSBpcyAke2Zvcm1hdEJ5dGVzKFxyXG4gICAgICAgICAgICAgICAgY29uc3RyYWludHMubWF4Qnl0ZXNcclxuICAgICAgICAgICAgKX0uYCxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBNaW5pbXVtIGZpbGUgc2l6ZVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGlmIChcclxuICAgICAgICBjb25zdHJhaW50cy5taW5CeXRlcyAhPT0gdW5kZWZpbmVkICYmXHJcbiAgICAgICAgZmlsZS5zaXplQnl0ZXMgPCBjb25zdHJhaW50cy5taW5CeXRlc1xyXG4gICAgKSB7XHJcbiAgICAgICAgaXNzdWVzLnB1c2goe1xyXG4gICAgICAgICAgICB0eXBlOiAnc2l6ZS10b28tc21hbGwnLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBgRmlsZSBpcyB0b28gc21hbGwuIE1pbmltdW0gcmVxdWlyZWQgc2l6ZSBpcyAke2Zvcm1hdEJ5dGVzKFxyXG4gICAgICAgICAgICAgICAgY29uc3RyYWludHMubWluQnl0ZXNcclxuICAgICAgICAgICAgKX0uYCxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBEaW1lbnNpb25zXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaWYgKGNvbnN0cmFpbnRzLmRpbWVuc2lvbnMpIHtcclxuICAgICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IGNvbnN0cmFpbnRzLmRpbWVuc2lvbnM7XHJcblxyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgICAgZmlsZS53aWR0aCAhPT0gd2lkdGggfHxcclxuICAgICAgICAgICAgZmlsZS5oZWlnaHQgIT09IGhlaWdodFxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICBpc3N1ZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnZGltZW5zaW9ucycsXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBgSW1hZ2UgZGltZW5zaW9ucyBtdXN0IGJlICR7d2lkdGh9IMOXICR7aGVpZ2h0fXB4LmAsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGlzVmFsaWQ6IGlzc3Vlcy5sZW5ndGggPT09IDAsXHJcbiAgICAgICAgaXNzdWVzLFxyXG4gICAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gZm9ybWF0Qnl0ZXMoYnl0ZXM6IG51bWJlcik6IHN0cmluZyB7XHJcbiAgICBpZiAoYnl0ZXMgPCAxMDI0KSB7XHJcbiAgICAgICAgcmV0dXJuIGAke2J5dGVzfSBCYDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYnl0ZXMgPCAxMDI0ICogMTAyNCkge1xyXG4gICAgICAgIHJldHVybiBgJHtNYXRoLnJvdW5kKGJ5dGVzIC8gMTAyNCl9IEtCYDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYCR7KGJ5dGVzIC8gKDEwMjQgKiAxMDI0KSkudG9GaXhlZCgyKX0gTUJgO1xyXG59IiwiaW1wb3J0IHR5cGUgeyBVcGxvYWRDb25zdHJhaW50cyB9IGZyb20gJy4uL3BhcnNlci90eXBlcyc7XHJcbmltcG9ydCB0eXBlIHsgRmlsZUluZm8gfSBmcm9tICcuLi9pbnNwZWN0b3IvaW5zcGVjdEZpbGUnO1xyXG5pbXBvcnQgdHlwZSB7IFRyYW5zZm9ybWF0aW9uUGxhbiB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRyYW5zZm9ybWF0aW9uUGxhbihcclxuICAgIGZpbGU6IEZpbGVJbmZvLFxyXG4gICAgY29uc3RyYWludHM6IFVwbG9hZENvbnN0cmFpbnRzXHJcbik6IFRyYW5zZm9ybWF0aW9uUGxhbiB7XHJcbiAgICBjb25zdCBwbGFuOiBUcmFuc2Zvcm1hdGlvblBsYW4gPSB7fTtcclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBGb3JtYXQgY29udmVyc2lvblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGlmIChcclxuICAgICAgICBjb25zdHJhaW50cy5hbGxvd2VkRm9ybWF0cyAmJlxyXG4gICAgICAgIGNvbnN0cmFpbnRzLmFsbG93ZWRGb3JtYXRzLmxlbmd0aCA+IDBcclxuICAgICkge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRGb3JtYXQgPSBmaWxlLmV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBmb3JtYXRBbGxvd2VkID1cclxuICAgICAgICAgICAgY29uc3RyYWludHMuYWxsb3dlZEZvcm1hdHMuaW5jbHVkZXMoY3VycmVudEZvcm1hdCk7XHJcblxyXG4gICAgICAgIGlmICghZm9ybWF0QWxsb3dlZCkge1xyXG4gICAgICAgICAgICBjb25zdCB0YXJnZXRGb3JtYXQgPSBjaG9vc2VUYXJnZXRGb3JtYXQoXHJcbiAgICAgICAgICAgICAgICBjb25zdHJhaW50cy5hbGxvd2VkRm9ybWF0c1xyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRhcmdldEZvcm1hdCkge1xyXG4gICAgICAgICAgICAgICAgcGxhbi5jb252ZXJ0VG8gPSB0YXJnZXRGb3JtYXQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gRGltZW5zaW9uc1xyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGlmIChjb25zdHJhaW50cy5kaW1lbnNpb25zKSB7XHJcbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBjb25zdHJhaW50cy5kaW1lbnNpb25zO1xyXG5cclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgIGZpbGUud2lkdGggIT09IHdpZHRoIHx8XHJcbiAgICAgICAgICAgIGZpbGUuaGVpZ2h0ICE9PSBoZWlnaHRcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgcGxhbi5yZXNpemUgPSB7XHJcbiAgICAgICAgICAgICAgICB3aWR0aCxcclxuICAgICAgICAgICAgICAgIGhlaWdodCxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gRmlsZSBzaXplXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5pZiAoXHJcbiAgICAoY29uc3RyYWludHMubWluQnl0ZXMgIT09IHVuZGVmaW5lZCAmJlxyXG4gICAgICAgIGZpbGUuc2l6ZUJ5dGVzIDwgY29uc3RyYWludHMubWluQnl0ZXMpIHx8XHJcbiAgICAoY29uc3RyYWludHMubWF4Qnl0ZXMgIT09IHVuZGVmaW5lZCAmJlxyXG4gICAgICAgIGZpbGUuc2l6ZUJ5dGVzID4gY29uc3RyYWludHMubWF4Qnl0ZXMpXHJcbikge1xyXG4gICAgcGxhbi5jb21wcmVzcyA9IHtcclxuICAgICAgICAuLi4oY29uc3RyYWludHMubWluQnl0ZXMgIT09IHVuZGVmaW5lZCAmJiB7XHJcbiAgICAgICAgICAgIG1pbkJ5dGVzOiBjb25zdHJhaW50cy5taW5CeXRlcyxcclxuICAgICAgICB9KSxcclxuXHJcbiAgICAgICAgLi4uKGNvbnN0cmFpbnRzLm1heEJ5dGVzICE9PSB1bmRlZmluZWQgJiYge1xyXG4gICAgICAgICAgICBtYXhCeXRlczogY29uc3RyYWludHMubWF4Qnl0ZXMsXHJcbiAgICAgICAgfSksXHJcblxyXG4gICAgICAgIGZvcm1hdDogY2hvb3NlQ29tcHJlc3Npb25Gb3JtYXQoXHJcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLmFsbG93ZWRGb3JtYXRzXHJcbiAgICAgICAgKSxcclxuICAgIH07XHJcbn1cclxuXHJcbiAgICByZXR1cm4gcGxhbjtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hvb3NlVGFyZ2V0Rm9ybWF0KFxyXG4gICAgYWxsb3dlZEZvcm1hdHM6IHN0cmluZ1tdXHJcbik6IFRyYW5zZm9ybWF0aW9uUGxhblsnY29udmVydFRvJ10ge1xyXG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IGFsbG93ZWRGb3JtYXRzLm1hcCgoZm9ybWF0KSA9PlxyXG4gICAgICAgIGZvcm1hdC50b0xvd2VyQ2FzZSgpXHJcbiAgICApO1xyXG5cclxuICAgIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKCdqcGVnJykpIHtcclxuICAgICAgICByZXR1cm4gJ2pwZWcnO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKCdqcGcnKSkge1xyXG4gICAgICAgIHJldHVybiAnanBlZyc7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoJ3BuZycpKSB7XHJcbiAgICAgICAgcmV0dXJuICdwbmcnO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKCd3ZWJwJykpIHtcclxuICAgICAgICByZXR1cm4gJ3dlYnAnO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNob29zZUNvbXByZXNzaW9uRm9ybWF0KFxyXG4gICAgYWxsb3dlZEZvcm1hdHM/OiBzdHJpbmdbXVxyXG4pOiAnanBlZycgfCAncG5nJyB8ICd3ZWJwJyB7XHJcbiAgICBjb25zdCBub3JtYWxpemVkID1cclxuICAgICAgICBhbGxvd2VkRm9ybWF0cz8ubWFwKChmb3JtYXQpID0+XHJcbiAgICAgICAgICAgIGZvcm1hdC50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgKSA/PyBbXTtcclxuXHJcbiAgICBpZiAoXHJcbiAgICAgICAgbm9ybWFsaXplZC5pbmNsdWRlcygnanBlZycpIHx8XHJcbiAgICAgICAgbm9ybWFsaXplZC5pbmNsdWRlcygnanBnJylcclxuICAgICkge1xyXG4gICAgICAgIHJldHVybiAnanBlZyc7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoJ3BuZycpKSB7XHJcbiAgICAgICAgcmV0dXJuICdwbmcnO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKCd3ZWJwJykpIHtcclxuICAgICAgICByZXR1cm4gJ3dlYnAnO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAnanBlZyc7XHJcbn0iLCJpbXBvcnQgdHlwZSB7IFRyYW5zZm9ybWF0aW9uUGxhbiB9IGZyb20gJy4uL3BsYW5uZXIvdHlwZXMnO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRyYW5zZm9ybUltYWdlKFxyXG4gICAgZmlsZTogRmlsZSxcclxuICAgIHBsYW46IFRyYW5zZm9ybWF0aW9uUGxhblxyXG4pOiBQcm9taXNlPEZpbGU+IHtcclxuICAgIGlmICghZmlsZS50eXBlLnN0YXJ0c1dpdGgoJ2ltYWdlLycpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICAgICBgQ2Fubm90IHRyYW5zZm9ybSBub24taW1hZ2UgZmlsZTogJHtmaWxlLnR5cGV9YFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgaW1hZ2UgPSBhd2FpdCBsb2FkSW1hZ2UoZmlsZSk7XHJcblxyXG4gICAgY29uc3Qgd2lkdGggPVxyXG4gICAgICAgIHBsYW4ucmVzaXplPy53aWR0aCA/PyBpbWFnZS5uYXR1cmFsV2lkdGg7XHJcblxyXG4gICAgY29uc3QgaGVpZ2h0ID1cclxuICAgICAgICBwbGFuLnJlc2l6ZT8uaGVpZ2h0ID8/IGltYWdlLm5hdHVyYWxIZWlnaHQ7XHJcblxyXG4gICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcblxyXG4gICAgY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG5cclxuICAgIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICBpZiAoIWNvbnRleHQpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBjcmVhdGUgY2FudmFzIGNvbnRleHQuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUHJldmVudCB0cmFuc3BhcmVudCBQTkcgYmFja2dyb3VuZHMgZnJvbSBiZWNvbWluZyBibGFja1xyXG4gICAgLy8gd2hlbiBjb252ZXJ0aW5nIHRvIEpQRUcuXHJcbiAgICBpZiAocGxhbi5jb252ZXJ0VG8gPT09ICdqcGVnJykge1xyXG4gICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gJyNmZmZmZmYnO1xyXG4gICAgICAgIGNvbnRleHQuZmlsbFJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29udGV4dC5kcmF3SW1hZ2UoXHJcbiAgICAgICAgaW1hZ2UsXHJcbiAgICAgICAgMCxcclxuICAgICAgICAwLFxyXG4gICAgICAgIHdpZHRoLFxyXG4gICAgICAgIGhlaWdodFxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBvdXRwdXRUeXBlID0gZ2V0T3V0cHV0TWltZVR5cGUoXHJcbiAgICAgICAgcGxhbi5jb252ZXJ0VG8sXHJcbiAgICAgICAgZmlsZS50eXBlXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGJsb2IgPSBhd2FpdCBjYW52YXNUb0Jsb2IoXHJcbiAgICAgICAgY2FudmFzLFxyXG4gICAgICAgIG91dHB1dFR5cGVcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZ2V0RXh0ZW5zaW9uRm9yTWltZVR5cGUoXHJcbiAgICAgICAgb3V0cHV0VHlwZVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBvdXRwdXROYW1lID0gcmVwbGFjZUV4dGVuc2lvbihcclxuICAgICAgICBmaWxlLm5hbWUsXHJcbiAgICAgICAgZXh0ZW5zaW9uXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiBuZXcgRmlsZShcclxuICAgICAgICBbYmxvYl0sXHJcbiAgICAgICAgb3V0cHV0TmFtZSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHR5cGU6IG91dHB1dFR5cGUsXHJcbiAgICAgICAgICAgIGxhc3RNb2RpZmllZDogRGF0ZS5ub3coKSxcclxuICAgICAgICB9XHJcbiAgICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb2FkSW1hZ2UoXHJcbiAgICBmaWxlOiBGaWxlXHJcbik6IFByb21pc2U8SFRNTEltYWdlRWxlbWVudD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBjb25zdCB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGZpbGUpO1xyXG4gICAgICAgIGNvbnN0IGltYWdlID0gbmV3IEltYWdlKCk7XHJcblxyXG4gICAgICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xyXG4gICAgICAgICAgICByZXNvbHZlKGltYWdlKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpbWFnZS5vbmVycm9yID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XHJcbiAgICAgICAgICAgIHJlamVjdChcclxuICAgICAgICAgICAgICAgIG5ldyBFcnJvcignVW5hYmxlIHRvIGRlY29kZSBpbWFnZS4nKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGltYWdlLnNyYyA9IHVybDtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjYW52YXNUb0Jsb2IoXHJcbiAgICBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50LFxyXG4gICAgdHlwZTogc3RyaW5nXHJcbik6IFByb21pc2U8QmxvYj4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBjYW52YXMudG9CbG9iKFxyXG4gICAgICAgICAgICAoYmxvYikgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFibG9iKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBjcmVhdGUgaW1hZ2UuJylcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGJsb2IpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0eXBlXHJcbiAgICAgICAgKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRPdXRwdXRNaW1lVHlwZShcclxuICAgIGZvcm1hdDogVHJhbnNmb3JtYXRpb25QbGFuWydjb252ZXJ0VG8nXSxcclxuICAgIG9yaWdpbmFsVHlwZTogc3RyaW5nXHJcbik6IHN0cmluZyB7XHJcbiAgICBzd2l0Y2ggKGZvcm1hdCkge1xyXG4gICAgICAgIGNhc2UgJ2pwZWcnOlxyXG4gICAgICAgICAgICByZXR1cm4gJ2ltYWdlL2pwZWcnO1xyXG5cclxuICAgICAgICBjYXNlICdwbmcnOlxyXG4gICAgICAgICAgICByZXR1cm4gJ2ltYWdlL3BuZyc7XHJcblxyXG4gICAgICAgIGNhc2UgJ3dlYnAnOlxyXG4gICAgICAgICAgICByZXR1cm4gJ2ltYWdlL3dlYnAnO1xyXG5cclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4gb3JpZ2luYWxUeXBlO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRFeHRlbnNpb25Gb3JNaW1lVHlwZShcclxuICAgIG1pbWVUeXBlOiBzdHJpbmdcclxuKTogc3RyaW5nIHtcclxuICAgIHN3aXRjaCAobWltZVR5cGUpIHtcclxuICAgICAgICBjYXNlICdpbWFnZS9qcGVnJzpcclxuICAgICAgICAgICAgcmV0dXJuICdqcGcnO1xyXG5cclxuICAgICAgICBjYXNlICdpbWFnZS9wbmcnOlxyXG4gICAgICAgICAgICByZXR1cm4gJ3BuZyc7XHJcblxyXG4gICAgICAgIGNhc2UgJ2ltYWdlL3dlYnAnOlxyXG4gICAgICAgICAgICByZXR1cm4gJ3dlYnAnO1xyXG5cclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4gJ2ltZyc7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlcGxhY2VFeHRlbnNpb24oXHJcbiAgICBmaWxlTmFtZTogc3RyaW5nLFxyXG4gICAgZXh0ZW5zaW9uOiBzdHJpbmdcclxuKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IGxhc3REb3QgPSBmaWxlTmFtZS5sYXN0SW5kZXhPZignLicpO1xyXG5cclxuICAgIGlmIChsYXN0RG90ID09PSAtMSkge1xyXG4gICAgICAgIHJldHVybiBgJHtmaWxlTmFtZX0uJHtleHRlbnNpb259YDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYCR7ZmlsZU5hbWUuc2xpY2UoMCwgbGFzdERvdCl9LiR7ZXh0ZW5zaW9ufWA7XHJcbn0iLCJleHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tcHJlc3NJbWFnZShcclxuICBmaWxlOiBGaWxlLFxyXG4gIG9wdGlvbnM6IHtcclxuICAgIG1pbkJ5dGVzPzogbnVtYmVyO1xyXG4gICAgbWF4Qnl0ZXM/OiBudW1iZXI7XHJcbiAgICBmb3JtYXQ/OiAnanBlZycgfCAncG5nJyB8ICd3ZWJwJztcclxuICB9XHJcbik6IFByb21pc2U8RmlsZT4ge1xyXG4gIGNvbnN0IHtcclxuICAgIG1pbkJ5dGVzLFxyXG4gICAgbWF4Qnl0ZXMsXHJcbiAgICBmb3JtYXQgPSAnanBlZycsXHJcbiAgfSA9IG9wdGlvbnM7XHJcblxyXG4gIGlmICghZmlsZS50eXBlLnN0YXJ0c1dpdGgoJ2ltYWdlLycpKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgIGBDYW5ub3QgY29tcHJlc3Mgbm9uLWltYWdlIGZpbGU6ICR7ZmlsZS50eXBlfWBcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvLyBBbHJlYWR5IHdpdGhpbiB0aGUgcmVxdWlyZWQgcmFuZ2UuXHJcbiAgaWYgKFxyXG4gICAgKG1pbkJ5dGVzID09PSB1bmRlZmluZWQgfHwgZmlsZS5zaXplID49IG1pbkJ5dGVzKSAmJlxyXG4gICAgKG1heEJ5dGVzID09PSB1bmRlZmluZWQgfHwgZmlsZS5zaXplIDw9IG1heEJ5dGVzKVxyXG4gICkge1xyXG4gICAgcmV0dXJuIGZpbGU7XHJcbiAgfVxyXG5cclxuICBjb25zdCBpbWFnZSA9IGF3YWl0IGxvYWRJbWFnZShmaWxlKTtcclxuXHJcbiAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcblxyXG4gIGNhbnZhcy53aWR0aCA9IGltYWdlLm5hdHVyYWxXaWR0aDtcclxuICBjYW52YXMuaGVpZ2h0ID0gaW1hZ2UubmF0dXJhbEhlaWdodDtcclxuXHJcbiAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICBpZiAoIWNvbnRleHQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGNyZWF0ZSBjYW52YXMgY29udGV4dC4nKTtcclxuICB9XHJcblxyXG4gIGNvbnRleHQuZmlsbFN0eWxlID0gJyNmZmZmZmYnO1xyXG5cclxuICBjb250ZXh0LmZpbGxSZWN0KFxyXG4gICAgMCxcclxuICAgIDAsXHJcbiAgICBjYW52YXMud2lkdGgsXHJcbiAgICBjYW52YXMuaGVpZ2h0XHJcbiAgKTtcclxuXHJcbiAgY29udGV4dC5kcmF3SW1hZ2UoXHJcbiAgICBpbWFnZSxcclxuICAgIDAsXHJcbiAgICAwLFxyXG4gICAgY2FudmFzLndpZHRoLFxyXG4gICAgY2FudmFzLmhlaWdodFxyXG4gICk7XHJcblxyXG4gIC8vIEZpbGUgaXMgYmVsb3cgdGhlIG1pbmltdW0gc2l6ZS5cclxuICBpZiAoXHJcbiAgICBtaW5CeXRlcyAhPT0gdW5kZWZpbmVkICYmXHJcbiAgICBmaWxlLnNpemUgPCBtaW5CeXRlc1xyXG4gICkge1xyXG4gICAgY29uc3QgYmxvYiA9IGF3YWl0IGNhbnZhc1RvQmxvYihcclxuICAgICAgY2FudmFzLFxyXG4gICAgICAxLFxyXG4gICAgICBmb3JtYXRcclxuICAgICk7XHJcblxyXG4gICAgY29uc29sZS5sb2coXHJcbiAgICAgICdbRmlsZVRocm91Z2hdIE1pbmltdW0tc2l6ZSBhdHRlbXB0OicsXHJcbiAgICAgIHtcclxuICAgICAgICBxdWFsaXR5OiAxLFxyXG4gICAgICAgIHNpemVCeXRlczogYmxvYi5zaXplLFxyXG4gICAgICAgIG1pbkJ5dGVzLFxyXG4gICAgICAgIG1heEJ5dGVzLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIGlmIChcclxuICAgICAgYmxvYi5zaXplID49IG1pbkJ5dGVzICYmXHJcbiAgICAgIChtYXhCeXRlcyA9PT0gdW5kZWZpbmVkIHx8XHJcbiAgICAgICAgYmxvYi5zaXplIDw9IG1heEJ5dGVzKVxyXG4gICAgKSB7XHJcbiAgICAgIHJldHVybiBjcmVhdGVDb21wcmVzc2VkRmlsZShcclxuICAgICAgICBmaWxlLFxyXG4gICAgICAgIGJsb2IsXHJcbiAgICAgICAgZm9ybWF0XHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICBibG9iLnNpemUgPCBtaW5CeXRlcyAmJlxyXG4gICAgICAobWF4Qnl0ZXMgPT09IHVuZGVmaW5lZCB8fFxyXG4gICAgICAgIGJsb2Iuc2l6ZSA8PSBtYXhCeXRlcylcclxuICAgICkge1xyXG4gICAgICBsZXQgcGFkZGVkQmxvYjogQmxvYiB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgICAgaWYgKGZvcm1hdCA9PT0gJ2pwZWcnKSB7XHJcbiAgICAgICAgcGFkZGVkQmxvYiA9XHJcbiAgICAgICAgICBhd2FpdCBwYWRKcGVnVG9NaW5pbXVtKFxyXG4gICAgICAgICAgICBibG9iLFxyXG4gICAgICAgICAgICBtaW5CeXRlc1xyXG4gICAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGZvcm1hdCA9PT0gJ3BuZycpIHtcclxuICAgICAgICBwYWRkZWRCbG9iID1cclxuICAgICAgICAgIGF3YWl0IHBhZFBuZ1RvTWluaW11bShcclxuICAgICAgICAgICAgYmxvYixcclxuICAgICAgICAgICAgbWluQnl0ZXNcclxuICAgICAgICAgICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChcclxuICAgICAgICBwYWRkZWRCbG9iICYmXHJcbiAgICAgICAgcGFkZGVkQmxvYi5zaXplID49IG1pbkJ5dGVzICYmXHJcbiAgICAgICAgKG1heEJ5dGVzID09PSB1bmRlZmluZWQgfHxcclxuICAgICAgICAgIHBhZGRlZEJsb2Iuc2l6ZSA8PSBtYXhCeXRlcylcclxuICAgICAgKSB7XHJcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUNvbXByZXNzZWRGaWxlKFxyXG4gICAgICAgICAgZmlsZSxcclxuICAgICAgICAgIHBhZGRlZEJsb2IsXHJcbiAgICAgICAgICBmb3JtYXRcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICBgVW5hYmxlIHRvIHByb2R1Y2UgYW4gaW1hZ2UgYmV0d2VlbiAke21pbkJ5dGVzfSBhbmQgJHtcclxuICAgICAgICBtYXhCeXRlcyA/PyAndW5saW1pdGVkJ1xyXG4gICAgICB9IGJ5dGVzIGF0IHRoZSByZXF1aXJlZCBkaW1lbnNpb25zLmBcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvLyBGaWxlIGlzIGFib3ZlIHRoZSBtYXhpbXVtIHNpemUuXHJcbiAgaWYgKG1heEJ5dGVzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgJ0Nhbm5vdCBjb21wcmVzcyBpbWFnZSB3aXRob3V0IGEgbWF4aW11bSBieXRlIGxpbWl0LidcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBsZXQgbG93ID0gMC4wNTtcclxuICBsZXQgaGlnaCA9IDE7XHJcbiAgbGV0IGJlc3RCbG9iOiBCbG9iIHwgbnVsbCA9IG51bGw7XHJcblxyXG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgMTA7IGF0dGVtcHQrKykge1xyXG4gICAgY29uc3QgcXVhbGl0eSA9XHJcbiAgICAgIChsb3cgKyBoaWdoKSAvIDI7XHJcblxyXG4gICAgY29uc3QgYmxvYiA9IGF3YWl0IGNhbnZhc1RvQmxvYihcclxuICAgICAgY2FudmFzLFxyXG4gICAgICBxdWFsaXR5LFxyXG4gICAgICBmb3JtYXRcclxuICAgICk7XHJcblxyXG4gICAgY29uc29sZS5sb2coXHJcbiAgICAgIGBbRmlsZVRocm91Z2hdIENvbXByZXNzaW9uIGF0dGVtcHQgJHthdHRlbXB0ICsgMX06YCxcclxuICAgICAge1xyXG4gICAgICAgIHF1YWxpdHksXHJcbiAgICAgICAgc2l6ZUJ5dGVzOiBibG9iLnNpemUsXHJcbiAgICAgICAgbWluQnl0ZXMsXHJcbiAgICAgICAgbWF4Qnl0ZXMsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgaWYgKGJsb2Iuc2l6ZSA+IG1heEJ5dGVzKSB7XHJcbiAgICAgIGhpZ2ggPSBxdWFsaXR5O1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoXHJcbiAgICAgIG1pbkJ5dGVzICE9PSB1bmRlZmluZWQgJiZcclxuICAgICAgYmxvYi5zaXplIDwgbWluQnl0ZXNcclxuICAgICkge1xyXG4gICAgICBsb3cgPSBxdWFsaXR5O1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuXHJcbiAgICBiZXN0QmxvYiA9IGJsb2I7XHJcbiAgICBsb3cgPSBxdWFsaXR5O1xyXG4gIH1cclxuXHJcbiAgaWYgKCFiZXN0QmxvYikge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICBgVW5hYmxlIHRvIHByb2R1Y2UgYW4gaW1hZ2UgYmV0d2VlbiAke1xyXG4gICAgICAgIG1pbkJ5dGVzID8/IDBcclxuICAgICAgfSBhbmQgJHttYXhCeXRlc30gYnl0ZXMuYFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBjcmVhdGVDb21wcmVzc2VkRmlsZShcclxuICAgIGZpbGUsXHJcbiAgICBiZXN0QmxvYixcclxuICAgIGZvcm1hdFxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZUNvbXByZXNzZWRGaWxlKFxyXG4gIG9yaWdpbmFsRmlsZTogRmlsZSxcclxuICBibG9iOiBCbG9iLFxyXG4gIGZvcm1hdDogJ2pwZWcnIHwgJ3BuZycgfCAnd2VicCdcclxuKTogRmlsZSB7XHJcbiAgY29uc3QgZXh0ZW5zaW9uID1cclxuICAgIGZvcm1hdCA9PT0gJ2pwZWcnXHJcbiAgICAgID8gJ2pwZydcclxuICAgICAgOiBmb3JtYXQ7XHJcblxyXG4gIGNvbnN0IG1pbWVUeXBlID1cclxuICAgIGZvcm1hdCA9PT0gJ2pwZWcnXHJcbiAgICAgID8gJ2ltYWdlL2pwZWcnXHJcbiAgICAgIDogZm9ybWF0ID09PSAncG5nJ1xyXG4gICAgICAgID8gJ2ltYWdlL3BuZydcclxuICAgICAgICA6ICdpbWFnZS93ZWJwJztcclxuXHJcbiAgcmV0dXJuIG5ldyBGaWxlKFxyXG4gICAgW2Jsb2JdLFxyXG4gICAgcmVwbGFjZUV4dGVuc2lvbihcclxuICAgICAgb3JpZ2luYWxGaWxlLm5hbWUsXHJcbiAgICAgIGV4dGVuc2lvblxyXG4gICAgKSxcclxuICAgIHtcclxuICAgICAgdHlwZTogbWltZVR5cGUsXHJcbiAgICAgIGxhc3RNb2RpZmllZDogRGF0ZS5ub3coKSxcclxuICAgIH1cclxuICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb2FkSW1hZ2UoXHJcbiAgZmlsZTogRmlsZVxyXG4pOiBQcm9taXNlPEhUTUxJbWFnZUVsZW1lbnQ+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgY29uc3QgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChmaWxlKTtcclxuXHJcbiAgICBjb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG5cclxuICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xyXG4gICAgICByZXNvbHZlKGltYWdlKTtcclxuICAgIH07XHJcblxyXG4gICAgaW1hZ2Uub25lcnJvciA9ICgpID0+IHtcclxuICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xyXG5cclxuICAgICAgcmVqZWN0KFxyXG4gICAgICAgIG5ldyBFcnJvcignVW5hYmxlIHRvIGRlY29kZSBpbWFnZS4nKVxyXG4gICAgICApO1xyXG4gICAgfTtcclxuXHJcbiAgICBpbWFnZS5zcmMgPSB1cmw7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNhbnZhc1RvQmxvYihcclxuICBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50LFxyXG4gIHF1YWxpdHk6IG51bWJlcixcclxuICBmb3JtYXQ6ICdqcGVnJyB8ICdwbmcnIHwgJ3dlYnAnXHJcbik6IFByb21pc2U8QmxvYj4ge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBjb25zdCBtaW1lVHlwZSA9XHJcbiAgICAgIGZvcm1hdCA9PT0gJ2pwZWcnXHJcbiAgICAgICAgPyAnaW1hZ2UvanBlZydcclxuICAgICAgICA6IGZvcm1hdCA9PT0gJ3BuZydcclxuICAgICAgICAgID8gJ2ltYWdlL3BuZydcclxuICAgICAgICAgIDogJ2ltYWdlL3dlYnAnO1xyXG5cclxuICAgIGNhbnZhcy50b0Jsb2IoXHJcbiAgICAgIChibG9iKSA9PiB7XHJcbiAgICAgICAgaWYgKCFibG9iKSB7XHJcbiAgICAgICAgICByZWplY3QoXHJcbiAgICAgICAgICAgIG5ldyBFcnJvcihcclxuICAgICAgICAgICAgICBgRmFpbGVkIHRvIGNyZWF0ZSAke2Zvcm1hdH0gaW1hZ2UuYFxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlc29sdmUoYmxvYik7XHJcbiAgICAgIH0sXHJcbiAgICAgIG1pbWVUeXBlLFxyXG4gICAgICBmb3JtYXQgPT09ICdwbmcnXHJcbiAgICAgICAgPyB1bmRlZmluZWRcclxuICAgICAgICA6IHF1YWxpdHlcclxuICAgICk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhZEpwZWdUb01pbmltdW0oXHJcbiAgYmxvYjogQmxvYixcclxuICBtaW5CeXRlczogbnVtYmVyXHJcbik6IFByb21pc2U8QmxvYj4ge1xyXG4gIHJldHVybiBibG9iLmFycmF5QnVmZmVyKCkudGhlbigoYnVmZmVyKSA9PiB7XHJcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICBieXRlcy5sZW5ndGggPCA0IHx8XHJcbiAgICAgIGJ5dGVzWzBdICE9PSAweGZmIHx8XHJcbiAgICAgIGJ5dGVzWzFdICE9PSAweGQ4IHx8XHJcbiAgICAgIGJ5dGVzW2J5dGVzLmxlbmd0aCAtIDJdICE9PSAweGZmIHx8XHJcbiAgICAgIGJ5dGVzW2J5dGVzLmxlbmd0aCAtIDFdICE9PSAweGQ5XHJcbiAgICApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICdDYW5ub3QgcGFkIEpQRUc6IGludmFsaWQgSlBFRyBkYXRhLidcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwYWRkaW5nQnl0ZXMgPVxyXG4gICAgICBtaW5CeXRlcyAtIGJ5dGVzLmxlbmd0aDtcclxuXHJcbiAgICBpZiAocGFkZGluZ0J5dGVzIDw9IDApIHtcclxuICAgICAgcmV0dXJuIGJsb2I7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY29tbWVudERhdGFMZW5ndGggPVxyXG4gICAgICBwYWRkaW5nQnl0ZXM7XHJcblxyXG4gICAgY29uc3QgY29tbWVudExlbmd0aCA9XHJcbiAgICAgIGNvbW1lbnREYXRhTGVuZ3RoICsgMjtcclxuXHJcbiAgICBpZiAoY29tbWVudExlbmd0aCA+IDY1NTM1KSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAnQ2Fubm90IHBhZCBKUEVHOiBwYWRkaW5nIGlzIHRvbyBsYXJnZS4nXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY29tbWVudCA9IG5ldyBVaW50OEFycmF5KFxyXG4gICAgICBjb21tZW50RGF0YUxlbmd0aCArIDRcclxuICAgICk7XHJcblxyXG4gICAgLy8gSlBFRyBDT00gbWFya2VyXHJcbiAgICBjb21tZW50WzBdID0gMHhmZjtcclxuICAgIGNvbW1lbnRbMV0gPSAweGZlO1xyXG5cclxuICAgIC8vIExlbmd0aCBpbmNsdWRlcyB0aGVzZSB0d28gbGVuZ3RoIGJ5dGVzLlxyXG4gICAgY29tbWVudFsyXSA9XHJcbiAgICAgIChjb21tZW50TGVuZ3RoID4+IDgpICYgMHhmZjtcclxuXHJcbiAgICBjb21tZW50WzNdID1cclxuICAgICAgY29tbWVudExlbmd0aCAmIDB4ZmY7XHJcblxyXG4gICAgY29uc3QgZW9pSW5kZXggPVxyXG4gICAgICBieXRlcy5sZW5ndGggLSAyO1xyXG5cclxuICAgIGNvbnN0IG91dHB1dCA9IG5ldyBVaW50OEFycmF5KFxyXG4gICAgICBieXRlcy5sZW5ndGggKyBjb21tZW50Lmxlbmd0aFxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBFdmVyeXRoaW5nIGJlZm9yZSBFT0lcclxuICAgIG91dHB1dC5zZXQoXHJcbiAgICAgIGJ5dGVzLnNsaWNlKDAsIGVvaUluZGV4KSxcclxuICAgICAgMFxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBDb21tZW50IHNlZ21lbnRcclxuICAgIG91dHB1dC5zZXQoXHJcbiAgICAgIGNvbW1lbnQsXHJcbiAgICAgIGVvaUluZGV4XHJcbiAgICApO1xyXG5cclxuICAgIC8vIE9yaWdpbmFsIEVPSSBtYXJrZXJcclxuICAgIG91dHB1dC5zZXQoXHJcbiAgICAgIGJ5dGVzLnNsaWNlKGVvaUluZGV4KSxcclxuICAgICAgZW9pSW5kZXggKyBjb21tZW50Lmxlbmd0aFxyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IEJsb2IoXHJcbiAgICAgIFtvdXRwdXRdLFxyXG4gICAgICB7IHR5cGU6ICdpbWFnZS9qcGVnJyB9XHJcbiAgICApO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYWRQbmdUb01pbmltdW0oXHJcbiAgYmxvYjogQmxvYixcclxuICBtaW5CeXRlczogbnVtYmVyXHJcbik6IFByb21pc2U8QmxvYj4ge1xyXG4gIHJldHVybiBibG9iLmFycmF5QnVmZmVyKCkudGhlbigoYnVmZmVyKSA9PiB7XHJcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICBieXRlcy5sZW5ndGggPCAxMiB8fFxyXG4gICAgICBieXRlc1swXSAhPT0gMHg4OSB8fFxyXG4gICAgICBieXRlc1sxXSAhPT0gMHg1MCB8fFxyXG4gICAgICBieXRlc1syXSAhPT0gMHg0ZSB8fFxyXG4gICAgICBieXRlc1szXSAhPT0gMHg0NyB8fFxyXG4gICAgICBieXRlc1s0XSAhPT0gMHgwZCB8fFxyXG4gICAgICBieXRlc1s1XSAhPT0gMHgwYSB8fFxyXG4gICAgICBieXRlc1s2XSAhPT0gMHgxYSB8fFxyXG4gICAgICBieXRlc1s3XSAhPT0gMHgwYVxyXG4gICAgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAnQ2Fubm90IHBhZCBQTkc6IGludmFsaWQgUE5HIGRhdGEuJ1xyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBhZGRpbmdCeXRlcyA9XHJcbiAgICAgIG1pbkJ5dGVzIC0gYnl0ZXMubGVuZ3RoO1xyXG5cclxuICAgIGlmIChwYWRkaW5nQnl0ZXMgPD0gMCkge1xyXG4gICAgICByZXR1cm4gYmxvYjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjaHVua0RhdGFMZW5ndGggPVxyXG4gICAgICBwYWRkaW5nQnl0ZXMgLSAxMjtcclxuXHJcbiAgICBpZiAoY2h1bmtEYXRhTGVuZ3RoIDwgMCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgJ0Nhbm5vdCBwYWQgUE5HOiBwYWRkaW5nIGlzIHRvbyBzbWFsbC4nXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY2h1bmsgPSBjcmVhdGVQbmdUZXh0Q2h1bmsoXHJcbiAgICAgIGNodW5rRGF0YUxlbmd0aFxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBpZW5kSW5kZXggPVxyXG4gICAgICBieXRlcy5sZW5ndGggLSAxMjtcclxuXHJcbiAgICBjb25zdCBvdXRwdXQgPSBuZXcgVWludDhBcnJheShcclxuICAgICAgYnl0ZXMubGVuZ3RoICsgY2h1bmsubGVuZ3RoXHJcbiAgICApO1xyXG5cclxuICAgIG91dHB1dC5zZXQoXHJcbiAgICAgIGJ5dGVzLnNsaWNlKDAsIGllbmRJbmRleCksXHJcbiAgICAgIDBcclxuICAgICk7XHJcblxyXG4gICAgb3V0cHV0LnNldChcclxuICAgICAgY2h1bmssXHJcbiAgICAgIGllbmRJbmRleFxyXG4gICAgKTtcclxuXHJcbiAgICBvdXRwdXQuc2V0KFxyXG4gICAgICBieXRlcy5zbGljZShpZW5kSW5kZXgpLFxyXG4gICAgICBpZW5kSW5kZXggKyBjaHVuay5sZW5ndGhcclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBCbG9iKFxyXG4gICAgICBbb3V0cHV0XSxcclxuICAgICAgeyB0eXBlOiAnaW1hZ2UvcG5nJyB9XHJcbiAgICApO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVQbmdUZXh0Q2h1bmsoXHJcbiAgZGF0YUxlbmd0aDogbnVtYmVyXHJcbik6IFVpbnQ4QXJyYXkge1xyXG4gIGNvbnN0IGNodW5rID0gbmV3IFVpbnQ4QXJyYXkoXHJcbiAgICAxMiArIGRhdGFMZW5ndGhcclxuICApO1xyXG5cclxuICAvLyBDaHVuayBsZW5ndGhcclxuICBjaHVua1swXSA9XHJcbiAgICAoZGF0YUxlbmd0aCA+PiAyNCkgJiAweGZmO1xyXG5cclxuICBjaHVua1sxXSA9XHJcbiAgICAoZGF0YUxlbmd0aCA+PiAxNikgJiAweGZmO1xyXG5cclxuICBjaHVua1syXSA9XHJcbiAgICAoZGF0YUxlbmd0aCA+PiA4KSAmIDB4ZmY7XHJcblxyXG4gIGNodW5rWzNdID1cclxuICAgIGRhdGFMZW5ndGggJiAweGZmO1xyXG5cclxuICAvLyBDaHVuayB0eXBlOiB0RVh0XHJcbiAgY2h1bmtbNF0gPSAweDc0O1xyXG4gIGNodW5rWzVdID0gMHg0NTtcclxuICBjaHVua1s2XSA9IDB4NTg7XHJcbiAgY2h1bmtbN10gPSAweDc0O1xyXG5cclxuICAvLyBMZWF2ZSB0aGUgdGV4dCBkYXRhIGFzIHplcm8gYnl0ZXMuXHJcbiAgLy8gQ1JDIGlzIGNhbGN1bGF0ZWQgYmVsb3cuXHJcbiAgY29uc3QgY3JjID0gY3JjMzIoXHJcbiAgICBjaHVuay5zbGljZSg0LCA4ICsgZGF0YUxlbmd0aClcclxuICApO1xyXG5cclxuICBjaHVua1s4XSA9XHJcbiAgICAoY3JjID4+PiAyNCkgJiAweGZmO1xyXG5cclxuICBjaHVua1s5XSA9XHJcbiAgICAoY3JjID4+PiAxNikgJiAweGZmO1xyXG5cclxuICBjaHVua1sxMF0gPVxyXG4gICAgKGNyYyA+Pj4gOCkgJiAweGZmO1xyXG5cclxuICBjaHVua1sxMV0gPVxyXG4gICAgY3JjICYgMHhmZjtcclxuXHJcbiAgcmV0dXJuIGNodW5rO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmMzMihcclxuICBieXRlczogVWludDhBcnJheVxyXG4pOiBudW1iZXIge1xyXG4gIGxldCBjcmMgPSAweGZmZmZmZmZmO1xyXG5cclxuICBmb3IgKGNvbnN0IGJ5dGUgb2YgYnl0ZXMpIHtcclxuICAgIGNyYyBePSBieXRlO1xyXG5cclxuICAgIGZvciAobGV0IGJpdCA9IDA7IGJpdCA8IDg7IGJpdCsrKSB7XHJcbiAgICAgIGNyYyA9XHJcbiAgICAgICAgKGNyYyA+Pj4gMSkgXlxyXG4gICAgICAgIChjcmMgJiAxXHJcbiAgICAgICAgICA/IDB4ZWRiODgzMjBcclxuICAgICAgICAgIDogMCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gKGNyYyBeIDB4ZmZmZmZmZmYpID4+PiAwO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZXBsYWNlRXh0ZW5zaW9uKFxyXG4gIGZpbGVOYW1lOiBzdHJpbmcsXHJcbiAgZXh0ZW5zaW9uOiBzdHJpbmdcclxuKTogc3RyaW5nIHtcclxuICBjb25zdCBsYXN0RG90ID0gZmlsZU5hbWUubGFzdEluZGV4T2YoJy4nKTtcclxuXHJcbiAgaWYgKGxhc3REb3QgPT09IC0xKSB7XHJcbiAgICByZXR1cm4gYCR7ZmlsZU5hbWV9LiR7ZXh0ZW5zaW9ufWA7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gYCR7ZmlsZU5hbWUuc2xpY2UoMCwgbGFzdERvdCl9LiR7ZXh0ZW5zaW9ufWA7XHJcbn07IiwiaW1wb3J0IHR5cGUgeyBGaWxlUHJvY2Vzc2VkTWVzc2FnZSB9IGZyb20gJy4uL2NvcmUvbWVzc2FnZXMnO1xyXG5pbXBvcnQgeyBwYXJzZUNvbnN0cmFpbnRzIH0gZnJvbSAnLi4vY29yZS9wYXJzZXIvcGFyc2VDb25zdHJhaW50cyc7XHJcbmltcG9ydCB7IGV4dHJhY3RVcGxvYWRDb250ZXh0IH0gZnJvbSAnLi4vY29yZS9kZXRlY3Rvci9leHRyYWN0VXBsb2FkQ29udGV4dCc7XHJcbmltcG9ydCB7IGluc3BlY3RGaWxlIH0gZnJvbSAnLi4vY29yZS9pbnNwZWN0b3IvaW5zcGVjdEZpbGUnO1xyXG5pbXBvcnQgeyB2YWxpZGF0ZUZpbGUgfSBmcm9tICcuLi9jb3JlL3ZhbGlkYXRvci92YWxpZGF0ZUZpbGUnO1xyXG5pbXBvcnQgeyBjcmVhdGVUcmFuc2Zvcm1hdGlvblBsYW4gfSBmcm9tICcuLi9jb3JlL3BsYW5uZXIvY3JlYXRlVHJhbnNmb3JtYXRpb25QbGFuJztcclxuaW1wb3J0IHsgdHJhbnNmb3JtSW1hZ2UgfSBmcm9tICcuLi9jb3JlL3RyYW5zZm9ybWVyL3RyYW5zZm9ybUltYWdlJztcclxuaW1wb3J0IHsgY29tcHJlc3NJbWFnZSB9IGZyb20gJy4uL2NvcmUvdHJhbnNmb3JtZXIvY29tcHJlc3NJbWFnZSc7XHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbnRlbnRTY3JpcHQoe1xyXG4gIG1hdGNoZXM6IFsnPGFsbF91cmxzPiddLFxyXG5cclxuICBtYWluKCkge1xyXG4gICAgY29uc29sZS5sb2coJ1tGaWxlVGhyb3VnaF0gQ29udGVudCBzY3JpcHQgbG9hZGVkJyk7XHJcblxyXG4gICAgY29uc3QgZGV0ZWN0ZWRJbnB1dHMgPSBuZXcgV2Vha1NldDxIVE1MSW5wdXRFbGVtZW50PigpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyRmlsZUlucHV0KGlucHV0OiBIVE1MSW5wdXRFbGVtZW50KSB7XHJcbiAgICAgIC8vIERvbid0IHByb2Nlc3MgdGhlIHNhbWUgaW5wdXQgdHdpY2VcclxuICAgICAgaWYgKGRldGVjdGVkSW5wdXRzLmhhcyhpbnB1dCkpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGRldGVjdGVkSW5wdXRzLmFkZChpbnB1dCk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZygnW0ZpbGVUaHJvdWdoXSBVcGxvYWQgZmllbGQgZGV0ZWN0ZWQnLCB7XHJcbiAgICAgICAgYWNjZXB0OiBpbnB1dC5hY2NlcHQgfHwgJ05vdCBzcGVjaWZpZWQnLFxyXG4gICAgICAgIG11bHRpcGxlOiBpbnB1dC5tdWx0aXBsZSxcclxuICAgICAgICBuYW1lOiBpbnB1dC5uYW1lIHx8ICdOb3Qgc3BlY2lmaWVkJyxcclxuICAgICAgICBpZDogaW5wdXQuaWQgfHwgJ05vdCBzcGVjaWZpZWQnLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vMS5FeHRyYWN0IGNvbnRleHRcclxuICAgICAgY29uc3QgY29udGV4dCA9IGV4dHJhY3RVcGxvYWRDb250ZXh0KGlucHV0KTtcclxuICAgICAgY29uc29sZS5sb2coJ1tGaWxlVGhyb3VnaF0gVXBsb2FkIGNvbnRleHQnLCBjb250ZXh0KTtcclxuICAgICAgLy8yLlBhcnNlIGNvbnN0cmFpbnRzXHJcbiAgICAgIGNvbnN0IGNvbnN0cmFpbnRzID0gcGFyc2VDb25zdHJhaW50cyhjb250ZXh0KTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICdbRmlsZVRocm91Z2hdIFVwbG9hZCBjb25zdHJhaW50cycsXHJcbiAgICAgICAgY29uc3RyYWludHNcclxuICAgICAgKTtcclxuICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgYXN5bmMgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgaWYgKGV2ZW50LmlzVHJ1c3RlZCA9PT0gZmFsc2UpIHtcclxuICByZXR1cm47XHJcbn1cclxuICAgICAgICBjb25zdCBmaWxlID0gaW5wdXQuZmlsZXM/LlswXTtcclxuXHJcbiAgICAgICAgaWYgKCFmaWxlKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgZmlsZUluZm8gPSBhd2FpdCBpbnNwZWN0RmlsZShmaWxlKTtcclxuXHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgJ1tGaWxlVGhyb3VnaF0gU2VsZWN0ZWQgZmlsZScsXHJcbiAgICAgICAgICAgIGZpbGVJbmZvXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgLy8zLlZhbGlkYXRlIHRoZSBmaWxlXHJcbiAgICAgICAgICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVGaWxlKGZpbGVJbmZvLCBjb25zdHJhaW50cyk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgJ1tGaWxlVGhyb3VnaF0gVmFsaWRhdGlvbiByZXN1bHQnLFxyXG4gICAgICAgICAgICB2YWxpZGF0aW9uXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIC8vNC5DcmVhdGUgdHJhbnNmb3JtYXRpb24gcGxhblxyXG4gICAgICAgICAgY29uc3QgcGxhbiA9IGNyZWF0ZVRyYW5zZm9ybWF0aW9uUGxhbihmaWxlSW5mbywgY29uc3RyYWludHMpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ1tGaWxlVGhyb3VnaF0gVHJhbnNmb3JtYXRpb24gcGxhbicsIHBsYW4pO1xyXG4gICAgICAgaWYgKE9iamVjdC5rZXlzKHBsYW4pLmxlbmd0aCA+IDApIHtcclxuICBsZXQgdHJhbnNmb3JtZWRGaWxlID0gZmlsZTtcclxuICBsZXQgZmluYWxGaWxlID0gZmlsZTtcclxuICBsZXQgZmluYWxJbmZvID0gZmlsZUluZm87XHJcblxyXG4gIHRyeSB7XHJcbiAgICB0cmFuc2Zvcm1lZEZpbGUgPVxyXG4gICAgICBhd2FpdCB0cmFuc2Zvcm1JbWFnZShmaWxlLCBwbGFuKTtcclxuXHJcbiAgICBjb25zdCB0cmFuc2Zvcm1lZEluZm8gPVxyXG4gICAgICBhd2FpdCBpbnNwZWN0RmlsZSh0cmFuc2Zvcm1lZEZpbGUpO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAnW0ZpbGVUaHJvdWdoXSBUcmFuc2Zvcm1lZCBmaWxlJyxcclxuICAgICAgdHJhbnNmb3JtZWRJbmZvXHJcbiAgICApO1xyXG5cclxuICAgIGZpbmFsRmlsZSA9IHRyYW5zZm9ybWVkRmlsZTtcclxuICAgIGZpbmFsSW5mbyA9IHRyYW5zZm9ybWVkSW5mbztcclxuICB9XHJcbiAgY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFxyXG4gICAgICAnW0ZpbGVUaHJvdWdoXSBUcmFuc2Zvcm1hdGlvbiBmYWlsZWQnLFxyXG4gICAgICBlcnJvclxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGlmIChwbGFuLmNvbXByZXNzKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBmaW5hbEZpbGUgPSBhd2FpdCBjb21wcmVzc0ltYWdlKFxyXG4gICAgICAgIHRyYW5zZm9ybWVkRmlsZSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBtaW5CeXRlczogcGxhbi5jb21wcmVzcy5taW5CeXRlcyxcclxuICAgICAgICAgIG1heEJ5dGVzOiBwbGFuLmNvbXByZXNzLm1heEJ5dGVzLFxyXG4gICAgICAgICAgZm9ybWF0OiBwbGFuLmNvbXByZXNzLmZvcm1hdCxcclxuICAgICAgICB9XHJcbiAgICAgICk7XHJcblxyXG4gICAgICBmaW5hbEluZm8gPVxyXG4gICAgICAgIGF3YWl0IGluc3BlY3RGaWxlKGZpbmFsRmlsZSk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAnW0ZpbGVUaHJvdWdoXSBDb21wcmVzc2VkIGZpbGUnLFxyXG4gICAgICAgIGZpbmFsSW5mb1xyXG4gICAgICApO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgJ1tGaWxlVGhyb3VnaF0gQ29tcHJlc3Npb24gZmFpbGVkJyxcclxuICAgICAgICBlcnJvclxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmVwbGFjZUlucHV0RmlsZShpbnB1dCwgZmluYWxGaWxlKTtcclxuXHJcbiAgaW5wdXQuZGlzcGF0Y2hFdmVudChcclxuICAgIG5ldyBFdmVudCgnY2hhbmdlJywge1xyXG4gICAgICBidWJibGVzOiB0cnVlLFxyXG4gICAgfSlcclxuICApO1xyXG5cclxuICBjb25zb2xlLmxvZyhcclxuICAgICdbRmlsZVRocm91Z2hdIEZpbmFsIGZpbGUgaW5qZWN0ZWQnLFxyXG4gICAge1xyXG4gICAgICBuYW1lOiBmaW5hbEZpbGUubmFtZSxcclxuICAgICAgdHlwZTogZmluYWxGaWxlLnR5cGUsXHJcbiAgICAgIHNpemVCeXRlczogZmluYWxGaWxlLnNpemUsXHJcbiAgICB9XHJcbiAgKTtcclxuXHJcbiAgY29uc3QgbWVzc2FnZTogRmlsZVByb2Nlc3NlZE1lc3NhZ2UgPSB7XHJcbiAgICB0eXBlOiAnZmlsZS1wcm9jZXNzZWQnLFxyXG4gICAgb3JpZ2luYWw6IGZpbGVJbmZvLFxyXG4gICAgZmluYWw6IGZpbmFsSW5mbyxcclxuICB9O1xyXG5cclxuICBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2UobWVzc2FnZSk7XHJcbn1cclxuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcignW0ZpbGVUaHJvdWdoXSBDb3VsZCBub3QgaW5zcGVjdCBmaWxlJywgZXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmVwbGFjZUlucHV0RmlsZShcclxuICBpbnB1dDogSFRNTElucHV0RWxlbWVudCxcclxuICBmaWxlOiBGaWxlXHJcbikge1xyXG4gIGNvbnN0IGRhdGFUcmFuc2ZlciA9IG5ldyBEYXRhVHJhbnNmZXIoKTtcclxuXHJcbiAgZGF0YVRyYW5zZmVyLml0ZW1zLmFkZChmaWxlKTtcclxuXHJcbiAgaW5wdXQuZmlsZXMgPSBkYXRhVHJhbnNmZXIuZmlsZXM7XHJcbn1cclxuXHJcbiAgICBmdW5jdGlvbiBzY2FuRm9yRmlsZUlucHV0cyhyb290OiBQYXJlbnROb2RlID0gZG9jdW1lbnQpIHtcclxuICAgICAgY29uc3QgaW5wdXRzID1cclxuICAgICAgICByb290LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTElucHV0RWxlbWVudD4oJ2lucHV0W3R5cGU9XCJmaWxlXCJdJyk7XHJcblxyXG4gICAgICBpbnB1dHMuZm9yRWFjaChyZWdpc3RlckZpbGVJbnB1dCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2NhbiBpbnB1dHMgYWxyZWFkeSBwcmVzZW50IG9uIHRoZSBwYWdlXHJcbiAgICBzY2FuRm9yRmlsZUlucHV0cygpO1xyXG5cclxuICAgIC8vIFdhdGNoIGZvciBpbnB1dHMgYWRkZWQgbGF0ZXJcclxuICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKG11dGF0aW9ucykgPT4ge1xyXG4gICAgICBmb3IgKGNvbnN0IG11dGF0aW9uIG9mIG11dGF0aW9ucykge1xyXG4gICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBtdXRhdGlvbi5hZGRlZE5vZGVzKSB7XHJcbiAgICAgICAgICBpZiAoIShub2RlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFRoZSBhZGRlZCBlbGVtZW50IGl0c2VsZiBtaWdodCBiZSBhIGZpbGUgaW5wdXRcclxuICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgbm9kZSBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQgJiZcclxuICAgICAgICAgICAgbm9kZS50eXBlID09PSAnZmlsZSdcclxuICAgICAgICAgICkge1xyXG4gICAgICAgICAgICByZWdpc3RlckZpbGVJbnB1dChub2RlKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBPciBpdCBtaWdodCBjb250YWluIGZpbGUgaW5wdXRzXHJcbiAgICAgICAgICBzY2FuRm9yRmlsZUlucHV0cyhub2RlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIG9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCB7XHJcbiAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcclxuICAgICAgc3VidHJlZTogdHJ1ZSxcclxuICAgIH0pO1xyXG4gIH0sXHJcbn0pOyIsIi8vI3JlZ2lvbiBzcmMvdXRpbHMvaW50ZXJuYWwvbG9nZ2VyLnRzXG5mdW5jdGlvbiBwcmludChtZXRob2QsIC4uLmFyZ3MpIHtcblx0aWYgKGltcG9ydC5tZXRhLmVudi5NT0RFID09PSBcInByb2R1Y3Rpb25cIikgcmV0dXJuO1xuXHRpZiAodHlwZW9mIGFyZ3NbMF0gPT09IFwic3RyaW5nXCIpIG1ldGhvZChgW3d4dF0gJHthcmdzLnNoaWZ0KCl9YCwgLi4uYXJncyk7XG5cdGVsc2UgbWV0aG9kKFwiW3d4dF1cIiwgLi4uYXJncyk7XG59XG4vKiogV3JhcHBlciBhcm91bmQgYGNvbnNvbGVgIHdpdGggYSBcIlt3eHRdXCIgcHJlZml4ICovXG5jb25zdCBsb2dnZXIgPSB7XG5cdGRlYnVnOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5kZWJ1ZywgLi4uYXJncyksXG5cdGxvZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUubG9nLCAuLi5hcmdzKSxcblx0d2FybjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUud2FybiwgLi4uYXJncyksXG5cdGVycm9yOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5lcnJvciwgLi4uYXJncylcbn07XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGxvZ2dlciB9O1xuIiwiaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gXCJ3eHQvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy91dGlscy9pbnRlcm5hbC9jdXN0b20tZXZlbnRzLnRzXG52YXIgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCA9IGNsYXNzIFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgZXh0ZW5kcyBFdmVudCB7XG5cdHN0YXRpYyBFVkVOVF9OQU1FID0gZ2V0VW5pcXVlRXZlbnROYW1lKFwid3h0OmxvY2F0aW9uY2hhbmdlXCIpO1xuXHRjb25zdHJ1Y3RvcihuZXdVcmwsIG9sZFVybCkge1xuXHRcdHN1cGVyKFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQuRVZFTlRfTkFNRSwge30pO1xuXHRcdHRoaXMubmV3VXJsID0gbmV3VXJsO1xuXHRcdHRoaXMub2xkVXJsID0gb2xkVXJsO1xuXHR9XG59O1xuLyoqXG4qIFJldHVybnMgYW4gZXZlbnQgbmFtZSB1bmlxdWUgdG8gdGhlIGV4dGVuc2lvbiBhbmQgY29udGVudCBzY3JpcHQgdGhhdCdzXG4qIHJ1bm5pbmcuXG4qL1xuZnVuY3Rpb24gZ2V0VW5pcXVlRXZlbnROYW1lKGV2ZW50TmFtZSkge1xuXHRyZXR1cm4gYCR7YnJvd3Nlcj8ucnVudGltZT8uaWR9OiR7aW1wb3J0Lm1ldGEuZW52LkVOVFJZUE9JTlR9OiR7ZXZlbnROYW1lfWA7XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQsIGdldFVuaXF1ZUV2ZW50TmFtZSB9O1xuIiwiaW1wb3J0IHsgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCB9IGZyb20gXCIuL2N1c3RvbS1ldmVudHMubWpzXCI7XG4vLyNyZWdpb24gc3JjL3V0aWxzL2ludGVybmFsL2xvY2F0aW9uLXdhdGNoZXIudHNcbmNvbnN0IHN1cHBvcnRzTmF2aWdhdGlvbkFwaSA9IHR5cGVvZiBnbG9iYWxUaGlzLm5hdmlnYXRpb24/LmFkZEV2ZW50TGlzdGVuZXIgPT09IFwiZnVuY3Rpb25cIjtcbi8qKlxuKiBDcmVhdGUgYSB1dGlsIHRoYXQgd2F0Y2hlcyBmb3IgVVJMIGNoYW5nZXMsIGRpc3BhdGNoaW5nIHRoZSBjdXN0b20gZXZlbnQgd2hlblxuKiBkZXRlY3RlZC4gU3RvcHMgd2F0Y2hpbmcgd2hlbiBjb250ZW50IHNjcmlwdCBpcyBpbnZhbGlkYXRlZC4gVXNlcyBOYXZpZ2F0aW9uXG4qIEFQSSB3aGVuIGF2YWlsYWJsZSwgb3RoZXJ3aXNlIGZhbGxzIGJhY2sgdG8gcG9sbGluZy5cbiovXG5mdW5jdGlvbiBjcmVhdGVMb2NhdGlvbldhdGNoZXIoY3R4KSB7XG5cdGxldCBsYXN0VXJsO1xuXHRsZXQgd2F0Y2hpbmcgPSBmYWxzZTtcblx0cmV0dXJuIHsgcnVuKCkge1xuXHRcdGlmICh3YXRjaGluZykgcmV0dXJuO1xuXHRcdHdhdGNoaW5nID0gdHJ1ZTtcblx0XHRsYXN0VXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcblx0XHRpZiAoc3VwcG9ydHNOYXZpZ2F0aW9uQXBpKSBnbG9iYWxUaGlzLm5hdmlnYXRpb24uYWRkRXZlbnRMaXN0ZW5lcihcIm5hdmlnYXRlXCIsIChldmVudCkgPT4ge1xuXHRcdFx0Y29uc3QgbmV3VXJsID0gbmV3IFVSTChldmVudC5kZXN0aW5hdGlvbi51cmwpO1xuXHRcdFx0aWYgKG5ld1VybC5ocmVmID09PSBsYXN0VXJsLmhyZWYpIHJldHVybjtcblx0XHRcdHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50KG5ld1VybCwgbGFzdFVybCkpO1xuXHRcdFx0bGFzdFVybCA9IG5ld1VybDtcblx0XHR9LCB7IHNpZ25hbDogY3R4LnNpZ25hbCB9KTtcblx0XHRlbHNlIGN0eC5zZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHRjb25zdCBuZXdVcmwgPSBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpO1xuXHRcdFx0aWYgKG5ld1VybC5ocmVmICE9PSBsYXN0VXJsLmhyZWYpIHtcblx0XHRcdFx0d2luZG93LmRpc3BhdGNoRXZlbnQobmV3IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQobmV3VXJsLCBsYXN0VXJsKSk7XG5cdFx0XHRcdGxhc3RVcmwgPSBuZXdVcmw7XG5cdFx0XHR9XG5cdFx0fSwgMWUzKTtcblx0fSB9O1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBjcmVhdGVMb2NhdGlvbldhdGNoZXIgfTtcbiIsImltcG9ydCB7IGxvZ2dlciB9IGZyb20gXCIuL2ludGVybmFsL2xvZ2dlci5tanNcIjtcbmltcG9ydCB7IGdldFVuaXF1ZUV2ZW50TmFtZSB9IGZyb20gXCIuL2ludGVybmFsL2N1c3RvbS1ldmVudHMubWpzXCI7XG5pbXBvcnQgeyBjcmVhdGVMb2NhdGlvbldhdGNoZXIgfSBmcm9tIFwiLi9pbnRlcm5hbC9sb2NhdGlvbi13YXRjaGVyLm1qc1wiO1xuaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gXCJ3eHQvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy91dGlscy9jb250ZW50LXNjcmlwdC1jb250ZXh0LnRzXG4vKipcbiogSW1wbGVtZW50c1xuKiBbYEFib3J0Q29udHJvbGxlcmBdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9BYm9ydENvbnRyb2xsZXIpLlxuKiBVc2VkIHRvIGRldGVjdCBhbmQgc3RvcCBjb250ZW50IHNjcmlwdCBjb2RlIHdoZW4gdGhlIHNjcmlwdCBpcyBpbnZhbGlkYXRlZC5cbipcbiogSXQgYWxzbyBwcm92aWRlcyBzZXZlcmFsIHV0aWxpdGllcyBsaWtlIGBjdHguc2V0VGltZW91dGAgYW5kXG4qIGBjdHguc2V0SW50ZXJ2YWxgIHRoYXQgc2hvdWxkIGJlIHVzZWQgaW4gY29udGVudCBzY3JpcHRzIGluc3RlYWQgb2ZcbiogYHdpbmRvdy5zZXRUaW1lb3V0YCBvciBgd2luZG93LnNldEludGVydmFsYC5cbipcbiogVG8gY3JlYXRlIGNvbnRleHQgZm9yIHRlc3RpbmcsIHlvdSBjYW4gdXNlIHRoZSBjbGFzcydzIGNvbnN0cnVjdG9yOlxuKlxuKiBgYGB0c1xuKiBpbXBvcnQgeyBDb250ZW50U2NyaXB0Q29udGV4dCB9IGZyb20gJ3d4dC91dGlscy9jb250ZW50LXNjcmlwdHMtY29udGV4dCc7XG4qXG4qIHRlc3QoJ3N0b3JhZ2UgbGlzdGVuZXIgc2hvdWxkIGJlIHJlbW92ZWQgd2hlbiBjb250ZXh0IGlzIGludmFsaWRhdGVkJywgKCkgPT4ge1xuKiAgIGNvbnN0IGN0eCA9IG5ldyBDb250ZW50U2NyaXB0Q29udGV4dCgndGVzdCcpO1xuKiAgIGNvbnN0IGl0ZW0gPSBzdG9yYWdlLmRlZmluZUl0ZW0oJ2xvY2FsOmNvdW50JywgeyBkZWZhdWx0VmFsdWU6IDAgfSk7XG4qICAgY29uc3Qgd2F0Y2hlciA9IHZpLmZuKCk7XG4qXG4qICAgY29uc3QgdW53YXRjaCA9IGl0ZW0ud2F0Y2god2F0Y2hlcik7XG4qICAgY3R4Lm9uSW52YWxpZGF0ZWQodW53YXRjaCk7IC8vIExpc3RlbiBmb3IgaW52YWxpZGF0ZSBoZXJlXG4qXG4qICAgYXdhaXQgaXRlbS5zZXRWYWx1ZSgxKTtcbiogICBleHBlY3Qod2F0Y2hlcikudG9CZUNhbGxlZFRpbWVzKDEpO1xuKiAgIGV4cGVjdCh3YXRjaGVyKS50b0JlQ2FsbGVkV2l0aCgxLCAwKTtcbipcbiogICBjdHgubm90aWZ5SW52YWxpZGF0ZWQoKTsgLy8gVXNlIHRoaXMgZnVuY3Rpb24gdG8gaW52YWxpZGF0ZSB0aGUgY29udGV4dFxuKiAgIGF3YWl0IGl0ZW0uc2V0VmFsdWUoMik7XG4qICAgZXhwZWN0KHdhdGNoZXIpLnRvQmVDYWxsZWRUaW1lcygxKTtcbiogfSk7XG4qIGBgYFxuKi9cbnZhciBDb250ZW50U2NyaXB0Q29udGV4dCA9IGNsYXNzIENvbnRlbnRTY3JpcHRDb250ZXh0IHtcblx0c3RhdGljIFNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcInd4dDpjb250ZW50LXNjcmlwdC1zdGFydGVkXCIpO1xuXHRpZDtcblx0YWJvcnRDb250cm9sbGVyO1xuXHRsb2NhdGlvbldhdGNoZXIgPSBjcmVhdGVMb2NhdGlvbldhdGNoZXIodGhpcyk7XG5cdGNvbnN0cnVjdG9yKGNvbnRlbnRTY3JpcHROYW1lLCBvcHRpb25zKSB7XG5cdFx0dGhpcy5jb250ZW50U2NyaXB0TmFtZSA9IGNvbnRlbnRTY3JpcHROYW1lO1xuXHRcdHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cdFx0dGhpcy5pZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpO1xuXHRcdHRoaXMuYWJvcnRDb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuXHRcdHRoaXMuc3RvcE9sZFNjcmlwdHMoKTtcblx0XHR0aGlzLmxpc3RlbkZvck5ld2VyU2NyaXB0cygpO1xuXHR9XG5cdGdldCBzaWduYWwoKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWJvcnRDb250cm9sbGVyLnNpZ25hbDtcblx0fVxuXHRhYm9ydChyZWFzb24pIHtcblx0XHRyZXR1cm4gdGhpcy5hYm9ydENvbnRyb2xsZXIuYWJvcnQocmVhc29uKTtcblx0fVxuXHRnZXQgaXNJbnZhbGlkKCkge1xuXHRcdGlmIChicm93c2VyLnJ1bnRpbWU/LmlkID09IG51bGwpIHRoaXMubm90aWZ5SW52YWxpZGF0ZWQoKTtcblx0XHRyZXR1cm4gdGhpcy5zaWduYWwuYWJvcnRlZDtcblx0fVxuXHRnZXQgaXNWYWxpZCgpIHtcblx0XHRyZXR1cm4gIXRoaXMuaXNJbnZhbGlkO1xuXHR9XG5cdC8qKlxuXHQqIEFkZCBhIGxpc3RlbmVyIHRoYXQgaXMgY2FsbGVkIHdoZW4gdGhlIGNvbnRlbnQgc2NyaXB0J3MgY29udGV4dCBpc1xuXHQqIGludmFsaWRhdGVkLlxuXHQqXG5cdCogQGV4YW1wbGVcblx0KiAgIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoY2IpO1xuXHQqICAgY29uc3QgcmVtb3ZlSW52YWxpZGF0ZWRMaXN0ZW5lciA9IGN0eC5vbkludmFsaWRhdGVkKCgpID0+IHtcblx0KiAgICAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5yZW1vdmVMaXN0ZW5lcihjYik7XG5cdCogICB9KTtcblx0KiAgIC8vIC4uLlxuXHQqICAgcmVtb3ZlSW52YWxpZGF0ZWRMaXN0ZW5lcigpO1xuXHQqXG5cdCogQHJldHVybnMgQSBmdW5jdGlvbiB0byByZW1vdmUgdGhlIGxpc3RlbmVyLlxuXHQqL1xuXHRvbkludmFsaWRhdGVkKGNiKSB7XG5cdFx0dGhpcy5zaWduYWwuYWRkRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGNiKTtcblx0XHRyZXR1cm4gKCkgPT4gdGhpcy5zaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGNiKTtcblx0fVxuXHQvKipcblx0KiBSZXR1cm4gYSBwcm9taXNlIHRoYXQgbmV2ZXIgcmVzb2x2ZXMuIFVzZWZ1bCBpZiB5b3UgaGF2ZSBhbiBhc3luYyBmdW5jdGlvblxuXHQqIHRoYXQgc2hvdWxkbid0IHJ1biBhZnRlciB0aGUgY29udGV4dCBpcyBleHBpcmVkLlxuXHQqXG5cdCogQGV4YW1wbGVcblx0KiAgIGNvbnN0IGdldFZhbHVlRnJvbVN0b3JhZ2UgPSBhc3luYyAoKSA9PiB7XG5cdCogICAgIGlmIChjdHguaXNJbnZhbGlkKSByZXR1cm4gY3R4LmJsb2NrKCk7XG5cdCpcblx0KiAgICAgLy8gLi4uXG5cdCogICB9O1xuXHQqL1xuXHRibG9jaygpIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKCkgPT4ge30pO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cuc2V0SW50ZXJ2YWxgIHRoYXQgYXV0b21hdGljYWxseSBjbGVhcnMgdGhlIGludGVydmFsXG5cdCogd2hlbiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIEludGVydmFscyBjYW4gYmUgY2xlYXJlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYGNsZWFySW50ZXJ2YWxgIGZ1bmN0aW9uLlxuXHQqL1xuXHRzZXRJbnRlcnZhbChoYW5kbGVyLCB0aW1lb3V0KSB7XG5cdFx0Y29uc3QgaWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSBoYW5kbGVyKCk7XG5cdFx0fSwgdGltZW91dCk7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNsZWFySW50ZXJ2YWwoaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5zZXRUaW1lb3V0YCB0aGF0IGF1dG9tYXRpY2FsbHkgY2xlYXJzIHRoZSBpbnRlcnZhbFxuXHQqIHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBUaW1lb3V0cyBjYW4gYmUgY2xlYXJlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYHNldFRpbWVvdXRgIGZ1bmN0aW9uLlxuXHQqL1xuXHRzZXRUaW1lb3V0KGhhbmRsZXIsIHRpbWVvdXQpIHtcblx0XHRjb25zdCBpZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgaGFuZGxlcigpO1xuXHRcdH0sIHRpbWVvdXQpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjbGVhclRpbWVvdXQoaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHRoYXQgYXV0b21hdGljYWxseSBjYW5jZWxzXG5cdCogdGhlIHJlcXVlc3Qgd2hlbiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIENhbGxiYWNrcyBjYW4gYmUgY2FuY2VsZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBjYW5jZWxBbmltYXRpb25GcmFtZWBcblx0KiBmdW5jdGlvbi5cblx0Ki9cblx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNhbGxiYWNrKSB7XG5cdFx0Y29uc3QgaWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKC4uLmFyZ3MpID0+IHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIGNhbGxiYWNrKC4uLmFyZ3MpO1xuXHRcdH0pO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjYW5jZWxBbmltYXRpb25GcmFtZShpZCkpO1xuXHRcdHJldHVybiBpZDtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnJlcXVlc3RJZGxlQ2FsbGJhY2tgIHRoYXQgYXV0b21hdGljYWxseSBjYW5jZWxzIHRoZVxuXHQqIHJlcXVlc3Qgd2hlbiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIENhbGxiYWNrcyBjYW4gYmUgY2FuY2VsZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBjYW5jZWxJZGxlQ2FsbGJhY2tgXG5cdCogZnVuY3Rpb24uXG5cdCovXG5cdHJlcXVlc3RJZGxlQ2FsbGJhY2soY2FsbGJhY2ssIG9wdGlvbnMpIHtcblx0XHRjb25zdCBpZCA9IHJlcXVlc3RJZGxlQ2FsbGJhY2soKC4uLmFyZ3MpID0+IHtcblx0XHRcdGlmICghdGhpcy5zaWduYWwuYWJvcnRlZCkgY2FsbGJhY2soLi4uYXJncyk7XG5cdFx0fSwgb3B0aW9ucyk7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNhbmNlbElkbGVDYWxsYmFjayhpZCkpO1xuXHRcdHJldHVybiBpZDtcblx0fVxuXHRhZGRFdmVudExpc3RlbmVyKHRhcmdldCwgdHlwZSwgaGFuZGxlciwgb3B0aW9ucykge1xuXHRcdGlmICh0eXBlID09PSBcInd4dDpsb2NhdGlvbmNoYW5nZVwiKSB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSB0aGlzLmxvY2F0aW9uV2F0Y2hlci5ydW4oKTtcblx0XHR9XG5cdFx0dGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXI/Lih0eXBlLnN0YXJ0c1dpdGgoXCJ3eHQ6XCIpID8gZ2V0VW5pcXVlRXZlbnROYW1lKHR5cGUpIDogdHlwZSwgaGFuZGxlciwge1xuXHRcdFx0Li4ub3B0aW9ucyxcblx0XHRcdHNpZ25hbDogdGhpcy5zaWduYWxcblx0XHR9KTtcblx0fVxuXHQvKipcblx0KiBAaW50ZXJuYWxcblx0KiBBYm9ydCB0aGUgYWJvcnQgY29udHJvbGxlciBhbmQgZXhlY3V0ZSBhbGwgYG9uSW52YWxpZGF0ZWRgIGxpc3RlbmVycy5cblx0Ki9cblx0bm90aWZ5SW52YWxpZGF0ZWQoKSB7XG5cdFx0dGhpcy5hYm9ydChcIkNvbnRlbnQgc2NyaXB0IGNvbnRleHQgaW52YWxpZGF0ZWRcIik7XG5cdFx0bG9nZ2VyLmRlYnVnKGBDb250ZW50IHNjcmlwdCBcIiR7dGhpcy5jb250ZW50U2NyaXB0TmFtZX1cIiBjb250ZXh0IGludmFsaWRhdGVkYCk7XG5cdH1cblx0c3RvcE9sZFNjcmlwdHMoKSB7XG5cdFx0ZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLCB7IGRldGFpbDoge1xuXHRcdFx0Y29udGVudFNjcmlwdE5hbWU6IHRoaXMuY29udGVudFNjcmlwdE5hbWUsXG5cdFx0XHRtZXNzYWdlSWQ6IHRoaXMuaWRcblx0XHR9IH0pKTtcblx0XHRpZiAoIXRoaXMub3B0aW9ucz8ubm9TY3JpcHRTdGFydGVkUG9zdE1lc3NhZ2UpIHdpbmRvdy5wb3N0TWVzc2FnZSh7XG5cdFx0XHR0eXBlOiBDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsXG5cdFx0XHRjb250ZW50U2NyaXB0TmFtZTogdGhpcy5jb250ZW50U2NyaXB0TmFtZSxcblx0XHRcdG1lc3NhZ2VJZDogdGhpcy5pZFxuXHRcdH0sIFwiKlwiKTtcblx0fVxuXHR2ZXJpZnlTY3JpcHRTdGFydGVkRXZlbnQoZXZlbnQpIHtcblx0XHRjb25zdCBpc1NhbWVDb250ZW50U2NyaXB0ID0gZXZlbnQuZGV0YWlsPy5jb250ZW50U2NyaXB0TmFtZSA9PT0gdGhpcy5jb250ZW50U2NyaXB0TmFtZTtcblx0XHRjb25zdCBpc0Zyb21TZWxmID0gZXZlbnQuZGV0YWlsPy5tZXNzYWdlSWQgPT09IHRoaXMuaWQ7XG5cdFx0cmV0dXJuIGlzU2FtZUNvbnRlbnRTY3JpcHQgJiYgIWlzRnJvbVNlbGY7XG5cdH1cblx0bGlzdGVuRm9yTmV3ZXJTY3JpcHRzKCkge1xuXHRcdGNvbnN0IGNiID0gKGV2ZW50KSA9PiB7XG5cdFx0XHRpZiAoIShldmVudCBpbnN0YW5jZW9mIEN1c3RvbUV2ZW50KSB8fCAhdGhpcy52ZXJpZnlTY3JpcHRTdGFydGVkRXZlbnQoZXZlbnQpKSByZXR1cm47XG5cdFx0XHR0aGlzLm5vdGlmeUludmFsaWRhdGVkKCk7XG5cdFx0fTtcblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSwgY2IpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSwgY2IpKTtcblx0fVxufTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgQ29udGVudFNjcmlwdENvbnRleHQgfTtcbiJdLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMCwxLDIsMTQsMTUsMTYsMTddLCJtYXBwaW5ncyI6Ijs7Q0FDQSxTQUFTLG9CQUFvQixZQUFZO0VBQ3hDLE9BQU87Q0FDUjs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0VhQSxJQUFNLFVEZmlCLFdBQVcsU0FBUyxTQUFTLEtBQ2hELFdBQVcsVUFDWCxXQUFXOzs7Q0VEZixTQUFTLFFBQVEsT0FBZSxNQUFzQjtFQUdsRCxRQUZ1QixLQUFLLFlBRXBCLEdBQVI7R0FDSSxLQUFLLE1BQ0QsT0FBTyxLQUFLLE1BQU0sUUFBUSxJQUFJO0dBRWxDLEtBQUssTUFDRCxPQUFPLEtBQUssTUFBTSxRQUFRLE9BQU8sSUFBSTtHQUV6QyxLQUFLLE1BQ0QsT0FBTyxLQUFLLE1BQU0sUUFBUSxPQUFPLE9BQU8sSUFBSTtHQUVoRCxTQUNJLE9BQU8sS0FBSyxNQUFNLEtBQUs7RUFDL0I7Q0FDSjtDQUVBLFNBQWdCLGNBQWMsTUFBaUM7RUFDM0QsTUFBTSxTQUE0QixDQUFDO0VBRW5DLE1BQU0saUJBQWlCLEtBQ2xCLFFBQVEsUUFBUSxHQUFHLENBQUMsQ0FDcEIsS0FBSztFQWlCVixLQUFLLE1BQU0sV0FBVyxDQUxsQixnRkFFQSw2RUFHa0IsR0FBZTtHQUNqQyxNQUFNLFFBQVEsZUFBZSxNQUFNLE9BQU87R0FFMUMsSUFBSSxPQUFPO0lBQ1AsTUFBTSxXQUFXLE1BQU07SUFDdkIsTUFBTSxVQUFVLE1BQU07SUFDdEIsTUFBTSxXQUFXLE1BQU07SUFDdkIsTUFBTSxVQUFVLE1BQU07SUFFdEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLFNBQ3ZDO0lBR0osT0FBTyxXQUFX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