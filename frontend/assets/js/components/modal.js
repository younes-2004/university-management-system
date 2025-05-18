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

  // Ouvrir le modal avec un contenu (version améliorée avec support pour les classes CSS)
  open(title, content, footer = '', modalClass = '') {
    const modalHTML = `
      <div class="modal ${modalClass}">
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
    
    // Ajouter un event listener pour fermer avec Escape
    this.handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.handleEscapeKey);
  }

  // Fermer le modal
  close() {
    this.modalContainer.style.display = 'none';
    document.body.style.overflow = '';
    
    // Supprimer l'event listener pour Escape
    if (this.handleEscapeKey) {
      document.removeEventListener('keydown', this.handleEscapeKey);
      this.handleEscapeKey = null;
    }
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

  // Modal de succès
  success(title, message) {
    const content = `
      <div style="text-align: center; padding: 20px;">
        <i class="fas fa-check-circle" style="font-size: 48px; color: var(--color-success); margin-bottom: 16px;"></i>
        <p>${message}</p>
      </div>
    `;
    const footer = `<button id="successOkBtn" class="btn btn-success">OK</button>`;

    this.open(title, content, footer);

    const okBtn = document.getElementById('successOkBtn');
    okBtn.addEventListener('click', () => this.close());
  }

  // Modal d'erreur
  error(title, message) {
    const content = `
      <div style="text-align: center; padding: 20px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--color-error); margin-bottom: 16px;"></i>
        <p>${message}</p>
      </div>
    `;
    const footer = `<button id="errorOkBtn" class="btn btn-danger">OK</button>`;

    this.open(title, content, footer);

    const okBtn = document.getElementById('errorOkBtn');
    okBtn.addEventListener('click', () => this.close());
  }

  // Modal d'information
  info(title, message) {
    const content = `
      <div style="text-align: center; padding: 20px;">
        <i class="fas fa-info-circle" style="font-size: 48px; color: var(--color-info); margin-bottom: 16px;"></i>
        <p>${message}</p>
      </div>
    `;
    const footer = `<button id="infoOkBtn" class="btn btn-info">OK</button>`;

    this.open(title, content, footer);

    const okBtn = document.getElementById('infoOkBtn');
    okBtn.addEventListener('click', () => this.close());
  }

  // Modal de chargement
  loading(title, message) {
    const content = `
      <div style="text-align: center; padding: 40px;">
        <div class="loading-spinner" style="width: 40px; height: 40px; margin: 0 auto 20px;"></div>
        <p>${message}</p>
      </div>
    `;

    this.open(title, content, ''); // Pas de footer pour le modal de chargement
    
    // Empêcher la fermeture par Escape ou clic extérieur
    document.removeEventListener('keydown', this.handleEscapeKey);
    this.modalContainer.removeEventListener('click', this.handleOutsideClick);
  }

  // Méthode pour mettre à jour le contenu d'un modal existant
  updateContent(newContent) {
    const modalBody = this.modalContainer.querySelector('.modal-body');
    if (modalBody) {
      modalBody.innerHTML = newContent;
    }
  }

  // Méthode pour changer le titre d'un modal existant
  updateTitle(newTitle) {
    const modalTitle = this.modalContainer.querySelector('.modal-header h2');
    if (modalTitle) {
      modalTitle.textContent = newTitle;
    }
  }

  // Méthode pour vérifier si un modal est ouvert
  isOpen() {
    return this.modalContainer && this.modalContainer.style.display === 'flex';
  }

  // Méthode pour obtenir l'élément modal actuel
  getModalElement() {
    return this.modalContainer.querySelector('.modal');
  }

  // Méthode pour ajouter une classe au modal
  addClass(className) {
    const modal = this.getModalElement();
    if (modal) {
      modal.classList.add(className);
    }
  }

  // Méthode pour supprimer une classe du modal
  removeClass(className) {
    const modal = this.getModalElement();
    if (modal) {
      modal.classList.remove(className);
    }
  }
}

// Exporter une instance globale
const modal = new Modal();