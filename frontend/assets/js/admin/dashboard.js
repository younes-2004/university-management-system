 
/**
 * Gestion du tableau de bord administrateur
 */
const AdminDashboard = {
    // État de l'application
    state: {
        stats: null,
        activeView: 'overview', // 'overview', 'filieres', 'professors', 'students', 'cards'
        // Sous-vues
        subView: null, // 'list', 'create', 'edit', 'detail'
        // IDs pour l'édition/détail
        selectedId: null,
        // Données
        filieres: [],
        professors: [],
        students: [],
        cardRequests: []
    },
    
    /**
     * Initialise le tableau de bord admin
     */
    init: async function() {
        // Charger les statistiques initiales
        await this.loadDashboardStats();
        
        // Afficher l'interface
        this.render();
        
        // Configurer les écouteurs d'événements
        this.setupEventListeners();
        
        // Charger la vue initiale
        this.loadViewData(this.state.activeView);
    },
    
    /**
     * Charge les statistiques du tableau de bord
     */
    loadDashboardStats: async function() {
        try {
            const stats = await API.admin.getDashboardStats();
            this.state.stats = stats;
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
            this.showError('Impossible de charger les statistiques du tableau de bord.');
        }
    },
    
    /**
     * Charge les données de la vue active
     * @param {string} view - Vue à charger
     */
    loadViewData: async function(view) {
        try {
            switch (view) {
                case 'overview':
                    // Les statistiques sont déjà chargées
                    break;
                case 'filieres':
                    const filieres = await API.admin.getAllFilieres();
                    this.state.filieres = filieres || [];
                    break;
                case 'professors':
                    const professors = await API.admin.getAllProfessors();
                    this.state.professors = professors || [];
                    break;
                case 'students':
                    const students = await API.admin.getAllStudents();
                    this.state.students = students || [];
                    break;
                case 'cards':
                    const cardRequests = await API.admin.getPendingCardRequests();
                    this.state.cardRequests = cardRequests || [];
                    break;
            }
            
            // Mettre à jour l'affichage
            this.renderContent();
        } catch (error) {
            console.error(`Erreur lors du chargement des données pour la vue ${view}:`, error);
            this.showError(`Impossible de charger les données pour la vue ${view}.`);
        }
    },
    
    /**
     * Affiche l'interface utilisateur complète
     */
    render: function() {
        // Récupérer le conteneur admin
        const adminContainer = document.getElementById('admin-container');
        if (!adminContainer) return;
        
        // Obtenir les données nécessaires pour le rendu
        const { activeView } = this.state;
        const user = AUTH.getCurrentUser();
        
        // Construire l'interface utilisateur
        adminContainer.innerHTML = `
            <div class="admin-header">
                <h1>Système de Gestion Universitaire</h1>
                <button id="logout-btn" class="btn btn-secondary">Déconnexion</button>
            </div>
            <div class="admin-main">
                <div class="admin-sidebar">
                    <div class="user-info">
                        <div class="user-name">${user.prenom} ${user.nom}</div>
                        <div class="user-role">Administrateur</div>
                    </div>
                    
                    <div class="nav-section">
                        <div class="nav-section-title">Tableau de bord</div>
                        <div class="nav-item ${activeView === 'overview' ? 'active' : ''}" data-view="overview">Vue d'ensemble</div>
                    </div>
                    
                    <div class="nav-section">
                        <div class="nav-section-title">Gestion académique</div>
                        <div class="nav-item ${activeView === 'filieres' ? 'active' : ''}" data-view="filieres">Filières</div>
                        <div class="nav-item ${activeView === 'professors' ? 'active' : ''}" data-view="professors">Professeurs</div>
                        <div class="nav-item ${activeView === 'students' ? 'active' : ''}" data-view="students">Étudiants</div>
                    </div>
                    
                    <div class="nav-section">
                        <div class="nav-section-title">Gestion des cartes</div>
                        <div class="nav-item ${activeView === 'cards' ? 'active' : ''}" data-view="cards">Demandes de cartes</div>
                    </div>
                </div>
                <div class="admin-content" id="admin-content">
                    <!-- Le contenu sera injecté ici -->
                    <div class="loading">Chargement...</div>
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche le contenu de la vue active
     */
    renderContent: function() {
        const contentContainer = document.getElementById('admin-content');
        if (!contentContainer) return;
        
        const { activeView, subView } = this.state;
        
        // Déterminer quel contenu afficher
        let content = '';
        
        switch (activeView) {
            case 'overview':
                content = this.renderOverviewView();
                break;
            case 'filieres':
                content = this.renderFilieresView();
                break;
            case 'professors':
                content = this.renderProfessorsView();
                break;
            case 'students':
                content = this.renderStudentsView();
                break;
            case 'cards':
                content = this.renderCardsView();
                break;
            default:
                content = this.renderOverviewView();
        }
        
        contentContainer.innerHTML = content;
        
        // Configurer les événements spécifiques à la vue
        this.setupViewEventListeners(activeView);
    },
    
    /**
     * Affiche la vue d'ensemble (dashboard)
     */
    renderOverviewView: function() {
        const { stats } = this.state;
        
        if (!stats) {
            return `<div class="loading">Chargement des statistiques...</div>`;
        }
        
        return `
            <h2>Tableau de bord administrateur</h2>
            
            <div class="stat-cards">
                <div class="stat-card">
                    <div class="stat-card-title">Étudiants</div>
                    <div class="stat-card-value">${stats.totalStudents}</div>
                    <div class="stat-card-description">
                        ${stats.activeStudents} actifs, ${stats.suspendedStudents} suspendus
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-card-title">Professeurs</div>
                    <div class="stat-card-value">${stats.totalProfessors}</div>
                    <div class="stat-card-description">
                        Pour ${stats.totalModules} modules
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-card-title">Filières</div>
                    <div class="stat-card-value">${stats.totalFilieres}</div>
                    <div class="stat-card-description">
                        ${stats.totalModules} modules, ${stats.totalElements} éléments
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-card-title">Demandes de cartes</div>
                    <div class="stat-card-value">${stats.pendingCardRequests}</div>
                    <div class="stat-card-description">
                        ${stats.approvedCardRequests} approuvées, ${stats.receivedCardRequests} reçues
                    </div>
                </div>
            </div>
            
            <div class="admin-card">
                <div class="admin-card-header">
                    <h2>Actions rapides</h2>
                </div>
                <div class="admin-card-body">
                    <div class="action-buttons">
                        <button class="btn btn-primary" data-action="create-filiere">Ajouter une filière</button>
                        <button class="btn btn-primary" data-action="create-professor">Ajouter un professeur</button>
                        <button class="btn btn-primary" data-action="create-student">Ajouter un étudiant</button>
                        <button class="btn btn-primary" data-action="view-card-requests">Voir les demandes de cartes</button>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche la vue des filières
     */
    renderFilieresView: function() {
        const { filieres, subView, selectedId } = this.state;
        
        // Déterminer quelle sous-vue afficher
        if (subView === 'create') {
            return this.renderFiliereForm();
        } else if (subView === 'edit' && selectedId) {
            return this.renderFiliereForm(selectedId);
        }
        
        // Vue par défaut : liste des filières
        return `
            <div class="view-header">
                <h2>Gestion des filières</h2>
                <button class="btn btn-primary" data-action="create-filiere">
                    <i class="fas fa-plus"></i> Ajouter une filière
                </button>
            </div>
            
            <div class="admin-card">
                <div class="admin-card-header">
                    <h3>Liste des filières</h3>
                </div>
                <div class="admin-card-body">
                    ${filieres.length === 0 ? 
                        `<p>Aucune filière n'est disponible.</p>` : 
                        this.renderFilieresTable(filieres)
                    }
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche le tableau des filières
     * @param {Array} filieres - Liste des filières
     */
    renderFilieresTable: function(filieres) {
        return `
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Description</th>
                            <th>Étudiants</th>
                            <th>Modules</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filieres.map(filiere => `
                            <tr>
                                <td>${filiere.nom}</td>
                                <td>${this.truncateText(filiere.description, 50)}</td>
                                <td>${filiere.nombreEtudiants}</td>
                                <td>${filiere.nombreModules}</td>
                                <td class="actions">
                                    <button class="btn btn-sm btn-info" data-action="view-filiere" data-id="${filiere.id}">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-secondary" data-action="edit-filiere" data-id="${filiere.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" data-action="delete-filiere" data-id="${filiere.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
    
    /**
     * Affiche le formulaire de création/édition d'une filière
     * @param {number} id - ID de la filière à éditer (null pour création)
     */
    renderFiliereForm: function(id = null) {
        // Pour l'édition, trouver la filière correspondante
        let filiere = null;
        let title = 'Créer une filière';
        let submitAction = 'create-filiere-submit';
        
        if (id) {
            filiere = this.state.filieres.find(f => f.id === id);
            title = 'Modifier la filière';
            submitAction = 'update-filiere-submit';
        }
        
        return `
            <div class="view-header">
                <h2>${title}</h2>
                <button class="btn btn-secondary" data-action="back-to-filieres">
                    <i class="fas fa-arrow-left"></i> Retour
                </button>
            </div>
            
            <div class="admin-card form-card">
                <div class="admin-card-body">
                    <form id="filiere-form" data-action="${submitAction}" ${id ? `data-id="${id}"` : ''}>
                        <div class="form-group">
                            <label for="nom">Nom de la filière</label>
                            <input type="text" id="nom" name="nom" class="form-control" 
                                value="${filiere ? filiere.nom : ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="description">Description</label>
                            <textarea id="description" name="description" class="form-control" 
                                rows="4" required>${filiere ? filiere.description : ''}</textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" data-action="back-to-filieres">
                                Annuler
                            </button>
                            <button type="submit" class="btn btn-primary">
                                ${id ? 'Mettre à jour' : 'Créer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche la vue des professeurs
     */
    renderProfessorsView: function() {
        const { professors, subView, selectedId } = this.state;
        
        // Déterminer quelle sous-vue afficher
        if (subView === 'create') {
            return this.renderProfessorForm();
        } else if (subView === 'edit' && selectedId) {
            return this.renderProfessorForm(selectedId);
        }
        
        // Vue par défaut : liste des professeurs
        return `
            <div class="view-header">
                <h2>Gestion des professeurs</h2>
                <button class="btn btn-primary" data-action="create-professor">
                    <i class="fas fa-plus"></i> Ajouter un professeur
                </button>
            </div>
            
            <div class="admin-card">
                <div class="admin-card-header">
                    <h3>Liste des professeurs</h3>
                </div>
                <div class="admin-card-body">
                    ${professors.length === 0 ? 
                        `<p>Aucun professeur n'est disponible.</p>` : 
                        this.renderProfessorsTable(professors)
                    }
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche le tableau des professeurs
     * @param {Array} professors - Liste des professeurs
     */
    renderProfessorsTable: function(professors) {
        return `
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Prénom</th>
                            <th>Email</th>
                            <th>Date de naissance</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${professors.map(professor => `
                            <tr>
                                <td>${professor.nom}</td>
                                <td>${professor.prenom}</td>
                                <td>${professor.email}</td>
                                <td>${this.formatDate(professor.dateNaissance)}</td>
                                <td class="actions">
                                    <button class="btn btn-sm btn-info" data-action="view-professor" data-id="${professor.id}">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-secondary" data-action="edit-professor" data-id="${professor.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" data-action="delete-professor" data-id="${professor.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
    
    /**
     * Affiche le formulaire de création/édition d'un professeur
     * @param {number} id - ID du professeur à éditer (null pour création)
     */
    renderProfessorForm: function(id = null) {
        // Pour l'édition, trouver le professeur correspondant
        let professor = null;
        let title = 'Créer un professeur';
        let submitAction = 'create-professor-submit';
        
        if (id) {
            professor = this.state.professors.find(p => p.id === id);
            title = 'Modifier le professeur';
            submitAction = 'update-professor-submit';
        }
        
        return `
            <div class="view-header">
                <h2>${title}</h2>
                <button class="btn btn-secondary" data-action="back-to-professors">
                    <i class="fas fa-arrow-left"></i> Retour
                </button>
            </div>
            
            <div class="admin-card form-card">
                <div class="admin-card-body">
                    <form id="professor-form" data-action="${submitAction}" ${id ? `data-id="${id}"` : ''}>
                        <div class="form-row">
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="nom">Nom</label>
                                    <input type="text" id="nom" name="nom" class="form-control" 
                                        value="${professor ? professor.nom : ''}" required>
                                </div>
                            </div>
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="prenom">Prénom</label>
                                    <input type="text" id="prenom" name="prenom" class="form-control" 
                                        value="${professor ? professor.prenom : ''}" required>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" class="form-control" 
                                value="${professor ? professor.email : ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="dateNaissance">Date de naissance</label>
                            <input type="date" id="dateNaissance" name="dateNaissance" class="form-control" 
                                value="${professor ? this.formatDateForInput(professor.dateNaissance) : ''}" required>
                        </div>
                        
                        ${!id ? `
                            <div class="form-group">
                                <label for="password">Mot de passe</label>
                                <input type="password" id="password" name="password" class="form-control" required>
                            </div>
                        ` : ''}
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" data-action="back-to-professors">
                                Annuler
                            </button>
                            <button type="submit" class="btn btn-primary">
                                ${id ? 'Mettre à jour' : 'Créer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche la vue des étudiants
     */
    renderStudentsView: function() {
        const { students, subView, selectedId } = this.state;
        
        // Déterminer quelle sous-vue afficher
        if (subView === 'create') {
            return this.renderStudentForm();
        } else if (subView === 'edit' && selectedId) {
            return this.renderStudentForm(selectedId);
        }
        
        // Vue par défaut : liste des étudiants
        return `
            <div class="view-header">
                <h2>Gestion des étudiants</h2>
                <div class="view-actions">
                    <button class="btn btn-secondary" data-action="import-students">
                        <i class="fas fa-file-import"></i> Importer des étudiants
                    </button>
                    <button class="btn btn-primary" data-action="create-student">
                        <i class="fas fa-plus"></i> Ajouter un étudiant
                    </button>
                </div>
            </div>
            
            <div class="admin-card">
                <div class="admin-card-header">
                    <h3>Liste des étudiants</h3>
                </div>
                <div class="admin-card-body">
                    ${students.length === 0 ? 
                        `<p>Aucun étudiant n'est disponible.</p>` : 
                        this.renderStudentsTable(students)
                    }
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche le tableau des étudiants
     * @param {Array} students - Liste des étudiants
     */
    renderStudentsTable: function(students) {
        return `
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>N° Apogée</th>
                            <th>Nom</th>
                            <th>Prénom</th>
                            <th>Email</th>
                            <th>Statut</th>
                            <th>Année</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(student => `
                            <tr>
                                <td>${student.nApogee || '-'}</td>
                                <td>${student.nom}</td>
                                <td>${student.prenom}</td>
                                <td>${student.email}</td>
                                <td>${this.formatStudentStatus(student.statut)}</td>
                                <td>${this.formatStudentYear(student.annee)}</td>
                                <td class="actions">
                                    <button class="btn btn-sm btn-info" data-action="view-student" data-id="${student.id}">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-secondary" data-action="edit-student" data-id="${student.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" data-action="delete-student" data-id="${student.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
    
    /**
     * Affiche le formulaire de création/édition d'un étudiant
     * @param {number} id - ID de l'étudiant à éditer (null pour création)
     */
    renderStudentForm: function(id = null) {
        // Pour l'édition, trouver l'étudiant correspondant
        let student = null;
        let title = 'Créer un étudiant';
        let submitAction = 'create-student-submit';
        
        if (id) {
            student = this.state.students.find(s => s.id === id);
            title = 'Modifier l\'étudiant';
            submitAction = 'update-student-submit';
        }
        
        return `
            <div class="view-header">
                <h2>${title}</h2>
                <button class="btn btn-secondary" data-action="back-to-students">
                    <i class="fas fa-arrow-left"></i> Retour
                </button>
            </div>
            
            <div class="admin-card form-card">
                <div class="admin-card-body">
                    <form id="student-form" data-action="${submitAction}" ${id ? `data-id="${id}"` : ''}>
                        <div class="form-row">
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="nom">Nom</label>
                                    <input type="text" id="nom" name="nom" class="form-control" 
                                        value="${student ? student.nom : ''}" required>
                                </div>
                            </div>
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="prenom">Prénom</label>
                                    <input type="text" id="prenom" name="prenom" class="form-control" 
                                        value="${student ? student.prenom : ''}" required>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="email">Email</label>
                                    <input type="email" id="email" name="email" class="form-control" 
                                        value="${student ? student.email : ''}" required>
                                </div>
                            </div>
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="nApogee">Numéro Apogée</label>
                                    <input type="text" id="nApogee" name="nApogee" class="form-control" 
                                        value="${student ? student.nApogee || '' : ''}">
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="dateNaissance">Date de naissance</label>
                                    <input type="date" id="dateNaissance" name="dateNaissance" class="form-control" 
                                        value="${student ? this.formatDateForInput(student.dateNaissance) : ''}" required>
                                </div>
                            </div>
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="filiere">Filière</label>
                                    <select id="filiere" name="filiereId" class="form-control">
                                        <option value="">Sélectionner une filière</option>
                                        ${this.state.filieres.map(filiere => `
                                            <option value="${filiere.id}" ${student && student.filiereId === filiere.id ? 'selected' : ''}>
                                                ${filiere.nom}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="statut">Statut</label>
                                    <select id="statut" name="statut" class="form-control" required>
                                        <option value="ACTIF" ${student && student.statut === 'ACTIF' ? 'selected' : ''}>Actif</option>
                                        <option value="SUSPENDU" ${student && student.statut === 'SUSPENDU' ? 'selected' : ''}>Suspendu</option>
                                        <option value="ARRETE" ${student && student.statut === 'ARRETE' ? 'selected' : ''}>Arrêté</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="annee">Année</label>
                                    <select id="annee" name="annee" class="form-control" required>
                                        <option value="PREMIERE_ANNEE" ${student && student.annee === 'PREMIERE_ANNEE' ? 'selected' : ''}>1ère année</option>
                                        <option value="DEUXIEME_ANNEE" ${student && student.annee === 'DEUXIEME_ANNEE' ? 'selected' : ''}>2ème année</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        ${!id ? `
                            <div class="form-group">
                                <label for="password">Mot de passe</label>
                                <input type="password" id="password" name="password" class="form-control" required>
                            </div>
                        ` : ''}
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" data-action="back-to-students">
                                Annuler
                            </button>
                            <button type="submit" class="btn btn-primary">
                                ${id ? 'Mettre à jour' : 'Créer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche la vue des demandes de cartes
     */
    renderCardsView: function() {
        const { cardRequests } = this.state;
        
        return `
            <div class="view-header">
                <h2>Gestion des demandes de cartes étudiant</h2>
            </div>
            
            <div class="admin-card">
                <div class="admin-card-header">
                    <h3>Demandes en attente</h3>
                </div>
                <div class="admin-card-body">
                    ${cardRequests.length === 0 ? 
                        `<p>Aucune demande de carte en attente.</p>` : 
                        this.renderCardRequestsTable(cardRequests)
                    }
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche le tableau des demandes de cartes
     * @param {Array} cardRequests - Liste des demandes de cartes
     */
    renderCardRequestsTable: function(cardRequests) {
        return `
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Étudiant</th>
                            <th>Date de demande</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cardRequests.map(request => `
                            <tr>
                                <td>${request.studentName}</td>
                                <td>${this.formatDate(request.requestDate)}</td>
                                <td>${this.formatCardRequestStatus(request.status)}</td>
                                <td class="actions">
                                    <button class="btn btn-sm btn-success" data-action="approve-card" data-id="${request.id}">
                                        <i class="fas fa-check"></i> Approuver
                                    </button>
                                    <button class="btn btn-sm btn-danger" data-action="reject-card" data-id="${request.id}">
                                        <i class="fas fa-times"></i> Rejeter
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
    
    /**
     * Configure les écouteurs d'événements pour la vue active
     * @param {string} view - Vue active
     */
    setupViewEventListeners: function(view) {
        const contentContainer = document.getElementById('admin-content');
        if (!contentContainer) return;
        
        // Ajouter les écouteurs spécifiques à chaque vue
        switch (view) {
            case 'overview':
                this.setupOverviewEventListeners(contentContainer);
                break;
            case 'filieres':
                this.setupFilieresEventListeners(contentContainer);
                break;
            case 'professors':
                this.setupProfessorsEventListeners(contentContainer);
                break;
            case 'students':
                this.setupStudentsEventListeners(contentContainer);
                break;
            case 'cards':
                this.setupCardsEventListeners(contentContainer);
                break;
        }
    },
    
    /**
     * Configure les écouteurs d'événements pour la vue d'ensemble
     * @param {HTMLElement} container - Conteneur de la vue
     */
    setupOverviewEventListeners: function(container) {
        // Actions rapides
        container.addEventListener('click', (event) => {
            const target = event.target.closest('[data-action]');
            if (!target) return;
            
            const action = target.getAttribute('data-action');
            
            switch (action) {
                case 'create-filiere':
                    this.state.activeView = 'filieres';
                    this.state.subView = 'create';
                    this.loadViewData('filieres');
                    break;
                case 'create-professor':
                    this.state.activeView = 'professors';
                    this.state.subView = 'create';
                    this.loadViewData('professors');
                    break;
                case 'create-student':
                    this.state.activeView = 'students';
                    this.state.subView = 'create';
                    this.loadViewData('students');
                    break;
                case 'view-card-requests':
                    this.state.activeView = 'cards';
                    this.loadViewData('cards');
                    break;
            }
        });
    },
    
    /**
     * Configure les écouteurs d'événements pour la vue des filières
     * @param {HTMLElement} container - Conteneur de la vue
     */
    setupFilieresEventListeners: function(container) {
        // Actions de la vue filières
        container.addEventListener('click', (event) => {
            const target = event.target.closest('[data-action]');
            if (!target) return;
            
            const action = target.getAttribute('data-action');
            const id = target.hasAttribute('data-id') ? parseInt(target.getAttribute('data-id')) : null;
            
            switch (action) {
                case 'create-filiere':
                    this.state.subView = 'create';
                    this.state.selectedId = null;
                    this.renderContent();
                    break;
                case 'edit-filiere':
                    this.state.subView = 'edit';
                    this.state.selectedId = id;
                    this.renderContent();
                    break;
                case 'delete-filiere':
                    this.confirmDeleteFiliere(id);
                    break;
                case 'back-to-filieres':
                    this.state.subView = null;
                    this.state.selectedId = null;
                    this.renderContent();
                    break;
            }
        });
        
        // Formulaire de création/édition de filière
        const filiereForm = container.querySelector('#filiere-form');
        if (filiereForm) {
            filiereForm.addEventListener('submit', (event) => {
                event.preventDefault();
                
                const action = filiereForm.getAttribute('data-action');
                const id = filiereForm.hasAttribute('data-id') ? parseInt(filiereForm.getAttribute('data-id')) : null;
                
                const formData = {
                    nom: filiereForm.querySelector('#nom').value,
                    description: filiereForm.querySelector('#description').value
                };
                
                if (action === 'create-filiere-submit') {
                    this.createFiliere(formData);
                } else if (action === 'update-filiere-submit' && id) {
                    this.updateFiliere(id, formData);
                }
            });
        }
    },
    
    /**
     * Configure les écouteurs d'événements pour la vue des professeurs
     * @param {HTMLElement} container - Conteneur de la vue
     */
    setupProfessorsEventListeners: function(container) {
        // Actions de la vue professeurs
        container.addEventListener('click', (event) => {
            const target = event.target.closest('[data-action]');
            if (!target) return;
            
            const action = target.getAttribute('data-action');
            const id = target.hasAttribute('data-id') ? parseInt(target.getAttribute('data-id')) : null;
            
            switch (action) {
                case 'create-professor':
                    this.state.subView = 'create';
                    this.state.selectedId = null;
                    this.renderContent();
                    break;
                case 'edit-professor':
                    this.state.subView = 'edit';
                    this.state.selectedId = id;
                    this.renderContent();
                    break;
                case 'delete-professor':
                    this.confirmDeleteProfessor(id);
                    break;
                case 'back-to-professors':
                    this.state.subView = null;
                    this.state.selectedId = null;
                    this.renderContent();
                    break;
            }
        });
        
        // Formulaire de création/édition de professeur
        const professorForm = container.querySelector('#professor-form');
        if (professorForm) {
            professorForm.addEventListener('submit', (event) => {
                event.preventDefault();
                
                const action = professorForm.getAttribute('data-action');
                const id = professorForm.hasAttribute('data-id') ? parseInt(professorForm.getAttribute('data-id')) : null;
                
                const formData = {
                    nom: professorForm.querySelector('#nom').value,
                    prenom: professorForm.querySelector('#prenom').value,
                    email: professorForm.querySelector('#email').value,
                    dateNaissance: professorForm.querySelector('#dateNaissance').value,
                    role: 'PROFESSOR'
                };
                
                if (action === 'create-professor-submit') {
                    const password = professorForm.querySelector('#password').value;
                    this.createProfessor(formData, password);
                } else if (action === 'update-professor-submit' && id) {
                    this.updateProfessor(id, formData);
                }
            });
        }
    },
    
    /**
     * Configure les écouteurs d'événements pour la vue des étudiants
     * @param {HTMLElement} container - Conteneur de la vue
     */
    setupStudentsEventListeners: function(container) {
        // Actions de la vue étudiants
        container.addEventListener('click', (event) => {
            const target = event.target.closest('[data-action]');
            if (!target) return;
            
            const action = target.getAttribute('data-action');
            const id = target.hasAttribute('data-id') ? parseInt(target.getAttribute('data-id')) : null;
            
            switch (action) {
                case 'create-student':
                    this.state.subView = 'create';
                    this.state.selectedId = null;
                    this.renderContent();
                    break;
                case 'edit-student':
                    this.state.subView = 'edit';
                    this.state.selectedId = id;
                    this.renderContent();
                    break;
                case 'delete-student':
                    this.confirmDeleteStudent(id);
                    break;
                case 'back-to-students':
                    this.state.subView = null;
                    this.state.selectedId = null;
                    this.renderContent();
                    break;
                case 'import-students':
                    this.showImportStudentsModal();
                    break;
            }
        });
        
        // Formulaire de création/édition d'étudiant
        const studentForm = container.querySelector('#student-form');
        if (studentForm) {
            studentForm.addEventListener('submit', (event) => {
                event.preventDefault();
                
                const action = studentForm.getAttribute('data-action');
                const id = studentForm.hasAttribute('data-id') ? parseInt(studentForm.getAttribute('data-id')) : null;
                
                const formData = {
                    nom: studentForm.querySelector('#nom').value,
                    prenom: studentForm.querySelector('#prenom').value,
                    email: studentForm.querySelector('#email').value,
                    nApogee: studentForm.querySelector('#nApogee').value,
                    dateNaissance: studentForm.querySelector('#dateNaissance').value,
                    filiereId: studentForm.querySelector('#filiere').value || null,
                    statut: studentForm.querySelector('#statut').value,
                    annee: studentForm.querySelector('#annee').value,
                    role: 'STUDENT'
                };
                
                if (action === 'create-student-submit') {
                    const password = studentForm.querySelector('#password').value;
                    this.createStudent(formData, password);
                } else if (action === 'update-student-submit' && id) {
                    this.updateStudent(id, formData);
                }
            });
        }
    },
    
    /**
     * Configure les écouteurs d'événements pour la vue des demandes de cartes
     * @param {HTMLElement} container - Conteneur de la vue
     */
    setupCardsEventListeners: function(container) {
        // Actions de la vue des demandes de cartes
        container.addEventListener('click', (event) => {
            const target = event.target.closest('[data-action]');
            if (!target) return;
            
            const action = target.getAttribute('data-action');
            const id = target.hasAttribute('data-id') ? parseInt(target.getAttribute('data-id')) : null;
            
            switch (action) {
                case 'approve-card':
                    this.approveCardRequest(id);
                    break;
                case 'reject-card':
                    this.rejectCardRequest(id);
                    break;
            }
        });
    },
    
    /**
     * Configure les écouteurs d'événements globaux
     */
    setupEventListeners: function() {
        // Écouteur pour le bouton de déconnexion
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                AUTH.logout();
            });
        }
        
        // Écouteurs pour les éléments de navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const view = item.getAttribute('data-view');
                this.changeView(view);
            });
        });
    },
    
    /**
     * Change la vue active
     * @param {string} view - La vue à afficher
     */
    changeView: function(view) {
        if (this.state.activeView !== view) {
            this.state.activeView = view;
            this.state.subView = null;
            this.state.selectedId = null;
            
            // Charger les données de la nouvelle vue
            this.loadViewData(view);
        }
    },
    
    /**
     * ACTIONS POUR LES FILIÈRES
     */
    
    /**
     * Crée une nouvelle filière
     * @param {Object} data - Données de la filière
     */
    createFiliere: async function(data) {
        try {
            const response = await API.admin.createFiliere(data);
            if (response) {
                this.state.subView = null;
                await this.loadViewData('filieres');
                this.showSuccess('Filière créée avec succès.');
            }
        } catch (error) {
            console.error('Erreur lors de la création de la filière:', error);
            this.showError('Erreur lors de la création de la filière.');
        }
    },
    
    /**
     * Met à jour une filière existante
     * @param {number} id - ID de la filière
     * @param {Object} data - Nouvelles données
     */
    updateFiliere: async function(id, data) {
        try {
            const response = await API.admin.updateFiliere(id, data);
            if (response) {
                this.state.subView = null;
                this.state.selectedId = null;
                await this.loadViewData('filieres');
                this.showSuccess('Filière mise à jour avec succès.');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la filière:', error);
            this.showError('Erreur lors de la mise à jour de la filière.');
        }
    },
    
    /**
     * Affiche une confirmation de suppression de filière
     * @param {number} id - ID de la filière
     */
    confirmDeleteFiliere: function(id) {
        const filiere = this.state.filieres.find(f => f.id === id);
        if (!filiere) return;
        
        Modal.confirm(
            'Confirmer la suppression',
            `Êtes-vous sûr de vouloir supprimer la filière "${filiere.nom}" ?`,
            () => this.deleteFiliere(id)
        );
    },
    
    /**
     * Supprime une filière
     * @param {number} id - ID de la filière
     */
    deleteFiliere: async function(id) {
        try {
            const response = await API.admin.deleteFiliere(id);
            if (response && response.success) {
                await this.loadViewData('filieres');
                this.showSuccess('Filière supprimée avec succès.');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de la filière:', error);
            this.showError('Erreur lors de la suppression de la filière. Vérifiez qu\'elle n\'est pas utilisée.');
        }
    },
    
    /**
     * ACTIONS POUR LES PROFESSEURS
     */
    
    /**
     * Crée un nouveau professeur
     * @param {Object} data - Données du professeur
     * @param {string} password - Mot de passe
     */
    createProfessor: async function(data, password) {
        try {
            const response = await API.admin.createProfessor(data, password);
            if (response) {
                this.state.subView = null;
                await this.loadViewData('professors');
                this.showSuccess('Professeur créé avec succès.');
            }
        } catch (error) {
            console.error('Erreur lors de la création du professeur:', error);
            this.showError('Erreur lors de la création du professeur.');
        }
    },
    
    /**
     * Met à jour un professeur existant
     * @param {number} id - ID du professeur
     * @param {Object} data - Nouvelles données
     */
    updateProfessor: async function(id, data) {
        try {
            const response = await API.admin.updateProfessor(id, data);
            if (response) {
                this.state.subView = null;
                this.state.selectedId = null;
                await this.loadViewData('professors');
                this.showSuccess('Professeur mis à jour avec succès.');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du professeur:', error);
            this.showError('Erreur lors de la mise à jour du professeur.');
        }
    },
    
    /**
     * Affiche une confirmation de suppression de professeur
     * @param {number} id - ID du professeur
     */
    confirmDeleteProfessor: function(id) {
        const professor = this.state.professors.find(p => p.id === id);
        if (!professor) return;
        
        Modal.confirm(
            'Confirmer la suppression',
            `Êtes-vous sûr de vouloir supprimer le professeur "${professor.prenom} ${professor.nom}" ?`,
            () => this.deleteProfessor(id)
        );
    },
    
    /**
     * Supprime un professeur
     * @param {number} id - ID du professeur
     */
    deleteProfessor: async function(id) {
        try {
            const response = await API.admin.deleteProfessor(id);
            if (response && response.success) {
                await this.loadViewData('professors');
                this.showSuccess('Professeur supprimé avec succès.');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du professeur:', error);
            this.showError('Erreur lors de la suppression du professeur.');
        }
    },
    
    /**
     * ACTIONS POUR LES ÉTUDIANTS
     */
    
    /**
     * Crée un nouvel étudiant
     * @param {Object} data - Données de l'étudiant
     * @param {string} password - Mot de passe
     */
    createStudent: async function(data, password) {
        try {
            const response = await API.admin.createStudent(data, password);
            if (response) {
                this.state.subView = null;
                await this.loadViewData('students');
                this.showSuccess('Étudiant créé avec succès.');
            }
        } catch (error) {
            console.error('Erreur lors de la création de l\'étudiant:', error);
            this.showError('Erreur lors de la création de l\'étudiant.');
        }
    },
    
    /**
     * Met à jour un étudiant existant
     * @param {number} id - ID de l'étudiant
     * @param {Object} data - Nouvelles données
     */
    updateStudent: async function(id, data) {
        try {
            const response = await API.admin.updateStudent(id, data);
            if (response) {
                this.state.subView = null;
                this.state.selectedId = null;
                await this.loadViewData('students');
                this.showSuccess('Étudiant mis à jour avec succès.');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'étudiant:', error);
            this.showError('Erreur lors de la mise à jour de l\'étudiant.');
        }
    },
    
    /**
     * Affiche une confirmation de suppression d'étudiant
     * @param {number} id - ID de l'étudiant
     */
    confirmDeleteStudent: function(id) {
        const student = this.state.students.find(s => s.id === id);
        if (!student) return;
        
        Modal.confirm(
            'Confirmer la suppression',
            `Êtes-vous sûr de vouloir supprimer l'étudiant "${student.prenom} ${student.nom}" ?`,
            () => this.deleteStudent(id)
        );
    },
    
    /**
     * Supprime un étudiant
     * @param {number} id - ID de l'étudiant
     */
    deleteStudent: async function(id) {
        try {
            const response = await API.admin.deleteStudent(id);
            if (response && response.success) {
                await this.loadViewData('students');
                this.showSuccess('Étudiant supprimé avec succès.');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'étudiant:', error);
            this.showError('Erreur lors de la suppression de l\'étudiant.');
        }
    },
    
    /**
     * Affiche le modal d'importation d'étudiants
     */
    showImportStudentsModal: function() {
        const { filieres } = this.state;
        
        const content = `
            <form id="import-students-form">
                <div class="form-group">
                    <label for="import-filiere">Filière</label>
                    <select id="import-filiere" name="filiereId" class="form-control" required>
                        <option value="">Sélectionner une filière</option>
                        ${filieres.map(filiere => `
                            <option value="${filiere.id}">${filiere.nom}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="import-file">Fichier Excel (.xlsx)</label>
                    <input type="file" id="import-file" name="file" class="form-control" accept=".xlsx" required>
                </div>
                <div class="form-group">
                    <p class="help-text">
                        Le fichier Excel doit contenir les colonnes suivantes :
                        <br>- Numéro Apogée
                        <br>- Nom
                        <br>- Prénom
                        <br>- Email
                        <br>- Date de naissance (format JJ/MM/AAAA)
                        <br>- Année (1 ou 2)
                    </p>
                </div>
            </form>
        `;
        
        const footer = `
            <button type="button" class="btn btn-secondary" data-action="cancel-import">Annuler</button>
            <button type="button" class="btn btn-primary" data-action="start-import">Importer</button>
        `;
        
        const modal = Modal.show('Importer des étudiants', content, {
            footer,
            onOpen: (modalElement) => {
                const cancelButton = modalElement.querySelector('[data-action="cancel-import"]');
                const importButton = modalElement.querySelector('[data-action="start-import"]');
                
                cancelButton.addEventListener('click', () => {
                    Modal.close(modal.id);
                });
                
                importButton.addEventListener('click', () => {
                    const form = modalElement.querySelector('#import-students-form');
                    const filiereId = form.querySelector('#import-filiere').value;
                    const fileInput = form.querySelector('#import-file');
                    
                    if (!filiereId || !fileInput.files[0]) {
                        alert('Veuillez sélectionner une filière et un fichier.');
                        return;
                    }
                    
                    const formData = new FormData();
                    formData.append('file', fileInput.files[0]);
                    
                    this.importStudents(filiereId, formData);
                    Modal.close(modal.id);
                });
            }
        });
    },
    
    /**
     * Importe des étudiants depuis un fichier Excel
     * @param {number} filiereId - ID de la filière
     * @param {FormData} formData - Données du formulaire avec le fichier
     */
    importStudents: async function(filiereId, formData) {
        try {
            const response = await API.admin.importStudents(filiereId, formData);
            if (response && response.success) {
                await this.loadViewData('students');
                this.showSuccess('Étudiants importés avec succès.');
            }
        } catch (error) {
            console.error('Erreur lors de l\'importation des étudiants:', error);
            this.showError('Erreur lors de l\'importation des étudiants.');
        }
    },
    
    /**
     * ACTIONS POUR LES DEMANDES DE CARTES
     */
    
    /**
     * Approuve une demande de carte
     * @param {number} id - ID de la demande
     */
    approveCardRequest: async function(id) {
        try {
            const response = await API.admin.approveCardRequest(id);
            if (response) {
                await this.loadViewData('cards');
                this.showSuccess('Demande de carte approuvée avec succès.');
            }
        } catch (error) {
            console.error('Erreur lors de l\'approbation de la demande de carte:', error);
            this.showError('Erreur lors de l\'approbation de la demande de carte.');
        }
    },
    
    /**
     * Rejette une demande de carte
     * @param {number} id - ID de la demande
     */
    rejectCardRequest: async function(id) {
        try {
            const response = await API.admin.rejectCardRequest(id);
            if (response) {
                await this.loadViewData('cards');
                this.showSuccess('Demande de carte rejetée.');
            }
        } catch (error) {
            console.error('Erreur lors du rejet de la demande de carte:', error);
            this.showError('Erreur lors du rejet de la demande de carte.');
        }
    },
    
    /**
     * UTILITAIRES
     */
    
    /**
     * Tronque un texte à une longueur maximale
     * @param {string} text - Texte à tronquer
     * @param {number} maxLength - Longueur maximale
     * @returns {string} - Texte tronqué
     */
    truncateText: function(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },
    
    /**
     * Formate une date pour l'affichage
     * @param {string} dateString - Date au format ISO
     * @returns {string} - Date formatée
     */
    formatDate: function(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },
    
    /**
     * Formate une date pour un champ input
     * @param {string} dateString - Date au format ISO
     * @returns {string} - Date formatée YYYY-MM-DD
     */
    formatDateForInput: function(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    },
    
    /**
     * Formate le statut d'un étudiant pour l'affichage
     * @param {string} status - Statut étudiant
     * @returns {string} - Statut formaté
     */
    formatStudentStatus: function(status) {
        if (!status) return '-';
        
        switch (status) {
            case 'ACTIF':
                return '<span class="badge badge-success">Actif</span>';
            case 'SUSPENDU':
                return '<span class="badge badge-warning">Suspendu</span>';
            case 'ARRETE':
                return '<span class="badge badge-danger">Arrêté</span>';
            default:
                return status;
        }
    },
    
    /**
     * Formate l'année d'un étudiant pour l'affichage
     * @param {string} year - Année d'études
     * @returns {string} - Année formatée
     */
    formatStudentYear: function(year) {
        if (!year) return '-';
        
        switch (year) {
            case 'PREMIERE_ANNEE':
                return '1ère année';
            case 'DEUXIEME_ANNEE':
                return '2ème année';
            default:
                return year;
        }
    },
    
    /**
     * Formate le statut d'une demande de carte pour l'affichage
     * @param {string} status - Statut de la demande
     * @returns {string} - Statut formaté
     */
    formatCardRequestStatus: function(status) {
        if (!status) return '-';
        
        switch (status) {
            case 'PENDING':
                return '<span class="badge badge-warning">En attente</span>';
            case 'APPROVED':
                return '<span class="badge badge-success">Approuvée</span>';
            case 'REJECTED':
                return '<span class="badge badge-danger">Rejetée</span>';
            case 'RECEIVED':
                return '<span class="badge badge-info">Reçue</span>';
            default:
                return status;
        }
    },
    
    /**
     * Affiche un message d'erreur
     * @param {string} message - Message d'erreur
     */
    showError: function(message) {
        Modal.alert('Erreur', message);
    },
    
    /**
     * Affiche un message de succès
     * @param {string} message - Message de succès
     */
    showSuccess: function(message) {
        Modal.alert('Succès', message);
    }
};