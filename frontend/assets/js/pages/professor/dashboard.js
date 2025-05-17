document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'accès professeur
  if (!authGuard.checkAccess(['PROFESSOR'])) {
    return;
  }

  // Références des éléments DOM
  const filieresListElement = document.getElementById('filieresList');
  const recentModulesElement = document.getElementById('recentModules');

  // Charger les données du professeur
  loadProfessorData();
  loadModules();

  // Fonction pour charger les données du professeur
  async function loadProfessorData() {
    try {
      const user = await httpClient.get('/auth/profile');
      
      if (!user) {
        showError('Erreur lors du chargement des données');
        return;
      }
      
      // Mettre à jour le nom dans la barre supérieure
      const userNameElement = document.getElementById('userName');
      if (userNameElement) {
        userNameElement.textContent = `${user.prenom} ${user.nom}`;
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des données du professeur:', error);
      showError('Erreur lors du chargement des données');
    }
  }

  // Fonction pour charger les filières et modules
  async function loadModules() {
    try {
      // Récupérer les filières enseignées par le professeur
      const filieres = await httpClient.get('/professor/filieres');
      
      // Récupérer les modules enseignés par le professeur
      const modules = await httpClient.get('/professor/modules');
      
      // Afficher les filières
      if (filieres && filieres.length > 0) {
        renderFilieres(filieres);
      } else {
        filieresListElement.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-school"></i>
            <p>Vous n'êtes assigné à aucune filière pour le moment.</p>
          </div>
        `;
      }
      
      // Afficher les modules
      if (modules && modules.length > 0) {
        renderModules(modules);
      } else {
        recentModulesElement.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-book"></i>
            <p>Vous n'êtes assigné à aucun module pour le moment.</p>
          </div>
        `;
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des modules:', error);
      showError('Erreur lors du chargement des modules');
    }
  }

  // Fonction pour afficher les filières
  function renderFilieres(filieres) {
    // Regrouper les filières par année académique
    const filieresByYear = {};
    
    filieres.forEach(filiere => {
      const year = filiere.nombreAnnees || 2;
      if (!filieresByYear[year]) {
        filieresByYear[year] = [];
      }
      filieresByYear[year].push(filiere);
    });
    
    let html = '';
    
    for (const [year, filieresGroup] of Object.entries(filieresByYear)) {
      html += `
        <div class="filieres-group">
          <h3 class="group-title">Filières de ${year} ${year > 1 ? 'années' : 'année'}</h3>
          <div class="filieres-grid">
            ${filieresGroup.map(filiere => `
              <div class="filiere-card">
                <div class="filiere-header">
                  <h4>${escapeHtml(filiere.nom)}</h4>
                </div>
                <div class="filiere-body">
                  <p class="filiere-description">${escapeHtml(filiere.description)}</p>
                  <div class="filiere-stats">
                    <div class="filiere-stat">
                      <span class="stat-value">${filiere.nombreEtudiants}</span>
                      <span class="stat-label">Étudiants</span>
                    </div>
                    <div class="filiere-stat">
                      <span class="stat-value">${filiere.nombreModules}</span>
                      <span class="stat-label">Modules</span>
                    </div>
                  </div>
                  <a href="modules.html?filiere=${filiere.id}" class="btn btn-sm btn-primary mt-2">
                    <i class="fas fa-book"></i> Voir les modules
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    filieresListElement.innerHTML = html;
  }

  // Fonction pour afficher les modules
  function renderModules(modules) {
    // Trier les modules par semestre
    modules.sort((a, b) => a.semestre - b.semestre);
    
    // Limiter à 5 modules pour l'affichage récent
    const recentModules = modules.slice(0, 5);
    
    let html = `
      <div class="modules-list">
        ${recentModules.map(module => `
          <div class="module-card">
            <div class="module-header">
              <h4 class="module-title">${escapeHtml(module.nom)}</h4>
              <span class="module-filiere">${escapeHtml(module.filiereNom)} - Semestre ${module.semestre}</span>
            </div>
            <div class="module-content">
              <p class="module-description">${escapeHtml(module.description)}</p>
              <div class="module-hours">
                <span class="hour-item"><i class="fas fa-chalkboard-teacher"></i> CM: ${module.heuresCours}h</span>
                <span class="hour-item"><i class="fas fa-users"></i> TD: ${module.heuresTD}h</span>
                <span class="hour-item"><i class="fas fa-laptop-code"></i> TP: ${module.heuresTP}h</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    // Ajouter un lien pour voir tous les modules si il y en a plus que 5
    if (modules.length > 5) {
      html += `
        <div class="view-all-link">
          <a href="modules.html" class="btn btn-outline">
            <i class="fas fa-list"></i> Voir tous mes modules (${modules.length})
          </a>
        </div>
      `;
    }
    
    recentModulesElement.innerHTML = html;
  }

  // Fonction pour échapper le HTML et éviter les injections XSS
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Fonction pour afficher les notifications
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Supprimer la notification après 3 secondes
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Fonction pour afficher les erreurs
  function showError(message) {
    showNotification(message, 'error');
  }
});