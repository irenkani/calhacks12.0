import Event from "Scripts/Events";

@component
export class FetchCatFacts extends BaseScriptComponent {
  private currentFoodPercentage: number = 100;
  private currentFoodItems: string[] = [];
  private promptTimer: number = 0;
  private readonly PROMPT_CHANGE_INTERVAL: number = 5; // Change prompt every 5 seconds

  catFactReceived: Event<string>;

  onAwake() {
    this.catFactReceived = new Event<string>();
    // Set up automatic prompt updates
    this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));
  }

  onUpdate(eventData: UpdateEvent): void {
    this.promptTimer += eventData.getDeltaTime();
    
    if (this.promptTimer >= this.PROMPT_CHANGE_INTERVAL) {
      this.updatePrompt();
      this.promptTimer = 0;
    }
  }

  setFoodPercentage(percentage: number) {
    this.currentFoodPercentage = percentage;
    this.updatePrompt();
    // Reset timer to start fresh countdown
    this.promptTimer = 0;
  }

  setFoodItems(foodItems: string[]) {
    this.currentFoodItems = foodItems;
    this.updatePrompt();
    // Reset timer to start fresh countdown
    this.promptTimer = 0;
  }

  private updatePrompt() {
    const prompt = this.getEncouragingPrompt(this.currentFoodPercentage);
    this.catFactReceived.invoke(prompt);
  }

  private getEncouragingPrompt(percentage: number): string {
    const prompts = this.getPromptsForPercentage(percentage);
    const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    
    // Add food items to the prompt if available
    if (this.currentFoodItems.length > 0) {
      const foodText = this.formatFoodItems();
      return `${foodText} ${selectedPrompt}`;
    }
    
    return selectedPrompt;
  }

  private formatFoodItems(): string {
    if (this.currentFoodItems.length === 0) return "";
    
    if (this.currentFoodItems.length === 1) {
      return `I see you're enjoying some ${this.currentFoodItems[0]}!`;
    } else if (this.currentFoodItems.length === 2) {
      return `I see you have some ${this.currentFoodItems[0]} and ${this.currentFoodItems[1]}!`;
    } else {
      const lastItem = this.currentFoodItems[this.currentFoodItems.length - 1];
      const otherItems = this.currentFoodItems.slice(0, -1).join(', ');
      return `I see you have some ${otherItems}, and ${lastItem}!`;
    }
  }

  private getPromptsForPercentage(percentage: number): string[] {
    if (percentage >= 90) {
      return [
        "You're doing great! Every bite is a step forward 💪",
        "Your body deserves nourishment - you've got this! 🌟",
        "Taking care of yourself is an act of self-love 💕",
        "You're stronger than you know - keep going! ✨",
        "Every meal is a victory - celebrate your progress! 🎉"
      ];
    } else if (percentage >= 70) {
      return [
        "You're making wonderful progress! Keep it up! 🌈",
        "Your body is thanking you for this nourishment 💚",
        "You're building healthy habits one bite at a time 🍽️",
        "Recovery isn't linear - you're doing amazing! 💫",
        "Every bite shows courage and strength 💪"
      ];
    } else if (percentage >= 50) {
      return [
        "You're halfway there! You're doing beautifully 🌸",
        "Your resilience is inspiring - keep going! 💖",
        "Every bite is a step toward healing 🌱",
        "You're not alone in this journey - you've got this! 🤗",
        "Your body needs this fuel - you're taking care of yourself 💚"
      ];
    } else if (percentage >= 30) {
      return [
        "You're almost there! Your strength is incredible 💪",
        "Every bite counts - you're doing so well! 🌟",
        "Recovery takes courage, and you have it in abundance 💫",
        "You're nourishing both body and soul - keep going! 💕",
        "Your progress is beautiful to witness 🌈"
      ];
    } else if (percentage >= 10) {
      return [
        "You're so close! Your determination is inspiring 🌟",
        "Every bite is a victory - you're amazing! 🎉",
        "Your body is grateful for this nourishment 💚",
        "You're showing incredible strength - keep going! 💪",
        "Recovery is possible, and you're proving it! ✨"
      ];
    } else {
      return [
        "Congratulations! You've nourished your body beautifully 🎊",
        "You did it! Your strength and courage are inspiring 💖",
        "Every bite was a step toward healing - you're amazing! 🌟",
        "You've shown incredible resilience - be proud! 💪",
        "Your body thanks you for this nourishment 💚"
      ];
    }
  }

  public getCatFacts() {
    // Legacy method - now just updates the prompt
    this.updatePrompt();
  }
}