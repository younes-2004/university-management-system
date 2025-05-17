document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'accès avec authGuard
  const user = authService.getCurrentUser();
  if (!user) {
    window.location.href = '/index.html';
    return;
  }
  
  // Définir le nom d'utilisateur dans la barre supérieure
  const userNameElement = document.getElementById('userName');
  if (userNameElement) {
    userNameElement.textContent = `${user.prenom} ${user.nom}`;
  }
  
  // Gestionnaire de déconnexion
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      authService.logout();
    });
  }
  
  // Toggle de la sidebar sur mobile
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
    
    // Fermer la sidebar en cliquant à l'extérieur
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 &&
          sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          e.target !== sidebarToggle) {
        sidebar.classList.remove('open');
      }
    });
  }
});