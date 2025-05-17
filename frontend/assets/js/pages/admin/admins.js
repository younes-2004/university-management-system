document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'accès admin
  if (!authGuard.checkAccess(['ADMIN'])) {
    return;
  }

  // Références des éléments DOM
  const adminsTableBody = document.getElementById('adminsTableBody');
  const addAdminBtn = document.getElementById('addAdminBtn');

  // Variables d'état
  let admins = [];
  let editingAdminId = null;

  // Charger les administrateurs au chargement de la page
  loadAdmins();

  // Event listener pour le bouton d'ajout
  addAdminBtn.addEventListener('click', () => showAdminForm());

  // Fonction pour charger les administrateurs
  async function loadAdmins() {
    try {
      showLoading();
      admins = await adminService.getAllAdmins();
      renderAdmins();
    } catch (error) {
      showError('Erreur lors du chargement des administrateurs');
      console.error('Erreur:', error);
    }
  }

  // Fonction pour afficher l'état de chargement
  function showLoading() {
    adminsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          <div class="loading-spinner"></div>
          Chargement des administrateurs...
        </td>
      </tr>
    `;
  }

  // Fonction pour formater une date (YYYY-MM-DD → DD/MM/YYYY)
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  // Fonction pour afficher les administrateurs dans le tableau
  function renderAdmins() {
    if (!admins || admins.length === 0) {
      adminsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">Aucun administrateur trouvé.</td>
        </tr>
      `;
      return;
    }

    adminsTableBody.innerHTML = admins.map(admin => `
      <tr>
        <td>${admin.id}</td>
        <td>${escapeHtml(admin.nom)}</td>
        <td>${escapeHtml(admin.prenom)}</td>
        <td>${escapeHtml(admin.email)}</td>
        <td>${formatDate(admin.dateNaissance)}</td>
        <td class="actions">
          <button class="btn-icon edit-admin" data-id="${admin.id}" title="Modifier">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon delete-admin" data-id="${admin.id}" title="Supprimer">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // Ajouter les event listeners aux boutons d'action
    document.querySelectorAll('.edit-admin').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        editAdmin(id);
      });
    });

    document.querySelectorAll('.delete-admin').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        confirmDeleteAdmin(id);
      });
    });
  }

  // Fonction pour afficher le formulaire d'ajout/édition d'administrateur
  function showAdminForm(admin = null) {
    editingAdminId = admin ? admin.id : null;
    
    const title = admin ? 'Modifier l\'administrateur' : 'Ajouter un administrateur';
    
    // Préparer la date au format YYYY-MM-DD pour l'input date
    let birthDate = '';
    if (admin && admin.dateNaissance) {
      birthDate = new Date(admin.dateNaissance).toISOString().split('T')[0];
    }
    
    const content = `
      <form id="adminForm">
        <div class="form-group">
          <label for="nom">Nom <span class="required">*</span></label>
          <input type="text" id="nom" name="nom" required value="${admin ? escapeHtml(admin.nom) : ''}">
        </div>
        
        <div class="form-group">
          <label for="prenom">Prénom <span class="required">*</span></label>
          <input type="text" id="prenom" name="prenom" required value="${admin ? escapeHtml(admin.prenom) : ''}">
        </div>
        
        <div class="form-group">
          <label for="email">Email <span class="required">*</span></label>
          <input type="email" id="email" name="email" required value="${admin ? escapeHtml(admin.email) : ''}">
        </div>
        
        <div class="form-group">
          <label for="dateNaissance">Date de naissance <span class="required">*</span></label>
          <input type="date" id="dateNaissance" name="dateNaissance" required value="${birthDate}">
        </div>
        
        ${!admin ? `
        <div class="form-group">
          <label for="password">Mot de passe <span class="required">*</span></label>
          <input type="password" id="password" name="password" required>
        </div>
        ` : ''}
        
        <div id="formError" class="error-message"></div>
      </form>
    `;
    
    const footer = `
      <button type="button" class="btn btn-secondary" id="cancelBtn">Annuler</button>
      <button type="button" class="btn btn-primary" id="saveBtn">Enregistrer</button>
    `;
    
    modal.open(title, content, footer);
    
    // Ajouter les event listeners
    document.getElementById('cancelBtn').addEventListener('click', () => modal.close());
    document.getElementById('saveBtn').addEventListener('click', saveAdmin);
  }

  // Fonction pour éditer un administrateur
  async function editAdmin(id) {
    try {
      const admin = await adminService.getAdminById(id);
      if (admin) {
        showAdminForm(admin);
      } else {
        showError('Administrateur non trouvé');
      }
    } catch (error) {
      showError('Erreur lors de la récupération de l\'administrateur');
      console.error('Erreur:', error);
    }
  }

  // Fonction pour enregistrer un administrateur (création ou mise à jour)
  async function saveAdmin() {
    const nom = document.getElementById('nom').value.trim();
    const prenom = document.getElementById('prenom').value.trim();
    const email = document.getElementById('email').value.trim();
    const dateNaissance = document.getElementById('dateNaissance').value;
    const formError = document.getElementById('formError');
    
    // Validation
    if (!nom || !prenom || !email || !dateNaissance) {
      formError.textContent = 'Tous les champs sont obligatoires';
      formError.style.display = 'block';
      return;
    }
    
    const adminData = {
      nom,
      prenom,
      email,
      dateNaissance,
      role: 'ADMIN'
    };
    
    try {
      if (editingAdminId) {
        // Mise à jour
        await adminService.updateAdmin(editingAdminId, adminData);
        showNotification('Administrateur mis à jour avec succès', 'success');
      } else {
        // Création - récupérer le mot de passe
        const password = document.getElementById('password').value;
        if (!password) {
          formError.textContent = 'Le mot de passe est obligatoire';
          formError.style.display = 'block';
          return;
        }
        
        await adminService.createAdmin(adminData, password);
        showNotification('Administrateur créé avec succès', 'success');
      }
      
      // Fermer le modal et recharger les administrateurs
      modal.close();
      loadAdmins();
    } catch (error) {
      let errorMessage = 'Une erreur est survenue';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      formError.textContent = errorMessage;
      formError.style.display = 'block';
      console.error('Erreur:', error);
    }
  }

  // Fonction pour confirmer la suppression d'un administrateur
  function confirmDeleteAdmin(id) {
    const admin = admins.find(a => a.id === id);
    if (!admin) return;
    
    modal.confirm(
      `Êtes-vous sûr de vouloir supprimer l'administrateur "${admin.nom} ${admin.prenom}" ? Cette action est irréversible.`,
      () => deleteAdmin(id)
    );
  }

  // Fonction pour supprimer un administrateur
  async function deleteAdmin(id) {
    try {
      await adminService.deleteAdmin(id);
      showNotification('Administrateur supprimé avec succès', 'success');
      loadAdmins();
    } catch (error) {
      let errorMessage = 'Erreur lors de la suppression';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, 'error');
      console.error('Erreur:', error);
    }
  }

  // Fonction pour afficher les notifications
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Supprimer la notification après 3 secondes
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Fonction pour afficher les erreurs
  function showError(message) {
    showNotification(message, 'error');
  }

  // Fonction d'échappement HTML pour éviter les injections XSS
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});