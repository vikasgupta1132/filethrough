(function() {
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_ji_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/define-content-script.mjs
	function defineContentScript(definition) {
		return definition;
	}
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
		if (constraints.maxBytes !== void 0 && file.sizeBytes > constraints.maxBytes) plan.compress = { maxBytes: constraints.maxBytes };
		return plan;
	}
	function chooseTargetFormat(allowedFormats) {
		const normalized = allowedFormats.map((format) => format.toLowerCase());
		if (normalized.includes("jpeg")) return "jpeg";
		if (normalized.includes("jpg")) return "jpeg";
		if (normalized.includes("png")) return "png";
		if (normalized.includes("webp")) return "webp";
	}
	//#endregion
	//#region core/transformer/transformImage.ts
	async function transformImage(file, plan) {
		if (!file.type.startsWith("image/")) throw new Error(`Cannot transform non-image file: ${file.type}`);
		const image = await loadImage(file);
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
		const blob = await canvasToBlob(canvas, outputType);
		const extension = getExtensionForMimeType(outputType);
		const outputName = replaceExtension(file.name, extension);
		return new File([blob], outputName, {
			type: outputType,
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
	function canvasToBlob(canvas, type) {
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
				input.addEventListener("change", async () => {
					const file = input.files?.[0];
					if (!file) return;
					try {
						const fileInfo = await inspectFile(file);
						console.log("[FileThrough] Selected file", fileInfo);
						const validation = validateFile(fileInfo, constraints);
						console.log("[FileThrough] Validation result", validation);
						const plan = createTransformationPlan(fileInfo, constraints);
						console.log("[FileThrough] Transformation plan", plan);
						if (Object.keys(plan).length > 0) try {
							const transformedInfo = await inspectFile(await transformImage(file, plan));
							console.log("[FileThrough] Transformed file", transformedInfo);
						} catch (error) {
							console.error("[FileThrough] Transformation failed", error);
						}
					} catch (error) {
						console.error("[FileThrough] Could not inspect file", error);
					}
				});
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm5hbWVzIjpbInByaW50IiwibG9nZ2VyIiwiYnJvd3NlciJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfamlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1jb250ZW50LXNjcmlwdC5tanMiLCIuLi8uLi8uLi9jb3JlL3BhcnNlci9wYXJzZUZpbGVTaXplLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VGb3JtYXRzLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VEaW1lbnNpb25zLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VDb25zdHJhaW50cy50cyIsIi4uLy4uLy4uL2NvcmUvZGV0ZWN0b3IvZXh0cmFjdFVwbG9hZENvbnRleHQudHMiLCIuLi8uLi8uLi9jb3JlL2luc3BlY3Rvci9pbnNwZWN0RmlsZS50cyIsIi4uLy4uLy4uL2NvcmUvdmFsaWRhdG9yL3ZhbGlkYXRlRmlsZS50cyIsIi4uLy4uLy4uL2NvcmUvcGxhbm5lci9jcmVhdGVUcmFuc2Zvcm1hdGlvblBsYW4udHMiLCIuLi8uLi8uLi9jb3JlL3RyYW5zZm9ybWVyL3RyYW5zZm9ybUltYWdlLnRzIiwiLi4vLi4vLi4vZW50cnlwb2ludHMvY29udGVudC50cyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfamlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2xvZ2dlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vQHd4dC1kZXYrYnJvd3NlckAwLjIuNS9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIxLjNfZXNsaW50QDkuMzkuNF9qaV80OGI2MjkwNDU4MGY1MTI3Mzc3NmIwNDMwYzI4OWIwNC9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjEuM19lc2xpbnRAOS4zOS40X2ppXzQ4YjYyOTA0NTgwZjUxMjczNzc2YjA0MzBjMjg5YjA0L25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9pbnRlcm5hbC9jdXN0b20tZXZlbnRzLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfamlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2xvY2F0aW9uLXdhdGNoZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIxLjNfZXNsaW50QDkuMzkuNF9qaV80OGI2MjkwNDU4MGY1MTI3Mzc3NmIwNDMwYzI4OWIwNC9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvY29udGVudC1zY3JpcHQtY29udGV4dC5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8jcmVnaW9uIHNyYy91dGlscy9kZWZpbmUtY29udGVudC1zY3JpcHQudHNcbmZ1bmN0aW9uIGRlZmluZUNvbnRlbnRTY3JpcHQoZGVmaW5pdGlvbikge1xuXHRyZXR1cm4gZGVmaW5pdGlvbjtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgZGVmaW5lQ29udGVudFNjcmlwdCB9O1xuIiwiaW1wb3J0IHR5cGUgeyBVcGxvYWRDb25zdHJhaW50cyB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuZnVuY3Rpb24gdG9CeXRlcyh2YWx1ZTogbnVtYmVyLCB1bml0OiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgY29uc3Qgbm9ybWFsaXplZFVuaXQgPSB1bml0LnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgc3dpdGNoIChub3JtYWxpemVkVW5pdCkge1xyXG4gICAgICAgIGNhc2UgJ2tiJzpcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgKiAxMDI0KTtcclxuXHJcbiAgICAgICAgY2FzZSAnbWInOlxyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSAqIDEwMjQgKiAxMDI0KTtcclxuXHJcbiAgICAgICAgY2FzZSAnZ2InOlxyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSAqIDEwMjQgKiAxMDI0ICogMTAyNCk7XHJcblxyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRmlsZVNpemUodGV4dDogc3RyaW5nKTogVXBsb2FkQ29uc3RyYWludHMge1xyXG4gICAgY29uc3QgcmVzdWx0OiBVcGxvYWRDb25zdHJhaW50cyA9IHt9O1xyXG5cclxuICAgIGNvbnN0IG5vcm1hbGl6ZWRUZXh0ID0gdGV4dFxyXG4gICAgICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJylcclxuICAgICAgICAudHJpbSgpO1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyAxLiBSQU5HRSBQQVRURVJOU1xyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAvLyBFeGFtcGxlczpcclxuICAgIC8vIDIwIEtCIHRvIDEwMCBLQlxyXG4gICAgLy8gMjBLQiAtIDEwMEtCXHJcbiAgICAvLyBCZXR3ZWVuIDUwIEtCIGFuZCAyMDAgS0JcclxuXHJcbiAgICBjb25zdCByYW5nZVBhdHRlcm5zID0gW1xyXG4gICAgICAgIC9iZXR3ZWVuXFxzKyhcXGQrKD86XFwuXFxkKyk/KVxccyooa2J8bWJ8Z2IpXFxzK2FuZFxccysoXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKS9pLFxyXG5cclxuICAgICAgICAvKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYilcXHMqKD86dG98LXzigJN84oCUKVxccyooXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKS9pLFxyXG4gICAgXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcmFuZ2VQYXR0ZXJucykge1xyXG4gICAgICAgIGNvbnN0IG1hdGNoID0gbm9ybWFsaXplZFRleHQubWF0Y2gocGF0dGVybik7XHJcblxyXG4gICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICBjb25zdCBtaW5WYWx1ZSA9IG1hdGNoWzFdO1xyXG4gICAgICAgICAgICBjb25zdCBtaW5Vbml0ID0gbWF0Y2hbMl07XHJcbiAgICAgICAgICAgIGNvbnN0IG1heFZhbHVlID0gbWF0Y2hbM107XHJcbiAgICAgICAgICAgIGNvbnN0IG1heFVuaXQgPSBtYXRjaFs0XTtcclxuXHJcbiAgICAgICAgICAgIGlmICghbWluVmFsdWUgfHwgIW1pblVuaXQgfHwgIW1heFZhbHVlIHx8ICFtYXhVbml0KSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmVzdWx0Lm1pbkJ5dGVzID0gdG9CeXRlcyhcclxuICAgICAgICAgICAgICAgIE51bWJlci5wYXJzZUZsb2F0KG1pblZhbHVlKSxcclxuICAgICAgICAgICAgICAgIG1pblVuaXRcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIHJlc3VsdC5tYXhCeXRlcyA9IHRvQnl0ZXMoXHJcbiAgICAgICAgICAgICAgICBOdW1iZXIucGFyc2VGbG9hdChtYXhWYWx1ZSksXHJcbiAgICAgICAgICAgICAgICBtYXhVbml0XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gMi4gTUFYSU1VTSBQQVRURVJOU1xyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAvLyBFeGFtcGxlczpcclxuICAgIC8vIE1heGltdW0gZmlsZSBzaXplOiAyMDAgS0JcclxuICAgIC8vIE1heCBzaXplIDIgTUJcclxuICAgIC8vIEZpbGUgc2l6ZSBzaG91bGQgbm90IGV4Y2VlZCA1MDAgS0JcclxuICAgIC8vIEZpbGUgbXVzdCBiZSB1bmRlciAzMDAgS0JcclxuICAgIC8vIExlc3MgdGhhbiAxIE1CXHJcblxyXG4gICAgY29uc3QgbWF4UGF0dGVybnMgPSBbXHJcbiAgICAgICAgLyg/Om1heGltdW18bWF4KVxccysoPzpmaWxlXFxzKyk/c2l6ZVxccyo6P1xccyooXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKS9pLFxyXG5cclxuICAgICAgICAvKD86ZmlsZVxccyspP3NpemVcXHMrKD86c2hvdWxkXFxzKyk/bm90XFxzK2V4Y2VlZFxccysoXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKS9pLFxyXG5cclxuICAgICAgICAvKD86ZmlsZVxccyspPyg/Om11c3RcXHMrYmVcXHMrKT91bmRlclxccysoXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKS9pLFxyXG5cclxuICAgICAgICAvbGVzc1xccyt0aGFuXFxzKyhcXGQrKD86XFwuXFxkKyk/KVxccyooa2J8bWJ8Z2IpL2ksXHJcbiAgICBdO1xyXG5cclxuICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBtYXhQYXR0ZXJucykge1xyXG4gICAgICAgIGNvbnN0IG1hdGNoID0gbm9ybWFsaXplZFRleHQubWF0Y2gocGF0dGVybik7XHJcblxyXG5cclxuICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBtYXRjaFsxXTtcclxuICAgICAgICAgICAgY29uc3QgdW5pdCA9IG1hdGNoWzJdO1xyXG5cclxuICAgICAgICAgICAgaWYgKCF2YWx1ZSB8fCAhdW5pdCkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJlc3VsdC5tYXhCeXRlcyA9IHRvQnl0ZXMoXHJcbiAgICAgICAgICAgICAgICBOdW1iZXIucGFyc2VGbG9hdCh2YWx1ZSksXHJcbiAgICAgICAgICAgICAgICB1bml0XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59IiwiaW1wb3J0IHR5cGUgeyBVcGxvYWRDb250ZXh0IH0gZnJvbSAnLi4vZGV0ZWN0b3IvZXh0cmFjdFVwbG9hZENvbnRleHQnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRm9ybWF0cyhcclxuICAgIGNvbnRleHQ6IFVwbG9hZENvbnRleHRcclxuKTogc3RyaW5nW10ge1xyXG4gICAgY29uc3QgZm9ybWF0cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xyXG5cclxuICAgIC8vIEhpZ2hlc3QtY29uZmlkZW5jZSBzb3VyY2U6IEhUTUwgYWNjZXB0IGF0dHJpYnV0ZVxyXG4gICAgaWYgKGNvbnRleHQuYWNjZXB0KSB7XHJcbiAgICAgICAgY29uc3QgYWNjZXB0UGFydHMgPSBjb250ZXh0LmFjY2VwdC5zcGxpdCgnLCcpO1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IHBhcnQgb2YgYWNjZXB0UGFydHMpIHtcclxuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBwYXJ0LnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlLnN0YXJ0c1dpdGgoJy4nKSkge1xyXG4gICAgICAgICAgICAgICAgZm9ybWF0cy5hZGQodmFsdWUuc2xpY2UoMSkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09ICdpbWFnZS9qcGVnJykge1xyXG4gICAgICAgICAgICAgICAgZm9ybWF0cy5hZGQoJ2pwZycpO1xyXG4gICAgICAgICAgICAgICAgZm9ybWF0cy5hZGQoJ2pwZWcnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnaW1hZ2UvcG5nJykge1xyXG4gICAgICAgICAgICAgICAgZm9ybWF0cy5hZGQoJ3BuZycpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09ICdpbWFnZS93ZWJwJykge1xyXG4gICAgICAgICAgICAgICAgZm9ybWF0cy5hZGQoJ3dlYnAnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnYXBwbGljYXRpb24vcGRmJykge1xyXG4gICAgICAgICAgICAgICAgZm9ybWF0cy5hZGQoJ3BkZicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFNlY29uZCBzb3VyY2U6IG5lYXJieSBpbnN0cnVjdGlvbnNcclxuICAgIGNvbnN0IHRleHQgPSBjb250ZXh0Lm5lYXJieVRleHQudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICBjb25zdCBrbm93bkZvcm1hdHMgPSBbXHJcbiAgICAgICAgJ2pwZycsXHJcbiAgICAgICAgJ2pwZWcnLFxyXG4gICAgICAgICdwbmcnLFxyXG4gICAgICAgICd3ZWJwJyxcclxuICAgICAgICAncGRmJyxcclxuICAgIF07XHJcblxyXG4gICAgZm9yIChjb25zdCBmb3JtYXQgb2Yga25vd25Gb3JtYXRzKSB7XHJcbiAgICAgICAgY29uc3QgcGF0dGVybiA9IG5ldyBSZWdFeHAoXHJcbiAgICAgICAgICAgIGBcXFxcYiR7Zm9ybWF0fVxcXFxiYCxcclxuICAgICAgICAgICAgJ2knXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKHBhdHRlcm4udGVzdCh0ZXh0KSkge1xyXG4gICAgICAgICAgICBmb3JtYXRzLmFkZChmb3JtYXQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gQXJyYXkuZnJvbShmb3JtYXRzKTtcclxufSIsImltcG9ydCB0eXBlIHsgVXBsb2FkQ29uc3RyYWludHMgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZURpbWVuc2lvbnMoXHJcbiAgICB0ZXh0OiBzdHJpbmdcclxuKTogVXBsb2FkQ29uc3RyYWludHNbJ2RpbWVuc2lvbnMnXSB8IHVuZGVmaW5lZCB7XHJcblxyXG4gICAgY29uc3Qgbm9ybWFsaXplZFRleHQgPSB0ZXh0XHJcbiAgICAgICAgLnJlcGxhY2UoL1xccysvZywgJyAnKVxyXG4gICAgICAgIC50cmltKCk7XHJcblxyXG4gICAgLy8gRXhhbXBsZXM6XHJcbiAgICAvLyBEaW1lbnNpb25zOiAyMDAgeCAyMzAgcGl4ZWxzXHJcbiAgICAvLyAyMDB4MjMwIHB4XHJcbiAgICAvLyAyMDAgw5cgMjMwIHBpeGVsc1xyXG4gICAgLy8gSW1hZ2Ugc2l6ZTogMjAwIFggMjMwXHJcblxyXG4gICAgY29uc3QgcGF0dGVybnMgPSBbXHJcbiAgICAgICAgLyg/OmRpbWVuc2lvbnM/fGltYWdlXFxzK2RpbWVuc2lvbnM/fGltYWdlXFxzK3NpemUpXFxzKjo/XFxzKihcXGQrKVxccypbeMOXXVxccyooXFxkKylcXHMqKD86cHh8cGl4ZWxzPyk/L2ksXHJcblxyXG4gICAgICAgIC8oXFxkKylcXHMqW3jDl11cXHMqKFxcZCspXFxzKig/OnB4fHBpeGVscz8pL2ksXHJcbiAgICBdO1xyXG5cclxuICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBwYXR0ZXJucykge1xyXG4gICAgICAgIGNvbnN0IG1hdGNoID0gbm9ybWFsaXplZFRleHQubWF0Y2gocGF0dGVybik7XHJcblxyXG4gICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICBjb25zdCB3aWR0aCA9IG1hdGNoWzFdO1xyXG4gICAgICAgICAgICBjb25zdCBoZWlnaHQgPSBtYXRjaFsyXTtcclxuXHJcbiAgICAgICAgICAgIGlmICghd2lkdGggfHwgIWhlaWdodCkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB3aWR0aDogTnVtYmVyLnBhcnNlSW50KHdpZHRoLCAxMCksXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IE51bWJlci5wYXJzZUludChoZWlnaHQsIDEwKSxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxufSIsImltcG9ydCB0eXBlIHsgVXBsb2FkQ29udGV4dCB9IGZyb20gJy4uL2RldGVjdG9yL2V4dHJhY3RVcGxvYWRDb250ZXh0JztcclxuaW1wb3J0IHR5cGUgeyBVcGxvYWRDb25zdHJhaW50cyB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuaW1wb3J0IHsgcGFyc2VGaWxlU2l6ZSB9IGZyb20gJy4vcGFyc2VGaWxlU2l6ZSc7XHJcbmltcG9ydCB7IHBhcnNlRm9ybWF0cyB9IGZyb20gJy4vcGFyc2VGb3JtYXRzJztcclxuaW1wb3J0IHsgcGFyc2VEaW1lbnNpb25zIH0gZnJvbSAnLi9wYXJzZURpbWVuc2lvbnMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ29uc3RyYWludHMoXHJcbiAgICBjb250ZXh0OiBVcGxvYWRDb250ZXh0XHJcbik6IFVwbG9hZENvbnN0cmFpbnRzIHtcclxuICAgIGNvbnN0IHNpemVDb25zdHJhaW50cyA9IHBhcnNlRmlsZVNpemUoY29udGV4dC5uZWFyYnlUZXh0KTtcclxuICAgIGNvbnN0IGFsbG93ZWRGb3JtYXRzID0gcGFyc2VGb3JtYXRzKGNvbnRleHQpO1xyXG4gICAgY29uc3QgZGltZW5zaW9ucyA9IHBhcnNlRGltZW5zaW9ucyhjb250ZXh0Lm5lYXJieVRleHQpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgLi4uc2l6ZUNvbnN0cmFpbnRzLFxyXG5cclxuICAgICAgICAuLi4oYWxsb3dlZEZvcm1hdHMubGVuZ3RoID4gMCAmJiB7XHJcbiAgICAgICAgICAgIGFsbG93ZWRGb3JtYXRzLFxyXG4gICAgICAgIH0pLFxyXG5cclxuICAgICAgICAuLi4oZGltZW5zaW9ucyAmJiB7XHJcbiAgICAgICAgICAgIGRpbWVuc2lvbnMsXHJcbiAgICAgICAgfSksXHJcbiAgICB9O1xyXG59IiwiZXhwb3J0IGludGVyZmFjZSBVcGxvYWRDb250ZXh0IHtcclxuICAgIGxhYmVsOiBzdHJpbmcgfCBudWxsO1xyXG4gICAgbmVhcmJ5VGV4dDogc3RyaW5nO1xyXG4gICAgYWNjZXB0OiBzdHJpbmcgfCBudWxsO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFVwbG9hZENvbnRleHQoXHJcbiAgICBpbnB1dDogSFRNTElucHV0RWxlbWVudFxyXG4pOiBVcGxvYWRDb250ZXh0IHtcclxuICAgIGxldCBsYWJlbDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XHJcblxyXG4gICAgLy8gRmluZCA8bGFiZWwgZm9yPVwiaW5wdXQtaWRcIj5cclxuICAgIGlmIChpbnB1dC5pZCkge1xyXG4gICAgICAgIGNvbnN0IGxhYmVsRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTExhYmVsRWxlbWVudD4oXHJcbiAgICAgICAgICAgIGBsYWJlbFtmb3I9XCIke0NTUy5lc2NhcGUoaW5wdXQuaWQpfVwiXWBcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBsYWJlbCA9IGxhYmVsRWxlbWVudD8udGV4dENvbnRlbnQ/LnRyaW0oKSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEhhbmRsZSBpbnB1dHMgd3JhcHBlZCBpbnNpZGUgPGxhYmVsPlxyXG4gICAgaWYgKCFsYWJlbCkge1xyXG4gICAgICAgIGNvbnN0IHBhcmVudExhYmVsID0gaW5wdXQuY2xvc2VzdCgnbGFiZWwnKTtcclxuXHJcbiAgICAgICAgbGFiZWwgPSBwYXJlbnRMYWJlbD8udGV4dENvbnRlbnQ/LnRyaW0oKSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZvciBub3csIGluc3BlY3QgdGhlIGlucHV0J3MgcGFyZW50IGNvbnRhaW5lci5cclxuICAgIGNvbnN0IHBhcmVudCA9IGlucHV0LnBhcmVudEVsZW1lbnQ7XHJcblxyXG4gICAgY29uc3QgbmVhcmJ5VGV4dCA9XHJcbiAgICAgICAgcGFyZW50Py5pbm5lclRleHRcclxuICAgICAgICAgICAgPy5yZXBsYWNlKC9cXHMrL2csICcgJylcclxuICAgICAgICAgICAgLnRyaW0oKSB8fCAnJztcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGxhYmVsLFxyXG4gICAgICAgIG5lYXJieVRleHQsXHJcbiAgICAgICAgYWNjZXB0OiBpbnB1dC5nZXRBdHRyaWJ1dGUoJ2FjY2VwdCcpLFxyXG4gICAgfTtcclxufSIsImV4cG9ydCBpbnRlcmZhY2UgRmlsZUluZm8ge1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgbWltZVR5cGU6IHN0cmluZztcclxuICAgIHNpemVCeXRlczogbnVtYmVyO1xyXG4gICAgZXh0ZW5zaW9uOiBzdHJpbmc7XHJcbiAgICB3aWR0aD86IG51bWJlcjtcclxuICAgIGhlaWdodD86IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3BlY3RGaWxlKGZpbGU6IEZpbGUpOiBQcm9taXNlPEZpbGVJbmZvPiB7XHJcbiAgICBjb25zdCBleHRlbnNpb24gPSBnZXRFeHRlbnNpb24oZmlsZS5uYW1lKTtcclxuXHJcbiAgICBjb25zdCBpbmZvOiBGaWxlSW5mbyA9IHtcclxuICAgICAgICBuYW1lOiBmaWxlLm5hbWUsXHJcbiAgICAgICAgbWltZVR5cGU6IGZpbGUudHlwZSxcclxuICAgICAgICBzaXplQnl0ZXM6IGZpbGUuc2l6ZSxcclxuICAgICAgICBleHRlbnNpb24sXHJcbiAgICB9O1xyXG5cclxuICAgIGlmIChmaWxlLnR5cGUuc3RhcnRzV2l0aCgnaW1hZ2UvJykpIHtcclxuICAgICAgICBjb25zdCBkaW1lbnNpb25zID0gYXdhaXQgZ2V0SW1hZ2VEaW1lbnNpb25zKGZpbGUpO1xyXG5cclxuICAgICAgICBpbmZvLndpZHRoID0gZGltZW5zaW9ucy53aWR0aDtcclxuICAgICAgICBpbmZvLmhlaWdodCA9IGRpbWVuc2lvbnMuaGVpZ2h0O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBpbmZvO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRFeHRlbnNpb24oZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBsYXN0RG90ID0gZmlsZU5hbWUubGFzdEluZGV4T2YoJy4nKTtcclxuXHJcbiAgICBpZiAobGFzdERvdCA9PT0gLTEpIHtcclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZpbGVOYW1lXHJcbiAgICAgICAgLnNsaWNlKGxhc3REb3QgKyAxKVxyXG4gICAgICAgIC50b0xvd2VyQ2FzZSgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRJbWFnZURpbWVuc2lvbnMoXHJcbiAgICBmaWxlOiBGaWxlXHJcbik6IFByb21pc2U8eyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9PiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoZmlsZSk7XHJcbiAgICAgICAgY29uc3QgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuXHJcbiAgICAgICAgaW1hZ2Uub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgIHdpZHRoOiBpbWFnZS5uYXR1cmFsV2lkdGgsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGltYWdlLm5hdHVyYWxIZWlnaHQsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGltYWdlLm9uZXJyb3IgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcclxuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignVW5hYmxlIHRvIHJlYWQgaW1hZ2UgZGltZW5zaW9ucy4nKSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaW1hZ2Uuc3JjID0gdXJsO1xyXG4gICAgfSk7XHJcbn0iLCJpbXBvcnQgdHlwZSB7IFVwbG9hZENvbnN0cmFpbnRzIH0gZnJvbSAnLi4vcGFyc2VyL3R5cGVzJztcclxuaW1wb3J0IHR5cGUgeyBGaWxlSW5mbyB9IGZyb20gJy4uL2luc3BlY3Rvci9pbnNwZWN0RmlsZSc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFZhbGlkYXRpb25Jc3N1ZSB7XHJcbiAgICB0eXBlOiAnZm9ybWF0JyB8ICdzaXplLXRvby1sYXJnZScgfCAnc2l6ZS10b28tc21hbGwnIHwgJ2RpbWVuc2lvbnMnO1xyXG4gICAgbWVzc2FnZTogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFZhbGlkYXRpb25SZXN1bHQge1xyXG4gICAgaXNWYWxpZDogYm9vbGVhbjtcclxuICAgIGlzc3VlczogVmFsaWRhdGlvbklzc3VlW107XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUZpbGUoXHJcbiAgICBmaWxlOiBGaWxlSW5mbyxcclxuICAgIGNvbnN0cmFpbnRzOiBVcGxvYWRDb25zdHJhaW50c1xyXG4pOiBWYWxpZGF0aW9uUmVzdWx0IHtcclxuICAgIGNvbnN0IGlzc3VlczogVmFsaWRhdGlvbklzc3VlW10gPSBbXTtcclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBGb3JtYXRcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBpZiAoXHJcbiAgICAgICAgY29uc3RyYWludHMuYWxsb3dlZEZvcm1hdHMgJiZcclxuICAgICAgICBjb25zdHJhaW50cy5hbGxvd2VkRm9ybWF0cy5sZW5ndGggPiAwXHJcbiAgICApIHtcclxuICAgICAgICBjb25zdCBmaWxlRm9ybWF0ID0gZmlsZS5leHRlbnNpb24udG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgY29uc3QgYWxsb3dlZCA9IGNvbnN0cmFpbnRzLmFsbG93ZWRGb3JtYXRzLnNvbWUoXHJcbiAgICAgICAgICAgIChmb3JtYXQpID0+IGZvcm1hdC50b0xvd2VyQ2FzZSgpID09PSBmaWxlRm9ybWF0XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKCFhbGxvd2VkKSB7XHJcbiAgICAgICAgICAgIGlzc3Vlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdmb3JtYXQnLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYEZpbGUgZm9ybWF0IFwiJHtmaWxlRm9ybWF0fVwiIGlzIG5vdCBhbGxvd2VkLmAsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBNYXhpbXVtIGZpbGUgc2l6ZVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGlmIChcclxuICAgICAgICBjb25zdHJhaW50cy5tYXhCeXRlcyAhPT0gdW5kZWZpbmVkICYmXHJcbiAgICAgICAgZmlsZS5zaXplQnl0ZXMgPiBjb25zdHJhaW50cy5tYXhCeXRlc1xyXG4gICAgKSB7XHJcbiAgICAgICAgaXNzdWVzLnB1c2goe1xyXG4gICAgICAgICAgICB0eXBlOiAnc2l6ZS10b28tbGFyZ2UnLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBgRmlsZSBpcyB0b28gbGFyZ2UuIE1heGltdW0gYWxsb3dlZCBzaXplIGlzICR7Zm9ybWF0Qnl0ZXMoXHJcbiAgICAgICAgICAgICAgICBjb25zdHJhaW50cy5tYXhCeXRlc1xyXG4gICAgICAgICAgICApfS5gLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIE1pbmltdW0gZmlsZSBzaXplXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaWYgKFxyXG4gICAgICAgIGNvbnN0cmFpbnRzLm1pbkJ5dGVzICE9PSB1bmRlZmluZWQgJiZcclxuICAgICAgICBmaWxlLnNpemVCeXRlcyA8IGNvbnN0cmFpbnRzLm1pbkJ5dGVzXHJcbiAgICApIHtcclxuICAgICAgICBpc3N1ZXMucHVzaCh7XHJcbiAgICAgICAgICAgIHR5cGU6ICdzaXplLXRvby1zbWFsbCcsXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBGaWxlIGlzIHRvbyBzbWFsbC4gTWluaW11bSByZXF1aXJlZCBzaXplIGlzICR7Zm9ybWF0Qnl0ZXMoXHJcbiAgICAgICAgICAgICAgICBjb25zdHJhaW50cy5taW5CeXRlc1xyXG4gICAgICAgICAgICApfS5gLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIERpbWVuc2lvbnNcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBpZiAoY29uc3RyYWludHMuZGltZW5zaW9ucykge1xyXG4gICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gY29uc3RyYWludHMuZGltZW5zaW9ucztcclxuXHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICBmaWxlLndpZHRoICE9PSB3aWR0aCB8fFxyXG4gICAgICAgICAgICBmaWxlLmhlaWdodCAhPT0gaGVpZ2h0XHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIGlzc3Vlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdkaW1lbnNpb25zJyxcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBJbWFnZSBkaW1lbnNpb25zIG11c3QgYmUgJHt3aWR0aH0gw5cgJHtoZWlnaHR9cHguYCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaXNWYWxpZDogaXNzdWVzLmxlbmd0aCA9PT0gMCxcclxuICAgICAgICBpc3N1ZXMsXHJcbiAgICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBmb3JtYXRCeXRlcyhieXRlczogbnVtYmVyKTogc3RyaW5nIHtcclxuICAgIGlmIChieXRlcyA8IDEwMjQpIHtcclxuICAgICAgICByZXR1cm4gYCR7Ynl0ZXN9IEJgO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChieXRlcyA8IDEwMjQgKiAxMDI0KSB7XHJcbiAgICAgICAgcmV0dXJuIGAke01hdGgucm91bmQoYnl0ZXMgLyAxMDI0KX0gS0JgO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBgJHsoYnl0ZXMgLyAoMTAyNCAqIDEwMjQpKS50b0ZpeGVkKDIpfSBNQmA7XHJcbn0iLCJpbXBvcnQgdHlwZSB7IFVwbG9hZENvbnN0cmFpbnRzIH0gZnJvbSAnLi4vcGFyc2VyL3R5cGVzJztcclxuaW1wb3J0IHR5cGUgeyBGaWxlSW5mbyB9IGZyb20gJy4uL2luc3BlY3Rvci9pbnNwZWN0RmlsZSc7XHJcbmltcG9ydCB0eXBlIHsgVHJhbnNmb3JtYXRpb25QbGFuIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHJhbnNmb3JtYXRpb25QbGFuKFxyXG4gICAgZmlsZTogRmlsZUluZm8sXHJcbiAgICBjb25zdHJhaW50czogVXBsb2FkQ29uc3RyYWludHNcclxuKTogVHJhbnNmb3JtYXRpb25QbGFuIHtcclxuICAgIGNvbnN0IHBsYW46IFRyYW5zZm9ybWF0aW9uUGxhbiA9IHt9O1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIEZvcm1hdCBjb252ZXJzaW9uXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaWYgKFxyXG4gICAgICAgIGNvbnN0cmFpbnRzLmFsbG93ZWRGb3JtYXRzICYmXHJcbiAgICAgICAgY29uc3RyYWludHMuYWxsb3dlZEZvcm1hdHMubGVuZ3RoID4gMFxyXG4gICAgKSB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudEZvcm1hdCA9IGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGZvcm1hdEFsbG93ZWQgPVxyXG4gICAgICAgICAgICBjb25zdHJhaW50cy5hbGxvd2VkRm9ybWF0cy5pbmNsdWRlcyhjdXJyZW50Rm9ybWF0KTtcclxuXHJcbiAgICAgICAgaWYgKCFmb3JtYXRBbGxvd2VkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEZvcm1hdCA9IGNob29zZVRhcmdldEZvcm1hdChcclxuICAgICAgICAgICAgICAgIGNvbnN0cmFpbnRzLmFsbG93ZWRGb3JtYXRzXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGFyZ2V0Rm9ybWF0KSB7XHJcbiAgICAgICAgICAgICAgICBwbGFuLmNvbnZlcnRUbyA9IHRhcmdldEZvcm1hdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBEaW1lbnNpb25zXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgaWYgKGNvbnN0cmFpbnRzLmRpbWVuc2lvbnMpIHtcclxuICAgICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IGNvbnN0cmFpbnRzLmRpbWVuc2lvbnM7XHJcblxyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgICAgZmlsZS53aWR0aCAhPT0gd2lkdGggfHxcclxuICAgICAgICAgICAgZmlsZS5oZWlnaHQgIT09IGhlaWdodFxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICBwbGFuLnJlc2l6ZSA9IHtcclxuICAgICAgICAgICAgICAgIHdpZHRoLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0LFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBGaWxlIHNpemVcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBpZiAoXHJcbiAgICAgICAgY29uc3RyYWludHMubWF4Qnl0ZXMgIT09IHVuZGVmaW5lZCAmJlxyXG4gICAgICAgIGZpbGUuc2l6ZUJ5dGVzID4gY29uc3RyYWludHMubWF4Qnl0ZXNcclxuICAgICkge1xyXG4gICAgICAgIHBsYW4uY29tcHJlc3MgPSB7XHJcbiAgICAgICAgICAgIG1heEJ5dGVzOiBjb25zdHJhaW50cy5tYXhCeXRlcyxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBwbGFuO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjaG9vc2VUYXJnZXRGb3JtYXQoXHJcbiAgICBhbGxvd2VkRm9ybWF0czogc3RyaW5nW11cclxuKTogVHJhbnNmb3JtYXRpb25QbGFuWydjb252ZXJ0VG8nXSB7XHJcbiAgICBjb25zdCBub3JtYWxpemVkID0gYWxsb3dlZEZvcm1hdHMubWFwKChmb3JtYXQpID0+XHJcbiAgICAgICAgZm9ybWF0LnRvTG93ZXJDYXNlKClcclxuICAgICk7XHJcblxyXG4gICAgaWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoJ2pwZWcnKSkge1xyXG4gICAgICAgIHJldHVybiAnanBlZyc7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoJ2pwZycpKSB7XHJcbiAgICAgICAgcmV0dXJuICdqcGVnJztcclxuICAgIH1cclxuXHJcbiAgICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcygncG5nJykpIHtcclxuICAgICAgICByZXR1cm4gJ3BuZyc7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoJ3dlYnAnKSkge1xyXG4gICAgICAgIHJldHVybiAnd2VicCc7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxufSIsImltcG9ydCB0eXBlIHsgVHJhbnNmb3JtYXRpb25QbGFuIH0gZnJvbSAnLi4vcGxhbm5lci90eXBlcyc7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdHJhbnNmb3JtSW1hZ2UoXHJcbiAgICBmaWxlOiBGaWxlLFxyXG4gICAgcGxhbjogVHJhbnNmb3JtYXRpb25QbGFuXHJcbik6IFByb21pc2U8RmlsZT4ge1xyXG4gICAgaWYgKCFmaWxlLnR5cGUuc3RhcnRzV2l0aCgnaW1hZ2UvJykpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgICAgIGBDYW5ub3QgdHJhbnNmb3JtIG5vbi1pbWFnZSBmaWxlOiAke2ZpbGUudHlwZX1gXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBpbWFnZSA9IGF3YWl0IGxvYWRJbWFnZShmaWxlKTtcclxuXHJcbiAgICBjb25zdCB3aWR0aCA9XHJcbiAgICAgICAgcGxhbi5yZXNpemU/LndpZHRoID8/IGltYWdlLm5hdHVyYWxXaWR0aDtcclxuXHJcbiAgICBjb25zdCBoZWlnaHQgPVxyXG4gICAgICAgIHBsYW4ucmVzaXplPy5oZWlnaHQgPz8gaW1hZ2UubmF0dXJhbEhlaWdodDtcclxuXHJcbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuXHJcbiAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcclxuICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcblxyXG4gICAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICAgIGlmICghY29udGV4dCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGNyZWF0ZSBjYW52YXMgY29udGV4dC4nKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBQcmV2ZW50IHRyYW5zcGFyZW50IFBORyBiYWNrZ3JvdW5kcyBmcm9tIGJlY29taW5nIGJsYWNrXHJcbiAgICAvLyB3aGVuIGNvbnZlcnRpbmcgdG8gSlBFRy5cclxuICAgIGlmIChwbGFuLmNvbnZlcnRUbyA9PT0gJ2pwZWcnKSB7XHJcbiAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSAnI2ZmZmZmZic7XHJcbiAgICAgICAgY29udGV4dC5maWxsUmVjdCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBjb250ZXh0LmRyYXdJbWFnZShcclxuICAgICAgICBpbWFnZSxcclxuICAgICAgICAwLFxyXG4gICAgICAgIDAsXHJcbiAgICAgICAgd2lkdGgsXHJcbiAgICAgICAgaGVpZ2h0XHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IG91dHB1dFR5cGUgPSBnZXRPdXRwdXRNaW1lVHlwZShcclxuICAgICAgICBwbGFuLmNvbnZlcnRUbyxcclxuICAgICAgICBmaWxlLnR5cGVcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgYmxvYiA9IGF3YWl0IGNhbnZhc1RvQmxvYihcclxuICAgICAgICBjYW52YXMsXHJcbiAgICAgICAgb3V0cHV0VHlwZVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBleHRlbnNpb24gPSBnZXRFeHRlbnNpb25Gb3JNaW1lVHlwZShcclxuICAgICAgICBvdXRwdXRUeXBlXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IG91dHB1dE5hbWUgPSByZXBsYWNlRXh0ZW5zaW9uKFxyXG4gICAgICAgIGZpbGUubmFtZSxcclxuICAgICAgICBleHRlbnNpb25cclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBGaWxlKFxyXG4gICAgICAgIFtibG9iXSxcclxuICAgICAgICBvdXRwdXROYW1lLFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdHlwZTogb3V0cHV0VHlwZSxcclxuICAgICAgICAgICAgbGFzdE1vZGlmaWVkOiBEYXRlLm5vdygpLFxyXG4gICAgICAgIH1cclxuICAgICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxvYWRJbWFnZShcclxuICAgIGZpbGU6IEZpbGVcclxuKTogUHJvbWlzZTxIVE1MSW1hZ2VFbGVtZW50PiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoZmlsZSk7XHJcbiAgICAgICAgY29uc3QgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuXHJcbiAgICAgICAgaW1hZ2Uub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XHJcbiAgICAgICAgICAgIHJlc29sdmUoaW1hZ2UpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGltYWdlLm9uZXJyb3IgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcclxuICAgICAgICAgICAgcmVqZWN0KFxyXG4gICAgICAgICAgICAgICAgbmV3IEVycm9yKCdVbmFibGUgdG8gZGVjb2RlIGltYWdlLicpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaW1hZ2Uuc3JjID0gdXJsO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNhbnZhc1RvQmxvYihcclxuICAgIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQsXHJcbiAgICB0eXBlOiBzdHJpbmdcclxuKTogUHJvbWlzZTxCbG9iPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGNhbnZhcy50b0Jsb2IoXHJcbiAgICAgICAgICAgIChibG9iKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWJsb2IpIHtcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBpbWFnZS4nKVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJlc29sdmUoYmxvYik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHR5cGVcclxuICAgICAgICApO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldE91dHB1dE1pbWVUeXBlKFxyXG4gICAgZm9ybWF0OiBUcmFuc2Zvcm1hdGlvblBsYW5bJ2NvbnZlcnRUbyddLFxyXG4gICAgb3JpZ2luYWxUeXBlOiBzdHJpbmdcclxuKTogc3RyaW5nIHtcclxuICAgIHN3aXRjaCAoZm9ybWF0KSB7XHJcbiAgICAgICAgY2FzZSAnanBlZyc6XHJcbiAgICAgICAgICAgIHJldHVybiAnaW1hZ2UvanBlZyc7XHJcblxyXG4gICAgICAgIGNhc2UgJ3BuZyc6XHJcbiAgICAgICAgICAgIHJldHVybiAnaW1hZ2UvcG5nJztcclxuXHJcbiAgICAgICAgY2FzZSAnd2VicCc6XHJcbiAgICAgICAgICAgIHJldHVybiAnaW1hZ2Uvd2VicCc7XHJcblxyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbFR5cGU7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEV4dGVuc2lvbkZvck1pbWVUeXBlKFxyXG4gICAgbWltZVR5cGU6IHN0cmluZ1xyXG4pOiBzdHJpbmcge1xyXG4gICAgc3dpdGNoIChtaW1lVHlwZSkge1xyXG4gICAgICAgIGNhc2UgJ2ltYWdlL2pwZWcnOlxyXG4gICAgICAgICAgICByZXR1cm4gJ2pwZyc7XHJcblxyXG4gICAgICAgIGNhc2UgJ2ltYWdlL3BuZyc6XHJcbiAgICAgICAgICAgIHJldHVybiAncG5nJztcclxuXHJcbiAgICAgICAgY2FzZSAnaW1hZ2Uvd2VicCc6XHJcbiAgICAgICAgICAgIHJldHVybiAnd2VicCc7XHJcblxyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHJldHVybiAnaW1nJztcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVwbGFjZUV4dGVuc2lvbihcclxuICAgIGZpbGVOYW1lOiBzdHJpbmcsXHJcbiAgICBleHRlbnNpb246IHN0cmluZ1xyXG4pOiBzdHJpbmcge1xyXG4gICAgY29uc3QgbGFzdERvdCA9IGZpbGVOYW1lLmxhc3RJbmRleE9mKCcuJyk7XHJcblxyXG4gICAgaWYgKGxhc3REb3QgPT09IC0xKSB7XHJcbiAgICAgICAgcmV0dXJuIGAke2ZpbGVOYW1lfS4ke2V4dGVuc2lvbn1gO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBgJHtmaWxlTmFtZS5zbGljZSgwLCBsYXN0RG90KX0uJHtleHRlbnNpb259YDtcclxufSIsImltcG9ydCB7IHBhcnNlQ29uc3RyYWludHMgfSBmcm9tICcuLi9jb3JlL3BhcnNlci9wYXJzZUNvbnN0cmFpbnRzJztcclxuaW1wb3J0IHsgZXh0cmFjdFVwbG9hZENvbnRleHQgfSBmcm9tICcuLi9jb3JlL2RldGVjdG9yL2V4dHJhY3RVcGxvYWRDb250ZXh0JztcclxuaW1wb3J0IHsgaW5zcGVjdEZpbGUgfSBmcm9tICcuLi9jb3JlL2luc3BlY3Rvci9pbnNwZWN0RmlsZSc7XHJcbmltcG9ydCB7IHZhbGlkYXRlRmlsZSB9IGZyb20gJy4uL2NvcmUvdmFsaWRhdG9yL3ZhbGlkYXRlRmlsZSc7XHJcbmltcG9ydCB7IGNyZWF0ZVRyYW5zZm9ybWF0aW9uUGxhbiB9IGZyb20gJy4uL2NvcmUvcGxhbm5lci9jcmVhdGVUcmFuc2Zvcm1hdGlvblBsYW4nO1xyXG5pbXBvcnQgeyB0cmFuc2Zvcm1JbWFnZSB9IGZyb20gJy4uL2NvcmUvdHJhbnNmb3JtZXIvdHJhbnNmb3JtSW1hZ2UnO1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb250ZW50U2NyaXB0KHtcclxuICBtYXRjaGVzOiBbJzxhbGxfdXJscz4nXSxcclxuXHJcbiAgbWFpbigpIHtcclxuICAgIGNvbnNvbGUubG9nKCdbRmlsZVRocm91Z2hdIENvbnRlbnQgc2NyaXB0IGxvYWRlZCcpO1xyXG5cclxuICAgIGNvbnN0IGRldGVjdGVkSW5wdXRzID0gbmV3IFdlYWtTZXQ8SFRNTElucHV0RWxlbWVudD4oKTtcclxuXHJcbiAgICBmdW5jdGlvbiByZWdpc3RlckZpbGVJbnB1dChpbnB1dDogSFRNTElucHV0RWxlbWVudCkge1xyXG4gICAgICAvLyBEb24ndCBwcm9jZXNzIHRoZSBzYW1lIGlucHV0IHR3aWNlXHJcbiAgICAgIGlmIChkZXRlY3RlZElucHV0cy5oYXMoaW5wdXQpKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBkZXRlY3RlZElucHV0cy5hZGQoaW5wdXQpO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coJ1tGaWxlVGhyb3VnaF0gVXBsb2FkIGZpZWxkIGRldGVjdGVkJywge1xyXG4gICAgICAgIGFjY2VwdDogaW5wdXQuYWNjZXB0IHx8ICdOb3Qgc3BlY2lmaWVkJyxcclxuICAgICAgICBtdWx0aXBsZTogaW5wdXQubXVsdGlwbGUsXHJcbiAgICAgICAgbmFtZTogaW5wdXQubmFtZSB8fCAnTm90IHNwZWNpZmllZCcsXHJcbiAgICAgICAgaWQ6IGlucHV0LmlkIHx8ICdOb3Qgc3BlY2lmaWVkJyxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAvLzEuRXh0cmFjdCBjb250ZXh0XHJcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBleHRyYWN0VXBsb2FkQ29udGV4dChpbnB1dCk7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdbRmlsZVRocm91Z2hdIFVwbG9hZCBjb250ZXh0JywgY29udGV4dCk7XHJcbiAgICAgIC8vMi5QYXJzZSBjb25zdHJhaW50c1xyXG4gICAgICBjb25zdCBjb25zdHJhaW50cyA9IHBhcnNlQ29uc3RyYWludHMoY29udGV4dCk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAnW0ZpbGVUaHJvdWdoXSBVcGxvYWQgY29uc3RyYWludHMnLFxyXG4gICAgICAgIGNvbnN0cmFpbnRzXHJcbiAgICAgICk7XHJcbiAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGFzeW5jICgpID0+IHtcclxuICAgICAgICBjb25zdCBmaWxlID0gaW5wdXQuZmlsZXM/LlswXTtcclxuXHJcbiAgICAgICAgaWYgKCFmaWxlKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgZmlsZUluZm8gPSBhd2FpdCBpbnNwZWN0RmlsZShmaWxlKTtcclxuXHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgJ1tGaWxlVGhyb3VnaF0gU2VsZWN0ZWQgZmlsZScsXHJcbiAgICAgICAgICAgIGZpbGVJbmZvXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgLy8zLlZhbGlkYXRlIHRoZSBmaWxlXHJcbiAgICAgICAgICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVGaWxlKGZpbGVJbmZvLCBjb25zdHJhaW50cyk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgJ1tGaWxlVGhyb3VnaF0gVmFsaWRhdGlvbiByZXN1bHQnLFxyXG4gICAgICAgICAgICB2YWxpZGF0aW9uXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIC8vNC5DcmVhdGUgdHJhbnNmb3JtYXRpb24gcGxhblxyXG4gICAgICAgICAgY29uc3QgcGxhbiA9IGNyZWF0ZVRyYW5zZm9ybWF0aW9uUGxhbihmaWxlSW5mbywgY29uc3RyYWludHMpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ1tGaWxlVGhyb3VnaF0gVHJhbnNmb3JtYXRpb24gcGxhbicsIHBsYW4pO1xyXG4gICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHBsYW4pLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICBjb25zdCB0cmFuc2Zvcm1lZEZpbGUgPVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgdHJhbnNmb3JtSW1hZ2UoZmlsZSwgcGxhbik7XHJcblxyXG4gICAgICAgICAgICAgIGNvbnN0IHRyYW5zZm9ybWVkSW5mbyA9XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBpbnNwZWN0RmlsZSh0cmFuc2Zvcm1lZEZpbGUpO1xyXG5cclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICAgICdbRmlsZVRocm91Z2hdIFRyYW5zZm9ybWVkIGZpbGUnLFxyXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtZWRJbmZvXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbRmlsZVRocm91Z2hdIFRyYW5zZm9ybWF0aW9uIGZhaWxlZCcsIGVycm9yKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tGaWxlVGhyb3VnaF0gQ291bGQgbm90IGluc3BlY3QgZmlsZScsIGVycm9yKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNjYW5Gb3JGaWxlSW5wdXRzKHJvb3Q6IFBhcmVudE5vZGUgPSBkb2N1bWVudCkge1xyXG4gICAgICBjb25zdCBpbnB1dHMgPVxyXG4gICAgICAgIHJvb3QucXVlcnlTZWxlY3RvckFsbDxIVE1MSW5wdXRFbGVtZW50PignaW5wdXRbdHlwZT1cImZpbGVcIl0nKTtcclxuXHJcbiAgICAgIGlucHV0cy5mb3JFYWNoKHJlZ2lzdGVyRmlsZUlucHV0KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTY2FuIGlucHV0cyBhbHJlYWR5IHByZXNlbnQgb24gdGhlIHBhZ2VcclxuICAgIHNjYW5Gb3JGaWxlSW5wdXRzKCk7XHJcblxyXG4gICAgLy8gV2F0Y2ggZm9yIGlucHV0cyBhZGRlZCBsYXRlclxyXG4gICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigobXV0YXRpb25zKSA9PiB7XHJcbiAgICAgIGZvciAoY29uc3QgbXV0YXRpb24gb2YgbXV0YXRpb25zKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIG11dGF0aW9uLmFkZGVkTm9kZXMpIHtcclxuICAgICAgICAgIGlmICghKG5vZGUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gVGhlIGFkZGVkIGVsZW1lbnQgaXRzZWxmIG1pZ2h0IGJlIGEgZmlsZSBpbnB1dFxyXG4gICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICBub2RlIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCAmJlxyXG4gICAgICAgICAgICBub2RlLnR5cGUgPT09ICdmaWxlJ1xyXG4gICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlsZUlucHV0KG5vZGUpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIE9yIGl0IG1pZ2h0IGNvbnRhaW4gZmlsZSBpbnB1dHNcclxuICAgICAgICAgIHNjYW5Gb3JGaWxlSW5wdXRzKG5vZGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsIHtcclxuICAgICAgY2hpbGRMaXN0OiB0cnVlLFxyXG4gICAgICBzdWJ0cmVlOiB0cnVlLFxyXG4gICAgfSk7XHJcbiAgfSxcclxufSk7IiwiLy8jcmVnaW9uIHNyYy91dGlscy9pbnRlcm5hbC9sb2dnZXIudHNcbmZ1bmN0aW9uIHByaW50KG1ldGhvZCwgLi4uYXJncykge1xuXHRpZiAoaW1wb3J0Lm1ldGEuZW52Lk1PREUgPT09IFwicHJvZHVjdGlvblwiKSByZXR1cm47XG5cdGlmICh0eXBlb2YgYXJnc1swXSA9PT0gXCJzdHJpbmdcIikgbWV0aG9kKGBbd3h0XSAke2FyZ3Muc2hpZnQoKX1gLCAuLi5hcmdzKTtcblx0ZWxzZSBtZXRob2QoXCJbd3h0XVwiLCAuLi5hcmdzKTtcbn1cbi8qKiBXcmFwcGVyIGFyb3VuZCBgY29uc29sZWAgd2l0aCBhIFwiW3d4dF1cIiBwcmVmaXggKi9cbmNvbnN0IGxvZ2dlciA9IHtcblx0ZGVidWc6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmRlYnVnLCAuLi5hcmdzKSxcblx0bG9nOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5sb2csIC4uLmFyZ3MpLFxuXHR3YXJuOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS53YXJuLCAuLi5hcmdzKSxcblx0ZXJyb3I6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmVycm9yLCAuLi5hcmdzKVxufTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgbG9nZ2VyIH07XG4iLCIvLyAjcmVnaW9uIHNuaXBwZXRcbmV4cG9ydCBjb25zdCBicm93c2VyID0gZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZFxuICA/IGdsb2JhbFRoaXMuYnJvd3NlclxuICA6IGdsb2JhbFRoaXMuY2hyb21lO1xuLy8gI2VuZHJlZ2lvbiBzbmlwcGV0XG4iLCJpbXBvcnQgeyBicm93c2VyIGFzIGJyb3dzZXIkMSB9IGZyb20gXCJAd3h0LWRldi9icm93c2VyXCI7XG4vLyNyZWdpb24gc3JjL2Jyb3dzZXIudHNcbi8qKlxuKiBDb250YWlucyB0aGUgYGJyb3dzZXJgIGV4cG9ydCB3aGljaCB5b3Ugc2hvdWxkIHVzZSB0byBhY2Nlc3MgdGhlIGV4dGVuc2lvblxuKiBBUElzIGluIHlvdXIgcHJvamVjdDpcbipcbiogYGBgdHNcbiogaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJ3d4dC9icm93c2VyJztcbipcbiogYnJvd3Nlci5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKCgpID0+IHtcbiogICAvLyAuLi5cbiogfSk7XG4qIGBgYFxuKlxuKiBAbW9kdWxlIHd4dC9icm93c2VyXG4qL1xuY29uc3QgYnJvd3NlciA9IGJyb3dzZXIkMTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgYnJvd3NlciB9O1xuIiwiaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gXCJ3eHQvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy91dGlscy9pbnRlcm5hbC9jdXN0b20tZXZlbnRzLnRzXG52YXIgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCA9IGNsYXNzIFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgZXh0ZW5kcyBFdmVudCB7XG5cdHN0YXRpYyBFVkVOVF9OQU1FID0gZ2V0VW5pcXVlRXZlbnROYW1lKFwid3h0OmxvY2F0aW9uY2hhbmdlXCIpO1xuXHRjb25zdHJ1Y3RvcihuZXdVcmwsIG9sZFVybCkge1xuXHRcdHN1cGVyKFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQuRVZFTlRfTkFNRSwge30pO1xuXHRcdHRoaXMubmV3VXJsID0gbmV3VXJsO1xuXHRcdHRoaXMub2xkVXJsID0gb2xkVXJsO1xuXHR9XG59O1xuLyoqXG4qIFJldHVybnMgYW4gZXZlbnQgbmFtZSB1bmlxdWUgdG8gdGhlIGV4dGVuc2lvbiBhbmQgY29udGVudCBzY3JpcHQgdGhhdCdzXG4qIHJ1bm5pbmcuXG4qL1xuZnVuY3Rpb24gZ2V0VW5pcXVlRXZlbnROYW1lKGV2ZW50TmFtZSkge1xuXHRyZXR1cm4gYCR7YnJvd3Nlcj8ucnVudGltZT8uaWR9OiR7aW1wb3J0Lm1ldGEuZW52LkVOVFJZUE9JTlR9OiR7ZXZlbnROYW1lfWA7XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQsIGdldFVuaXF1ZUV2ZW50TmFtZSB9O1xuIiwiaW1wb3J0IHsgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCB9IGZyb20gXCIuL2N1c3RvbS1ldmVudHMubWpzXCI7XG4vLyNyZWdpb24gc3JjL3V0aWxzL2ludGVybmFsL2xvY2F0aW9uLXdhdGNoZXIudHNcbmNvbnN0IHN1cHBvcnRzTmF2aWdhdGlvbkFwaSA9IHR5cGVvZiBnbG9iYWxUaGlzLm5hdmlnYXRpb24/LmFkZEV2ZW50TGlzdGVuZXIgPT09IFwiZnVuY3Rpb25cIjtcbi8qKlxuKiBDcmVhdGUgYSB1dGlsIHRoYXQgd2F0Y2hlcyBmb3IgVVJMIGNoYW5nZXMsIGRpc3BhdGNoaW5nIHRoZSBjdXN0b20gZXZlbnQgd2hlblxuKiBkZXRlY3RlZC4gU3RvcHMgd2F0Y2hpbmcgd2hlbiBjb250ZW50IHNjcmlwdCBpcyBpbnZhbGlkYXRlZC4gVXNlcyBOYXZpZ2F0aW9uXG4qIEFQSSB3aGVuIGF2YWlsYWJsZSwgb3RoZXJ3aXNlIGZhbGxzIGJhY2sgdG8gcG9sbGluZy5cbiovXG5mdW5jdGlvbiBjcmVhdGVMb2NhdGlvbldhdGNoZXIoY3R4KSB7XG5cdGxldCBsYXN0VXJsO1xuXHRsZXQgd2F0Y2hpbmcgPSBmYWxzZTtcblx0cmV0dXJuIHsgcnVuKCkge1xuXHRcdGlmICh3YXRjaGluZykgcmV0dXJuO1xuXHRcdHdhdGNoaW5nID0gdHJ1ZTtcblx0XHRsYXN0VXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcblx0XHRpZiAoc3VwcG9ydHNOYXZpZ2F0aW9uQXBpKSBnbG9iYWxUaGlzLm5hdmlnYXRpb24uYWRkRXZlbnRMaXN0ZW5lcihcIm5hdmlnYXRlXCIsIChldmVudCkgPT4ge1xuXHRcdFx0Y29uc3QgbmV3VXJsID0gbmV3IFVSTChldmVudC5kZXN0aW5hdGlvbi51cmwpO1xuXHRcdFx0aWYgKG5ld1VybC5ocmVmID09PSBsYXN0VXJsLmhyZWYpIHJldHVybjtcblx0XHRcdHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50KG5ld1VybCwgbGFzdFVybCkpO1xuXHRcdFx0bGFzdFVybCA9IG5ld1VybDtcblx0XHR9LCB7IHNpZ25hbDogY3R4LnNpZ25hbCB9KTtcblx0XHRlbHNlIGN0eC5zZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHRjb25zdCBuZXdVcmwgPSBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpO1xuXHRcdFx0aWYgKG5ld1VybC5ocmVmICE9PSBsYXN0VXJsLmhyZWYpIHtcblx0XHRcdFx0d2luZG93LmRpc3BhdGNoRXZlbnQobmV3IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQobmV3VXJsLCBsYXN0VXJsKSk7XG5cdFx0XHRcdGxhc3RVcmwgPSBuZXdVcmw7XG5cdFx0XHR9XG5cdFx0fSwgMWUzKTtcblx0fSB9O1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBjcmVhdGVMb2NhdGlvbldhdGNoZXIgfTtcbiIsImltcG9ydCB7IGxvZ2dlciB9IGZyb20gXCIuL2ludGVybmFsL2xvZ2dlci5tanNcIjtcbmltcG9ydCB7IGdldFVuaXF1ZUV2ZW50TmFtZSB9IGZyb20gXCIuL2ludGVybmFsL2N1c3RvbS1ldmVudHMubWpzXCI7XG5pbXBvcnQgeyBjcmVhdGVMb2NhdGlvbldhdGNoZXIgfSBmcm9tIFwiLi9pbnRlcm5hbC9sb2NhdGlvbi13YXRjaGVyLm1qc1wiO1xuaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gXCJ3eHQvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy91dGlscy9jb250ZW50LXNjcmlwdC1jb250ZXh0LnRzXG4vKipcbiogSW1wbGVtZW50c1xuKiBbYEFib3J0Q29udHJvbGxlcmBdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9BYm9ydENvbnRyb2xsZXIpLlxuKiBVc2VkIHRvIGRldGVjdCBhbmQgc3RvcCBjb250ZW50IHNjcmlwdCBjb2RlIHdoZW4gdGhlIHNjcmlwdCBpcyBpbnZhbGlkYXRlZC5cbipcbiogSXQgYWxzbyBwcm92aWRlcyBzZXZlcmFsIHV0aWxpdGllcyBsaWtlIGBjdHguc2V0VGltZW91dGAgYW5kXG4qIGBjdHguc2V0SW50ZXJ2YWxgIHRoYXQgc2hvdWxkIGJlIHVzZWQgaW4gY29udGVudCBzY3JpcHRzIGluc3RlYWQgb2ZcbiogYHdpbmRvdy5zZXRUaW1lb3V0YCBvciBgd2luZG93LnNldEludGVydmFsYC5cbipcbiogVG8gY3JlYXRlIGNvbnRleHQgZm9yIHRlc3RpbmcsIHlvdSBjYW4gdXNlIHRoZSBjbGFzcydzIGNvbnN0cnVjdG9yOlxuKlxuKiBgYGB0c1xuKiBpbXBvcnQgeyBDb250ZW50U2NyaXB0Q29udGV4dCB9IGZyb20gJ3d4dC91dGlscy9jb250ZW50LXNjcmlwdHMtY29udGV4dCc7XG4qXG4qIHRlc3QoJ3N0b3JhZ2UgbGlzdGVuZXIgc2hvdWxkIGJlIHJlbW92ZWQgd2hlbiBjb250ZXh0IGlzIGludmFsaWRhdGVkJywgKCkgPT4ge1xuKiAgIGNvbnN0IGN0eCA9IG5ldyBDb250ZW50U2NyaXB0Q29udGV4dCgndGVzdCcpO1xuKiAgIGNvbnN0IGl0ZW0gPSBzdG9yYWdlLmRlZmluZUl0ZW0oJ2xvY2FsOmNvdW50JywgeyBkZWZhdWx0VmFsdWU6IDAgfSk7XG4qICAgY29uc3Qgd2F0Y2hlciA9IHZpLmZuKCk7XG4qXG4qICAgY29uc3QgdW53YXRjaCA9IGl0ZW0ud2F0Y2god2F0Y2hlcik7XG4qICAgY3R4Lm9uSW52YWxpZGF0ZWQodW53YXRjaCk7IC8vIExpc3RlbiBmb3IgaW52YWxpZGF0ZSBoZXJlXG4qXG4qICAgYXdhaXQgaXRlbS5zZXRWYWx1ZSgxKTtcbiogICBleHBlY3Qod2F0Y2hlcikudG9CZUNhbGxlZFRpbWVzKDEpO1xuKiAgIGV4cGVjdCh3YXRjaGVyKS50b0JlQ2FsbGVkV2l0aCgxLCAwKTtcbipcbiogICBjdHgubm90aWZ5SW52YWxpZGF0ZWQoKTsgLy8gVXNlIHRoaXMgZnVuY3Rpb24gdG8gaW52YWxpZGF0ZSB0aGUgY29udGV4dFxuKiAgIGF3YWl0IGl0ZW0uc2V0VmFsdWUoMik7XG4qICAgZXhwZWN0KHdhdGNoZXIpLnRvQmVDYWxsZWRUaW1lcygxKTtcbiogfSk7XG4qIGBgYFxuKi9cbnZhciBDb250ZW50U2NyaXB0Q29udGV4dCA9IGNsYXNzIENvbnRlbnRTY3JpcHRDb250ZXh0IHtcblx0c3RhdGljIFNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcInd4dDpjb250ZW50LXNjcmlwdC1zdGFydGVkXCIpO1xuXHRpZDtcblx0YWJvcnRDb250cm9sbGVyO1xuXHRsb2NhdGlvbldhdGNoZXIgPSBjcmVhdGVMb2NhdGlvbldhdGNoZXIodGhpcyk7XG5cdGNvbnN0cnVjdG9yKGNvbnRlbnRTY3JpcHROYW1lLCBvcHRpb25zKSB7XG5cdFx0dGhpcy5jb250ZW50U2NyaXB0TmFtZSA9IGNvbnRlbnRTY3JpcHROYW1lO1xuXHRcdHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cdFx0dGhpcy5pZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpO1xuXHRcdHRoaXMuYWJvcnRDb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuXHRcdHRoaXMuc3RvcE9sZFNjcmlwdHMoKTtcblx0XHR0aGlzLmxpc3RlbkZvck5ld2VyU2NyaXB0cygpO1xuXHR9XG5cdGdldCBzaWduYWwoKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWJvcnRDb250cm9sbGVyLnNpZ25hbDtcblx0fVxuXHRhYm9ydChyZWFzb24pIHtcblx0XHRyZXR1cm4gdGhpcy5hYm9ydENvbnRyb2xsZXIuYWJvcnQocmVhc29uKTtcblx0fVxuXHRnZXQgaXNJbnZhbGlkKCkge1xuXHRcdGlmIChicm93c2VyLnJ1bnRpbWU/LmlkID09IG51bGwpIHRoaXMubm90aWZ5SW52YWxpZGF0ZWQoKTtcblx0XHRyZXR1cm4gdGhpcy5zaWduYWwuYWJvcnRlZDtcblx0fVxuXHRnZXQgaXNWYWxpZCgpIHtcblx0XHRyZXR1cm4gIXRoaXMuaXNJbnZhbGlkO1xuXHR9XG5cdC8qKlxuXHQqIEFkZCBhIGxpc3RlbmVyIHRoYXQgaXMgY2FsbGVkIHdoZW4gdGhlIGNvbnRlbnQgc2NyaXB0J3MgY29udGV4dCBpc1xuXHQqIGludmFsaWRhdGVkLlxuXHQqXG5cdCogQGV4YW1wbGVcblx0KiAgIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoY2IpO1xuXHQqICAgY29uc3QgcmVtb3ZlSW52YWxpZGF0ZWRMaXN0ZW5lciA9IGN0eC5vbkludmFsaWRhdGVkKCgpID0+IHtcblx0KiAgICAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5yZW1vdmVMaXN0ZW5lcihjYik7XG5cdCogICB9KTtcblx0KiAgIC8vIC4uLlxuXHQqICAgcmVtb3ZlSW52YWxpZGF0ZWRMaXN0ZW5lcigpO1xuXHQqXG5cdCogQHJldHVybnMgQSBmdW5jdGlvbiB0byByZW1vdmUgdGhlIGxpc3RlbmVyLlxuXHQqL1xuXHRvbkludmFsaWRhdGVkKGNiKSB7XG5cdFx0dGhpcy5zaWduYWwuYWRkRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGNiKTtcblx0XHRyZXR1cm4gKCkgPT4gdGhpcy5zaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGNiKTtcblx0fVxuXHQvKipcblx0KiBSZXR1cm4gYSBwcm9taXNlIHRoYXQgbmV2ZXIgcmVzb2x2ZXMuIFVzZWZ1bCBpZiB5b3UgaGF2ZSBhbiBhc3luYyBmdW5jdGlvblxuXHQqIHRoYXQgc2hvdWxkbid0IHJ1biBhZnRlciB0aGUgY29udGV4dCBpcyBleHBpcmVkLlxuXHQqXG5cdCogQGV4YW1wbGVcblx0KiAgIGNvbnN0IGdldFZhbHVlRnJvbVN0b3JhZ2UgPSBhc3luYyAoKSA9PiB7XG5cdCogICAgIGlmIChjdHguaXNJbnZhbGlkKSByZXR1cm4gY3R4LmJsb2NrKCk7XG5cdCpcblx0KiAgICAgLy8gLi4uXG5cdCogICB9O1xuXHQqL1xuXHRibG9jaygpIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKCkgPT4ge30pO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cuc2V0SW50ZXJ2YWxgIHRoYXQgYXV0b21hdGljYWxseSBjbGVhcnMgdGhlIGludGVydmFsXG5cdCogd2hlbiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIEludGVydmFscyBjYW4gYmUgY2xlYXJlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYGNsZWFySW50ZXJ2YWxgIGZ1bmN0aW9uLlxuXHQqL1xuXHRzZXRJbnRlcnZhbChoYW5kbGVyLCB0aW1lb3V0KSB7XG5cdFx0Y29uc3QgaWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSBoYW5kbGVyKCk7XG5cdFx0fSwgdGltZW91dCk7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNsZWFySW50ZXJ2YWwoaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5zZXRUaW1lb3V0YCB0aGF0IGF1dG9tYXRpY2FsbHkgY2xlYXJzIHRoZSBpbnRlcnZhbFxuXHQqIHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBUaW1lb3V0cyBjYW4gYmUgY2xlYXJlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYHNldFRpbWVvdXRgIGZ1bmN0aW9uLlxuXHQqL1xuXHRzZXRUaW1lb3V0KGhhbmRsZXIsIHRpbWVvdXQpIHtcblx0XHRjb25zdCBpZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgaGFuZGxlcigpO1xuXHRcdH0sIHRpbWVvdXQpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjbGVhclRpbWVvdXQoaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHRoYXQgYXV0b21hdGljYWxseSBjYW5jZWxzXG5cdCogdGhlIHJlcXVlc3Qgd2hlbiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIENhbGxiYWNrcyBjYW4gYmUgY2FuY2VsZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBjYW5jZWxBbmltYXRpb25GcmFtZWBcblx0KiBmdW5jdGlvbi5cblx0Ki9cblx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNhbGxiYWNrKSB7XG5cdFx0Y29uc3QgaWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKC4uLmFyZ3MpID0+IHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIGNhbGxiYWNrKC4uLmFyZ3MpO1xuXHRcdH0pO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjYW5jZWxBbmltYXRpb25GcmFtZShpZCkpO1xuXHRcdHJldHVybiBpZDtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnJlcXVlc3RJZGxlQ2FsbGJhY2tgIHRoYXQgYXV0b21hdGljYWxseSBjYW5jZWxzIHRoZVxuXHQqIHJlcXVlc3Qgd2hlbiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIENhbGxiYWNrcyBjYW4gYmUgY2FuY2VsZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBjYW5jZWxJZGxlQ2FsbGJhY2tgXG5cdCogZnVuY3Rpb24uXG5cdCovXG5cdHJlcXVlc3RJZGxlQ2FsbGJhY2soY2FsbGJhY2ssIG9wdGlvbnMpIHtcblx0XHRjb25zdCBpZCA9IHJlcXVlc3RJZGxlQ2FsbGJhY2soKC4uLmFyZ3MpID0+IHtcblx0XHRcdGlmICghdGhpcy5zaWduYWwuYWJvcnRlZCkgY2FsbGJhY2soLi4uYXJncyk7XG5cdFx0fSwgb3B0aW9ucyk7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNhbmNlbElkbGVDYWxsYmFjayhpZCkpO1xuXHRcdHJldHVybiBpZDtcblx0fVxuXHRhZGRFdmVudExpc3RlbmVyKHRhcmdldCwgdHlwZSwgaGFuZGxlciwgb3B0aW9ucykge1xuXHRcdGlmICh0eXBlID09PSBcInd4dDpsb2NhdGlvbmNoYW5nZVwiKSB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSB0aGlzLmxvY2F0aW9uV2F0Y2hlci5ydW4oKTtcblx0XHR9XG5cdFx0dGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXI/Lih0eXBlLnN0YXJ0c1dpdGgoXCJ3eHQ6XCIpID8gZ2V0VW5pcXVlRXZlbnROYW1lKHR5cGUpIDogdHlwZSwgaGFuZGxlciwge1xuXHRcdFx0Li4ub3B0aW9ucyxcblx0XHRcdHNpZ25hbDogdGhpcy5zaWduYWxcblx0XHR9KTtcblx0fVxuXHQvKipcblx0KiBAaW50ZXJuYWxcblx0KiBBYm9ydCB0aGUgYWJvcnQgY29udHJvbGxlciBhbmQgZXhlY3V0ZSBhbGwgYG9uSW52YWxpZGF0ZWRgIGxpc3RlbmVycy5cblx0Ki9cblx0bm90aWZ5SW52YWxpZGF0ZWQoKSB7XG5cdFx0dGhpcy5hYm9ydChcIkNvbnRlbnQgc2NyaXB0IGNvbnRleHQgaW52YWxpZGF0ZWRcIik7XG5cdFx0bG9nZ2VyLmRlYnVnKGBDb250ZW50IHNjcmlwdCBcIiR7dGhpcy5jb250ZW50U2NyaXB0TmFtZX1cIiBjb250ZXh0IGludmFsaWRhdGVkYCk7XG5cdH1cblx0c3RvcE9sZFNjcmlwdHMoKSB7XG5cdFx0ZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLCB7IGRldGFpbDoge1xuXHRcdFx0Y29udGVudFNjcmlwdE5hbWU6IHRoaXMuY29udGVudFNjcmlwdE5hbWUsXG5cdFx0XHRtZXNzYWdlSWQ6IHRoaXMuaWRcblx0XHR9IH0pKTtcblx0XHRpZiAoIXRoaXMub3B0aW9ucz8ubm9TY3JpcHRTdGFydGVkUG9zdE1lc3NhZ2UpIHdpbmRvdy5wb3N0TWVzc2FnZSh7XG5cdFx0XHR0eXBlOiBDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsXG5cdFx0XHRjb250ZW50U2NyaXB0TmFtZTogdGhpcy5jb250ZW50U2NyaXB0TmFtZSxcblx0XHRcdG1lc3NhZ2VJZDogdGhpcy5pZFxuXHRcdH0sIFwiKlwiKTtcblx0fVxuXHR2ZXJpZnlTY3JpcHRTdGFydGVkRXZlbnQoZXZlbnQpIHtcblx0XHRjb25zdCBpc1NhbWVDb250ZW50U2NyaXB0ID0gZXZlbnQuZGV0YWlsPy5jb250ZW50U2NyaXB0TmFtZSA9PT0gdGhpcy5jb250ZW50U2NyaXB0TmFtZTtcblx0XHRjb25zdCBpc0Zyb21TZWxmID0gZXZlbnQuZGV0YWlsPy5tZXNzYWdlSWQgPT09IHRoaXMuaWQ7XG5cdFx0cmV0dXJuIGlzU2FtZUNvbnRlbnRTY3JpcHQgJiYgIWlzRnJvbVNlbGY7XG5cdH1cblx0bGlzdGVuRm9yTmV3ZXJTY3JpcHRzKCkge1xuXHRcdGNvbnN0IGNiID0gKGV2ZW50KSA9PiB7XG5cdFx0XHRpZiAoIShldmVudCBpbnN0YW5jZW9mIEN1c3RvbUV2ZW50KSB8fCAhdGhpcy52ZXJpZnlTY3JpcHRTdGFydGVkRXZlbnQoZXZlbnQpKSByZXR1cm47XG5cdFx0XHR0aGlzLm5vdGlmeUludmFsaWRhdGVkKCk7XG5cdFx0fTtcblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSwgY2IpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSwgY2IpKTtcblx0fVxufTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgQ29udGVudFNjcmlwdENvbnRleHQgfTtcbiJdLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMCwxMSwxMiwxMywxNCwxNSwxNl0sIm1hcHBpbmdzIjoiOztDQUNBLFNBQVMsb0JBQW9CLFlBQVk7RUFDeEMsT0FBTztDQUNSOzs7Q0NEQSxTQUFTLFFBQVEsT0FBZSxNQUFzQjtFQUdsRCxRQUZ1QixLQUFLLFlBRXBCLEdBQVI7R0FDSSxLQUFLLE1BQ0QsT0FBTyxLQUFLLE1BQU0sUUFBUSxJQUFJO0dBRWxDLEtBQUssTUFDRCxPQUFPLEtBQUssTUFBTSxRQUFRLE9BQU8sSUFBSTtHQUV6QyxLQUFLLE1BQ0QsT0FBTyxLQUFLLE1BQU0sUUFBUSxPQUFPLE9BQU8sSUFBSTtHQUVoRCxTQUNJLE9BQU8sS0FBSyxNQUFNLEtBQUs7RUFDL0I7Q0FDSjtDQUVBLFNBQWdCLGNBQWMsTUFBaUM7RUFDM0QsTUFBTSxTQUE0QixDQUFDO0VBRW5DLE1BQU0saUJBQWlCLEtBQ2xCLFFBQVEsUUFBUSxHQUFHLENBQUMsQ0FDcEIsS0FBSztFQWlCVixLQUFLLE1BQU0sV0FBVyxDQUxsQixnRkFFQSw2RUFHa0IsR0FBZTtHQUNqQyxNQUFNLFFBQVEsZUFBZSxNQUFNLE9BQU87R0FFMUMsSUFBSSxPQUFPO0lBQ1AsTUFBTSxXQUFXLE1BQU07SUFDdkIsTUFBTSxVQUFVLE1BQU07SUFDdEIsTUFBTSxXQUFXLE1BQU07SUFDdkIsTUFBTSxVQUFVLE1BQU07SUFFdEIsSUFBSSxDQUFDLFlB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