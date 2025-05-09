// Logique spécifique à l'interface étudiant
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si l'utilisateur est authentifié
    const user = checkAuth();
    if (!user) return;
    
    // Vérifier si l'utilisateur est bien un étudiant
    if (user.role !== 'STUDENT') {
        logout();
        return;
    }
    
    // Afficher les informations de l'utilisateur
    document.getElementById('user-info').textContent = `${user.prenom} ${user.nom}`;
    
    // Charger les informations de l'étudiant
    loadStudentInfo();
    
    // Charger le statut de la carte
    loadCardStatus();
});

// Charger les informations de l'étudiant
async function loadStudentInfo() {
    try {
        const data = await apiGet('http://localhost:8080/api/auth/profile');
        
        if (data) {
            const studentInfoDiv = document.getElementById('student-info');
            studentInfoDiv.innerHTML = `
                <div class="mb-2">
                    <span class="font-semibold">Nom complet:</span> 
                    ${data.prenom} ${data.nom}
                </div>
                <div class="mb-2">
                    <span class="font-semibold">Numéro Apogée:</span> 
                    ${data.nApogee || 'Non disponible'}
                </div>
                <div class="mb-2">
                    <span class="font-semibold">Email:</span> 
                    ${data.email}
                </div>
                <div class="mb-2">
                    <span class="font-semibold">Filière:</span> 
                    <span id="filiere-name">Chargement...</span>
                </div>
                <div class="mb-2">
                    <span class="font-semibold">Année:</span> 
                    ${data.annee === 'PREMIERE_ANNEE' ? '1ère année' : '2ème année'}
                </div>
                <div class="mb-2">
                    <span class="font-semibold">Date de naissance:</span> 
                    ${formatDate(data.dateNaissance)}
                </div>
                <div class="mb-2">
                    <span class="font-semibold">Statut:</span> 
                    ${getStatusLabel(data.statut)}
                </div>
            `;
            
            // Charger le nom de la filière si l'ID est disponible
            if (data.filiereId) {
                loadFiliereName(data.filiereId);
            } else {
                document.getElementById('filiere-name').textContent = 'Non affectée';
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des informations de l\'étudiant:', error);
        showNotification('Erreur lors du chargement des informations', 'error');
    }
}

// Charger le nom de la filière
async function loadFiliereName(filiereId) {
    try {
        const data = await apiGet(`http://localhost:8080/api/filieres/${filiereId}`);
        if (data) {
            document.getElementById('filiere-name').textContent = data.nom;
        }
    } catch (error) {
        document.getElementById('filiere-name').textContent = 'Non disponible';
    }
}

// Charger le statut de la carte étudiant
async function loadCardStatus() {
    try {
        const requests = await apiGet('http://localhost:8080/api/student/card-requests');
        const cardStatusDiv = document.getElementById('card-status');
        const cardActionDiv = document.getElementById('card-action');
        
        if (!requests || requests.length === 0) {
            // Aucune demande de carte
            cardStatusDiv.innerHTML = `
                <p class="text-yellow-600">Vous n'avez pas encore demandé votre carte étudiant.</p>
            `;
            cardActionDiv.innerHTML = `
                <button onclick="requestCard()" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded">
                    Demander la carte
                </button>
            `;
        } else {
            // Dernière demande (la plus récente)
            const latestRequest = requests[0];
            
            // Afficher le statut
            switch (latestRequest.status) {
                case 'PENDING':
                    cardStatusDiv.innerHTML = `
                        <p class="text-yellow-600">Votre demande de carte est en cours de traitement.</p>
                        <p class="text-sm text-gray-600">Demande soumise le ${formatDate(latestRequest.requestDate)}</p>
                    `;
                    cardActionDiv.innerHTML = '';
                    break;
                    
                case 'APPROVED':
                    cardStatusDiv.innerHTML = `
                        <p class="text-green-600">Votre demande de carte a été approuvée.</p>
                        <p class="text-sm text-gray-600">Approuvée le ${formatDate(latestRequest.processedDate)}</p>
                        <p class="text-sm text-gray-600">Veuillez récupérer votre carte au bureau des cartes étudiantes.</p>
                    `;
                    cardActionDiv.innerHTML = `
                        <button onclick="confirmCardReception(${latestRequest.id})" class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded">
                            Confirmer réception de la carte
                        </button>
                    `;
                    break;
                    
                case 'REJECTED':
                    cardStatusDiv.innerHTML = `
                        <p class="text-red-600">Votre demande de carte a été rejetée.</p>
                        <p class="text-sm text-gray-600">Rejetée le ${formatDate(latestRequest.processedDate)}</p>
                    `;
                    cardActionDiv.innerHTML = `
                        <button onclick="requestCard()" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded">
                            Faire une nouvelle demande
                        </button>
                    `;
                    break;
                    
                case 'RECEIVED':
                    cardStatusDiv.innerHTML = `
                        <p class="text-green-600">Vous avez récupéré votre carte étudiant.</p>
                        <p class="text-sm text-gray-600">Carte récupérée le ${formatDate(latestRequest.receivedDate)}</p>
                    `;
                    cardActionDiv.innerHTML = '';
                    break;
                    
                default:
                    cardStatusDiv.innerHTML = `<p>Statut inconnu</p>`;
                    cardActionDiv.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement du statut de la carte:', error);
        document.getElementById('card-status').innerHTML = `
            <p class="text-red-600">Erreur lors du chargement du statut de la carte</p>
        `;
    }
}

// Demander une carte
async function requestCard() {
    try {
        const result = await apiPost('http://localhost:8080/api/student/card-requests', {});
        
        if (result) {
            showNotification('Demande de carte envoyée avec succès');
            // Recharger le statut
            loadCardStatus();
        }
    } catch (error) {
        console.error('Erreur lors de la demande de carte:', error);
        showNotification('Erreur lors de la demande de carte', 'error');
    }
}

// Confirmer la réception de la carte
async function confirmCardReception(requestId) {
    try {
        const result = await apiPut(`http://localhost:8080/api/student/card-requests/${requestId}/confirm-reception`, {});
        
        if (result) {
            showNotification('Réception de la carte confirmée avec succès');
            // Recharger le statut
            loadCardStatus();
        }
    } catch (error) {
        console.error('Erreur lors de la confirmation de réception:', error);
        showNotification('Erreur lors de la confirmation de réception', 'error');
    }
}

// Obtenir le libellé du statut étudiant
function getStatusLabel(status) {
    switch (status) {
        case 'ACTIF':
            return '<span class="px-2 py-1 bg-green-100 text-green-800 rounded">Actif</span>';
        case 'SUSPENDU':
            return '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Suspendu</span>';
        case 'ARRETE':
            return '<span class="px-2 py-1 bg-red-100 text-red-800 rounded">Arrêté</span>';
        default:
            return '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded">Non défini</span>';
    }
}