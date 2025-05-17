document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'accès admin
  if (!authGuard.checkAccess(['ADMIN'])) {
    return;
  }

  // Références des éléments DOM
  const cardRequestsTableBody = document.getElementById('cardRequestsTableBody');
  const statusFilter = document.getElementById('statusFilter');
  const filiereFilter = document.getElementById('filiereFilter');
  const searchInput = document.getElementById('searchInput');
  const paginationContainer = document.getElementById('pagination');

  // Variables d'état
  let cardRequests = [];
  let filteredRequests = [];
  let filieres = [];
  let currentPage = 1;
  const itemsPerPage = 10;

  // Initialiser la pagination
  const pagination = new Pagination('pagination', 0, itemsPerPage);
  pagination.setPageChangeCallback(page => {
    currentPage = page;
    renderCardRequests();
  });

  // Charger les données au chargement de la page
  loadCardRequests();
  loadFilieres();

  // Event listeners pour les filtres
  statusFilter.addEventListener('change', applyFilters);
  filiereFilter.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', debounce(applyFilters, 300));

  // Fonction pour charger les demandes de carte
  async function loadCardRequests() {
    try {
      showLoading();
      cardRequests = await cardService.getPendingCardRequests();
      filteredRequests = [...cardRequests];
      pagination.update(filteredRequests.length);
      renderCardRequests();
    } catch (error) {
      showError('Erreur lors du chargement des demandes de carte');
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
    cardRequestsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">
          <div class="loading-spinner"></div>
          Chargement des demandes...
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

  // Fonction pour formater une date
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Fonction pour obtenir le nom de la filière
  function getFiliereName(filiereId) {
    const filiere = filieres.find(f => f.getId() === filiereId);
    return filiere ? filiere.getNom() : 'Inconnue';
  }

  // Fonction pour afficher les demandes dans le tableau
  function renderCardRequests() {
    if (!filteredRequests || filteredRequests.length === 0) {
      cardRequestsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">Aucune demande trouvée.</td>
        </tr>
      `;
      return;
    }

    // Calculer les indices pour la pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredRequests.length);
    const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

    cardRequestsTableBody.innerHTML = paginatedRequests.map(request => {
      const student = request.student || {};
      const statusClass = getStatusClass(request.status);
      const statusText = formatStatus(request.status);
      const filiereText = getFiliereName(student.filiereId);

      return `
        <tr>
          <td>${request.id}</td>
          <td>${escapeHtml(student.nom || '')} ${escapeHtml(student.prenom || '')}</td>
          <td>${escapeHtml(student.nApogee || '')}</td>
          <td>${escapeHtml(filiereText)}</td>
          <td>${formatDate(request.requestDate)}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td class="actions">
            ${request.status === 'PENDING' ? `
              <button class="btn-sm btn-success approve-request" data-id="${request.id}" title="Approuver">
                <i class="fas fa-check"></i> Approuver
              </button>
              <button class="btn-sm btn-danger reject-request" data-id="${request.id}" title="Rejeter">
                <i class="fas fa-times"></i> Rejeter
              </button>
            ` : `
              <button class="btn-sm btn-info view-request" data-id="${request.id}" title="Voir détails">
                <i class="fas fa-eye"></i> Détails
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');

    // Ajouter les event listeners aux boutons d'action
    document.querySelectorAll('.approve-request').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        confirmApproveRequest(id);
      });
    });

    document.querySelectorAll('.reject-request').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        confirmRejectRequest(id);
      });
    });

    document.querySelectorAll('.view-request').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        viewRequestDetails(id);
      });
    });
  }

  // Fonction pour appliquer les filtres
  function applyFilters() {
    const status = statusFilter.value;
    const filiereId = filiereFilter.value ? parseInt(filiereFilter.value) : null;
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    filteredRequests = cardRequests.filter(request => {
      const student = request.student || {};
      
      // Filtre par statut
      if (status && request.status !== status) {
        return false;
      }
      
      // Filtre par filière
      if (filiereId && student.filiereId !== filiereId) {
        return false;
      }
      
      // Filtre par recherche (nom, prénom, numéro apogée)
      if (searchTerm) {
        return (
          (student.nom && student.nom.toLowerCase().includes(searchTerm)) ||
          (student.prenom && student.prenom.toLowerCase().includes(searchTerm)) ||
          (student.nApogee && student.nApogee.toLowerCase().includes(searchTerm))
        );
      }
      
      return true;
    });
    
    // Reset pagination to first page
    currentPage = 1;
    pagination.update(filteredRequests.length, currentPage);
    
    renderCardRequests();
  }

  // Fonction pour formater le statut
  function formatStatus(status) {
    if (!status) return 'Inconnu';
    
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'APPROVED': return 'Approuvée';
      case 'REJECTED': return 'Rejetée';
      case 'RECEIVED': return 'Reçue';
      default: return status;
    }
  }

  // Fonction pour obtenir la classe CSS du statut
  function getStatusClass(status) {
    if (!status) return '';
    
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'RECEIVED': return 'status-received';
      default: return '';
    }
  }

  // Fonction pour confirmer l'approbation d'une demande
  function confirmApproveRequest(id) {
    modal.confirm(
      'Êtes-vous sûr de vouloir approuver cette demande de carte ?',
      () => approveRequest(id)
    );
  }

  // Fonction pour approuver une demande
  async function approveRequest(id) {
    try {
      await cardService.approveCardRequest(id);
      showNotification('Demande approuvée avec succès', 'success');
      loadCardRequests();
    } catch (error) {
      showError('Erreur lors de l\'approbation de la demande');
      console.error('Erreur:', error);
    }
  }

  // Fonction pour confirmer le rejet d'une demande
  function confirmRejectRequest(id) {
    modal.confirm(
      'Êtes-vous sûr de vouloir rejeter cette demande de carte ?',
      () => rejectRequest(id)
    );
  }

  // Fonction pour rejeter une demande
  async function rejectRequest(id) {
    try {
      await cardService.rejectCardRequest(id);
      showNotification('Demande rejetée avec succès', 'success');
      loadCardRequests();
    } catch (error) {
      showError('Erreur lors du rejet de la demande');
      console.error('Erreur:', error);
    }
  }

  // Fonction pour voir les détails d'une demande
  function viewRequestDetails(id) {
    const request = cardRequests.find(r => r.id === id);
    if (!request) {
      showError('Demande non trouvée');
      return;
    }

    const student = request.student || {};
    const filiereText = getFiliereName(student.filiereId);
    
    const content = `
      <div class="request-details">
        <div class="detail-section">
          <h3>Informations de l'étudiant</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Nom complet:</span>
              <span class="detail-value">${escapeHtml(student.nom || '')} ${escapeHtml(student.prenom || '')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">N° Apogée:</span>
              <span class="detail-value">${escapeHtml(student.nApogee || '')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email:</span>
              <span class="detail-value">${escapeHtml(student.email || '')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Filière:</span>
              <span class="detail-value">${escapeHtml(filiereText)}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h3>Informations de la demande</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Date de demande:</span>
              <span class="detail-value">${formatDate(request.requestDate)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Statut:</span>
              <span class="detail-value status-badge ${getStatusClass(request.status)}">${formatStatus(request.status)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date de traitement:</span>
              <span class="detail-value">${request.processedDate ? formatDate(request.processedDate) : 'Non traité'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Traité par:</span>
              <span class="detail-value">${request.processedByName || 'Non traité'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date de réception:</span>
              <span class="detail-value">${request.receivedDate ? formatDate(request.receivedDate) : 'Non reçue'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    modal.open('Détails de la demande', content);
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