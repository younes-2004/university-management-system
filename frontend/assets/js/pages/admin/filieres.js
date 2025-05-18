document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'accès admin
  if (!authGuard.checkAccess(['ADMIN'])) {
    return;
  }

  // Références des éléments DOM
  const filieresGrid = document.getElementById('filieresGrid');
  const addFiliereBtn = document.getElementById('addFiliereBtn');

  // Variables d'état
  let filieres = [];
  let editingFiliereId = null;
  let wizardData = {};

  // Charger les filières au chargement de la page
  loadFilieres();

  // Event listener pour le bouton d'ajout
  addFiliereBtn.addEventListener('click', () => showFiliereWizard());

  // Fonction pour charger les filières
  async function loadFilieres() {
    try {
      filieres = await filiereService.getAllFilieres();
      renderFilieres();
    } catch (error) {
      showError('Erreur lors du chargement des filières');
      console.error('Erreur:', error);
    }
  }

  // Fonction pour afficher les filières
  function renderFilieres() {
    if (!filieres || filieres.length === 0) {
      filieresGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-graduation-cap empty-icon"></i>
          <h3>Aucune filière trouvée</h3>
          <p>Commencez par ajouter une nouvelle filière.</p>
        </div>
      `;
      return;
    }

    filieresGrid.innerHTML = filieres.map(filiere => `
      <div class="filiere-card">
        <div class="filiere-header">
          <h3>${escapeHtml(filiere.nom)}</h3>
        </div>
        <div class="filiere-body">
          <div class="filiere-info">
            <p class="filiere-description">${escapeHtml(filiere.description)}</p>
          </div>
          <div class="filiere-stats">
            <div class="filiere-stat">
              <div class="filiere-stat-value">${filiere.nombreEtudiants}</div>
              <div class="filiere-stat-label">Étudiants</div>
            </div>
            <div class="filiere-stat">
              <div class="filiere-stat-value">${filiere.nombreModules}</div>
              <div class="filiere-stat-label">Modules</div>
            </div>
            <div class="filiere-stat">
              <div class="filiere-stat-value">${filiere.nombreAnnees || 2}</div>
              <div class="filiere-stat-label">Années d'études</div>
            </div>
          </div>
          <div class="filiere-actions">
            <button class="btn btn-sm btn-info view-filiere" data-id="${filiere.id}">
              <i class="fas fa-eye"></i> Détails
            </button>
            <button class="btn btn-sm btn-primary edit-filiere" data-id="${filiere.id}">
              <i class="fas fa-edit"></i> Modifier
            </button>
            <button class="btn btn-sm btn-danger delete-filiere" data-id="${filiere.id}">
              <i class="fas fa-trash"></i> Supprimer
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Ajouter les event listeners aux boutons d'action
    document.querySelectorAll('.view-filiere').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        viewFiliere(id);
      });
    });

    document.querySelectorAll('.edit-filiere').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        editFiliere(id);
      });
    });

    document.querySelectorAll('.delete-filiere').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        confirmDeleteFiliere(id);
      });
    });
  }

  // Fonction améliorée pour afficher les détails d'une filière
  async function viewFiliere(id) {
    try {
      const filiere = await filiereService.getFiliereById(id);
      if (!filiere) {
        showError('Filière non trouvée');
        return;
      }
      
      // Récupérer les modules de la filière
      const modules = await moduleService.getModulesByFiliere(id);
      
      // Organiser les modules par année et semestre
      const annees = {};
      
      modules.forEach(module => {
        // Déterminer l'année basée sur le semestre (semestres 1-2 = année 1, semestres 3-4 = année 2)
        const annee = Math.ceil(module.semestre / 2);
        
        if (!annees[annee]) {
          annees[annee] = {
            1: [], // Semestre impair (1 ou 3)
            2: []  // Semestre pair (2 ou 4)
          };
        }
        
        // Ajuster le numéro du semestre pour l'affichage (1-2 pour chaque année)
        const semestreDisplay = module.semestre % 2 === 0 ? 2 : 1;
        annees[annee][semestreDisplay].push(module);
      });
      
      // Générer le HTML amélioré
      let anneesHtml = '';
      
      // Cas où il n'y a pas de modules
      if (Object.keys(annees).length === 0) {
        anneesHtml = `
          <div class="empty-state">
            <i class="fas fa-book-open"></i>
            <h3>Aucun module défini</h3>
            <p>Cette filière n'a pas encore de modules configurés.</p>
          </div>
        `;
      } else {
        // Générer l'HTML pour chaque année et ses semestres
        for (const [annee, semestres] of Object.entries(annees)) {
          anneesHtml += `
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
            
            anneesHtml += `
              <div class="semestre-section">
                <div class="semestre-header">
                  <h3 class="semestre-title">
                    <i class="fas fa-calendar"></i> Semestre ${semestreReel}
                  </h3>
                </div>
            `;
            
            if (semestreModules.length === 0) {
              anneesHtml += `
                <div class="empty-state">
                  <i class="fas fa-book"></i>
                  <p>Aucun module pour ce semestre</p>
                </div>
              `;
            } else {
              anneesHtml += `<div class="modules-list enhanced">`;
              
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
                
                anneesHtml += `
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
              
              anneesHtml += `</div>`;
            }
            
            anneesHtml += `</div>`;
          }
          
          anneesHtml += `
              </div>
            </div>
          `;
        }
      }
      
      // Créer le contenu de la modal
      const content = `
        <div class="filiere-detail-header">
          <div class="filiere-title-section">
            <h1 class="filiere-title">${escapeHtml(filiere.nom)}</h1>
            <div class="filiere-actions">
              <button class="btn btn-primary edit-filiere-btn" data-id="${filiere.id}">
                <i class="fas fa-edit"></i> Modifier
              </button>
            </div>
          </div>
          
          <div class="filiere-description-section">
            <p class="filiere-description">${escapeHtml(filiere.description)}</p>
          </div>
          
          <div class="filiere-stats-grid">
            <div class="stat-card">
              <div class="stat-icon students">
                <i class="fas fa-user-graduate"></i>
              </div>
              <div class="stat-value">${filiere.nombreEtudiants || 0}</div>
              <p class="stat-label">Étudiants inscrits</p>
            </div>
            <div class="stat-card">
              <div class="stat-icon modules">
                <i class="fas fa-book"></i>
              </div>
              <div class="stat-value">${filiere.nombreModules || 0}</div>
              <p class="stat-label">Modules au total</p>
            </div>
            <div class="stat-card">
              <div class="stat-icon years">
                <i class="fas fa-calendar-alt"></i>
              </div>
              <div class="stat-value">${filiere.nombreAnnees || Object.keys(annees).length || 2}</div>
              <p class="stat-label">Années d'études</p>
            </div>
          </div>
        </div>
        
        <div class="filiere-content">
          ${anneesHtml}
        </div>
      `;
      
      // Ouvrir la modal avec la classe large-modal
      modal.open(
        '',  // Titre vide car on a un header personnalisé
        content,
        `<button type="button" class="btn btn-secondary" id="closeBtn">
           <i class="fas fa-times"></i> Fermer
         </button>`,
        'large-modal'  // Classe CSS personnalisée
      );
      
      // Ajouter les classes CSS améliorées
      const modalElement = document.querySelector('.modal');
      const modalHeader = document.querySelector('.modal-header');
      const modalBody = document.querySelector('.modal-body');
      const modalFooter = document.querySelector('.modal-footer');
      const modalClose = document.querySelector('.modal-close');
      
      if (modalElement) modalElement.classList.add('large-modal');
      if (modalHeader) modalHeader.classList.add('enhanced');
      if (modalBody) modalBody.classList.add('enhanced');
      if (modalFooter) modalFooter.classList.add('enhanced');
      if (modalClose) modalClose.classList.add('enhanced');
      
      // Event listeners
      document.getElementById('closeBtn').addEventListener('click', () => modal.close());
      
      // Ajouter l'event listener pour le bouton d'édition
      document.querySelector('.edit-filiere-btn')?.addEventListener('click', () => {
        modal.close();
        editFiliere(filiere.id);
      });
      
    } catch (error) {
      showError('Erreur lors de la récupération des détails de la filière');
      console.error('Erreur:', error);
    }
  }

  // Fonction commune pour gérer la complétion de l'assistant
  function handleWizardComplete(data) {
  return async () => {
    try {
      // Correction pour le problème nombreAnnees null
      if (!data.basicInfo.nombreAnnees) {
        data.basicInfo.nombreAnnees = 2; // Valeur par défaut
      }
      
      console.log("Fonction onComplete exécutée", data);
      
      // Soumettre les données à l'API
      if (editingFiliereId) {
        await filiereService.updateFiliere(editingFiliereId, data.basicInfo);
      } else {
        // Afficher les données pour le débogage
        console.log("Données filière à créer:", JSON.stringify(data.basicInfo));
        
        const createdFiliere = await filiereService.createFiliere(data.basicInfo);
          
          // Créer les modules pour chaque semestre
          if (data.semestres) {
            for (const semestre of data.semestres) {
              if (semestre.modules && semestre.modules.length > 0) {
                for (const module of semestre.modules) {
                  const moduleData = {
                    nom: module.nom,
                    description: module.description,
                    filiereId: createdFiliere.id,
                    semestre: semestre.numero,
                    heuresCours: module.heuresCours || 0,
                    heuresTD: module.heuresTD || 0,
                    heuresTP: module.heuresTP || 0
                  };
                  
                  const createdModule = await moduleService.createModule(moduleData);
                  
                  // Créer les éléments pour ce module
                  if (module.elements && module.elements.length > 0) {
                    for (const element of module.elements) {
                      const elementData = {
                        nom: element.nom,
                        description: element.description,
                        moduleId: createdModule.id,
                        heuresCours: element.heuresCours || 0,
                        heuresTD: element.heuresTD || 0,
                        heuresTP: element.heuresTP || 0
                      };
                      
                      await elementService.createElement(elementData);
                    }
                  }
                }
              }
            }
          }
        }
        
        showNotification(editingFiliereId ? 'Filière mise à jour avec succès' : 'Filière créée avec succès', 'success');
      modal.close();
      loadFilieres();
    } catch (error) {
      console.error('Erreur détaillée lors de l\'enregistrement de la filière:', error);
      showError('Erreur lors de l\'enregistrement de la filière: ' + (error.message || 'Erreur serveur'));
    }
    };
  }

  // Fonction pour afficher l'assistant d'ajout de filière
  function showFiliereWizard(filiere = null) {
    editingFiliereId = filiere ? filiere.id : null;
    wizardData = filiere ? { ...filiere } : {};
    
    const modalTitle = filiere ? 'Modifier la filière' : 'Ajouter une filière';
    
    // Définir les étapes de l'assistant
    const wizardSteps = [
      {
        title: 'Informations de base',
        content: generateBasicInfoStep(wizardData),
        validate: validateBasicInfoStep,
        collectData: collectBasicInfoData
      },
      {
        title: 'Semestres et Modules',
        content: generateSemestresStep(wizardData),
        validate: validateSemestresStep,
        collectData: collectSemestresData
      },
      {
        title: 'Éléments des Modules',
        content: generateElementsStep(wizardData),
        validate: validateElementsStep,
        collectData: collectElementsData
      },
      {
        title: 'Récapitulatif',
        content: generateSummaryStep(wizardData),
        validate: () => true
      }
    ];
    
    // Fonction pour gérer le changement d'étape
    const onStepChangeHandler = (stepIndex, data) => {
      // Mettre à jour le contenu de l'assistant
      const modalContent = document.querySelector('.modal-body');
      modalContent.innerHTML = '';
      
      // Mettre à jour les données
      wizardData = data;
      
      // Recréer l'assistant avec la nouvelle étape
      const updatedWizard = new Wizard({
        steps: wizardSteps,
        initialData: wizardData,
        onStepChange: onStepChangeHandler,
        onComplete: handleWizardComplete(wizardData)
      });
      
      updatedWizard.currentStep = stepIndex;
      
      // Rendre l'assistant mis à jour
      modalContent.appendChild(updatedWizard.render());
      
      // Ajouter les event listeners spécifiques à l'étape
      addStepEventListeners(stepIndex);
    };
    
    // Créer l'assistant
    const wizard = new Wizard({
      steps: wizardSteps,
      initialData: wizardData,
      onStepChange: onStepChangeHandler,
      onComplete: handleWizardComplete(wizardData)
    });
    
    // Ouvrir le modal avec l'assistant
    modal.open(
      modalTitle,
      `<div class="wizard-container-wrapper"></div>`,
      '' // Pas de footer, l'assistant a ses propres boutons
    );
    
    // Insérer l'assistant dans le modal
    const wizardContainer = document.querySelector('.wizard-container-wrapper');
    wizardContainer.appendChild(wizard.render());
    
    // Ajouter les event listeners pour la première étape
    addStepEventListeners(0);
  }

  // Fonction pour générer l'étape des informations de base
  function generateBasicInfoStep(data = {}) {
    const basicInfo = data.basicInfo || {};
    
    return `
      <div class="basic-info-form">
        <div class="form-group">
          <label for="nom">Nom de la filière <span class="required">*</span></label>
          <input type="text" id="nom" name="nom" required value="${basicInfo.nom || ''}">
        </div>
        
        <div class="form-group">
          <label for="description">Description <span class="required">*</span></label>
          <textarea id="description" name="description" rows="4" required>${basicInfo.description || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label for="nombreAnnees">Nombre d'années d'études <span class="required">*</span></label>
          <select id="nombreAnnees" name="nombreAnnees" required>
            <option value="1" ${basicInfo.nombreAnnees === 1 ? 'selected' : ''}>1 année</option>
            <option value="2" ${basicInfo.nombreAnnees === 2 || !basicInfo.nombreAnnees ? 'selected' : ''}>2 années</option>
          </select>
        </div>
        
        <div id="formError" class="error-message"></div>
      </div>
    `;
  }

  // Fonction pour valider l'étape des informations de base
  function validateBasicInfoStep(data) {
    const nom = document.getElementById('nom').value.trim();
    const description = document.getElementById('description').value.trim();
    const formError = document.getElementById('formError');
    
    if (!nom || !description) {
      formError.textContent = 'Tous les champs sont obligatoires';
      formError.style.display = 'block';
      return false;
    }
    
    return true;
  }

  // Fonction pour collecter les données de l'étape des informations de base
  function collectBasicInfoData() {
    return {
      basicInfo: {
        nom: document.getElementById('nom').value.trim(),
        description: document.getElementById('description').value.trim(),
        nombreAnnees: parseInt(document.getElementById('nombreAnnees').value)
      }
    };
  }

  // Fonction pour générer l'étape des semestres et modules
  function generateSemestresStep(data = {}) {
    // Initialiser les données des semestres si non définies
    if (!data.semestres) {
      const nombreAnnees = data.basicInfo?.nombreAnnees || 2;
      data.semestres = [];
      
      // Créer les semestres pour chaque année
      for (let annee = 1; annee <= nombreAnnees; annee++) {
        // Chaque année a 2 semestres
        data.semestres.push(
          { numero: (annee - 1) * 2 + 1, annee: annee, modules: [] },
          { numero: (annee - 1) * 2 + 2, annee: annee, modules: [] }
        );
      }
    }
    
    // Organiser les semestres par année
    const semestresByAnnee = {};
    data.semestres.forEach(semestre => {
      if (!semestresByAnnee[semestre.annee]) {
        semestresByAnnee[semestre.annee] = [];
      }
      semestresByAnnee[semestre.annee].push(semestre);
    });
    
    let semestresHtml = '';
    
    // Générer l'HTML par année
    Object.keys(semestresByAnnee).sort().forEach(annee => {
      semestresHtml += `<h3 class="annee-title">Année ${annee}</h3>`;
      
      // Générer les semestres de cette année
      semestresByAnnee[annee].sort((a, b) => a.numero - b.numero).forEach(semestre => {
        let modulesHtml = '';
        
        if (semestre.modules && semestre.modules.length > 0) {
          semestre.modules.forEach((module, moduleIndex) => {
            modulesHtml += `
              <div class="module-card" data-semestre="${semestre.numero}" data-index="${moduleIndex}">
                <div class="module-header">
                  <h4 class="module-title">${escapeHtml(module.nom)}</h4>
                  <div class="module-actions">
                    <button type="button" class="btn-icon edit-module" data-semestre="${semestre.numero}" data-index="${moduleIndex}">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn-icon delete-module" data-semestre="${semestre.numero}" data-index="${moduleIndex}">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <p>${escapeHtml(module.description)}</p>
                <div class="horaires-container">
                  <span class="horaire-item">Cours: ${module.heuresCours || 0}h</span>
                  <span class="horaire-item">TD: ${module.heuresTD || 0}h</span>
                  <span class="horaire-item">TP: ${module.heuresTP || 0}h</span>
                </div>
              </div>
            `;
          });
        }
        
        semestresHtml += `
          <div class="semestre-card" data-semestre="${semestre.numero}" data-annee="${semestre.annee}">
            <div class="semestre-header">
              <h3 class="semestre-title">Semestre ${semestre.numero}</h3>
              <button type="button" class="btn btn-sm btn-primary add-module-btn" data-semestre="${semestre.numero}">
                <i class="fas fa-plus"></i> Ajouter un module
              </button>
            </div>
            
            <div class="modules-container" id="modulesContainer${semestre.numero}">
              ${modulesHtml || '<p>Aucun module ajouté pour ce semestre.</p>'}
            </div>
            
            <div id="addModuleForm${semestre.numero}" class="add-module-form" style="display: none;">
              <h4>Ajouter un module</h4>
              <div class="form-group">
                <label for="moduleNom${semestre.numero}">Nom du module <span class="required">*</span></label>
                <input type="text" id="moduleNom${semestre.numero}" required>
              </div>
              
              <div class="form-group">
                <label for="moduleDesc${semestre.numero}">Description <span class="required">*</span></label>
                <textarea id="moduleDesc${semestre.numero}" rows="2" required></textarea>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="moduleCours${semestre.numero}">Heures de cours</label>
                  <input type="number" id="moduleCours${semestre.numero}" min="0" value="0">
                </div>
                
                <div class="form-group">
                  <label for="moduleTD${semestre.numero}">Heures de TD</label>
                  <input type="number" id="moduleTD${semestre.numero}" min="0" value="0">
                </div>
                
                <div class="form-group">
                  <label for="moduleTP${semestre.numero}">Heures de TP</label>
                  <input type="number" id="moduleTP${semestre.numero}" min="0" value="0">
                </div>
              </div>
              
              <div id="moduleFormError${semestre.numero}" class="error-message"></div>
              
              <div class="form-actions">
                <button type="button" class="btn btn-secondary cancel-module-btn" data-semestre="${semestre.numero}">Annuler</button>
                <button type="button" class="btn btn-primary save-module-btn" data-semestre="${semestre.numero}">Ajouter</button>
              </div>
            </div>
          </div>
        `;
      });
    });
    
    return `
      <div class="semestres-container">
        ${semestresHtml}
      </div>
    `;
  }

  // Fonction pour ajouter les event listeners spécifiques à l'étape des semestres
  function addStepEventListeners(stepIndex) {
    if (stepIndex === 1) { // Étape des semestres et modules
      // Event listeners pour ajouter un module
      document.querySelectorAll('.add-module-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const semestre = btn.getAttribute('data-semestre');
          const addForm = document.getElementById(`addModuleForm${semestre}`);
          addForm.style.display = 'block';
          btn.style.display = 'none';
        });
      });
      
      // Event listeners pour annuler l'ajout d'un module
      document.querySelectorAll('.cancel-module-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const semestre = btn.getAttribute('data-semestre');
          const addForm = document.getElementById(`addModuleForm${semestre}`);
          addForm.style.display = 'none';
          
          // Réinitialiser le formulaire
          document.getElementById(`moduleNom${semestre}`).value = '';
          document.getElementById(`moduleDesc${semestre}`).value = '';
          document.getElementById(`moduleCours${semestre}`).value = 0;
          document.getElementById(`moduleTD${semestre}`).value = 0;
          document.getElementById(`moduleTP${semestre}`).value = 0;
          
          // Afficher à nouveau le bouton d'ajout
          const addBtn = document.querySelector(`.add-module-btn[data-semestre="${semestre}"]`);
          addBtn.style.display = 'inline-block';
        });
      });
      
      // Event listeners pour sauvegarder un module
      document.querySelectorAll('.save-module-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const semestre = btn.getAttribute('data-semestre');
          const nom = document.getElementById(`moduleNom${semestre}`).value.trim();
          const description = document.getElementById(`moduleDesc${semestre}`).value.trim();
          const heuresCours = parseInt(document.getElementById(`moduleCours${semestre}`).value) || 0;
          const heuresTD = parseInt(document.getElementById(`moduleTD${semestre}`).value) || 0;
          const heuresTP = parseInt(document.getElementById(`moduleTP${semestre}`).value) || 0;
          const errorEl = document.getElementById(`moduleFormError${semestre}`);
          
          if (!nom || !description) {
            errorEl.textContent = 'Le nom et la description sont obligatoires';
            errorEl.style.display = 'block';
            return;
          }
          
          // Ajouter le module aux données
          if (!wizardData.semestres) {
            const nombreAnnees = wizardData.basicInfo?.nombreAnnees || 2;
            wizardData.semestres = [];
            
            // Créer les semestres pour chaque année
            for (let annee = 1; annee <= nombreAnnees; annee++) {
              // Chaque année a 2 semestres
              wizardData.semestres.push(
                { numero: (annee - 1) * 2 + 1, annee: annee, modules: [] },
                { numero: (annee - 1) * 2 + 2, annee: annee, modules: [] }
              );
            }
          }
          
          const semestreIndex = wizardData.semestres.findIndex(s => s.numero == semestre);
          
          if (semestreIndex !== -1) {
            if (!wizardData.semestres[semestreIndex].modules) {
              wizardData.semestres[semestreIndex].modules = [];
            }
            
            // Ajouter le nouveau module
            wizardData.semestres[semestreIndex].modules.push({
              nom,
              description,
              heuresCours,
              heuresTD,
              heuresTP,
              elements: []
            });
            
            // Masquer le formulaire et réinitialiser les champs
            document.getElementById(`addModuleForm${semestre}`).style.display = 'none';
            document.getElementById(`moduleNom${semestre}`).value = '';
            document.getElementById(`moduleDesc${semestre}`).value = '';
            document.getElementById(`moduleCours${semestre}`).value = 0;
            document.getElementById(`moduleTD${semestre}`).value = 0;
            document.getElementById(`moduleTP${semestre}`).value = 0;
            
            // Afficher à nouveau le bouton d'ajout
            const addBtn = document.querySelector(`.add-module-btn[data-semestre="${semestre}"]`);
            addBtn.style.display = 'inline-block';
            
            // Mettre à jour l'affichage des modules
            refreshWizardStep();
          }
        });
      });
      
      // Event listeners pour supprimer un module
      document.querySelectorAll('.delete-module').forEach(btn => {
        btn.addEventListener('click', () => {
          const semestre = btn.getAttribute('data-semestre');
          const moduleIndex = btn.getAttribute('data-index');
          
          // Confirmer la suppression
          if (confirm('Êtes-vous sûr de vouloir supprimer ce module ?')) {
            // Supprimer le module des données
            const semestreIndex = wizardData.semestres.findIndex(s => s.numero == semestre);
            
            if (semestreIndex !== -1 && wizardData.semestres[semestreIndex].modules) {
              wizardData.semestres[semestreIndex].modules.splice(moduleIndex, 1);
              
              // Mettre à jour l'affichage
              refreshWizardStep();
            }
          }
        });
      });
      
      // Event listeners pour éditer un module
      document.querySelectorAll('.edit-module').forEach(btn => {
        btn.addEventListener('click', () => {
          const semestre = btn.getAttribute('data-semestre');
          const moduleIndex = btn.getAttribute('data-index');
          
          // Trouver le module dans les données
          const semestreIndex = wizardData.semestres.findIndex(s => s.numero == semestre);
          
          if (semestreIndex !== -1 && wizardData.semestres[semestreIndex].modules &&
              moduleIndex < wizardData.semestres[semestreIndex].modules.length) {
            
            const module = wizardData.semestres[semestreIndex].modules[moduleIndex];
            
            // Créer et afficher le formulaire d'édition
            const moduleCard = btn.closest('.module-card');
            
            moduleCard.innerHTML = `
              <div class="edit-module-form">
                <h4>Modifier le module</h4>
                <div class="form-group">
                  <label for="editModuleNom${semestre}${moduleIndex}">Nom du module <span class="required">*</span></label>
                  <input type="text" id="editModuleNom${semestre}${moduleIndex}" value="${escapeHtml(module.nom)}" required>
                </div>
                
                <div class="form-group">
                  <label for="editModuleDesc${semestre}${moduleIndex}">Description <span class="required">*</span></label>
                  <textarea id="editModuleDesc${semestre}${moduleIndex}" rows="2" required>${escapeHtml(module.description)}</textarea>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="editModuleCours${semestre}${moduleIndex}">Heures de cours</label>
                    <input type="number" id="editModuleCours${semestre}${moduleIndex}" min="0" value="${module.heuresCours || 0}">
                  </div>
                  
                  <div class="form-group">
                    <label for="editModuleTD${semestre}${moduleIndex}">Heures de TD</label>
                    <input type="number" id="editModuleTD${semestre}${moduleIndex}" min="0" value="${module.heuresTD || 0}">
                  </div>
                  
                  <div class="form-group">
                    <label for="editModuleTP${semestre}${moduleIndex}">Heures de TP</label>
                    <input type="number" id="editModuleTP${semestre}${moduleIndex}" min="0" value="${module.heuresTP || 0}">
                  </div>
                </div>
                
                <div id="editModuleFormError${semestre}${moduleIndex}" class="error-message"></div>
                
                <div class="form-actions">
                  <button type="button" class="btn btn-secondary cancel-edit-module-btn" data-semestre="${semestre}" data-index="${moduleIndex}">Annuler</button>
                  <button type="button" class="btn btn-primary save-edit-module-btn" data-semestre="${semestre}" data-index="${moduleIndex}">Enregistrer</button>
                </div>
              </div>
            `;
            
            // Ajouter les event listeners pour les boutons du formulaire d'édition
            const cancelEditBtn = moduleCard.querySelector('.cancel-edit-module-btn');
            const saveEditBtn = moduleCard.querySelector('.save-edit-module-btn');
            
            cancelEditBtn.addEventListener('click', () => {
              refreshWizardStep();
            });
            
            saveEditBtn.addEventListener('click', () => {
              const newNom = document.getElementById(`editModuleNom${semestre}${moduleIndex}`).value.trim();
              const newDesc = document.getElementById(`editModuleDesc${semestre}${moduleIndex}`).value.trim();
              const newCours = parseInt(document.getElementById(`editModuleCours${semestre}${moduleIndex}`).value) || 0;
              const newTD = parseInt(document.getElementById(`editModuleTD${semestre}${moduleIndex}`).value) || 0;
              const newTP = parseInt(document.getElementById(`editModuleTP${semestre}${moduleIndex}`).value) || 0;
              const errorEl = document.getElementById(`editModuleFormError${semestre}${moduleIndex}`);
              
              if (!newNom || !newDesc) {
                errorEl.textContent = 'Le nom et la description sont obligatoires';
                errorEl.style.display = 'block';
                return;
              }
              
              // Mettre à jour les données du module
              wizardData.semestres[semestreIndex].modules[moduleIndex] = {
                ...wizardData.semestres[semestreIndex].modules[moduleIndex],
                nom: newNom,
                description: newDesc,
                heuresCours: newCours,
                heuresTD: newTD,
                heuresTP: newTP
              };
              
              refreshWizardStep();
            });
          }
        });
      });
    } else if (stepIndex === 2) { // Étape des éléments
      // Ajouter les event listeners pour l'étape des éléments
      setupElementsEventListeners();
    }
  }

  // Fonction pour valider l'étape des semestres et modules
  function validateSemestresStep() {
    // Vérifier qu'au moins un module est défini par semestre
    let isValid = true;
    
    // Groupe les semestres par année pour l'affichage des messages d'erreur
    const semestresByAnnee = {};
    wizardData.semestres.forEach(semestre => {
      if (!semestresByAnnee[semestre.annee]) {
        semestresByAnnee[semestre.annee] = [];
      }
      semestresByAnnee[semestre.annee].push(semestre);
    });
    
    Object.entries(semestresByAnnee).forEach(([annee, semestres]) => {
      semestres.forEach(semestre => {
        if (!semestre.modules || semestre.modules.length === 0) {
          isValid = false;
          alert(`Vous devez ajouter au moins un module pour le semestre ${semestre.numero} (Année ${annee})`);
        }
      });
    });
    
    return isValid;
  }

  // Fonction pour collecter les données de l'étape des semestres et modules
  function collectSemestresData() {
    // Les données sont déjà collectées lors des interactions, rien à faire ici
    return {};
  }

  // Fonction pour générer l'étape des éléments
  function generateElementsStep(data = {}) {
    if (!data.semestres) {
      return '<p>Veuillez d\'abord définir les modules dans l\'étape précédente.</p>';
    }
    
    // Organiser les semestres par année
    const semestresByAnnee = {};
    data.semestres.forEach(semestre => {
      if (!semestresByAnnee[semestre.annee]) {
        semestresByAnnee[semestre.annee] = [];
      }
      semestresByAnnee[semestre.annee].push(semestre);
    });
    
    let elementsHtml = '';
    
    // Générer l'HTML par année et semestre
    Object.keys(semestresByAnnee).sort().forEach(annee => {
      elementsHtml += `<h3 class="annee-title">Année ${annee}</h3>`;
      
      // Générer les semestres de cette année
      semestresByAnnee[annee].sort((a, b) => a.numero - b.numero).forEach(semestre => {
        if (!semestre.modules || semestre.modules.length === 0) {
          return;
        }
        
        elementsHtml += `<h4>Semestre ${semestre.numero}</h4>`;
        
        semestre.modules.forEach((module, moduleIndex) => {
          let elementsListHtml = '';
          
          if (module.elements && module.elements.length > 0) {
            module.elements.forEach((element, elementIndex) => {
              elementsListHtml += `
                <div class="element-card" data-semestre="${semestre.numero}" data-module="${moduleIndex}" data-index="${elementIndex}">
                  <div class="element-header">
                    <h5 class="element-title">${escapeHtml(element.nom)}</h5>
                    <div class="element-actions">
                      <button type="button" class="btn-icon edit-element" data-semestre="${semestre.numero}" data-module="${moduleIndex}" data-index="${elementIndex}">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button type="button" class="btn-icon delete-element" data-semestre="${semestre.numero}" data-module="${moduleIndex}" data-index="${elementIndex}">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  <p>${escapeHtml(element.description)}</p>
                  <div class="horaires-container">
                    <span class="horaire-item">Cours: ${element.heuresCours || 0}h</span>
                    <span class="horaire-item">TD: ${element.heuresTD || 0}h</span>
                    <span class="horaire-item">TP: ${element.heuresTP || 0}h</span>
                  </div>
                </div>
              `;
            });
          }
          
          elementsHtml += `
            <div class="module-elements-container" data-semestre="${semestre.numero}" data-module="${moduleIndex}">
              <div class="module-header">
                <h4>${escapeHtml(module.nom)}</h4>
                <button type="button" class="btn btn-sm btn-primary add-element-btn" data-semestre="${semestre.numero}" data-module="${moduleIndex}">
                  <i class="fas fa-plus"></i> Ajouter un élément
                </button>
              </div>
              
              <div class="elements-container">
                ${elementsListHtml || '<p>Aucun élément ajouté pour ce module.</p>'}
              </div>
              
              <div id="addElementForm${semestre.numero}${moduleIndex}" class="add-element-form" style="display: none;">
                <h4>Ajouter un élément</h4>
                <div class="form-group">
                  <label for="elementNom${semestre.numero}${moduleIndex}">Nom de l'élément <span class="required">*</span></label>
                  <input type="text" id="elementNom${semestre.numero}${moduleIndex}" required>
                </div>
                
                <div class="form-group">
                  <label for="elementDesc${semestre.numero}${moduleIndex}">Description <span class="required">*</span></label>
                  <textarea id="elementDesc${semestre.numero}${moduleIndex}" rows="2" required></textarea>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="elementCours${semestre.numero}${moduleIndex}">Heures de cours</label>
                    <input type="number" id="elementCours${semestre.numero}${moduleIndex}" min="0" value="0">
                  </div>
                  
                  <div class="form-group">
                    <label for="elementTD${semestre.numero}${moduleIndex}">Heures de TD</label>
                    <input type="number" id="elementTD${semestre.numero}${moduleIndex}" min="0" value="0">
                  </div>
                  
                  <div class="form-group">
                    <label for="elementTP${semestre.numero}${moduleIndex}">Heures de TP</label>
                    <input type="number" id="elementTP${semestre.numero}${moduleIndex}" min="0" value="0">
                  </div>
                </div>
                
                <div id="elementFormError${semestre.numero}${moduleIndex}" class="error-message"></div>
                
                <div class="form-actions">
                  <button type="button" class="btn btn-secondary cancel-element-btn" data-semestre="${semestre.numero}" data-module="${moduleIndex}">Annuler</button>
                  <button type="button" class="btn btn-primary save-element-btn" data-semestre="${semestre.numero}" data-module="${moduleIndex}">Ajouter</button>
                </div>
              </div>
            </div>
          `;
        });
      });
    });
    
    return `
      <div class="elements-step-container">
        ${elementsHtml}
      </div>
    `;
  }

  // Fonction pour configurer les event listeners de l'étape des éléments
  function setupElementsEventListeners() {
    // Event listeners pour ajouter un élément
    document.querySelectorAll('.add-element-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const semestre = btn.getAttribute('data-semestre');
        const moduleIndex = btn.getAttribute('data-module');
        const addForm = document.getElementById(`addElementForm${semestre}${moduleIndex}`);
        addForm.style.display = 'block';
        btn.style.display = 'none';
      });
    });

    // Event listeners pour annuler l'ajout d'un élément
    document.querySelectorAll('.cancel-element-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const semestre = btn.getAttribute('data-semestre');
        const moduleIndex = btn.getAttribute('data-module');
        const addForm = document.getElementById(`addElementForm${semestre}${moduleIndex}`);
        addForm.style.display = 'none';
        
        // Réinitialiser le formulaire
        document.getElementById(`elementNom${semestre}${moduleIndex}`).value = '';
        document.getElementById(`elementDesc${semestre}${moduleIndex}`).value = '';
        document.getElementById(`elementCours${semestre}${moduleIndex}`).value = 0;
        document.getElementById(`elementTD${semestre}${moduleIndex}`).value = 0;
        document.getElementById(`elementTP${semestre}${moduleIndex}`).value = 0;
        
        // Afficher à nouveau le bouton d'ajout
        const addBtn = document.querySelector(`.add-element-btn[data-semestre="${semestre}"][data-module="${moduleIndex}"]`);
        addBtn.style.display = 'inline-block';
      });
    });
    
    // Event listeners pour sauvegarder un élément
    document.querySelectorAll('.save-element-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const semestre = btn.getAttribute('data-semestre');
        const moduleIndex = btn.getAttribute('data-module');
        const nom = document.getElementById(`elementNom${semestre}${moduleIndex}`).value.trim();
        const description = document.getElementById(`elementDesc${semestre}${moduleIndex}`).value.trim();
        const heuresCours = parseInt(document.getElementById(`elementCours${semestre}${moduleIndex}`).value) || 0;
        const heuresTD = parseInt(document.getElementById(`elementTD${semestre}${moduleIndex}`).value) || 0;
        const heuresTP = parseInt(document.getElementById(`elementTP${semestre}${moduleIndex}`).value) || 0;
        const errorEl = document.getElementById(`elementFormError${semestre}${moduleIndex}`);
        
        if (!nom || !description) {
          errorEl.textContent = 'Le nom et la description sont obligatoires';
          errorEl.style.display = 'block';
          return;
        }
        
        // Ajouter l'élément aux données
        const semestreIndex = wizardData.semestres.findIndex(s => s.numero == semestre);
        
        if (semestreIndex !== -1 && 
            wizardData.semestres[semestreIndex].modules && 
            moduleIndex < wizardData.semestres[semestreIndex].modules.length) {
          
          if (!wizardData.semestres[semestreIndex].modules[moduleIndex].elements) {
            wizardData.semestres[semestreIndex].modules[moduleIndex].elements = [];
          }
          
          // Ajouter le nouvel élément
          wizardData.semestres[semestreIndex].modules[moduleIndex].elements.push({
            nom,
            description,
            heuresCours,
            heuresTD,
            heuresTP
          });
          
          // Mettre à jour l'interface
          refreshWizardStep();
        }
      });
    });
    
    // Event listeners pour supprimer un élément
    document.querySelectorAll('.delete-element').forEach(btn => {
      btn.addEventListener('click', () => {
        const semestre = btn.getAttribute('data-semestre');
        const moduleIndex = btn.getAttribute('data-module');
        const elementIndex = btn.getAttribute('data-index');
        
        // Confirmer la suppression
        if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
          // Supprimer l'élément des données
          const semestreIndex = wizardData.semestres.findIndex(s => s.numero == semestre);
          
          if (semestreIndex !== -1 && 
              wizardData.semestres[semestreIndex].modules && 
              moduleIndex < wizardData.semestres[semestreIndex].modules.length &&
              wizardData.semestres[semestreIndex].modules[moduleIndex].elements) {
            
            wizardData.semestres[semestreIndex].modules[moduleIndex].elements.splice(elementIndex, 1);
            
            // Mettre à jour l'interface
            refreshWizardStep();
          }
        }
      });
    });
    
    // Event listeners pour éditer un élément
    document.querySelectorAll('.edit-element').forEach(btn => {
      btn.addEventListener('click', () => {
        const semestre = btn.getAttribute('data-semestre');
        const moduleIndex = btn.getAttribute('data-module');
        const elementIndex = btn.getAttribute('data-index');
        
        // Trouver l'élément dans les données
        const semestreIndex = wizardData.semestres.findIndex(s => s.numero == semestre);
        
        if (semestreIndex !== -1 && 
            wizardData.semestres[semestreIndex].modules && 
            moduleIndex < wizardData.semestres[semestreIndex].modules.length &&
            wizardData.semestres[semestreIndex].modules[moduleIndex].elements &&
            elementIndex < wizardData.semestres[semestreIndex].modules[moduleIndex].elements.length) {
          
          const element = wizardData.semestres[semestreIndex].modules[moduleIndex].elements[elementIndex];
          
          // Créer et afficher le formulaire d'édition
          const elementCard = btn.closest('.element-card');
          
          elementCard.innerHTML = `
            <div class="edit-element-form">
              <h4>Modifier l'élément</h4>
              <div class="form-group">
                <label for="editElementNom${semestre}${moduleIndex}${elementIndex}">Nom de l'élément <span class="required">*</span></label>
                <input type="text" id="editElementNom${semestre}${moduleIndex}${elementIndex}" value="${escapeHtml(element.nom)}" required>
              </div>
              
              <div class="form-group">
                <label for="editElementDesc${semestre}${moduleIndex}${elementIndex}">Description <span class="required">*</span></label>
                <textarea id="editElementDesc${semestre}${moduleIndex}${elementIndex}" rows="2" required>${escapeHtml(element.description)}</textarea>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="editElementCours${semestre}${moduleIndex}${elementIndex}">Heures de cours</label>
                  <input type="number" id="editElementCours${semestre}${moduleIndex}${elementIndex}" min="0" value="${element.heuresCours || 0}">
                </div>
                
                <div class="form-group">
                  <label for="editElementTD${semestre}${moduleIndex}${elementIndex}">Heures de TD</label>
                  <input type="number" id="editElementTD${semestre}${moduleIndex}${elementIndex}" min="0" value="${element.heuresTD || 0}">
                </div>
                
                <div class="form-group">
                  <label for="editElementTP${semestre}${moduleIndex}${elementIndex}">Heures de TP</label>
                  <input type="number" id="editElementTP${semestre}${moduleIndex}${elementIndex}" min="0" value="${element.heuresTP || 0}">
                </div>
              </div>
              
              <div id="editElementFormError${semestre}${moduleIndex}${elementIndex}" class="error-message"></div>
              
              <div class="form-actions">
                <button type="button" class="btn btn-secondary cancel-edit-element-btn" data-semestre="${semestre}" data-module="${moduleIndex}" data-index="${elementIndex}">Annuler</button>
                <button type="button" class="btn btn-primary save-edit-element-btn" data-semestre="${semestre}" data-module="${moduleIndex}" data-index="${elementIndex}">Enregistrer</button>
              </div>
            </div>
          `;
          
          // Ajouter les event listeners pour les boutons du formulaire d'édition
          const cancelEditBtn = elementCard.querySelector('.cancel-edit-element-btn');
          const saveEditBtn = elementCard.querySelector('.save-edit-element-btn');
          
          cancelEditBtn.addEventListener('click', () => {
            refreshWizardStep();
          });
          
          saveEditBtn.addEventListener('click', () => {
            const newNom = document.getElementById(`editElementNom${semestre}${moduleIndex}${elementIndex}`).value.trim();
            const newDesc = document.getElementById(`editElementDesc${semestre}${moduleIndex}${elementIndex}`).value.trim();
            const newCours = parseInt(document.getElementById(`editElementCours${semestre}${moduleIndex}${elementIndex}`).value) || 0;
            const newTD = parseInt(document.getElementById(`editElementTD${semestre}${moduleIndex}${elementIndex}`).value) || 0;
            const newTP = parseInt(document.getElementById(`editElementTP${semestre}${moduleIndex}${elementIndex}`).value) || 0;
            const errorEl = document.getElementById(`editElementFormError${semestre}${moduleIndex}${elementIndex}`);
            
            if (!newNom || !newDesc) {
              errorEl.textContent = 'Le nom et la description sont obligatoires';
              errorEl.style.display = 'block';
              return;
            }
            
            // Mettre à jour les données de l'élément
            wizardData.semestres[semestreIndex].modules[moduleIndex].elements[elementIndex] = {
              ...wizardData.semestres[semestreIndex].modules[moduleIndex].elements[elementIndex],
              nom: newNom,
              description: newDesc,
              heuresCours: newCours,
              heuresTD: newTD,
              heuresTP: newTP
            };
            
            refreshWizardStep();
          });
        }
      });
    });
  }

  // Fonction pour rafraîchir l'étape actuelle du wizard
  function refreshWizardStep() {
    const currentStep = document.querySelector('.wizard-step.active').querySelector('.step-number').textContent - 1;
    
    // Recréer les étapes du wizard avec les données mises à jour
    const wizardSteps = [
      {
        title: 'Informations de base',
        content: generateBasicInfoStep(wizardData),
        validate: validateBasicInfoStep,
        collectData: collectBasicInfoData
      },
      {
        title: 'Semestres et Modules',
        content: generateSemestresStep(wizardData),
        validate: validateSemestresStep,
        collectData: collectSemestresData
      },
      {
        title: 'Éléments des Modules',
        content: generateElementsStep(wizardData),
        validate: validateElementsStep,
        collectData: collectElementsData
      },
      {
        title: 'Récapitulatif',
        content: generateSummaryStep(wizardData),
        validate: () => true
      }
    ];
    
    // Recréer le contenu de l'étape
    const modalContent = document.querySelector('.modal-body');
    modalContent.innerHTML = '';
    
    const updatedWizard = new Wizard({
      steps: wizardSteps,
      initialData: wizardData,
      onStepChange: (stepIndex, data) => {
        wizardData = data;
        modalContent.innerHTML = '';
        const updatedWizard = new Wizard({
          steps: wizardSteps,
          initialData: wizardData,
          onStepChange: (stepIdx, newData) => {
            wizardData = newData;
            refreshWizardStep();
          },
          onComplete: handleWizardComplete(wizardData)
        });
        updatedWizard.currentStep = stepIndex;
        modalContent.appendChild(updatedWizard.render());
        addStepEventListeners(stepIndex);
      },
      onComplete: handleWizardComplete(wizardData)
    });
    
    updatedWizard.currentStep = currentStep;
    modalContent.appendChild(updatedWizard.render());
    addStepEventListeners(currentStep);
  }

  // Fonction pour valider l'étape des éléments
  function validateElementsStep() {
    // Cette étape est optionnelle, donc toujours valide
    return true;
  }

  // Fonction pour collecter les données de l'étape des éléments
  function collectElementsData() {
    // Les données sont déjà collectées lors des interactions, rien à faire ici
    return {};
  }

  // Fonction pour générer l'étape de récapitulation
  function generateSummaryStep(data = {}) {
    if (!data.basicInfo || !data.semestres) {
      return '<p>Veuillez compléter les étapes précédentes.</p>';
    }
    
    let modulesCount = 0;
    let elementsCount = 0;
    
    data.semestres.forEach(semestre => {
      if (semestre.modules) {
        modulesCount += semestre.modules.length;
        
        semestre.modules.forEach(module => {
          if (module.elements) {
            elementsCount += module.elements.length;
          }
        });
      }
    });
    
    // Organiser les semestres par année
    const semestresByAnnee = {};
    data.semestres.forEach(semestre => {
      if (!semestresByAnnee[semestre.annee]) {
        semestresByAnnee[semestre.annee] = [];
      }
      semestresByAnnee[semestre.annee].push(semestre);
    });
    
    let structureHtml = '';
    
    // Générer l'HTML par année et semestre
    Object.keys(semestresByAnnee).sort().forEach(annee => {
      structureHtml += `<h4>Année ${annee}</h4>`;
      
      // Générer les semestres de cette année
      semestresByAnnee[annee].sort((a, b) => a.numero - b.numero).forEach(semestre => {
        let modulesHtml = '';
        
        if (semestre.modules && semestre.modules.length > 0) {
          modulesHtml = `
            <ul class="modules-list">
              ${semestre.modules.map(module => {
                let elementsHtml = '';
                
                if (module.elements && module.elements.length > 0) {
                  elementsHtml = `
                    <ul class="elements-list">
                      ${module.elements.map(element => `
                        <li>
                          <strong>${escapeHtml(element.nom)}</strong>
                          <div class="horaires-inline">
                            <span>Cours: ${element.heuresCours || 0}h</span>
                            <span>TD: ${element.heuresTD || 0}h</span>
                            <span>TP: ${element.heuresTP || 0}h</span>
                          </div>
                        </li>
                      `).join('')}
                    </ul>
                  `;
                }
                
                return `
                  <li>
                    <strong>${escapeHtml(module.nom)}</strong>
                    <div class="horaires-inline">
                      <span>Cours: ${module.heuresCours || 0}h</span>
                      <span>TD: ${module.heuresTD || 0}h</span>
                      <span>TP: ${module.heuresTP || 0}h</span>
                    </div>
                    ${elementsHtml}
                  </li>
                `;
              }).join('')}
            </ul>
          `;
        }
        
        structureHtml += `
          <div class="summary-semestre">
            <h5>Semestre ${semestre.numero}</h5>
            ${modulesHtml}
          </div>
        `;
      });
    });
    
    return `
      <div class="summary-container">
        <div class="summary-section">
          <h3>Informations de base</h3>
          <div class="summary-info">
            <p><strong>Nom:</strong> ${escapeHtml(data.basicInfo.nom)}</p>
            <p><strong>Description:</strong> ${escapeHtml(data.basicInfo.description)}</p>
            <p><strong>Nombre d'années:</strong> ${data.basicInfo.nombreAnnees || 2}</p>
          </div>
        </div>
        
        <div class="summary-section">
          <h3>Structure académique</h3>
          <div class="summary-stats">
            <div class="summary-stat">
              <div class="stat-value">${data.basicInfo.nombreAnnees || 2}</div>
              <div class="stat-label">Années</div>
            </div>
            <div class="summary-stat">
              <div class="stat-value">${data.semestres.length}</div>
              <div class="stat-label">Semestres</div>
            </div>
            <div class="summary-stat">
              <div class="stat-value">${modulesCount}</div>
              <div class="stat-label">Modules</div>
            </div>
            <div class="summary-stat">
              <div class="stat-value">${elementsCount}</div>
              <div class="stat-label">Éléments</div>
            </div>
          </div>
        </div>
        
        <div class="summary-section">
          <h3>Détails de la structure</h3>
          ${structureHtml}
        </div>
      </div>
    `;
  }

  // Fonction pour éditer une filière existante
  async function editFiliere(id) {
    try {
      const filiere = await filiereService.getFiliereById(id);
      if (!filiere) {
        showError('Filière non trouvée');
        return;
      }
      
      // Récupérer les modules de la filière
      const modules = await moduleService.getModulesByFiliere(id);
      
      // Organiser les modules par semestre et récupérer leurs éléments
      const semestres = [];
      const nombreAnnees = filiere.nombreAnnees || 2;
      
      // Créer la structure de base des semestres
      for (let annee = 1; annee <= nombreAnnees; annee++) {
        semestres.push(
          { numero: (annee - 1) * 2 + 1, annee: annee, modules: [] },
          { numero: (annee - 1) * 2 + 2, annee: annee, modules: [] }
        );
      }
      
      // Regrouper les modules par semestre
      for (const module of modules) {
        const semestreIndex = semestres.findIndex(s => s.numero === module.semestre);
        
        if (semestreIndex !== -1) {
          // Récupérer les éléments du module
          const elements = await elementService.getElementsByModule(module.id);
          
          // Ajouter le module avec ses éléments
          semestres[semestreIndex].modules.push({
            ...module,
            elements
          });
        }
      }
      
      // Préparer les données pour le wizard
      const wizardData = {
        basicInfo: {
          id: filiere.id,
          nom: filiere.nom,
          description: filiere.description,
          nombreAnnees: filiere.nombreAnnees || 2
        },
        semestres
      };
      
      showFiliereWizard(wizardData);
      
    } catch (error) {
      showError('Erreur lors de la récupération de la filière');
      console.error('Erreur:', error);
    }
  }

  // Fonction pour confirmer la suppression d'une filière
  function confirmDeleteFiliere(id) {
    const filiere = filieres.find(f => f.id === id);
    if (!filiere) return;
    
    modal.confirm(
      `Êtes-vous sûr de vouloir supprimer la filière "${filiere.nom}" ? Cette action est irréversible.`,
      () => deleteFiliere(id)
    );
  }

  // Fonction pour supprimer une filière
  async function deleteFiliere(id) {
    try {
      await filiereService.deleteFiliere(id);
      showNotification('Filière supprimée avec succès', 'success');
      loadFilieres();
    } catch (error) {
      let errorMessage = 'Erreur lors de la suppression';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, 'error');
      console.error('Erreur:', error);
    }
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

  // Fonction d'échappement HTML pour éviter les injections XSS
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