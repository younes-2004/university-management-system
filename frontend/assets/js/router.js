 
/**
 * Simple gestionnaire de routes pour l'application
 */
const ROUTER = {
    /**
     * Initialise le routeur
     */
    init: function() {
        const user = AUTH.getCurrentUser();
        
        if (AUTH.isAuthenticated() && user) {
            // Redirection basée sur le rôle de l'utilisateur
            switch (user.role) {
                case 'ADMIN':
                    this.loadAdminDashboard();
                    break;
                case 'PROFESSOR':
                    this.loadProfessorDashboard();
                    break;
                case 'STUDENT':
                    this.loadStudentDashboard();
                    break;
                default:
                    this.showLogin();
            }
        } else {
            this.showLogin();
        }
    },
    
    /**
     * Affiche la page de connexion
     */
    showLogin: function() {
        // Comme la page de connexion est déjà dans index.html, 
        // on s'assure simplement que le container de connexion est visible
        document.getElementById('login-container').style.display = 'flex';
    },
    
    /**
 * Charge le tableau de bord administrateur
 */
loadAdminDashboard: function() {
    document.getElementById('login-container').style.display = 'none';
    
    // Créer le container admin s'il n'existe pas déjà
    let adminContainer = document.getElementById('admin-container');
    if (!adminContainer) {
        adminContainer = document.createElement('div');
        adminContainer.id = 'admin-container';
        adminContainer.className = 'admin-container';
        document.getElementById('app').appendChild(adminContainer);
    }
    
    // Initialiser le tableau de bord admin
    AdminDashboard.init();
},
    
    /**
 * Charge le tableau de bord professeur
 */
loadProfessorDashboard: function() {
    document.getElementById('login-container').style.display = 'none';
    
    // Créer le container professeur s'il n'existe pas déjà
    let profContainer = document.getElementById('professor-container');
    if (!profContainer) {
        profContainer = document.createElement('div');
        profContainer.id = 'professor-container';
        profContainer.className = 'professor-container';
        document.getElementById('app').appendChild(profContainer);
    }
    
    // Initialiser le tableau de bord professeur
    ProfessorDashboard.init();
},
    
    /**
     * Charge le tableau de bord étudiant
     */
    /**
 * Charge le tableau de bord étudiant
 */
loadStudentDashboard: function() {
    document.getElementById('login-container').style.display = 'none';
    
    // Créer le container étudiant s'il n'existe pas déjà
    let studentContainer = document.getElementById('student-container');
    if (!studentContainer) {
        studentContainer = document.createElement('div');
        studentContainer.id = 'student-container';
        studentContainer.className = 'student-container';
        document.getElementById('app').appendChild(studentContainer);
    }
    
    // Initialiser le tableau de bord étudiant
    StudentDashboard.init();
}
};