import Possession from "./possessions/Possession";

export default class Patrimoine {
  constructor(possesseur, possessions) {
    this.possesseur = possesseur;
    this.possessions = possessions.map(
      (possession) =>
        new Possession(
          possession.possesseur,
          possession.libelle,
          possession.valeur,
          possession.dateDebut,
          possession.dateFin,
          possession.tauxAmortissement,
          possession.valeurConstante
        )
    );
  }

  getValeur(date) {
    let result = 0;
    for (const item of this.possessions) {
      result += item.getValeur(date);
    }
    return result;
  }

  addPossession(possession) {
    if (possession.possesseur !== this.possesseur) {
      console.log(
        `${possession.libelle} n'appartient pas à ${this.possesseur}`
      );
    } else {
      this.possessions.push(possession);
    }
  }

  removePossession(possession) {
    this.possessions = this.possessions.filter(
      (p) => p.libelle !== possession.libelle
    );
  }
}
