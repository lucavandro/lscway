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


