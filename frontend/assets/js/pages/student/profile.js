document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'accès étudiant
  if (!authGuard.checkAccess(['STUDENT'])) {
    return;
  }

  // Références des éléments DOM
  const fullNameElement = document.getElementById('fullName');
  const apogeeNumberElement = document.getElementById('apogeeNumber');
  const emailAddressElement = document.getElementById('emailAddress');
  const birthDateElement = document.getElementById('birthDate');
  const filiereNameElement = document.getElementById('filiereName');
  const studyYearElement = document.getElementById('studyYear');
  const studentStatusElement = document.getElementById('studentStatus');
  const cardStatusElement = document.getElementById('cardStatus');
  const changePasswordBtn = document.getElementById('changePasswordBtn');

  // Charger les données de l'étudiant
  loadStudentProfile();
  loadCardStatus();

  // Event listener pour le bouton de changement de mot de passe
  changePasswordBtn.addEventListener('click', showChangePasswordModal);

  // Fonction pour charger le profil de l'étudiant
  async function loadStudentProfile() {
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
      apogeeNumberElement.textContent = user.nApogee || 'Non assigné';
      emailAddressElement.textContent = user.email;
      birthDateElement.textContent = formatDate(user.dateNaissance);
      
      // Mettre à jour les informations académiques
      studyYearElement.textContent = user.annee === 'PREMIERE_ANNEE' ? '1ère année' : '2ème année';
      studentStatusElement.textContent = formatStatus(user.statut);
      studentStatusElement.className = `detail-value status-${user.statut ? user.statut.toLowerCase() : 'unknown'}`;
      
      // Charger les informations de la filière si disponible
      if (user.filiereId) {
        try {
          const filiere = await httpClient.get(`/filieres/${user.filiereId}`);
          filiereNameElement.textContent = filiere.nom;
        } catch (error) {
          filiereNameElement.textContent = 'Non assignée';
          console.error('Erreur lors du chargement de la filière:', error);
        }
      } else {
        filiereNameElement.textContent = 'Non assignée';
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des données de l\'étudiant:', error);
      showError('Erreur lors du chargement des données');
    }
  }

  // Fonction pour charger le statut de la carte étudiant
  async function loadCardStatus() {
    try {
      const cardRequests = await cardService.getMyCardRequests();
      
      if (!cardRequests || cardRequests.length === 0) {
        // Aucune demande de carte
        cardStatusElement.innerHTML = `
          <div class="card-status-container">
            <div class="card-status incomplete">
              <i class="fas fa-id-card"></i>
              <span>Vous n'avez pas encore de carte étudiant</span>
            </div>
            <button id="requestCardBtn" class="btn btn-primary">
              <i class="fas fa-plus"></i> Demander une carte
            </button>
          </div>
        `;
        
        // Ajouter l'event listener pour le bouton de demande
        document.getElementById('requestCardBtn').addEventListener('click', requestCard);
        return;
      }
      
      // Récupérer la demande la plus récente
      const latestRequest = cardRequests[0];
      
      switch (latestRequest.status) {
        case 'PENDING':
          cardStatusElement.innerHTML = `
            <div class="card-status-container">
              <div class="card-status pending">
                <i class="fas fa-clock"></i>
                <span>Votre demande de carte est en cours de traitement</span>
              </div>
              <p class="request-date">Demande effectuée le ${formatDate(latestRequest.requestDate)}</p>
            </div>
          `;
          break;
          
        case 'APPROVED':
          cardStatusElement.innerHTML = `
            <div class="card-status-container">
              <div class="card-status approved">
                <i class="fas fa-check-circle"></i>
                <span>Votre demande a été approuvée!</span>
              </div>
              <p class="request-info">Approuvée le ${formatDate(latestRequest.processedDate)}</p>
              <button id="confirmCardBtn" class="btn btn-success">
                <i class="fas fa-check"></i> Confirmer la réception de la carte
              </button>
            </div>
          `;
          
          // Ajouter l'event listener pour le bouton de confirmation
          document.getElementById('confirmCardBtn').addEventListener('click', () => {
            confirmCardReception(latestRequest.id);
          });
          break;
          
        case 'REJECTED':
          cardStatusElement.innerHTML = `
            <div class="card-status-container">
              <div class="card-status rejected">
                <i class="fas fa-times-circle"></i>
                <span>Votre demande a été rejetée</span>
              </div>
              <p class="request-info">Rejetée le ${formatDate(latestRequest.processedDate)}</p>
              <button id="requestCardBtn" class="btn btn-primary">
                <i class="fas fa-plus"></i> Faire une nouvelle demande
              </button>
            </div>
          `;
          
          // Ajouter l'event listener pour le bouton de nouvelle demande
          document.getElementById('requestCardBtn').addEventListener('click', requestCard);
          break;
          
        case 'RECEIVED':
          cardStatusElement.innerHTML = `
            <div class="card-status-container">
              <div class="card-status complete">
                <i class="fas fa-id-card"></i>
                <span>Vous avez bien reçu votre carte étudiant</span>
              </div>
              <p class="request-info">Reçue le ${formatDate(latestRequest.receivedDate)}</p>
            </div>
          `;
          break;
          
        default:
          cardStatusElement.innerHTML = `
            <div class="card-status-container">
              <div class="card-status unknown">
                <i class="fas fa-question-circle"></i>
                <span>Statut de demande inconnu</span>
              </div>
              <button id="requestCardBtn" class="btn btn-primary">
                <i class="fas fa-plus"></i> Demander une carte
              </button>
            </div>
          `;
          
          // Ajouter l'event listener pour le bouton de demande
          document.getElementById('requestCardBtn').addEventListener('click', requestCard);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement du statut de la carte:', error);
      cardStatusElement.innerHTML = `
        <p class="error-message">Erreur lors du chargement du statut de la carte</p>
      `;
    }
  }

  // Fonction pour demander une nouvelle carte
  async function requestCard() {
    try {
      // Désactiver le bouton pendant le traitement
      const button = document.getElementById('requestCardBtn');
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
      
      await cardService.createCardRequest();
      
      showNotification('Demande de carte envoyée avec succès', 'success');
      
      // Recharger le statut de la carte
      loadCardStatus();
    } catch (error) {
      console.error('Erreur lors de la demande de carte:', error);
      showError('Erreur lors de la demande de carte');
      
      // Réactiver le bouton
      const button = document.getElementById('requestCardBtn');
      if (button) {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-plus"></i> Demander une carte';
      }
    }
  }

  // Fonction pour confirmer la réception de la carte
  async function confirmCardReception(requestId) {
    try {
      // Désactiver le bouton pendant le traitement
      const button = document.getElementById('confirmCardBtn');
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
      
      await cardService.confirmCardReception(requestId);
      
      showNotification('Réception de la carte confirmée', 'success');
      
      // Recharger le statut de la carte
      loadCardStatus();
    } catch (error) {
      console.error('Erreur lors de la confirmation de réception:', error);
      showError('Erreur lors de la confirmation de réception');
      
      // Réactiver le bouton
      const button = document.getElementById('confirmCardBtn');
      if (button) {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-check"></i> Confirmer la réception de la carte';
      }
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

// Dans profile.js - Remplacer la fonction changePassword
async function changePassword() {
  const oldPassword = document.getElementById('oldPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const passwordError = document.getElementById('passwordError');
  
  console.log('=== CHANGEMENT MOT DE PASSE FRONTEND ===');
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

  function formatStatus(status) {
    if (!status) return 'Inconnu';
    
    switch (status) {
      case 'ACTIF': return 'Actif';
      case 'SUSPENDU': return 'Suspendu';
      case 'ARRETE': return 'Arrêté';
      default: return status;
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
});