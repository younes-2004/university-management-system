document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'accès admin
  if (!authGuard.checkAccess(['ADMIN'])) {
    return;
  }

  // Références des éléments DOM
  const studentsTableBody = document.getElementById('studentsTableBody');
  const addStudentBtn = document.getElementById('addStudentBtn');
  const importStudentsBtn = document.getElementById('importStudentsBtn');
  const filiereFilter = document.getElementById('filiereFilter');
  const anneeFilter = document.getElementById('anneeFilter');
  const searchInput = document.getElementById('searchInput');
  const paginationContainer = document.getElementById('pagination');

  // Variables d'état
  let students = [];
  let filteredStudents = [];
  let filieres = [];
  let currentPage = 1;
  const itemsPerPage = 10;
  let editingStudentId = null;

  // Initialiser la pagination
  const pagination = new Pagination('pagination', 0, itemsPerPage);
  pagination.setPageChangeCallback(page => {
    currentPage = page;
    renderStudents();
  });

  // Charger les données au chargement de la page
  loadStudents();
  loadFilieres();

  // Event listeners
  addStudentBtn.addEventListener('click', () => showStudentForm());
  importStudentsBtn.addEventListener('click', () => showImportForm());
  
  // Event listeners pour les filtres
  filiereFilter.addEventListener('change', applyFilters);
  anneeFilter.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', debounce(applyFilters, 300));

  // Fonction pour charger les étudiants
  async function loadStudents() {
    try {
      showLoading();
      students = await studentService.getAllStudents();
      filteredStudents = [...students];
      pagination.update(filteredStudents.length);
      renderStudents();
    } catch (error) {
      showError('Erreur lors du chargement des étudiants');
      console.error('Erreur:', error);
    }
  }

  // Fonction pour charger les filières
  async function loadFilieres() {
    try {
      filieres = await filiereService.getAllFilieres();
      renderFiliereOptions();
    } catch (error) {
      console.error('Erreur lors du chargement des filières:', error);
    }
  }

  // Fonction pour afficher l'état de chargement
  function showLoading() {
    studentsTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center">
          <div class="loading-spinner"></div>
          Chargement des étudiants...
        </td>
      </tr>
    `;
  }

  // Fonction pour remplir le sélecteur de filières
  function renderFiliereOptions() {
    let options = '<option value="">Toutes les filières</option>';
    
    filieres.forEach(filiere => {
      options += `<option value="${filiere.id}">${escapeHtml(filiere.nom)}</option>`;
    });
    
    filiereFilter.innerHTML = options;
  }

  // Fonction pour formater une date (YYYY-MM-DD → DD/MM/YYYY)
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  // Fonction pour convertir une date (DD/MM/YYYY → YYYY-MM-DD)
  function convertDateToISO(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }

  // Fonction pour obtenir le nom de la filière
  function getFiliereName(filiereId) {
    const filiere = filieres.find(f => f.id === filiereId);
    return filiere ? filiere.nom : 'Inconnue';
  }

  // Fonction pour afficher les étudiants dans le tableau
  function renderStudents() {
    if (!filteredStudents || filteredStudents.length === 0) {
      studentsTableBody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center">Aucun étudiant trouvé.</td>
        </tr>
      `;
      return;
    }

    // Calculer les indices pour la pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredStudents.length);
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

    studentsTableBody.innerHTML = paginatedStudents.map(student => `
      <tr>
        <td>${student.id}</td>
        <td>${escapeHtml(student.nApogee || '')}</td>
        <td>${escapeHtml(student.nom)}</td>
        <td>${escapeHtml(student.prenom)}</td>
        <td>${escapeHtml(student.email)}</td>
        <td>${student.filiereId ? escapeHtml(getFiliereName(student.filiereId)) : 'Non assignée'}</td>
        <td>${student.annee ? (student.annee === 'PREMIERE_ANNEE' ? '1ère année' : '2ème année') : ''}</td>
        <td><span class="status-badge ${getStatusClass(student.statut)}">${formatStatus(student.statut)}</span></td>
        <td class="actions">
          <button class="btn-icon view-student" data-id="${student.id}" title="Voir détails">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-icon edit-student" data-id="${student.id}" title="Modifier">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon delete-student" data-id="${student.id}" title="Supprimer">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // Ajouter les event listeners aux boutons d'action
    document.querySelectorAll('.view-student').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        viewStudent(id);
      });
    });

    document.querySelectorAll('.edit-student').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        editStudent(id);
      });
    });

    document.querySelectorAll('.delete-student').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        confirmDeleteStudent(id);
      });
    });
  }

  // Fonction pour appliquer les filtres
  function applyFilters() {
    const filiereId = filiereFilter.value ? parseInt(filiereFilter.value) : null;
    const annee = anneeFilter.value;
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    filteredStudents = students.filter(student => {
      // Filtre par filière
      if (filiereId && student.filiereId !== filiereId) {
        return false;
      }
      
      // Filtre par année
      if (annee && student.annee !== annee) {
        return false;
      }
      
      // Filtre par recherche (nom, prénom, email, numéro apogée)
      if (searchTerm) {
        return (
          (student.nom && student.nom.toLowerCase().includes(searchTerm)) ||
          (student.prenom && student.prenom.toLowerCase().includes(searchTerm)) ||
          (student.email && student.email.toLowerCase().includes(searchTerm)) ||
          (student.nApogee && student.nApogee.toLowerCase().includes(searchTerm))
        );
      }
      
      return true;
    });
    
    // Reset pagination to first page
    currentPage = 1;
    pagination.update(filteredStudents.length, currentPage);
    
    renderStudents();
  }

  // Fonction pour formater le statut
  function formatStatus(status) {
    if (!status) return 'Inconnu';
    
    switch (status) {
      case 'ACTIF': return 'Actif';
      case 'SUSPENDU': return 'Suspendu';
      case 'ARRETE': return 'Arrêté';
      default: return status;
    }
  }

  // Fonction pour obtenir la classe CSS du statut
  function getStatusClass(status) {
    if (!status) return '';
    
    switch (status) {
      case 'ACTIF': return 'status-active';
      case 'SUSPENDU': return 'status-suspended';
      case 'ARRETE': return 'status-stopped';
      default: return '';
    }
  }

  // Fonction pour afficher les détails d'un étudiant
  async function viewStudent(id) {
    try {
      const student = await studentService.getStudentById(id);
      if (!student) {
        showError('Étudiant non trouvé');
        return;
      }
      
      const filiereName = student.filiereId ? getFiliereName(student.filiereId) : 'Non assignée';
      
      const content = `
        <div class="student-details">
          <div class="student-header">
            <div class="student-avatar">
              <i class="fas fa-user-graduate"></i>
            </div>
            <div class="student-name">
              <h3>${escapeHtml(student.nom)} ${escapeHtml(student.prenom)}</h3>
              <p class="student-id">N° Apogée: ${escapeHtml(student.nApogee || '')}</p>
            </div>
          </div>
          
          <div class="student-info">
            <div class="info-group">
              <label>Email:</label>
              <p>${escapeHtml(student.email)}</p>
            </div>
            
            <div class="info-group">
              <label>Date de naissance:</label>
              <p>${formatDate(student.dateNaissance)}</p>
            </div>
            
            <div class="info-group">
              <label>Filière:</label>
              <p>${escapeHtml(filiereName)}</p>
            </div>
            
            <div class="info-group">
              <label>Année:</label>
              <p>${student.annee === 'PREMIERE_ANNEE' ? '1ère année' : '2ème année'}</p>
            </div>
            
            <div class="info-group">
              <label>Statut:</label>
              <p><span class="status-badge ${getStatusClass(student.statut)}">${formatStatus(student.statut)}</span></p>
            </div>
          </div>
        </div>
      `;
      
      modal.open(
        'Détails de l\'étudiant',
        content,
        '<button type="button" class="btn btn-secondary" id="closeBtn">Fermer</button>'
      );
      
      document.getElementById('closeBtn').addEventListener('click', () => modal.close());
      
    } catch (error) {
      showError('Erreur lors de la récupération des détails de l\'étudiant');
      console.error('Erreur:', error);
    }
  }

  // Fonction pour afficher le formulaire d'ajout/édition d'étudiant
  async function showStudentForm(student = null) {
    editingStudentId = student ? student.id : null;
    
    const title = student ? 'Modifier l\'étudiant' : 'Ajouter un étudiant';
    
    // Préparer la date au format YYYY-MM-DD pour l'input date
    let birthDate = '';
    if (student && student.dateNaissance) {
      birthDate = new Date(student.dateNaissance).toISOString().split('T')[0];
    }
    
    const content = `
      <form id="studentForm">
        <div class="form-group">
          <label for="nom">Nom <span class="required">*</span></label>
          <input type="text" id="nom" name="nom" required value="${student ? escapeHtml(student.nom) : ''}">
        </div>
        
        <div class="form-group">
          <label for="prenom">Prénom <span class="required">*</span></label>
          <input type="text" id="prenom" name="prenom" required value="${student ? escapeHtml(student.prenom) : ''}">
        </div>
        
        <div class="form-group">
          <label for="nApogee">N° Apogée <span class="required">*</span></label>
          <input type="text" id="nApogee" name="nApogee" required value="${student ? escapeHtml(student.nApogee || '') : ''}">
        </div>
        
        <div class="form-group">
          <label for="email">Email <span class="required">*</span></label>
          <input type="email" id="email" name="email" required value="${student ? escapeHtml(student.email) : ''}">
        </div>
        
        <div class="form-group">
          <label for="dateNaissance">Date de naissance <span class="required">*</span></label>
          <input type="date" id="dateNaissance" name="dateNaissance" required value="${birthDate}">
        </div>
        
        <div class="form-group">
          <label for="filiereId">Filière <span class="required">*</span></label>
          <select id="filiereId" name="filiereId" required>
            <option value="">Sélectionner une filière</option>
            ${filieres.map(filiere => `
              <option value="${filiere.id}" ${student && student.filiereId === filiere.id ? 'selected' : ''}>
                ${escapeHtml(filiere.nom)}
              </option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label for="annee">Année <span class="required">*</span></label>
          <select id="annee" name="annee" required>
            <option value="">Sélectionner une année</option>
            <option value="PREMIERE_ANNEE" ${student && student.annee === 'PREMIERE_ANNEE' ? 'selected' : ''}>1ère année</option>
            <option value="DEUXIEME_ANNEE" ${student && student.annee === 'DEUXIEME_ANNEE' ? 'selected' : ''}>2ème année</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="statut">Statut <span class="required">*</span></label>
          <select id="statut" name="statut" required>
            <option value="">Sélectionner un statut</option>
            <option value="ACTIF" ${student && student.statut === 'ACTIF' ? 'selected' : ''}>Actif</option>
            <option value="SUSPENDU" ${student && student.statut === 'SUSPENDU' ? 'selected' : ''}>Suspendu</option>
            <option value="ARRETE" ${student && student.statut === 'ARRETE' ? 'selected' : ''}>Arrêté</option>
          </select>
        </div>
        
        ${!student ? `
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
    document.getElementById('saveBtn').addEventListener('click', saveStudent);
  }

  // Fonction pour éditer un étudiant
  async function editStudent(id) {
    try {
      const student = await studentService.getStudentById(id);
      if (student) {
        showStudentForm(student);
      } else {
        showError('Étudiant non trouvé');
      }
    } catch (error) {
      showError('Erreur lors de la récupération de l\'étudiant');
      console.error('Erreur:', error);
    }
  }

  // Fonction pour enregistrer un étudiant (création ou mise à jour)
  async function saveStudent() {
    const nom = document.getElementById('nom').value.trim();
    const prenom = document.getElementById('prenom').value.trim();
    const nApogee = document.getElementById('nApogee').value.trim();
    const email = document.getElementById('email').value.trim();
    const dateNaissance = document.getElementById('dateNaissance').value;
    const filiereId = document.getElementById('filiereId').value;
    const annee = document.getElementById('annee').value;
    const statut = document.getElementById('statut').value;
    const formError = document.getElementById('formError');
    
    // Validation
    if (!nom || !prenom || !nApogee || !email || !dateNaissance || !filiereId || !annee || !statut) {
      formError.textContent = 'Tous les champs sont obligatoires';
      formError.style.display = 'block';
      return;
    }
    
    const studentData = {
      nom,
      prenom,
      nApogee,
      email,
      dateNaissance,
      filiereId: parseInt(filiereId),
      annee,
      statut,
      role: 'STUDENT'
    };
    
    try {
      if (editingStudentId) {
        // Mise à jour
        await studentService.updateStudent(editingStudentId, studentData);
        showNotification('Étudiant mis à jour avec succès', 'success');
      } else {
        // Création - récupérer le mot de passe
        const password = document.getElementById('password').value;
        if (!password) {
          formError.textContent = 'Le mot de passe est obligatoire';
          formError.style.display = 'block';
          return;
        }
        
        await studentService.createStudent(studentData, password);
        showNotification('Étudiant créé avec succès', 'success');
      }
      
      // Fermer le modal et recharger les étudiants
      modal.close();
      loadStudents();
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

  // Fonction pour confirmer la suppression d'un étudiant
  function confirmDeleteStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    modal.confirm(
      `Êtes-vous sûr de vouloir supprimer l'étudiant "${student.nom} ${student.prenom}" ? Cette action est irréversible.`,
      () => deleteStudent(id)
    );
  }

  // Fonction pour supprimer un étudiant
  async function deleteStudent(id) {
    try {
      await studentService.deleteStudent(id);
      showNotification('Étudiant supprimé avec succès', 'success');
      loadStudents();
    } catch (error) {
      let errorMessage = 'Erreur lors de la suppression';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, 'error');
      console.error('Erreur:', error);
    }
  }

  // Fonction pour afficher le formulaire d'importation
  function showImportForm() {
    const content = `
      <form id="importForm">
        <p>Importez des étudiants à partir d'un fichier Excel (.xlsx).</p>
        <p class="mb-3">Le fichier doit contenir les colonnes suivantes : Numéro Apogée, Nom, Prénom, Email, Date de naissance (JJ/MM/AAAA), Année (1 ou 2)</p>
        
        <div class="form-group">
          <label for="filiereSelect">Filière <span class="required">*</span></label>
          <select id="filiereSelect" class="form-control" required>
            <option value="">Sélectionner une filière</option>
            ${filieres.map(filiere => `
              <option value="${filiere.id}">${escapeHtml(filiere.nom)}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label for="excelFile">Fichier Excel <span class="required">*</span></label>
          <input type="file" id="excelFile" name="excelFile" accept=".xlsx, .xls" required>
        </div>
        
        <div id="formError" class="error-message"></div>
      </form>
    `;
    
    const footer = `
      <button type="button" class="btn btn-secondary" id="cancelBtn">Annuler</button>
      <button type="button" class="btn btn-primary" id="importBtn">Importer</button>
    `;
    
    modal.open('Importer des étudiants', content, footer);
    
    // Ajouter les event listeners
    document.getElementById('cancelBtn').addEventListener('click', () => modal.close());
    document.getElementById('importBtn').addEventListener('click', importStudents);
  }

  // Fonction pour importer des étudiants
  async function importStudents() {
    const filiereSelect = document.getElementById('filiereSelect');
    const excelFile = document.getElementById('excelFile');
    const formError = document.getElementById('formError');
    
    // Validation
    if (!filiereSelect.value) {
      formError.textContent = 'Veuillez sélectionner une filière';
      formError.style.display = 'block';
      return;
    }
    
    if (!excelFile.files || excelFile.files.length === 0) {
      formError.textContent = 'Veuillez sélectionner un fichier Excel';
      formError.style.display = 'block';
      return;
    }
    
    const filiereId = parseInt(filiereSelect.value);
    const file = excelFile.files[0];
    
    // Vérifier le type de fichier
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      formError.textContent = 'Le fichier doit être au format Excel (.xlsx, .xls)';
      formError.style.display = 'block';
      return;
    }
    
    try {
      // Remplacer le bouton d'importation par un indicateur de chargement
      const importBtn = document.getElementById('importBtn');
      importBtn.disabled = true;
      importBtn.innerHTML = '<span class="loading-spinner small"></span> Importation...';
      
      const result = await studentService.importStudentsFromExcel(filiereId, file);
      
      modal.close();
      showNotification(`${result.length} étudiants importés avec succès`, 'success');
      
      // Recharger la liste des étudiants
      loadStudents();
    } catch (error) {
      let errorMessage = 'Erreur lors de l\'importation';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      formError.textContent = errorMessage;
      formError.style.display = 'block';
      console.error('Erreur:', error);
      
      // Réactiver le bouton
      const importBtn = document.getElementById('importBtn');
      importBtn.disabled = false;
      importBtn.textContent = 'Importer';
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

  // Fonction de debounce pour limiter les appels fréquents
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
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