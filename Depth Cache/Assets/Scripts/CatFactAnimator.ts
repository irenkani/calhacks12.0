import Easing from "LSTween.lspkg/TweenJS/Easing";
import { FetchCatFacts } from "./FetchCatFacts";
import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { LSTween } from "LSTween.lspkg/LSTween";

const TEXT_SLEEPING = "Zzz... I'm resting peacefully with you 💤";
const TEXT_ACTIVE = "I'm here to support you on your journey 💕";

@component
export class CatFactAnimator extends BaseScriptComponent {
  @input
  thoughtBubbleImage: Image; // Image component for the thought bubble
  @input
  thoughtBubbleText: Text; // Text component for the thought bubble

  @input
  fetchCatFacts: FetchCatFacts; // Component to fetch cat facts

  @input
  catInteractable: Interactable; // Interactable component for the cat

  @input
  animationPlayer: AnimationPlayer; // Animation player component

  @input
  hintImage: Image; // Image component for the hint

  @input("Component.ScriptComponent")
  animationStateMachine: any; // State machine for animations

  // Flag to check if the interaction has been activated once
  private hasBeenActivatedOnce = false;
  private catIsActive = false;
  private textBubbleIsShown = false;

  onAwake() {
    // Initialize the thought bubble with no alpha
    this.initializeThoughtBubble();

    this.createEvent("OnPauseEvent").bind(() => {
      if (this.catIsActive) {
        this.dectivateCat();
        this.thoughtBubbleText.text = TEXT_SLEEPING;
      }
    });

    this.createEvent("OnResumeEvent").bind(() => {
      if (this.hasBeenActivatedOnce) {
        this.activateCat(false);
        this.thoughtBubbleText.text = TEXT_ACTIVE;
      }
    });

    // Start with encouraging message and activate cat immediately
    this.thoughtBubbleText.text = TEXT_ACTIVE;
    this.activateCat(false); // Activate without fetching facts initially

    // Add event listener for cat interaction
    this.catInteractable.onTriggerStart.add((args) => {
      this.activateCat(true);
    });

    // Update thought bubble text when a cat fact is received
    this.fetchCatFacts.catFactReceived.add((args) => {
      this.thoughtBubbleText.text = args;
      // Ensure cat is active when receiving food-related prompts
      if (!this.catIsActive) {
        this.activateCat(false);
      }
    });
  }

  private activateCat(fetchFacts: boolean) {
    if (!this.catIsActive) {
      this.catIsActive = true;
      this.hasBeenActivatedOnce = true;

      this.animateShowingTextBubble();

      this.animationStateMachine.setTrigger("stand");
    }

    // Fetch cat facts when interaction is triggered
    if (fetchFacts) {
      this.fetchCatFacts.getCatFacts();
    }
  }

  // Play animation when the interaction is triggered
  private animateShowingTextBubble() {
    if (this.textBubbleIsShown) return;
    this.textBubbleIsShown = true;

    // Delay the animation for 1.5 seconds
    LSTween.rawTween(1500)
      .onComplete(() => {
        // Move the thought bubble from bottom to top
        LSTween.moveFromToLocal(
          this.thoughtBubbleImage.sceneObject.getTransform(),
          new vec3(2, 25, 0),
          new vec3(2, 31, 0),
          500
        )
          .easing(Easing.Cubic.Out)
          .start();

        // Fade in the thought bubble image
        LSTween.alphaTo(this.thoughtBubbleImage.mainMaterial, 1, 600)
          .easing(Easing.Cubic.Out)
          .start();

        // Fade in the thought bubble text
        LSTween.textAlphaTo(this.thoughtBubbleText, 1, 600)
          .easing(Easing.Cubic.Out)
          .start();
      })
      .start();

    // Hide the hint image
    LSTween.alphaTo(this.hintImage.mainMaterial, 0, 300)
      .easing(Easing.Cubic.Out)
      .start();
  }

  private dectivateCat() {
    this.catIsActive = false;
    this.animationStateMachine.setTrigger("sleep");
  }

  // Initialize the thought bubble with no alpha
  private initializeThoughtBubble() {
    const imageColorNoAlpha = this.thoughtBubbleImage.mainPass.baseColor;
    imageColorNoAlpha.a = 0;
    this.thoughtBubbleImage.mainPass.baseColor = imageColorNoAlpha;

    const textColorNoAlpha = this.thoughtBubbleText.textFill.color;
    textColorNoAlpha.a = 0;
    this.thoughtBubbleText.textFill.color = textColorNoAlpha;
  }

  // Public method to update food percentage for encouraging prompts
  public updateFoodPercentage(percentage: number) {
    this.fetchCatFacts.setFoodPercentage(percentage);
  }

  // Public method to update food items for encouraging prompts
  public updateFoodItems(foodItems: string[]) {
    this.fetchCatFacts.setFoodItems(foodItems);
  }
}
