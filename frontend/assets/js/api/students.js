class StudentService {
  // Récupérer tous les étudiants
  async getAllStudents() {
    try {
      return await httpClient.get('/admin/students');
    } catch (error) {
      console.error('Erreur lors de la récupération des étudiants:', error);
      return [];
    }
  }

  // Récupérer un étudiant par son ID
  async getStudentById(id) {
    try {
      return await httpClient.get(`/admin/students/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'étudiant ${id}:`, error);
      return null;
    }
  }

  // Récupérer les étudiants par filière
  async getStudentsByFiliere(filiereId) {
    try {
      return await httpClient.get(`/admin/filieres/${filiereId}/students`);
    } catch (error) {
      console.error(`Erreur lors de la récupération des étudiants de la filière ${filiereId}:`, error);
      return [];
    }
  }

  // Créer un nouvel étudiant
  async createStudent(studentData, password) {
    try {
      return await httpClient.post(`/admin/students?password=${encodeURIComponent(password)}`, studentData);
    } catch (error) {
      console.error('Erreur lors de la création de l\'étudiant:', error);
      throw error;
    }
  }

  // Mettre à jour un étudiant existant
  async updateStudent(id, studentData) {
    try {
      return await httpClient.put(`/admin/students/${id}`, studentData);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'étudiant ${id}:`, error);
      throw error;
    }
  }

  // Supprimer un étudiant
  async deleteStudent(id) {
    try {
      return await httpClient.delete(`/admin/students/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'étudiant ${id}:`, error);
      throw error;
    }
  }

  // Importer des étudiants depuis un fichier Excel
  async importStudentsFromExcel(filiereId, file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Note: Nous devons utiliser fetch directement car httpClient ne gère pas les FormData
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/admin/filieres/${filiereId}/students/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'importation des étudiants:', error);
      throw error;
    }
  }
}

// Exporter une instance
const studentService = new StudentService();