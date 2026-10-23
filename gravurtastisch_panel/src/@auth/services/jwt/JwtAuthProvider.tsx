import { useState, useEffect, useCallback, useMemo, useRef, useImperativeHandle } from 'react';
import { FuseAuthProviderComponentProps, FuseAuthProviderState } from '@fuse/core/FuseAuthProvider/types/FuseAuthTypes';
import { authRefreshToken, authSignInWithToken, authUpdateDbUser } from '@auth/authApi';
import { User } from '../../user';
import { removeGlobalHeaders, setGlobalHeaders } from '@/utils/api';
import { isTokenValid } from './utils/jwtUtils';
import JwtAuthContext from '@auth/services/jwt/JwtAuthContext';
import { JwtAuthContextType } from '@auth/services/jwt/JwtAuthContext';
import { HTTPError } from 'ky';
import { verifyOtp, register } from '@auth/api';
import { queryClient } from '@/app/queryClient';

export type JwtSignInPayload = {
	email: string;
	otp: string;
};

export type JwtSignUpPayload = {
	name: string;
	email: string;
	password: string;
};

const getStoredAccessToken = (): string | null => {
	try {
		const raw = window.localStorage.getItem('jwt_access_token');
		if (!raw) return null;
		try {
			const parsed = JSON.parse(raw);
			return typeof parsed === 'string' ? parsed.replace(/['"]+/g, '') : null;
		} catch {
			return raw.replace(/['"]+/g, '');
		}
	} catch {
		return null;
	}
};

const setStoredAccessToken = (token: string | null) => {
	try {
		if (token) {
			const clean = token.replace(/['"]+/g, '');
			window.localStorage.setItem('jwt_access_token', clean);
		} else {
			window.localStorage.removeItem('jwt_access_token');
		}
	} catch (e) {
		console.error('Error saving token:', e);
	}
};

const clearAuthStorage = () => {
	try {
		window.localStorage.removeItem('jwt_access_token');
		window.localStorage.removeItem('fuseReactAuthProvider');
		window.sessionStorage.removeItem('fuseRedirectUrl');
		queryClient.clear();
	} catch (e) {
		console.error('Error clearing auth storage:', e);
	}
};

function JwtAuthProvider(props: FuseAuthProviderComponentProps) {
	const { ref, children, onAuthStateChanged } = props;

	/**
	 * Fuse Auth Provider State
	 */
	const [authState, setAuthState] = useState<FuseAuthProviderState<User>>({
		authStatus: 'configuring',
		isAuthenticated: false,
		user: null
	});

	/**
	 * Watch for changes in the auth state
	 * and pass them to the FuseAuthProvider
	 */
	const onAuthStateChangedRef = useRef(onAuthStateChanged);
	onAuthStateChangedRef.current = onAuthStateChanged;

	useEffect(() => {
		if (onAuthStateChangedRef.current) {
			onAuthStateChangedRef.current(authState);
		}
	}, [authState]);

	/**
	 * Attempt to auto login with the stored token
	 */
	useEffect(() => {
		const attemptAutoLogin = async () => {
			const accessToken = getStoredAccessToken();

			if (accessToken && isTokenValid(accessToken)) {
				try {
					const response = await authSignInWithToken(accessToken);
					return { response, accessToken };
				} catch (error) {
					if (error instanceof HTTPError) {
						console.error('Auto login failed:', error.response.status);
					}

					return false;
				}
			}

			return false;
		};

		if (!authState.isAuthenticated) {
			attemptAutoLogin().then((result) => {
				if (result && result.response) {
					setGlobalHeaders({ Authorization: `Bearer ${result.accessToken}` });
					setAuthState({
						authStatus: 'authenticated',
						isAuthenticated: true,
						user: result.response.user
					});
				} else {
					clearAuthStorage();
					removeGlobalHeaders(['Authorization']);
					setAuthState({
						authStatus: 'unauthenticated',
						isAuthenticated: false,
						user: null
					});
				}
			});
		}
		// eslint-disable-next-line
  }, [authState.isAuthenticated]);

	/**
	 * Sign in
	 */
	const signIn: JwtAuthContextType['signIn'] = useCallback(
		async (credentials) => {
			try {
				// Clear any previous session leftovers and cache before signing in
				clearAuthStorage();
				removeGlobalHeaders(['Authorization']);

				const data = await verifyOtp(credentials);
				if (data.status !== 200) {
					throw new Error(data.message);
				}

				const cleanToken = data.tokens.access.token.replace(/['"]+/g, '');

				const session = {
					user: {
						...data.user,
						role: 'admin',
						displayName: data.user?.name || data.user?.displayName || data.user?.email
					},
					message: data.message,
					access_token: cleanToken
				};

				setStoredAccessToken(cleanToken);
				setGlobalHeaders({ Authorization: `Bearer ${cleanToken}` });

				setAuthState({
					authStatus: 'authenticated',
					isAuthenticated: true,
					user: session.user
				});

				return session;
			} catch (error) {
				if (error instanceof HTTPError) {
					console.error('Sign in failed:', error.response.status);
				}

				throw error;
			}
		},
		[]
	);

	/**
	 * Sign up
	 */
	const signUp: JwtAuthContextType['signUp'] = useCallback(
		async (data) => {
			try {
				const session = await register(data);
				const cleanToken = session.access_token.replace(/['"]+/g, '');
				setStoredAccessToken(cleanToken);
				setGlobalHeaders({ Authorization: `Bearer ${cleanToken}` });
				setAuthState({
					authStatus: 'authenticated',
					isAuthenticated: true,
					user: session.user
				});
				return session;
			} catch (error) {
				if (error instanceof HTTPError) {
					console.error('Sign up failed:', error.response.status);
				}

				throw error;
			}
		},
		[]
	);

	/**
	 * Sign out
	 */
	const signOut: JwtAuthContextType['signOut'] = useCallback(() => {
		clearAuthStorage();
		removeGlobalHeaders(['Authorization']);
		setAuthState({
			authStatus: 'unauthenticated',
			isAuthenticated: false,
			user: null
		});
	}, []);

	/**
	 * Update user
	 */
	const updateUser: JwtAuthContextType['updateUser'] = useCallback(async (_user) => {
		try {
			const response = await authUpdateDbUser(_user);
			return response;
		} catch (error) {
			if (error instanceof HTTPError) {
				console.error('Update user failed:', error.response.status);
			}

			throw error;
		}
	}, []);

	/**
	 * Refresh access token
	 */
	const refreshToken: JwtAuthContextType['refreshToken'] = useCallback(async () => {
		try {
			const response = await authRefreshToken();
			return response;
		} catch (error) {
			if (error instanceof HTTPError) {
				console.error('Token refresh failed:', error.response.status);
			}

			throw error;
		}
	}, []);

	/**
	 * Auth Context Value
	 */
	const authContextValue = useMemo(
		() =>
			({
				...authState,
				signIn,
				signUp,
				signOut,
				updateUser,
				refreshToken
			}) as JwtAuthContextType,
		[authState, signIn, signUp, signOut, updateUser, refreshToken]
	);

	/**
	 * Expose methods to the FuseAuthProvider
	 */
	useImperativeHandle(ref, () => ({
		signOut,
		updateUser
	}));

	/**
	 * Intercept fetch requests to refresh the access token
	 */
	const interceptFetch = useCallback(() => {
		const { fetch: originalFetch } = window;

		window.fetch = async (...args) => {
			const [resource, config] = args;
			try {
				const response = await originalFetch(resource, config);
				const newAccessToken = response.headers.get('New-Access-Token');

				if (newAccessToken) {
					const clean = newAccessToken.replace(/['"]+/g, '');
					setGlobalHeaders({ Authorization: `Bearer ${clean}` });
					setStoredAccessToken(clean);
				}

				if (response.status === 401) {
					signOut();
					console.error('Unauthorized request. User was signed out.');
				}

				return response;
			} catch (error) {
				if (error instanceof HTTPError && error.response.status === 401) {
					signOut();
					console.error('Unauthorized request. User was signed out.');
				}

				throw error;
			}
		};
	}, [signOut]);

	useEffect(() => {
		if (authState.isAuthenticated) {
			interceptFetch();
		}
	}, [authState.isAuthenticated, interceptFetch]);

	return <JwtAuthContext value={authContextValue}>{children}</JwtAuthContext>;
}

export default JwtAuthProvider;
