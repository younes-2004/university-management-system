document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'accès étudiant
  if (!authGuard.checkAccess(['STUDENT'])) {
    return;
  }

  // Références des éléments DOM
  const cardStatusElement = document.getElementById('cardStatus');
  
  // Charger le statut de la carte
  loadCardStatus();

  // Fonction pour charger le statut de la carte étudiant
  async function loadCardStatus() {
    try {
      const cardRequests = await cardService.getMyCardRequests();
      
      if (!cardRequests || cardRequests.length === 0) {
        // Aucune demande de carte
        renderNoCardState();
        return;
      }
      
      // Récupérer la demande la plus récente
      const latestRequest = cardRequests[0];
      
      // Afficher l'état selon le statut
      switch (latestRequest.status) {
        case 'PENDING':
          renderPendingState(latestRequest);
          break;
        case 'APPROVED':
          renderApprovedState(latestRequest);
          break;
        case 'REJECTED':
          renderRejectedState(latestRequest);
          break;
        case 'RECEIVED':
          renderReceivedState(latestRequest);
          break;
        default:
          renderUnknownState();
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement du statut de la carte:', error);
      renderErrorState();
    }
  }
  
  // Fonction pour le rendu de l'état "aucune carte"
  function renderNoCardState() {
    cardStatusElement.innerHTML = `
      <div class="card-status-container">
        <div class="card-status incomplete">
          <i class="fas fa-id-card"></i>
          <span>Vous n'avez pas encore de carte étudiant</span>
        </div>
        <p>La carte étudiant est nécessaire pour accéder aux services universitaires et bénéficier des réductions étudiantes.</p>
        <button id="requestCardBtn" class="btn btn-primary">
          <i class="fas fa-plus"></i> Demander une carte
        </button>
      </div>
    `;
    
    // Ajouter l'event listener pour le bouton de demande
    document.getElementById('requestCardBtn').addEventListener('click', requestCard);
  }
  
  // Fonction pour le rendu de l'état "en attente"
  function renderPendingState(request) {
    cardStatusElement.innerHTML = `
      <div class="card-status-container">
        <div class="card-status pending">
          <i class="fas fa-clock"></i>
          <span>Votre demande de carte est en cours de traitement</span>
        </div>
        <p class="request-date">Demande effectuée le ${formatDate(request.requestDate)}</p>
        <p>L'administration examine votre demande. Vous recevrez une notification lorsqu'elle sera traitée.</p>
      </div>
    `;
  }
  
  // Fonction pour le rendu de l'état "approuvé"
  function renderApprovedState(request) {
    cardStatusElement.innerHTML = `
      <div class="card-status-container">
        <div class="card-status approved">
          <i class="fas fa-check-circle"></i>
          <span>Votre demande a été approuvée!</span>
        </div>
        <p class="request-info">Approuvée le ${formatDate(request.processedDate)}</p>
        <p>Votre carte est prête! Vous pouvez la récupérer auprès de l'administration.</p>
        <button id="confirmCardBtn" class="btn btn-success">
          <i class="fas fa-check"></i> Confirmer la réception de la carte
        </button>
      </div>
    `;
    
    // Ajouter l'event listener pour le bouton de confirmation
    document.getElementById('confirmCardBtn').addEventListener('click', () => {
      confirmCardReception(request.id);
    });
  }
  
  // Fonction pour le rendu de l'état "rejeté"
  function renderRejectedState(request) {
    cardStatusElement.innerHTML = `
      <div class="card-status-container">
        <div class="card-status rejected">
          <i class="fas fa-times-circle"></i>
          <span>Votre demande a été rejetée</span>
        </div>
        <p class="request-info">Rejetée le ${formatDate(request.processedDate)}</p>
        <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'administration ou faire une nouvelle demande.</p>
        <button id="requestCardBtn" class="btn btn-primary">
          <i class="fas fa-plus"></i> Faire une nouvelle demande
        </button>
      </div>
    `;
    
    // Ajouter l'event listener pour le bouton de nouvelle demande
    document.getElementById('requestCardBtn').addEventListener('click', requestCard);
  }
  
  // Fonction pour le rendu de l'état "reçu"
  function renderReceivedState(request) {
    const receivedDate = formatDate(request.receivedDate);
    
    cardStatusElement.innerHTML = `
      <div class="card-status-container">
        <div class="card-status complete">
          <i class="fas fa-id-card"></i>
          <span>Vous avez bien reçu votre carte étudiant</span>
        </div>
        <p class="request-info">Reçue le ${receivedDate}</p>
        <div class="card-preview">
          <div class="student-card">
            <div class="card-header">
              <h3>Carte Étudiant</h3>
              <div class="university-logo">
                <i class="fas fa-university"></i>
              </div>
            </div>
            <div class="card-body">
              <div class="student-photo">
                <i class="fas fa-user"></i>
              </div>
              <div class="student-info">
                <h4 id="cardStudentName">Chargement...</h4>
                <p id="cardApogeeNumber">N° Apogée: Chargement...</p>
                <p id="cardFiliere">Filière: Chargement...</p>
                <p>Année universitaire: ${getCurrentAcademicYear()}</p>
              </div>
            </div>
            <div class="card-footer">
              <p>Valable jusqu'au 31/08/${getCurrentAcademicYear().split("-")[1]}</p>
            </div>
          </div>
        </div>
        <p class="card-tip">Conservez votre carte avec vous pour accéder aux services universitaires.</p>
      </div>
    `;
    
    // Charger les données de l'étudiant pour la carte
    loadStudentDataForCard();
  }
  
  // Fonction pour le rendu d'un état inconnu
  function renderUnknownState() {
    cardStatusElement.innerHTML = `
      <div class="card-status-container">
        <div class="card-status unknown">
          <i class="fas fa-question-circle"></i>
          <span>Statut de demande inconnu</span>
        </div>
        <p>Le statut de votre demande est inconnu. Veuillez contacter l'administration ou faire une nouvelle demande.</p>
        <button id="requestCardBtn" class="btn btn-primary">
          <i class="fas fa-plus"></i> Demander une carte
        </button>
      </div>
    `;
    
    // Ajouter l'event listener pour le bouton de demande
    document.getElementById('requestCardBtn').addEventListener('click', requestCard);
  }
  
  // Fonction pour le rendu d'un état d'erreur
  function renderErrorState() {
    cardStatusElement.innerHTML = `
      <div class="card-status-container">
        <p class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          Erreur lors du chargement du statut de la carte
        </p>
        <button id="retryBtn" class="btn btn-secondary mt-3">
          <i class="fas fa-sync"></i> Réessayer
        </button>
      </div>
    `;
    
    // Ajouter l'event listener pour le bouton de réessai
    document.getElementById('retryBtn').addEventListener('click', loadCardStatus);
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
  
  // Fonction pour charger les données de l'étudiant pour la carte
  async function loadStudentDataForCard() {
    try {
      const user = await httpClient.get('/auth/profile');
      
      if (!user) {
        return;
      }
      
      // Mettre à jour les informations de la carte
      const cardStudentName = document.getElementById('cardStudentName');
      const cardApogeeNumber = document.getElementById('cardApogeeNumber');
      const cardFiliere = document.getElementById('cardFiliere');
      
      if (cardStudentName) {
        cardStudentName.textContent = `${user.prenom} ${user.nom}`;
      }
      
      if (cardApogeeNumber) {
        cardApogeeNumber.textContent = `N° Apogée: ${user.nApogee || 'Non assigné'}`;
      }
      
      // Charger les informations de la filière si disponible
      if (cardFiliere && user.filiereId) {
        try {
          const filiere = await httpClient.get(`/filieres/${user.filiereId}`);
          cardFiliere.textContent = `Filière: ${filiere.nom}`;
        } catch (error) {
          cardFiliere.textContent = 'Filière: Non assignée';
        }
      } else if (cardFiliere) {
        cardFiliere.textContent = 'Filière: Non assignée';
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des données pour la carte:', error);
    }
  }
  
  // Fonctions utilitaires
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function getCurrentAcademicYear() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-11
    
    // Si on est entre janvier et août, on est dans l'année académique précédente
    if (month < 8) { // avant septembre
      return `${year-1}-${year}`;
    }
    
    // Sinon, on est dans la nouvelle année académique
    return `${year}-${year+1}`;
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