import { websiteConfigurationUrl } from '@/configs/env';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

export interface CompanyConfig {
	name: string;
	website: string;
	tagline: string;
	about: string;
	copyright_text: string;
}

export interface ContactConfig {
	email: string;
	phone: string;
	address: string;
	city: string;
	state: string;
	country: string;
	postal_code: string;
	working_hours: string;
	timezone: string;
}

export interface SocialLinksConfig {
	facebook?: string;
	instagram?: string;
	linkedin?: string;
	youtube?: string;
}

export interface WebsiteConfiguration {
	_id?: string;
	id?: string;
	company: CompanyConfig;
	contact: ContactConfig;
	social_links?: SocialLinksConfig;
	createdAt?: string;
	updatedAt?: string;
}

export interface WebsiteConfigResponse {
	status: boolean | number;
	message: string;
	data: WebsiteConfiguration;
}

export const getWebsiteConfiguration = async (): Promise<WebsiteConfigResponse> => {
	return await fetchWithAuth(websiteConfigurationUrl, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
	});
};

export const updateWebsiteConfiguration = async (payload: {
	company?: Partial<CompanyConfig>;
	contact?: Partial<ContactConfig>;
	social_links?: Partial<SocialLinksConfig>;
}): Promise<WebsiteConfigResponse> => {
	return await fetchWithAuth(websiteConfigurationUrl, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
};
