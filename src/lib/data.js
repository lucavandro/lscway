export async function getData(fetch){
    const res = await fetch(
        "https://www.liceoscientificocortese.edu.it/app/way/api.php",
        {
            mode: "cors",
            cache: 'no-cache',
        },
    );
    const data = await res.json();
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