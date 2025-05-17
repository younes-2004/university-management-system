class HttpClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  // Méthode pour obtenir le token d'authentification
  getToken() {
    return localStorage.getItem('token');
  }

  // Méthode pour définir les entêtes d'autorisation
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Méthode GET
  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        // Gestion des erreurs 401 (token expiré)
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/index.html';
          return null;
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur GET:', error);
      throw error;
    }
  }

  // Méthode POST// Vérifiez dans votre httpClient.js que les erreurs sont bien capturées et remontées
async post(endpoint, data) {
  try {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      // Amélioration: essayer de récupérer le message d'erreur du serveur
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `Erreur HTTP: ${response.status}`;
      } catch (e) {
        errorMessage = `Erreur HTTP: ${response.status}`;
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur POST:', error);
    throw error;
  }
}

  // Méthode PUT
  async put(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/index.html';
          return null;
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur PUT:', error);
      throw error;
    }
  }

  // Méthode DELETE
  async delete(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/index.html';
          return null;
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur DELETE:', error);
      throw error;
    }
  }
}

// Exporter une instance avec l'URL de base de l'API
const httpClient = new HttpClient('http://localhost:8080/api');