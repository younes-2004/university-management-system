document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'accès admin
  if (!authGuard.checkAccess(['ADMIN'])) {
    return;
  }

  // Références des éléments DOM
  const professorsTableBody = document.getElementById('professorsTableBody');
  const addProfessorBtn = document.getElementById('addProfessorBtn');

  // Variables d'état
  let professors = [];
  let modules = [];
  let filieres = [];
  let editingProfessorId = null;

  // Charger les professeurs au chargement de la page
  loadProfessors();
  loadModules();
  loadFilieres();

  // Event listener pour le bouton d'ajout
  addProfessorBtn.addEventListener('click', () => showProfessorForm());

  // Fonction pour charger les professeurs
  async function loadProfessors() {
    try {
      showLoading();
      professors = await professorService.getAllProfessors();
      renderProfessors();
    } catch (error) {
      showError('Erreur lors du chargement des professeurs');
      console.error('Erreur:', error);
    }
  }

  // Fonction pour charger les modules
  async function loadModules() {
    try {
      modules = await moduleService.getAllModules();
    } catch (error) {
      console.error('Erreur lors du chargement des modules:', error);
    }
  }

  // Fonction pour charger les filières
  async function loadFilieres() {
    try {
      filieres = await filiereService.getAllFilieres();
    } catch (error) {
      console.error('Erreur lors du chargement des filières:', error);
    }
  }

  // Fonction pour afficher l'état de chargement
  function showLoading() {
    professorsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">
          <div class="loading-spinner"></div>
          Chargement des professeurs...
        </td>
      </tr>
    `;
  }

  // Fonction pour formater une date (YYYY-MM-DD → DD/MM/YYYY)
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  // Fonction pour convertir une date (DD/MM/YYYY → YYYY-MM-DD)
  function convertDateToISO(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }

  // Fonction pour afficher les professeurs dans le tableau
  function renderProfessors() {
    if (!professors || professors.length === 0) {
      professorsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">Aucun professeur trouvé.</td>
        </tr>
      `;
      return;
    }

    professorsTableBody.innerHTML = professors.map(professor => `
      <tr>
        <td>${professor.id}</td>
        <td>${escapeHtml(professor.nom)}</td>
        <td>${escapeHtml(professor.prenom)}</td>
        <td>${escapeHtml(professor.email)}</td>
        <td>${formatDate(professor.dateNaissance)}</td>
        <td>
          <button class="btn-sm btn-info view-modules" data-id="${professor.id}">
            <i class="fas fa-book"></i> Voir modules
          </button>
          <button class="btn-sm btn-primary assign-module" data-id="${professor.id}">
            <i class="fas fa-plus"></i> Assigner
          </button>
        </td>
        <td class="actions">
          <button class="btn-icon edit-professor" data-id="${professor.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon delete-professor" data-id="${professor.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // Ajouter les event listeners aux boutons d'action
    document.querySelectorAll('.edit-professor').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        editProfessor(id);
      });
    });

    document.querySelectorAll('.delete-professor').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        confirmDeleteProfessor(id);
      });
    });

    document.querySelectorAll('.view-modules').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        viewProfessorModules(id);
      });
    });

    document.querySelectorAll('.assign-module').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        showAssignModuleForm(id);
      });
    });
  }

  // Fonction pour afficher le formulaire d'ajout/édition de professeur
  function showProfessorForm(professor = null) {
    editingProfessorId = professor ? professor.id : null;
    
    const title = professor ? 'Modifier le professeur' : 'Ajouter un professeur';
    
    // Préparer la date au format YYYY-MM-DD pour l'input date
    let birthDate = '';
    if (professor && professor.dateNaissance) {
      birthDate = new Date(professor.dateNaissance).toISOString().split('T')[0];
    }
    
    const content = `
      <form id="professorForm">
        <div class="form-group">
          <label for="nom">Nom <span class="required">*</span></label>
          <input type="text" id="nom" name="nom" required value="${professor ? escapeHtml(professor.nom) : ''}">
        </div>
        
        <div class="form-group">
          <label for="prenom">Prénom <span class="required">*</span></label>
          <input type="text" id="prenom" name="prenom" required value="${professor ? escapeHtml(professor.prenom) : ''}">
        </div>
        
        <div class="form-group">
          <label for="email">Email <span class="required">*</span></label>
          <input type="email" id="email" name="email" required value="${professor ? escapeHtml(professor.email) : ''}">
        </div>
        
        <div class="form-group">
          <label for="dateNaissance">Date de naissance <span class="required">*</span></label>
          <input type="date" id="dateNaissance" name="dateNaissance" required value="${birthDate}">
        </div>
        
        ${!professor ? `
        <div class="form-group">
          <label for="password">Mot de passe <span class="required">*</span></label>
          <input type="password" id="password" name="password" required>
        </div>
        ` : ''}
        
        <div id="formError" class="error-message"></div>
      </form>
    `;
    
    const footer = `
      <button type="button" class="btn btn-secondary" id="cancelBtn">Annuler</button>
      <button type="button" class="btn btn-primary" id="saveBtn">Enregistrer</button>
    `;
    
    modal.open(title, content, footer);
    
    // Ajouter les event listeners
    document.getElementById('cancelBtn').addEventListener('click', () => modal.close());
    document.getElementById('saveBtn').addEventListener('click', saveProfessor);
  }

  // Fonction pour éditer un professeur
  async function editProfessor(id) {
    try {
      const professor = await professorService.getProfessorById(id);
      if (professor) {
        showProfessorForm(professor);
      } else {
        showError('Professeur non trouvé');
      }
    } catch (error) {
      showError('Erreur lors de la récupération du professeur');
      console.error('Erreur:', error);
    }
  }

  // Fonction pour enregistrer un professeur (création ou mise à jour)
  async function saveProfessor() {
    const nom = document.getElementById('nom').value.trim();
    const prenom = document.getElementById('prenom').value.trim();
    const email = document.getElementById('email').value.trim();
    const dateNaissance = document.getElementById('dateNaissance').value;
    const formError = document.getElementById('formError');
    
    // Validation
    if (!nom || !prenom || !email || !dateNaissance) {
      formError.textContent = 'Tous les champs sont obligatoires';
      formError.style.display = 'block';
      return;
    }
    
    const professorData = {
      nom,
      prenom,
      email,
      dateNaissance,
      role: 'PROFESSOR'
    };
    
    try {
      if (editingProfessorId) {
        // Mise à jour
        await professorService.updateProfessor(editingProfessorId, professorData);
        showNotification('Professeur mis à jour avec succès', 'success');
      } else {
        // Création - récupérer le mot de passe
        const password = document.getElementById('password').value;
        if (!password) {
          formError.textContent = 'Le mot de passe est obligatoire';
          formError.style.display = 'block';
          return;
        }
        
        await professorService.createProfessor(professorData, password);
        showNotification('Professeur créé avec succès', 'success');
      }
      
      // Fermer le modal et recharger les professeurs
      modal.close();
      loadProfessors();
    } catch (error) {
      let errorMessage = 'Une erreur est survenue';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      formError.textContent = errorMessage;
      formError.style.display = 'block';
      console.error('Erreur:', error);
    }
  }

  // Fonction pour confirmer la suppression d'un professeur
  function confirmDeleteProfessor(id) {
    const professor = professors.find(p => p.id === id);
    if (!professor) return;
    
    modal.confirm(
      `Êtes-vous sûr de vouloir supprimer le professeur "${professor.nom} ${professor.prenom}" ? Cette action est irréversible.`,
      () => deleteProfessor(id)
    );
  }

  // Fonction pour supprimer un professeur
  async function deleteProfessor(id) {
    try {
      await professorService.deleteProfessor(id);
      showNotification('Professeur supprimé avec succès', 'success');
      loadProfessors();
    } catch (error) {
      let errorMessage = 'Erreur lors de la suppression';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, 'error');
      console.error('Erreur:', error);
    }
  }

  // Fonction pour voir les modules d'un professeur
  async function viewProfessorModules(id) {
    try {
      const professor = professors.find(p => p.id === id);
      if (!professor) {
        showError('Professeur non trouvé');
        return;
      }
      
      const professorModules = await moduleService.getModulesByProfessor(id);
      
      let modulesList = '';
      if (professorModules.length === 0) {
        modulesList = '<p>Ce professeur n\'enseigne aucun module pour le moment.</p>';
      } else {
        modulesList = `
          <ul class="modules-list">
            ${professorModules.map(module => `
              <li>
                <strong>${escapeHtml(module.nom)}</strong> - ${escapeHtml(module.filiereNom)} (Semestre ${module.semestre})
                <p class="text-muted">${escapeHtml(module.description)}</p>
                <div class="module-hours">
                  <span>CM: ${module.heuresCours}h</span>
                  <span>TD: ${module.heuresTD}h</span>
                  <span>TP: ${module.heuresTP}h</span>
                </div>
              </li>
            `).join('')}
          </ul>
        `;
      }
      
      modal.open(
        `Modules enseignés par ${professor.prenom} ${professor.nom}`,
        modulesList,
        '<button type="button" class="btn btn-secondary" id="closeBtn">Fermer</button>'
      );
      
      document.getElementById('closeBtn').addEventListener('click', () => modal.close());
      
    } catch (error) {
      showError('Erreur lors de la récupération des modules');
      console.error('Erreur:', error);
    }
  }

  // Fonction pour afficher le formulaire d'assignation de module
  async function showAssignModuleForm(professorId) {
    try {
      const professor = professors.find(p => p.id === professorId);
      if (!professor) {
        showError('Professeur non trouvé');
        return;
      }
      
      // Obtenir tous les modules
      const allModules = await moduleService.getAllModules();
      
      // Créer un sélecteur de filière et de module
      const content = `
        <p>Assignez un module à <strong>${professor.prenom} ${professor.nom}</strong>.</p>
        
        <div class="form-group">
          <label for="filiereSelect">Filière</label>
          <select id="filiereSelect" class="form-control">
            <option value="">Sélectionnez une filière</option>
            ${filieres.map(filiere => `
              <option value="${filiere.id}">${escapeHtml(filiere.nom)}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label for="moduleSelect">Module</label>
          <select id="moduleSelect" class="form-control" disabled>
            <option value="">Sélectionnez d'abord une filière</option>
          </select>
        </div>
        
        <div id="formError" class="error-message"></div>
      `;
      
      const footer = `
        <button type="button" class="btn btn-secondary" id="cancelBtn">Annuler</button>
        <button type="button" class="btn btn-primary" id="assignBtn" disabled>Assigner</button>
      `;
      
      modal.open('Assigner un module', content, footer);
      
      const filiereSelect = document.getElementById('filiereSelect');
      const moduleSelect = document.getElementById('moduleSelect');
      const assignBtn = document.getElementById('assignBtn');
      const cancelBtn = document.getElementById('cancelBtn');
      const formError = document.getElementById('formError');
      
      // Event listener pour le changement de filière
      filiereSelect.addEventListener('change', () => {
        const filiereId = filiereSelect.value;
        
        if (!filiereId) {
          moduleSelect.innerHTML = '<option value="">Sélectionnez d\'abord une filière</option>';
          moduleSelect.disabled = true;
          assignBtn.disabled = true;
          return;
        }
        
        // Filtrer les modules par filière
        const filiereModules = allModules.filter(module => module.filiereId == filiereId);
        
        if (filiereModules.length === 0) {
          moduleSelect.innerHTML = '<option value="">Aucun module disponible pour cette filière</option>';
          moduleSelect.disabled = true;
          assignBtn.disabled = true;
          return;
        }
        
        moduleSelect.innerHTML = `
          <option value="">Sélectionnez un module</option>
          ${filiereModules.map(module => `
            <option value="${module.id}">${escapeHtml(module.nom)} (Semestre ${module.semestre})</option>
          `).join('')}
        `;
        
        moduleSelect.disabled = false;
      });
      
      // Event listener pour le changement de module
      moduleSelect.addEventListener('change', () => {
        assignBtn.disabled = !moduleSelect.value;
      });
      
      // Event listeners pour les boutons
      cancelBtn.addEventListener('click', () => modal.close());
      assignBtn.addEventListener('click', async () => {
        const moduleId = moduleSelect.value;
        
        if (!moduleId) {
          formError.textContent = 'Veuillez sélectionner un module';
          formError.style.display = 'block';
          return;
        }
        
        try {
          await professorService.assignModule(professorId, moduleId);
          showNotification('Module assigné avec succès', 'success');
          modal.close();
        } catch (error) {
          formError.textContent = 'Erreur lors de l\'assignation du module';
          formError.style.display = 'block';
          console.error('Erreur:', error);
        }
      });
      
    } catch (error) {
      showError('Erreur lors de la préparation du formulaire');
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
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});