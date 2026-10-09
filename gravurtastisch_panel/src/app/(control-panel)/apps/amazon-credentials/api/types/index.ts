export interface ApiResponse {
	status: number;
	message: string;
	data: {
		client_id: string;
		seller_id: string;
		marketplace_id: string;
		auth_url: string;
		sp_api_base_url: string;
	} | null;
}

// export Interface for the upsert payload
export interface UpsertPayload {
	id?: string;
	client_id: string;
	client_secret: string;
	refresh_token: string;
	seller_id: string;
	marketplace_id?: string;
	auth_url?: string;
	sp_api_base_url?: string;
}
