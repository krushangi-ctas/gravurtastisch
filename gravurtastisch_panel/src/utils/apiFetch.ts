export const baseBackendApiUrl =
	(import.meta?.env?.VITE_API_BACKEND_BASE_URL as string) ||
	(import.meta?.env?.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/v1` : '') ||
	'http://localhost:7051/v1';









