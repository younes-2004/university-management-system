document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'accès professeur
  if (!authGuard.checkAccess(['PROFESSOR'])) {
    return;
  }

  // Références des éléments DOM
  const modulesBySemesterElement = document.getElementById('modulesBySemester');
  const filiereFilterElement = document.getElementById('filiereFilter');
  const semestreFilterElement = document.getElementById('semestreFilter');

  // Variables d'état
  let modules = [];
  let filieres = [];
  let selectedFiliereId = 'all';
  let selectedSemestre = 'all';
  
  // Vérifier s'il y a un filtre de filière dans l'URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('filiere')) {
    selectedFiliereId = urlParams.get('filiere');
  }

  // Charger les données du professeur
  loadProfessorData();
  loadModules();

  // Event listeners pour les filtres
  filiereFilterElement.addEventListener('change', () => {
    selectedFiliereId = filiereFilterElement.value;
    filterModules();
  });
  
  semestreFilterElement.addEventListener('change', () => {
    selectedSemestre = semestreFilterElement.value;
    filterModules();
  });

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

  // Fonction pour charger les modules et filières
  async function loadModules() {
    try {
      // Récupérer les filières enseignées par le professeur
      filieres = await httpClient.get('/professor/filieres');
      
      // Récupérer les modules enseignés par le professeur
      modules = await httpClient.get('/professor/modules');
      
      // Remplir le filtre de filières
      populateFiliereFilter();
      
      // Appliquer les filtres initiaux
      if (selectedFiliereId !== 'all') {
        filiereFilterElement.value = selectedFiliereId;
      }
      
      filterModules();
      
    } catch (error) {
      console.error('Erreur lors du chargement des modules:', error);
      modulesBySemesterElement.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Erreur lors du chargement des modules.</p>
          <button id="retryBtn" class="btn btn-primary">Réessayer</button>
        </div>
      `;
      
      // Ajouter un event listener pour le bouton de réessai
      document.getElementById('retryBtn').addEventListener('click', loadModules);
    }
  }

  // Fonction pour remplir le filtre de filières
  function populateFiliereFilter() {
    let options = '<option value="all">Toutes les filières</option>';
    
    if (filieres && filieres.length > 0) {
      filieres.forEach(filiere => {
        options += `<option value="${filiere.id}">${escapeHtml(filiere.nom)}</option>`;
      });
    }
    
    filiereFilterElement.innerHTML = options;
  }

  // Fonction pour filtrer et afficher les modules
  function filterModules() {
    if (!modules || modules.length === 0) {
      modulesBySemesterElement.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-book"></i>
          <p>Vous n'êtes assigné à aucun module pour le moment.</p>
        </div>
      `;
      return;
    }
    
    // Filtrer les modules par filière si nécessaire
    let filteredModules = modules;
    
    if (selectedFiliereId !== 'all') {
      filteredModules = modules.filter(module => module.filiereId.toString() === selectedFiliereId);
    }
    
    // Filtrer les modules par semestre si nécessaire
    if (selectedSemestre !== 'all') {
      filteredModules = filteredModules.filter(module => module.semestre.toString() === selectedSemestre);
    }
    
    // Si aucun module ne correspond aux filtres
    if (filteredModules.length === 0) {
      modulesBySemesterElement.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-filter"></i>
          <p>Aucun module ne correspond aux filtres sélectionnés.</p>
        </div>
      `;
      return;
    }
    
    // Organiser les modules par filière et semestre
    const modulesByFiliereAndSemestre = {};
    
    filteredModules.forEach(module => {
      const filiereId = module.filiereId;
      const semestre = module.semestre;
      
      if (!modulesByFiliereAndSemestre[filiereId]) {
        modulesByFiliereAndSemestre[filiereId] = {};
      }
      
      if (!modulesByFiliereAndSemestre[filiereId][semestre]) {
        modulesByFiliereAndSemestre[filiereId][semestre] = [];
      }
      
      modulesByFiliereAndSemestre[filiereId][semestre].push(module);
    });
    
    // Générer le HTML
    let html = '';
    
    for (const filiereId in modulesByFiliereAndSemestre) {
      const filiere = filieres.find(f => f.id.toString() === filiereId.toString());
      if (!filiere) continue;
      
      html += `
        <div class="filiere-section">
          <h2 class="filiere-name">${escapeHtml(filiere.nom)}</h2>
      `;
      
      const semestres = modulesByFiliereAndSemestre[filiereId];
      for (const semestre in semestres) {
        html += `
          <div class="semestre-section">
            <h3 class="semestre-name">Semestre ${semestre}</h3>
            <div class="modules-grid">
        `;
        
        const semestreModules = semestres[semestre];
        semestreModules.forEach(module => {
          html += `
            <div class="module-card" data-id="${module.id}">
              <div class="module-header">
                <h4 class="module-title">${escapeHtml(module.nom)}</h4>
              </div>
              <div class="module-content">
                <p class="module-description">${escapeHtml(module.description)}</p>
                <div class="module-hours">
                  <span class="hour-item"><i class="fas fa-chalkboard-teacher"></i> CM: ${module.heuresCours}h</span>
                  <span class="hour-item"><i class="fas fa-users"></i> TD: ${module.heuresTD}h</span>
                  <span class="hour-item"><i class="fas fa-laptop-code"></i> TP: ${module.heuresTP}h</span>
                </div>
              </div>
              <div class="module-footer">
                <button class="btn btn-sm btn-primary view-elements-btn" data-id="${module.id}">
                  <i class="fas fa-list"></i> Voir les éléments
                </button>
              </div>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      }
      
      html += `</div>`;
    }
    
    modulesBySemesterElement.innerHTML = html;
    
    // Ajouter des event listeners pour les boutons "Voir les éléments"
    document.querySelectorAll('.view-elements-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const moduleId = btn.getAttribute('data-id');
        showModuleElements(moduleId);
      });
    });
  }

  // Fonction pour afficher les éléments d'un module
  async function showModuleElements(moduleId) {
    try {
      // Récupérer le module
      const module = modules.find(m => m.id.toString() === moduleId.toString());
      if (!module) {
        showError('Module non trouvé');
        return;
      }
      
      // Récupérer les éléments du module
      const elements = await elementService.getElementsByModule(moduleId);
      
      // Créer le contenu du modal
      let content = `
        <div class="module-details">
          <div class="module-info">
            <h3 class="module-name">${escapeHtml(module.nom)}</h3>
            <p class="module-description">${escapeHtml(module.description)}</p>
            <div class="module-meta">
              <div class="meta-item">
                <span class="meta-label">Filière:</span>
                <span class="meta-value">${escapeHtml(module.filiereNom)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Semestre:</span>
                <span class="meta-value">${module.semestre}</span>
              </div>
            </div>
            <div class="module-hours-details">
              <div class="hours-heading">Volume horaire:</div>
              <div class="hours-grid">
                <div class="hour-box">
                  <span class="hour-value">${module.heuresCours}</span>
                  <span class="hour-label">Heures CM</span>
                </div>
                <div class="hour-box">
                  <span class="hour-value">${module.heuresTD}</span>
                  <span class="hour-label">Heures TD</span>
                </div>
                <div class="hour-box">
                  <span class="hour-value">${module.heuresTP}</span>
                  <span class="hour-label">Heures TP</span>
                </div>
              </div>
            </div>
          </div>
      `;
      
      // Ajouter les éléments du module si disponibles
      if (elements && elements.length > 0) {
        content += `
          <div class="elements-section">
            <h3>Éléments du module</h3>
            <div class="elements-list">
        `;
        
        elements.forEach(element => {
          content += `
            <div class="element-card">
              <div class="element-header">
                <h4 class="element-title">${escapeHtml(element.nom)}</h4>
              </div>
              <div class="element-content">
                <p class="element-description">${escapeHtml(element.description)}</p>
                <div class="element-hours">
                  <span class="hour-item"><i class="fas fa-chalkboard-teacher"></i> CM: ${element.heuresCours}h</span>
                  <span class="hour-item"><i class="fas fa-users"></i> TD: ${element.heuresTD}h</span>
                  <span class="hour-item"><i class="fas fa-laptop-code"></i> TP: ${element.heuresTP}h</span>
                </div>
              </div>
            </div>
          `;
        });
        
        content += `
            </div>
          </div>
        `;
      } else {
        content += `
          <div class="elements-section">
            <h3>Éléments du module</h3>
            <p class="no-elements">Aucun élément n'est défini pour ce module.</p>
          </div>
        `;
      }
      
      content += `</div>`;
      
      // Ouvrir le modal avec les détails
      modal.open(
        'Détails du module',
        content,
        '<button type="button" class="btn btn-secondary" id="closeModalBtn">Fermer</button>'
      );
      
      // Ajouter l'event listener pour le bouton de fermeture
      document.getElementById('closeModalBtn').addEventListener('click', () => modal.close());
      
    } catch (error) {
      console.error('Erreur lors du chargement des éléments du module:', error);
      showError('Erreur lors du chargement des éléments du module');
    }
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