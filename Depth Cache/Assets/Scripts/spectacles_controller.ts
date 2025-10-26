@component
export class SpectaclesController extends BaseScriptComponent {
    
    // ==========================================
    // INPUTS (Assign in Inspector)
    // ==========================================
    
    @input
    depthCache: DepthCache; // The actual DepthCache component from the sample!
    
    @input
    dogSprite: Image;
    
    @input
    messageText: Text;
    
    @input
    progressBar: Image;
    
    @input
    dogResting: Texture;
    
    @input
    dogWalking: Texture;
    
    @input
    dogPlaying: Texture;
    
    @input
    dogExcited: Texture;
    
    @input
    @optional
    dogAnimator: AnimationMixer;
    
    @input
    fetchAIAgent: FetchAIAgent;
    
    // ==========================================
    // CONFIGURATION
    // ==========================================
    
    private readonly API_URL: string = "http://your-server.com:8000/analyze";
    private readonly CAPTURE_INTERVAL: number = 30; // seconds
    
    // ==========================================
    // STATE
    // ==========================================
    
    private sessionId: string;
    private userId: string;
    private lastCaptureTime: number = 0;
    private isTracking: boolean = false;
    
    private dogHappiness: number = 5;
    private dogActivity: number = 5;
    private dogVisualState: string = "resting";
    
    // ==========================================
    // LIFECYCLE
    // ==========================================
    
    onAwake() {
        this.sessionId = this.generateSessionId();
        this.userId = "user_" + Date.now();
        
        print("🎮 Eating Support Lens Initialized!");
        print("Session ID: " + this.sessionId);
        
        // Set up update event
        this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));
        
        // Set up tap event for start/stop
        this.createEvent("TapEvent").bind(this.onTap.bind(this));
        
        // Initialize UI
        this.initializeUI();
    }
    
    private onUpdate(eventData: UpdateEvent): void {
        if (!this.isTracking) return;
        
        const currentTime = getTime();
        
        if (currentTime - this.lastCaptureTime >= this.CAPTURE_INTERVAL) {
            this.captureAndAnalyze();
            this.lastCaptureTime = currentTime;
        }
    }
    
    private onTap(): void {
        this.isTracking = !this.isTracking;
        
        if (this.isTracking) {
            print("▶️ Started meal tracking");
            this.messageText.text = "Meal tracking started! 🍽️";
            this.sessionId = this.generateSessionId();
        } else {
            print("⏸️ Paused meal tracking");
            this.messageText.text = "Tracking paused";
            this.endSession();
        }
    }
    
    private initializeUI(): void {
        this.dogSprite.mainPass.baseTex = this.dogResting;
        this.messageText.text = "Tap to start tracking";
    }
    
    // ==========================================
    // CAPTURE & SEND - Using DepthCache!
    // ==========================================
    
    private captureAndAnalyze(): void {
        print("📸 Capturing food state...");
        
        try {
            // 1. Save a depth frame snapshot (this captures both RGB + depth)
            const depthFrameID = this.depthCache.saveDepthFrame();
            
            if (depthFrameID === null || depthFrameID === undefined) {
                print("⚠️ Failed to save depth frame");
                this.showError();
                return;
            }
            
            print(`✅ Saved depth frame with ID: ${depthFrameID}`);
            
            // 2. Get the RGB camera image for this frame
            const cameraTexture = this.depthCache.getCamImageWithID(depthFrameID);
            
            if (!cameraTexture) {
                print("⚠️ No camera texture for depth frame");
                this.depthCache.disposeDepthFrame(depthFrameID);
                this.showError();
                return;
            }
            
            // 3. Use FetchAIAgent for analysis
            this.fetchAIAgent.sendMealCapture(
                cameraTexture,
                depthFrameID,
                this.sessionId,
                this.userId,
                (analysisResult) => {
                    print(`✅ Received analysis result: ${JSON.stringify(analysisResult)}`);
                    this.updateUIFromAnalysis(analysisResult);
                    this.depthCache.disposeDepthFrame(depthFrameID);
                }
            );
            
        } catch (error) {
            print("❌ Capture error: " + error);
            this.showError();
        }
    }
    
    // ==========================================
    // DEPTH DATA EXTRACTION
    // ==========================================
    
    private extractDepthData(depthFrameID: number): {width: number, height: number, values: number[]} {
        // Access the cached depth-color pair
        const cachedPair = (this.depthCache as any).cachedDepthFrames.get(depthFrameID);
        
        if (!cachedPair) {
            print("⚠️ No cached pair for depth frame ID");
            return {width: 0, height: 0, values: []};
        }
        
        // Get the depth frame data (Float32Array)
        const depthFrameData: Float32Array = cachedPair.depthFrameData;
        const depthCamera: DeviceCamera = cachedPair.depthDeviceCamera;
        
        const width = depthCamera.resolution.x;
        const height = depthCamera.resolution.y;
        
        print(`📏 Full depth resolution: ${width}x${height} (${depthFrameData.length} values)`);
        
        // Option 1: Send full depth data (may be large)
        // return {
        //     width: width,
        //     height: height,
        //     values: Array.from(depthFrameData)
        // };
        
        // Option 2: Downsample for efficiency (recommended)
        return this.downsampleDepthData(depthFrameData, width, height, 64, 64);
    }
    
    private downsampleDepthData(
        fullDepthData: Float32Array,
        fullWidth: number,
        fullHeight: number,
        targetWidth: number,
        targetHeight: number
    ): {width: number, height: number, values: number[]} {
        
        const downsampledValues: number[] = [];
        
        const stepX = fullWidth / targetWidth;
        const stepY = fullHeight / targetHeight;
        
        for (let y = 0; y < targetHeight; y++) {
            for (let x = 0; x < targetWidth; x++) {
                // Calculate source position
                const srcX = Math.floor(x * stepX);
                const srcY = Math.floor(y * stepY);
                
                // Get depth value at this position
                const index = srcX + srcY * fullWidth;
                const depthValue = fullDepthData[index];
                
                downsampledValues.push(depthValue);
            }
        }
        
        print(`📊 Downsampled depth: ${fullWidth}x${fullHeight} → ${targetWidth}x${targetHeight} (${downsampledValues.length} values)`);
        
        return {
            width: targetWidth,
            height: targetHeight,
            values: downsampledValues
        };
    }
    
    // ==========================================
    // ALTERNATIVE: Sample Key Points Only
    // ==========================================
    
    private sampleKeyDepthPoints(depthFrameID: number): {width: number, height: number, values: number[]} {
        // Sample just a few strategic points instead of full/downsampled data
        const keyPoints = [
            new vec2(0.5, 0.5),   // Center
            new vec2(0.3, 0.5),   // Left
            new vec2(0.7, 0.5),   // Right
            new vec2(0.5, 0.3),   // Top
            new vec2(0.5, 0.7),   // Bottom
            new vec2(0.3, 0.3),   // Top-left
            new vec2(0.7, 0.3),   // Top-right
            new vec2(0.3, 0.7),   // Bottom-left
            new vec2(0.7, 0.7),   // Bottom-right
        ];
        
        const values: number[] = [];
        
        // Get the camera texture to know its resolution
        const cameraTexture = this.depthCache.getCamImageWithID(depthFrameID);
        const width = cameraTexture.getWidth();
        const height = cameraTexture.getHeight();
        
        for (const point of keyPoints) {
            // Convert normalized coordinates to pixel coordinates
            const pixelPos = new vec2(point.x * width, point.y * height);
            
            // Get world position (which internally uses depth)
            const worldPos = this.depthCache.getWorldPositionWithID(pixelPos, depthFrameID);
            
            if (worldPos) {
                // Calculate depth from world position
                const depth = worldPos.length;
                values.push(depth);
            } else {
                values.push(0); // Invalid depth
            }
        }
        
        return {
            width: 3,
            height: 3,
            values: values
        };
    }
    
    // ==========================================
    // RGB IMAGE TO BASE64
    // ==========================================
    
    private textureToBase64(texture: Texture): string {
        try {
            const width = texture.getWidth();
            const height = texture.getHeight();
            
            print(`📐 Texture dimensions: ${width}x${height}`);
            
            // Method 1: Try direct encoding (if available)
            if ((texture as any).encode) {
                const encoded = (texture as any).encode("jpg", 80);
                return this.arrayBufferToBase64(encoded);
            }
            
            // Method 2: Use ProceduralTextureProvider
            const provider = ProceduralTextureProvider.create();
            provider.control.inputTexture = texture;
            
            // Get the procedural texture's output
            const outputTexture = provider.texture;
            
            // Try encoding again on the output
            if ((outputTexture as any).encode) {
                const encoded = (outputTexture as any).encode("jpg", 80);
                return this.arrayBufferToBase64(encoded);
            }
            
            // Method 3: Manual pixel reading (fallback)
            return this.manualTextureRead(texture);
            
        } catch (error) {
            print("⚠️ Texture conversion error: " + error);
            // Return a small placeholder base64 image
            return this.getPlaceholderBase64();
        }
    }
    
    private manualTextureRead(texture: Texture): string {
        // This is a fallback - implementation depends on Lens Studio version
        const width = texture.getWidth();
        const height = texture.getHeight();
        
        // Create a minimal JPEG header + placeholder data
        // In production, you'd implement proper pixel reading here
        print("⚠️ Using fallback manual read");
        
        return this.getPlaceholderBase64();
    }
    
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    
    private getPlaceholderBase64(): string {
        // Minimal 1x1 JPEG as fallback
        return "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==";
    }
    
    // ==========================================
    // NETWORK COMMUNICATION
    // ==========================================
    
    private sendToAgent(payload: any): void {
        print("📤 Sending to Fetch.ai agent...");
        
        const request = RemoteServiceModule.createRequest(this.API_URL + "/analyze");
        request.method = RemoteServiceModule.HttpRequestMethod.Post;
        request.setHeader("Content-Type", "application/json");
        
        const jsonPayload = JSON.stringify(payload);
        request.body = jsonPayload;
        
        print(`📡 Request size: ${jsonPayload.length} characters`);
        
        request.send((response: RemoteServiceHttpResponse) => {
            this.handleResponse(response);
        });
    }
    
    private handleResponse(response: RemoteServiceHttpResponse): void {
        if (response.statusCode === 200) {
            print("✅ Response received!");
            
            try {
                const result = JSON.parse(response.body);
                print(`🐕 Result: happiness=${result.happiness}, state=${result.visual_state}, progress=${result.progress}%`);
                this.updateUI(result);
            } catch (error) {
                print("❌ JSON parse error: " + error);
                this.showError();
            }
            
        } else {
            print(`❌ HTTP Error: ${response.statusCode}`);
            this.showError();
        }
    }
    
    // ==========================================
    // UI UPDATE
    // ==========================================
    
    private updateUIFromAnalysis(result: any): void {
        // Convert AnalysisResult to UI state (no DogState from backend)
        const progress = result.consumed_since_last * 4; // Scale to percentage
        
        // Calculate dog state locally
        let dogState = "resting";
        if (progress >= 80) dogState = "excited";
        else if (progress >= 60) dogState = "playing";
        else if (progress >= 40) dogState = "walking";
        
        this.dogHappiness = Math.min(10, Math.max(1, Math.floor(progress / 10)));
        this.dogActivity = Math.min(10, Math.max(1, Math.floor(progress / 12)));
        this.dogVisualState = dogState;
        
        print(`🎨 Updating UI from analysis - Progress: ${progress}%, State: ${dogState}`);
        
        // Update dog texture
        this.updateDogTexture(dogState);
        
        // Update message based on analysis
        const foodNames = result.food_items.map((f: any) => f.name).join(", ");
        this.messageText.text = `Found: ${foodNames}. Progress: ${progress.toFixed(1)}%`;
        
        // Update progress bar
        this.updateProgressBar(progress);
        
        // Celebration for high progress
        if (progress >= 80) {
            this.triggerCelebration();
        }
    }
    
    private updateUI(result: any): void {
        this.dogHappiness = result.happiness;
        this.dogActivity = result.activity;
        this.dogVisualState = result.visual_state;
        
        print(`🎨 Updating UI - State: ${this.dogVisualState}, Happiness: ${this.dogHappiness}/10`);
        
        // Update dog texture
        this.updateDogTexture(result.visual_state);
        
        // Update message
        this.messageText.text = result.message;
        
        // Update progress bar
        this.updateProgressBar(result.progress);
        
        // Celebration
        if (result.celebration) {
            this.triggerCelebration();
        }
    }
    
    private updateDogTexture(visualState: string): void {
        let texture: Texture;
        let animationName: string;
        
        switch (visualState) {
            case "excited":
                texture = this.dogExcited;
                animationName = "jump";
                break;
            case "playing":
                texture = this.dogPlaying;
                animationName = "play";
                break;
            case "walking":
                texture = this.dogWalking;
                animationName = "walk";
                break;
            case "resting":
            default:
                texture = this.dogResting;
                animationName = "sit";
                break;
        }
        
        this.dogSprite.mainPass.baseTex = texture;
        this.playAnimation(animationName);
    }
    
    private updateProgressBar(progress: number): void {
        const progressPercent = progress / 100;
        
        // Scale the progress bar
        const transform = this.progressBar.getTransform();
        const scale = transform.getLocalScale();
        transform.setLocalScale(new vec3(progressPercent, scale.y, scale.z));
        
        // Update color
        let color: vec4;
        if (progress >= 80) {
            color = new vec4(0.2, 1, 0.2, 1); // Green
        } else if (progress >= 50) {
            color = new vec4(1, 0.9, 0.2, 1); // Yellow
        } else {
            color = new vec4(0.5, 0.7, 1, 1); // Blue
        }
        
        this.progressBar.mainPass.baseColor = color;
    }
    
    private playAnimation(animationName: string): void {
        if (this.dogAnimator) {
            try {
                print(`🎬 Playing: ${animationName}`);
                const layers = this.dogAnimator.layers;
                if (layers && layers.length > 0) {
                    layers[0].play(animationName);
                }
            } catch (error) {
                print(`⚠️ Animation error: ${error}`);
            }
        }
    }
    
    private triggerCelebration(): void {
        print("🎉 CELEBRATION!");
        
        this.messageText.text = "🎉 AMAZING! Your pup is so happy! 🎉";
        
        // Bounce animation
        const transform = this.dogSprite.getTransform();
        const originalScale = transform.getLocalScale();
        
        const bounceScale = 1.3;
        const duration = 0.5;
        const startTime = getTime();
        
        const bounceEvent = this.createEvent("UpdateEvent");
        bounceEvent.bind(() => {
            const elapsed = getTime() - startTime;
            const t = elapsed / duration;
            
            if (t >= 1) {
                transform.setLocalScale(originalScale);
                bounceEvent.enabled = false;
                return;
            }
            
            const scale = 1 + (bounceScale - 1) * Math.sin(t * Math.PI);
            transform.setLocalScale(originalScale.uniformScale(scale));
        });
    }
    
    private showError(): void {
        this.messageText.text = "Having trouble connecting. Your pup is still here! 💕";
    }
    
    // ==========================================
    // SESSION MANAGEMENT
    // ==========================================
    
    private endSession(): void {
        print("🛑 Ending session: " + this.sessionId);
        
        const request = RemoteServiceModule.createRequest(
            this.API_URL + "/session/" + this.sessionId + "/end"
        );
        request.method = RemoteServiceModule.HttpRequestMethod.Post;
        
        request.send((response: RemoteServiceHttpResponse) => {
            if (response.statusCode === 200) {
                print("✅ Session ended");
            }
        });
    }
    
    // ==========================================
    // UTILITIES
    // ==========================================
    
    private generateSessionId(): string {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `meal_${timestamp}_${random}`;
    }
}
