export const weekdays = ["LUN", "MAR", "MER", "GIO", "VEN"];
export const hours = ["08:00", "08:55", "09:50", "10:45", "11:40", "12:35", "13:30", "14:25"]; // Aggiunta l'ora "14:15" come ultima lezione

// Funzione di supporto per convertire "HH:MM" in minuti dalla mezzanotte
const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
};

export function getHourNum() {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const defaultDuration = 60; // Durata di default dell'ultima lezione (in minuti)

    // Trova l'indice dell'ora di lezione in cui rientra l'orario attuale
    const index = hours.findIndex((startTime, i) => {
        const start = timeToMinutes(startTime);
        
        // La lezione finisce all'inizio della successiva,
        // oppure dopo 'defaultDuration' minuti se è l'ultima nell'array
        const end = (i < hours.length - 1) 
            ? timeToMinutes(hours[i + 1]) 
            : start + defaultDuration;

        return currentMin >= start && currentMin < end;
    });

    // Se trova la fascia restituisce l'ora di lezione (1-based: 1, 2, 3...), altrimenti 0
    return index !== -1 ? index + 1 : 0;
}

export function getHour(){
        return getHourNum() > 0 ? hours[getHourNum()-1] : hours[0]
}

export function getDay(){
    return weekdays[ new Date().getDay() - 1 ] || "DOM"
}

export function getSchoolHour() {
    const hourNum = getHourNum()
    const lessonHourList = ["Fuori orario", "Prima ora", "Seconda ora", "Terza ora", "Quarta ora", "Quinta ora", "Sesta ora", "Settima ora"]
    return lessonHourList[hourNum];
}

