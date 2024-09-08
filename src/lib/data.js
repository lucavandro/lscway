export async function getData(){
    const res = await fetch(
        "https://www.liceoscientificocortese.edu.it/app/way/api.php",
        {
            mode: "cors",
        },
    );
    const data = await res.json();
    return data
}