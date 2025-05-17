// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
  // Références des éléments du formulaire
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorMessage = document.getElementById('errorMessage');

  // Vérifier si l'utilisateur est déjà connecté
  if (authService.isLoggedIn()) {
    const user = authService.getCurrentUser();
    authGuard.redirectToDashboard(user.role);
    return;
  }

  // Gestionnaire d'événement pour la soumission du formulaire
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Masquer message d'erreur précédent
    errorMessage.style.display = 'none';
    
    // Valeurs du formulaire
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Validation simple côté client
    if (!email || !password) {
      errorMessage.textContent = 'Veuillez remplir tous les champs';
      errorMessage.style.display = 'block';
      return;
    }
    
    try {
      // Tentative de connexion
      const success = await authService.login(email, password);
      
      if (success) {
        // Connexion réussie, redirection
        const user = authService.getCurrentUser();
        authGuard.redirectToDashboard(user.role);
      } else {
        // Afficher message d'erreur
        errorMessage.textContent = 'Email ou mot de passe incorrect';
        errorMessage.style.display = 'block';
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      errorMessage.textContent = 'Une erreur s\'est produite. Veuillez réessayer.';
      errorMessage.style.display = 'block';
    }
  });
});