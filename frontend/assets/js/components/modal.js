class Modal {
  constructor() {
    this.modalContainer = null;
    this.createModalContainer();
  }

  // Créer le conteneur modal une fois
  createModalContainer() {
    // Vérifier si le conteneur existe déjà
    if (document.getElementById('modalContainer')) {
      this.modalContainer = document.getElementById('modalContainer');
      return;
    }

    // Créer le conteneur s'il n'existe pas
    this.modalContainer = document.createElement('div');
    this.modalContainer.id = 'modalContainer';
    this.modalContainer.className = 'modal-container';
    this.modalContainer.style.display = 'none';

    // Ajouter le conteneur au body
    document.body.appendChild(this.modalContainer);

    // Fermer le modal en cliquant à l'extérieur
    this.modalContainer.addEventListener('click', (e) => {
      if (e.target === this.modalContainer) {
        this.close();
      }
    });
  }

  // Ouvrir le modal avec un contenu
  open(title, content, footer = '') {
    const modalHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    `;

    this.modalContainer.innerHTML = modalHTML;
    this.modalContainer.style.display = 'flex';

    // Ajouter l'event listener pour le bouton de fermeture
    const closeBtn = this.modalContainer.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';
  }

  // Fermer le modal
  close() {
    this.modalContainer.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Créer un modal de confirmation
  confirm(message, onConfirm, onCancel = null) {
    const content = `<p>${message}</p>`;
    const footer = `
      <button id="cancelBtn" class="btn btn-secondary">Annuler</button>
      <button id="confirmBtn" class="btn btn-primary">Confirmer</button>
    `;

    this.open('Confirmation', content, footer);

    // Ajouter les event listeners pour les boutons
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    confirmBtn.addEventListener('click', () => {
      this.close();
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
    });

    cancelBtn.addEventListener('click', () => {
      this.close();
      if (typeof onCancel === 'function') {
        onCancel();
      }
    });
  }

  // Afficher un message d'alerte
  alert(title, message) {
    const content = `<p>${message}</p>`;
    const footer = `<button id="alertOkBtn" class="btn btn-primary">OK</button>`;

    this.open(title, content, footer);

    const okBtn = document.getElementById('alertOkBtn');
    okBtn.addEventListener('click', () => this.close());
  }
}

// Exporter une instance globale
const modal = new Modal();