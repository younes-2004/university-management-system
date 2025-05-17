class DataTable {
  constructor(containerId, columns) {
    this.container = document.getElementById(containerId);
    this.columns = columns;
    this.data = [];
    this.currentPage = 1;
    this.itemsPerPage = 10;
  }

  // Définir les données
  setData(data) {
    this.data = data;
    this.render();
  }

  // Créer le tableau HTML
  render() {
    // Vider le conteneur
    this.container.innerHTML = '';
    
    // Créer le tableau
    const table = document.createElement('table');
    table.className = 'data-table';
    
    // Créer l'en-tête
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    this.columns.forEach(column => {
      const th = document.createElement('th');
      th.textContent = column.header;
      if (column.width) th.style.width = column.width;
      headerRow.appendChild(th);
    });
    
    // Ajouter colonne d'actions si nécessaire
    if (this.hasActions()) {
      const actionsTh = document.createElement('th');
      actionsTh.textContent = 'Actions';
      headerRow.appendChild(actionsTh);
    }
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Créer le corps du tableau
    const tbody = document.createElement('tbody');
    
    // Calculer les indices pour la pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.data.length);
    
    // Afficher les données paginées
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.data[i];
      const row = document.createElement('tr');
      
      // Ajouter les cellules de données
      this.columns.forEach(column => {
        const td = document.createElement('td');
        if (column.render) {
          // Utiliser la fonction de rendu personnalisée
          td.innerHTML = column.render(item);
        } else {
          // Afficher la valeur directement
          td.textContent = item[column.field] || '';
        }
        row.appendChild(td);
      });
      
      // Ajouter les actions
      if (this.hasActions()) {
        const actionsTd = document.createElement('td');
        actionsTd.className = 'actions';
        
        if (this.editAction) {
          const editBtn = document.createElement('button');
          editBtn.className = 'btn-edit';
          editBtn.innerHTML = '<i class="fas fa-edit"></i>';
          editBtn.addEventListener('click', () => this.editAction(item));
          actionsTd.appendChild(editBtn);
        }
        
        if (this.deleteAction) {
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'btn-delete';
          deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
          deleteBtn.addEventListener('click', () => this.deleteAction(item));
          actionsTd.appendChild(deleteBtn);
        }
        
        if (this.customActions) {
          this.customActions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = action.className || 'btn-custom';
            btn.innerHTML = action.icon || action.label;
            btn.addEventListener('click', () => action.handler(item));
            actionsTd.appendChild(btn);
          });
        }
        
        row.appendChild(actionsTd);
      }
      
      tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
    this.container.appendChild(table);
    
    // Ajouter la pagination si nécessaire
    if (this.data.length > this.itemsPerPage) {
      this.renderPagination();
    }
  }

  // Vérifier si le tableau a des actions
  hasActions() {
    return this.editAction || this.deleteAction || (this.customActions && this.customActions.length > 0);
  }

  // Définir l'action d'édition
  onEdit(callback) {
    this.editAction = callback;
    return this;
  }

  // Définir l'action de suppression
  onDelete(callback) {
    this.deleteAction = callback;
    return this;
  }

  // Ajouter des actions personnalisées
  addCustomAction(action) {
    if (!this.customActions) this.customActions = [];
    this.customActions.push(action);
    return this;
  }

  // Créer la pagination
  renderPagination() {
    const totalPages = Math.ceil(this.data.length / this.itemsPerPage);
    
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    // Bouton précédent
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Précédent';
    prevBtn.disabled = this.currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.render();
      }
    });
    pagination.appendChild(prevBtn);
    
    // Numéros de page
    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.className = i === this.currentPage ? 'active' : '';
      pageBtn.addEventListener('click', () => {
        this.currentPage = i;
        this.render();
      });
      pagination.appendChild(pageBtn);
    }
    
    // Bouton suivant
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Suivant';
    nextBtn.disabled = this.currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.render();
      }
    });
    pagination.appendChild(nextBtn);
    
    this.container.appendChild(pagination);
  }
}