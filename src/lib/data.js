import { userEmail } from "./stores";

export async function getData(fetch){
    const res = await fetch(
        "https://www.liceoscientificocortese.edu.it/app/way/api.php",
        {
            mode: "cors",
            cache: 'no-cache',
        },
    );
    const data = await res.json();
    console.log("User data:", data.user);
    if(data.user){
        userEmail.set(data.user);
    }
    data.classi = data.classi.filter(e=> !e.includes(".") && !e.includes("*"))
    data.data = data.data.map(e=>{
        if(e.classe.includes(".")){
            e.classe = e.classe.replace(".", "")
        } else if(e.classe.includes("*")){
            e.classe = e.classe.replace("*", "")
            if(!e.aula)
                e.aula = "-"
        }
        return e
    })
    

    return data
}

export async function auth(email) {
    const res = await fetch(
        "https://www.liceoscientificocortese.edu.it/app/way/auth.php",
        {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: email })
        }
    );

    const data = await res.json();
    return data;
}

export async function confirm(email, code) {
    const res = await fetch(
        "https://www.liceoscientificocortese.edu.it/app/way/auth.php",
        {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: email, code: code })
        }
    );

    const data = await res.json();
    if(data.success){
        userEmail.set(email);
    }
    return data;
}

export async function requestLogout() {
    const res = await fetch(
        "https://www.liceoscientificocortese.edu.it/app/way/auth.php",
        {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ action: "logout" })
        }
    );

    const data = await res.json();
    if(data.success){
        userEmail.set(null);
    }
    return data;
}

export async function inviaConfermaSostituzione(id){
    const res = await fetch(
        `https://www.liceoscientificocortese.edu.it/app/way/docenti_sostituzioni_api.php`,
        {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: id }),
        },
        
    );

    const data = await res.json();
    return data;
}