class AuthService {
  // Méthode de connexion
  async login(email, password) {
    try {
      const data = await httpClient.post('/auth/login', { email, password });
      if (data && data.token) {
        // Stocker le token
        localStorage.setItem('token', data.token);
        // Stocker les infos utilisateur
        localStorage.setItem('user', JSON.stringify({
          id: data.id,
          email: data.email,
          role: data.role,
          nom: data.nom,
          prenom: data.prenom
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    }
  }

  // Méthode de déconnexion
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
  }

  // Méthode pour obtenir l'utilisateur actuel
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  }

  // Méthode pour vérifier si l'utilisateur est connecté
  isLoggedIn() {
    return !!localStorage.getItem('token');
  }

  // Méthode pour vérifier le rôle de l'utilisateur
  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }
}

// Exporter une instance du service
const authService = new AuthService();