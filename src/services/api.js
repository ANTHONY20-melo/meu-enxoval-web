const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

export async function createCheckout(
  checkoutData
) {
  const response = await fetch(
    `${API_URL}/api/checkout`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify(
        checkoutData
      )
    }
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
      "Erro ao iniciar pagamento."
    );
  }

  return result;
}