/**
 * Formate une date ISO en date locale sans décalage horaire
 * @param {string} dateString - Date au format ISO "YYYY-MM-DDT00:00:00+00:00"
 * @returns {string} Date formatée au format local sans décalage
 */
export const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Extraire uniquement la partie date (avant le T)
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Créer une date en UTC à midi pour éviter tout problème de décalage
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    
    return date.toLocaleDateString();
  };