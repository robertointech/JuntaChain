// index.ts
import { ethers } from "ethers";
document.addEventListener("DOMContentLoaded", async () => {
    console.log("✅ index.js cargado correctamente");
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const crearJuntaBtn = document.getElementById("crear-junta-btn");
    const walletInfo = document.getElementById("walletInfo");
    const walletAddressSpan = document.getElementById("walletAddress");
    const walletBalanceSpan = document.getElementById("walletBalance");
    const walletCollateralSpan = document.getElementById("walletCollateral");
    const menu = document.getElementById("menu");
    const provider = window.ethereum;
    // 🔹 Solo Rainbow Wallet
    if (!provider || !provider.isRainbow) {
        alert("⚠️ Abre esta página desde Rainbow Wallet.");
        return;
    }
    console.log("🌈 Rainbow Wallet detectada ✅");
    connectWalletBtn.style.display = "inline-block";
    // ⚙️ Actualizar UI de wallet
    async function updateWalletUI(account, colateral = 0) {
        if (!account) {
            walletInfo.style.display = "none";
            menu.style.display = "none";
            crearJuntaBtn.disabled = true;
            walletAddressSpan.textContent = "";
            walletBalanceSpan.textContent = "0";
            walletCollateralSpan.textContent = "0";
            return;
        }
        walletInfo.style.display = "block";
        menu.style.display = "block";
        crearJuntaBtn.disabled = false;
        walletAddressSpan.textContent = account;
        try {
            if (!provider)
                return;
            const ethersProvider = new ethers.BrowserProvider(provider);
            const balanceWei = await ethersProvider.getBalance(account);
            const balanceEth = parseFloat(ethers.formatEther(balanceWei)).toFixed(4);
            walletBalanceSpan.textContent = balanceEth;
            // Mostrar colateral si existe, sino 0
            walletCollateralSpan.textContent = parseFloat(colateral.toString()).toFixed(4);
        }
        catch (e) {
            console.error("❌ Error al obtener saldo:", e);
            walletBalanceSpan.textContent = "0";
            walletCollateralSpan.textContent = "0";
        }
    }
    // 🔗 Conectar Rainbow Wallet
    connectWalletBtn.addEventListener("click", async () => {
        try {
            if (!provider)
                return;
            const accounts = await provider.request({ method: "eth_requestAccounts" });
            if (accounts.length > 0) {
                // Inicialmente colateral = 0
                await updateWalletUI(accounts[0], 0);
            }
        }
        catch (error) {
            console.error("❌ Error al conectar Rainbow:", error);
            alert("No se pudo conectar con Rainbow Wallet.");
        }
    });
    // 🧩 Redireccionar a crear_junta
    crearJuntaBtn.addEventListener("click", () => {
        const url = crearJuntaBtn.dataset.url;
        if (url) {
            window.location.href = url;
        }
    });
    // 👂 Detectar cambios de cuenta
    if (provider) {
        provider.on("accountsChanged", async (accounts) => {
            if (accounts.length === 0) {
                console.log("🔒 Wallet desconectada");
                await updateWalletUI(null, 0);
            }
            else {
                await updateWalletUI(accounts[0], 0);
            }
        });
        // 👂 Detectar cambios de red
        provider.on("chainChanged", async (chainId) => {
            console.log("🔄 Red cambiada:", chainId);
            alert("⚠️ Red cambiada. Mantente en Scroll Sepolia para continuar.");
            await updateWalletUI(null, 0);
        });
    }
});
