 
/**
 * Point d'entrée de l'application
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser l'application
    init();
    
    // Ajouter les écouteurs d'événements
    setupEventListeners();
});

/**
 * Initialise l'application
 */
function init() {
    // Vérifier l'authentification et initialiser le routeur
    if (AUTH.isAuthenticated()) {
        AUTH.validateToken().then(isValid => {
            if (isValid) {
                ROUTER.init();
            } else {
                // Si le token n'est pas valide, afficher la page de connexion
                showLoginForm();
            }
        });
    } else {
        // Si pas de token, afficher la page de connexion
        showLoginForm();
    }
}

/**
 * Configure les écouteurs d'événements
 */
function setupEventListeners() {
    // Gérer la soumission du formulaire de connexion
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

/**
 * Affiche le formulaire de connexion
 */
function showLoginForm() {
    document.getElementById('login-container').style.display = 'flex';
    
    // Vider les champs existants
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (errorMessage) errorMessage.textContent = '';
}

/**
 * Gère la soumission du formulaire de connexion
 * @param {Event} event - L'événement de soumission
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    
    // Réinitialiser le message d'erreur
    errorMessage.textContent = '';
    
    // Récupérer les valeurs du formulaire
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        errorMessage.textContent = 'Veuillez remplir tous les champs.';
        return;
    }
    
    try {
        // Désactiver le bouton de soumission pendant la connexion
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Connexion en cours...';
        
        // Tenter la connexion
        const user = await AUTH.login(email, password);
        
        if (user) {
            // Connexion réussie, initialiser le routeur
            ROUTER.init();
        } else {
            // Échec de la connexion
            errorMessage.textContent = 'Email ou mot de passe incorrect.';
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        errorMessage.textContent = 'Une erreur est survenue. Veuillez réessayer.';
    } finally {
        // Réactiver le bouton de soumission
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Connexion';
    }
}