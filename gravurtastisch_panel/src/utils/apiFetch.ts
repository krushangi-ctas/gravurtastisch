const sanitizeEnvUrl = (url?: string): string => {
	if (!url) return '';
	let clean = url.trim();
	// Handles accidentally pasting `KEY=VALUE` in Vercel environment variable input
	if (clean.includes('=')) {
		clean = clean.split('=').slice(1).join('=').trim();
	}
	return clean.replace(/\/+$/, '');
};

const getBaseBackendApiUrl = (): string => {
	const backendUrl = sanitizeEnvUrl(import.meta?.env?.VITE_API_BACKEND_BASE_URL as string | undefined);
	const baseUrl = sanitizeEnvUrl(import.meta?.env?.VITE_API_BASE_URL as string | undefined);
	const envUrl = backendUrl || baseUrl;

	const isLocalhost =
		typeof window !== 'undefined'
			? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
			: true;

	if (envUrl) {
		// If running in browser on production (e.g. Vercel) but build had localhost embedded
		if (!isLocalhost && typeof window !== 'undefined' && envUrl.includes('localhost')) {
			return 'https://gravurtastisch-api.onrender.com/v1';
		}
		return envUrl.endsWith('/v1') ? envUrl : `${envUrl}/v1`;
	}

	// Automatic fallback depending on environment
	if (typeof window !== 'undefined' && !isLocalhost) {
		return 'https://gravurtastisch-api.onrender.com/v1';
	}

	return 'http://localhost:7051/v1';
};

export const baseBackendApiUrl = getBaseBackendApiUrl();
