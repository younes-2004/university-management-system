document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'accès admin
  if (!authGuard.checkAccess(['ADMIN'])) {
    return;
  }

  // Récupérer l'ID de la filière depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const filiereId = urlParams.get('id');

  if (!filiereId) {
    showError();
    return;
  }

  // Références des éléments DOM
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const filiereDetails = document.getElementById('filiereDetails');
  const retryBtn = document.getElementById('retryBtn');

  // Variables d'état
  let currentFiliere = null;

  // Charger les détails de la filière au démarrage
  loadFiliereDetails();

  // Event listeners
  retryBtn.addEventListener('click', loadFiliereDetails);

  // Fonction pour charger les détails de la filière
  async function loadFiliereDetails() {
    try {
      showLoading();
      
      // Charger les données de la filière
      currentFiliere = await filiereService.getFiliereById(filiereId);
      
      if (!currentFiliere) {
        showError();
        return;
      }
      
      // Charger les modules de la filière
      const modules = await moduleService.getModulesByFiliere(filiereId);
      
      // Afficher les détails
      displayFiliereDetails(currentFiliere, modules);
      
    } catch (error) {
      console.error('Erreur lors du chargement de la filière:', error);
      showError();
    }
  }

  // Fonction pour afficher les détails de la filière
  async function displayFiliereDetails(filiere, modules) {
    // Mettre à jour le titre de la page
    document.title = `${filiere.nom} - Détails de la Filière`;
    
    // Remplir les informations de base
    document.getElementById('filiereTitle').textContent = filiere.nom;
    document.getElementById('filiereDescription').textContent = filiere.description;
    
    // Mettre à jour les statistiques
    document.getElementById('studentsCount').textContent = filiere.nombreEtudiants || 0;
    document.getElementById('modulesCount').textContent = filiere.nombreModules || 0;
    document.getElementById('yearsCount').textContent = filiere.nombreAnnees || 2;
    
    // Organiser les modules par année et semestre
    const annees = {};
    
    modules.forEach(module => {
      // Déterminer l'année basée sur le semestre
      const annee = Math.ceil(module.semestre / 2);
      
      if (!annees[annee]) {
        annees[annee] = {
          1: [], // Semestre impair
          2: []  // Semestre pair
        };
      }
      
      // Ajuster le numéro du semestre pour l'affichage
      const semestreDisplay = module.semestre % 2 === 0 ? 2 : 1;
      annees[annee][semestreDisplay].push(module);
    });
    
    // Générer le HTML du contenu
    let contentHtml = '';
    
    if (Object.keys(annees).length === 0) {
      contentHtml = `
        <div class="empty-state">
          <i class="fas fa-book-open"></i>
          <h3>Aucun module défini</h3>
          <p>Cette filière n'a pas encore de modules configurés.</p>
        </div>
      `;
    } else {
      // Générer l'HTML pour chaque année et ses semestres
      for (const [annee, semestres] of Object.entries(annees)) {
        contentHtml += `
          <div class="annee-section">
            <div class="annee-header">
              <i class="fas fa-calendar-alt"></i> Année ${annee}
            </div>
            <div class="semestres-grid">
        `;
        
        // Générer l'HTML pour chaque semestre
        for (let semestreNum = 1; semestreNum <= 2; semestreNum++) {
          const semestreModules = semestres[semestreNum] || [];
          const semestreReel = (parseInt(annee) - 1) * 2 + semestreNum;
          
          contentHtml += `
            <div class="semestre-section">
              <div class="semestre-header">
                <h3 class="semestre-title">
                  <i class="fas fa-calendar"></i> Semestre ${semestreReel}
                </h3>
              </div>
          `;
          
          if (semestreModules.length === 0) {
            contentHtml += `
              <div class="empty-state">
                <i class="fas fa-book"></i>
                <p>Aucun module pour ce semestre</p>
              </div>
            `;
          } else {
            contentHtml += `<div class="modules-list enhanced">`;
            
            for (const module of semestreModules) {
              // Récupérer les éléments du module
              const elements = await elementService.getElementsByModule(module.id);
              
              let elementsHtml = '';
              if (elements.length > 0) {
                elementsHtml = `
                  <div class="elements-list">
                    <div class="elements-header">
                      <i class="fas fa-puzzle-piece"></i> Éléments du module
                    </div>
                    ${elements.map(element => `
                      <div class="element-item">
                        <div class="element-name">${escapeHtml(element.nom)}</div>
                        <div class="element-hours">
                          <span><i class="fas fa-chalkboard-teacher"></i> CM: ${element.heuresCours || 0}h</span>
                          <span><i class="fas fa-users"></i> TD: ${element.heuresTD || 0}h</span>
                          <span><i class="fas fa-laptop-code"></i> TP: ${element.heuresTP || 0}h</span>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `;
              }
              
              contentHtml += `
                <div class="module-item">
                  <div class="module-header">
                    <h4 class="module-name">${escapeHtml(module.nom)}</h4>
                    ${module.professeurNom ? `<span class="module-professor">${escapeHtml(module.professeurNom)}</span>` : ''}
                  </div>
                  <div class="module-description">${escapeHtml(module.description)}</div>
                  <div class="module-hours">
                    <div class="hour-item">
                      <i class="fas fa-chalkboard-teacher"></i>
                      <span>CM: ${module.heuresCours || 0}h</span>
                    </div>
                    <div class="hour-item">
                      <i class="fas fa-users"></i>
                      <span>TD: ${module.heuresTD || 0}h</span>
                    </div>
                    <div class="hour-item">
                      <i class="fas fa-laptop-code"></i>
                      <span>TP: ${module.heuresTP || 0}h</span>
                    </div>
                  </div>
                  ${elementsHtml}
                </div>
              `;
            }
            
            contentHtml += `</div>`;
          }
          
          contentHtml += `</div>`;
        }
        
        contentHtml += `
            </div>
          </div>
        `;
      }
    }
    
    // Injecter le contenu
    document.getElementById('filiereContent').innerHTML = contentHtml;
    
    // Afficher la section de détails
    hideLoading();
    filiereDetails.style.display = 'block';
  }

  // Fonction pour afficher l'état de chargement
  function showLoading() {
    loadingState.style.display = 'flex';
    errorState.style.display = 'none';
    filiereDetails.style.display = 'none';
  }

  // Fonction pour masquer l'état de chargement
  function hideLoading() {
    loadingState.style.display = 'none';
  }

  // Fonction pour afficher l'état d'erreur
  function showError() {
    loadingState.style.display = 'none';
    errorState.style.display = 'flex';
    filiereDetails.style.display = 'none';
  }

  // Fonction d'échappement HTML
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});