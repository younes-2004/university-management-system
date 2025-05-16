 
/**
 * Service pour la gestion des modales
 */
const Modal = {
    /**
     * Crée et affiche une modale
     * @param {string} title - Titre de la modale
     * @param {string} content - Contenu HTML de la modale
     * @param {Object} options - Options supplémentaires
     * @returns {HTMLElement} - L'élément DOM de la modale
     */
    show: function(title, content, options = {}) {
        // Créer la structure de la modale
        const modalId = 'modal-' + Date.now();
        const modalHTML = `
            <div class="modal-backdrop" id="${modalId}-backdrop">
                <div class="modal-container" id="${modalId}-container">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button type="button" class="modal-close" data-action="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        ${options.footer || ''}
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter la modale au document
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Récupérer les éléments de la modale
        const modalBackdrop = document.getElementById(`${modalId}-backdrop`);
        const modalContainer = document.getElementById(`${modalId}-container`);
        const closeButton = modalContainer.querySelector('.modal-close');
        
        // Configurer l'événement de fermeture
        closeButton.addEventListener('click', () => {
            this.close(modalId);
            if (options.onClose) options.onClose();
        });
        
        // Fermer la modale quand on clique sur le backdrop
        modalBackdrop.addEventListener('click', (event) => {
            if (event.target === modalBackdrop && options.closeOnBackdrop !== false) {
                this.close(modalId);
                if (options.onClose) options.onClose();
            }
        });
        
        // Appeler le callback onOpen si spécifié
        if (options.onOpen) {
            options.onOpen(modalContainer);
        }
        
        return {
            id: modalId,
            element: modalContainer
        };
    },
    
    /**
     * Ferme une modale
     * @param {string} modalId - ID de la modale à fermer
     */
    close: function(modalId) {
        const modalBackdrop = document.getElementById(`${modalId}-backdrop`);
        if (modalBackdrop) {
            modalBackdrop.remove();
        }
    },
    
    /**
     * Affiche une modale de confirmation
     * @param {string} title - Titre de la confirmation
     * @param {string} message - Message de confirmation
     * @param {Function} onConfirm - Fonction à exécuter si confirmé
     * @param {Function} onCancel - Fonction à exécuter si annulé
     */
    confirm: function(title, message, onConfirm, onCancel = null) {
        const content = `<p>${message}</p>`;
        const footer = `
            <button type="button" class="btn btn-secondary" data-action="cancel-modal">Annuler</button>
            <button type="button" class="btn btn-danger" data-action="confirm-modal">Confirmer</button>
        `;
        
        const modal = this.show(title, content, { 
            footer,
            onOpen: (modalElement) => {
                const confirmButton = modalElement.querySelector('[data-action="confirm-modal"]');
                const cancelButton = modalElement.querySelector('[data-action="cancel-modal"]');
                
                confirmButton.addEventListener('click', () => {
                    this.close(modal.id);
                    if (onConfirm) onConfirm();
                });
                
                cancelButton.addEventListener('click', () => {
                    this.close(modal.id);
                    if (onCancel) onCancel();
                });
            }
        });
    },
    
    /**
     * Affiche une modale d'alerte
     * @param {string} title - Titre de l'alerte
     * @param {string} message - Message d'alerte
     * @param {Function} onClose - Fonction à exécuter à la fermeture
     */
    alert: function(title, message, onClose = null) {
        const content = `<p>${message}</p>`;
        const footer = `<button type="button" class="btn btn-primary" data-action="close-alert">OK</button>`;
        
        const modal = this.show(title, content, { 
            footer,
            onOpen: (modalElement) => {
                const okButton = modalElement.querySelector('[data-action="close-alert"]');
                
                okButton.addEventListener('click', () => {
                    this.close(modal.id);
                    if (onClose) onClose();
                });
            }
        });
    }
};