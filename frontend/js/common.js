// Fonctions utilitaires communes à toutes les pages

// Headers pour les requêtes API
function getHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Fonction d'appel API GET
async function apiGet(url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders()
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expiré ou invalide
                logout();
                return null;
            }
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Erreur lors de l'appel GET à ${url}:`, error);
        throw error;
    }
}

// Fonction d'appel API POST
async function apiPost(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expiré ou invalide
                logout();
                return null;
            }
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Erreur lors de l'appel POST à ${url}:`, error);
        throw error;
    }
}

// Fonction d'appel API PUT
async function apiPut(url, data) {
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expiré ou invalide
                logout();
                return null;
            }
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Erreur lors de l'appel PUT à ${url}:`, error);
        throw error;
    }
}

// Fonction d'appel API DELETE
async function apiDelete(url) {
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expiré ou invalide
                logout();
                return null;
            }
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Erreur lors de l'appel DELETE à ${url}:`, error);
        throw error;
    }
}

// Fonction d'affichage des notifications
function showNotification(message, type = 'success') {
    // Créer un élément de notification
    const notification = document.createElement('div');
    notification.className = type === 'success' 
        ? 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded' 
        : 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded';
    notification.style.zIndex = 1000;
    notification.textContent = message;
    
    // Ajouter la notification au DOM
    document.body.appendChild(notification);
    
    // Supprimer la notification après 3 secondes
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

// Fonction pour formater une date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}