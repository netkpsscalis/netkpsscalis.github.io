// Compiles a dart2wasm-generated main module from `source` which can then
// instantiatable via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm modules from `bytes` which is then
// instantiatable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

// DEPRECATED: Please use `compile` or `compileStreaming` to get a compiled app,
// use `instantiate` method to get an instantiated app and then call
// `invokeMain` to invoke the main function.
export async function instantiate(modulePromise, importObjectPromise) {
  var moduleOrCompiledApp = await modulePromise;
  if (!(moduleOrCompiledApp instanceof CompiledApp)) {
    moduleOrCompiledApp = new CompiledApp(moduleOrCompiledApp);
  }
  const instantiatedApp = await moduleOrCompiledApp.instantiate(await importObjectPromise);
  return instantiatedApp.instantiatedModule;
}

// DEPRECATED: Please use `compile` or `compileStreaming` to get a compiled app,
// use `instantiate` method to get an instantiated app and then call
// `invokeMain` to invoke the main function.
export const invoke = (moduleInstance, ...args) => {
  moduleInstance.exports.$invokeMain(args);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arugments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `load-ids` option is passed. Each load ID maps to one
  //   or more wasm files as specified in the emitted JSON file. It also takes a
  //   callback that should be invoked for each loaded module with 2 arugments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDynamicModule` is a JS function that takes two string names matching,
  //   in order, a wasm file produced by the dart2wasm compiler during dynamic
  //   module compilation and a corresponding js file produced by the same
  //   compilation. It also takes a callback that should be invoked with the
  //   loaded module in a format supported by `WebAssembly.compile` or
  //   `WebAssembly.compileStreaming` and the result of using the JS 'import'
  //   API on the js file path. It should return a Promise that resolves when
  //   all the modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports,
      {loadDeferredModules, loadDynamicModule, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            _1: (decoder, codeUnits) => decoder.decode(codeUnits),
      _2: () => new TextDecoder("utf-8", {fatal: true}),
      _3: () => new TextDecoder("utf-8", {fatal: false}),
      _4: (s) => +s,
      _5: x0 => new Uint8Array(x0),
      _6: (x0,x1,x2) => x0.set(x1,x2),
      _7: (x0,x1) => x0.transferFromImageBitmap(x1),
      _9: (x0,x1,x2) => x0.slice(x1,x2),
      _10: (x0,x1) => x0.decode(x1),
      _11: (x0,x1) => x0.segment(x1),
      _12: () => new TextDecoder(),
      _14: x0 => x0.buffer,
      _15: x0 => x0.wasmMemory,
      _16: () => globalThis.window._flutter_skwasmInstance,
      _17: x0 => x0.rasterStartMilliseconds,
      _18: x0 => x0.rasterEndMilliseconds,
      _19: x0 => x0.imageBitmaps,
      _135: (x0,x1) => x0.appendChild(x1),
      _166: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _167: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      _168: (x0,x1) => new OffscreenCanvas(x0,x1),
      _169: x0 => x0.remove(),
      _170: (x0,x1) => x0.append(x1),
      _172: x0 => x0.unlock(),
      _173: x0 => x0.getReader(),
      _174: (x0,x1) => x0.item(x1),
      _175: x0 => x0.next(),
      _176: x0 => x0.now(),
      _177: (x0,x1) => x0.revokeObjectURL(x1),
      _178: x0 => x0.close(),
      _179: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      _180: x0 => new window.ImageDecoder(x0),
      _181: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      _182: (x0,x1) => x0.decode(x1),
      _183: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._183(f,arguments.length,x0) }),
      _184: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _186: (x0,x1) => x0.getModifierState(x1),
      _187: x0 => x0.preventDefault(),
      _188: x0 => x0.stopPropagation(),
      _189: (x0,x1) => x0.removeProperty(x1),
      _190: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._190(f,arguments.length,x0) }),
      _191: x0 => new window.FinalizationRegistry(x0),
      _192: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      _194: (x0,x1) => x0.unregister(x1),
      _195: (x0,x1) => x0.prepend(x1),
      _196: x0 => new Intl.Locale(x0),
      _197: (x0,x1) => x0.observe(x1),
      _198: x0 => x0.disconnect(),
      _199: (x0,x1) => x0.getAttribute(x1),
      _200: (x0,x1) => x0.contains(x1),
      _201: (x0,x1) => x0.querySelector(x1),
      _202: (x0,x1) => x0.matchMedia(x1),
      _203: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._203(f,arguments.length,x0) }),
      _204: (x0,x1,x2) => x0.call(x1,x2),
      _205: x0 => x0.blur(),
      _206: x0 => x0.hasFocus(),
      _207: (x0,x1) => x0.removeAttribute(x1),
      _208: (x0,x1,x2) => x0.insertBefore(x1,x2),
      _209: (x0,x1) => x0.hasAttribute(x1),
      _210: (x0,x1) => x0.getModifierState(x1),
      _211: (x0,x1) => x0.createTextNode(x1),
      _212: x0 => x0.getBoundingClientRect(),
      _213: (x0,x1) => x0.replaceWith(x1),
      _214: (x0,x1) => x0.contains(x1),
      _215: (x0,x1) => x0.closest(x1),
      _216: () => new Array(),
      _653: x0 => new Uint8Array(x0),
      _656: () => globalThis.window.flutterConfiguration,
      _658: x0 => x0.assetBase,
      _663: x0 => x0.canvasKitMaximumSurfaces,
      _664: x0 => x0.debugShowSemanticsNodes,
      _665: x0 => x0.hostElement,
      _666: x0 => x0.multiViewEnabled,
      _667: x0 => x0.nonce,
      _669: x0 => x0.fontFallbackBaseUrl,
      _679: x0 => x0.console,
      _680: x0 => x0.devicePixelRatio,
      _681: x0 => x0.document,
      _682: x0 => x0.history,
      _683: x0 => x0.innerHeight,
      _684: x0 => x0.innerWidth,
      _685: x0 => x0.location,
      _686: x0 => x0.navigator,
      _687: x0 => x0.visualViewport,
      _688: x0 => x0.performance,
      _689: x0 => x0.parent,
      _691: x0 => x0.URL,
      _693: (x0,x1) => x0.getComputedStyle(x1),
      _694: x0 => x0.screen,
      _695: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._695(f,arguments.length,x0) }),
      _696: (x0,x1) => x0.requestAnimationFrame(x1),
      _700: (x0,x1) => x0.warn(x1),
      _702: (x0,x1) => x0.debug(x1),
      _703: x0 => globalThis.parseFloat(x0),
      _704: () => globalThis.window,
      _705: () => globalThis.Intl,
      _706: () => globalThis.Symbol,
      _707: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      _709: x0 => x0.clipboard,
      _710: x0 => x0.maxTouchPoints,
      _711: x0 => x0.vendor,
      _712: x0 => x0.language,
      _713: x0 => x0.platform,
      _714: x0 => x0.userAgent,
      _715: (x0,x1) => x0.vibrate(x1),
      _716: x0 => x0.languages,
      _717: x0 => x0.documentElement,
      _718: (x0,x1) => x0.querySelector(x1),
      _719: (x0,x1) => x0.querySelectorAll(x1),
      _721: (x0,x1) => x0.createElement(x1),
      _724: (x0,x1) => x0.createEvent(x1),
      _725: x0 => x0.activeElement,
      _728: x0 => x0.head,
      _729: x0 => x0.body,
      _731: (x0,x1) => { x0.title = x1 },
      _734: x0 => x0.visibilityState,
      _735: () => globalThis.document,
      _736: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._736(f,arguments.length,x0) }),
      _737: (x0,x1) => x0.dispatchEvent(x1),
      _745: x0 => x0.target,
      _747: x0 => x0.timeStamp,
      _748: x0 => x0.type,
      _750: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      _757: x0 => x0.firstChild,
      _761: x0 => x0.parentElement,
      _763: (x0,x1) => { x0.textContent = x1 },
      _764: x0 => x0.parentNode,
      _765: x0 => x0.nextSibling,
      _766: (x0,x1) => x0.removeChild(x1),
      _767: x0 => x0.isConnected,
      _775: x0 => x0.clientHeight,
      _776: x0 => x0.clientWidth,
      _777: x0 => x0.offsetHeight,
      _778: x0 => x0.offsetWidth,
      _779: x0 => x0.id,
      _780: (x0,x1) => { x0.id = x1 },
      _783: (x0,x1) => { x0.spellcheck = x1 },
      _784: x0 => x0.tagName,
      _785: x0 => x0.style,
      _787: (x0,x1) => x0.querySelectorAll(x1),
      _788: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _789: x0 => x0.tabIndex,
      _790: (x0,x1) => { x0.tabIndex = x1 },
      _791: (x0,x1) => x0.focus(x1),
      _792: x0 => x0.scrollTop,
      _793: (x0,x1) => { x0.scrollTop = x1 },
      _794: (x0,x1) => { x0.scrollLeft = x1 },
      _795: x0 => x0.scrollLeft,
      _796: x0 => x0.classList,
      _797: (x0,x1) => x0.scrollIntoView(x1),
      _800: (x0,x1) => { x0.className = x1 },
      _802: (x0,x1) => x0.getElementsByClassName(x1),
      _803: x0 => x0.click(),
      _804: (x0,x1) => x0.attachShadow(x1),
      _807: x0 => x0.computedStyleMap(),
      _808: (x0,x1) => x0.get(x1),
      _814: (x0,x1) => x0.getPropertyValue(x1),
      _815: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      _816: x0 => x0.offsetLeft,
      _817: x0 => x0.offsetTop,
      _818: x0 => x0.offsetParent,
      _820: (x0,x1) => { x0.name = x1 },
      _821: x0 => x0.content,
      _822: (x0,x1) => { x0.content = x1 },
      _826: (x0,x1) => { x0.src = x1 },
      _827: x0 => x0.naturalWidth,
      _828: x0 => x0.naturalHeight,
      _832: (x0,x1) => { x0.crossOrigin = x1 },
      _834: (x0,x1) => { x0.decoding = x1 },
      _835: x0 => x0.decode(),
      _840: (x0,x1) => { x0.nonce = x1 },
      _845: (x0,x1) => { x0.width = x1 },
      _847: (x0,x1) => { x0.height = x1 },
      _850: (x0,x1) => x0.getContext(x1),
      _918: x0 => x0.width,
      _919: x0 => x0.height,
      _921: (x0,x1) => x0.fetch(x1),
      _922: x0 => x0.status,
      _924: x0 => x0.body,
      _925: x0 => x0.arrayBuffer(),
      _928: x0 => x0.read(),
      _929: x0 => x0.value,
      _930: x0 => x0.done,
      _937: x0 => x0.name,
      _938: x0 => x0.x,
      _939: x0 => x0.y,
      _942: x0 => x0.top,
      _943: x0 => x0.right,
      _944: x0 => x0.bottom,
      _945: x0 => x0.left,
      _955: x0 => x0.height,
      _956: x0 => x0.width,
      _957: x0 => x0.scale,
      _958: (x0,x1) => { x0.value = x1 },
      _961: (x0,x1) => { x0.placeholder = x1 },
      _963: (x0,x1) => { x0.name = x1 },
      _964: x0 => x0.selectionDirection,
      _965: x0 => x0.selectionStart,
      _966: x0 => x0.selectionEnd,
      _969: x0 => x0.value,
      _971: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _972: x0 => x0.readText(),
      _973: (x0,x1) => x0.writeText(x1),
      _975: x0 => x0.altKey,
      _976: x0 => x0.code,
      _977: x0 => x0.ctrlKey,
      _978: x0 => x0.key,
      _979: x0 => x0.keyCode,
      _980: x0 => x0.location,
      _981: x0 => x0.metaKey,
      _982: x0 => x0.repeat,
      _983: x0 => x0.shiftKey,
      _984: x0 => x0.isComposing,
      _986: x0 => x0.state,
      _987: (x0,x1) => x0.go(x1),
      _989: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      _990: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      _991: x0 => x0.pathname,
      _992: x0 => x0.search,
      _993: x0 => x0.hash,
      _997: x0 => x0.state,
      _1000: (x0,x1) => x0.createObjectURL(x1),
      _1002: x0 => new Blob(x0),
      _1012: x0 => x0.matches,
      _1016: x0 => x0.matches,
      _1020: x0 => x0.relatedTarget,
      _1022: x0 => x0.clientX,
      _1023: x0 => x0.clientY,
      _1024: x0 => x0.offsetX,
      _1025: x0 => x0.offsetY,
      _1028: x0 => x0.button,
      _1029: x0 => x0.buttons,
      _1030: x0 => x0.ctrlKey,
      _1034: x0 => x0.pointerId,
      _1035: x0 => x0.pointerType,
      _1036: x0 => x0.pressure,
      _1037: x0 => x0.tiltX,
      _1038: x0 => x0.tiltY,
      _1039: x0 => x0.getCoalescedEvents(),
      _1042: x0 => x0.deltaX,
      _1043: x0 => x0.deltaY,
      _1044: x0 => x0.wheelDeltaX,
      _1045: x0 => x0.wheelDeltaY,
      _1046: x0 => x0.deltaMode,
      _1053: x0 => x0.changedTouches,
      _1056: x0 => x0.clientX,
      _1057: x0 => x0.clientY,
      _1060: x0 => x0.data,
      _1063: (x0,x1) => { x0.disabled = x1 },
      _1065: (x0,x1) => { x0.type = x1 },
      _1066: (x0,x1) => { x0.max = x1 },
      _1067: (x0,x1) => { x0.min = x1 },
      _1068: x0 => x0.value,
      _1069: (x0,x1) => { x0.value = x1 },
      _1070: x0 => x0.disabled,
      _1071: (x0,x1) => { x0.disabled = x1 },
      _1073: (x0,x1) => { x0.placeholder = x1 },
      _1075: (x0,x1) => { x0.name = x1 },
      _1076: (x0,x1) => { x0.autocomplete = x1 },
      _1078: x0 => x0.selectionDirection,
      _1079: x0 => x0.selectionStart,
      _1081: x0 => x0.selectionEnd,
      _1084: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _1085: (x0,x1) => x0.add(x1),
      _1087: (x0,x1) => { x0.noValidate = x1 },
      _1088: (x0,x1) => { x0.method = x1 },
      _1089: (x0,x1) => { x0.action = x1 },
      _1114: x0 => x0.orientation,
      _1115: x0 => x0.width,
      _1116: x0 => x0.height,
      _1117: (x0,x1) => x0.lock(x1),
      _1136: x0 => new ResizeObserver(x0),
      _1139: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._1139(f,arguments.length,x0,x1) }),
      _1147: x0 => x0.length,
      _1148: x0 => x0.iterator,
      _1149: x0 => x0.Segmenter,
      _1150: x0 => x0.v8BreakIterator,
      _1151: (x0,x1) => new Intl.Segmenter(x0,x1),
      _1154: x0 => x0.language,
      _1155: x0 => x0.script,
      _1156: x0 => x0.region,
      _1174: x0 => x0.done,
      _1175: x0 => x0.value,
      _1176: x0 => x0.index,
      _1180: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      _1181: (x0,x1) => x0.adoptText(x1),
      _1182: x0 => x0.first(),
      _1183: x0 => x0.next(),
      _1184: x0 => x0.current(),
      _1186: () => globalThis.window.FinalizationRegistry,
      _1197: x0 => x0.hostElement,
      _1198: x0 => x0.viewConstraints,
      _1201: x0 => x0.maxHeight,
      _1202: x0 => x0.maxWidth,
      _1203: x0 => x0.minHeight,
      _1204: x0 => x0.minWidth,
      _1205: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1205(f,arguments.length,x0) }),
      _1206: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1206(f,arguments.length,x0) }),
      _1207: (x0,x1) => ({addView: x0,removeView: x1}),
      _1210: x0 => x0.loader,
      _1211: () => globalThis._flutter,
      _1212: (x0,x1) => x0.didCreateEngineInitializer(x1),
      _1213: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1213(f,arguments.length,x0) }),
      _1214: (module,f) => finalizeWrapper(f, function() { return module.exports._1214(f,arguments.length) }),
      _1215: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      _1218: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1218(f,arguments.length,x0) }),
      _1219: x0 => ({runApp: x0}),
      _1221: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._1221(f,arguments.length,x0,x1) }),
      _1222: x0 => new Promise(x0),
      _1223: x0 => x0.length,
      _1224: () => globalThis.window.ImageDecoder,
      _1225: x0 => x0.tracks,
      _1227: x0 => x0.completed,
      _1229: x0 => x0.image,
      _1235: x0 => x0.displayWidth,
      _1236: x0 => x0.displayHeight,
      _1237: x0 => x0.duration,
      _1240: x0 => x0.ready,
      _1241: x0 => x0.selectedTrack,
      _1242: x0 => x0.repetitionCount,
      _1243: x0 => x0.frameCount,
      _1285: x0 => globalThis.URL.revokeObjectURL(x0),
      _1286: x0 => x0.remove(),
      _1287: (x0,x1,x2,x3) => x0.drawImage(x1,x2,x3),
      _1288: (x0,x1,x2,x3,x4,x5) => x0.drawImage(x1,x2,x3,x4,x5),
      _1289: x0 => globalThis.URL.createObjectURL(x0),
      _1290: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1290(f,arguments.length,x0) }),
      _1291: (x0,x1,x2,x3) => x0.toBlob(x1,x2,x3),
      _1292: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1292(f,arguments.length,x0) }),
      _1293: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1293(f,arguments.length,x0) }),
      _1294: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1294(f,arguments.length,x0) }),
      _1295: (x0,x1) => x0.querySelector(x1),
      _1296: (x0,x1) => x0.createElement(x1),
      _1297: (x0,x1) => x0.append(x1),
      _1298: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _1299: (x0,x1) => x0.replaceChildren(x1),
      _1300: x0 => x0.click(),
      _1301: x0 => ({audio: x0}),
      _1302: (x0,x1) => x0.getUserMedia(x1),
      _1303: x0 => x0.getAudioTracks(),
      _1304: x0 => x0.stop(),
      _1305: (x0,x1) => x0.removeTrack(x1),
      _1306: x0 => x0.close(),
      _1307: (x0,x1) => x0.warn(x1),
      _1308: x0 => x0.getSettings(),
      _1309: x0 => ({sampleRate: x0}),
      _1310: x0 => new AudioContext(x0),
      _1311: () => new AudioContext(),
      _1314: (x0,x1) => x0.connect(x1),
      _1315: (x0,x1) => x0.createMediaStreamSource(x1),
      _1316: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1316(f,arguments.length,x0) }),
      _1317: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1317(f,arguments.length,x0) }),
      _1318: (x0,x1) => x0.addModule(x1),
      _1319: x0 => ({parameterData: x0}),
      _1320: (x0,x1,x2) => new AudioWorkletNode(x0,x1,x2),
      _1321: x0 => ({name: x0}),
      _1322: (x0,x1) => x0.query(x1),
      _1328: x0 => x0.disconnect(),
      _1329: x0 => x0.stop(),
      _1330: (x0,x1,x2) => ({mimeType: x0,audioBitsPerSecond: x1,bitsPerSecond: x2}),
      _1331: (x0,x1) => new MediaRecorder(x0,x1),
      _1332: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1332(f,arguments.length,x0) }),
      _1333: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1333(f,arguments.length,x0) }),
      _1334: (x0,x1) => x0.start(x1),
      _1335: x0 => ({type: x0}),
      _1336: (x0,x1) => new Blob(x0,x1),
      _1337: (x0,x1) => globalThis.jsFixWebmDuration(x0,x1),
      _1338: x0 => x0.createAnalyser(),
      _1339: (x0,x1) => x0.getFloatFrequencyData(x1),
      _1340: x0 => globalThis.MediaRecorder.isTypeSupported(x0),
      _1350: (x0,x1) => x0.createElement(x1),
      _1356: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _1359: (x0,x1) => x0.get(x1),
      _1362: () => globalThis.Notification.requestPermission(),
      _1364: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _1365: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      _1366: (x0,x1) => x0.removeAttribute(x1),
      _1367: (x0,x1) => x0.getAttribute(x1),
      _1371: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _1381: (x0,x1) => x0.item(x1),
      _1388: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1388(f,arguments.length,x0) }),
      _1389: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _1390: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1390(f,arguments.length,x0) }),
      _1391: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1391(f,arguments.length,x0) }),
      _1392: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1392(f,arguments.length,x0) }),
      _1393: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1393(f,arguments.length,x0) }),
      _1394: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1394(f,arguments.length,x0) }),
      _1395: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1395(f,arguments.length,x0) }),
      _1396: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1396(f,arguments.length,x0) }),
      _1397: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1397(f,arguments.length,x0) }),
      _1398: (x0,x1) => x0.end(x1),
      _1399: x0 => x0.pause(),
      _1400: x0 => x0.play(),
      _1401: x0 => x0.load(),
      _1402: (x0,x1) => x0.setSinkId(x1),
      _1403: x0 => x0.decode(),
      _1404: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _1405: (x0,x1,x2) => x0.setRequestHeader(x1,x2),
      _1406: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1406(f,arguments.length,x0) }),
      _1407: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1407(f,arguments.length,x0) }),
      _1408: x0 => x0.send(),
      _1409: () => new XMLHttpRequest(),
      _1410: (x0,x1) => x0.getItem(x1),
      _1411: (x0,x1) => x0.removeItem(x1),
      _1412: (x0,x1,x2) => x0.setItem(x1,x2),
      _1414: (x0,x1,x2,x3,x4,x5,x6,x7) => ({apiKey: x0,authDomain: x1,databaseURL: x2,projectId: x3,storageBucket: x4,messagingSenderId: x5,measurementId: x6,appId: x7}),
      _1415: (x0,x1) => globalThis.firebase_core.initializeApp(x0,x1),
      _1416: x0 => globalThis.firebase_core.getApp(x0),
      _1417: () => globalThis.firebase_core.getApp(),
      _1418: (x0,x1,x2) => globalThis.firebase_core.registerVersion(x0,x1,x2),
      _1420: x0 => globalThis.firebase_messaging.getMessaging(x0),
      _1422: (x0,x1) => globalThis.firebase_messaging.getToken(x0,x1),
      _1423: () => globalThis.firebase_messaging.isSupported(),
      _1424: (x0,x1) => globalThis.firebase_messaging.onMessage(x0,x1),
      _1425: (x0,x1) => ({next: x0,error: x1}),
      _1428: (x0,x1) => ({vapidKey: x0,serviceWorkerRegistration: x1}),
      _1431: x0 => x0.title,
      _1432: x0 => x0.body,
      _1433: x0 => x0.image,
      _1434: x0 => x0.messageId,
      _1435: x0 => x0.collapseKey,
      _1436: x0 => x0.fcmOptions,
      _1437: x0 => x0.notification,
      _1438: x0 => x0.data,
      _1439: x0 => x0.from,
      _1440: x0 => x0.analyticsLabel,
      _1441: x0 => x0.link,
      _1443: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1443(f,arguments.length,x0) }),
      _1444: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1444(f,arguments.length,x0) }),
      _1446: () => globalThis.firebase_core.SDK_VERSION,
      _1452: x0 => x0.apiKey,
      _1454: x0 => x0.authDomain,
      _1456: x0 => x0.databaseURL,
      _1458: x0 => x0.projectId,
      _1460: x0 => x0.storageBucket,
      _1462: x0 => x0.messagingSenderId,
      _1464: x0 => x0.measurementId,
      _1466: x0 => x0.appId,
      _1468: x0 => x0.name,
      _1469: x0 => x0.options,
      _1470: (x0,x1) => x0.debug(x1),
      _1471: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1471(f,arguments.length,x0) }),
      _1472: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._1472(f,arguments.length,x0,x1) }),
      _1473: (x0,x1) => ({createScript: x0,createScriptURL: x1}),
      _1474: (x0,x1,x2) => x0.createPolicy(x1,x2),
      _1475: (x0,x1) => x0.createScriptURL(x1),
      _1476: (x0,x1,x2) => x0.createScript(x1,x2),
      _1477: (x0,x1) => x0.appendChild(x1),
      _1478: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1478(f,arguments.length,x0) }),
      _1480: Date.now,
      _1482: s => new Date(s * 1000).getTimezoneOffset() * 60,
      _1483: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      _1484: () => typeof dartUseDateNowForTicks !== "undefined",
      _1485: () => 1000 * performance.now(),
      _1486: () => Date.now(),
      _1487: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      _1488: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      _1489: () => new WeakMap(),
      _1490: (map, o) => map.get(o),
      _1491: (map, o, v) => map.set(o, v),
      _1492: x0 => new WeakRef(x0),
      _1493: x0 => x0.deref(),
      _1500: () => globalThis.WeakRef,
      _1503: s => JSON.stringify(s),
      _1504: s => printToConsole(s),
      _1505: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      _1506: (o, p, r) => o.replaceAll(p, () => r),
      _1507: (o, p, r) => o.replace(p, () => r),
      _1508: Function.prototype.call.bind(String.prototype.toLowerCase),
      _1509: s => s.toUpperCase(),
      _1510: s => s.trim(),
      _1511: s => s.trimLeft(),
      _1512: s => s.trimRight(),
      _1513: (string, times) => string.repeat(times),
      _1514: Function.prototype.call.bind(String.prototype.indexOf),
      _1515: (s, p, i) => s.lastIndexOf(p, i),
      _1516: (string, token) => string.split(token),
      _1517: Object.is,
      _1521: (o, t) => typeof o === t,
      _1522: (o, c) => o instanceof c,
      _1523: o => Object.keys(o),
      _1525: (o) => {
        const typeofValue = typeof o;
        return (typeofValue === 'object') ||
            typeofValue === 'function';
      },
      _1526: (o,s,v) => o[s] = v,
      _1577: x0 => new Array(x0),
      _1579: x0 => x0.length,
      _1581: (x0,x1) => x0[x1],
      _1582: (x0,x1,x2) => { x0[x1] = x2 },
      _1585: (x0,x1,x2) => new DataView(x0,x1,x2),
      _1587: x0 => new Int8Array(x0),
      _1588: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      _1590: x0 => new Uint8ClampedArray(x0),
      _1592: x0 => new Int16Array(x0),
      _1594: x0 => new Uint16Array(x0),
      _1596: x0 => new Int32Array(x0),
      _1598: x0 => new Uint32Array(x0),
      _1600: x0 => new Float32Array(x0),
      _1602: x0 => new Float64Array(x0),
      _1625: () => Symbol("jsBoxedDartObjectProperty"),
      _1626: x0 => x0.random(),
      _1627: (x0,x1) => x0.getRandomValues(x1),
      _1628: () => globalThis.crypto,
      _1629: () => globalThis.Math,
      _1642: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      _1643: (handle) => clearTimeout(handle),
      _1644: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      _1645: (handle) => clearInterval(handle),
      _1646: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      _1647: () => Date.now(),
      _1648: () => new Error().stack,
      _1649: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      _1650: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      _1651: (x0,x1) => x0.exec(x1),
      _1652: (x0,x1) => x0.test(x1),
      _1653: x0 => x0.pop(),
      _1655: o => o === undefined,
      _1657: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      _1659: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      _1660: o => o instanceof RegExp,
      _1661: (l, r) => l === r,
      _1662: o => o,
      _1663: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      _1664: o => o,
      _1665: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      _1666: o => o,
      _1667: b => !!b,
      _1668: o => o.length,
      _1670: (o, i) => o[i],
      _1671: f => f.dartFunction,
      _1672: () => ({}),
      _1673: () => [],
      _1675: () => globalThis,
      _1676: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      _1677: (o, p) => p in o,
      _1678: (o, p) => o[p],
      _1679: (o, p, v) => o[p] = v,
      _1680: (o, m, a) => o[m].apply(o, a),
      _1682: o => String(o),
      _1683: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      _1684: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1684(f,arguments.length,x0) }),
      _1685: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._1685(f,arguments.length,x0,x1) }),
      _1686: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      _1687: o => [o],
      _1688: (o0, o1) => [o0, o1],
      _1689: (o0, o1, o2) => [o0, o1, o2],
      _1690: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      _1691: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      _1692: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1693: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1694: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1695: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1696: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1697: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1698: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1699: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1700: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1701: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1702: x0 => new ArrayBuffer(x0),
      _1703: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      _1705: x0 => x0.index,
      _1706: x0 => x0.groups,
      _1707: x0 => x0.flags,
      _1708: x0 => x0.multiline,
      _1709: x0 => x0.ignoreCase,
      _1710: x0 => x0.unicode,
      _1711: x0 => x0.dotAll,
      _1712: (x0,x1) => { x0.lastIndex = x1 },
      _1713: (o, p) => p in o,
      _1714: (o, p) => o[p],
      _1715: (o, p, v) => o[p] = v,
      _1716: (o, p) => delete o[p],
      _1717: () => new XMLHttpRequest(),
      _1718: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _1722: x0 => x0.send(),
      _1724: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1724(f,arguments.length,x0) }),
      _1725: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1725(f,arguments.length,x0) }),
      _1730: (x0,x1) => new WebSocket(x0,x1),
      _1731: (x0,x1) => x0.send(x1),
      _1732: (x0,x1,x2) => x0.close(x1,x2),
      _1733: (x0,x1) => x0.close(x1),
      _1734: x0 => x0.close(),
      _1735: (x0,x1) => x0.item(x1),
      _1739: () => new FileReader(),
      _1740: (x0,x1) => x0.readAsArrayBuffer(x1),
      _1741: () => new AbortController(),
      _1742: x0 => x0.abort(),
      _1743: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      _1744: (x0,x1) => globalThis.fetch(x0,x1),
      _1745: (module,f) => finalizeWrapper(f, function(x0,x1,x2) { return module.exports._1745(f,arguments.length,x0,x1,x2) }),
      _1746: (x0,x1) => x0.forEach(x1),
      _1747: x0 => x0.getReader(),
      _1748: x0 => x0.cancel(),
      _1749: x0 => x0.read(),
      _1750: x0 => new BroadcastChannel(x0),
      _1751: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1751(f,arguments.length,x0) }),
      _1752: (x0,x1) => x0.postMessage(x1),
      _1753: x0 => x0.close(),
      _1754: (x0,x1) => x0.append(x1),
      _1755: x0 => x0.trustedTypes,
      _1756: (x0,x1) => { x0.src = x1 },
      _1757: (x0,x1) => x0.createScriptURL(x1),
      _1758: x0 => x0.nonce,
      _1759: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1759(f,arguments.length,x0) }),
      _1760: x0 => ({createScriptURL: x0}),
      _1761: (x0,x1) => x0.querySelectorAll(x1),
      _1762: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      _1763: (x0,x1) => x0.key(x1),
      _1764: (x0,x1) => x0.item(x1),
      _1765: x0 => x0.trustedTypes,
      _1766: (x0,x1) => { x0.text = x1 },
      _1767: o => o instanceof Array,
      _1768: (a, i) => a.splice(i, 1)[0],
      _1770: (a, l) => a.length = l,
      _1771: a => a.pop(),
      _1772: (a, i) => a.splice(i, 1),
      _1773: (a, s) => a.join(s),
      _1774: (a, s, e) => a.slice(s, e),
      _1776: (a, b) => a == b ? 0 : (a > b ? 1 : -1),
      _1777: a => a.length,
      _1778: (a, l) => a.length = l,
      _1779: (a, i) => a[i],
      _1780: (a, i, v) => a[i] = v,
      _1782: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      _1783: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      _1785: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      _1786: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      _1787: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      _1788: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      _1789: o => o instanceof Uint8ClampedArray,
      _1790: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      _1791: o => o instanceof Uint16Array,
      _1792: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      _1793: o => o instanceof Int16Array,
      _1794: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      _1795: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      _1796: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      _1797: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      _1798: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      _1800: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      _1801: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      _1802: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      _1803: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      _1804: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      _1805: (a, i) => a.push(i),
      _1806: (t, s) => t.set(s),
      _1807: l => new DataView(new ArrayBuffer(l)),
      _1808: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      _1809: o => o.byteLength,
      _1810: o => o.buffer,
      _1811: o => o.byteOffset,
      _1812: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      _1813: (b, o) => new DataView(b, o),
      _1814: (b, o, l) => new DataView(b, o, l),
      _1815: Function.prototype.call.bind(DataView.prototype.getUint8),
      _1816: Function.prototype.call.bind(DataView.prototype.setUint8),
      _1817: Function.prototype.call.bind(DataView.prototype.getInt8),
      _1818: Function.prototype.call.bind(DataView.prototype.setInt8),
      _1819: Function.prototype.call.bind(DataView.prototype.getUint16),
      _1820: Function.prototype.call.bind(DataView.prototype.setUint16),
      _1821: Function.prototype.call.bind(DataView.prototype.getInt16),
      _1822: Function.prototype.call.bind(DataView.prototype.setInt16),
      _1823: Function.prototype.call.bind(DataView.prototype.getUint32),
      _1824: Function.prototype.call.bind(DataView.prototype.setUint32),
      _1825: Function.prototype.call.bind(DataView.prototype.getInt32),
      _1826: Function.prototype.call.bind(DataView.prototype.setInt32),
      _1829: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      _1830: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      _1831: Function.prototype.call.bind(DataView.prototype.getFloat32),
      _1832: Function.prototype.call.bind(DataView.prototype.setFloat32),
      _1833: Function.prototype.call.bind(DataView.prototype.getFloat64),
      _1834: Function.prototype.call.bind(DataView.prototype.setFloat64),
      _1835: Function.prototype.call.bind(Number.prototype.toString),
      _1836: Function.prototype.call.bind(BigInt.prototype.toString),
      _1837: Function.prototype.call.bind(Number.prototype.toString),
      _1838: (d, digits) => d.toFixed(digits),
      _1844: (x0,x1) => x0.getContext(x1),
      _1850: () => globalThis.document,
      _1852: () => globalThis.console,
      _1857: (x0,x1) => { x0.height = x1 },
      _1859: (x0,x1) => { x0.width = x1 },
      _1861: (x0,x1) => { x0.pointerEvents = x1 },
      _1870: x0 => x0.style,
      _1873: x0 => x0.src,
      _1874: (x0,x1) => { x0.src = x1 },
      _1875: x0 => x0.naturalWidth,
      _1876: x0 => x0.naturalHeight,
      _1891: (x0,x1) => x0.error(x1),
      _1896: x0 => x0.status,
      _1897: (x0,x1) => { x0.responseType = x1 },
      _1899: x0 => x0.response,
      _1976: x0 => { globalThis.onGoogleLibraryLoad = x0 },
      _1977: (module,f) => finalizeWrapper(f, function() { return module.exports._1977(f,arguments.length) }),
      _2026: (x0,x1) => { x0.responseType = x1 },
      _2027: x0 => x0.response,
      _2116: (x0,x1) => { x0.oncancel = x1 },
      _2122: (x0,x1) => { x0.onchange = x1 },
      _2162: (x0,x1) => { x0.onerror = x1 },
      _2302: (x0,x1) => { x0.nonce = x1 },
      _2535: (x0,x1) => { x0.src = x1 },
      _2546: x0 => x0.width,
      _2548: x0 => x0.height,
      _2705: x0 => x0.error,
      _2706: x0 => x0.src,
      _2707: (x0,x1) => { x0.src = x1 },
      _2715: (x0,x1) => { x0.preload = x1 },
      _2716: x0 => x0.buffered,
      _2719: x0 => x0.currentTime,
      _2720: (x0,x1) => { x0.currentTime = x1 },
      _2721: x0 => x0.duration,
      _2726: (x0,x1) => { x0.playbackRate = x1 },
      _2739: (x0,x1) => { x0.volume = x1 },
      _2756: x0 => x0.code,
      _2757: x0 => x0.message,
      _2831: x0 => x0.length,
      _3027: (x0,x1) => { x0.accept = x1 },
      _3041: x0 => x0.files,
      _3067: (x0,x1) => { x0.multiple = x1 },
      _3085: (x0,x1) => { x0.type = x1 },
      _3335: (x0,x1) => { x0.src = x1 },
      _3337: (x0,x1) => { x0.type = x1 },
      _3341: (x0,x1) => { x0.async = x1 },
      _3343: (x0,x1) => { x0.defer = x1 },
      _3345: (x0,x1) => { x0.crossOrigin = x1 },
      _3347: (x0,x1) => { x0.text = x1 },
      _3355: (x0,x1) => { x0.charset = x1 },
      _3379: x0 => x0.width,
      _3380: (x0,x1) => { x0.width = x1 },
      _3381: x0 => x0.height,
      _3382: (x0,x1) => { x0.height = x1 },
      _3803: () => globalThis.window,
      _3842: x0 => x0.document,
      _3845: x0 => x0.location,
      _3846: x0 => x0.history,
      _3864: x0 => x0.navigator,
      _4126: x0 => x0.trustedTypes,
      _4127: x0 => x0.sessionStorage,
      _4128: x0 => x0.localStorage,
      _4136: x0 => x0.href,
      _4236: x0 => x0.mediaDevices,
      _4238: x0 => x0.permissions,
      _4252: x0 => x0.userAgent,
      _4253: x0 => x0.vendor,
      _4303: x0 => x0.data,
      _4340: (x0,x1) => { x0.onmessage = x1 },
      _4350: (x0,x1) => { x0.onmessage = x1 },
      _4457: x0 => x0.length,
      _4674: x0 => x0.readyState,
      _4687: (x0,x1) => { x0.binaryType = x1 },
      _4690: x0 => x0.code,
      _4691: x0 => x0.reason,
      _5842: x0 => x0.destination,
      _5846: x0 => x0.state,
      _5847: x0 => x0.audioWorklet,
      _5950: (x0,x1) => { x0.fftSize = x1 },
      _5951: x0 => x0.frequencyBinCount,
      _5953: (x0,x1) => { x0.minDecibels = x1 },
      _5955: (x0,x1) => { x0.maxDecibels = x1 },
      _5957: (x0,x1) => { x0.smoothingTimeConstant = x1 },
      _6211: x0 => x0.port,
      _6350: x0 => x0.type,
      _6351: x0 => x0.target,
      _6391: x0 => x0.signal,
      _6400: x0 => x0.length,
      _6402: x0 => x0.length,
      _6459: () => globalThis.document,
      _6539: x0 => x0.body,
      _6541: x0 => x0.head,
      _6869: x0 => x0.id,
      _6870: (x0,x1) => { x0.id = x1 },
      _6897: x0 => x0.children,
      _8216: x0 => x0.value,
      _8218: x0 => x0.done,
      _8398: x0 => x0.size,
      _8399: x0 => x0.type,
      _8406: x0 => x0.name,
      _8407: x0 => x0.lastModified,
      _8412: x0 => x0.length,
      _8418: x0 => x0.result,
      _8787: x0 => x0.mimeType,
      _8788: x0 => x0.state,
      _8792: (x0,x1) => { x0.onstop = x1 },
      _8794: (x0,x1) => { x0.ondataavailable = x1 },
      _8819: x0 => x0.data,
      _8908: x0 => x0.url,
      _8910: x0 => x0.status,
      _8912: x0 => x0.statusText,
      _8913: x0 => x0.headers,
      _8914: x0 => x0.body,
      _9299: x0 => x0.state,
      _9959: x0 => x0.sampleRate,
      _9971: x0 => x0.channelCount,
      _12533: x0 => x0.name,
      _13249: () => globalThis.console,
      _13275: x0 => x0.name,
      _13276: x0 => x0.message,
      _13277: x0 => x0.code,

    };

    const baseImports = {
      dart2wasm: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      s: [
        "([ \r\n\t]+)|([!-\\[\\]-‧‪-퟿豈-￿][̀-ͯ]*|[\ud800-\udbff][\udc00-\udfff][̀-ͯ]*|\\\\verb\\*([^]).*?\\3|\\\\verb([^*a-zA-Z]).*?\\4|\\\\operatorname\\*|\\\\[a-zA-Z@]+[ \r\n\t]*|\\\\[^\ud800-\udfff])",
      ],
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });
    dartInstance.exports.$setThisModule(dartInstance);

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
