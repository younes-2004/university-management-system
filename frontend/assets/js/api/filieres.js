class FiliereService {
  // Récupérer toutes les filières
  async getAllFilieres() {
    try {
      return await httpClient.get('/filieres');
    } catch (error) {
      console.error('Erreur lors de la récupération des filières:', error);
      return [];
    }
  }

  // Récupérer une filière par son ID
  async getFiliereById(id) {
    try {
      return await httpClient.get(`/filieres/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la récupération de la filière ${id}:`, error);
      return null;
    }
  }

  // Créer une nouvelle filière
  async createFiliere(filiereData) {
    try {
      return await httpClient.post('/admin/filieres', filiereData);
    } catch (error) {
      console.error('Erreur lors de la création de la filière:', error);
      throw error;
    }
  }

  // Mettre à jour une filière existante
  async updateFiliere(id, filiereData) {
    try {
      return await httpClient.put(`/admin/filieres/${id}`, filiereData);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la filière ${id}:`, error);
      throw error;
    }
  }

  // Supprimer une filière
  async deleteFiliere(id) {
    try {
      return await httpClient.delete(`/admin/filieres/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de la filière ${id}:`, error);
      throw error;
    }
  }
}

// Exporter une instance
const filiereService = new FiliereService();