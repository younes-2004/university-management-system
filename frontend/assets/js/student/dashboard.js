 
/**
 * Gestion du tableau de bord étudiant
 */
const StudentDashboard = {
    // État de l'application
    state: {
        userInfo: null,
        filiereInfo: null,
        cardRequests: [],
        activeView: 'profile', // 'profile' ou 'card'
    },
    
    /**
     * Initialise le tableau de bord étudiant
     */
    init: async function() {
        // Charger les informations de l'utilisateur
        await this.loadUserInfo();
        
        // Charger les demandes de carte
        await this.loadCardRequests();
        
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
            // Récupérer les informations de profil
            const userInfo = await API.auth.getProfile();
            this.state.userInfo = userInfo;
            
            // Si l'étudiant appartient à une filière, charger les informations de cette filière
            if (userInfo && userInfo.filiereId) {
                const filiereInfo = await API.filieres.getFiliere(userInfo.filiereId);
                this.state.filiereInfo = filiereInfo;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des informations utilisateur:', error);
            this.showError('Impossible de charger vos informations personnelles. Veuillez réessayer plus tard.');
        }
    },
    
    /**
     * Charge les demandes de carte de l'étudiant
     */
    loadCardRequests: async function() {
        try {
            const cardRequests = await API.student.getCardRequests();
            this.state.cardRequests = cardRequests || [];
        } catch (error) {
            console.error('Erreur lors du chargement des demandes de carte:', error);
            this.showError('Impossible de charger les demandes de carte. Veuillez réessayer plus tard.');
        }
    },
    
    /**
     * Affiche l'interface utilisateur
     */
    render: function() {
        // Récupérer le conteneur étudiant
        const studentContainer = document.getElementById('student-container');
        if (!studentContainer) return;
        
        // Obtenir les données nécessaires pour le rendu
        const { userInfo, filiereInfo, cardRequests, activeView } = this.state;
        const user = AUTH.getCurrentUser();
        
        // Construire l'interface utilisateur
        studentContainer.innerHTML = `
            <div class="student-header">
                <h1>Système de Gestion Universitaire</h1>
                <button id="logout-btn" class="btn btn-secondary">Déconnexion</button>
            </div>
            <div class="student-main">
                <div class="student-sidebar">
                    <div class="user-info">
                        <div class="user-name">${user.prenom} ${user.nom}</div>
                        <div class="user-role">Étudiant</div>
                    </div>
                    <nav class="student-nav">
                        <div class="nav-item ${activeView === 'profile' ? 'active' : ''}" data-view="profile">Mon Profil</div>
                        <div class="nav-item ${activeView === 'card' ? 'active' : ''}" data-view="card">Carte Étudiant</div>
                    </nav>
                </div>
                <div class="student-content">
                    ${this.renderActiveView()}
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche la vue active (profil ou carte)
     */
    renderActiveView: function() {
        const { activeView } = this.state;
        
        switch (activeView) {
            case 'profile':
                return this.renderProfileView();
            case 'card':
                return this.renderCardView();
            default:
                return this.renderProfileView();
        }
    },
    
    /**
     * Affiche la vue du profil étudiant
     */
    renderProfileView: function() {
        const { userInfo, filiereInfo } = this.state;
        
        if (!userInfo) {
            return `<div class="loading">Chargement de vos informations...</div>`;
        }
        
        return `
            <div class="student-card">
                <div class="student-card-header">
                    <h2>Informations Personnelles</h2>
                </div>
                <div class="student-card-body">
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="label">Nom complet</div>
                            <div class="value">${userInfo.nom} ${userInfo.prenom}</div>
                        </div>
                        <div class="info-item">
                            <div class="label">Numéro Apogée</div>
                            <div class="value">${userInfo.nApogee || 'Non renseigné'}</div>
                        </div>
                        <div class="info-item">
                            <div class="label">Email</div>
                            <div class="value">${userInfo.email}</div>
                        </div>
                        <div class="info-item">
                            <div class="label">Filière</div>
                            <div class="value">${filiereInfo ? filiereInfo.nom : 'Non assignée'}</div>
                        </div>
                        <div class="info-item">
                            <div class="label">Année</div>
                            <div class="value">${userInfo.annee ? this.formatAnnee(userInfo.annee) : 'Non renseignée'}</div>
                        </div>
                        <div class="info-item">
                            <div class="label">Date de naissance</div>
                            <div class="value">${userInfo.dateNaissance ? this.formatDate(userInfo.dateNaissance) : 'Non renseignée'}</div>
                        </div>
                        <div class="info-item">
                            <div class="label">Statut</div>
                            <div class="value">${userInfo.statut ? this.formatStatut(userInfo.statut) : 'Non renseigné'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche la vue de la carte étudiant
     */
    renderCardView: function() {
        const { cardRequests } = this.state;
        
        // Déterminer l'état actuel de la carte
        const cardStatus = this.getCardStatus(cardRequests);
        
        let statusContent = '';
        let actionsContent = '';
        
        switch (cardStatus.status) {
            case 'NONE':
                statusContent = `
                    <div class="card-status incomplete">
                        <div class="card-status-icon">❌</div>
                        <div class="card-status-content">
                            <h3>Carte non demandée</h3>
                            <p>Vous n'avez pas encore demandé votre carte étudiant.</p>
                        </div>
                    </div>
                `;
                actionsContent = `
                    <div class="card-actions">
                        <button id="request-card-btn" class="btn btn-primary">Demander la carte</button>
                    </div>
                `;
                break;
            case 'PENDING':
                statusContent = `
                    <div class="card-status pending">
                        <div class="card-status-icon">⏳</div>
                        <div class="card-status-content">
                            <h3>Demande en cours</h3>
                            <p>Votre demande de carte est en cours de traitement. Date de demande: ${this.formatDate(cardStatus.request.requestDate)}</p>
                        </div>
                    </div>
                `;
                break;
            case 'APPROVED':
                statusContent = `
                    <div class="card-status approved">
                        <div class="card-status-icon">✅</div>
                        <div class="card-status-content">
                            <h3>Demande approuvée</h3>
                            <p>Votre carte est prête à être récupérée. Approuvée le: ${this.formatDate(cardStatus.request.processedDate)}</p>
                        </div>
                    </div>
                `;
                actionsContent = `
                    <div class="card-actions">
                        <button id="confirm-reception-btn" class="btn btn-success" data-request-id="${cardStatus.request.id}">Confirmer la réception</button>
                    </div>
                `;
                break;
            case 'REJECTED':
                statusContent = `
                    <div class="card-status rejected">
                        <div class="card-status-icon">❌</div>
                        <div class="card-status-content">
                            <h3>Demande rejetée</h3>
                            <p>Votre demande de carte a été rejetée. Rejetée le: ${this.formatDate(cardStatus.request.processedDate)}</p>
                        </div>
                    </div>
                `;
                actionsContent = `
                    <div class="card-actions">
                        <button id="request-card-btn" class="btn btn-primary">Faire une nouvelle demande</button>
                    </div>
                `;
                break;
            case 'RECEIVED':
                statusContent = `
                    <div class="card-status complete">
                        <div class="card-status-icon">✅</div>
                        <div class="card-status-content">
                            <h3>Carte récupérée</h3>
                            <p>Vous avez récupéré votre carte étudiant. Date de réception: ${this.formatDate(cardStatus.request.receivedDate)}</p>
                        </div>
                    </div>
                `;
                break;
        }
        
        return `
            <div class="student-card">
                <div class="student-card-header">
                    <h2>Carte Étudiant</h2>
                </div>
                <div class="student-card-body">
                    ${statusContent}
                    ${actionsContent}
                </div>
            </div>
            
            <div class="student-card">
                <div class="student-card-header">
                    <h2>Historique des demandes</h2>
                </div>
                <div class="student-card-body">
                    ${this.renderCardRequestsHistory()}
                </div>
            </div>
        `;
    },
    
    /**
     * Affiche l'historique des demandes de carte
     */
    renderCardRequestsHistory: function() {
        const { cardRequests } = this.state;
        
        if (!cardRequests || cardRequests.length === 0) {
            return `<p>Aucune demande de carte n'a été effectuée.</p>`;
        }
        
        let historyContent = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Date de demande</th>
                        <th>Statut</th>
                        <th>Date de traitement</th>
                        <th>Date de réception</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        cardRequests.forEach(request => {
            historyContent += `
                <tr>
                    <td>${this.formatDate(request.requestDate)}</td>
                    <td>${this.formatCardStatus(request.status)}</td>
                    <td>${request.processedDate ? this.formatDate(request.processedDate) : '-'}</td>
                    <td>${request.receivedDate ? this.formatDate(request.receivedDate) : '-'}</td>
                </tr>
            `;
        });
        
        historyContent += `
                </tbody>
            </table>
        `;
        
        return historyContent;
    },
    
    /**
     * Configure les écouteurs d'événements pour le tableau de bord
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
        
        // Écouteur pour le bouton de demande de carte
        const requestCardBtn = document.getElementById('request-card-btn');
        if (requestCardBtn) {
            requestCardBtn.addEventListener('click', () => {
                this.requestCard();
            });
        }
        
        // Écouteur pour le bouton de confirmation de réception
        const confirmReceptionBtn = document.getElementById('confirm-reception-btn');
        if (confirmReceptionBtn) {
            confirmReceptionBtn.addEventListener('click', () => {
                const requestId = confirmReceptionBtn.getAttribute('data-request-id');
                this.confirmCardReception(requestId);
            });
        }
    },
    
    /**
     * Change la vue active
     * @param {string} view - La vue à afficher ('profile' ou 'card')
     */
    changeView: function(view) {
        if (this.state.activeView !== view) {
            this.state.activeView = view;
            this.render();
        }
    },
    
    /**
     * Effectue une demande de carte étudiant
     */
    requestCard: async function() {
        try {
            const response = await API.student.createCardRequest();
            if (response) {
                // Recharger les demandes de carte
                await this.loadCardRequests();
                // Afficher un message de succès
                this.showSuccess('Votre demande de carte a été enregistrée avec succès.');
                // Mettre à jour l'interface
                this.render();
            }
        } catch (error) {
            console.error('Erreur lors de la demande de carte:', error);
            this.showError('Une erreur est survenue lors de la demande de carte. Veuillez réessayer plus tard.');
        }
    },
    
    /**
     * Confirme la réception d'une carte étudiant
     * @param {string} requestId - ID de la demande de carte
     */
    confirmCardReception: async function(requestId) {
        try {
            const response = await API.student.confirmCardReception(requestId);
            if (response) {
                // Recharger les demandes de carte
                await this.loadCardRequests();
                // Afficher un message de succès
                this.showSuccess('La réception de votre carte a été confirmée avec succès.');
                // Mettre à jour l'interface
                this.render();
            }
        } catch (error) {
            console.error('Erreur lors de la confirmation de réception:', error);
            this.showError('Une erreur est survenue lors de la confirmation de réception. Veuillez réessayer plus tard.');
        }
    },
    
    /**
     * Détermine le statut actuel de la carte étudiant
     * @param {Array} cardRequests - Liste des demandes de carte
     * @returns {Object} - Objet contenant le statut et éventuellement la demande associée
     */
    getCardStatus: function(cardRequests) {
        if (!cardRequests || cardRequests.length === 0) {
            return { status: 'NONE' };
        }
        
        // Trier par date de demande (la plus récente d'abord)
        const sortedRequests = [...cardRequests].sort((a, b) => 
            new Date(b.requestDate) - new Date(a.requestDate)
        );
        
        const latestRequest = sortedRequests[0];
        
        switch (latestRequest.status) {
            case 'PENDING':
                return { status: 'PENDING', request: latestRequest };
            case 'APPROVED':
                return { status: 'APPROVED', request: latestRequest };
            case 'REJECTED':
                return { status: 'REJECTED', request: latestRequest };
            case 'RECEIVED':
                return { status: 'RECEIVED', request: latestRequest };
            default:
                return { status: 'NONE' };
        }
    },
    
    /**
     * Affiche un message d'erreur
     * @param {string} message - Message d'erreur à afficher
     */
    showError: function(message) {
        // Implémenter une notification d'erreur
        alert(message);
    },
    
    /**
     * Affiche un message de succès
     * @param {string} message - Message de succès à afficher
     */
    showSuccess: function(message) {
        // Implémenter une notification de succès
        alert(message);
    },
    
    /**
     * Formate une date pour l'affichage
     * @param {string} dateString - Date au format ISO
     * @returns {string} - Date formatée
     */
    formatDate: function(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },
    
    /**
     * Formate l'année d'études pour l'affichage
     * @param {string} annee - Année d'études (enum)
     * @returns {string} - Année formatée
     */
    formatAnnee: function(annee) {
        switch (annee) {
            case 'PREMIERE_ANNEE':
                return '1ère année';
            case 'DEUXIEME_ANNEE':
                return '2ème année';
            default:
                return annee;
        }
    },
    
    /**
     * Formate le statut étudiant pour l'affichage
     * @param {string} statut - Statut étudiant (enum)
     * @returns {string} - Statut formaté
     */
    formatStatut: function(statut) {
        switch (statut) {
            case 'ACTIF':
                return 'Actif';
            case 'SUSPENDU':
                return 'Suspendu';
            case 'ARRETE':
                return 'Arrêté';
            default:
                return statut;
        }
    },
    
    /**
     * Formate le statut de la carte pour l'affichage
     * @param {string} status - Statut de la carte (enum)
     * @returns {string} - Statut formaté
     */
    formatCardStatus: function(status) {
        switch (status) {
            case 'PENDING':
                return 'En attente';
            case 'APPROVED':
                return 'Approuvée';
            case 'REJECTED':
                return 'Rejetée';
            case 'RECEIVED':
                return 'Reçue';
            default:
                return status;
        }
    }
};