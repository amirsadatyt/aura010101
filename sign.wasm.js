var createSIGNativeCaller = (() => {
    var _scriptDir = import.meta.url;
    return (function (createSIGNativeCaller) {
        createSIGNativeCaller = createSIGNativeCaller || {};
        var Module = typeof createSIGNativeCaller != "undefined" ? createSIGNativeCaller : {};
        var readyPromiseResolve, readyPromiseReject;
        Module["ready"] = new Promise(function (resolve, reject) { readyPromiseResolve = resolve; readyPromiseReject = reject; });
        var moduleOverrides = Object.assign({}, Module);
        var arguments_ = [];
        var thisProgram = "./this.program";
        var quit_ = (status, toThrow) => { throw toThrow; };
        var ENVIRONMENT_IS_WEB = typeof window == "object";
        var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
        var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";
        var scriptDirectory = "";
        function locateFile(path) { if (Module["locateFile"]) {
            return Module["locateFile"](path, scriptDirectory);
        } return scriptDirectory + path; }
        var read_, readAsync, readBinary, setWindowTitle;
        function logExceptionOnExit(e) { if (e instanceof ExitStatus)
            return; let toLog = e; err("exiting due to exception: " + toLog); }
        var fs;
        var nodePath;
        var requireNodeFS;
        if (ENVIRONMENT_IS_NODE) {
            if (ENVIRONMENT_IS_WORKER) {
                scriptDirectory = require("path").dirname(scriptDirectory) + "/";
            }
            else {
                scriptDirectory = __dirname + "/";
            }
            requireNodeFS = (() => { if (!nodePath) {
                fs = require("fs");
                nodePath = require("path");
            } });
            read_ = function shell_read(filename, binary) { requireNodeFS(); filename = nodePath["normalize"](filename); return fs.readFileSync(new URL(filename), binary ? undefined : "utf8"); };
            readBinary = (filename => { var ret = read_(filename, true); if (!ret.buffer) {
                ret = new Uint8Array(ret);
            } return ret; });
            readAsync = ((filename, onload, onerror) => { requireNodeFS(); filename = nodePath["normalize"](filename); fs.readFile(filename, function (err, data) { if (err)
                onerror(err);
            else
                onload(data.buffer); }); });
            if (process["argv"].length > 1) {
                thisProgram = process["argv"][1].replace(/\\/g, "/");
            }
            arguments_ = process["argv"].slice(2);
            process["on"]("uncaughtException", function (ex) { if (!(ex instanceof ExitStatus)) {
                throw ex;
            } });
            process["on"]("unhandledRejection", function (reason) { throw reason; });
            quit_ = ((status, toThrow) => { if (keepRuntimeAlive()) {
                process["exitCode"] = status;
                throw toThrow;
            } logExceptionOnExit(toThrow); process["exit"](status); });
            Module["inspect"] = function () { return "[Emscripten Module object]"; };
        }
        else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
            if (ENVIRONMENT_IS_WORKER) {
                scriptDirectory = self.location.href;
            }
            else if (typeof document != "undefined" && document.currentScript) {
                scriptDirectory = document.currentScript.src;
            }
            if (_scriptDir) {
                scriptDirectory = _scriptDir;
            }
            if (scriptDirectory.indexOf("blob:") !== 0) {
                scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
            }
            else {
                scriptDirectory = "";
            }
            {
                read_ = (url => { var xhr = new XMLHttpRequest; xhr.open("GET", url, false); xhr.send(null); return xhr.responseText; });
                if (ENVIRONMENT_IS_WORKER) {
                    readBinary = (url => { var xhr = new XMLHttpRequest; xhr.open("GET", url, false); xhr.responseType = "arraybuffer"; xhr.send(null); return new Uint8Array(xhr.response); });
                }
                readAsync = ((url, onload, onerror) => { var xhr = new XMLHttpRequest; xhr.open("GET", url, true); xhr.responseType = "arraybuffer"; xhr.onload = (() => { if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                    onload(xhr.response);
                    return;
                } onerror(); }); xhr.onerror = onerror; xhr.send(null); });
            }
            setWindowTitle = (title => document.title = title);
        }
        else { }
        var out = console.log.bind(console);
        var err = console.warn.bind(console);
        Object.assign(Module, moduleOverrides);
        moduleOverrides = null;
        var wasmBinary;
        var noExitRuntime = true;
        if (typeof WebAssembly != "object") {
            abort("no native wasm support detected");
        }
        var wasmMemory;
        var ABORT = false;
        var EXITSTATUS;
        function assert(condition, text) { if (!condition) {
            abort(text);
        } }
        function getCFunc(ident) { var func = Module["_" + ident]; return func; }
        function ccall(ident, returnType, argTypes, args, opts) { var toC = { "string": function (str) { var ret = 0; if (str !== null && str !== undefined && str !== 0) {
                var len = (str.length << 2) + 1;
                ret = stackAlloc(len);
                stringToUTF8(str, ret, len);
            } return ret; }, "array": function (arr) { var ret = stackAlloc(arr.length); writeArrayToMemory(arr, ret); return ret; } }; function convertReturnValue(ret) { if (returnType === "string")
            return UTF8ToString(ret); if (returnType === "boolean")
            return Boolean(ret); return ret; } var func = getCFunc(ident); var cArgs = []; var stack = 0; if (args) {
            for (var i = 0; i < args.length; i++) {
                var converter = toC[argTypes[i]];
                if (converter) {
                    if (stack === 0)
                        stack = stackSave();
                    cArgs[i] = converter(args[i]);
                }
                else {
                    cArgs[i] = args[i];
                }
            }
        } var ret = func.apply(null, cArgs); function onDone(ret) { runtimeKeepalivePop(); if (stack !== 0)
            stackRestore(stack); return convertReturnValue(ret); } runtimeKeepalivePush(); var asyncMode = opts && opts.async; if (Asyncify.currData) {
            return Asyncify.whenDone().then(onDone);
        } ret = onDone(ret); if (asyncMode)
            return Promise.resolve(ret); return ret; }
        var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;
        function UTF8ArrayToString(heap, idx, maxBytesToRead) { var endIdx = idx + maxBytesToRead; var endPtr = idx; while (heap[endPtr] && !(endPtr >= endIdx))
            ++endPtr; if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
            return UTF8Decoder.decode(heap.subarray(idx, endPtr));
        }
        else {
            var str = "";
            while (idx < endPtr) {
                var u0 = heap[idx++];
                if (!(u0 & 128)) {
                    str += String.fromCharCode(u0);
                    continue;
                }
                var u1 = heap[idx++] & 63;
                if ((u0 & 224) == 192) {
                    str += String.fromCharCode((u0 & 31) << 6 | u1);
                    continue;
                }
                var u2 = heap[idx++] & 63;
                if ((u0 & 240) == 224) {
                    u0 = (u0 & 15) << 12 | u1 << 6 | u2;
                }
                else {
                    u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63;
                }
                if (u0 < 65536) {
                    str += String.fromCharCode(u0);
                }
                else {
                    var ch = u0 - 65536;
                    str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
                }
            }
        } return str; }
        function UTF8ToString(ptr, maxBytesToRead) { return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""; }
        function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) { if (!(maxBytesToWrite > 0))
            return 0; var startIdx = outIdx; var endIdx = outIdx + maxBytesToWrite - 1; for (var i = 0; i < str.length; ++i) {
            var u = str.charCodeAt(i);
            if (u >= 55296 && u <= 57343) {
                var u1 = str.charCodeAt(++i);
                u = 65536 + ((u & 1023) << 10) | u1 & 1023;
            }
            if (u <= 127) {
                if (outIdx >= endIdx)
                    break;
                heap[outIdx++] = u;
            }
            else if (u <= 2047) {
                if (outIdx + 1 >= endIdx)
                    break;
                heap[outIdx++] = 192 | u >> 6;
                heap[outIdx++] = 128 | u & 63;
            }
            else if (u <= 65535) {
                if (outIdx + 2 >= endIdx)
                    break;
                heap[outIdx++] = 224 | u >> 12;
                heap[outIdx++] = 128 | u >> 6 & 63;
                heap[outIdx++] = 128 | u & 63;
            }
            else {
                if (outIdx + 3 >= endIdx)
                    break;
                heap[outIdx++] = 240 | u >> 18;
                heap[outIdx++] = 128 | u >> 12 & 63;
                heap[outIdx++] = 128 | u >> 6 & 63;
                heap[outIdx++] = 128 | u & 63;
            }
        } heap[outIdx] = 0; return outIdx - startIdx; }
        function stringToUTF8(str, outPtr, maxBytesToWrite) { return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite); }
        function writeArrayToMemory(array, buffer) { HEAP8.set(array, buffer); }
        var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
        function updateGlobalBufferAndViews(buf) { buffer = buf; Module["HEAP8"] = HEAP8 = new Int8Array(buf); Module["HEAP16"] = HEAP16 = new Int16Array(buf); Module["HEAP32"] = HEAP32 = new Int32Array(buf); Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf); Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf); Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf); Module["HEAPF32"] = HEAPF32 = new Float32Array(buf); Module["HEAPF64"] = HEAPF64 = new Float64Array(buf); }
        var wasmTable;
        var __ATPRERUN__ = [];
        var __ATINIT__ = [];
        var __ATPOSTRUN__ = [];
        var runtimeInitialized = false;
        var runtimeExited = false;
        var runtimeKeepaliveCounter = 0;
        function keepRuntimeAlive() { return noExitRuntime || runtimeKeepaliveCounter > 0; }
        function preRun() { callRuntimeCallbacks(__ATPRERUN__); }
        function initRuntime() { runtimeInitialized = true; callRuntimeCallbacks(__ATINIT__); }
        function exitRuntime() { runtimeExited = true; }
        function postRun() { callRuntimeCallbacks(__ATPOSTRUN__); }
        function addOnInit(cb) { __ATINIT__.unshift(cb); }
        var runDependencies = 0;
        var runDependencyWatcher = null;
        var dependenciesFulfilled = null;
        function addRunDependency(id) { runDependencies++; }
        function removeRunDependency(id) { runDependencies--; if (runDependencies == 0) {
            if (runDependencyWatcher !== null) {
                clearInterval(runDependencyWatcher);
                runDependencyWatcher = null;
            }
            if (dependenciesFulfilled) {
                var callback = dependenciesFulfilled;
                dependenciesFulfilled = null;
                callback();
            }
        } }
        Module["preloadedImages"] = {};
        Module["preloadedAudios"] = {};
        function abort(what) { what = "Aborted(" + what + ")"; err(what); ABORT = true; EXITSTATUS = 1; what += ". Build with -s ASSERTIONS=1 for more info."; var e = new WebAssembly.RuntimeError(what); readyPromiseReject(e); throw e; }
        var dataURIPrefix = "data:application/octet-stream;base64,";
        function isDataURI(filename) { return filename.startsWith(dataURIPrefix); }
        function isFileURI(filename) { return filename.startsWith("file://"); }
        var wasmBinaryFile;
        if (Module["locateFile"]) {
            wasmBinaryFile = "sign.wasm.wasm";
            if (!isDataURI(wasmBinaryFile)) {
                wasmBinaryFile = locateFile(wasmBinaryFile);
            }
        }
        else {
            wasmBinaryFile = new URL("sign.wasm.wasm", import.meta.url).toString();
        }
        function getBinary(file) { try {
            if (file == wasmBinaryFile && wasmBinary) {
                return new Uint8Array(wasmBinary);
            }
            if (readBinary) {
                return readBinary(file);
            }
            else {
                throw "both async and sync fetching of the wasm failed";
            }
        }
        catch (err) {
            abort(err);
        } }
        function getBinaryPromise() { if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
            if (typeof fetch == "function" && !isFileURI(wasmBinaryFile)) {
                return fetch(wasmBinaryFile, { credentials: "same-origin" }).then(function (response) { if (!response["ok"]) {
                    throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
                } return response["arrayBuffer"](); }).catch(function () { return getBinary(wasmBinaryFile); });
            }
            else {
                if (readAsync) {
                    return new Promise(function (resolve, reject) { readAsync(wasmBinaryFile, function (response) { resolve(new Uint8Array(response)); }, reject); });
                }
            }
        } return Promise.resolve().then(function () { return getBinary(wasmBinaryFile); }); }
        function createWasm() { var info = { "a": asmLibraryArg }; function receiveInstance(instance, module) { var exports = instance.exports; exports = Asyncify.instrumentWasmExports(exports); Module["asm"] = exports; wasmMemory = Module["asm"]["f"]; updateGlobalBufferAndViews(wasmMemory.buffer); wasmTable = Module["asm"]["j"]; addOnInit(Module["asm"]["g"]); removeRunDependency("wasm-instantiate"); } addRunDependency("wasm-instantiate"); function receiveInstantiationResult(result) { receiveInstance(result["instance"]); } function instantiateArrayBuffer(receiver) { return getBinaryPromise().then(function (binary) { return WebAssembly.instantiate(binary, info); }).then(function (instance) { return instance; }).then(receiver, function (reason) { err("failed to asynchronously prepare wasm: " + reason); abort(reason); }); } function instantiateAsync() { if (!wasmBinary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(wasmBinaryFile) && !isFileURI(wasmBinaryFile) && typeof fetch == "function") {
            return fetch(wasmBinaryFile, { credentials: "same-origin" }).then(function (response) { var result = WebAssembly.instantiateStreaming(response, info); return result.then(receiveInstantiationResult, function (reason) { err("wasm streaming compile failed: " + reason); err("falling back to ArrayBuffer instantiation"); return instantiateArrayBuffer(receiveInstantiationResult); }); });
        }
        else {
            return instantiateArrayBuffer(receiveInstantiationResult);
        } } if (Module["instantiateWasm"]) {
            try {
                var exports = Module["instantiateWasm"](info, receiveInstance);
                exports = Asyncify.instrumentWasmExports(exports);
                return exports;
            }
            catch (e) {
                err("Module.instantiateWasm callback failed with error: " + e);
                return false;
            }
        } instantiateAsync().catch(readyPromiseReject); return {}; }
        var ASM_CONSTS = { 30900: function () { return Module.getRandomValue(); }, 30936: function () { if (Module.getRandomValue === undefined) {
                try {
                    var window_ = "object" === typeof window ? window : self;
                    var crypto_ = typeof window_.crypto !== "undefined" ? window_.crypto : window_.msCrypto;
                    var randomValuesStandard = function () { var buf = new Uint32Array(1); crypto_.getRandomValues(buf); return buf[0] >>> 0; };
                    randomValuesStandard();
                    Module.getRandomValue = randomValuesStandard;
                }
                catch (e) {
                    try {
                        var crypto = require("crypto");
                        var randomValueNodeJS = function () { var buf = crypto["randomBytes"](4); return (buf[0] << 24 | buf[1] << 16 | buf[2] << 8 | buf[3]) >>> 0; };
                        randomValueNodeJS();
                        Module.getRandomValue = randomValueNodeJS;
                    }
                    catch (e) {
                        throw "No secure random number generator found";
                    }
                }
            } } };
        function __asyncjs__aes_ctr_subtle_crypto(output, output_len, input, nblocks, iv, sk, sk_len) { return Asyncify.handleAsync(async () => { const inputJs = new Uint8Array(new Uint8Array(Module.HEAPU8.buffer, input, nblocks << 4)); const skJs = new Uint8Array(new Uint8Array(Module.HEAPU8.buffer, sk, sk_len)); const ivJs = new Uint8Array(new Uint8Array(Module.HEAPU8.buffer, iv, 16)); const key = await Module.subtleCrypto.importKey("raw", skJs.buffer, "AES-CTR", false, ["encrypt"]); const outputJs = await Module.subtleCrypto.encrypt({ name: "AES-CTR", counter: ivJs.buffer, length: 32 }, key, inputJs.buffer); writeArrayToMemory(new Uint8Array(outputJs).slice(0, output_len), output); }); }
        function __asyncjs__sha256_subtle_crypto(output, input, inlen) { return Asyncify.handleAsync(async () => { const inputJs = new Uint8Array(new Uint8Array(Module.HEAPU8.buffer, input, inlen)).buffer; const outputJs = await Module.subtleCrypto.digest("SHA-256", inputJs); writeArrayToMemory(new Uint8Array(outputJs), output); }); }
        function __asyncjs__sha384_subtle_crypto(output, input, inlen) { return Asyncify.handleAsync(async () => { const inputJs = new Uint8Array(new Uint8Array(Module.HEAPU8.buffer, input, inlen)).buffer; const outputJs = await Module.subtleCrypto.digest("SHA-384", inputJs); writeArrayToMemory(new Uint8Array(outputJs), output); }); }
        function __asyncjs__sha512_subtle_crypto(output, input, inlen) { return Asyncify.handleAsync(async () => { const inputJs = new Uint8Array(new Uint8Array(Module.HEAPU8.buffer, input, inlen)).buffer; const outputJs = await Module.subtleCrypto.digest("SHA-512", inputJs); writeArrayToMemory(new Uint8Array(outputJs), output); }); }
        function callRuntimeCallbacks(callbacks) { while (callbacks.length > 0) {
            var callback = callbacks.shift();
            if (typeof callback == "function") {
                callback(Module);
                continue;
            }
            var func = callback.func;
            if (typeof func == "number") {
                if (callback.arg === undefined) {
                    (function () { dynCall_v.call(null, func); })();
                }
                else {
                    (function (a1) { dynCall_vi.apply(null, [func, a1]); })(callback.arg);
                }
            }
            else {
                func(callback.arg === undefined ? null : callback.arg);
            }
        } }
        function handleException(e) { if (e instanceof ExitStatus || e == "unwind") {
            return EXITSTATUS;
        } quit_(1, e); }
        function ___assert_fail(condition, filename, line, func) { abort("Assertion failed: " + UTF8ToString(condition) + ", at: " + [filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function"]); }
        var readAsmConstArgsArray = [];
        function readAsmConstArgs(sigPtr, buf) { readAsmConstArgsArray.length = 0; var ch; buf >>= 2; while (ch = HEAPU8[sigPtr++]) {
            var readAsmConstArgsDouble = ch < 105;
            if (readAsmConstArgsDouble && buf & 1)
                buf++;
            readAsmConstArgsArray.push(readAsmConstArgsDouble ? HEAPF64[buf++ >> 1] : HEAP32[buf]);
            ++buf;
        } return readAsmConstArgsArray; }
        function _emscripten_asm_const_int(code, sigPtr, argbuf) { var args = readAsmConstArgs(sigPtr, argbuf); return ASM_CONSTS[code].apply(null, args); }
        function _emscripten_memcpy_big(dest, src, num) { HEAPU8.copyWithin(dest, src, src + num); }
        function abortOnCannotGrowMemory(requestedSize) { abort("OOM"); }
        function _emscripten_resize_heap(requestedSize) { var oldSize = HEAPU8.length; requestedSize = requestedSize >>> 0; abortOnCannotGrowMemory(requestedSize); }
        function _exit(status) { exit(status); }
        function runAndAbortIfError(func) { try {
            return func();
        }
        catch (e) {
            abort(e);
        } }
        function callUserCallback(func, synchronous) { if (runtimeExited || ABORT) {
            return;
        } if (synchronous) {
            func();
            return;
        } try {
            func();
        }
        catch (e) {
            handleException(e);
        } }
        function runtimeKeepalivePush() { runtimeKeepaliveCounter += 1; }
        function runtimeKeepalivePop() { runtimeKeepaliveCounter -= 1; }
        var Asyncify = { State: { Normal: 0, Unwinding: 1, Rewinding: 2, Disabled: 3 }, state: 0, StackSize: 4096, currData: null, handleSleepReturnValue: 0, exportCallStack: [], callStackNameToId: {}, callStackIdToName: {}, callStackId: 0, asyncPromiseHandlers: null, sleepCallbacks: [], getCallStackId: function (funcName) { var id = Asyncify.callStackNameToId[funcName]; if (id === undefined) {
                id = Asyncify.callStackId++;
                Asyncify.callStackNameToId[funcName] = id;
                Asyncify.callStackIdToName[id] = funcName;
            } return id; }, instrumentWasmExports: function (exports) { var ret = {}; for (var x in exports) {
                (function (x) { var original = exports[x]; if (typeof original == "function") {
                    ret[x] = function () { Asyncify.exportCallStack.push(x); try {
                        return original.apply(null, arguments);
                    }
                    finally {
                        if (!ABORT) {
                            var y = Asyncify.exportCallStack.pop();
                            assert(y === x);
                            Asyncify.maybeStopUnwind();
                        }
                    } };
                }
                else {
                    ret[x] = original;
                } })(x);
            } return ret; }, maybeStopUnwind: function () { if (Asyncify.currData && Asyncify.state === Asyncify.State.Unwinding && Asyncify.exportCallStack.length === 0) {
                Asyncify.state = Asyncify.State.Normal;
                runAndAbortIfError(Module["_asyncify_stop_unwind"]);
                if (typeof Fibers != "undefined") {
                    Fibers.trampoline();
                }
            } }, whenDone: function () { return new Promise((resolve, reject) => { Asyncify.asyncPromiseHandlers = { resolve: resolve, reject: reject }; }); }, allocateData: function () { var ptr = _malloc(12 + Asyncify.StackSize); Asyncify.setDataHeader(ptr, ptr + 12, Asyncify.StackSize); Asyncify.setDataRewindFunc(ptr); return ptr; }, setDataHeader: function (ptr, stack, stackSize) { HEAP32[ptr >> 2] = stack; HEAP32[ptr + 4 >> 2] = stack + stackSize; }, setDataRewindFunc: function (ptr) { var bottomOfCallStack = Asyncify.exportCallStack[0]; var rewindId = Asyncify.getCallStackId(bottomOfCallStack); HEAP32[ptr + 8 >> 2] = rewindId; }, getDataRewindFunc: function (ptr) { var id = HEAP32[ptr + 8 >> 2]; var name = Asyncify.callStackIdToName[id]; var func = Module["asm"][name]; return func; }, doRewind: function (ptr) { var start = Asyncify.getDataRewindFunc(ptr); return start(); }, handleSleep: function (startAsync) { if (ABORT)
                return; if (Asyncify.state === Asyncify.State.Normal) {
                var reachedCallback = false;
                var reachedAfterCallback = false;
                startAsync(handleSleepReturnValue => { if (ABORT)
                    return; Asyncify.handleSleepReturnValue = handleSleepReturnValue || 0; reachedCallback = true; if (!reachedAfterCallback) {
                    return;
                } Asyncify.state = Asyncify.State.Rewinding; runAndAbortIfError(() => Module["_asyncify_start_rewind"](Asyncify.currData)); if (typeof Browser != "undefined" && Browser.mainLoop.func) {
                    Browser.mainLoop.resume();
                } var asyncWasmReturnValue, isError = false; try {
                    asyncWasmReturnValue = Asyncify.doRewind(Asyncify.currData);
                }
                catch (err) {
                    asyncWasmReturnValue = err;
                    isError = true;
                } var handled = false; if (!Asyncify.currData) {
                    var asyncPromiseHandlers = Asyncify.asyncPromiseHandlers;
                    if (asyncPromiseHandlers) {
                        Asyncify.asyncPromiseHandlers = null;
                        (isError ? asyncPromiseHandlers.reject : asyncPromiseHandlers.resolve)(asyncWasmReturnValue);
                        handled = true;
                    }
                } if (isError && !handled) {
                    throw asyncWasmReturnValue;
                } });
                reachedAfterCallback = true;
                if (!reachedCallback) {
                    Asyncify.state = Asyncify.State.Unwinding;
                    Asyncify.currData = Asyncify.allocateData();
                    runAndAbortIfError(() => Module["_asyncify_start_unwind"](Asyncify.currData));
                    if (typeof Browser != "undefined" && Browser.mainLoop.func) {
                        Browser.mainLoop.pause();
                    }
                }
            }
            else if (Asyncify.state === Asyncify.State.Rewinding) {
                Asyncify.state = Asyncify.State.Normal;
                runAndAbortIfError(Module["_asyncify_stop_rewind"]);
                _free(Asyncify.currData);
                Asyncify.currData = null;
                Asyncify.sleepCallbacks.forEach(func => callUserCallback(func));
            }
            else {
                abort("invalid state: " + Asyncify.state);
            } return Asyncify.handleSleepReturnValue; }, handleAsync: function (startAsync) { return Asyncify.handleSleep(wakeUp => { startAsync().then(wakeUp); }); } };
        var asmLibraryArg = { "d": ___assert_fail, "__asyncjs__aes_ctr_subtle_crypto": __asyncjs__aes_ctr_subtle_crypto, "__asyncjs__sha256_subtle_crypto": __asyncjs__sha256_subtle_crypto, "__asyncjs__sha384_subtle_crypto": __asyncjs__sha384_subtle_crypto, "__asyncjs__sha512_subtle_crypto": __asyncjs__sha512_subtle_crypto, "a": _emscripten_asm_const_int, "c": _emscripten_memcpy_big, "b": _emscripten_resize_heap, "e": _exit };
        var asm = createWasm();
        var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function () { return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["g"]).apply(null, arguments); };
        var _malloc = Module["_malloc"] = function () { return (_malloc = Module["_malloc"] = Module["asm"]["h"]).apply(null, arguments); };
        var _free = Module["_free"] = function () { return (_free = Module["_free"] = Module["asm"]["i"]).apply(null, arguments); };
        var _sign_init = Module["_sign_init"] = function () { return (_sign_init = Module["_sign_init"] = Module["asm"]["k"]).apply(null, arguments); };
        var _sign_public_key_bytes = Module["_sign_public_key_bytes"] = function () { return (_sign_public_key_bytes = Module["_sign_public_key_bytes"] = Module["asm"]["l"]).apply(null, arguments); };
        var _sign_private_key_bytes = Module["_sign_private_key_bytes"] = function () { return (_sign_private_key_bytes = Module["_sign_private_key_bytes"] = Module["asm"]["m"]).apply(null, arguments); };
        var _sign_signature_bytes = Module["_sign_signature_bytes"] = function () { return (_sign_signature_bytes = Module["_sign_signature_bytes"] = Module["asm"]["n"]).apply(null, arguments); };
        var _sign_keypair = Module["_sign_keypair"] = function () { return (_sign_keypair = Module["_sign_keypair"] = Module["asm"]["o"]).apply(null, arguments); };
        var _sign_signature = Module["_sign_signature"] = function () { return (_sign_signature = Module["_sign_signature"] = Module["asm"]["p"]).apply(null, arguments); };
        var _sign_verify = Module["_sign_verify"] = function () { return (_sign_verify = Module["_sign_verify"] = Module["asm"]["q"]).apply(null, arguments); };
        var stackSave = Module["stackSave"] = function () { return (stackSave = Module["stackSave"] = Module["asm"]["r"]).apply(null, arguments); };
        var stackRestore = Module["stackRestore"] = function () { return (stackRestore = Module["stackRestore"] = Module["asm"]["s"]).apply(null, arguments); };
        var stackAlloc = Module["stackAlloc"] = function () { return (stackAlloc = Module["stackAlloc"] = Module["asm"]["t"]).apply(null, arguments); };
        var _asyncify_start_unwind = Module["_asyncify_start_unwind"] = function () { return (_asyncify_start_unwind = Module["_asyncify_start_unwind"] = Module["asm"]["u"]).apply(null, arguments); };
        var _asyncify_stop_unwind = Module["_asyncify_stop_unwind"] = function () { return (_asyncify_stop_unwind = Module["_asyncify_stop_unwind"] = Module["asm"]["v"]).apply(null, arguments); };
        var _asyncify_start_rewind = Module["_asyncify_start_rewind"] = function () { return (_asyncify_start_rewind = Module["_asyncify_start_rewind"] = Module["asm"]["w"]).apply(null, arguments); };
        var _asyncify_stop_rewind = Module["_asyncify_stop_rewind"] = function () { return (_asyncify_stop_rewind = Module["_asyncify_stop_rewind"] = Module["asm"]["x"]).apply(null, arguments); };
        Module["ccall"] = ccall;
        Module["writeArrayToMemory"] = writeArrayToMemory;
        var calledRun;
        function ExitStatus(status) { this.name = "ExitStatus"; this.message = "Program terminated with exit(" + status + ")"; this.status = status; }
        dependenciesFulfilled = function runCaller() { if (!calledRun)
            run(); if (!calledRun)
            dependenciesFulfilled = runCaller; };
        function run(args) { args = args || arguments_; if (runDependencies > 0) {
            return;
        } preRun(); if (runDependencies > 0) {
            return;
        } function doRun() { if (calledRun)
            return; calledRun = true; Module["calledRun"] = true; if (ABORT)
            return; initRuntime(); readyPromiseResolve(Module); postRun(); } {
            doRun();
        } }
        Module["run"] = run;
        function exit(status, implicit) { EXITSTATUS = status; if (keepRuntimeAlive()) { }
        else {
            exitRuntime();
        } procExit(status); }
        function procExit(code) { EXITSTATUS = code; if (!keepRuntimeAlive()) {
            ABORT = true;
        } quit_(code, new ExitStatus(code)); }
        run();
        return createSIGNativeCaller.ready;
    });
})();
export default createSIGNativeCaller;
