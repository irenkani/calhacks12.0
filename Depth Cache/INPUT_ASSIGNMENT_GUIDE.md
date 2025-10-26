# Input Assignment Guide

## Error Fix: "Input internetModule was not provided"

You need to assign the `internetModule` input in the Lens Studio Inspector for both controllers.

## Required Inputs to Assign:

### For SpectaclesController:
1. **internetModule** - InternetModule (for HTTP requests)
2. **depthCache** - DepthCache component
3. **dogSprite** - Image component
4. **messageText** - Text component  
5. **progressBar** - Image component
6. **dogResting** - Texture asset
7. **dogWalking** - Texture asset
8. **dogPlaying** - Texture asset
9. **dogExcited** - Texture asset
10. **dogAnimator** - AnimationMixer component (optional)

### For SceneController:
1. **internetModule** - InternetModule (for HTTP requests)
2. **depthCache** - DepthCache component
3. **speechUI** - SpeechUI component
4. **responseUI** - ResponseUI component
5. **loading** - Loading component
6. **debugVisualizer** - DebugVisualizer component (optional)
7. **showDebugVisuals** - Boolean (set to false)

## How to Assign Inputs in Lens Studio:

1. **Select the SceneObject** that has the SpectaclesController component
2. **In the Inspector panel**, find the SpectaclesController component
3. **For each input field**:
   - Click the circle icon next to the input name
   - Select the appropriate asset/component from the scene
   - For InternetModule: Look for "InternetModule" in the asset browser
   - For other components: Drag from the scene hierarchy

4. **Repeat for SceneController** on its SceneObject

## Quick Fix for InternetModule:

If you can't find InternetModule in the asset browser:
1. Go to **Project Panel** → **Assets**
2. Look for **InternetModule** asset
3. If not found, you may need to add it to your project:
   - Go to **Project Panel** → **Create** → **InternetModule**
   - Or check if it's available in the **Packages** section

## Debug Messages to Look For:

Once inputs are assigned, you should see:
- `🔥🔥🔥 SPECTACLES CONTROLLER AWAKE! 🔥🔥🔥`
- `🔥🔥🔥 SPECTACLES CONTROLLER STARTING! 🔥🔥🔥`
- `🎮 SceneController ENABLED - Using Fetch.ai backend`

If you still get the error, make sure both components are enabled (checkbox checked) in the Inspector.
