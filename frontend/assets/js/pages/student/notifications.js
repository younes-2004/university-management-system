document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'accès étudiant
  if (!authGuard.checkAccess(['STUDENT'])) {
    return;
  }

  // Références des éléments DOM
  const notificationsContainer = document.getElementById('notificationsContainer');
  const markAllReadBtn = document.getElementById('markAllReadBtn');

  // Charger les notifications
  loadNotifications();

  // Event listener pour marquer toutes les notifications comme lues
  markAllReadBtn.addEventListener('click', markAllAsRead);

  // Fonction pour charger les notifications
  async function loadNotifications() {
    try {
      const notifications = await notificationService.getUserNotifications();
      
      if (!notifications || notifications.length === 0) {
        notificationsContainer.innerHTML = `
          <div class="empty-notifications">
            <i class="fas fa-bell-slash"></i>
            <p>Vous n'avez aucune notification pour le moment.</p>
          </div>
        `;
        
        // Masquer le bouton "Marquer tout comme lu"
        markAllReadBtn.style.display = 'none';
        return;
      }
      
      // Activer/désactiver le bouton selon s'il y a des notifications non lues
      const hasUnread = notifications.some(notif => !notif.vue);
      markAllReadBtn.disabled = !hasUnread;
      
      // Grouper les notifications par date
      const groupedNotifications = groupNotificationsByDate(notifications);
      
      let html = '';
      
      // Générer le HTML pour chaque groupe
      for (const [date, notifs] of Object.entries(groupedNotifications)) {
        html += `
          <div class="notifications-date-group">
            <div class="date-header">${date}</div>
            <ul class="notifications-list">
              ${notifs.map(notif => `
                <li class="notification-item ${notif.vue ? 'read' : 'unread'}" data-id="${notif.id}">
                  <div class="notification-header">
                    <span class="notification-type">${formatNotificationType(notif.type)}</span>
                    <span class="notification-time">${formatTime(notif.dateCreation)}</span>
                  </div>
                  <div class="notification-content">${escapeHtml(notif.message)}</div>
                  ${!notif.vue ? `
                    <button class="mark-read-btn" data-id="${notif.id}">
                      <i class="fas fa-check"></i> Marquer comme lu
                    </button>
                  ` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }
      
      notificationsContainer.innerHTML = html;
      
      // Ajouter les event listeners pour les boutons "Marquer comme lu"
      document.querySelectorAll('.mark-read-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          markAsRead(parseInt(btn.getAttribute('data-id')));
        });
      });
      
      // Ajouter les event listeners pour ouvrir une notification
      document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = parseInt(item.getAttribute('data-id'));
          const notif = notifications.find(n => n.id === id);
          
          // Si la notification n'est pas encore lue, la marquer comme lue
          if (notif && !notif.vue) {
            markAsRead(id);
          }
          
          // Afficher le modal avec les détails de la notification
          showNotificationDetails(notif);
        });
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      notificationsContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          Erreur lors du chargement des notifications
          <button id="retryBtn" class="btn btn-secondary mt-3">
            <i class="fas fa-sync"></i> Réessayer
          </button>
        </div>
      `;
      
      // Ajouter l'event listener pour le bouton de réessai
      document.getElementById('retryBtn').addEventListener('click', loadNotifications);
    }
  }

  // Fonction pour grouper les notifications par date
  function groupNotificationsByDate(notifications) {
    const groups = {};
    
    notifications.forEach(notif => {
      const date = new Date(notif.dateCreation);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateKey;
      
      if (isSameDay(date, today)) {
        dateKey = 'Aujourd\'hui';
      } else if (isSameDay(date, yesterday)) {
        dateKey = 'Hier';
      } else {
        dateKey = formatDate(notif.dateCreation);
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(notif);
    });
    
    return groups;
  }

  // Fonction pour vérifier si deux dates sont le même jour
  function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  // Fonction pour marquer une notification comme lue
  async function markAsRead(notificationId) {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Mettre à jour l'interface
      const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
      if (notificationItem) {
        notificationItem.classList.add('read');
        notificationItem.classList.remove('unread');
        
        // Supprimer le bouton "Marquer comme lu"
        const markReadBtn = notificationItem.querySelector('.mark-read-btn');
        if (markReadBtn) {
          markReadBtn.remove();
        }
      }
      
      // Mettre à jour le badge
      notificationService.updateNotificationBadge();
      
      // Vérifier s'il reste des notifications non lues
      const hasUnread = document.querySelector('.notification-item.unread');
      markAllReadBtn.disabled = !hasUnread;
      
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
      showError('Erreur lors du marquage de la notification comme lue');
    }
  }

  // Fonction pour marquer toutes les notifications comme lues
  async function markAllAsRead() {
    try {
      // Récupérer les IDs de toutes les notifications non lues
      const unreadIds = Array.from(document.querySelectorAll('.notification-item.unread'))
        .map(item => parseInt(item.getAttribute('data-id')));
      
      if (unreadIds.length === 0) {
        return;
      }
      
      // Désactiver le bouton pendant le traitement
      markAllReadBtn.disabled = true;
      markAllReadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
      
      // Marquer chaque notification comme lue
      for (const id of unreadIds) {
        await notificationService.markAsRead(id);
      }
      
      // Mettre à jour l'interface
      document.querySelectorAll('.notification-item.unread').forEach(item => {
        item.classList.add('read');
        item.classList.remove('unread');
        
        // Supprimer le bouton "Marquer comme lu"
        const markReadBtn = item.querySelector('.mark-read-btn');
        if (markReadBtn) {
          markReadBtn.remove();
        }
      });
      
      // Mettre à jour le badge
      notificationService.updateNotificationBadge();
      
      // Désactiver le bouton "Marquer tout comme lu"
      markAllReadBtn.disabled = true;
      markAllReadBtn.innerHTML = '<i class="fas fa-check-double"></i> Marquer tout comme lu';
      
      showNotification('Toutes les notifications ont été marquées comme lues', 'success');
      
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
      showError('Erreur lors du marquage des notifications comme lues');
      
      // Réactiver le bouton
      markAllReadBtn.disabled = false;
      markAllReadBtn.innerHTML = '<i class="fas fa-check-double"></i> Marquer tout comme lu';
    }
  }

  // Fonction pour afficher les détails d'une notification
  function showNotificationDetails(notification) {
    if (!notification) return;
    
    const content = `
      <div class="notification-details">
        <div class="notification-details-header">
          <span class="notification-type">${formatNotificationType(notification.type)}</span>
          <span class="notification-time">${formatDate(notification.dateCreation)} à ${formatTime(notification.dateCreation)}</span>
        </div>
        <div class="notification-details-content">
          ${escapeHtml(notification.message)}
        </div>
        ${notification.type === 'CARD_APPROVED' ? `
          <div class="notification-actions mt-3">
            <a href="profile.html" class="btn btn-primary">
              <i class="fas fa-id-card"></i> Voir ma carte
            </a>
          </div>
        ` : ''}
      </div>
    `;
    
    // Afficher le modal
    modal.open(
      'Notification',
      content,
      '<button type="button" class="btn btn-secondary" id="closeModalBtn">Fermer</button>'
    );
    
    // Ajouter l'event listener pour le bouton de fermeture
    document.getElementById('closeModalBtn').addEventListener('click', () => modal.close());
  }

  // Fonctions utilitaires
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  }

  function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
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