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
			let errorData: any = null;
			try {
				errorData = await response.json();
			} catch {
				errorData = null;
			}

			const rawMessage =
				(typeof errorData === 'string' ? errorData : null) ||
				errorData?.message ||
				errorData?.error ||
				response.statusText ||
				`Request failed with status ${response.status}`;

			let message = rawMessage;
			if (message.match(/^missing permission:\s*(.+)$/i)) {
				const perm = message.replace(/^missing permission:\s*/i, '').trim();
				message = `You do not have permission to perform this action (${perm}).`;
			} else if (message.toLowerCase() === 'forbidden') {
				message = 'You do not have permission to perform this action.';
			}

			const error: any = new Error(message);
			error.status = response.status;
			error.code = errorData?.code || response.status;
			error.data = errorData;
			throw error;
		}

		if (isFile) {
			return response; // you are downloading a file
		}

		const data = await response.json();
		return data;
	} catch (err: any) {
		console.error(err);
		if (err instanceof Error) {
			throw err;
		}
		const fallbackMsg =
			(typeof err === 'string' ? err : null) ||
			err?.message ||
			err?.error ||
			'An unexpected error occurred.';
		const error: any = new Error(fallbackMsg);
		error.data = err;
		throw error;
	}
}
