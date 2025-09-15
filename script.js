// Client-side background remover using BodyPix
let net = null;
const inputImage = document.getElementById('inputImage');
const runBtn = document.getElementById('runBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const outputCanvas = document.getElementById('outputCanvas');
const status = document.getElementById('status');
const modelChoice = document.getElementById('modelChoice');
const threshold = document.getElementById('threshold');
const thresholdVal = document.getElementById('thresholdVal');
const feather = document.getElementById('feather');
const featherVal = document.getElementById('featherVal');
const bgblur = document.getElementById('bgblur');
const bgblurVal = document.getElementById('bgblurVal');
const bgMode = document.getElementById('bgMode');
const bgColor = document.getElementById('bgColor');
const colorPickerLabel = document.getElementById('colorPickerLabel');
const bgUploadLabel = document.getElementById('bgUploadLabel');
const bgImageInput = document.getElementById('bgImage');

let originalImg = new Image();
let bgImage = null;

threshold.addEventListener('input', ()=> thresholdVal.innerText = Number(threshold.value).toFixed(2));
feather.addEventListener('input', ()=> featherVal.innerText = feather.value);
bgblur.addEventListener('input', ()=> bgblurVal.innerText = bgblur.value);
bgMode.addEventListener('change', ()=>{
  colorPickerLabel.style.display = bgMode.value === 'color' ? 'inline-flex' : 'none';
  bgUploadLabel.style.display = bgMode.value === 'image' ? 'inline-flex' : 'none';
});

inputImage.addEventListener('change', (e)=>{
  const file = e.target.files?.[0];
  if(!file) return;
  const url = URL.createObjectURL(file);
  originalImg = new Image();
  originalImg.onload = ()=>{
    fitCanvasToImage();
    drawImageToCanvas(outputCanvas, originalImg);
    status.innerText = 'Image loaded. Load a model and click Run.';
    downloadBtn.disabled = true;
  };
  originalImg.src = url;
});

bgImageInput.addEventListener('change', (e)=>{
  const file = e.target.files?.[0];
  if(!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = ()=>{ bgImage = img; };
  img.src = url;
});

resetBtn.addEventListener('click', ()=>{
  originalImg = new Image();
  bgImage = null;
  document.getElementById('inputImage').value = '';
  document.getElementById('bgImage').value = '';
  const ctx = outputCanvas.getContext('2d');
  ctx.clearRect(0,0,outputCanvas.width,outputCanvas.height);
  status.innerText = 'Reset.';
  downloadBtn.disabled = true;
});

runBtn.addEventListener('click', async ()=>{
  if(!originalImg.src){ status.innerText='Please upload an image first.'; return; }
  runBtn.disabled = true;
  status.innerText = 'Loading (if necessary) and running model — this happens locally in your browser.';
  await loadModelIfNeeded();
  await processImage();
  runBtn.disabled = false;
  downloadBtn.disabled = false;
});

downloadBtn.addEventListener('click', ()=>{
  const a = document.createElement('a');
  a.href = outputCanvas.toDataURL('image/png');
  a.download = 'output.png';
  a.click();
});

async function loadModelIfNeeded(){
  if(net) return;
  const choice = modelChoice.value;
  status.innerText = 'Loading BodyPix model — please wait...';
  const multiplier = choice === 'lite' ? 0.5 : (choice === 'mobile' ? 0.75 : 1.0);
  // load with configurations tuned for speed/accuracy
  net = await bodyPix.load({
    architecture: 'MobileNetV1',
    outputStride: 16,
    multiplier,
    quantBytes: 2
  });
  status.innerText = 'Model loaded.';
}

function fitCanvasToImage(){
  const maxW = 1400;
  const maxH = 900;
  let w = originalImg.naturalWidth;
  let h = originalImg.naturalHeight;
  if(w>maxW){ const scale = maxW/w; w = Math.round(w*scale); h = Math.round(h*scale); }
  if(h>maxH){ const scale = maxH/h; w = Math.round(w*scale); h = Math.round(h*scale); }
  outputCanvas.width = w;
  outputCanvas.height = h;
}

function drawImageToCanvas(canvas, img){
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

async function processImage(){
  fitCanvasToImage();
  // draw source to offscreen
  const off = document.createElement('canvas');
  off.width = outputCanvas.width; off.height = outputCanvas.height;
  const offCtx = off.getContext('2d');
  offCtx.drawImage(originalImg, 0, 0, off.width, off.height);

  // get segmentation
  const segmentation = await net.segmentPerson(off, {
    internalResolution: 'medium',
    segmentationThreshold: Number(threshold.value)
  });

  // create mask imageData
  const mask = bodyPix.toMask(segmentation);
  // convert mask to ImageData for processing
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = off.width; maskCanvas.height = off.height;
  const mctx = maskCanvas.getContext('2d');
  mctx.putImageData(mask, 0, 0);

  // refine mask: apply blur for feathering
  const featherPx = Number(feather.value);
  let refinedMask = maskCanvas;
  if(featherPx>0){
    refinedMask = await blurCanvas(maskCanvas, featherPx);
  }

  // Optionally blur background
  const bgBlurPx = Number(bgblur.value);

  // Compose final
  const outCtx = outputCanvas.getContext('2d');
  outCtx.clearRect(0,0,outputCanvas.width,outputCanvas.height);

  // prepare background layer
  if(bgMode.value === 'transparent'){
    // draw transparent background (canvas already transparent)
    outCtx.clearRect(0,0,outputCanvas.width,outputCanvas.height);
  }else if(bgMode.value === 'color'){
    outCtx.fillStyle = bgColor.value;
    outCtx.fillRect(0,0,outputCanvas.width,outputCanvas.height);
  }else if(bgMode.value === 'image' && bgImage){
    // draw bg image scaled to cover
    const bgs = coverImageSize(bgImage, outputCanvas.width, outputCanvas.height);
    outCtx.drawImage(bgImage, bgs.sx, bgs.sy, bgs.sw, bgs.sh, 0, 0, outputCanvas.width, outputCanvas.height);
  }else{
    // default: white
    outCtx.fillStyle = '#fff'; outCtx.fillRect(0,0,outputCanvas.width,outputCanvas.height);
  }

  // if bg blur requested, create blurred background from source
  if(bgBlurPx>0){
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = outputCanvas.width; bgCanvas.height = outputCanvas.height;
    const bgctx = bgCanvas.getContext('2d');
    bgctx.filter = `blur(${bgBlurPx}px)`;
    bgctx.drawImage(originalImg, 0, 0, bgCanvas.width, bgCanvas.height);
    // draw blurred bg underneath (we already have bg applied, so we composite)
    outCtx.globalCompositeOperation = 'source-over';
    outCtx.drawImage(bgCanvas, 0, 0);
  }

  // draw refined mask to get alpha
  const maskData = refinedMask.getContext('2d').getImageData(0,0,refinedMask.width, refinedMask.height);

  // draw original image then apply mask as alpha
  const imgCanvas = document.createElement('canvas');
  imgCanvas.width = outputCanvas.width; imgCanvas.height = outputCanvas.height;
  const imgCtx = imgCanvas.getContext('2d');
  imgCtx.drawImage(originalImg, 0, 0, imgCanvas.width, imgCanvas.height);
  const imgData = imgCtx.getImageData(0,0,imgCanvas.width, imgCanvas.height);

  // Apply mask alpha: mask's alpha channel will indicate person (white ~ 255 alpha)
  for(let i=0;i<imgData.data.length;i+=4){
    const alpha = maskData.data[i+3] / 255; // 0..1
    imgData.data[i+3] = Math.round(alpha * 255);
  }
  imgCtx.putImageData(imgData, 0, 0);

  // Now composite: draw masked person onto outCtx
  outCtx.globalCompositeOperation = 'source-over';
  outCtx.drawImage(imgCanvas, 0, 0);

  // Slightly smooth edges by a second feather pass if requested
  if(featherPx>0){
    // optional: re-blur alpha by drawing mask as soft overlay - skipped for speed
  }

  status.innerText = 'Done. You can download the PNG (transparent) or change background replacement.';
}

// Utility: gaussian-ish blur via canvas by using context.filter (fast)
async function blurCanvas(canvas, radius){
  if(radius<=0) return canvas;
  const tmp = document.createElement('canvas');
  tmp.width = canvas.width; tmp.height = canvas.height;
  const ctx = tmp.getContext('2d');
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(canvas, 0, 0);
  return tmp;
}

function coverImageSize(img, w, h){
  // returns sx, sy, sw, sh to drawImage to cover w,h
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w/iw, h/ih);
  const sw = w/scale;
  const sh = h/scale;
  const sx = Math.max(0, (iw - sw) / 2);
  const sy = Math.max(0, (ih - sh) / 2);
  return {sx, sy, sw, sh};
}