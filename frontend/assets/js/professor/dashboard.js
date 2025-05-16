 
/**
 * Gestion du tableau de bord professeur
 */
const ProfessorDashboard = {
    // État de l'application
    state: {
        userInfo: null,
        filieres: [],
        modules: [],
        elements: [],
        activeView: 'overview', // 'overview', 'filiere', 'modules'
        selectedFiliere: null,
        selectedYear: null,
        selectedSemestre: null,
        breadcrumbs: []
    },
    
    /**
     * Initialise le tableau de bord professeur
     */
    init: async function() {
        // Charger les informations de l'utilisateur
        await this.loadUserInfo();
        
        // Charger les filières, modules et éléments enseignés
        await Promise.all([
            this.loadFilieres(),
            this.loadModules(),
            this.loadElements()
        ]);
        
        // Afficher l'interface
        this.render();
        
        // Configurer les écouteurs d'événements
        this.setupEventListeners();
    },
    
    /**
     * Charge les informations de l'utilisateur connecté
     */
    loadUserInfo: async function() {
        try {
            const userInfo = await API.auth.getProfile();
            this.state.userInfo = userInfo;
        } catch (error) {
            console.error('Erreur lors du chargement des informations utilisateur:', error);
            this.showError('Impossible de charger vos informations personnelles.');
        }
    },
    
    /**
     * Charge les filières enseignées par le professeur
     */
    loadFilieres: async function() {
        try {
            const filieres = await API.professor.getFilieres();
            this.state.filieres = filieres || [];
        } catch (error) {
            console.error('Erreur lors du chargement des filières:', error);
            this.showError('Impossible de charger les filières.');
        }
    },
    
    /**
     * Charge les modules enseignés par le professeur
     */
    loadModules: async function() {
        try {
            const modules = await API.professor.getModules();
            this.state.modules = modules || [];
        } catch (error) {
            console.error('Erreur lors du chargement des modules:', error);
            this.showError('Impossible de charger les modules.');
        }
    },
    
    /**
     * Charge les éléments enseignés par le professeur
     */
    loadElements: async function() {
        try {
            const elements = await API.professor.getElements();
            this.state.elements = elements || [];
        } catch (error) {
            console.error('Erreur lors du chargement des éléments:', error);
            this.showError('Impossible de charger les éléments.');
        }
    },
    
    /**
     * Affiche l'interface utilisateur
     */
    render: function() {
        // Récupérer le conteneur professeur
        const professorContainer = document.getElementById('professor-container');
        if (!professorContainer) return;
        
        // Obtenir les données nécessaires pour le rendu
        const { userInfo, activeView } = this.state;
        const user = AUTH.getCurrentUser();
        
        // Construire l'interface utilisateur
        professorContainer.innerHTML = `
            <div class="professor-header">
                <h1>Système de Gestion Universitaire</h1>
                <button id="logout-btn" class="btn btn-secondary">Déconnexion</button>
            </div>
            <div class="professor-main">
                <div class="professor-sidebar">
                    <div class="user-info">
                        <div class="user-name">${user.prenom} ${user.nom}</div>
                        <div class="user-role">Professeur</div>
                    </div>
                    <nav class="professor-nav">
                        <div class="nav-item ${activeView === 'overview' ? 'active' : ''}" data-view="overview">Vue d'ensemble</div>
                        <div class="nav-item ${activeView === 'filieres' ? 'active' : ''}" data-view="filieres">Mes filières</div>
                        <div class="nav-item ${activeView === 'modules' ? 'active' : ''}" data-view="modules">Mes modules</div>
                    </nav>
                </div>
                <div class="professor-content">
                    ${this.renderBreadcrumbs()}
                    ${this.renderActiveView()}
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche le fil d'Ariane (breadcrumbs)
     */
    renderBreadcrumbs: function() {
        const { activeView, selectedFiliere, selectedYear, selectedSemestre } = this.state;
        
        // Si on est sur la vue d'ensemble, pas besoin de breadcrumbs
        if (activeView === 'overview') {
            return '';
        }
        
        let breadcrumbs = `
            <div class="breadcrumb">
                <div class="breadcrumb-item">
                    <a href="#" data-action="view-overview">Accueil</a>
                </div>
        `;
        
        if (activeView === 'filieres') {
            breadcrumbs += `
                <div class="breadcrumb-item active">Mes filières</div>
            `;
        } else if (activeView === 'filiere' && selectedFiliere) {
            breadcrumbs += `
                <div class="breadcrumb-item">
                    <a href="#" data-action="view-filieres">Mes filières</a>
                </div>
                <div class="breadcrumb-item active">${selectedFiliere.nom}</div>
            `;
        } else if (activeView === 'modules') {
            breadcrumbs += `
                <div class="breadcrumb-item active">Mes modules</div>
            `;
        } else if (activeView === 'semestre' && selectedFiliere && selectedSemestre) {
            breadcrumbs += `
                <div class="breadcrumb-item">
                    <a href="#" data-action="view-filieres">Mes filières</a>
                </div>
                <div class="breadcrumb-item">
                    <a href="#" data-action="view-filiere" data-filiere-id="${selectedFiliere.id}">${selectedFiliere.nom}</a>
                </div>
                <div class="breadcrumb-item active">Semestre ${selectedSemestre}</div>
            `;
        }
        
        breadcrumbs += `</div>`;
        
        return breadcrumbs;
    },
    
    /**
     * Affiche la vue active
     */
    renderActiveView: function() {
        const { activeView } = this.state;
        
        switch (activeView) {
            case 'overview':
                return this.renderOverviewView();
            case 'filieres':
                return this.renderFilieresView();
            case 'filiere':
                return this.renderFiliereView();
            case 'modules':
                return this.renderModulesView();
            case 'semestre':
                return this.renderSemestreView();
            default:
                return this.renderOverviewView();
        }
    },
    
    /**
     * Affiche la vue d'ensemble
     */
    renderOverviewView: function() {
        const { filieres, modules, elements } = this.state;
        
        return `
            <div class="professor-card">
                <div class="professor-card-header">
                    <h2>Tableau de bord</h2>
                </div>
                <div class="professor-card-body">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${filieres.length}</div>
                            <div class="stat-label">Filières</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${modules.length}</div>
                            <div class="stat-label">Modules</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${elements.length}</div>
                            <div class="stat-label">Éléments</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="professor-card">
                <div class="professor-card-header">
                    <h2>Mes filières</h2>
                </div>
                <div class="professor-card-body">
                    ${this.renderFilieresGrid(filieres, 3)}
                </div>
            </div>
            
            <div class="professor-card">
                <div class="professor-card-header">
                    <h2>Mes modules récents</h2>
                </div>
                <div class="professor-card-body">
                    ${this.renderModulesList(modules.slice(0, 3))}
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche la vue des filières
     */
    renderFilieresView: function() {
        const { filieres } = this.state;
        
        if (!filieres || filieres.length === 0) {
            return `
                <div class="professor-card">
                    <div class="professor-card-header">
                        <h2>Mes filières</h2>
                    </div>
                    <div class="professor-card-body">
                        <p>Vous n'enseignez actuellement dans aucune filière.</p>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="professor-card">
                <div class="professor-card-header">
                    <h2>Mes filières</h2>
                </div>
                <div class="professor-card-body">
                    ${this.renderFilieresGrid(filieres)}
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche la vue d'une filière spécifique
     */
    renderFiliereView: function() {
        const { selectedFiliere } = this.state;
        
        if (!selectedFiliere) {
            return `<div class="loading">Chargement de la filière...</div>`;
        }
        
        // Dans notre cas, les semestres sont fixes: 1, 2, 3, 4
        const semestres = [1, 2, 3, 4];
        
        return `
            <div class="professor-card">
                <div class="professor-card-header">
                    <h2>${selectedFiliere.nom}</h2>
                </div>
                <div class="professor-card-body">
                    <p>${selectedFiliere.description}</p>
                </div>
            </div>
            
            <div class="professor-card">
                <div class="professor-card-header">
                    <h2>Semestres</h2>
                </div>
                <div class="professor-card-body">
                    <div class="semester-list">
                        ${semestres.map(semestre => `
                            <div class="semester-item" data-semestre="${semestre}" data-action="view-semestre">
                                <h3>Semestre ${semestre}</h3>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche la vue des modules
     */
    renderModulesView: function() {
        const { modules } = this.state;
        
        if (!modules || modules.length === 0) {
            return `
                <div class="professor-card">
                    <div class="professor-card-header">
                        <h2>Mes modules</h2>
                    </div>
                    <div class="professor-card-body">
                        <p>Vous n'enseignez actuellement aucun module.</p>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="professor-card">
                <div class="professor-card-header">
                    <h2>Mes modules</h2>
                </div>
                <div class="professor-card-body">
                    ${this.renderModulesList(modules)}
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche la vue d'un semestre spécifique
     */
    renderSemestreView: function() {
        const { selectedFiliere, selectedSemestre, modules } = this.state;
        
        if (!selectedFiliere || !selectedSemestre) {
            return `<div class="loading">Chargement du semestre...</div>`;
        }
        
        // Filtrer les modules par filière et semestre
        const semesterModules = modules.filter(module => 
            module.filiereId === selectedFiliere.id && module.semestre === selectedSemestre
        );
        
        if (semesterModules.length === 0) {
            return `
                <div class="professor-card">
                    <div class="professor-card-header">
                        <h2>Semestre ${selectedSemestre} - ${selectedFiliere.nom}</h2>
                    </div>
                    <div class="professor-card-body">
                        <p>Vous n'enseignez aucun module dans ce semestre.</p>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="professor-card">
                <div class="professor-card-header">
                    <h2>Semestre ${selectedSemestre} - ${selectedFiliere.nom}</h2>
                </div>
                <div class="professor-card-body">
                    ${this.renderModulesList(semesterModules)}
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche une grille de filières
     * @param {Array} filieres - Liste des filières à afficher
     * @param {number} limit - Limite du nombre de filières à afficher (optionnel)
     * @returns {string} - HTML de la grille
     */
    renderFilieresGrid: function(filieres, limit = null) {
        if (!filieres || filieres.length === 0) {
            return `<p>Aucune filière disponible.</p>`;
        }
        
        const filieresToShow = limit ? filieres.slice(0, limit) : filieres;
        
        let html = `<div class="filiere-grid">`;
        
        filieresToShow.forEach(filiere => {
            html += `
                <div class="filiere-item" data-filiere-id="${filiere.id}" data-action="view-filiere">
                    <div class="filiere-item-header">
                        <h3>${filiere.nom}</h3>
                    </div>
                    <div class="filiere-item-body">
                        <p>${this.truncateText(filiere.description, 100)}</p>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        
        if (limit && filieres.length > limit) {
            html += `
                <div class="text-center mt-4">
                    <button class="btn btn-primary" data-action="view-filieres">Voir toutes les filières</button>
                </div>
            `;
        }
        
        return html;
    },
    
    /**
     * Affiche une liste de modules
     * @param {Array} modules - Liste des modules à afficher
     * @returns {string} - HTML de la liste
     */
    renderModulesList: function(modules) {
        if (!modules || modules.length === 0) {
            return `<p>Aucun module disponible.</p>`;
        }
        
        let html = `<div class="module-list">`;
        
        modules.forEach(module => {
            const moduleElements = this.state.elements.filter(element => element.moduleId === module.id);
            
            html += `
                <div class="module-item" data-module-id="${module.id}">
                    <div class="module-item-header" data-action="toggle-module">
                        <h3>${module.nom}</h3>
                        <span class="module-toggle">▼</span>
                    </div>
                    <div class="module-item-body">
                        <div class="module-info">
                            <p><strong>Description:</strong> ${module.description}</p>
                            <p><strong>Filière:</strong> ${module.filiereNom}</p>
                            <p><strong>Semestre:</strong> ${module.semestre}</p>
                        </div>
                        
                        <div class="module-hours">
                            <div class="hour-item">
                                <h4>Cours</h4>
                                <p>${module.heuresCours}h</p>
                            </div>
                            <div class="hour-item">
                                <h4>TD</h4>
                                <p>${module.heuresTD}h</p>
                            </div>
                            <div class="hour-item">
                                <h4>TP</h4>
                                <p>${module.heuresTP}h</p>
                            </div>
                        </div>
                        
                        ${moduleElements.length > 0 ? `
                            <div class="elements-title">Éléments du module</div>
                            <div class="element-list">
                                ${moduleElements.map(element => `
                                    <div class="element-item">
                                        <h4>${element.nom}</h4>
                                        <div class="element-hours">
                                            <span>Cours: ${element.heuresCours}h</span>
                                            <span>TD: ${element.heuresTD}h</span>
                                            <span>TP: ${element.heuresTP}h</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p>Aucun élément dans ce module.</p>'}
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        
        return html;
    },
    
    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners: function() {
        const professorContainer = document.getElementById('professor-container');
        if (!professorContainer) return;
        
        // Écouteur pour le bouton de déconnexion
        const logoutBtn = professorContainer.querySelector('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                AUTH.logout();
            });
        }
        
        // Écouteurs pour les éléments de navigation
        const navItems = professorContainer.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const view = item.getAttribute('data-view');
                this.changeView(view);
            });
        });
        
        // Écouteurs pour les actions dans le contenu
        professorContainer.addEventListener('click', (event) => {
            const target = event.target.closest('[data-action]');
            if (!target) return;
            
            const action = target.getAttribute('data-action');
            
            switch (action) {
                case 'view-overview':
                    this.changeView('overview');
                    break;
                case 'view-filieres':
                    this.changeView('filieres');
                    break;
                case 'view-modules':
                    this.changeView('modules');
                    break;
                case 'view-filiere':
                    const filiereId = parseInt(target.getAttribute('data-filiere-id'));
                    this.viewFiliere(filiereId);
                    break;
                case 'view-semestre':
                    const semestre = parseInt(target.getAttribute('data-semestre'));
                    this.viewSemestre(semestre);
                    break;
                case 'toggle-module':
                    const moduleItem = target.closest('.module-item');
                    if (moduleItem) {
                        moduleItem.classList.toggle('open');
                        const toggle = moduleItem.querySelector('.module-toggle');
                        if (toggle) {
                            toggle.textContent = moduleItem.classList.contains('open') ? '▲' : '▼';
                        }
                    }
                    break;
            }
        });
    },
    
    /**
     * Change la vue active
     * @param {string} view - La vue à afficher
     */
    changeView: function(view) {
        if (this.state.activeView !== view) {
            this.state.activeView = view;
            
            // Réinitialiser les sélections si nécessaire
            if (view === 'overview' || view === 'filieres' || view === 'modules') {
                this.state.selectedFiliere = null;
                this.state.selectedSemestre = null;
            }
            
            this.render();
        }
    },
    
    /**
     * Affiche la vue d'une filière spécifique
     * @param {number} filiereId - ID de la filière à afficher
     */
    viewFiliere: function(filiereId) {
        const filiere = this.state.filieres.find(f => f.id === filiereId);
        if (filiere) {
            this.state.selectedFiliere = filiere;
            this.state.activeView = 'filiere';
            this.render();
        }
    },
    
    /**
     * Affiche la vue d'un semestre spécifique
     * @param {number} semestre - Numéro du semestre à afficher
     */
    viewSemestre: function(semestre) {
        if (this.state.selectedFiliere) {
            this.state.selectedSemestre = semestre;
            this.state.activeView = 'semestre';
            this.render();
        }
    },
    
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
     * Affiche un message d'erreur
     * @param {string} message - Message d'erreur
     */
    showError: function(message) {
        alert(message);
    }
};