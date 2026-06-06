export function buildNativeLandmarkWorkerHtml() {
  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    html, body { margin: 0; padding: 0; background: #020617; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    #status { padding: 16px; font-size: 14px; line-height: 20px; }
  </style>
</head>
<body>
  <div id="status">Loading pose detector…</div>
  <script type="module">
    const status = document.getElementById('status');
    let landmarker = null;
    let ready = false;
    let pending = null;

    function post(type, payload = {}) {
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type, ...payload }));
    }
    function setStatus(message) {
      status.textContent = message;
      post('status', { message });
    }

    async function init() {
      try {
        const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs');
        const fileset = await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
        landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'IMAGE',
          numPoses: 1,
          minPoseDetectionConfidence: 0.35,
          minPosePresenceConfidence: 0.35,
          minTrackingConfidence: 0.35
        });
        ready = true;
        setStatus('Pose detector ready.');
        post('ready');
        if (pending) analyzeFrames(pending);
      } catch (error) {
        post('error', { message: error?.message || String(error) });
      }
    }

    async function analyzeFrames(payload) {
      if (!ready) { pending = payload; return; }
      try {
        const frames = payload.frames || [];
        const landmarkFrames = [];
        for (let i = 0; i < frames.length; i++) {
          setStatus('Analyzing frame ' + (i + 1) + ' / ' + frames.length + '…');
          const image = await loadImage(frames[i].dataUri);
          const result = landmarker.detect(image);
          landmarkFrames.push({ timestampMs: frames[i].timestampMs, landmarks: result.landmarks?.[0] || [] });
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
        setStatus('Landmarks extracted.');
        post('landmarks', { requestId: payload.requestId, landmarkFrames });
      } catch (error) {
        post('error', { requestId: payload.requestId, message: error?.message || String(error) });
      }
    }

    function loadImage(src) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load sampled frame image.'));
        image.src = src;
      });
    }

    window.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'analyze') analyzeFrames(payload);
      } catch (error) {
        post('error', { message: error?.message || String(error) });
      }
    });
    document.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'analyze') analyzeFrames(payload);
      } catch (error) {
        post('error', { message: error?.message || String(error) });
      }
    });

    init();
  </script>
</body>
</html>`;
}
