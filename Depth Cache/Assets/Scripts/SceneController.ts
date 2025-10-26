import { GeminiAPI } from "./GeminiAPI";
import { SpeechUI } from "./SpeechUI";
import { ResponseUI } from "./ResponseUI";
import { Loading } from "./Loading";
import { DepthCache } from "./DepthCache";
import { DebugVisualizer } from "./DebugVisualizer";
import { CatFactAnimator } from "./CatFactAnimator";
import { LSTween } from "LSTween.lspkg/LSTween";

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

  @input
  @allowUndefined
  @hint("Cat animator for encouraging prompts")
  catAnimator: CatFactAnimator;

  private isRequestRunning = false;
  private lastCaptureTime: number = 0;
  private readonly CAPTURE_INTERVAL: number = 30; // 30 seconds
  
  // Food tracking system
  private foodObjectMap: Map<string, {
    lastPercentage: number, 
    lastTimestamp: number, 
    lastDetectionTime: string,
    previousPercentage: number,
    previousTimestamp: number,
    previousDetectionTime: string
  }> = new Map();
  private captureCount: number = 0;

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
    
    // Check if 30 seconds have passed since last capture
    const timeSinceLastCapture = currentTime - this.lastCaptureTime;
    if (timeSinceLastCapture >= this.CAPTURE_INTERVAL) {
      print(`📸 Auto-capturing every 30 seconds... (${timeSinceLastCapture.toFixed(1)}s elapsed)`);
      print(`🔍 isRequestRunning: ${this.isRequestRunning}`);
      this.captureAndAnalyze();
      this.lastCaptureTime = currentTime;
      print(`🔄 Timer reset - next capture in 30s`);
      print(`🔄 DEBUG: lastCaptureTime = ${this.lastCaptureTime}, currentTime = ${currentTime}`);
    }
    
    // Debug: Log every 5 seconds to confirm update loop keeps running
    if (Math.floor(currentTime) % 5 === 0 && Math.floor(currentTime) !== Math.floor(currentTime - 0.1)) {
      print(`🔄 Update loop active - ${timeSinceLastCapture.toFixed(1)}s since last capture, isRequestRunning: ${this.isRequestRunning}`);
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
    print("🚀 Starting Gemini request...");
    
    this.gemini.makeGeminiRequest(cameraFrame, text, (response) => {
      try {
        print("📨 Gemini callback received!");
        this.isRequestRunning = false;
        this.loading.activateLoder(false);
        
        // Log completion and reset timer
        print("✅ Capture completed - Timer reset to 30s");
        
        print("GEMINI Points LENGTH: " + response.points.length);
        this.responseUI.openResponseBubble(response.aiMessage);
        
        // Process food objects for cat prompts
        this.processFoodObjects(response);
        
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
        print("🔄 Ready for next capture in 30 seconds");
      } catch (error) {
        print("❌ Error in Gemini callback: " + error);
        this.isRequestRunning = false;
        this.loading.activateLoder(false);
      }
    });
    
    // Add timeout fallback to ensure isRequestRunning gets reset
    LSTween.rawTween(30000).onComplete(() => {
      if (this.isRequestRunning) {
        print("⏰ Gemini request timeout - resetting flag");
        this.isRequestRunning = false;
        this.loading.activateLoder(false);
      }
    }).start();
  }

  // Process food objects and update cat prompts
  private processFoodObjects(response: any): void {
    this.captureCount++;
    const currentTime = getTime();
    
    print(`\n📊 === CAPTURE #${this.captureCount} FOOD ANALYSIS ===`);
    print(`🔍 Processing ${response.points.length} detected objects...`);
    
    // Process each detected object
    for (var i = 0; i < response.points.length; i++) {
      var pointObj = response.points[i];
      print(`🔍 Object ${i}: ${pointObj.label}`);
      
      // Extract consumption percentage from label if present
      const consumption = this.extractConsumptionPercentage(pointObj.label);
      
      // Get normalized object key (groups similar objects)
      const objectKey = this.getNormalizedObjectKey(pointObj.label);
      
      // Update or create entry in map
      this.updateFoodObjectMap(objectKey, consumption, currentTime);
    }
    
    // Log all tracked objects
    this.logObjectTrackingStatus();
    
    // Update cat prompts based on average food percentage
    this.updateCatPrompts();
  }
  
  private extractConsumptionPercentage(label: string): number {
    // Look for percentage in label (e.g., "Apple 75%", "Banana 50%")
    const percentageMatch = label.match(/(\d+)%/);
    if (percentageMatch) {
      return parseInt(percentageMatch[1]);
    }
    return 100; // Default to 100% if no percentage found
  }
  
  private getNormalizedObjectKey(label: string): string {
    // Normalize labels to group similar objects together
    const normalizedLabel = label.toLowerCase()
      .replace(/\d+%/, '') // Remove percentage
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    // Group similar objects
    if (normalizedLabel.includes('water') && normalizedLabel.includes('bottle')) return 'water bottle';
    if (normalizedLabel.includes('bottle')) return 'bottle';
    if (normalizedLabel.includes('apple')) return 'apple';
    if (normalizedLabel.includes('banana')) return 'banana';
    if (normalizedLabel.includes('orange')) return 'orange';
    if (normalizedLabel.includes('sandwich')) return 'sandwich';
    if (normalizedLabel.includes('pizza')) return 'pizza';
    if (normalizedLabel.includes('coffee') || normalizedLabel.includes('cup')) return 'coffee cup';
    if (normalizedLabel.includes('plate') || normalizedLabel.includes('dish')) return 'plate';
    
    // Return first word as fallback
    return normalizedLabel.split(' ')[0];
  }
  
  private formatTimestamp(timestamp: number): string {
    // Convert elapsed time to HH:MM:SS format
    const hours = Math.floor(timestamp / 3600);
    const minutes = Math.floor((timestamp % 3600) / 60);
    const seconds = Math.floor(timestamp % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  private updateFoodObjectMap(objectKey: string, percentage: number, timestamp: number): void {
    const existing = this.foodObjectMap.get(objectKey);
    const currentTimeString = this.formatTimestamp(timestamp);
    
    if (existing) {
      const previousPercentage = existing.lastPercentage;
      const previousTimeString = existing.lastDetectionTime;
      
      // Only update percentage if it's less than current (indicating consumption)
      if (percentage < previousPercentage) {
        const change = previousPercentage - percentage;
        print(`🔄 Updated: ${objectKey} - ${percentage}% remaining (${change}% consumed since ${previousTimeString})`);
        
        // Update the map with new percentage and timestamp, preserving previous data
        this.foodObjectMap.set(objectKey, {
          lastPercentage: percentage,
          lastTimestamp: timestamp,
          lastDetectionTime: currentTimeString,
          previousPercentage: existing.lastPercentage,
          previousTimestamp: existing.lastTimestamp,
          previousDetectionTime: existing.lastDetectionTime
        });
      } else {
        print(`📊 Detected: ${objectKey} - ${percentage}% remaining (no change since ${previousTimeString})`);
        
        // Only update timestamp, keep previous percentage and preserve previous data
        this.foodObjectMap.set(objectKey, {
          lastPercentage: existing.lastPercentage,
          lastTimestamp: timestamp,
          lastDetectionTime: currentTimeString,
          previousPercentage: existing.previousPercentage,
          previousTimestamp: existing.previousTimestamp,
          previousDetectionTime: existing.previousDetectionTime
        });
      }
    } else {
      print(`🆕 New food detected: ${objectKey} - ${percentage}% remaining at ${currentTimeString}`);
      
      // Create new entry
      this.foodObjectMap.set(objectKey, {
        lastPercentage: percentage,
        lastTimestamp: timestamp,
        lastDetectionTime: currentTimeString,
        previousPercentage: percentage,
        previousTimestamp: timestamp,
        previousDetectionTime: currentTimeString
      });
    }
  }
  
  private logObjectTrackingStatus(): void {
    print(`\n📊 OBJECT TRACKING SUMMARY (${this.foodObjectMap.size} unique objects tracked):`);
    
    if (this.foodObjectMap.size === 0) {
      print("   No objects currently tracked");
      return;
    }
    
    for (const [objectKey, data] of this.foodObjectMap) {
      const totalConsumption = 100 - data.lastPercentage;
      
      print(`   📦 ${objectKey}:`);
      print(`      - Current: ${data.lastPercentage}% remaining`);
      print(`      - Consumed: ${totalConsumption}% total`);
      print(`      - Last detection: ${data.lastDetectionTime}`);
    }
  }

  private calculateAverageFoodPercentage(): number {
    print(`🔢 Calculating average from ${this.foodObjectMap.size} objects...`);
    
    if (this.foodObjectMap.size === 0) {
      print(`⚠️ No objects in map - returning default 100%`);
      return 100; // Default to 100% if no objects
    }
    
    let totalPercentage = 0;
    let itemCount = 0;
    
    for (const [objectKey, data] of this.foodObjectMap) {
      print(`📊 ${objectKey}: ${data.lastPercentage}%`);
      totalPercentage += data.lastPercentage;
      itemCount++;
    }
    
    const average = totalPercentage / itemCount;
    print(`🧮 Calculated average: ${totalPercentage} ÷ ${itemCount} = ${average.toFixed(1)}%`);
    
    return average;
  }

  private updateCatPrompts(): void {
    if (this.catAnimator) {
      const averagePercentage = this.calculateAverageFoodPercentage();
      const foodItems = this.getDetectedFoodItems();
      
      this.catAnimator.updateFoodPercentage(averagePercentage);
      this.catAnimator.updateFoodItems(foodItems);
      
      print(`🐱 Updated cat prompts for ${averagePercentage.toFixed(1)}% food remaining`);
      print(`🍎 Detected food items: ${foodItems.join(', ')}`);
    }
  }

  private getDetectedFoodItems(): string[] {
    const foodItems: string[] = [];
    for (const [objectKey, data] of this.foodObjectMap) {
      if (data.lastPercentage < 100) { // Only include items that have been consumed
        foodItems.push(objectKey);
      }
    }
    return foodItems;
  }
}