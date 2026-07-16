import { userEmail } from "./stores";


function decodeGoogleJwt(token) {
    const parts = token.split(".");
    if (parts.length < 2) {
        throw new Error("Il token Google non è valido.");
    }

    const payload = parts[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);
    const normalized = decodeURIComponent(
        decoded.split("").map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`).join("")
    );

    return JSON.parse(normalized);
}

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

export async function googleAuth(credential) {
    try {
        const payload = decodeGoogleJwt(credential);

        if (!payload.email) {
            throw new Error("Non è stato possibile recuperare l'email da Google.");
        }

        if (payload.email_verified !== true) {
            throw new Error("L'email Google non è verificata.");
        }

        if (!payload.email.toLowerCase().endsWith("@lscortese.com")) {
            throw new Error("L'accesso con Google è consentito solo agli account @lscortese.com.");
        }

        userEmail.set(payload.email);

        return {
            success: true,
            message: "Accesso effettuato con Google",
            email: payload.email
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "Impossibile completare l'accesso con Google."
        };
    }
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