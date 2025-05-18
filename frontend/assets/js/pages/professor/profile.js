document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'accès professeur
  if (!authGuard.checkAccess(['PROFESSOR'])) {
    return;
  }

  // Références des éléments DOM
  const fullNameElement = document.getElementById('fullName');
  const emailAddressElement = document.getElementById('emailAddress');
  const birthDateElement = document.getElementById('birthDate');
  const modulesCountElement = document.getElementById('modulesCount');
  const filieresCountElement = document.getElementById('filieresCount');
  const teachingInfoElement = document.getElementById('teachingInfo');
  const changePasswordBtn = document.getElementById('changePasswordBtn');

  // Charger les données du professeur
  loadProfessorProfile();
  loadTeachingInfo();

  // Event listener pour le bouton de changement de mot de passe
  changePasswordBtn.addEventListener('click', showChangePasswordModal);

  // Fonction pour charger le profil du professeur
  async function loadProfessorProfile() {
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
      
      // Mettre à jour les informations personnelles
      fullNameElement.textContent = `${user.prenom} ${user.nom}`;
      emailAddressElement.textContent = user.email;
      birthDateElement.textContent = formatDate(user.dateNaissance);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données du professeur:', error);
      showError('Erreur lors du chargement des données');
    }
  }

  // Fonction pour charger les informations d'enseignement
  async function loadTeachingInfo() {
    try {
      // Récupérer les filières enseignées par le professeur
      const filieres = await httpClient.get('/professor/filieres');
      
      // Récupérer les modules enseignés par le professeur
      const modules = await httpClient.get('/professor/modules');
      
      // Mettre à jour les compteurs
      modulesCountElement.textContent = modules ? modules.length : 0;
      filieresCountElement.textContent = filieres ? filieres.length : 0;
      
      // Afficher les détails d'enseignement
      if (!filieres || filieres.length === 0) {
        teachingInfoElement.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-chalkboard-teacher"></i>
            <p>Vous n'enseignez dans aucune filière pour le moment.</p>
          </div>
        `;
        return;
      }
      
      // Organiser les modules par filière
      let teachingHtml = '';
      
      filieres.forEach(filiere => {
        const filiereModules = modules.filter(module => module.filiereId === filiere.id);
        
        teachingHtml += `
          <div class="teaching-section">
            <h4>${escapeHtml(filiere.nom)}</h4>
            <p class="text-muted">${escapeHtml(filiere.description)}</p>
            
            ${filiereModules.length > 0 ? `
              <div class="modules-grid">
                ${filiereModules.map(module => `
                  <div class="module-card">
                    <div class="module-header">
                      <h5>${escapeHtml(module.nom)}</h5>
                      <span class="semestre-badge">Semestre ${module.semestre}</span>
                    </div>
                    <div class="module-body">
                      <p>${escapeHtml(module.description)}</p>
                      <div class="module-hours">
                        <span><i class="fas fa-chalkboard-teacher"></i> CM: ${module.heuresCours}h</span>
                        <span><i class="fas fa-users"></i> TD: ${module.heuresTD}h</span>
                        <span><i class="fas fa-laptop-code"></i> TP: ${module.heuresTP}h</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <p class="text-muted">Aucun module assigné dans cette filière.</p>
            `}
          </div>
        `;
      });
      
      teachingInfoElement.innerHTML = teachingHtml;
      
    } catch (error) {
      console.error('Erreur lors du chargement des informations d\'enseignement:', error);
      teachingInfoElement.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Erreur lors du chargement des informations d'enseignement</p>
        </div>
      `;
    }
  }

  // Fonction pour afficher le modal de changement de mot de passe
  function showChangePasswordModal() {
    const content = `
      <form id="changePasswordForm">
        <div class="form-group">
          <label for="oldPassword">Ancien mot de passe <span class="required">*</span></label>
          <input type="password" id="oldPassword" required>
        </div>
        
        <div class="form-group">
          <label for="newPassword">Nouveau mot de passe <span class="required">*</span></label>
          <input type="password" id="newPassword" required>
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirmer le mot de passe <span class="required">*</span></label>
          <input type="password" id="confirmPassword" required>
        </div>
        
        <div id="passwordError" class="error-message"></div>
      </form>
    `;
    
    const footer = `
      <button type="button" class="btn btn-secondary" id="cancelPasswordBtn">Annuler</button>
      <button type="button" class="btn btn-primary" id="savePasswordBtn">Enregistrer</button>
    `;
    
    modal.open('Changer le mot de passe', content, footer);
    
    // Ajouter les event listeners
    document.getElementById('cancelPasswordBtn').addEventListener('click', () => modal.close());
    document.getElementById('savePasswordBtn').addEventListener('click', changePassword);
  }

  // Fonction pour changer le mot de passe
  async function changePassword() {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const passwordError = document.getElementById('passwordError');
    
    console.log('=== CHANGEMENT MOT DE PASSE PROFESSEUR ===');
    console.log('Ancien mot de passe fourni:', oldPassword ? '***' : 'vide');
    console.log('Nouveau mot de passe fourni:', newPassword ? '***' : 'vide');
    console.log('Confirmation fournie:', confirmPassword ? '***' : 'vide');
    
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      passwordError.textContent = 'Tous les champs sont obligatoires';
      passwordError.style.display = 'block';
      return;
    }
    
    if (newPassword !== confirmPassword) {
      passwordError.textContent = 'Les mots de passe ne correspondent pas';
      passwordError.style.display = 'block';
      return;
    }
    
    try {
      // Préparer l'objet à envoyer
      const changePasswordData = {
        oldPassword: oldPassword,
        newPassword: newPassword
      };
      
      console.log('Envoi de la requête de changement de mot de passe...');
      const response = await httpClient.post('/auth/change-password', changePasswordData);
      
      console.log('Changement de mot de passe réussi:', response);
      modal.close();
      showNotification('Mot de passe changé avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      
      let errorMessage = 'Erreur lors du changement de mot de passe';
      
      // Essayer de récupérer un message d'erreur plus spécifique
      if (error.message) {
        if (error.message.includes('Ancien mot de passe incorrect') || 
            error.message.includes('incorrect')) {
          errorMessage = 'L\'ancien mot de passe est incorrect';
        } else {
          errorMessage = error.message;
        }
      }
      
      passwordError.textContent = errorMessage;
      passwordError.style.display = 'block';
    }
  }

  // Fonctions utilitaires
  function formatDate(dateString) {
    if (!dateString) return 'Non renseigné';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

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