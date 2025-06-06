document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'accès étudiant
  if (!authGuard.checkAccess(['STUDENT'])) {
    return;
  }

  // Références des éléments DOM
  const studentNameElement = document.getElementById('studentName');
  const studentFiliereElement = document.getElementById('studentFiliere');
  const studentYearElement = document.getElementById('studentYear');
  const cardStatusElement = document.getElementById('cardStatus');
  const recentNotificationsElement = document.getElementById('recentNotifications');

  // Charger les données de l'étudiant
  loadStudentData();
  loadCardStatus();
  loadNotifications();

  // Fonction pour charger les données de l'étudiant
  async function loadStudentData() {
    try {
      const user = await httpClient.get('/auth/profile');
      
      if (!user) {
        showError('Erreur lors du chargement des données');
        return;
      }
      
      // Mettre à jour les informations de profil
      studentNameElement.textContent = `${user.prenom} ${user.nom}`;
      
      // Charger les informations de la filière si disponible
      if (user.filiereId) {
        try {
          const filiere = await httpClient.get(`/filieres/${user.filiereId}`);
          studentFiliereElement.textContent = `Filière: ${filiere.nom}`;
        } catch (error) {
          studentFiliereElement.textContent = 'Filière: Non assignée';
          console.error('Erreur lors du chargement de la filière:', error);
        }
      } else {
        studentFiliereElement.textContent = 'Filière: Non assignée';
      }
      
      // Afficher l'année
      studentYearElement.textContent = `Année: ${user.annee === 'PREMIERE_ANNEE' ? '1ère année' : '2ème année'}`;
      
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

  // Fonction pour charger les notifications
  async function loadNotifications() {
    try {
      const notifications = await notificationService.getUserNotifications();
      
      if (!notifications || notifications.length === 0) {
        recentNotificationsElement.innerHTML = `
          <p>Aucune notification pour le moment</p>
        `;
        return;
      }
      
      // Afficher les 5 dernières notifications
      const recentNotifs = notifications.slice(0, 5);
      
      recentNotificationsElement.innerHTML = `
        <ul class="notifications-list">
          ${recentNotifs.map(notif => `
            <li class="notification-item ${notif.vue ? 'read' : 'unread'}">
              <div class="notification-header">
                <span class="notification-type">${formatNotificationType(notif.type)}</span>
                <span class="notification-time">${formatTimeAgo(notif.dateCreation)}</span>
              </div>
              <div class="notification-content">${escapeHtml(notif.message)}</div>
            </li>
          `).join('')}
        </ul>
        ${notifications.length > 5 ? `<a href="notifications.html" class="view-all-link">Voir toutes les notifications (${notifications.length})</a>` : ''}
      `;
      
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      recentNotificationsElement.innerHTML = `
        <p class="error-message">Erreur lors du chargement des notifications</p>
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

  function formatTimeAgo(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'à l\'instant';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours} ${hours === 1 ? 'heure' : 'heures'}`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days} ${days === 1 ? 'jour' : 'jours'}`;
    } else {
      return formatDate(dateString);
    }
  }

  function formatNotificationType(type) {
    if (!type) return 'Information';
    
    switch (type) {
      case 'CARD_REQUEST': return 'Demande de carte';
      case 'CARD_APPROVED': return 'Carte approuvée';
      case 'CARD_REJECTED': return 'Carte rejetée';
      case 'CARD_RECEIVED': return 'Carte reçue';
      case 'SYSTEM': return 'Système';
      default: return type;
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
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