class ModuleService {
  // Récupérer tous les modules
  async getAllModules() {
    try {
      return await httpClient.get('/modules');
    } catch (error) {
      console.error('Erreur lors de la récupération des modules:', error);
      return [];
    }
  }

  // Récupérer un module par son ID
  async getModuleById(id) {
    try {
      return await httpClient.get(`/modules/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la récupération du module ${id}:`, error);
      return null;
    }
  }

  // Récupérer les modules par filière
  async getModulesByFiliere(filiereId) {
    try {
      return await httpClient.get(`/filieres/${filiereId}/modules`);
    } catch (error) {
      console.error(`Erreur lors de la récupération des modules de la filière ${filiereId}:`, error);
      return [];
    }
  }

  // Récupérer les modules par semestre dans une filière
  async getModulesByFiliereAndSemestre(filiereId, semestre) {
    try {
      return await httpClient.get(`/filieres/${filiereId}/semestres/${semestre}/modules`);
    } catch (error) {
      console.error(`Erreur lors de la récupération des modules de la filière ${filiereId} semestre ${semestre}:`, error);
      return [];
    }
  }

  // Récupérer les modules d'un professeur
  async getModulesByProfessor(professorId) {
    try {
      return await httpClient.get(`/professor/modules`);
    } catch (error) {
      console.error(`Erreur lors de la récupération des modules du professeur:`, error);
      return [];
    }
  }

  // Créer un nouveau module
  async createModule(moduleData) {
    try {
      return await httpClient.post('/admin/modules', moduleData);
    } catch (error) {
      console.error('Erreur lors de la création du module:', error);
      throw error;
    }
  }

  // Mettre à jour un module existant
  async updateModule(id, moduleData) {
    try {
      return await httpClient.put(`/admin/modules/${id}`, moduleData);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du module ${id}:`, error);
      throw error;
    }
  }

  // Supprimer un module
  async deleteModule(id) {
    try {
      return await httpClient.delete(`/admin/modules/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression du module ${id}:`, error);
      throw error;
    }
  }
}

// Exporter une instance
const moduleService = new ModuleService();