export const weekdays = ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", 'DOM'];
export const hours = ["08:15", "09:15", "10:15", "11:15", "12:15", "13:15"];

export function getHourNum() {
    const now = new Date();
    const hours = now.getHours();
    const min = now.getMinutes();
    const sec = now.getSeconds();

    // Convert  current hour in min elapsed since the first lesson hour
    const totalMin = hours * 60 + min + sec / 60;
    if (totalMin >= 8 * 60 + 15 && totalMin < 9 * 60 + 15) {
        return 1;
    } else if (totalMin >= 9 * 60 + 15 && totalMin < 10 * 60 + 15) {
        return 2;
    } else if (totalMin >= 10 * 60 + 15 && totalMin < 11 * 60 + 15) {
        return 3;
    } else if (totalMin >= 11 * 60 + 15 && totalMin < 12 * 60 + 15) {
        return 4;
    } else if (totalMin >= 12 * 60 + 15 && totalMin < 13 * 60 + 15) {
        return 5;
    } else if (totalMin >= 13 * 60 + 15 && totalMin < 14 * 60 + 15) {
        return 6;
    } else {
        return 0;
    }
}

export function getHour(){
        return getHourNum() > 0 ? hours[getHourNum()-1] : hours[0]
}

export function getDay(){
    return weekdays[ new Date().getDay() - 1 ] || "DOM"
}

export function getSchoolHour() {
    const hourNum = getHourNum()
    const lessonHourList = ["Fuori orario", "Prima ora", "Seconda ora", "Terza ora", "Quarta ora", "Quinta ora", "Sesta ora"]
    return lessonHourList[hourNum];
}

