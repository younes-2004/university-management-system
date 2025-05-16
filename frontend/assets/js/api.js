/**
 * Service API pour communiquer avec le backend
 */
const API_URL = 'http://localhost:8080/api';

const API = {
    /**
     * Effectue une requête API
     * @param {string} endpoint - Point de terminaison de l'API
     * @param {string} method - Méthode HTTP (GET, POST, PUT, DELETE)
     * @param {Object} data - Données à envoyer au serveur
     * @param {boolean} auth - Indique si l'authentification est requise
     * @returns {Promise} - Promesse contenant la réponse
     */
    request: async function(endpoint, method = 'GET', data = null, auth = true) {
        const url = `${API_URL}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Ajouter le token JWT si l'authentification est requise
        if (auth) {
            const token = localStorage.getItem('token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        const options = {
            method,
            headers
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            
            // Si la réponse est 401 (non autorisé), rediriger vers la page de connexion
            if (response.status === 401) {
                AUTH.logout();
                return null;
            }
            
            const responseData = await response.json();
            return responseData;
        } catch (error) {
            console.error('Erreur API:', error);
            throw error;
        }
    },
    
    // Points d'API spécifiques
    auth: {
        login: (credentials) => API.request('/auth/login', 'POST', credentials, false),
        validateToken: () => API.request('/auth/validate-token', 'POST'),
        getProfile: () => API.request('/auth/profile')
    },
    
    // API Étudiant
    student: {
        // Obtenir les demandes de carte de l'étudiant connecté
        getCardRequests: () => API.request('/student/card-requests'),
        
        // Créer une nouvelle demande de carte
        createCardRequest: () => API.request('/student/card-requests', 'POST'),
        
        // Confirmer la réception d'une carte
        confirmCardReception: (requestId) => API.request(`/student/card-requests/${requestId}/confirm-reception`, 'PUT')
    },
    
    // API Filières
    filieres: {
        // Obtenir les informations d'une filière spécifique
        getFiliere: (id) => API.request(`/filieres/${id}`)
    },
    
    // API Professeur
    professor: {
        // Obtenir les filières enseignées par le professeur connecté
        getFilieres: () => API.request('/professor/filieres'),
        
        // Obtenir les modules enseignés par le professeur connecté
        getModules: () => API.request('/professor/modules'),
        
        // Obtenir les éléments enseignés par le professeur connecté
        getElements: () => API.request('/professor/elements')
    },
    
    // API Modules
    modules: {
        // Obtenir les modules d'une filière pour un semestre
        getByFiliereAndSemestre: (filiereId, semestre) => 
            API.request(`/filieres/${filiereId}/semestres/${semestre}/modules`),
        
        // Obtenir les éléments d'un module
        getElements: (moduleId) => API.request(`/modules/${moduleId}/elements`)
    },
    
    // API Admin
    admin: {
        // Dashboard
        getDashboardStats: () => API.request('/admin/dashboard'),
        
        // Filières
        getAllFilieres: () => API.request('/filieres'),
        getFiliere: (id) => API.request(`/filieres/${id}`),
        createFiliere: (data) => API.request('/admin/filieres', 'POST', data),
        updateFiliere: (id, data) => API.request(`/admin/filieres/${id}`, 'PUT', data),
        deleteFiliere: (id) => API.request(`/admin/filieres/${id}`, 'DELETE'),
        
        // Professeurs
        getAllProfessors: () => API.request('/admin/professors'),
        getProfessor: (id) => API.request(`/admin/professors/${id}`),
        createProfessor: (data, password) => API.request(`/admin/professors?password=${password}`, 'POST', data),
        updateProfessor: (id, data) => API.request(`/admin/professors/${id}`, 'PUT', data),
        deleteProfessor: (id) => API.request(`/admin/professors/${id}`, 'DELETE'),
        assignModuleToProfessor: (professorId, moduleId) => 
            API.request(`/admin/professors/${professorId}/modules/${moduleId}`, 'PUT'),
        
        // Étudiants
        getAllStudents: () => API.request('/admin/students'),
        getStudent: (id) => API.request(`/admin/students/${id}`),
        getStudentsByFiliere: (filiereId) => API.request(`/admin/filieres/${filiereId}/students`),
        createStudent: (data, password) => API.request(`/admin/students?password=${password}`, 'POST', data),
        updateStudent: (id, data) => API.request(`/admin/students/${id}`, 'PUT', data),
        deleteStudent: (id) => API.request(`/admin/students/${id}`, 'DELETE'),
        importStudents: (filiereId, formData) => {
            const url = `${API_URL}/admin/filieres/${filiereId}/students/import`;
            const token = localStorage.getItem('token');
            
            return fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            }).then(response => {
                if (response.status === 401) {
                    AUTH.logout();
                    return null;
                }
                return response.json();
            });
        },
        
        // Cartes
        getPendingCardRequests: () => API.request('/admin/card-requests'),
        approveCardRequest: (requestId) => API.request(`/admin/card-requests/${requestId}/approve`, 'PUT'),
        rejectCardRequest: (requestId) => API.request(`/admin/card-requests/${requestId}/reject`, 'PUT'),
        
        // Modules
        getAllModules: () => API.request('/modules'),
        getModule: (id) => API.request(`/modules/${id}`),
        getModulesByFiliere: (filiereId) => API.request(`/filieres/${filiereId}/modules`),
        createModule: (data) => API.request('/admin/modules', 'POST', data),
        updateModule: (id, data) => API.request(`/admin/modules/${id}`, 'PUT', data),
        deleteModule: (id) => API.request(`/admin/modules/${id}`, 'DELETE'),
        
        // Éléments de module
        getAllElements: () => API.request('/elements'),
        getElementById: (id) => API.request(`/elements/${id}`),
        getElementsByModule: (moduleId) => API.request(`/modules/${moduleId}/elements`),
        createElement: (data) => API.request('/admin/elements', 'POST', data),
        updateElement: (id, data) => API.request(`/admin/elements/${id}`, 'PUT', data),
        deleteElement: (id) => API.request(`/admin/elements/${id}`, 'DELETE')
    }
};