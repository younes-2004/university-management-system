class Pagination {
  constructor(container, totalItems, itemsPerPage = 10, currentPage = 1) {
    this.container = document.getElementById(container);
    this.totalItems = totalItems;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = currentPage;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.onPageChange = null;
  }

  // Définir le callback de changement de page
  setPageChangeCallback(callback) {
    this.onPageChange = callback;
    return this;
  }

  // Mettre à jour les données
  update(totalItems, currentPage = 1) {
    this.totalItems = totalItems;
    this.currentPage = currentPage;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.render();
    return this;
  }

  // Changer de page
  goToPage(page) {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    
    this.currentPage = page;
    
    if (typeof this.onPageChange === 'function') {
      this.onPageChange(page);
    }
    
    this.render();
  }

  // Générer les liens de pagination
  render() {
    if (!this.container) {
      console.error('Container de pagination non trouvé');
      return;
    }
    
    if (this.totalPages <= 1) {
      this.container.innerHTML = '';
      return;
    }
    
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    // Bouton précédent
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Précédent';
    prevBtn.disabled = this.currentPage === 1;
    prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
    pagination.appendChild(prevBtn);
    
    // Numéros de page
    const maxPages = Math.min(5, this.totalPages);
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    const endPage = Math.min(startPage + maxPages - 1, this.totalPages);
    
    // Ajuster la page de départ si nécessaire
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    // Première page et ellipsis
    if (startPage > 1) {
      const firstPageBtn = document.createElement('button');
      firstPageBtn.textContent = '1';
      firstPageBtn.addEventListener('click', () => this.goToPage(1));
      pagination.appendChild(firstPageBtn);
      
      if (startPage > 2) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        pagination.appendChild(ellipsis);
      }
    }
    
    // Pages
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.className = i === this.currentPage ? 'active' : '';
      pageBtn.addEventListener('click', () => this.goToPage(i));
      pagination.appendChild(pageBtn);
    }
    
    // Dernière page et ellipsis
    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        pagination.appendChild(ellipsis);
      }
      
      const lastPageBtn = document.createElement('button');
      lastPageBtn.textContent = this.totalPages;
      lastPageBtn.addEventListener('click', () => this.goToPage(this.totalPages));
      pagination.appendChild(lastPageBtn);
    }
    
    // Bouton suivant
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Suivant';
    nextBtn.disabled = this.currentPage === this.totalPages;
    nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
    pagination.appendChild(nextBtn);
    
    // Mettre à jour le DOM
    this.container.innerHTML = '';
    this.container.appendChild(pagination);
  }
}