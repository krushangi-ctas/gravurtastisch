/**
 * Converts technical permission codes (e.g. "Missing permission: user.update")
 * into user-friendly English messages.
 */
export function formatFriendlyErrorMessage(raw: string): string {
	if (!raw || typeof raw !== 'string') return '';
	const trimmed = raw.trim();

	const permMatch = trimmed.match(/^missing permission:\s*(.+)$/i);
	if (permMatch) {
		const perm = permMatch[1].trim();
		return `You do not have permission to perform this action (${perm}).`;
	}

	if (trimmed.toLowerCase() === 'forbidden') {
		return 'You do not have permission to perform this action.';
	}

	if (trimmed.toLowerCase() === 'unauthorized' || trimmed.toLowerCase() === 'please authenticate') {
		return 'You do not have permission to access this resource. Please log in.';
	}

	return trimmed;
}

/**
 * Safely extracts a user-readable error message from any error type.
 * Prevents displaying `[object Object]` on screen.
 */
export function getErrorMessage(err: unknown, defaultMessage = 'An unexpected error occurred.'): string {
	if (!err) return defaultMessage;
	if (typeof err === 'string' && err.trim()) return formatFriendlyErrorMessage(err);

	if (typeof err === 'object') {
		const obj = err as Record<string, any>;
		if (typeof obj.message === 'string' && obj.message && obj.message !== '[object Object]') {
			return formatFriendlyErrorMessage(obj.message);
		}
		if (typeof obj.data?.message === 'string' && obj.data.message && obj.data.message !== '[object Object]') {
			return formatFriendlyErrorMessage(obj.data.message);
		}
		if (typeof obj.error === 'string' && obj.error && obj.error !== '[object Object]') {
			return formatFriendlyErrorMessage(obj.error);
		}
		if (typeof obj.response?.data?.message === 'string' && obj.response.data.message) {
			return formatFriendlyErrorMessage(obj.response.data.message);
		}
	}

	const str = String(err);
	return str && str !== '[object Object]' ? formatFriendlyErrorMessage(str) : defaultMessage;
}
