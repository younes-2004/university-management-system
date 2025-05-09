// Gestion de l'authentification
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si l'utilisateur est déjà connecté
    const token = localStorage.getItem('token');
    if (token) {
        // Vérifier si le token est valide
        fetch('http://localhost:8080/api/auth/validate-token', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                redirectBasedOnRole();
            } else {
                // Token invalide, supprimer et rester sur la page de connexion
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        })
        .catch(error => {
            console.error('Erreur lors de la validation du token:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        });
    }
    
    // Gestion du formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            login(email, password);
        });
    }
});

// Fonction de connexion
function login(email, password) {
    const errorMessage = document.getElementById('error-message');
    
    fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Email ou mot de passe incorrect');
        }
        return response.json();
    })
    .then(data => {
        // Stocker le token et les informations utilisateur
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
            id: data.id,
            email: data.email,
            role: data.role,
            nom: data.nom,
            prenom: data.prenom
        }));
        
        // Rediriger vers la page appropriée en fonction du rôle
        redirectBasedOnRole();
    })
    .catch(error => {
        console.error('Erreur de connexion:', error);
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
    });
}

// Redirection basée sur le rôle
function redirectBasedOnRole() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    
    switch (user.role) {
        case 'STUDENT':
            window.location.href = 'student/dashboard.html';
            break;
        case 'PROFESSOR':
            window.location.href = 'professor/dashboard.html';
            break;
        case 'ADMIN':
            window.location.href = 'admin/dashboard.html';
            break;
        default:
            // En cas de rôle inconnu, déconnecter l'utilisateur
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            break;
    }
}

// Fonction de déconnexion (à utiliser dans les pages protégées)
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../login.html';
}

// Fonction pour vérifier si l'utilisateur est connecté (à utiliser dans les pages protégées)
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user) {
        window.location.href = '../login.html';
        return null;
    }
    
    return user;
}