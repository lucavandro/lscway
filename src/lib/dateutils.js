export const weekdays = ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", 'DOM'];
export const hours = ["08:15", "09:15", "10:15", "11:15", "12:15", "13:15"];

export function getOraNum() {
    const now = new Date();
    const ore = now.getHours();
    const minuti = now.getMinutes();
    const secondi = now.getSeconds();

    // Converti l'ora attuale in minuti dall'inizio della giornata
    const minutiTotali = ore * 60 + minuti + secondi / 60;

    if (minutiTotali >= 8 * 60 + 15 && minutiTotali < 9 * 60 + 15) {
        return 1;
    } else if (minutiTotali >= 9 * 60 + 15 && minutiTotali < 10 * 60 + 15) {
        return 2;
    } else if (minutiTotali >= 10 * 60 + 15 && minutiTotali < 11 * 60 + 15) {
        return 3;
    } else if (minutiTotali >= 11 * 60 + 15 && minutiTotali < 12 * 60 + 15) {
        return 4;
    } else if (minutiTotali >= 12 * 60 + 15 && minutiTotali < 13 * 60 + 15) {
        return 5;
    } else if (minutiTotali >= 13 * 60 + 15 && minutiTotali < 14 * 60 + 15) {
        return 6;
    } else {
        return 0;
    }
}

export function getOra(){
        return getOraNum() > 0 ? hours[getOraNum()-1] : hours[0]
}

export function getDay(){
    return "LUN"
    return weekdays[ new Date().getDay() - 1 ] || "DOM"
}

export function getOraScolastica() {
    const oraNum = getOraNum()
    const oreLezione = ["Fuori orario", "Prima ora", "Seconda ora", "Terza ora", "Quarta ora", "Quinta ora", "Sesta ora"]
    return oreLezione[oraNum];
}

