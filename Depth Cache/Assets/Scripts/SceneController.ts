import { GeminiAPI } from "./GeminiAPI";
import { SpeechUI } from "./SpeechUI";
import { ResponseUI } from "./ResponseUI";
import { Loading } from "./Loading";
import { DepthCache } from "./DepthCache";
import { DebugVisualizer } from "./DebugVisualizer";
import { ScoringEngine } from "./ScoringEngine";
import { FoodSample, ScoringResult, IntervalData, SessionStats } from "./ScoringTypes";

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
  @hint("Scoring engine for eating pace evaluation")
  scoringEngine: ScoringEngine;

  @input
  @allowUndefined
  @hint("Sprite for high food level (>80%)")
  highFoodSprite: Text;

  @input
  @allowUndefined
  @hint("Sprite for medium food level (60-80%)")
  mediumFoodSprite: Text;

  @input
  @allowUndefined
  @hint("Sprite for low food level (30-60%)")
  lowFoodSprite: Text;

  @input
  @allowUndefined
  @hint("Sprite for very low food level (<30%)")
  veryLowFoodSprite: Text;

  @input
  @allowUndefined
  @hint("Prefab for boundary visualization (circle/sphere)")
  boundaryPrefab: any;

  @input
  @hint("Default boundary radius for food objects")
  defaultBoundaryRadius: number = 0.5;

  @input
  @hint("Show boundary visualizations")
  showBoundaryVisuals: boolean = true;

  private isRequestRunning = false;
  private lastCaptureTime: number = 0;
  private readonly CAPTURE_INTERVAL: number = 30; // 30 seconds
  
  // Food tracking system - simplified map approach
  private foodObjectMap: Map<string, {
    lastPercentage: number, 
    lastTimestamp: number, 
    lastDetectionTime: string,
    previousPercentage: number,
    previousTimestamp: number,
    previousDetectionTime: string,
    // Dynamic positioning system
    basePosition: vec3,
    currentPosition: vec3,
    boundaryRadius: number,
    isMoving: boolean,
    lastMovementTime: number
  }> = new Map();
  private captureCount: number = 0;
  
  // Scoring system data
  private foodSamples: FoodSample[] = [];
  private currentScoringResult: ScoringResult | null = null;
  private sessionStartTime: number = 0;
  
  // Simple inline scoring system (fallback when ScoringEngine not available)
  private inlineScoringConfig = {
    idealRate: 0.5,
    tolerance: 0.2,
    minIntervalDuration: 5,
    maxIntervalDuration: 60
  };
  
  // Boundary visualization
  private boundaryVisuals: Map<string, any> = new Map(); // GameObject references for boundary visuals
  private showBoundaries: boolean = true;

  onAwake() {
    this.createEvent("OnStartEvent").bind(this.onStart.bind(this));
  }

  onStart() {
    print("🎮 SceneController ENABLED - Auto-capture every 30 seconds");
    
    // Initialize timer - start counting from now
    this.lastCaptureTime = getTime();
    this.sessionStartTime = getTime();
    
    // Initialize scoring engine
    if (this.scoringEngine) {
      print("📊 Scoring Engine initialized");
    } else {
      print("⚠️ Scoring Engine not assigned - scoring will be disabled");
    }
    
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
    print("🚀 Sending request to Gemini...");
    this.gemini.makeGeminiRequest(cameraFrame, text, (response) => {
      print("📨 Gemini response received!");
      this.isRequestRunning = false;
      this.loading.activateLoder(false);
      
      // Log completion and reset timer
      print("✅ Capture completed - Timer reset to 30s");
      
      print("GEMINI Points LENGTH: " + response.points.length);
      print("GEMINI Response: " + JSON.stringify(response));
      this.responseUI.openResponseBubble(response.aiMessage);
      
      // Process all detected objects with tracking
      print("🔍 About to process all detected objects...");
      this.processAllObjects(response, depthFrameID);
      
      //create points and labels (only for food items with tracking info)
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
          // Show 3D labels for all objects, with tracking info for food items
          const labelInfo = this.getLabelInfo(pointObj.label, worldPosition);
          
          // Get the dynamic position for the label (constrained to boundary)
          const objectKey = this.getNormalizedObjectKey(pointObj.label);
          const dynamicPosition = this.getCurrentPositionForLabel(objectKey);
          
          print(`🏷️ Creating 3D label for: ${pointObj.label} at dynamic position: ${dynamicPosition.x}, ${dynamicPosition.y}, ${dynamicPosition.z}`);
          this.responseUI.loadWorldLabel(
            labelInfo,
            dynamicPosition,
            pointObj.showArrow
          );
        }
      }
      this.depthCache.disposeDepthFrame(depthFrameID);
    });
  }

  // Simplified food tracking methods
  private processAllObjects(response: any, depthFrameID: number): void {
    this.captureCount++;
    const currentTime = getTime();
    
    print(`\n📊 === CAPTURE #${this.captureCount} OBJECT ANALYSIS ===`);
    print(`🔍 Processing ${response.points.length} detected objects...`);
    
    // Process each detected object
    for (var i = 0; i < response.points.length; i++) {
      var pointObj = response.points[i];
      print(`🔍 Object ${i}: ${pointObj.label}`);
      var worldPosition = this.depthCache.getWorldPositionWithID(
        pointObj.pixelPos,
        depthFrameID
      );
      
      if (worldPosition != null) {
        print(`✅ World position found for: ${pointObj.label}`);
        // Extract consumption percentage from label if present
        const consumption = this.extractConsumptionPercentage(pointObj.label);
        
        // Get normalized object key (groups similar objects)
        const objectKey = this.getNormalizedObjectKey(pointObj.label);
        
        // Update or create entry in map
        this.updateFoodObjectMap(objectKey, consumption, currentTime, worldPosition);
      } else {
        print(`❌ No world position for: ${pointObj.label}`);
      }
    }
    
    // Log all tracked objects
    this.logObjectTrackingStatus();
    
    // Update sprite based on average object percentage
    this.updateObjectLevelSprite();
    
    // Update scoring system with current food samples
    this.updateScoringSystem();
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
  
  private updateFoodObjectMap(objectKey: string, percentage: number, timestamp: number, worldPosition?: vec3): void {
    const existing = this.foodObjectMap.get(objectKey);
    const currentTimeString = this.formatTimestamp(timestamp);
    
    if (existing) {
      const previousPercentage = existing.lastPercentage;
      const previousTimeString = existing.lastDetectionTime;
      
      // Calculate new position if world position is provided
      let newPosition = existing.currentPosition;
      let isMoving = false;
      
      if (worldPosition) {
        // Check if the object has moved significantly
        const distance = this.calculateDistance(existing.currentPosition, worldPosition);
        const movementThreshold = 0.1; // 10cm threshold
        
        if (distance > movementThreshold) {
          // Object has moved - update position within boundary
          newPosition = this.constrainToBoundary(worldPosition, existing.basePosition, existing.boundaryRadius);
          isMoving = true;
          print(`📍 ${objectKey} moved: ${distance.toFixed(2)}m (constrained to boundary)`);
        }
      }
      
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
          previousDetectionTime: existing.lastDetectionTime,
          basePosition: existing.basePosition,
          currentPosition: newPosition,
          boundaryRadius: existing.boundaryRadius,
          isMoving: isMoving,
          lastMovementTime: isMoving ? timestamp : existing.lastMovementTime
        });
      } else {
        print(`📊 Detected: ${objectKey} - ${percentage}% remaining (no change since ${previousTimeString})`);
        
        // Only update timestamp and position, keep previous percentage and preserve previous data
        this.foodObjectMap.set(objectKey, {
          lastPercentage: existing.lastPercentage,
          lastTimestamp: timestamp,
          lastDetectionTime: currentTimeString,
          previousPercentage: existing.previousPercentage,
          previousTimestamp: existing.previousTimestamp,
          previousDetectionTime: existing.previousDetectionTime,
          basePosition: existing.basePosition,
          currentPosition: newPosition,
          boundaryRadius: existing.boundaryRadius,
          isMoving: isMoving,
          lastMovementTime: isMoving ? timestamp : existing.lastMovementTime
        });
      }
    } else {
      print(`🆕 New food detected: ${objectKey} - ${percentage}% remaining at ${currentTimeString}`);
      
      // Create new entry with initial position data
      const initialPosition = worldPosition || new vec3(0, 0, 0);
      const boundaryRadius = this.defaultBoundaryRadius;
      
      this.foodObjectMap.set(objectKey, {
        lastPercentage: percentage,
        lastTimestamp: timestamp,
        lastDetectionTime: currentTimeString,
        previousPercentage: percentage,
        previousTimestamp: timestamp,
        previousDetectionTime: currentTimeString,
        basePosition: initialPosition,
        currentPosition: initialPosition,
        boundaryRadius: boundaryRadius,
        isMoving: false,
        lastMovementTime: timestamp
      });
      
      // Create boundary visualization for new object
      if (this.showBoundaryVisuals) {
        this.createBoundaryVisualization(objectKey, initialPosition, boundaryRadius);
      }
    }
  }
  
  private logObjectTrackingStatus(): void {
    print(`\n📊 OBJECT TRACKING SUMMARY (${this.foodObjectMap.size} unique objects tracked):`);
    
    if (this.foodObjectMap.size === 0) {
      print("   No objects currently tracked");
      return;
    }
    
    const currentTime = getTime();
    for (const [objectKey, data] of this.foodObjectMap) {
      const totalConsumption = 100 - data.lastPercentage;
      
      print(`   📦 ${objectKey}:`);
      print(`      - Current: ${data.lastPercentage}% remaining`);
      print(`      - Consumed: ${totalConsumption}% total`);
      print(`      - Last detection: ${data.lastDetectionTime}`);
    }
  }
  
  private getLabelInfo(label: string, worldPos: vec3): string {
    const objectKey = this.getNormalizedObjectKey(label);
    const currentPercentage = this.extractConsumptionPercentage(label);
    const existing = this.foodObjectMap.get(objectKey);
    
    print(`🔍 Label Info Debug: ${label} -> ${objectKey}, current: ${currentPercentage}%, existing: ${existing ? 'yes' : 'no'}`);
    
    if (existing) {
      // Show current percentage, previous timestamp, and previous percentage
      const labelText = `${label}\nCurrent: ${currentPercentage}%\nPrevious: ${existing.previousPercentage}% at ${existing.previousDetectionTime}`;
      print(`📝 Generated label: ${labelText}`);
      return labelText;
    } else {
      // New food item - just show current percentage
      const labelText = `${label}\nCurrent: ${currentPercentage}%\nNew Item`;
      print(`📝 Generated label: ${labelText}`);
      return labelText;
    }
  }
  
  private getTrackingInfoForLabel(label: string, worldPos: vec3): string {
    const objectKey = this.getNormalizedObjectKey(label);
    const existing = this.foodObjectMap.get(objectKey);
    
    if (existing) {
      return `(${existing.lastPercentage}%, ${existing.lastDetectionTime})`;
    }
    return "(New)";
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
  
  private updateObjectLevelSprite(): void {
    const averagePercentage = this.calculateAverageFoodPercentage();
    
    // Enhanced logging for average calculation
    if (this.foodObjectMap.size === 0) {
      print(`📊 Average object percentage: 100.0% (No objects detected - using default)`);
    } else {
      print(`📊 Average object percentage: ${averagePercentage.toFixed(1)}% (from ${this.foodObjectMap.size} objects)`);
    }
    
    // Hide all sprites first
    this.hideAllSprites();
    
    if (averagePercentage > 80) {
      print(`🟢 HIGH OBJECT LEVEL (>80%) - ${averagePercentage.toFixed(1)}%`);
      this.loadSprite(this.highFoodSprite);
    } else if (averagePercentage > 60) {
      print(`🟡 MEDIUM OBJECT LEVEL (60-80%) - ${averagePercentage.toFixed(1)}%`);
      this.loadSprite(this.mediumFoodSprite);
    } else if (averagePercentage > 30) {
      print(`🟠 LOW OBJECT LEVEL (30-60%) - ${averagePercentage.toFixed(1)}%`);
      this.loadSprite(this.lowFoodSprite);
    } else {
      print(`🔴 VERY LOW OBJECT LEVEL (<30%) - ${averagePercentage.toFixed(1)}%`);
      this.loadSprite(this.veryLowFoodSprite);
    }
  }

  private hideAllSprites(): void {
    if (this.highFoodSprite) {
      this.highFoodSprite.enabled = false;
    }
    if (this.mediumFoodSprite) {
      this.mediumFoodSprite.enabled = false;
    }
    if (this.lowFoodSprite) {
      this.lowFoodSprite.enabled = false;
    }
    if (this.veryLowFoodSprite) {
      this.veryLowFoodSprite.enabled = false;
    }
  }

  private loadSprite(sprite: any): void {
    if (sprite) {
      sprite.enabled = true;
      print(`🎨 Loading sprite: ${sprite.name || 'unnamed'}`);
    } else {
      print(`⚠️ Sprite not assigned`);
    }
  }

  // Boundary and positioning helper methods
  private calculateDistance(pos1: vec3, pos2: vec3): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private constrainToBoundary(newPosition: vec3, basePosition: vec3, radius: number): vec3 {
    const distance = this.calculateDistance(newPosition, basePosition);
    
    if (distance <= radius) {
      // Position is within boundary
      return newPosition;
    } else {
      // Position is outside boundary - constrain it
      const direction = new vec3(
        newPosition.x - basePosition.x,
        newPosition.y - basePosition.y,
        newPosition.z - basePosition.z
      );
      
      // Normalize direction and scale to boundary radius
      const normalizedDirection = new vec3(
        direction.x / distance,
        direction.y / distance,
        direction.z / distance
      );
      
      return new vec3(
        basePosition.x + normalizedDirection.x * radius,
        basePosition.y + normalizedDirection.y * radius,
        basePosition.z + normalizedDirection.z * radius
      );
    }
  }

  private createBoundaryVisualization(objectKey: string, position: vec3, radius: number): void {
    if (!this.boundaryPrefab) {
      print(`⚠️ Boundary prefab not assigned - cannot create visualization for ${objectKey}`);
      return;
    }

    try {
      // Create boundary visualization GameObject
      const boundaryVisual = this.boundaryPrefab.instantiate();
      
      // Position the boundary visualization
      boundaryVisual.getTransform().setWorldPosition(position);
      
      // Scale the boundary visualization to match the radius
      const scale = radius * 2; // Diameter = 2 * radius
      boundaryVisual.getTransform().setWorldScale(new vec3(scale, scale, scale));
      
      // Make it semi-transparent and wireframe-like
      const renderer = boundaryVisual.getComponent("Component.RenderMeshVisual");
      if (renderer) {
        // You might need to adjust material properties here
        print(`🎨 Created boundary visualization for ${objectKey} at radius ${radius}m`);
      }
      
      // Store reference for later updates
      this.boundaryVisuals.set(objectKey, boundaryVisual);
      
    } catch (error) {
      print(`❌ Failed to create boundary visualization for ${objectKey}: ${error}`);
    }
  }

  private updateBoundaryVisualization(objectKey: string, position: vec3, radius: number): void {
    const boundaryVisual = this.boundaryVisuals.get(objectKey);
    if (boundaryVisual) {
      // Update position
      boundaryVisual.getTransform().setWorldPosition(position);
      
      // Update scale
      const scale = radius * 2;
      boundaryVisual.getTransform().setWorldScale(new vec3(scale, scale, scale));
      
      print(`🔄 Updated boundary visualization for ${objectKey}`);
    }
  }

  private removeBoundaryVisualization(objectKey: string): void {
    const boundaryVisual = this.boundaryVisuals.get(objectKey);
    if (boundaryVisual) {
      boundaryVisual.destroy();
      this.boundaryVisuals.delete(objectKey);
      print(`🗑️ Removed boundary visualization for ${objectKey}`);
    }
  }

  // Method to get current position for label placement
  private getCurrentPositionForLabel(objectKey: string): vec3 {
    const data = this.foodObjectMap.get(objectKey);
    return data ? data.currentPosition : new vec3(0, 0, 0);
  }

  // === SCORING SYSTEM METHODS ===

  /**
   * Update the scoring system with current food samples
   */
  private updateScoringSystem(): void {
    // Calculate average food remaining percentage
    const averageFoodRemaining = this.calculateAverageFoodPercentage();
    const currentTime = getTime();
    
    // Create food sample
    const foodSample: FoodSample = {
      timestamp: currentTime * 1000, // Convert to milliseconds
      foodRemaining: averageFoodRemaining,
      confidence: 0.9 // High confidence for tracked objects
    };

    // Add to samples array
    this.foodSamples.push(foodSample);
    
    print(`📊 Added food sample: ${averageFoodRemaining.toFixed(1)}% remaining at ${this.formatTimestamp(currentTime)}`);

    // Calculate score if we have enough samples
    if (this.foodSamples.length >= 2) {
      try {
        if (this.scoringEngine) {
          // Use external ScoringEngine if available
          this.currentScoringResult = this.scoringEngine.calculateScore(this.foodSamples);
        } else {
          // Use inline scoring system as fallback
          this.currentScoringResult = this.calculateInlineScore(this.foodSamples);
        }
        this.displayScoringResults();
      } catch (error) {
        print(`❌ Scoring calculation failed: ${error}`);
      }
    }
  }

  /**
   * Display scoring results to the user
   */
  private displayScoringResults(): void {
    if (!this.currentScoringResult) {
      return;
    }

    const result = this.currentScoringResult;
    const stats = result.sessionStats;

    // Create comprehensive scoring message
    const scoringMessage = this.createScoringMessage(result);
    
    // Display in response UI
    this.responseUI.openResponseBubble(scoringMessage);
    
    // Log detailed scoring information
    this.logDetailedScoringResults(result);
    
    // Update pace indicators
    this.displayPaceIndicators(result);
  }

  /**
   * Create a user-friendly scoring message
   */
  private createScoringMessage(result: ScoringResult): string {
    const stats = result.sessionStats;
    const sessionDuration = Math.floor(stats.totalDuration);
    const minutes = Math.floor(sessionDuration / 60);
    const seconds = sessionDuration % 60;
    
    let message = `🍽️ Eating Pace Score: ${result.totalScore.toFixed(1)} (${result.grade})\n\n`;
    
    message += `📊 Session Stats:\n`;
    message += `• Duration: ${minutes}:${seconds.toString().padStart(2, '0')}\n`;
    message += `• Food Consumed: ${stats.totalFoodConsumed.toFixed(1)}%\n`;
    message += `• Average Rate: ${stats.averageRate.toFixed(2)}%/s\n`;
    message += `• Consistency: ${(stats.consistency * 100).toFixed(1)}%\n\n`;
    
    if (result.streaks.length > 0) {
      message += `🔥 Streaks: ${result.streaks.length} streak(s) detected!\n`;
      result.streaks.forEach((streak, index) => {
        message += `• Streak ${index + 1}: ${streak.length} intervals (${streak.bonusMultiplier.toFixed(1)}x bonus)\n`;
      });
      message += `\n`;
    }
    
    // Add pace recommendation
    if (this.scoringEngine && result.intervals.length > 0) {
      const latestPaceIndicators = this.scoringEngine.generatePaceIndicators(result.intervals.slice(-3));
      const latestPace = latestPaceIndicators[latestPaceIndicators.length - 1];
      
      message += `💡 Current Pace: ${latestPace.status.replace('-', ' ').toUpperCase()}\n`;
      message += `📝 Recommendation: ${latestPace.recommendation}`;
    } else if (result.intervals.length > 0) {
      // Use inline pace calculation
      const latestInterval = result.intervals[result.intervals.length - 1];
      const rate = latestInterval.consumptionRate;
      const idealRate = this.inlineScoringConfig.idealRate;
      const tolerance = this.inlineScoringConfig.tolerance;
      const deviation = rate - idealRate;
      
      let paceStatus = 'ideal';
      let recommendation = 'Perfect pace! Keep it up';
      
      if (rate === 0) {
        paceStatus = 'stopped';
        recommendation = 'Try taking a small bite to get started';
      } else if (deviation > tolerance) {
        paceStatus = 'too fast';
        recommendation = 'Slow down a bit - savor each bite';
      } else if (deviation < -tolerance) {
        paceStatus = 'too slow';
        recommendation = 'Try to maintain a steady pace';
      }
      
      message += `💡 Current Pace: ${paceStatus.toUpperCase()}\n`;
      message += `📝 Recommendation: ${recommendation}`;
    }
    
    return message;
  }

  /**
   * Log detailed scoring results for debugging
   */
  private logDetailedScoringResults(result: ScoringResult): void {
    print(`\n🏆 === SCORING RESULTS ===`);
    print(`📊 Total Score: ${result.totalScore.toFixed(1)}`);
    print(`📈 Grade: ${result.grade}`);
    print(`⏱️ Session Duration: ${result.sessionStats.totalDuration.toFixed(1)}s`);
    print(`🍎 Total Food Consumed: ${result.sessionStats.totalFoodConsumed.toFixed(1)}%`);
    print(`📊 Average Rate: ${result.sessionStats.averageRate.toFixed(2)}%/s`);
    print(`🎯 Ideal Rate Intervals: ${result.sessionStats.idealRateCount}/${result.sessionStats.intervalCount}`);
    print(`🔥 Streaks: ${result.streaks.length}`);
    print(`📊 Consistency: ${(result.sessionStats.consistency * 100).toFixed(1)}%`);
    
    if (result.intervals.length > 0) {
      print(`\n📈 Recent Intervals:`);
      const recentIntervals = result.intervals.slice(-3);
      recentIntervals.forEach((interval, index) => {
        if (this.scoringEngine) {
          const paceIndicators = this.scoringEngine.generatePaceIndicators([interval]);
          const pace = paceIndicators[0];
          print(`  Interval ${result.intervals.length - recentIntervals.length + index + 1}: ${interval.consumptionRate.toFixed(2)}%/s (${pace.status}) - Score: ${interval.score.toFixed(1)}`);
        } else {
          // Use inline pace calculation
          const rate = interval.consumptionRate;
          const idealRate = this.inlineScoringConfig.idealRate;
          const tolerance = this.inlineScoringConfig.tolerance;
          const deviation = rate - idealRate;
          
          let paceStatus = 'ideal';
          if (rate === 0) {
            paceStatus = 'stopped';
          } else if (deviation > tolerance) {
            paceStatus = 'too-fast';
          } else if (deviation < -tolerance) {
            paceStatus = 'too-slow';
          }
          
          print(`  Interval ${result.intervals.length - recentIntervals.length + index + 1}: ${interval.consumptionRate.toFixed(2)}%/s (${paceStatus}) - Score: ${interval.score.toFixed(1)}`);
        }
      });
    }
  }

  /**
   * Display pace indicators for recent intervals
   */
  private displayPaceIndicators(result: ScoringResult): void {
    if (result.intervals.length === 0) {
      return;
    }

    const recentIntervals = result.intervals.slice(-3);
    const paceIndicators = this.scoringEngine.generatePaceIndicators(recentIntervals);
    
    print(`\n🎯 === PACE INDICATORS ===`);
    paceIndicators.forEach((indicator, index) => {
      const intervalNumber = result.intervals.length - recentIntervals.length + index + 1;
      print(`Interval ${intervalNumber}: ${indicator.status.toUpperCase()} (${indicator.deviation > 0 ? '+' : ''}${indicator.deviation.toFixed(2)}%/s)`);
      print(`  💡 ${indicator.recommendation}`);
    });
  }

  /**
   * Get current scoring result for external access
   */
  getCurrentScoringResult(): ScoringResult | null {
    return this.currentScoringResult;
  }

  /**
   * Reset scoring session
   */
  resetScoringSession(): void {
    this.foodSamples = [];
    this.currentScoringResult = null;
    this.sessionStartTime = getTime();
    print("🔄 Scoring session reset");
  }

  /**
   * Get session statistics
   */
  getSessionStats(): any {
    if (!this.currentScoringResult) {
      return null;
    }

    return {
      totalScore: this.currentScoringResult.totalScore,
      grade: this.currentScoringResult.grade,
      sessionDuration: this.currentScoringResult.sessionStats.totalDuration,
      foodConsumed: this.currentScoringResult.sessionStats.totalFoodConsumed,
      averageRate: this.currentScoringResult.sessionStats.averageRate,
      consistency: this.currentScoringResult.sessionStats.consistency,
      streakCount: this.currentScoringResult.streaks.length,
      intervalCount: this.currentScoringResult.sessionStats.intervalCount,
      idealRateCount: this.currentScoringResult.sessionStats.idealRateCount
    };
  }

  /**
   * Calculate inline score using simplified algorithm (fallback when ScoringEngine not available)
   */
  private calculateInlineScore(samples: FoodSample[]): ScoringResult {
    const sortedSamples = [...samples].sort((a, b) => a.timestamp - b.timestamp);
    const intervals: IntervalData[] = [];

    // Calculate intervals
    for (let i = 0; i < sortedSamples.length - 1; i++) {
      const current = sortedSamples[i];
      const next = sortedSamples[i + 1];
      const duration = (next.timestamp - current.timestamp) / 1000;

      if (duration >= this.inlineScoringConfig.minIntervalDuration && 
          duration <= this.inlineScoringConfig.maxIntervalDuration) {
        const foodConsumed = Math.max(0, current.foodRemaining - next.foodRemaining);
        const consumptionRate = foodConsumed / duration;

        intervals.push({
          startTime: current.timestamp,
          endTime: next.timestamp,
          duration,
          foodConsumed,
          consumptionRate,
          score: this.calculateInlineIntervalScore(consumptionRate),
          meetsIdealRate: Math.abs(consumptionRate - this.inlineScoringConfig.idealRate) <= this.inlineScoringConfig.tolerance
        });
      }
    }

    // Calculate base score
    const baseScore = intervals.reduce((sum, interval) => sum + interval.score, 0);

    // Calculate session statistics
    const startTime = sortedSamples[0].timestamp;
    const endTime = sortedSamples[sortedSamples.length - 1].timestamp;
    const totalDuration = (endTime - startTime) / 1000;
    const totalFoodConsumed = sortedSamples[0].foodRemaining - sortedSamples[sortedSamples.length - 1].foodRemaining;
    const averageRate = intervals.length > 0 ? 
      intervals.reduce((sum, interval) => sum + interval.consumptionRate, 0) / intervals.length : 0;
    const idealRateCount = intervals.filter(interval => interval.meetsIdealRate).length;
    
    // Calculate consistency
    const rates = intervals.map(interval => interval.consumptionRate);
    const mean = averageRate;
    const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length;
    const standardDeviation = Math.sqrt(variance);
    const consistency = Math.max(0, 1 - (standardDeviation / (this.inlineScoringConfig.idealRate * 2)));

    const sessionStats: SessionStats = {
      totalDuration,
      totalFoodConsumed,
      averageRate,
      intervalCount: intervals.length,
      idealRateCount,
      consistency,
      startTime,
      endTime
    };

    // Apply duration multiplier
    const durationMultiplier = this.calculateInlineDurationMultiplier(totalDuration);
    const totalScore = baseScore * durationMultiplier;

    // Calculate grade
    const grade = this.calculateInlineGrade(totalScore, sessionStats);

    return {
      totalScore,
      baseScore,
      durationMultiplier,
      intervals,
      streaks: [], // Simplified - no streaks in inline version
      sessionStats,
      grade
    };
  }

  /**
   * Calculate score for a single interval using inline algorithm
   */
  private calculateInlineIntervalScore(rate: number): number {
    const idealRate = this.inlineScoringConfig.idealRate;
    const tolerance = this.inlineScoringConfig.tolerance;
    const deviation = Math.abs(rate - idealRate);

    if (deviation <= tolerance) {
      return 100; // Perfect score
    } else if (deviation <= tolerance + 0.3) {
      return 80; // Good
    } else if (deviation <= tolerance + 0.6) {
      return 60; // Fair
    } else {
      return 40; // Poor
    }
  }

  /**
   * Calculate duration multiplier for inline scoring
   */
  private calculateInlineDurationMultiplier(duration: number): number {
    if (duration < 60) {
      return 0.8; // Short session penalty
    } else if (duration > 1800) {
      return 1.2; // Long session bonus
    } else {
      return 1.0; // Normal session
    }
  }

  /**
   * Calculate grade for inline scoring
   */
  private calculateInlineGrade(totalScore: number, sessionStats: SessionStats): ScoringResult['grade'] {
    const normalizedScore = totalScore / (sessionStats.intervalCount * 100);
    const consistencyBonus = sessionStats.consistency * 0.1;
    const finalScore = Math.min(1, normalizedScore + consistencyBonus);

    if (finalScore >= 0.95) return 'A+';
    if (finalScore >= 0.90) return 'A';
    if (finalScore >= 0.85) return 'A-';
    if (finalScore >= 0.80) return 'B+';
    if (finalScore >= 0.75) return 'B';
    if (finalScore >= 0.70) return 'B-';
    if (finalScore >= 0.65) return 'C+';
    if (finalScore >= 0.60) return 'C';
    if (finalScore >= 0.55) return 'C-';
    if (finalScore >= 0.50) return 'D';
    return 'F';
  }
}
