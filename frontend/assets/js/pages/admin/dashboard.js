document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'accès admin
  if (!authGuard.checkAccess(['ADMIN'])) {
    return;
  }

  // Références des éléments DOM
  const studentCountElement = document.getElementById('studentCount');
  const professorCountElement = document.getElementById('professorCount');
  const filiereCountElement = document.getElementById('filiereCount');
  const cardRequestCountElement = document.getElementById('cardRequestCount');
  const recentCardRequestsElement = document.getElementById('recentCardRequests');

  // Charger les données du tableau de bord
  loadDashboardData();
  loadRecentCardRequests();

  // Fonction pour charger les statistiques du tableau de bord
  // Modifions loadDashboardData pour ajouter les graphiques
async function loadDashboardData() {
  try {
    const dashboardStats = await adminService.getDashboardStats();
    
    if (!dashboardStats) {
      showError('Erreur lors du chargement des statistiques');
      return;
    }
    
    // Mettre à jour les compteurs
    studentCountElement.textContent = dashboardStats.totalStudents;
    professorCountElement.textContent = dashboardStats.totalProfessors;
    filiereCountElement.textContent = dashboardStats.totalFilieres;
    cardRequestCountElement.textContent = dashboardStats.pendingCardRequests;
    
    // Créer les graphiques
    createStudentsChart(dashboardStats);
    createCardRequestsChart(dashboardStats);
    
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error);
    showError('Erreur lors du chargement des statistiques');
  }
}

  // Fonction pour charger les demandes de carte récentes
  async function loadRecentCardRequests() {
    try {
      const cardRequests = await cardService.getPendingCardRequests();
      
      if (!cardRequests || cardRequests.length === 0) {
        recentCardRequestsElement.innerHTML = `
          <p>Aucune demande de carte en attente</p>
        `;
        return;
      }
      
      // Afficher les 5 demandes les plus récentes
      const recentRequests = cardRequests.slice(0, 5);
      
      recentCardRequestsElement.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Étudiant</th>
                <th>N° Apogée</th>
                <th>Date de demande</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${recentRequests.map(request => `
                <tr>
                  <td>${request.id}</td>
                  <td>${escapeHtml(request.studentName)}</td>
                  <td>${escapeHtml(request.studentId)}</td>
                  <td>${formatDate(request.requestDate)}</td>
                  <td class="actions">
                    <button class="btn-sm btn-success approve-request" data-id="${request.id}">
                      <i class="fas fa-check"></i> Approuver
                    </button>
                    <button class="btn-sm btn-danger reject-request" data-id="${request.id}">
                      <i class="fas fa-times"></i> Rejeter
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${cardRequests.length > 5 ? `
          <div class="view-all-link mt-3">
            <a href="cards.html" class="btn btn-outline-primary">
              <i class="fas fa-list"></i> Voir toutes les demandes (${cardRequests.length})
            </a>
          </div>
        ` : ''}
      `;
      
      // Ajouter les event listeners aux boutons d'actions
      document.querySelectorAll('.approve-request').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id'));
          approveCardRequest(id);
        });
      });
      
      document.querySelectorAll('.reject-request').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id'));
          rejectCardRequest(id);
        });
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement des demandes de carte:', error);
      recentCardRequestsElement.innerHTML = `
        <p class="error-message">Erreur lors du chargement des demandes de carte</p>
      `;
    }
  }

  // Fonction pour approuver une demande de carte
  async function approveCardRequest(requestId) {
    try {
      await cardService.approveCardRequest(requestId);
      showNotification('Demande approuvée avec succès', 'success');
      
      // Recharger les données
      loadDashboardData();
      loadRecentCardRequests();
    } catch (error) {
      console.error('Erreur lors de l\'approbation de la demande:', error);
      showError('Erreur lors de l\'approbation de la demande');
    }
  }

  // Fonction pour rejeter une demande de carte
  async function rejectCardRequest(requestId) {
    try {
      await cardService.rejectCardRequest(requestId);
      showNotification('Demande rejetée avec succès', 'success');
      
      // Recharger les données
      loadDashboardData();
      loadRecentCardRequests();
    } catch (error) {
      console.error('Erreur lors du rejet de la demande:', error);
      showError('Erreur lors du rejet de la demande');
    }
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
// Ajoutez cela à la fin du bloc DOMContentLoaded, après les fonctions existantes

// Fonction pour créer un graphique des statistiques des étudiants
function createStudentsChart(stats) {
  const ctx = document.getElementById('studentsChart').getContext('2d');
  
  // Créer un graphique en camembert
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Actifs', 'Suspendus', 'Arrêtés'],
      datasets: [{
        data: [
          stats.activeStudents,
          stats.suspendedStudents,
          stats.totalStudents - (stats.activeStudents + stats.suspendedStudents)
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)', // Vert pour actifs
          'rgba(245, 158, 11, 0.7)',  // Orange pour suspendus
          'rgba(239, 68, 68, 0.7)'    // Rouge pour arrêtés
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Répartition des étudiants par statut'
        }
      }
    }
  });
}

// Fonction pour créer un graphique des demandes de carte
function createCardRequestsChart(stats) {
  const ctx = document.getElementById('cardRequestsChart').getContext('2d');
  
  // Créer un graphique en barres
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['En attente', 'Approuvées', 'Rejetées', 'Reçues'],
      datasets: [{
        label: 'Nombre de demandes',
        data: [
          stats.pendingCardRequests,
          stats.approvedCardRequests,
          stats.rejectedCardRequests,
          stats.receivedCardRequests
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',  // Bleu pour en attente
          'rgba(16, 185, 129, 0.7)',  // Vert pour approuvées
          'rgba(239, 68, 68, 0.7)',   // Rouge pour rejetées
          'rgba(107, 114, 128, 0.7)'  // Gris pour reçues
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Statistiques des demandes de carte'
        }
      }
    }
  });
}