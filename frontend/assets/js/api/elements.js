class ElementService {
  // Récupérer tous les éléments
  async getAllElements() {
    try {
      return await httpClient.get('/elements');
    } catch (error) {
      console.error('Erreur lors de la récupération des éléments:', error);
      return [];
    }
  }

  // Récupérer un élément par son ID
  async getElementById(id) {
    try {
      return await httpClient.get(`/elements/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'élément ${id}:`, error);
      return null;
    }
  }

  // Récupérer les éléments par module
  async getElementsByModule(moduleId) {
    try {
      return await httpClient.get(`/modules/${moduleId}/elements`);
    } catch (error) {
      console.error(`Erreur lors de la récupération des éléments du module ${moduleId}:`, error);
      return [];
    }
  }

  // Créer un nouvel élément
  async createElement(elementData) {
    try {
      return await httpClient.post('/admin/elements', elementData);
    } catch (error) {
      console.error('Erreur lors de la création de l\'élément:', error);
      throw error;
    }
  }

  // Mettre à jour un élément existant
  async updateElement(id, elementData) {
    try {
      return await httpClient.put(`/admin/elements/${id}`, elementData);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'élément ${id}:`, error);
      throw error;
    }
  }

  // Supprimer un élément
  async deleteElement(id) {
    try {
      return await httpClient.delete(`/admin/elements/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'élément ${id}:`, error);
      throw error;
    }
  }
}

// Exporter une instance
const elementService = new ElementService();