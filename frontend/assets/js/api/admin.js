class AdminService {
  // Récupérer les statistiques du tableau de bord
  async getDashboardStats() {
    try {
      return await httpClient.get('/admin/dashboard');
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return null;
    }
  }

  // Récupérer tous les administrateurs
  async getAllAdmins() {
    try {
      return await httpClient.get('/admin/admins');
    } catch (error) {
      console.error('Erreur lors de la récupération des administrateurs:', error);
      return [];
    }
  }

  // Récupérer un administrateur par son ID
  async getAdminById(id) {
    try {
      return await httpClient.get(`/admin/admins/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'administrateur ${id}:`, error);
      return null;
    }
  }

  // Créer un nouvel administrateur
  async createAdmin(adminData, password) {
    try {
      return await httpClient.post(`/admin/admins?password=${encodeURIComponent(password)}`, adminData);
    } catch (error) {
      console.error('Erreur lors de la création de l\'administrateur:', error);
      throw error;
    }
  }

  // Mettre à jour un administrateur existant
  async updateAdmin(id, adminData) {
    try {
      return await httpClient.put(`/admin/admins/${id}`, adminData);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'administrateur ${id}:`, error);
      throw error;
    }
  }

  // Supprimer un administrateur
  async deleteAdmin(id) {
    try {
      return await httpClient.delete(`/admin/admins/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'administrateur ${id}:`, error);
      throw error;
    }
  }
}

// Exporter une instance
const adminService = new AdminService();