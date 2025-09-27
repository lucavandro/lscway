import { hours } from "./dateutils"

export function getPrefTeacher() {
   return localStorage.getItem("prefTeacher")
}

export function setPrefTeacher(value) {
    if(value)
        localStorage.setItem("prefTeacher", value)
}

export function getPrefClass() {
    return localStorage.getItem("prefClass")
 }
 
export function setPrefClass(value) {
     if(value)
         localStorage.setItem("prefClass", value)
}

export function getPrefClassroom() {
    return localStorage.getItem("prefClassroom")
 }
 
export function setPrefClassroom(value) {
     if(value)
         localStorage.setItem("prefClassroom", value)
}


export function getDataByHourIndex(data, hour){
    data.filter( e=> e.ora === hours[i])
}

// Funzione per validare l'email
export function validateEmail(email) {
  return email && typeof email === 'string' && email.endsWith('@lscortese.com');
}

// Funzione per ottenere la data odierna in formato YYYY-MM-DD
export function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Funzione per confrontare le date
export function isDateBefore(date1, date2) {
  return new Date(date1) < new Date(date2);
}


export    const inclusioneInFondo = (a, b) => a.materia === "INC" ? 1 : -1

