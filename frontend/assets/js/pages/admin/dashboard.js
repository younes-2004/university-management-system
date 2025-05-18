document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'accès admin
  if (!authGuard.checkAccess(['ADMIN'])) {
    return;
  }

  // Références des éléments DOM (supprimé recentCardRequestsElement)
  const studentCountElement = document.getElementById('studentCount');
  const professorCountElement = document.getElementById('professorCount');
  const filiereCountElement = document.getElementById('filiereCount');
  
  // Nouvelles références pour les statistiques des cartes
  const studentsWithCardCountElement = document.getElementById('studentsWithCardCount');
  const studentsWithoutCardCountElement = document.getElementById('studentsWithoutCardCount');
  
  // Nouvelles références pour les statistiques des utilisateurs
  const totalStudentsCountElement = document.getElementById('totalStudentsCount');
  const totalProfessorsCountElement = document.getElementById('totalProfessorsCount');
  const totalAdminsCountElement = document.getElementById('totalAdminsCount');

  // Charger les données du tableau de bord (supprimé loadRecentCardRequests())
  loadDashboardData();
  loadCardStatistics();

  // Fonction pour charger les statistiques du tableau de bord
  async function loadDashboardData() {
    try {
      const dashboardStats = await adminService.getDashboardStats();
      
      if (!dashboardStats) {
        showError('Erreur lors du chargement des statistiques');
        return;
      }
      
      // Mettre à jour les compteurs principaux
      studentCountElement.textContent = dashboardStats.totalStudents;
      professorCountElement.textContent = dashboardStats.totalProfessors;
      filiereCountElement.textContent = dashboardStats.totalFilieres;
      
      // Mettre à jour les statistiques des utilisateurs
      totalStudentsCountElement.textContent = dashboardStats.totalStudents;
      totalProfessorsCountElement.textContent = dashboardStats.totalProfessors;
      totalAdminsCountElement.textContent = dashboardStats.totalAdmins || 0;
      
      // Créer les graphiques
      createStudentsChart(dashboardStats);
      createCardRequestsChart(dashboardStats);
      
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      showError('Erreur lors du chargement des statistiques');
    }
  }

  // Fonction corrigée pour charger les statistiques des cartes
  async function loadCardStatistics() {
    try {
      console.log('🔄 Chargement des statistiques des cartes...');
      
      // Récupérer tous les étudiants
      const students = await httpClient.get('/admin/students');
      console.log('📊 Étudiants récupérés:', students);
      
      if (!students || students.length === 0) {
        console.log('❌ Aucun étudiant trouvé');
        studentsWithCardCountElement.textContent = '0';
        studentsWithoutCardCountElement.textContent = '0';
        return;
      }
      
      // Récupérer les statuts de carte pour tous les étudiants
      const studentIds = students.map(student => student.id);
      const cardStatuses = await cardService.getBulkCardStatus(studentIds);
      
      // Créer un Map pour accès rapide
      const statusMap = new Map();
      if (cardStatuses && Array.isArray(cardStatuses)) {
        cardStatuses.forEach(status => {
          statusMap.set(status.studentId, status.status);
        });
      }
      
      let studentsWithCard = 0;
      let studentsWithoutCard = 0;
      
      students.forEach(student => {
        const cardStatus = statusMap.get(student.id);
        
        // Un étudiant "a sa carte" si le statut est 'RECEIVED'
        if (cardStatus === 'RECEIVED') {
          studentsWithCard++;
        } else {
          studentsWithoutCard++;
        }
      });
      
      console.log(`📈 Résultat final: ${studentsWithCard} avec carte, ${studentsWithoutCard} sans carte`);
      
      // Mettre à jour les éléments
      studentsWithCardCountElement.textContent = studentsWithCard;
      studentsWithoutCardCountElement.textContent = studentsWithoutCard;
      
      // Créer le graphique circulaire des cartes
      createCardsStatusChart({
        withCard: studentsWithCard,
        withoutCard: studentsWithoutCard
      });
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques des cartes:', error);
      studentsWithCardCountElement.textContent = '0';
      studentsWithoutCardCountElement.textContent = '0';
    }
  }

  // Fonction pour créer un graphique des statistiques des étudiants
  function createStudentsChart(stats) {
    const ctx = document.getElementById('studentsChart');
    if (!ctx) return;
    
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Actifs', 'Suspendus', 'Arrêtés'],
        datasets: [{
          data: [
            stats.activeStudents || 0,
            stats.suspendedStudents || 0,
            (stats.totalStudents || 0) - ((stats.activeStudents || 0) + (stats.suspendedStudents || 0))
          ],
          backgroundColor: [
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(239, 68, 68, 0.7)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          }
        }
      }
    });
  }

  // Fonction pour créer un graphique des demandes de carte
  function createCardRequestsChart(stats) {
    const ctx = document.getElementById('cardRequestsChart');
    if (!ctx) return;
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['En attente', 'Approuvées', 'Rejetées', 'Reçues'],
        datasets: [{
          label: 'Nombre de demandes',
          data: [
            stats.pendingCardRequests || 0,
            stats.approvedCardRequests || 0,
            stats.rejectedCardRequests || 0,
            stats.receivedCardRequests || 0
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(107, 114, 128, 0.7)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  // Fonction pour créer le graphique circulaire des cartes
  function createCardsStatusChart(data) {
    const ctx = document.getElementById('cardsStatusChart');
    if (!ctx) return;
    
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Étudiants avec carte', 'Étudiants sans carte'],
        datasets: [{
          data: [data.withCard, data.withoutCard],
          backgroundColor: [
            'rgba(16, 185, 129, 0.7)', // Vert pour avec carte
            'rgba(245, 158, 11, 0.7)'   // Orange pour sans carte
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          }
        }
      }
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