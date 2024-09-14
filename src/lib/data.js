export async function getData(fetch){
    const res = await fetch(
        "https://www.liceoscientificocortese.edu.it/app/way/api.php",
        {
            mode: "cors",
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