// Logique spécifique à l'interface administrateur
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si l'utilisateur est authentifié
    const user = checkAuth();
    if (!user) return;
    
    // Vérifier si l'utilisateur est bien un administrateur
    if (user.role !== 'ADMIN') {
        logout();
        return;
    }
    
    // Afficher les informations de l'utilisateur
    document.getElementById('user-info').textContent = `${user.prenom} ${user.nom}`;
    
    // Charger les statistiques du dashboard
    loadDashboardStats();
    
    // Charger les demandes récentes de cartes
    loadRecentCardRequests();
    
    // Charger la liste des filières
    loadFilieres();
});

// Charger les statistiques du dashboard
async function loadDashboardStats() {
    try {
        const data = await apiGet('http://localhost:8080/api/admin/dashboard');
        
        // Statistiques étudiants
        document.getElementById('student-stats').innerHTML = `
            <div class="flex justify-between">
                <span class="text-gray-600">Total étudiants:</span>
                <span class="font-semibold">${data.totalStudents}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Étudiants actifs:</span>
                <span class="font-semibold">${data.activeStudents}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Étudiants suspendus:</span>
                <span class="font-semibold">${data.suspendedStudents}</span>
            </div>
        `;
        
        // Statistiques professeurs
        document.getElementById('professor-stats').innerHTML = `
            <div class="flex justify-between">
                <span class="text-gray-600">Total professeurs:</span>
                <span class="font-semibold">${data.totalProfessors}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Total administrateurs:</span>
                <span class="font-semibold">${data.totalAdmins}</span>
            </div>
        `;
        
        // Statistiques filières et modules
        document.getElementById('filiere-stats').innerHTML = `
            <div class="flex justify-between">
                <span class="text-gray-600">Total filières:</span>
                <span class="font-semibold">${data.totalFilieres}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Total modules:</span>
                <span class="font-semibold">${data.totalModules}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Total éléments:</span>
                <span class="font-semibold">${data.totalElements}</span>
            </div>
        `;
        
        // Statistiques cartes étudiantes
        document.getElementById('card-stats').innerHTML = `
            <div class="flex justify-between">
                <span class="text-gray-600">Demandes en attente:</span>
                <span class="font-semibold text-yellow-600">${data.pendingCardRequests}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Demandes approuvées:</span>
                <span class="font-semibold text-green-600">${data.approvedCardRequests}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Demandes rejetées:</span>
                <span class="font-semibold text-red-600">${data.rejectedCardRequests}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Cartes récupérées:</span>
                <span class="font-semibold">${data.receivedCardRequests}</span>
            </div>
        `;
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        // Afficher un message d'erreur dans chaque section
        document.getElementById('student-stats').innerHTML = `<p class="text-red-600">Erreur de chargement</p>`;
        document.getElementById('professor-stats').innerHTML = `<p class="text-red-600">Erreur de chargement</p>`;
        document.getElementById('filiere-stats').innerHTML = `<p class="text-red-600">Erreur de chargement</p>`;
        document.getElementById('card-stats').innerHTML = `<p class="text-red-600">Erreur de chargement</p>`;
    }
}

// Charger les demandes récentes de cartes
async function loadRecentCardRequests() {
    try {
        const data = await apiGet('http://localhost:8080/api/admin/card-requests');
        const requestsDiv = document.getElementById('recent-requests');
        
        if (data && data.length > 0) {
            // Afficher seulement les 5 premières demandes
            const recentRequests = data.slice(0, 5);
            
            requestsDiv.innerHTML = `
                <div class="divide-y">
                    ${recentRequests.map(request => `
                        <div class="py-3">
                            <div class="flex flex-wrap justify-between">
                                <div class="mb-1">
                                    <span class="font-semibold">${request.studentName}</span>
                                    <span class="text-gray-500 text-sm ml-2">${formatDate(request.requestDate)}</span>
                                </div>
                                <div>
                                    ${getStatusBadge(request.status)}
                                </div>
                            </div>
                            <div class="text-sm text-gray-600">
                                ${request.status === 'PENDING' ? 
                                    `<div class="flex space-x-2 mt-1">
                                        <button onclick="approveCardRequest(${request.id})" class="text-green-600 hover:text-green-800">
                                            Approuver
                                        </button>
                                        <button onclick="rejectCardRequest(${request.id})" class="text-red-600 hover:text-red-800">
                                            Rejeter
                                        </button>
                                    </div>` 
                                    : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            requestsDiv.innerHTML = `<p class="text-gray-500">Aucune demande de carte en attente.</p>`;
        }
    } catch (error) {
        console.error('Erreur lors du chargement des demandes de cartes:', error);
        document.getElementById('recent-requests').innerHTML = `
            <p class="text-red-600">Erreur lors du chargement des demandes de cartes</p>
        `;
    }
}

// Charger la liste des filières
async function loadFilieres() {
    try {
        const data = await apiGet('http://localhost:8080/api/filieres');
        const filieresDiv = document.getElementById('filieres-list');
        
        if (data && data.length > 0) {
            filieresDiv.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${data.map(filiere => `
                        <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h3 class="font-semibold text-blue-700">${filiere.nom}</h3>
                            <p class="text-gray-600 text-sm mt-1">${filiere.description.substring(0, 80)}${filiere.description.length > 80 ? '...' : ''}</p>
                            <div class="mt-2 text-sm flex justify-between">
                                <span>
                                    <span class="text-gray-700 font-medium">${filiere.nombreEtudiants}</span> étudiants
                                </span>
                                <span>
                                    <span class="text-gray-700 font-medium">${filiere.nombreModules}</span> modules
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            filieresDiv.innerHTML = `<p class="text-gray-500">Aucune filière n'est disponible.</p>`;
        }
    } catch (error) {
        console.error('Erreur lors du chargement des filières:', error);
        document.getElementById('filieres-list').innerHTML = `
            <p class="text-red-600">Erreur lors du chargement des filières</p>
        `;
    }
}

// Obtenir le badge de statut pour une demande de carte