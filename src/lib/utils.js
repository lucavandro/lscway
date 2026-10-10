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

// Funzione per validare l'email
export function validateEmail(email) {
  return Boolean(email && typeof email === 'string' && email.endsWith('@lscortese.com'));
}

// Funzione per ottenere la data odierna in formato YYYY-MM-DD
export function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export const inclusioneInFondo = (a, b) => {
  const isA = a.materia === "INC" || a.materia === "MADISO";
  const isB = b.materia === "INC" || b.materia === "MADISO";
  if (isA && !isB) return 1;
  if (!isA && isB) return -1;
  return 0;
};
