import { baseBackendApiUrl } from '@/utils/apiFetch';

export const sendOtpUrl = `${baseBackendApiUrl}/auth/send-otp`;
export const verifyOtpUrl = `${baseBackendApiUrl}/auth/verify-otp`;
export const registerUrl = `${baseBackendApiUrl}/auth/register`;
export const updateProfileUrl = `${baseBackendApiUrl}/users/update-profile`;
export const updatePasswordUrl = `${baseBackendApiUrl}/users/update-password`;
export const orderListUrl = `${baseBackendApiUrl}/order`;
export const sendFeedbackUrl = `${baseBackendApiUrl}/order/update-feedback`;
export const upoadImageUrl = `${baseBackendApiUrl}/users`;
export const marketPlaceUrl = `${baseBackendApiUrl}/marketplace`;
export const generalSettingUrl = `${baseBackendApiUrl}/general-setting`;
const emailTemplateUrl = `${baseBackendApiUrl}/email-template`;
export const amazonCredentialsUrl = `${baseBackendApiUrl}/amazon-credentials`;
export const usersUrl = `${baseBackendApiUrl}/users`;
export const rolesUrl = `${baseBackendApiUrl}/roles`;
export const supportUrl = `${baseBackendApiUrl}/support`;
export const blogsUrl = `${baseBackendApiUrl}/blogs`;
export const websiteConfigurationUrl = `${baseBackendApiUrl}/website-configuration`;
export const plansUrl = `${baseBackendApiUrl}/plans`;

export const uploadsBaseUrl = (
	(import.meta?.env?.VITE_API_UPLOADS_URL as string) ||
	(import.meta?.env?.VITE_API_BASE_URL as string) ||
	baseBackendApiUrl.replace(/\/v1\/?$/, '') ||
	'https://api.reviewsnapp.com'
).replace(/\/+$/, '');

/**
 * Resolves full image URL for previews and renders.
 * Supports:
 * - Safe host rewriting if localhost URL is provided in production
 */
export const getImageUrl = (urlOrPath?: string): string => {
	if (!urlOrPath) return '';
	const trimmed = urlOrPath.trim();
	if (!trimmed) return '';

	if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
		if (
			trimmed.includes('localhost') &&
			typeof window !== 'undefined' &&
			window.location.hostname !== 'localhost' &&
			uploadsBaseUrl
		) {
			try {
				const parsed = new URL(trimmed);
				return `${uploadsBaseUrl}${parsed.pathname}`;
			} catch {
				return trimmed;
			}
		}
		return trimmed;
	}

	const cleanPath = trimmed.replace(/^\/+/, '');
	return uploadsBaseUrl ? `${uploadsBaseUrl}/${cleanPath}` : `/${cleanPath}`;
};
