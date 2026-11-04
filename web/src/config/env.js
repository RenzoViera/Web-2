const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error('Falta la variable de entorno VITE_API_URL (ver .env.example).');
}

export const env = Object.freeze({
  apiUrl,
  isDev: import.meta.env.DEV,
});
