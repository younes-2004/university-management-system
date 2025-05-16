/**
 * Service d'authentification pour gérer la connexion/déconnexion et les vérifications d'authentification
 */
const AUTH = {
    /**
     * Connecte un utilisateur avec ses identifiants
     * @param {string} email - Email de l'utilisateur
     * @param {string} password - Mot de passe de l'utilisateur
     * @returns {Promise} - Promesse contenant les données de l'utilisateur connecté
     */
    login: async function(email, password) {
        try {
            const response = await API.auth.login({ email, password });
            
            if (response && response.token) {
                // Stocker le token et les infos utilisateur
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify({
                    id: response.id,
                    email: response.email,
                    role: response.role,
                    nom: response.nom,
                    prenom: response.prenom
                }));
                
                return response;
            }
            return null;
        } catch (error) {
            console.error('Erreur de connexion:', error);
            throw error;
        }
    },
    
    /**
     * Déconnecte l'utilisateur actuel
     */
    logout: function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    },
    
    /**
     * Vérifie si l'utilisateur est connecté
     * @returns {boolean} - True si l'utilisateur est connecté, false sinon
     */
    isAuthenticated: function() {
        return !!localStorage.getItem('token');
    },
    
    /**
     * Récupère l'utilisateur actuellement connecté
     * @returns {Object|null} - L'utilisateur connecté ou null
     */
    getCurrentUser: function() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    
    /**
     * Vérifie si l'utilisateur a un rôle spécifique
     * @param {string} role - Le rôle à vérifier (ADMIN, PROFESSOR, STUDENT)
     * @returns {boolean} - True si l'utilisateur a le rôle spécifié, false sinon
     */
    hasRole: function(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    },
    
    /**
     * Valide le token stocké
     * @returns {Promise<boolean>} - True si le token est valide, false sinon
     */
    validateToken: async function() {
        try {
            if (!this.isAuthenticated()) return false;
            
            const response = await API.auth.validateToken();
            return response && response.success;
        } catch (error) {
            console.error('Erreur de validation du token:', error);
            this.logout();
            return false;
        }
    }
}; 
