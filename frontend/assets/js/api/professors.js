class ProfessorService {
  // Récupérer tous les professeurs
  async getAllProfessors() {
    try {
      return await httpClient.get('/admin/professors');
    } catch (error) {
      console.error('Erreur lors de la récupération des professeurs:', error);
      return [];
    }
  }

  // Récupérer un professeur par son ID
  async getProfessorById(id) {
    try {
      return await httpClient.get(`/admin/professors/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la récupération du professeur ${id}:`, error);
      return null;
    }
  }

  // Créer un nouveau professeur
  async createProfessor(professorData, password) {
    try {
      return await httpClient.post(`/admin/professors?password=${encodeURIComponent(password)}`, professorData);
    } catch (error) {
      console.error('Erreur lors de la création du professeur:', error);
      throw error;
    }
  }

  // Mettre à jour un professeur existant
  async updateProfessor(id, professorData) {
    try {
      return await httpClient.put(`/admin/professors/${id}`, professorData);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du professeur ${id}:`, error);
      throw error;
    }
  }

  // Supprimer un professeur
  async deleteProfessor(id) {
    try {
      return await httpClient.delete(`/admin/professors/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression du professeur ${id}:`, error);
      throw error;
    }
  }

  // Attribuer un module à un professeur
  async assignModule(professorId, moduleId) {
    try {
      return await httpClient.put(`/admin/professors/${professorId}/modules/${moduleId}`);
    } catch (error) {
      console.error(`Erreur lors de l'attribution du module ${moduleId} au professeur ${professorId}:`, error);
      throw error;
    }
  }
}

// Exporter une instance
const professorService = new ProfessorService();