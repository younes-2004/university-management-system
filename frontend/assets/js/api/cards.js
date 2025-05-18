class CardService {
  // Récupérer toutes les demandes de carte en attente
  async getPendingCardRequests() {
    try {
      return await httpClient.get('/admin/card-requests');
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes de carte:', error);
      return [];
    }
  }
  
  // Approuver une demande de carte
  async approveCardRequest(requestId) {
    try {
      return await httpClient.put(`/admin/card-requests/${requestId}/approve`);
    } catch (error) {
      console.error(`Erreur lors de l'approbation de la demande ${requestId}:`, error);
      throw error;
    }
  }
  
  // Rejeter une demande de carte
  async rejectCardRequest(requestId) {
    try {
      return await httpClient.put(`/admin/card-requests/${requestId}/reject`);
    } catch (error) {
      console.error(`Erreur lors du rejet de la demande ${requestId}:`, error);
      throw error;
    }
  }
  
  // Pour les étudiants: récupérer ses demandes
  async getMyCardRequests() {
    try {
      return await httpClient.get('/student/card-requests');
    } catch (error) {
      console.error('Erreur lors de la récupération de vos demandes de carte:', error);
      return [];
    }
  }
  
  // Pour les étudiants: créer une nouvelle demande
  async createCardRequest() {
    try {
      return await httpClient.post('/student/card-requests');
    } catch (error) {
      console.error('Erreur lors de la création de la demande de carte:', error);
      throw error;
    }
  }
  
  // Pour les étudiants: confirmer la réception de la carte
  async confirmCardReception(requestId) {
    try {
      return await httpClient.put(`/student/card-requests/${requestId}/confirm-reception`);
    } catch (error) {
      console.error(`Erreur lors de la confirmation de réception de la carte ${requestId}:`, error);
      throw error;
    }
  }

  // Récupérer le statut de la carte d'un étudiant spécifique
  async getStudentCardStatus(studentId) {
    try {
      return await httpClient.get(`/admin/students/${studentId}/card-status`);
    } catch (error) {
      console.error(`Erreur lors de la récupération du statut de carte de l'étudiant ${studentId}:`, error);
      return null;
    }
  }

  // Récupérer le statut des cartes pour une liste d'étudiants
  async getBulkCardStatus(studentIds) {
    try {
      return await httpClient.post('/admin/card-requests/bulk-status', { studentIds });
    } catch (error) {
      console.error('Erreur lors de la récupération des statuts de carte en lot:', error);
      return [];
    }
  }
}

// Exporter une instance
const cardService = new CardService();