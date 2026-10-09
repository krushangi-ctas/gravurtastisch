import { User } from '@auth/user';
import UserModel from '@auth/user/models/UserModel';
import { PartialDeep } from 'type-fest';
import api from '@/utils/api';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { baseBackendApiUrl } from '@/utils/apiFetch';

type AuthResponse = {
	user: User;
	access_token: string;
};

/**
 * Refreshes the access token
 */
export async function authRefreshToken(): Promise<Response> {
	return api.post('mock/auth/refresh', {
		retry: 0 // Don't retry refresh token requests
	});
}

/**
 * Sign in with token
 */
export async function authSignInWithToken(accessToken: string): Promise<any> {
	return fetchWithAuth(`${baseBackendApiUrl}/users/sign-in-with-token`, {
		headers: { Authorization: `Bearer ${accessToken}` }
	}).then((data) => ({
		user: {
			...data,
			role: 'admin',
			_id: data.id,
			displayName: data.name || data.displayName || data.email
		},
		access_token: accessToken
	}));
}

/**
 * Sign in
 */
async function authSignIn(credentials: { email: string; password: string }): Promise<AuthResponse> {
	return api
		.post('mock/auth/sign-in', {
			json: credentials
		})
		.json();
}

/**
 * Sign up
 */
async function authSignUp(data: {
	displayName: string;
	email: string;
	password: string;
}): Promise<AuthResponse> {
	return api
		.post('mock/auth/sign-up', {
			json: data
		})
		.json();
}

/**
 * Get user by id
 */
async function authGetDbUser(userId: string): Promise<User> {
	return api.get(`mock/auth/user/${userId}`).json();
}

/**
 * Get user by email
 */
async function authGetDbUserByEmail(email: string): Promise<User> {
	return api.get(`mock/auth/user-by-email/${email}`).json();
}

/**
 * Update user
 */
export function authUpdateDbUser(user: PartialDeep<User>): Promise<Response> {
	return api.put(`mock/auth/user/${user.id}`, {
		json: UserModel(user)
	});
}

/**
 * Create user
 */
async function authCreateDbUser(user: PartialDeep<User>): Promise<User> {
	return api
		.post('mock/users', {
			json: UserModel(user)
		})
		.json();
}
