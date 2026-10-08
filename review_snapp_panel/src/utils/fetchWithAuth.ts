export async function fetchWithAuth(url: string, options: RequestInit = {}, isFile = false): Promise<any> {
	let token = localStorage.getItem('jwt_access_token');

	if (token) {
		token = token.replace(/['"]+/g, '');
	}

	const isFormData = options.body instanceof FormData;

	const headers: HeadersInit = {
		...(options.headers || {}),
		Authorization: token ? `Bearer ${token}` : '',
	};

	if (!isFormData && options.body) {
		headers['Content-Type'] = 'application/json';
	}

	const config: RequestInit = {
		...options,
		headers
	};

	try {
		const response = await fetch(url, config);
		if (!response.ok) {
			const error = await response.json();
			throw error;
		}

		if (isFile) {
			return response; // you are downloading a file
		}

		const data = await response.json();
		return data;
	} catch (err) {
		console.error(err);
		throw err;
	}
}
