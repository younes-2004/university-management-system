class NotificationService {
  // Récupérer les notifications de l'utilisateur
  async getUserNotifications() {
    try {
      return await httpClient.get('/notifications');
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }
  }
  
  // Marquer une notification comme lue
  async markAsRead(notificationId) {
    try {
      return await httpClient.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      return null;
    }
  }
  
  // Récupérer le nombre de notifications non lues
  async getUnreadCount() {
    try {
      return await httpClient.get('/notifications/unread-count');
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de notifications:', error);
      return 0;
    }
  }
  
  // Mise à jour du badge de notifications
  async updateNotificationBadge() {
    const badgeElement = document.getElementById('notificationsBadge');
    if (badgeElement) {
      try {
        const count = await this.getUnreadCount();
        badgeElement.textContent = count;
        
        // Masquer le badge si aucune notification
        badgeElement.style.display = count > 0 ? 'flex' : 'none';
      } catch (error) {
        console.error('Erreur lors de la mise à jour du badge:', error);
        badgeElement.style.display = 'none';
      }
    }
  }
}

// Exporter une instance
const notificationService = new NotificationService();

// Mettre à jour le badge de notifications au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  notificationService.updateNotificationBadge();
});