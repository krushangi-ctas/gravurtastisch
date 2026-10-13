import { useEffect } from 'react';
import { baseBackendApiUrl } from '@/utils/apiFetch';

/**
 * Periodically pings the API /health endpoint every 5 minutes (300,000 ms)
 * to keep the backend service awake on hosting platforms like Render.
 */
export const useHealthKeepAlive = (intervalMs: number = 5 * 60 * 1000) => {
	useEffect(() => {
		const healthUrl = `${baseBackendApiUrl.replace(/\/v1$/, '')}/health`;

		const ping = () => {
			fetch(healthUrl, {
				method: 'GET',
				cache: 'no-store'
			}).catch(() => {
				// Silently ignore ping errors
			});
		};

		// Initial ping after 3 seconds of opening the panel
		const initialTimer = setTimeout(ping, 3000);

		// Periodic ping every 5 minutes
		const intervalId = setInterval(ping, intervalMs);

		return () => {
			clearTimeout(initialTimer);
			clearInterval(intervalId);
		};
	}, [intervalMs]);
};

export default useHealthKeepAlive;
