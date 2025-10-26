# SpectaclesController Setup Guide

## To ensure SpectaclesController is the main component:

### 1. Scene Setup
- **Attach SpectaclesController** to a SceneObject in your scene
- **Disable or remove SceneController** from the main scene object (or keep it disabled)

### 2. Required Inputs for SpectaclesController
Make sure these inputs are assigned in the Inspector:

#### Essential Components:
- `internetModule` - InternetModule (for HTTP requests)
- `depthCache` - DepthCache component
- `dogSprite` - Image component for dog display
- `messageText` - Text component for messages
- `progressBar` - Image component for progress display

#### Dog Textures:
- `dogResting` - Texture for resting state
- `dogWalking` - Texture for walking state  
- `dogPlaying` - Texture for playing state
- `dogExcited` - Texture for excited state

#### Optional:
- `dogAnimator` - AnimationMixer for dog animations

### 3. Debug Messages to Look For
When the scene runs, you should see these console messages:
- `🔥🔥🔥 SPECTACLES CONTROLLER IS RUNNING! 🔥🔥🔥`
- `🎮 Eating Support Lens Initialized!`
- `▶️ Started automatic meal tracking`
- `🔄 SpectaclesController update running - tracking: true` (every 5 seconds)
- `📸 Capturing food state...` (every 30 seconds)

### 4. Backend Setup
- Make sure your Python backend (`test.py`) is running on `http://localhost:8000`
- The `/analyze` endpoint should be available

### 5. If SpectaclesController is NOT running:
1. Check that the component is attached to a SceneObject
2. Verify the component is enabled (checkbox checked)
3. Make sure all required inputs are assigned
4. Check for any compilation errors in the console

The SpectaclesController will automatically start capturing images every 30 seconds and send them to your Fetch.ai backend for analysis.
