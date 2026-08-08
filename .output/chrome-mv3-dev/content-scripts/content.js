(function() {
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_jiti@2.7.0_supports-color@7.2.0__rolldown@1.2.2_typescript@5.9_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/define-content-script.mjs
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
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_jiti@2.7.0_supports-color@7.2.0__rolldown@1.2.2_typescript@5.9_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/internal/logger.mjs
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
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_jiti@2.7.0_supports-color@7.2.0__rolldown@1.2.2_typescript@5.9_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/browser.mjs
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
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_jiti@2.7.0_supports-color@7.2.0__rolldown@1.2.2_typescript@5.9_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/internal/custom-events.mjs
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
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_jiti@2.7.0_supports-color@7.2.0__rolldown@1.2.2_typescript@5.9_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/internal/location-watcher.mjs
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
	//#region node_modules/.pnpm/wxt@0.21.3_eslint@9.39.4_jiti@2.7.0_supports-color@7.2.0__rolldown@1.2.2_typescript@5.9_48b62904580f51273776b0430c289b04/node_modules/wxt/dist/utils/content-script-context.mjs
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
	//#region \0virtual:wxt-content-script-isolated-world-entrypoint?/home/vikas/Desktop/filethrough/entrypoints/content.ts
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm5hbWVzIjpbInByaW50IiwibG9nZ2VyIiwiYnJvd3NlciJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfaml0aUAyLjcuMF9zdXBwb3J0cy1jb2xvckA3LjIuMF9fcm9sbGRvd25AMS4yLjJfdHlwZXNjcmlwdEA1LjlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1jb250ZW50LXNjcmlwdC5tanMiLCIuLi8uLi8uLi9jb3JlL3BhcnNlci9wYXJzZUZpbGVTaXplLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VGb3JtYXRzLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VEaW1lbnNpb25zLnRzIiwiLi4vLi4vLi4vY29yZS9wYXJzZXIvcGFyc2VDb25zdHJhaW50cy50cyIsIi4uLy4uLy4uL2NvcmUvZGV0ZWN0b3IvZXh0cmFjdFVwbG9hZENvbnRleHQudHMiLCIuLi8uLi8uLi9jb3JlL2luc3BlY3Rvci9pbnNwZWN0RmlsZS50cyIsIi4uLy4uLy4uL2NvcmUvdmFsaWRhdG9yL3ZhbGlkYXRlRmlsZS50cyIsIi4uLy4uLy4uL2NvcmUvcGxhbm5lci9jcmVhdGVUcmFuc2Zvcm1hdGlvblBsYW4udHMiLCIuLi8uLi8uLi9lbnRyeXBvaW50cy9jb250ZW50LnRzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIxLjNfZXNsaW50QDkuMzkuNF9qaXRpQDIuNy4wX3N1cHBvcnRzLWNvbG9yQDcuMi4wX19yb2xsZG93bkAxLjIuMl90eXBlc2NyaXB0QDUuOV80OGI2MjkwNDU4MGY1MTI3Mzc3NmIwNDMwYzI4OWIwNC9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvaW50ZXJuYWwvbG9nZ2VyLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9Ad3h0LWRlditicm93c2VyQDAuMi41L25vZGVfbW9kdWxlcy9Ad3h0LWRldi9icm93c2VyL3NyYy9pbmRleC5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjEuM19lc2xpbnRAOS4zOS40X2ppdGlAMi43LjBfc3VwcG9ydHMtY29sb3JANy4yLjBfX3JvbGxkb3duQDEuMi4yX3R5cGVzY3JpcHRANS45XzQ4YjYyOTA0NTgwZjUxMjczNzc2YjA0MzBjMjg5YjA0L25vZGVfbW9kdWxlcy93eHQvZGlzdC9icm93c2VyLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMS4zX2VzbGludEA5LjM5LjRfaml0aUAyLjcuMF9zdXBwb3J0cy1jb2xvckA3LjIuMF9fcm9sbGRvd25AMS4yLjJfdHlwZXNjcmlwdEA1LjlfNDhiNjI5MDQ1ODBmNTEyNzM3NzZiMDQzMGMyODliMDQvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2N1c3RvbS1ldmVudHMubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIxLjNfZXNsaW50QDkuMzkuNF9qaXRpQDIuNy4wX3N1cHBvcnRzLWNvbG9yQDcuMi4wX19yb2xsZG93bkAxLjIuMl90eXBlc2NyaXB0QDUuOV80OGI2MjkwNDU4MGY1MTI3Mzc3NmIwNDMwYzI4OWIwNC9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvaW50ZXJuYWwvbG9jYXRpb24td2F0Y2hlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjEuM19lc2xpbnRAOS4zOS40X2ppdGlAMi43LjBfc3VwcG9ydHMtY29sb3JANy4yLjBfX3JvbGxkb3duQDEuMi4yX3R5cGVzY3JpcHRANS45XzQ4YjYyOTA0NTgwZjUxMjczNzc2YjA0MzBjMjg5YjA0L25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9jb250ZW50LXNjcmlwdC1jb250ZXh0Lm1qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyNyZWdpb24gc3JjL3V0aWxzL2RlZmluZS1jb250ZW50LXNjcmlwdC50c1xuZnVuY3Rpb24gZGVmaW5lQ29udGVudFNjcmlwdChkZWZpbml0aW9uKSB7XG5cdHJldHVybiBkZWZpbml0aW9uO1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBkZWZpbmVDb250ZW50U2NyaXB0IH07XG4iLCJpbXBvcnQgdHlwZSB7IFVwbG9hZENvbnN0cmFpbnRzIH0gZnJvbSAnLi90eXBlcyc7XG5cbmZ1bmN0aW9uIHRvQnl0ZXModmFsdWU6IG51bWJlciwgdW5pdDogc3RyaW5nKTogbnVtYmVyIHtcbiAgICBjb25zdCBub3JtYWxpemVkVW5pdCA9IHVuaXQudG9Mb3dlckNhc2UoKTtcblxuICAgIHN3aXRjaCAobm9ybWFsaXplZFVuaXQpIHtcbiAgICAgICAgY2FzZSAna2InOlxuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgKiAxMDI0KTtcblxuICAgICAgICBjYXNlICdtYic6XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSAqIDEwMjQgKiAxMDI0KTtcblxuICAgICAgICBjYXNlICdnYic6XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSAqIDEwMjQgKiAxMDI0ICogMTAyNCk7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlKTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZpbGVTaXplKHRleHQ6IHN0cmluZyk6IFVwbG9hZENvbnN0cmFpbnRzIHtcbiAgICBjb25zdCByZXN1bHQ6IFVwbG9hZENvbnN0cmFpbnRzID0ge307XG5cbiAgICBjb25zdCBub3JtYWxpemVkVGV4dCA9IHRleHRcbiAgICAgICAgLnJlcGxhY2UoL1xccysvZywgJyAnKVxuICAgICAgICAudHJpbSgpO1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyAxLiBSQU5HRSBQQVRURVJOU1xuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAvLyBFeGFtcGxlczpcbiAgICAvLyAyMCBLQiB0byAxMDAgS0JcbiAgICAvLyAyMEtCIC0gMTAwS0JcbiAgICAvLyBCZXR3ZWVuIDUwIEtCIGFuZCAyMDAgS0JcblxuICAgIGNvbnN0IHJhbmdlUGF0dGVybnMgPSBbXG4gICAgICAgIC9iZXR3ZWVuXFxzKyhcXGQrKD86XFwuXFxkKyk/KVxccyooa2J8bWJ8Z2IpXFxzK2FuZFxccysoXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKS9pLFxuXG4gICAgICAgIC8oXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKVxccyooPzp0b3wtfOKAk3zigJQpXFxzKihcXGQrKD86XFwuXFxkKyk/KVxccyooa2J8bWJ8Z2IpL2ksXG4gICAgXTtcblxuICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiByYW5nZVBhdHRlcm5zKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gbm9ybWFsaXplZFRleHQubWF0Y2gocGF0dGVybik7XG5cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBjb25zdCBtaW5WYWx1ZSA9IG1hdGNoWzFdO1xuICAgICAgICAgICAgY29uc3QgbWluVW5pdCA9IG1hdGNoWzJdO1xuICAgICAgICAgICAgY29uc3QgbWF4VmFsdWUgPSBtYXRjaFszXTtcbiAgICAgICAgICAgIGNvbnN0IG1heFVuaXQgPSBtYXRjaFs0XTtcblxuICAgICAgICAgICAgaWYgKCFtaW5WYWx1ZSB8fCAhbWluVW5pdCB8fCAhbWF4VmFsdWUgfHwgIW1heFVuaXQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzdWx0Lm1pbkJ5dGVzID0gdG9CeXRlcyhcbiAgICAgICAgICAgICAgICBOdW1iZXIucGFyc2VGbG9hdChtaW5WYWx1ZSksXG4gICAgICAgICAgICAgICAgbWluVW5pdFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmVzdWx0Lm1heEJ5dGVzID0gdG9CeXRlcyhcbiAgICAgICAgICAgICAgICBOdW1iZXIucGFyc2VGbG9hdChtYXhWYWx1ZSksXG4gICAgICAgICAgICAgICAgbWF4VW5pdFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gMi4gTUFYSU1VTSBQQVRURVJOU1xuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAvLyBFeGFtcGxlczpcbiAgICAvLyBNYXhpbXVtIGZpbGUgc2l6ZTogMjAwIEtCXG4gICAgLy8gTWF4IHNpemUgMiBNQlxuICAgIC8vIEZpbGUgc2l6ZSBzaG91bGQgbm90IGV4Y2VlZCA1MDAgS0JcbiAgICAvLyBGaWxlIG11c3QgYmUgdW5kZXIgMzAwIEtCXG4gICAgLy8gTGVzcyB0aGFuIDEgTUJcblxuICAgIGNvbnN0IG1heFBhdHRlcm5zID0gW1xuICAgICAgICAvKD86bWF4aW11bXxtYXgpXFxzKyg/OmZpbGVcXHMrKT9zaXplXFxzKjo/XFxzKihcXGQrKD86XFwuXFxkKyk/KVxccyooa2J8bWJ8Z2IpL2ksXG5cbiAgICAgICAgLyg/OmZpbGVcXHMrKT9zaXplXFxzKyg/OnNob3VsZFxccyspP25vdFxccytleGNlZWRcXHMrKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYikvaSxcblxuICAgICAgICAvKD86ZmlsZVxccyspPyg/Om11c3RcXHMrYmVcXHMrKT91bmRlclxccysoXFxkKyg/OlxcLlxcZCspPylcXHMqKGtifG1ifGdiKS9pLFxuXG4gICAgICAgIC9sZXNzXFxzK3RoYW5cXHMrKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihrYnxtYnxnYikvaSxcbiAgICBdO1xuXG4gICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIG1heFBhdHRlcm5zKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gbm9ybWFsaXplZFRleHQubWF0Y2gocGF0dGVybik7XG5cblxuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gbWF0Y2hbMV07XG4gICAgICAgICAgICBjb25zdCB1bml0ID0gbWF0Y2hbMl07XG5cbiAgICAgICAgICAgIGlmICghdmFsdWUgfHwgIXVuaXQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzdWx0Lm1heEJ5dGVzID0gdG9CeXRlcyhcbiAgICAgICAgICAgICAgICBOdW1iZXIucGFyc2VGbG9hdCh2YWx1ZSksXG4gICAgICAgICAgICAgICAgdW5pdFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59IiwiaW1wb3J0IHR5cGUgeyBVcGxvYWRDb250ZXh0IH0gZnJvbSAnLi4vZGV0ZWN0b3IvZXh0cmFjdFVwbG9hZENvbnRleHQnO1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VGb3JtYXRzKFxuICAgIGNvbnRleHQ6IFVwbG9hZENvbnRleHRcbik6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBmb3JtYXRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgICAvLyBIaWdoZXN0LWNvbmZpZGVuY2Ugc291cmNlOiBIVE1MIGFjY2VwdCBhdHRyaWJ1dGVcbiAgICBpZiAoY29udGV4dC5hY2NlcHQpIHtcbiAgICAgICAgY29uc3QgYWNjZXB0UGFydHMgPSBjb250ZXh0LmFjY2VwdC5zcGxpdCgnLCcpO1xuXG4gICAgICAgIGZvciAoY29uc3QgcGFydCBvZiBhY2NlcHRQYXJ0cykge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBwYXJ0LnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgICBpZiAodmFsdWUuc3RhcnRzV2l0aCgnLicpKSB7XG4gICAgICAgICAgICAgICAgZm9ybWF0cy5hZGQodmFsdWUuc2xpY2UoMSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09ICdpbWFnZS9qcGVnJykge1xuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKCdqcGcnKTtcbiAgICAgICAgICAgICAgICBmb3JtYXRzLmFkZCgnanBlZycpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09ICdpbWFnZS9wbmcnKSB7XG4gICAgICAgICAgICAgICAgZm9ybWF0cy5hZGQoJ3BuZycpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09ICdpbWFnZS93ZWJwJykge1xuICAgICAgICAgICAgICAgIGZvcm1hdHMuYWRkKCd3ZWJwJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJ2FwcGxpY2F0aW9uL3BkZicpIHtcbiAgICAgICAgICAgICAgICBmb3JtYXRzLmFkZCgncGRmJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTZWNvbmQgc291cmNlOiBuZWFyYnkgaW5zdHJ1Y3Rpb25zXG4gICAgY29uc3QgdGV4dCA9IGNvbnRleHQubmVhcmJ5VGV4dC50b0xvd2VyQ2FzZSgpO1xuXG4gICAgY29uc3Qga25vd25Gb3JtYXRzID0gW1xuICAgICAgICAnanBnJyxcbiAgICAgICAgJ2pwZWcnLFxuICAgICAgICAncG5nJyxcbiAgICAgICAgJ3dlYnAnLFxuICAgICAgICAncGRmJyxcbiAgICBdO1xuXG4gICAgZm9yIChjb25zdCBmb3JtYXQgb2Yga25vd25Gb3JtYXRzKSB7XG4gICAgICAgIGNvbnN0IHBhdHRlcm4gPSBuZXcgUmVnRXhwKFxuICAgICAgICAgICAgYFxcXFxiJHtmb3JtYXR9XFxcXGJgLFxuICAgICAgICAgICAgJ2knXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKHBhdHRlcm4udGVzdCh0ZXh0KSkge1xuICAgICAgICAgICAgZm9ybWF0cy5hZGQoZm9ybWF0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBBcnJheS5mcm9tKGZvcm1hdHMpO1xufSIsImltcG9ydCB0eXBlIHsgVXBsb2FkQ29uc3RyYWludHMgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRGltZW5zaW9ucyhcbiAgICB0ZXh0OiBzdHJpbmdcbik6IFVwbG9hZENvbnN0cmFpbnRzWydkaW1lbnNpb25zJ10gfCB1bmRlZmluZWQge1xuXG4gICAgY29uc3Qgbm9ybWFsaXplZFRleHQgPSB0ZXh0XG4gICAgICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJylcbiAgICAgICAgLnRyaW0oKTtcblxuICAgIC8vIEV4YW1wbGVzOlxuICAgIC8vIERpbWVuc2lvbnM6IDIwMCB4IDIzMCBwaXhlbHNcbiAgICAvLyAyMDB4MjMwIHB4XG4gICAgLy8gMjAwIMOXIDIzMCBwaXhlbHNcbiAgICAvLyBJbWFnZSBzaXplOiAyMDAgWCAyMzBcblxuICAgIGNvbnN0IHBhdHRlcm5zID0gW1xuICAgICAgICAvKD86ZGltZW5zaW9ucz98aW1hZ2VcXHMrZGltZW5zaW9ucz98aW1hZ2VcXHMrc2l6ZSlcXHMqOj9cXHMqKFxcZCspXFxzKlt4w5ddXFxzKihcXGQrKVxccyooPzpweHxwaXhlbHM/KT8vaSxcblxuICAgICAgICAvKFxcZCspXFxzKlt4w5ddXFxzKihcXGQrKVxccyooPzpweHxwaXhlbHM/KS9pLFxuICAgIF07XG5cbiAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcGF0dGVybnMpIHtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBub3JtYWxpemVkVGV4dC5tYXRjaChwYXR0ZXJuKTtcblxuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gbWF0Y2hbMV07XG4gICAgICAgICAgICBjb25zdCBoZWlnaHQgPSBtYXRjaFsyXTtcblxuICAgICAgICAgICAgaWYgKCF3aWR0aCB8fCAhaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgd2lkdGg6IE51bWJlci5wYXJzZUludCh3aWR0aCwgMTApLFxuICAgICAgICAgICAgICAgIGhlaWdodDogTnVtYmVyLnBhcnNlSW50KGhlaWdodCwgMTApLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59IiwiaW1wb3J0IHR5cGUgeyBVcGxvYWRDb250ZXh0IH0gZnJvbSAnLi4vZGV0ZWN0b3IvZXh0cmFjdFVwbG9hZENvbnRleHQnO1xuaW1wb3J0IHR5cGUgeyBVcGxvYWRDb25zdHJhaW50cyB9IGZyb20gJy4vdHlwZXMnO1xuXG5pbXBvcnQgeyBwYXJzZUZpbGVTaXplIH0gZnJvbSAnLi9wYXJzZUZpbGVTaXplJztcbmltcG9ydCB7IHBhcnNlRm9ybWF0cyB9IGZyb20gJy4vcGFyc2VGb3JtYXRzJztcbmltcG9ydCB7IHBhcnNlRGltZW5zaW9ucyB9IGZyb20gJy4vcGFyc2VEaW1lbnNpb25zJztcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ29uc3RyYWludHMoXG4gICAgY29udGV4dDogVXBsb2FkQ29udGV4dFxuKTogVXBsb2FkQ29uc3RyYWludHMge1xuICAgIGNvbnN0IHNpemVDb25zdHJhaW50cyA9IHBhcnNlRmlsZVNpemUoY29udGV4dC5uZWFyYnlUZXh0KTtcbiAgICBjb25zdCBhbGxvd2VkRm9ybWF0cyA9IHBhcnNlRm9ybWF0cyhjb250ZXh0KTtcbiAgICBjb25zdCBkaW1lbnNpb25zID0gcGFyc2VEaW1lbnNpb25zKGNvbnRleHQubmVhcmJ5VGV4dCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAuLi5zaXplQ29uc3RyYWludHMsXG5cbiAgICAgICAgLi4uKGFsbG93ZWRGb3JtYXRzLmxlbmd0aCA+IDAgJiYge1xuICAgICAgICAgICAgYWxsb3dlZEZvcm1hdHMsXG4gICAgICAgIH0pLFxuXG4gICAgICAgIC4uLihkaW1lbnNpb25zICYmIHtcbiAgICAgICAgICAgIGRpbWVuc2lvbnMsXG4gICAgICAgIH0pLFxuICAgIH07XG59IiwiZXhwb3J0IGludGVyZmFjZSBVcGxvYWRDb250ZXh0IHtcbiAgICBsYWJlbDogc3RyaW5nIHwgbnVsbDtcbiAgICBuZWFyYnlUZXh0OiBzdHJpbmc7XG4gICAgYWNjZXB0OiBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFVwbG9hZENvbnRleHQoXG4gICAgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnRcbik6IFVwbG9hZENvbnRleHQge1xuICAgIGxldCBsYWJlbDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgICAvLyBGaW5kIDxsYWJlbCBmb3I9XCJpbnB1dC1pZFwiPlxuICAgIGlmIChpbnB1dC5pZCkge1xuICAgICAgICBjb25zdCBsYWJlbEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxMYWJlbEVsZW1lbnQ+KFxuICAgICAgICAgICAgYGxhYmVsW2Zvcj1cIiR7Q1NTLmVzY2FwZShpbnB1dC5pZCl9XCJdYFxuICAgICAgICApO1xuXG4gICAgICAgIGxhYmVsID0gbGFiZWxFbGVtZW50Py50ZXh0Q29udGVudD8udHJpbSgpIHx8IG51bGw7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIGlucHV0cyB3cmFwcGVkIGluc2lkZSA8bGFiZWw+XG4gICAgaWYgKCFsYWJlbCkge1xuICAgICAgICBjb25zdCBwYXJlbnRMYWJlbCA9IGlucHV0LmNsb3Nlc3QoJ2xhYmVsJyk7XG5cbiAgICAgICAgbGFiZWwgPSBwYXJlbnRMYWJlbD8udGV4dENvbnRlbnQ/LnRyaW0oKSB8fCBudWxsO1xuICAgIH1cblxuICAgIC8vIEZvciBub3csIGluc3BlY3QgdGhlIGlucHV0J3MgcGFyZW50IGNvbnRhaW5lci5cbiAgICBjb25zdCBwYXJlbnQgPSBpbnB1dC5wYXJlbnRFbGVtZW50O1xuXG4gICAgY29uc3QgbmVhcmJ5VGV4dCA9XG4gICAgICAgIHBhcmVudD8uaW5uZXJUZXh0XG4gICAgICAgICAgICA/LnJlcGxhY2UoL1xccysvZywgJyAnKVxuICAgICAgICAgICAgLnRyaW0oKSB8fCAnJztcblxuICAgIHJldHVybiB7XG4gICAgICAgIGxhYmVsLFxuICAgICAgICBuZWFyYnlUZXh0LFxuICAgICAgICBhY2NlcHQ6IGlucHV0LmdldEF0dHJpYnV0ZSgnYWNjZXB0JyksXG4gICAgfTtcbn0iLCJleHBvcnQgaW50ZXJmYWNlIEZpbGVJbmZvIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgbWltZVR5cGU6IHN0cmluZztcbiAgICBzaXplQnl0ZXM6IG51bWJlcjtcbiAgICBleHRlbnNpb246IHN0cmluZztcbiAgICB3aWR0aD86IG51bWJlcjtcbiAgICBoZWlnaHQ/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnNwZWN0RmlsZShmaWxlOiBGaWxlKTogUHJvbWlzZTxGaWxlSW5mbz4ge1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGdldEV4dGVuc2lvbihmaWxlLm5hbWUpO1xuXG4gICAgY29uc3QgaW5mbzogRmlsZUluZm8gPSB7XG4gICAgICAgIG5hbWU6IGZpbGUubmFtZSxcbiAgICAgICAgbWltZVR5cGU6IGZpbGUudHlwZSxcbiAgICAgICAgc2l6ZUJ5dGVzOiBmaWxlLnNpemUsXG4gICAgICAgIGV4dGVuc2lvbixcbiAgICB9O1xuXG4gICAgaWYgKGZpbGUudHlwZS5zdGFydHNXaXRoKCdpbWFnZS8nKSkge1xuICAgICAgICBjb25zdCBkaW1lbnNpb25zID0gYXdhaXQgZ2V0SW1hZ2VEaW1lbnNpb25zKGZpbGUpO1xuXG4gICAgICAgIGluZm8ud2lkdGggPSBkaW1lbnNpb25zLndpZHRoO1xuICAgICAgICBpbmZvLmhlaWdodCA9IGRpbWVuc2lvbnMuaGVpZ2h0O1xuICAgIH1cblxuICAgIHJldHVybiBpbmZvO1xufVxuXG5mdW5jdGlvbiBnZXRFeHRlbnNpb24oZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgbGFzdERvdCA9IGZpbGVOYW1lLmxhc3RJbmRleE9mKCcuJyk7XG5cbiAgICBpZiAobGFzdERvdCA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIHJldHVybiBmaWxlTmFtZVxuICAgICAgICAuc2xpY2UobGFzdERvdCArIDEpXG4gICAgICAgIC50b0xvd2VyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiBnZXRJbWFnZURpbWVuc2lvbnMoXG4gICAgZmlsZTogRmlsZVxuKTogUHJvbWlzZTx7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGZpbGUpO1xuICAgICAgICBjb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuXG4gICAgICAgIGltYWdlLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgIHdpZHRoOiBpbWFnZS5uYXR1cmFsV2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBpbWFnZS5uYXR1cmFsSGVpZ2h0LFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpbWFnZS5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignVW5hYmxlIHRvIHJlYWQgaW1hZ2UgZGltZW5zaW9ucy4nKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgaW1hZ2Uuc3JjID0gdXJsO1xuICAgIH0pO1xufSIsImltcG9ydCB0eXBlIHsgVXBsb2FkQ29uc3RyYWludHMgfSBmcm9tICcuLi9wYXJzZXIvdHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBGaWxlSW5mbyB9IGZyb20gJy4uL2luc3BlY3Rvci9pbnNwZWN0RmlsZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmFsaWRhdGlvbklzc3VlIHtcbiAgICB0eXBlOiAnZm9ybWF0JyB8ICdzaXplLXRvby1sYXJnZScgfCAnc2l6ZS10b28tc21hbGwnIHwgJ2RpbWVuc2lvbnMnO1xuICAgIG1lc3NhZ2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICBpc1ZhbGlkOiBib29sZWFuO1xuICAgIGlzc3VlczogVmFsaWRhdGlvbklzc3VlW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUZpbGUoXG4gICAgZmlsZTogRmlsZUluZm8sXG4gICAgY29uc3RyYWludHM6IFVwbG9hZENvbnN0cmFpbnRzXG4pOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICBjb25zdCBpc3N1ZXM6IFZhbGlkYXRpb25Jc3N1ZVtdID0gW107XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gRm9ybWF0XG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgaWYgKFxuICAgICAgICBjb25zdHJhaW50cy5hbGxvd2VkRm9ybWF0cyAmJlxuICAgICAgICBjb25zdHJhaW50cy5hbGxvd2VkRm9ybWF0cy5sZW5ndGggPiAwXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IGZpbGVGb3JtYXQgPSBmaWxlLmV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgIGNvbnN0IGFsbG93ZWQgPSBjb25zdHJhaW50cy5hbGxvd2VkRm9ybWF0cy5zb21lKFxuICAgICAgICAgICAgKGZvcm1hdCkgPT4gZm9ybWF0LnRvTG93ZXJDYXNlKCkgPT09IGZpbGVGb3JtYXRcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIWFsbG93ZWQpIHtcbiAgICAgICAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnZm9ybWF0JyxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBgRmlsZSBmb3JtYXQgXCIke2ZpbGVGb3JtYXR9XCIgaXMgbm90IGFsbG93ZWQuYCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIE1heGltdW0gZmlsZSBzaXplXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgaWYgKFxuICAgICAgICBjb25zdHJhaW50cy5tYXhCeXRlcyAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgIGZpbGUuc2l6ZUJ5dGVzID4gY29uc3RyYWludHMubWF4Qnl0ZXNcbiAgICApIHtcbiAgICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICAgICAgdHlwZTogJ3NpemUtdG9vLWxhcmdlJyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBGaWxlIGlzIHRvbyBsYXJnZS4gTWF4aW11bSBhbGxvd2VkIHNpemUgaXMgJHtmb3JtYXRCeXRlcyhcbiAgICAgICAgICAgICAgICBjb25zdHJhaW50cy5tYXhCeXRlc1xuICAgICAgICAgICAgKX0uYCxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIE1pbmltdW0gZmlsZSBzaXplXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgaWYgKFxuICAgICAgICBjb25zdHJhaW50cy5taW5CeXRlcyAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgIGZpbGUuc2l6ZUJ5dGVzIDwgY29uc3RyYWludHMubWluQnl0ZXNcbiAgICApIHtcbiAgICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICAgICAgdHlwZTogJ3NpemUtdG9vLXNtYWxsJyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBGaWxlIGlzIHRvbyBzbWFsbC4gTWluaW11bSByZXF1aXJlZCBzaXplIGlzICR7Zm9ybWF0Qnl0ZXMoXG4gICAgICAgICAgICAgICAgY29uc3RyYWludHMubWluQnl0ZXNcbiAgICAgICAgICAgICl9LmAsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBEaW1lbnNpb25zXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgaWYgKGNvbnN0cmFpbnRzLmRpbWVuc2lvbnMpIHtcbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBjb25zdHJhaW50cy5kaW1lbnNpb25zO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIGZpbGUud2lkdGggIT09IHdpZHRoIHx8XG4gICAgICAgICAgICBmaWxlLmhlaWdodCAhPT0gaGVpZ2h0XG4gICAgICAgICkge1xuICAgICAgICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdkaW1lbnNpb25zJyxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBgSW1hZ2UgZGltZW5zaW9ucyBtdXN0IGJlICR7d2lkdGh9IMOXICR7aGVpZ2h0fXB4LmAsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGlzVmFsaWQ6IGlzc3Vlcy5sZW5ndGggPT09IDAsXG4gICAgICAgIGlzc3VlcyxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBmb3JtYXRCeXRlcyhieXRlczogbnVtYmVyKTogc3RyaW5nIHtcbiAgICBpZiAoYnl0ZXMgPCAxMDI0KSB7XG4gICAgICAgIHJldHVybiBgJHtieXRlc30gQmA7XG4gICAgfVxuXG4gICAgaWYgKGJ5dGVzIDwgMTAyNCAqIDEwMjQpIHtcbiAgICAgICAgcmV0dXJuIGAke01hdGgucm91bmQoYnl0ZXMgLyAxMDI0KX0gS0JgO1xuICAgIH1cblxuICAgIHJldHVybiBgJHsoYnl0ZXMgLyAoMTAyNCAqIDEwMjQpKS50b0ZpeGVkKDIpfSBNQmA7XG59IiwiaW1wb3J0IHR5cGUgeyBVcGxvYWRDb25zdHJhaW50cyB9IGZyb20gJy4uL3BhcnNlci90eXBlcyc7XG5pbXBvcnQgdHlwZSB7IEZpbGVJbmZvIH0gZnJvbSAnLi4vaW5zcGVjdG9yL2luc3BlY3RGaWxlJztcbmltcG9ydCB0eXBlIHsgVHJhbnNmb3JtYXRpb25QbGFuIH0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUcmFuc2Zvcm1hdGlvblBsYW4oXG4gICAgZmlsZTogRmlsZUluZm8sXG4gICAgY29uc3RyYWludHM6IFVwbG9hZENvbnN0cmFpbnRzXG4pOiBUcmFuc2Zvcm1hdGlvblBsYW4ge1xuICAgIGNvbnN0IHBsYW46IFRyYW5zZm9ybWF0aW9uUGxhbiA9IHt9O1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIEZvcm1hdCBjb252ZXJzaW9uXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgaWYgKFxuICAgICAgICBjb25zdHJhaW50cy5hbGxvd2VkRm9ybWF0cyAmJlxuICAgICAgICBjb25zdHJhaW50cy5hbGxvd2VkRm9ybWF0cy5sZW5ndGggPiAwXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRGb3JtYXQgPSBmaWxlLmV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgIGNvbnN0IGZvcm1hdEFsbG93ZWQgPVxuICAgICAgICAgICAgY29uc3RyYWludHMuYWxsb3dlZEZvcm1hdHMuaW5jbHVkZXMoY3VycmVudEZvcm1hdCk7XG5cbiAgICAgICAgaWYgKCFmb3JtYXRBbGxvd2VkKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRGb3JtYXQgPSBjaG9vc2VUYXJnZXRGb3JtYXQoXG4gICAgICAgICAgICAgICAgY29uc3RyYWludHMuYWxsb3dlZEZvcm1hdHNcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGlmICh0YXJnZXRGb3JtYXQpIHtcbiAgICAgICAgICAgICAgICBwbGFuLmNvbnZlcnRUbyA9IHRhcmdldEZvcm1hdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBEaW1lbnNpb25zXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgaWYgKGNvbnN0cmFpbnRzLmRpbWVuc2lvbnMpIHtcbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBjb25zdHJhaW50cy5kaW1lbnNpb25zO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIGZpbGUud2lkdGggIT09IHdpZHRoIHx8XG4gICAgICAgICAgICBmaWxlLmhlaWdodCAhPT0gaGVpZ2h0XG4gICAgICAgICkge1xuICAgICAgICAgICAgcGxhbi5yZXNpemUgPSB7XG4gICAgICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBGaWxlIHNpemVcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBpZiAoXG4gICAgICAgIGNvbnN0cmFpbnRzLm1heEJ5dGVzICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgZmlsZS5zaXplQnl0ZXMgPiBjb25zdHJhaW50cy5tYXhCeXRlc1xuICAgICkge1xuICAgICAgICBwbGFuLmNvbXByZXNzID0ge1xuICAgICAgICAgICAgbWF4Qnl0ZXM6IGNvbnN0cmFpbnRzLm1heEJ5dGVzLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBwbGFuO1xufVxuXG5mdW5jdGlvbiBjaG9vc2VUYXJnZXRGb3JtYXQoXG4gICAgYWxsb3dlZEZvcm1hdHM6IHN0cmluZ1tdXG4pOiBUcmFuc2Zvcm1hdGlvblBsYW5bJ2NvbnZlcnRUbyddIHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gYWxsb3dlZEZvcm1hdHMubWFwKChmb3JtYXQpID0+XG4gICAgICAgIGZvcm1hdC50b0xvd2VyQ2FzZSgpXG4gICAgKTtcblxuICAgIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKCdqcGVnJykpIHtcbiAgICAgICAgcmV0dXJuICdqcGVnJztcbiAgICB9XG5cbiAgICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcygnanBnJykpIHtcbiAgICAgICAgcmV0dXJuICdqcGVnJztcbiAgICB9XG5cbiAgICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcygncG5nJykpIHtcbiAgICAgICAgcmV0dXJuICdwbmcnO1xuICAgIH1cblxuICAgIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKCd3ZWJwJykpIHtcbiAgICAgICAgcmV0dXJuICd3ZWJwJztcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufSIsImltcG9ydCB7IHBhcnNlQ29uc3RyYWludHMgfSBmcm9tICcuLi9jb3JlL3BhcnNlci9wYXJzZUNvbnN0cmFpbnRzJztcbmltcG9ydCB7IGV4dHJhY3RVcGxvYWRDb250ZXh0IH0gZnJvbSAnLi4vY29yZS9kZXRlY3Rvci9leHRyYWN0VXBsb2FkQ29udGV4dCc7XG5pbXBvcnQgeyBpbnNwZWN0RmlsZSB9IGZyb20gJy4uL2NvcmUvaW5zcGVjdG9yL2luc3BlY3RGaWxlJztcbmltcG9ydCB7IHZhbGlkYXRlRmlsZSB9IGZyb20gJy4uL2NvcmUvdmFsaWRhdG9yL3ZhbGlkYXRlRmlsZSc7XG5pbXBvcnQgeyBjcmVhdGVUcmFuc2Zvcm1hdGlvblBsYW4gfSBmcm9tICcuLi9jb3JlL3BsYW5uZXIvY3JlYXRlVHJhbnNmb3JtYXRpb25QbGFuJztcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbnRlbnRTY3JpcHQoe1xuICBtYXRjaGVzOiBbJzxhbGxfdXJscz4nXSxcblxuICBtYWluKCkge1xuICAgIGNvbnNvbGUubG9nKCdbRmlsZVRocm91Z2hdIENvbnRlbnQgc2NyaXB0IGxvYWRlZCcpO1xuXG4gICAgY29uc3QgZGV0ZWN0ZWRJbnB1dHMgPSBuZXcgV2Vha1NldDxIVE1MSW5wdXRFbGVtZW50PigpO1xuXG4gICAgZnVuY3Rpb24gcmVnaXN0ZXJGaWxlSW5wdXQoaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgICAgIC8vIERvbid0IHByb2Nlc3MgdGhlIHNhbWUgaW5wdXQgdHdpY2VcbiAgICAgIGlmIChkZXRlY3RlZElucHV0cy5oYXMoaW5wdXQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZGV0ZWN0ZWRJbnB1dHMuYWRkKGlucHV0KTtcblxuICAgICAgY29uc29sZS5sb2coJ1tGaWxlVGhyb3VnaF0gVXBsb2FkIGZpZWxkIGRldGVjdGVkJywge1xuICAgICAgICBhY2NlcHQ6IGlucHV0LmFjY2VwdCB8fCAnTm90IHNwZWNpZmllZCcsXG4gICAgICAgIG11bHRpcGxlOiBpbnB1dC5tdWx0aXBsZSxcbiAgICAgICAgbmFtZTogaW5wdXQubmFtZSB8fCAnTm90IHNwZWNpZmllZCcsXG4gICAgICAgIGlkOiBpbnB1dC5pZCB8fCAnTm90IHNwZWNpZmllZCcsXG4gICAgICB9KTtcblxuICAgICAgLy8xLkV4dHJhY3QgY29udGV4dFxuICAgICAgY29uc3QgY29udGV4dCA9IGV4dHJhY3RVcGxvYWRDb250ZXh0KGlucHV0KTtcbiAgICAgIGNvbnNvbGUubG9nKCdbRmlsZVRocm91Z2hdIFVwbG9hZCBjb250ZXh0JywgY29udGV4dCk7XG4gICAgICAvLzIuUGFyc2UgY29uc3RyYWludHNcbiAgICAgIGNvbnN0IGNvbnN0cmFpbnRzID0gcGFyc2VDb25zdHJhaW50cyhjb250ZXh0KTtcblxuICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICdbRmlsZVRocm91Z2hdIFVwbG9hZCBjb25zdHJhaW50cycsXG4gICAgICAgIGNvbnN0cmFpbnRzXG4gICAgICApO1xuICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gaW5wdXQuZmlsZXM/LlswXTtcblxuICAgICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGZpbGVJbmZvID0gYXdhaXQgaW5zcGVjdEZpbGUoZmlsZSk7XG5cbiAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICdbRmlsZVRocm91Z2hdIFNlbGVjdGVkIGZpbGUnLFxuICAgICAgICAgICAgZmlsZUluZm9cbiAgICAgICAgICApO1xuICAgICAgICAgIC8vMy5WYWxpZGF0ZSB0aGUgZmlsZVxuICAgICAgICAgIGNvbnN0IHZhbGlkYXRpb24gPSB2YWxpZGF0ZUZpbGUoZmlsZUluZm8sIGNvbnN0cmFpbnRzKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICdbRmlsZVRocm91Z2hdIFZhbGlkYXRpb24gcmVzdWx0JyxcbiAgICAgICAgICAgIHZhbGlkYXRpb25cbiAgICAgICAgICApO1xuXG4gICAgICAgICAgLy80LkNyZWF0ZSB0cmFuc2Zvcm1hdGlvbiBwbGFuXG4gICAgICAgICAgY29uc3QgcGxhbiA9IGNyZWF0ZVRyYW5zZm9ybWF0aW9uUGxhbihmaWxlSW5mbywgY29uc3RyYWludHMpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgJ1tGaWxlVGhyb3VnaF0gVHJhbnNmb3JtYXRpb24gcGxhbicsXG4gICAgICAgICAgICBwbGFuXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgJ1tGaWxlVGhyb3VnaF0gQ291bGQgbm90IGluc3BlY3QgZmlsZScsXG4gICAgICAgICAgICBlcnJvclxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNjYW5Gb3JGaWxlSW5wdXRzKHJvb3Q6IFBhcmVudE5vZGUgPSBkb2N1bWVudCkge1xuICAgICAgY29uc3QgaW5wdXRzID1cbiAgICAgICAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxJbnB1dEVsZW1lbnQ+KCdpbnB1dFt0eXBlPVwiZmlsZVwiXScpO1xuXG4gICAgICBpbnB1dHMuZm9yRWFjaChyZWdpc3RlckZpbGVJbnB1dCk7XG4gICAgfVxuXG4gICAgLy8gU2NhbiBpbnB1dHMgYWxyZWFkeSBwcmVzZW50IG9uIHRoZSBwYWdlXG4gICAgc2NhbkZvckZpbGVJbnB1dHMoKTtcblxuICAgIC8vIFdhdGNoIGZvciBpbnB1dHMgYWRkZWQgbGF0ZXJcbiAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcbiAgICAgIGZvciAoY29uc3QgbXV0YXRpb24gb2YgbXV0YXRpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBtdXRhdGlvbi5hZGRlZE5vZGVzKSB7XG4gICAgICAgICAgaWYgKCEobm9kZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gVGhlIGFkZGVkIGVsZW1lbnQgaXRzZWxmIG1pZ2h0IGJlIGEgZmlsZSBpbnB1dFxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIG5vZGUgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50ICYmXG4gICAgICAgICAgICBub2RlLnR5cGUgPT09ICdmaWxlJ1xuICAgICAgICAgICkge1xuICAgICAgICAgICAgcmVnaXN0ZXJGaWxlSW5wdXQobm9kZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gT3IgaXQgbWlnaHQgY29udGFpbiBmaWxlIGlucHV0c1xuICAgICAgICAgIHNjYW5Gb3JGaWxlSW5wdXRzKG5vZGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwge1xuICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICB9KTtcbiAgfSxcbn0pOyIsIi8vI3JlZ2lvbiBzcmMvdXRpbHMvaW50ZXJuYWwvbG9nZ2VyLnRzXG5mdW5jdGlvbiBwcmludChtZXRob2QsIC4uLmFyZ3MpIHtcblx0aWYgKGltcG9ydC5tZXRhLmVudi5NT0RFID09PSBcInByb2R1Y3Rpb25cIikgcmV0dXJuO1xuXHRpZiAodHlwZW9mIGFyZ3NbMF0gPT09IFwic3RyaW5nXCIpIG1ldGhvZChgW3d4dF0gJHthcmdzLnNoaWZ0KCl9YCwgLi4uYXJncyk7XG5cdGVsc2UgbWV0aG9kKFwiW3d4dF1cIiwgLi4uYXJncyk7XG59XG4vKiogV3JhcHBlciBhcm91bmQgYGNvbnNvbGVgIHdpdGggYSBcIlt3eHRdXCIgcHJlZml4ICovXG5jb25zdCBsb2dnZXIgPSB7XG5cdGRlYnVnOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5kZWJ1ZywgLi4uYXJncyksXG5cdGxvZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUubG9nLCAuLi5hcmdzKSxcblx0d2FybjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUud2FybiwgLi4uYXJncyksXG5cdGVycm9yOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5lcnJvciwgLi4uYXJncylcbn07XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGxvZ2dlciB9O1xuIiwiLy8gI3JlZ2lvbiBzbmlwcGV0XG5leHBvcnQgY29uc3QgYnJvd3NlciA9IGdsb2JhbFRoaXMuYnJvd3Nlcj8ucnVudGltZT8uaWRcbiAgPyBnbG9iYWxUaGlzLmJyb3dzZXJcbiAgOiBnbG9iYWxUaGlzLmNocm9tZTtcbi8vICNlbmRyZWdpb24gc25pcHBldFxuIiwiaW1wb3J0IHsgYnJvd3NlciBhcyBicm93c2VyJDEgfSBmcm9tIFwiQHd4dC1kZXYvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy9icm93c2VyLnRzXG4vKipcbiogQ29udGFpbnMgdGhlIGBicm93c2VyYCBleHBvcnQgd2hpY2ggeW91IHNob3VsZCB1c2UgdG8gYWNjZXNzIHRoZSBleHRlbnNpb25cbiogQVBJcyBpbiB5b3VyIHByb2plY3Q6XG4qXG4qIGBgYHRzXG4qIGltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICd3eHQvYnJvd3Nlcic7XG4qXG4qIGJyb3dzZXIucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4qICAgLy8gLi4uXG4qIH0pO1xuKiBgYGBcbipcbiogQG1vZHVsZSB3eHQvYnJvd3NlclxuKi9cbmNvbnN0IGJyb3dzZXIgPSBicm93c2VyJDE7XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGJyb3dzZXIgfTtcbiIsImltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvdXRpbHMvaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy50c1xudmFyIFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgPSBjbGFzcyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50IGV4dGVuZHMgRXZlbnQge1xuXHRzdGF0aWMgRVZFTlRfTkFNRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcInd4dDpsb2NhdGlvbmNoYW5nZVwiKTtcblx0Y29uc3RydWN0b3IobmV3VXJsLCBvbGRVcmwpIHtcblx0XHRzdXBlcihXeHRMb2NhdGlvbkNoYW5nZUV2ZW50LkVWRU5UX05BTUUsIHt9KTtcblx0XHR0aGlzLm5ld1VybCA9IG5ld1VybDtcblx0XHR0aGlzLm9sZFVybCA9IG9sZFVybDtcblx0fVxufTtcbi8qKlxuKiBSZXR1cm5zIGFuIGV2ZW50IG5hbWUgdW5pcXVlIHRvIHRoZSBleHRlbnNpb24gYW5kIGNvbnRlbnQgc2NyaXB0IHRoYXQnc1xuKiBydW5uaW5nLlxuKi9cbmZ1bmN0aW9uIGdldFVuaXF1ZUV2ZW50TmFtZShldmVudE5hbWUpIHtcblx0cmV0dXJuIGAke2Jyb3dzZXI/LnJ1bnRpbWU/LmlkfToke2ltcG9ydC5tZXRhLmVudi5FTlRSWVBPSU5UfToke2V2ZW50TmFtZX1gO1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50LCBnZXRVbmlxdWVFdmVudE5hbWUgfTtcbiIsImltcG9ydCB7IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgfSBmcm9tIFwiLi9jdXN0b20tZXZlbnRzLm1qc1wiO1xuLy8jcmVnaW9uIHNyYy91dGlscy9pbnRlcm5hbC9sb2NhdGlvbi13YXRjaGVyLnRzXG5jb25zdCBzdXBwb3J0c05hdmlnYXRpb25BcGkgPSB0eXBlb2YgZ2xvYmFsVGhpcy5uYXZpZ2F0aW9uPy5hZGRFdmVudExpc3RlbmVyID09PSBcImZ1bmN0aW9uXCI7XG4vKipcbiogQ3JlYXRlIGEgdXRpbCB0aGF0IHdhdGNoZXMgZm9yIFVSTCBjaGFuZ2VzLCBkaXNwYXRjaGluZyB0aGUgY3VzdG9tIGV2ZW50IHdoZW5cbiogZGV0ZWN0ZWQuIFN0b3BzIHdhdGNoaW5nIHdoZW4gY29udGVudCBzY3JpcHQgaXMgaW52YWxpZGF0ZWQuIFVzZXMgTmF2aWdhdGlvblxuKiBBUEkgd2hlbiBhdmFpbGFibGUsIG90aGVyd2lzZSBmYWxscyBiYWNrIHRvIHBvbGxpbmcuXG4qL1xuZnVuY3Rpb24gY3JlYXRlTG9jYXRpb25XYXRjaGVyKGN0eCkge1xuXHRsZXQgbGFzdFVybDtcblx0bGV0IHdhdGNoaW5nID0gZmFsc2U7XG5cdHJldHVybiB7IHJ1bigpIHtcblx0XHRpZiAod2F0Y2hpbmcpIHJldHVybjtcblx0XHR3YXRjaGluZyA9IHRydWU7XG5cdFx0bGFzdFVybCA9IG5ldyBVUkwobG9jYXRpb24uaHJlZik7XG5cdFx0aWYgKHN1cHBvcnRzTmF2aWdhdGlvbkFwaSkgZ2xvYmFsVGhpcy5uYXZpZ2F0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJuYXZpZ2F0ZVwiLCAoZXZlbnQpID0+IHtcblx0XHRcdGNvbnN0IG5ld1VybCA9IG5ldyBVUkwoZXZlbnQuZGVzdGluYXRpb24udXJsKTtcblx0XHRcdGlmIChuZXdVcmwuaHJlZiA9PT0gbGFzdFVybC5ocmVmKSByZXR1cm47XG5cdFx0XHR3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgV3h0TG9jYXRpb25DaGFuZ2VFdmVudChuZXdVcmwsIGxhc3RVcmwpKTtcblx0XHRcdGxhc3RVcmwgPSBuZXdVcmw7XG5cdFx0fSwgeyBzaWduYWw6IGN0eC5zaWduYWwgfSk7XG5cdFx0ZWxzZSBjdHguc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0Y29uc3QgbmV3VXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcblx0XHRcdGlmIChuZXdVcmwuaHJlZiAhPT0gbGFzdFVybC5ocmVmKSB7XG5cdFx0XHRcdHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50KG5ld1VybCwgbGFzdFVybCkpO1xuXHRcdFx0XHRsYXN0VXJsID0gbmV3VXJsO1xuXHRcdFx0fVxuXHRcdH0sIDFlMyk7XG5cdH0gfTtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgY3JlYXRlTG9jYXRpb25XYXRjaGVyIH07XG4iLCJpbXBvcnQgeyBsb2dnZXIgfSBmcm9tIFwiLi9pbnRlcm5hbC9sb2dnZXIubWpzXCI7XG5pbXBvcnQgeyBnZXRVbmlxdWVFdmVudE5hbWUgfSBmcm9tIFwiLi9pbnRlcm5hbC9jdXN0b20tZXZlbnRzLm1qc1wiO1xuaW1wb3J0IHsgY3JlYXRlTG9jYXRpb25XYXRjaGVyIH0gZnJvbSBcIi4vaW50ZXJuYWwvbG9jYXRpb24td2F0Y2hlci5tanNcIjtcbmltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbi8vI3JlZ2lvbiBzcmMvdXRpbHMvY29udGVudC1zY3JpcHQtY29udGV4dC50c1xuLyoqXG4qIEltcGxlbWVudHNcbiogW2BBYm9ydENvbnRyb2xsZXJgXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQWJvcnRDb250cm9sbGVyKS5cbiogVXNlZCB0byBkZXRlY3QgYW5kIHN0b3AgY29udGVudCBzY3JpcHQgY29kZSB3aGVuIHRoZSBzY3JpcHQgaXMgaW52YWxpZGF0ZWQuXG4qXG4qIEl0IGFsc28gcHJvdmlkZXMgc2V2ZXJhbCB1dGlsaXRpZXMgbGlrZSBgY3R4LnNldFRpbWVvdXRgIGFuZFxuKiBgY3R4LnNldEludGVydmFsYCB0aGF0IHNob3VsZCBiZSB1c2VkIGluIGNvbnRlbnQgc2NyaXB0cyBpbnN0ZWFkIG9mXG4qIGB3aW5kb3cuc2V0VGltZW91dGAgb3IgYHdpbmRvdy5zZXRJbnRlcnZhbGAuXG4qXG4qIFRvIGNyZWF0ZSBjb250ZXh0IGZvciB0ZXN0aW5nLCB5b3UgY2FuIHVzZSB0aGUgY2xhc3MncyBjb25zdHJ1Y3RvcjpcbipcbiogYGBgdHNcbiogaW1wb3J0IHsgQ29udGVudFNjcmlwdENvbnRleHQgfSBmcm9tICd3eHQvdXRpbHMvY29udGVudC1zY3JpcHRzLWNvbnRleHQnO1xuKlxuKiB0ZXN0KCdzdG9yYWdlIGxpc3RlbmVyIHNob3VsZCBiZSByZW1vdmVkIHdoZW4gY29udGV4dCBpcyBpbnZhbGlkYXRlZCcsICgpID0+IHtcbiogICBjb25zdCBjdHggPSBuZXcgQ29udGVudFNjcmlwdENvbnRleHQoJ3Rlc3QnKTtcbiogICBjb25zdCBpdGVtID0gc3RvcmFnZS5kZWZpbmVJdGVtKCdsb2NhbDpjb3VudCcsIHsgZGVmYXVsdFZhbHVlOiAwIH0pO1xuKiAgIGNvbnN0IHdhdGNoZXIgPSB2aS5mbigpO1xuKlxuKiAgIGNvbnN0IHVud2F0Y2ggPSBpdGVtLndhdGNoKHdhdGNoZXIpO1xuKiAgIGN0eC5vbkludmFsaWRhdGVkKHVud2F0Y2gpOyAvLyBMaXN0ZW4gZm9yIGludmFsaWRhdGUgaGVyZVxuKlxuKiAgIGF3YWl0IGl0ZW0uc2V0VmFsdWUoMSk7XG4qICAgZXhwZWN0KHdhdGNoZXIpLnRvQmVDYWxsZWRUaW1lcygxKTtcbiogICBleHBlY3Qod2F0Y2hlcikudG9CZUNhbGxlZFdpdGgoMSwgMCk7XG4qXG4qICAgY3R4Lm5vdGlmeUludmFsaWRhdGVkKCk7IC8vIFVzZSB0aGlzIGZ1bmN0aW9uIHRvIGludmFsaWRhdGUgdGhlIGNvbnRleHRcbiogICBhd2FpdCBpdGVtLnNldFZhbHVlKDIpO1xuKiAgIGV4cGVjdCh3YXRjaGVyKS50b0JlQ2FsbGVkVGltZXMoMSk7XG4qIH0pO1xuKiBgYGBcbiovXG52YXIgQ29udGVudFNjcmlwdENvbnRleHQgPSBjbGFzcyBDb250ZW50U2NyaXB0Q29udGV4dCB7XG5cdHN0YXRpYyBTQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUgPSBnZXRVbmlxdWVFdmVudE5hbWUoXCJ3eHQ6Y29udGVudC1zY3JpcHQtc3RhcnRlZFwiKTtcblx0aWQ7XG5cdGFib3J0Q29udHJvbGxlcjtcblx0bG9jYXRpb25XYXRjaGVyID0gY3JlYXRlTG9jYXRpb25XYXRjaGVyKHRoaXMpO1xuXHRjb25zdHJ1Y3Rvcihjb250ZW50U2NyaXB0TmFtZSwgb3B0aW9ucykge1xuXHRcdHRoaXMuY29udGVudFNjcmlwdE5hbWUgPSBjb250ZW50U2NyaXB0TmFtZTtcblx0XHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXHRcdHRoaXMuaWQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKTtcblx0XHR0aGlzLmFib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcblx0XHR0aGlzLnN0b3BPbGRTY3JpcHRzKCk7XG5cdFx0dGhpcy5saXN0ZW5Gb3JOZXdlclNjcmlwdHMoKTtcblx0fVxuXHRnZXQgc2lnbmFsKCkge1xuXHRcdHJldHVybiB0aGlzLmFib3J0Q29udHJvbGxlci5zaWduYWw7XG5cdH1cblx0YWJvcnQocmVhc29uKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWJvcnRDb250cm9sbGVyLmFib3J0KHJlYXNvbik7XG5cdH1cblx0Z2V0IGlzSW52YWxpZCgpIHtcblx0XHRpZiAoYnJvd3Nlci5ydW50aW1lPy5pZCA9PSBudWxsKSB0aGlzLm5vdGlmeUludmFsaWRhdGVkKCk7XG5cdFx0cmV0dXJuIHRoaXMuc2lnbmFsLmFib3J0ZWQ7XG5cdH1cblx0Z2V0IGlzVmFsaWQoKSB7XG5cdFx0cmV0dXJuICF0aGlzLmlzSW52YWxpZDtcblx0fVxuXHQvKipcblx0KiBBZGQgYSBsaXN0ZW5lciB0aGF0IGlzIGNhbGxlZCB3aGVuIHRoZSBjb250ZW50IHNjcmlwdCdzIGNvbnRleHQgaXNcblx0KiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIEBleGFtcGxlXG5cdCogICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKGNiKTtcblx0KiAgIGNvbnN0IHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIgPSBjdHgub25JbnZhbGlkYXRlZCgoKSA9PiB7XG5cdCogICAgIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UucmVtb3ZlTGlzdGVuZXIoY2IpO1xuXHQqICAgfSk7XG5cdCogICAvLyAuLi5cblx0KiAgIHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIoKTtcblx0KlxuXHQqIEByZXR1cm5zIEEgZnVuY3Rpb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lci5cblx0Ki9cblx0b25JbnZhbGlkYXRlZChjYikge1xuXHRcdHRoaXMuc2lnbmFsLmFkZEV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBjYik7XG5cdFx0cmV0dXJuICgpID0+IHRoaXMuc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBjYik7XG5cdH1cblx0LyoqXG5cdCogUmV0dXJuIGEgcHJvbWlzZSB0aGF0IG5ldmVyIHJlc29sdmVzLiBVc2VmdWwgaWYgeW91IGhhdmUgYW4gYXN5bmMgZnVuY3Rpb25cblx0KiB0aGF0IHNob3VsZG4ndCBydW4gYWZ0ZXIgdGhlIGNvbnRleHQgaXMgZXhwaXJlZC5cblx0KlxuXHQqIEBleGFtcGxlXG5cdCogICBjb25zdCBnZXRWYWx1ZUZyb21TdG9yYWdlID0gYXN5bmMgKCkgPT4ge1xuXHQqICAgICBpZiAoY3R4LmlzSW52YWxpZCkgcmV0dXJuIGN0eC5ibG9jaygpO1xuXHQqXG5cdCogICAgIC8vIC4uLlxuXHQqICAgfTtcblx0Ki9cblx0YmxvY2soKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKCgpID0+IHt9KTtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnNldEludGVydmFsYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2xlYXJzIHRoZSBpbnRlcnZhbFxuXHQqIHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBJbnRlcnZhbHMgY2FuIGJlIGNsZWFyZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBjbGVhckludGVydmFsYCBmdW5jdGlvbi5cblx0Ki9cblx0c2V0SW50ZXJ2YWwoaGFuZGxlciwgdGltZW91dCkge1xuXHRcdGNvbnN0IGlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgaGFuZGxlcigpO1xuXHRcdH0sIHRpbWVvdXQpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjbGVhckludGVydmFsKGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cuc2V0VGltZW91dGAgdGhhdCBhdXRvbWF0aWNhbGx5IGNsZWFycyB0aGUgaW50ZXJ2YWxcblx0KiB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogVGltZW91dHMgY2FuIGJlIGNsZWFyZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBzZXRUaW1lb3V0YCBmdW5jdGlvbi5cblx0Ki9cblx0c2V0VGltZW91dChoYW5kbGVyLCB0aW1lb3V0KSB7XG5cdFx0Y29uc3QgaWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcblx0XHR9LCB0aW1lb3V0KTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJUaW1lb3V0KGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2FuY2Vsc1xuXHQqIHRoZSByZXF1ZXN0IHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBDYWxsYmFja3MgY2FuIGJlIGNhbmNlbGVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgY2FuY2VsQW5pbWF0aW9uRnJhbWVgXG5cdCogZnVuY3Rpb24uXG5cdCovXG5cdHJlcXVlc3RBbmltYXRpb25GcmFtZShjYWxsYmFjaykge1xuXHRcdGNvbnN0IGlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCguLi5hcmdzKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSBjYWxsYmFjayguLi5hcmdzKTtcblx0XHR9KTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2FuY2VsQW5pbWF0aW9uRnJhbWUoaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5yZXF1ZXN0SWRsZUNhbGxiYWNrYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2FuY2VscyB0aGVcblx0KiByZXF1ZXN0IHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBDYWxsYmFja3MgY2FuIGJlIGNhbmNlbGVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgY2FuY2VsSWRsZUNhbGxiYWNrYFxuXHQqIGZ1bmN0aW9uLlxuXHQqL1xuXHRyZXF1ZXN0SWRsZUNhbGxiYWNrKGNhbGxiYWNrLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgaWQgPSByZXF1ZXN0SWRsZUNhbGxiYWNrKCguLi5hcmdzKSA9PiB7XG5cdFx0XHRpZiAoIXRoaXMuc2lnbmFsLmFib3J0ZWQpIGNhbGxiYWNrKC4uLmFyZ3MpO1xuXHRcdH0sIG9wdGlvbnMpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjYW5jZWxJZGxlQ2FsbGJhY2soaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0YWRkRXZlbnRMaXN0ZW5lcih0YXJnZXQsIHR5cGUsIGhhbmRsZXIsIG9wdGlvbnMpIHtcblx0XHRpZiAodHlwZSA9PT0gXCJ3eHQ6bG9jYXRpb25jaGFuZ2VcIikge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgdGhpcy5sb2NhdGlvbldhdGNoZXIucnVuKCk7XG5cdFx0fVxuXHRcdHRhcmdldC5hZGRFdmVudExpc3RlbmVyPy4odHlwZS5zdGFydHNXaXRoKFwid3h0OlwiKSA/IGdldFVuaXF1ZUV2ZW50TmFtZSh0eXBlKSA6IHR5cGUsIGhhbmRsZXIsIHtcblx0XHRcdC4uLm9wdGlvbnMsXG5cdFx0XHRzaWduYWw6IHRoaXMuc2lnbmFsXG5cdFx0fSk7XG5cdH1cblx0LyoqXG5cdCogQGludGVybmFsXG5cdCogQWJvcnQgdGhlIGFib3J0IGNvbnRyb2xsZXIgYW5kIGV4ZWN1dGUgYWxsIGBvbkludmFsaWRhdGVkYCBsaXN0ZW5lcnMuXG5cdCovXG5cdG5vdGlmeUludmFsaWRhdGVkKCkge1xuXHRcdHRoaXMuYWJvcnQoXCJDb250ZW50IHNjcmlwdCBjb250ZXh0IGludmFsaWRhdGVkXCIpO1xuXHRcdGxvZ2dlci5kZWJ1ZyhgQ29udGVudCBzY3JpcHQgXCIke3RoaXMuY29udGVudFNjcmlwdE5hbWV9XCIgY29udGV4dCBpbnZhbGlkYXRlZGApO1xuXHR9XG5cdHN0b3BPbGRTY3JpcHRzKCkge1xuXHRcdGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSwgeyBkZXRhaWw6IHtcblx0XHRcdGNvbnRlbnRTY3JpcHROYW1lOiB0aGlzLmNvbnRlbnRTY3JpcHROYW1lLFxuXHRcdFx0bWVzc2FnZUlkOiB0aGlzLmlkXG5cdFx0fSB9KSk7XG5cdFx0aWYgKCF0aGlzLm9wdGlvbnM/Lm5vU2NyaXB0U3RhcnRlZFBvc3RNZXNzYWdlKSB3aW5kb3cucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0dHlwZTogQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLFxuXHRcdFx0Y29udGVudFNjcmlwdE5hbWU6IHRoaXMuY29udGVudFNjcmlwdE5hbWUsXG5cdFx0XHRtZXNzYWdlSWQ6IHRoaXMuaWRcblx0XHR9LCBcIipcIik7XG5cdH1cblx0dmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSB7XG5cdFx0Y29uc3QgaXNTYW1lQ29udGVudFNjcmlwdCA9IGV2ZW50LmRldGFpbD8uY29udGVudFNjcmlwdE5hbWUgPT09IHRoaXMuY29udGVudFNjcmlwdE5hbWU7XG5cdFx0Y29uc3QgaXNGcm9tU2VsZiA9IGV2ZW50LmRldGFpbD8ubWVzc2FnZUlkID09PSB0aGlzLmlkO1xuXHRcdHJldHVybiBpc1NhbWVDb250ZW50U2NyaXB0ICYmICFpc0Zyb21TZWxmO1xuXHR9XG5cdGxpc3RlbkZvck5ld2VyU2NyaXB0cygpIHtcblx0XHRjb25zdCBjYiA9IChldmVudCkgPT4ge1xuXHRcdFx0aWYgKCEoZXZlbnQgaW5zdGFuY2VvZiBDdXN0b21FdmVudCkgfHwgIXRoaXMudmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSkgcmV0dXJuO1xuXHRcdFx0dGhpcy5ub3RpZnlJbnZhbGlkYXRlZCgpO1xuXHRcdH07XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIGNiKTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIGNiKSk7XG5cdH1cbn07XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IENvbnRlbnRTY3JpcHRDb250ZXh0IH07XG4iXSwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMTAsMTEsMTIsMTMsMTQsMTVdLCJtYXBwaW5ncyI6Ijs7Q0FDQSxTQUFTLG9CQUFvQixZQUFZO0VBQ3hDLE9BQU87Q0FDUjs7O0NDREEsU0FBUyxRQUFRLE9BQWUsTUFBc0I7RUFHbEQsUUFGdUIsS0FBSyxZQUVwQixHQUFSO0dBQ0ksS0FBSyxNQUNELE9BQU8sS0FBSyxNQUFNLFFBQVEsSUFBSTtHQUVsQyxLQUFLLE1BQ0QsT0FBTyxLQUFLLE1BQU0sUUFBUSxPQUFPLElBQUk7R0FFekMsS0FBSyxNQUNELE9BQU8sS0FBSyxNQUFNLFFBQVEsT0FBTyxPQUFPLElBQUk7R0FFaEQsU0FDSSxPQUFPLEtBQUssTUFBTSxLQUFLO0VBQy9CO0NBQ0o7Q0FFQSxTQUFnQixjQUFjLE1BQWlDO0VBQzNELE1BQU0sU0FBNEIsQ0FBQztFQUVuQyxNQUFNLGlCQUFpQixLQUNsQixRQUFRLFFBQVEsR0FBRyxDQUFDLENBQ3BCLEtBQUs7RUFpQlYsS0FBSyxNQUFNLFdBQVcsQ0FMbEIsZ0ZBRUEsNkVBR2tCLEdBQWU7R0FDakMsTUFBTSxRQUFRLGVBQWUsTUFBTSxPQUFPO0dBRTFDLElBQUksT0FBTztJQUNQLE1BQU0sV0FBVyxNQUFNO0lBQ3ZCLE1BQU0sVUFBVSxNQUFNO0lBQ3RCLE1BQU0sV0FBVyxNQUFNO0lBQ3ZCLE1BQU0sVUFBVSxNQUFNO0lBRXRCLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxTQUN2QztJQUdKLE9BQU8sV0FBVyxRQUNkLE9BQU8sV0FBVyxRQUFRLEdBQzFCLE9BQ0o7SUFFQSxP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