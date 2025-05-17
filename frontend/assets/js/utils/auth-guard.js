class AuthGuard {
  // Méthode pour vérifier l'accès à une page
  checkAccess(allowedRoles) {
    // Vérifier si l'utilisateur est connecté
    if (!authService.isLoggedIn()) {
      window.location.href = '/index.html';
      return false;
    }

    // Vérifier si le rôle de l'utilisateur est autorisé
    const user = authService.getCurrentUser();
    if (!user || !allowedRoles.includes(user.role)) {
      this.redirectToDashboard(user.role);
      return false;
    }

    return true;
  }

  // Redirection vers le tableau de bord approprié
  redirectToDashboard(role) {
    switch (role) {
      case 'ADMIN':
        window.location.href = '/pages/admin/dashboard.html';
        break;
      case 'PROFESSOR':
        window.location.href = '/pages/professor/dashboard.html';
        break;
      case 'STUDENT':
        window.location.href = '/pages/student/dashboard.html';
        break;
      default:
        window.location.href = '/index.html';
    }
  }
}

// Exporter une instance
const authGuard = new AuthGuard();