import { GeminiAPI } from "./GeminiAPI";
import { SpeechUI } from "./SpeechUI";
import { ResponseUI } from "./ResponseUI";
import { Loading } from "./Loading";
import { DepthCache } from "./DepthCache";
import { DebugVisualizer } from "./DebugVisualizer";

@component
export class SceneController extends BaseScriptComponent {
  @input
  @hint("Show debug visuals in the scene")
  showDebugVisuals: boolean = false;
  @input
  @hint("Visualizes 2D points over the camera frame for debugging")
  debugVisualizer: DebugVisualizer;
  @input
  @hint("Calls to the Gemini API using Smart Gate")
  gemini: GeminiAPI;
  @input
  @hint("Displays AI speech output")
  responseUI: ResponseUI;
  @input
  @hint("Loading visual")
  loading: Loading;
  @input
  @hint("Caches depth frame and converts pixel positions to world space")
  depthCache: DepthCache;

  private isRequestRunning = false;
  private lastCaptureTime: number = 0;
  private readonly CAPTURE_INTERVAL: number = 30; // 30 seconds

  onAwake() {
    this.createEvent("OnStartEvent").bind(this.onStart.bind(this));
  }

  onStart() {
    print("🎮 SceneController ENABLED - Auto-capture every 15 seconds");
    
    // Initialize timer - start counting from now
    this.lastCaptureTime = getTime();
    
    // Set up update event for automatic captures
    this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));
  }

  private onUpdate(eventData: UpdateEvent): void {
    const currentTime = getTime();
    
    // Update timer display
    this.updateTimerDisplay(currentTime);
    
    // Check if 15 seconds have passed since last capture
    const timeSinceLastCapture = currentTime - this.lastCaptureTime;
    if (timeSinceLastCapture >= this.CAPTURE_INTERVAL) {
      print(`📸 Auto-capturing every 30 seconds... (${timeSinceLastCapture.toFixed(1)}s elapsed)`);
      this.captureAndAnalyze();
      this.lastCaptureTime = currentTime;
      print(`🔄 Timer reset - next capture in 30s`);
      print(`🔄 DEBUG: lastCaptureTime = ${this.lastCaptureTime}, currentTime = ${currentTime}`);
    }
    
    // Debug: Log every 5 seconds to confirm update loop keeps running
    if (Math.floor(currentTime) % 5 === 0 && Math.floor(currentTime) !== Math.floor(currentTime - 0.1)) {
      print(`🔄 Update loop active - ${timeSinceLastCapture.toFixed(1)}s since last capture`);
    }
  }

  private updateTimerDisplay(currentTime: number): void {
    const timeSinceLastCapture = currentTime - this.lastCaptureTime;
    const timeUntilNextCapture = this.CAPTURE_INTERVAL - timeSinceLastCapture;
    
    if (timeUntilNextCapture > 0) {
      const seconds = Math.ceil(timeUntilNextCapture);
      // Log every 5 seconds and last 5 seconds
      if (seconds % 5 === 0 || seconds <= 5) {
        print(`⏰ Next capture in: ${seconds}s`);
      }
    } else {
      print("📸 Capturing...");
    }
  }

  private captureAndAnalyze(): void {
    if (this.isRequestRunning) {
      print("REQUEST ALREADY RUNNING - Skipping auto-capture");
      return;
    }
    
    print("MAKING AUTO REQUEST~~~~~");
    this.isRequestRunning = true;
    this.loading.activateLoder(true);
    
    // Log capturing status
    print("📸 Starting capture...");
    
    // Reset everything
    this.responseUI.clearLabels();
    this.responseUI.closeResponseBubble();
    
    // Save depth frame
    let depthFrameID = this.depthCache.saveDepthFrame();
    let camImage = this.depthCache.getCamImageWithID(depthFrameID);
    
    // Take capture with default query
    this.sendToGemini(camImage, "Analyze this scene and identify objects", depthFrameID);
    
    if (this.showDebugVisuals) {
      this.debugVisualizer.updateCameraFrame(camImage);
    }
  }


  private sendToGemini(
    cameraFrame: Texture,
    text: string,
    depthFrameID: number
  ) {
    this.gemini.makeGeminiRequest(cameraFrame, text, (response) => {
      this.isRequestRunning = false;
      this.loading.activateLoder(false);
      
      // Log completion and reset timer
      print("✅ Capture completed - Timer reset to 15s");
      
      print("GEMINI Points LENGTH: " + response.points.length);
      this.responseUI.openResponseBubble(response.aiMessage);
      //create points and labels
      for (var i = 0; i < response.points.length; i++) {
        var pointObj = response.points[i];
        if (this.showDebugVisuals) {
          this.debugVisualizer.visualizeLocalPoint(
            pointObj.pixelPos,
            cameraFrame
          );
        }
        var worldPosition = this.depthCache.getWorldPositionWithID(
          pointObj.pixelPos,
          depthFrameID
        );
        if (worldPosition != null) {
          //create and position label in world space
          this.responseUI.loadWorldLabel(
            pointObj.label,
            worldPosition,
            pointObj.showArrow
          );
        }
      }
      this.depthCache.disposeDepthFrame(depthFrameID);
    });
  }
}
