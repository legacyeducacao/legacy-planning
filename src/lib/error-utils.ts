/**
 * Utilitários pra tratar e formatar erros user-facing
 */

export interface NetworkError {
  isNetworkError: boolean
  userMessage: string
  originalError: unknown
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("Failed to fetch")
    )
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes("network") ||
      message.includes("connection") ||
      message.includes("offline") ||
      message.includes("timeout") ||
      message.includes("enotfound") ||
      message.includes("econnrefused")
    )
  }

  return false
}

export function getUserFriendlyErrorMessage(error: unknown): NetworkError {
  if (isNetworkError(error)) {
    return {
      isNetworkError: true,
      userMessage:
        "Conexão com a internet caiu. Verifica tua rede e tenta de novo.",
      originalError: error,
    }
  }

  if (error instanceof Response) {
    if (error.status >= 500 && error.status < 600) {
      return {
        isNetworkError: false,
        userMessage:
          "Os servidores estão com problema. Tenta de novo daqui a pouco.",
        originalError: error,
      }
    }
    if (error.status === 429) {
      return {
        isNetworkError: false,
        userMessage: "Muitas requisições. Espera um pouco e tenta de novo.",
        originalError: error,
      }
    }
    if (error.status === 413) {
      return {
        isNetworkError: false,
        userMessage:
          "O arquivo de áudio é grande demais. Tenta um arquivo menor.",
        originalError: error,
      }
    }
  }

  if (error instanceof Error) {
    const message = error.message

    if (message.includes("413") || message.includes("too large")) {
      return {
        isNetworkError: false,
        userMessage:
          "O arquivo de áudio é grande demais. Tenta um arquivo menor.",
        originalError: error,
      }
    }

    if (message.includes("429") || message.includes("rate limit")) {
      return {
        isNetworkError: false,
        userMessage: "Muitas requisições. Espera um pouco e tenta de novo.",
        originalError: error,
      }
    }

    if (
      message.includes("500") ||
      message.includes("502") ||
      message.includes("503")
    ) {
      return {
        isNetworkError: false,
        userMessage:
          "Os servidores estão com problema. Tenta de novo daqui a pouco.",
        originalError: error,
      }
    }

    if (message && !message.includes("Error:") && message.length < 150) {
      return {
        isNetworkError: false,
        userMessage: message,
        originalError: error,
      }
    }
  }

  return {
    isNetworkError: false,
    userMessage:
      "Algo deu errado. Tenta de novo ou entra em contato com o suporte se persistir.",
    originalError: error,
  }
}

export async function fetchWithNetworkErrorHandling(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  try {
    const response = await fetch(url, options)
    return response
  } catch (error) {
    if (isNetworkError(error)) {
      throw new Error(
        "Conexão com a internet caiu. Verifica tua rede e tenta de novo.",
      )
    }
    throw error
  }
}
