
export default class Possession {
  constructor(possesseur, libelle, valeur, dateDebut, dateFin, tauxAmortissement, valeurConstante) {
    this.possesseur = possesseur;
    this.libelle = libelle;
    this.valeur = valeur;
    this.dateDebut = new Date(dateDebut);
    this.dateFin = dateFin ? new Date(dateFin) : null;
    this.tauxAmortissement = tauxAmortissement;
    this.valeurConstante = valeurConstante;
    this.jour = null;
  }

  getValeur(date) {
    return this.getValeurApresAmortissement(date);
  }

  getValeurApresAmortissement(dateActuelle) {
    const date = new Date(dateActuelle);
    const dateDebut = this.dateDebut;
    const dateFin = this.dateFin ? this.dateFin : date;

    if (date < dateDebut) return 0;

    if (this.valeurConstante) {
      let moisDepuisDebut =
        (date.getFullYear() - dateDebut.getFullYear()) * 12 +
        (date.getMonth() - dateDebut.getMonth());

      if (moisDepuisDebut === 0 && date.getDate() < dateDebut.getDate()) {
        return 0;
      }

      if (moisDepuisDebut === 0 && date.getDate() >= dateDebut.getDate()) {
        moisDepuisDebut = 1;
        return 0;
      }
      const valeurTotal = moisDepuisDebut * this.valeurConstante;
      return valeurTotal;
    } else {
      const tauxAmortissement = this.tauxAmortissement
        ? this.tauxAmortissement / 100
        : 0;
      const valeurInitiale = this.valeur;

      const joursDepuisDebut = Math.max(
        (date - dateDebut) / (1000 * 60 * 60 * 24),
        0
      );
      const joursTotal = (dateFin - dateDebut) / (1000 * 60 * 60 * 24);

      const valeurActuelle =
        valeurInitiale *
        Math.pow(1 - tauxAmortissement / 365, joursDepuisDebut);
      return Math.max(valeurActuelle, 0);
    }
  }
}
