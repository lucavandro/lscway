<script>
    import { onMount } from "svelte";
    // PWA prompt
    let deferredPrompt;
    let installButtonVisible = false;

    onMount(() => {
        if ("deferredInstallPrompt" in window) {
            console.log("👍 deferredInstallPrompt found");
            deferredPrompt = window.deferredInstallPrompt;
            installButtonVisible = true;
        } else if ("BeforeInstallPromptEvent" in window) {
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
            installButtonVisible = false;
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
    <button on:click={installApp} class="outline contrast"> Installa </button>
{/if}

<style>
</style>
