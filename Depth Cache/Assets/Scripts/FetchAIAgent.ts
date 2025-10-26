@component
export class FetchAIAgent extends BaseScriptComponent {
    
    private readonly STORAGE_AGENT_URL = "https://agentverse.ai/v1/agents/{storage_address}/messages";
    
    sendMealCapture(
        texture: Texture,
        depthFrameID: number,
        sessionId: string,
        userId: string,
        callback: (result: any) => void
    ) {
        const imageBase64 = this.textureToBase64(texture);
        // No depth data extraction needed
        
        const fetchAIMessage = {
            type: "UploadRequest",
            image_base64: imageBase64,
            session_id: sessionId,
            frame_id: `frame_${Date.now()}`,
            user_id: userId
            // No depth_data field
        };
        
        const request = RemoteServiceModule.createRequest(this.STORAGE_AGENT_URL);
        request.method = RemoteServiceModule.HttpRequestMethod.Post;
        request.setHeader("Content-Type", "application/json");
        
        request.body = JSON.stringify(fetchAIMessage);
        request.send((response) => {
            const analysisResult = JSON.parse(response.body);
            callback(analysisResult);
        });
    }
    
    // Helper methods from spectacles_controller.ts
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
        
        // Downsample for efficiency (recommended)
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
        return "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==";
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
}