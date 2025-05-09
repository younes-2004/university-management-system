// Logique spécifique à l'interface professeur
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si l'utilisateur est authentifié
    const user = checkAuth();
    if (!user) return;
    
    // Vérifier si l'utilisateur est bien un professeur
    if (user.role !== 'PROFESSOR') {
        logout();
        return;
    }
    
    // Afficher les informations de l'utilisateur
    document.getElementById('user-info').textContent = `${user.prenom} ${user.nom}`;
    
    // Charger les filières enseignées
    loadProfessorFilieres();
    
    // Charger les modules enseignés
    loadProfessorModules();
});

// Charger les filières enseignées par le professeur
async function loadProfessorFilieres() {
    try {
        const data = await apiGet('http://localhost:8080/api/professor/filieres');
        const filieresDiv = document.getElementById('professor-filieres');
        
        if (data && data.length > 0) {
            filieresDiv.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${data.map(filiere => `
                        <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h3 class="font-semibold text-lg text-blue-700">${filiere.nom}</h3>
                            <p class="text-gray-600 text-sm">${filiere.description}</p>
                            <div class="mt-2 text-sm">
                                <span class="text-gray-700 font-medium">${filiere.nombreEtudiants}</span> étudiants
                                <span class="mx-2">•</span>
                                <span class="text-gray-700 font-medium">${filiere.nombreModules}</span> modules
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            filieresDiv.innerHTML = `<p class="text-gray-500">Vous n'enseignez dans aucune filière actuellement.</p>`;
        }
    } catch (error) {
        console.error('Erreur lors du chargement des filières:', error);
        document.getElementById('professor-filieres').innerHTML = `
            <p class="text-red-600">Erreur lors du chargement des filières</p>
        `;
    }
}

// Charger les modules enseignés par le professeur
async function loadProfessorModules() {
    try {
        const data = await apiGet('http://localhost:8080/api/professor/modules');
        const modulesDiv = document.getElementById('professor-modules');
        
        if (data && data.length > 0) {
            modulesDiv.innerHTML = `
                <div class="divide-y">
                    ${data.map(module => `
                        <div class="py-4">
                            <h3 class="font-semibold text-lg text-blue-700">${module.nom}</h3>
                            <p class="text-gray-600 mb-2">${module.description}</p>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                <div class="text-gray-700">
                                    <span class="font-medium">Filière:</span> ${module.filiereNom}
                                </div>
                                <div class="text-gray-700">
                                    <span class="font-medium">Semestre:</span> ${module.semestre}
                                </div>
                                <div class="text-gray-700">
                                    <span class="font-medium">Heures Cours:</span> ${module.heuresCours}h
                                </div>
                                <div class="text-gray-700">
                                    <span class="font-medium">Heures TD:</span> ${module.heuresTD}h
                                </div>
                                <div class="text-gray-700">
                                    <span class="font-medium">Heures TP:</span> ${module.heuresTP}h
                                </div>
                            </div>
                            <div class="mt-2">
                                <a href="modules.html?id=${module.id}" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                    Voir les détails du module
                                </a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            modulesDiv.innerHTML = `<p class="text-gray-500">Vous n'enseignez aucun module actuellement.</p>`;
        }
    } catch (error) {
        console.error('Erreur lors du chargement des modules:', error);
        document.getElementById('professor-modules').innerHTML = `
            <p class="text-red-600">Erreur lors du chargement des modules</p>
        `;
    }
}