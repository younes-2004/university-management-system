class Wizard {
  constructor(options) {
    this.steps = options.steps || [];
    this.currentStep = 0;
    this.onStepChange = options.onStepChange || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.data = options.initialData || {};
  }

  // Générer la structure de l'assistant
  render() {
    const wizardContainer = document.createElement('div');
    wizardContainer.className = 'wizard-container';
    
    // Générer les étapes
    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'wizard-steps';
    
    this.steps.forEach((step, index) => {
      const stepEl = document.createElement('div');
      stepEl.className = `wizard-step ${index === this.currentStep ? 'active' : ''} ${index < this.currentStep ? 'completed' : ''}`;
      
      const stepNumber = document.createElement('div');
      stepNumber.className = 'step-number';
      stepNumber.textContent = index + 1;
      
      const stepTitle = document.createElement('div');
      stepTitle.className = 'step-title';
      stepTitle.textContent = step.title;
      
      stepEl.appendChild(stepNumber);
      stepEl.appendChild(stepTitle);
      stepsContainer.appendChild(stepEl);
    });
    
    wizardContainer.appendChild(stepsContainer);
    
    // Générer le contenu de l'étape actuelle
    const currentStepData = this.steps[this.currentStep];
    
    const contentContainer = document.createElement('div');
    contentContainer.className = 'wizard-content';
    
    const titleBar = document.createElement('div');
    titleBar.className = 'step-title-bar';
    
    const title = document.createElement('h3');
    title.textContent = currentStepData.title;
    
    titleBar.appendChild(title);
    contentContainer.appendChild(titleBar);
    
    // Contenu de l'étape
    const stepContent = document.createElement('div');
    stepContent.className = 'step-content';
    stepContent.innerHTML = currentStepData.content;
    contentContainer.appendChild(stepContent);
    
    wizardContainer.appendChild(contentContainer);
    
    // Navigation
    const navigation = document.createElement('div');
    navigation.className = 'wizard-navigation';
    
    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.className = 'btn btn-secondary';
    prevButton.textContent = 'Précédent';
    prevButton.disabled = this.currentStep === 0;
    prevButton.addEventListener('click', () => this.previousStep());
    
    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.className = 'btn btn-primary';
    nextButton.textContent = this.currentStep === this.steps.length - 1 ? 'Terminer' : 'Suivant';
    nextButton.addEventListener('click', () => this.nextStep());
    
    navigation.appendChild(prevButton);
    navigation.appendChild(nextButton);
    
    wizardContainer.appendChild(navigation);
    
    return wizardContainer;
  }

  // Passer à l'étape suivante
  nextStep() {
    // Valider l'étape actuelle si une fonction de validation est fournie
    const currentStepData = this.steps[this.currentStep];
    if (currentStepData.validate) {
      const isValid = currentStepData.validate(this.data);
      if (!isValid) {
        return;
      }
    }
    
    // Collecter les données de l'étape actuelle si une fonction est fournie
    if (currentStepData.collectData) {
      const stepData = currentStepData.collectData();
      this.data = { ...this.data, ...stepData };
    }
    
    // Si c'est la dernière étape, terminer l'assistant
    if (this.currentStep === this.steps.length - 1) {
      this.onComplete(this.data);
      return;
    }
    
    // Passer à l'étape suivante
    this.currentStep++;
    this.onStepChange(this.currentStep, this.data);
  }

  // Revenir à l'étape précédente
  previousStep() {
    if (this.currentStep === 0) {
      return;
    }
    
    this.currentStep--;
    this.onStepChange(this.currentStep, this.data);
  }

  // Définir l'étape actuelle
  setStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.steps.length) {
      return;
    }
    
    this.currentStep = stepIndex;
    this.onStepChange(this.currentStep, this.data);
  }

  // Mettre à jour les données
  updateData(newData) {
    this.data = { ...this.data, ...newData };
  }
}