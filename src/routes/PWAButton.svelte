<script>
    import { onMount } from "svelte";
    import downloadIcon from "$lib/images/icons/download-square.svg";
    // PWA prompt
    let deferredPrompt;
    let installButtonVisible = true;

    onMount(() => {
        if ("BeforeInstallPromptEvent" in window) {
            console.log(
                "⏳ BeforeInstallPromptEvent supported but not fired yet",
            );
        } else {
            console.log("❌ BeforeInstallPromptEvent NOT supported");
        }

        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installButtonVisible = true;
            console.log("✅ BeforeInstallPromptEvent fired", true);
        });

        window.addEventListener("appinstalled", (e) => {
            console.log("✅ AppInstalled fired", true);
            installButtonVisible = false
        });
    });

    async function installApp() {
        console.log("installApp button clicked");
        if (deferredPrompt) {
            deferredPrompt.prompt();
            console.log("🆗 Installation Dialog opened");
            // Find out whether the user confirmed the installation or not
            const { outcome } = await deferredPrompt.userChoice;
            // The deferredPrompt can only be used once.
            deferredPrompt = null;
            // Act on the user's choice
            if (outcome === "accepted") {
                console.log("😀 User accepted the install prompt.", true);
                // Hide the install button
                installButtonVisible = false;
            } else if (outcome === "dismissed") {
                console.log("😟 User dismissed the install prompt");
            }
           
        }
    }
</script>

{#if installButtonVisible}
    <button on:click={installApp} class="outline contrast"
        ><img src={downloadIcon} alt="" srcset="" /> Installa </button
    >
{/if}

<style>
  
</style>
