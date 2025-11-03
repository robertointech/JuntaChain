// crear_junta.ts
import { ethers } from "ethers";

// Tipos
interface CoinGeckoResponse {
  ethereum: {
    usd: number;
  };
}

interface DjangoResponse {
  success: boolean;
  redirect_url?: string;
}

// Extender el objeto Window para incluir ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

document.addEventListener("DOMContentLoaded", async (): Promise<void> => {
  const form = document.getElementById("formCrearJunta") as HTMLFormElement;
  const inputDireccion = document.querySelector(
    "input[name='direccion_organizador']"
  ) as HTMLInputElement;
  const inputAporte = document.querySelector(
    "input[name='cantidad_aporte']"
  ) as HTMLInputElement;
  const resultado = document.getElementById("resultado") as HTMLElement;
  const btnCrear = form.querySelector(
    "button[type='submit']"
  ) as HTMLButtonElement;

  // Mostrar valor USD estimado
  const labelUSD = document.createElement("span");
  labelUSD.style.marginLeft = "10px";
  labelUSD.style.fontWeight = "bold";
  labelUSD.style.color = "#2a9d8f";
  inputAporte.insertAdjacentElement("afterend", labelUSD);

  // ==================== CONEXIÓN WALLET SOLO PARA SABER DIRECCIÓN ====================
  if (!window.ethereum) {
    alert("⚠️ Abre esta página desde Rainbow Wallet o MetaMask.");
    btnCrear.disabled = true;
    return;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  inputDireccion.value = address;
  console.log("✅ Wallet conectada:", address);

  // ==================== PRECIO DE ETH ====================
  async function obtenerPrecioETH(): Promise<number> {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      const data: CoinGeckoResponse = await res.json();
      return data.ethereum.usd;
    } catch {
      labelUSD.textContent = "Error obteniendo precio 😢";
      return 0;
    }
  }

  const precioETH: number = await obtenerPrecioETH();

  inputAporte.addEventListener("input", (): void => {
    const eth = parseFloat(inputAporte.value);
    if (!isNaN(eth) && eth > 0) {
      const usd = eth * precioETH;
      labelUSD.textContent = `≈ $${usd.toFixed(2)} USD`;
    } else {
      labelUSD.textContent = "";
    }
  });

  // ==================== SUBMIT ====================
  form.addEventListener("submit", async (e: Event): Promise<void> => {
    e.preventDefault();
    const cantidadETH = parseFloat(inputAporte.value);
    
    if (isNaN(cantidadETH) || cantidadETH <= 0) {
      alert("Ingresa un valor válido de ETH.");
      return;
    }

    const cantidadUSD = cantidadETH * precioETH;
    if (cantidadUSD < 50 || cantidadUSD > 200) {
      alert(
        `❌ El aporte debe equivaler entre $50 y $200 USD. Tu monto actual: ${cantidadUSD.toFixed(2)} USD.`
      );
      return;
    }

    btnCrear.disabled = true;
    resultado.innerHTML = "⏳ Creando junta...";

    try {
      // Guardar en Django (sin blockchain)
      const formData = new FormData(form);
      // Dejar contract_address vacío
      formData.append("contract_address", "");

      const response = await fetch("", {
        method: "POST",
        body: formData,
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });

      const data: DjangoResponse = await response.json();
      
      if (data.success) {
        resultado.innerHTML = `✅ Junta creada correctamente.`;
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
        }
      } else {
        resultado.innerHTML = "❌ Error guardando en servidor.";
      }
    } catch (err) {
      console.error("Error al crear junta:", err);
      resultado.innerHTML = "❌ Falló la creación.";
    } finally {
      btnCrear.disabled = false;
    }
  });
});





