// SpectaclesController.ts

@component
export class SpectaclesController extends BaseScriptComponent {
    
    // ==========================================
    // INPUTS (Assign in Inspector)
    // ==========================================
    
    @input
    camera: Camera;
    
    @input
    depthTextureProvider: DepthTextureProvider; // From Depth Cache sample
    
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
    
    // Optional: Animator for dog animations
    @input
    @optional
    dogAnimator: AnimationMixer;
    
    // ==========================================
    // CONFIGURATION
    // ==========================================
    
    private readonly API_URL: string = "http://your-server.com:8000";
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
        this.progressBar.mainPass.baseTex = this.progressBar.mainPass.baseTex;
        if (this.progressBar.mainPass.baseTex) {
            // Set initial fill to 0
            const material = this.progressBar.mainPass;
            if (material) {
                // You may need to create a material with a fill property
            }
        }
    }
    
    // ==========================================
    // CAPTURE & SEND
    // ==========================================
    
    private captureAndAnalyze(): void {
        print("📸 Capturing food state...");
        
        try {
            // 1. Capture RGB image
            const imageBase64 = this.captureRGBImage();
            
            // 2. Capture depth data
            const depthData = this.captureDepthData();
            
            // 3. Build payload
            const payload = {
                session_id: this.sessionId,
                user_id: this.userId,
                image_base64: imageBase64,
                depth_cache: {
                    width: depthData.width,
                    height: depthData.height,
                    depth_values: depthData.values
                },
                timestamp: Date.now()
            };
            
            // 4. Send to agent
            this.sendToAgent(payload);
            
        } catch (error) {
            print("❌ Capture error: " + error);
            this.showError();
        }
    }
    
    // ==========================================
    // RGB IMAGE CAPTURE
    // ==========================================
    
    private captureRGBImage(): string {
        // Get render target from camera
        const renderTarget = this.camera.renderTarget;
        
        if (!renderTarget) {
            throw new Error("No render target on camera");
        }
        
        const texture = renderTarget.texture;
        
        if (!texture) {
            throw new Error("No texture on render target");
        }
        
        // Convert texture to base64
        return this.textureToBase64(texture);
    }
    
    private textureToBase64(texture: Texture): string {
        // Method 1: Use ProceduralTextureProvider
        try {
            const provider = ProceduralTextureProvider.create();
            provider.control.inputTexture = texture;
            
            // Get the texture data
            const width = texture.getWidth();
            const height = texture.getHeight();
            
            print(`📐 Image dimensions: ${width}x${height}`);
            
            // Create a render target to read pixels
            const tempRT = texture.control.getPixelData();
            
            // Convert to base64
            return this.pixelDataToBase64(tempRT, width, height);
            
        } catch (error) {
            print("⚠️ ProceduralTexture method failed, trying alternative...");
            return this.alternativeTextureCapture(texture);
        }
    }
    
    private alternativeTextureCapture(texture: Texture): string {
        // Alternative: Use texture's built-in encoding
        try {
            // Some Lens Studio versions support direct encoding
            const encoded = (texture as any).encode("jpg", 80);
            if (encoded) {
                return this.arrayBufferToBase64(encoded);
            }
        } catch (e) {
            print("Direct encoding not available");
        }
        
        // Fallback: Manual pixel reading
        return this.manualPixelRead(texture);
    }
    
    private manualPixelRead(texture: Texture): string {
        const width = texture.getWidth();
        const height = texture.getHeight();
        
        // Create byte array for RGBA data
        const pixelCount = width * height;
        const byteArray = new Uint8Array(pixelCount * 4);
        
        // Read pixels (this API varies by Lens Studio version)
        // You may need to adjust based on your version
        if (texture.control && (texture.control as any).readPixels) {
            (texture.control as any).readPixels(byteArray);
        }
        
        return this.bytesToBase64(byteArray);
    }
    
    private pixelDataToBase64(pixelData: any, width: number, height: number): string {
        // Convert pixel data to base64
        const byteArray = new Uint8Array(pixelData);
        return this.bytesToBase64(byteArray);
    }
    
    private bytesToBase64(bytes: Uint8Array): string {
        let binary = '';
        const len = bytes.byteLength;
        
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        
        return btoa(binary);
    }
    
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        return this.bytesToBase64(new Uint8Array(buffer));
    }
    
    // ==========================================
    // DEPTH DATA CAPTURE
    // ==========================================
    
    private captureDepthData(): {width: number, height: number, values: number[]} {
        if (!this.depthTextureProvider) {
            print("⚠️ No depth texture provider");
            return {width: 0, height: 0, values: []};
        }
        
        // Get depth texture
        const depthTexture = this.depthTextureProvider.depthTexture;
        
        if (!depthTexture) {
            print("⚠️ No depth texture available");
            return {width: 0, height: 0, values: []};
        }
        
        const width = depthTexture.getWidth();
        const height = depthTexture.getHeight();
        
        print(`📏 Depth texture size: ${width}x${height}`);
        
        // Sample depth values (downsample for efficiency)
        const sampleWidth = 64;
        const sampleHeight = 64;
        const values: number[] = [];
        
        // Calculate step size
        const stepX = width / sampleWidth;
        const stepY = height / sampleHeight;
        
        // Sample at regular intervals
        for (let y = 0; y < sampleHeight; y++) {
            for (let x = 0; x < sampleWidth; x++) {
                // Calculate normalized coordinates (0-1)
                const normX = x / sampleWidth;
                const normY = y / sampleHeight;
                
                // Get depth value at this position
                const depth = this.getDepthAtNormalizedPosition(normX, normY);
                values.push(depth);
            }
        }
        
        print(`📊 Captured ${values.length} depth samples`);
        
        return {
            width: sampleWidth,
            height: sampleHeight,
            values: values
        };
    }
    
    private getDepthAtNormalizedPosition(x: number, y: number): number {
        // Create vec2 for position
        const position = new vec2(x, y);
        
        // Get depth using the provider's method
        if (this.depthTextureProvider.getDepthAtScreenPosition) {
            return this.depthTextureProvider.getDepthAtScreenPosition(position);
        } else if ((this.depthTextureProvider as any).getDepthAtPosition) {
            return (this.depthTextureProvider as any).getDepthAtPosition(position);
        }
        
        // Fallback
        return 0.0;
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
        
        print(`📦 Payload size: ${jsonPayload.length} characters`);
        
        request.send((response: RemoteServiceHttpResponse) => {
            this.handleResponse(response);
        });
    }
    
    private handleResponse(response: RemoteServiceHttpResponse): void {
        if (response.statusCode === 200) {
            print("✅ Response received!");
            
            try {
                const result = JSON.parse(response.body);
                this.updateUI(result);
            } catch (error) {
                print("❌ JSON parse error: " + error);
                this.showError();
            }
            
        } else {
            print(`❌ HTTP Error: ${response.statusCode}`);
            print(`Body: ${response.body}`);
            this.showError();
        }
    }
    
    // ==========================================
    // UI UPDATE
    // ==========================================
    
    private updateUI(result: any): void {
        // Update state
        this.dogHappiness = result.happiness;
        this.dogActivity = result.activity;
        this.dogVisualState = result.visual_state;
        
        print(`🐕 Updating - State: ${this.dogVisualState}, Happiness: ${this.dogHappiness}/10`);
        
        // Update dog texture
        this.updateDogTexture(result.visual_state);
        
        // Update message
        this.messageText.text = result.message;
        
        // Update progress bar
        this.updateProgressBar(result.progress);
        
        // Trigger celebration if needed
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
        
        // Update texture
        this.dogSprite.mainPass.baseTex = texture;
        
        // Play animation if animator exists
        this.playAnimation(animationName);
    }
    
    private updateProgressBar(progress: number): void {
        const progressPercent = progress / 100;
        
        // Update fill amount
        // Note: You may need to create a custom material with fill property
        // For now, we'll scale the progress bar
        const transform = this.progressBar.getTransform();
        const scale = transform.getLocalScale();
        transform.setLocalScale(new vec3(progressPercent, scale.y, scale.z));
        
        // Update color based on progress
        let color: vec4;
        if (progress >= 80) {
            color = new vec4(0.2, 1, 0.2, 1); // Green
        } else if (progress >= 50) {
            color = new vec4(1, 0.9, 0.2, 1); // Yellow
        } else if (progress >= 20) {
            color = new vec4(0.5, 0.7, 1, 1); // Blue
        } else {
            color = new vec4(0.8, 0.8, 1, 1); // Light blue
        }
        
        this.progressBar.mainPass.baseColor = color;
    }
    
    private playAnimation(animationName: string): void {
        if (this.dogAnimator) {
            try {
                print(`🎬 Playing animation: ${animationName}`);
                // Play animation if you have AnimationMixer set up
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
        
        // Flash the message
        this.messageText.text = "🎉 AMAZING! Your pup is so happy! 🎉";
        
        // Scale up the dog temporarily
        const transform = this.dogSprite.getTransform();
        const originalScale = transform.getLocalScale();
        
        // Animate celebration (simple bounce)
        this.animateBounce(transform, originalScale);
    }
    
    private animateBounce(transform: Transform, originalScale: vec3): void {
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
            
            // Ease in-out
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
                print("Session ended successfully");
            } else {
                print("Session end failed: " + response.statusCode);
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
```

## Key TypeScript Features Used:

1. **Decorators**: `@component`, `@input`, `@optional`
2. **Type Annotations**: Proper types for all variables
3. **Access Modifiers**: `private`, `public`
4. **Arrow Functions**: For callbacks
5. **Typed Parameters**: Function parameters have explicit types
6. **Return Types**: Functions specify return types

## Setup in Lens Studio:

### 1. Add the Script:
```
1. Right-click in Resources Panel
2. Add New → Script → TypeScript
3. Name it: SpectaclesController.ts
4. Paste the code above
```

### 2. Assign to Scene Object:
```
1. Create a new SceneObject (or use existing)
2. Add Component → Script
3. Select SpectaclesController
```

### 3. Assign Inputs in Inspector:
```
Camera: [Your Camera object]
Depth Texture Provider: [From Depth Cache sample]
Dog Sprite: [Image component for dog]
Message Text: [Text component]
Progress Bar: [Image component]
Dog Resting: [Texture asset]
Dog Walking: [Texture asset]
Dog Playing: [Texture asset]
Dog Excited: [Texture asset]
Dog Animator: [Optional - AnimationMixer if you have animations]
