const getBaseBackendApiUrl = (): string => {
	const backendUrl = import.meta?.env?.VITE_API_BACKEND_BASE_URL as string | undefined;
	if (backendUrl && backendUrl.trim()) {
		const clean = backendUrl.trim().replace(/\/+$/, '');
		return clean.endsWith('/v1') ? clean : `${clean}/v1`;
	}

	const baseUrl = import.meta?.env?.VITE_API_BASE_URL as string | undefined;
	if (baseUrl && baseUrl.trim()) {
		const clean = baseUrl.trim().replace(/\/+$/, '');
		return clean.endsWith('/v1') ? clean : `${clean}/v1`;
	}

	return 'http://localhost:7051/v1';
};

export const baseBackendApiUrl = getBaseBackendApiUrl();










