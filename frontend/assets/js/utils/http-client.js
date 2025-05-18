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
      console.log(`GET ${this.baseURL}${endpoint}`);
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      console.log(`GET ${endpoint} - Status: ${response.status}`);
      
      if (!response.ok) {
        // Gestion des erreurs 401 (token expiré)
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/index.html';
          return null;
        }
        
        // Essayer de récupérer le message d'erreur du serveur
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Erreur HTTP: ${response.status}`;
        } catch (e) {
          errorMessage = `Erreur HTTP: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log(`GET ${endpoint} - Success:`, data);
      return data;
    } catch (error) {
      console.error(`GET ${endpoint} - Error:`, error);
      throw error;
    }
  }

  // Méthode POST
  async post(endpoint, data) {
    try {
      console.log(`POST ${this.baseURL}${endpoint}`);
      console.log('POST data:', data);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      console.log(`POST ${endpoint} - Status: ${response.status}`);
      
      if (!response.ok) {
        // Gestion des erreurs 401 (token expiré)
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/index.html';
          return null;
        }
        
        // Essayer de récupérer le message d'erreur du serveur
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Erreur HTTP: ${response.status}`;
        } catch (e) {
          errorMessage = `Erreur HTTP: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      console.log(`POST ${endpoint} - Success:`, responseData);
      return responseData;
    } catch (error) {
      console.error(`POST ${endpoint} - Error:`, error);
      throw error;
    }
  }

  // Méthode PUT
  async put(endpoint, data) {
    try {
      console.log(`PUT ${this.baseURL}${endpoint}`);
      console.log('PUT data:', data);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      console.log(`PUT ${endpoint} - Status: ${response.status}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/index.html';
          return null;
        }
        
        // Essayer de récupérer le message d'erreur du serveur
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Erreur HTTP: ${response.status}`;
        } catch (e) {
          errorMessage = `Erreur HTTP: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      console.log(`PUT ${endpoint} - Success:`, responseData);
      return responseData;
    } catch (error) {
      console.error(`PUT ${endpoint} - Error:`, error);
      throw error;
    }
  }

  // Méthode DELETE
  async delete(endpoint) {
    try {
      console.log(`DELETE ${this.baseURL}${endpoint}`);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      console.log(`DELETE ${endpoint} - Status: ${response.status}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/index.html';
          return null;
        }
        
        // Essayer de récupérer le message d'erreur du serveur
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Erreur HTTP: ${response.status}`;
        } catch (e) {
          errorMessage = `Erreur HTTP: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      console.log(`DELETE ${endpoint} - Success:`, responseData);
      return responseData;
    } catch (error) {
      console.error(`DELETE ${endpoint} - Error:`, error);
      throw error;
    }
  }
}

// Exporter une instance avec l'URL de base de l'API
const httpClient = new HttpClient('http://localhost:8080/api');