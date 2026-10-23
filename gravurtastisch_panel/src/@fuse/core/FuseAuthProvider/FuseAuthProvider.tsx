import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { PartialDeep } from 'type-fest';
import FuseLoading from '@fuse/core/FuseLoading';
import { User } from '@auth/user';
import { FuseAuthProviderType, FuseAuthProviderMethods, FuseAuthProviderState } from './types/FuseAuthTypes';
import FuseAuthContext from './FuseAuthContext';
import { AuthState, initialAuthState } from './FuseAuthContext';
const authProviderLocalStorageKey = 'fuseReactAuthProvider';

type FuseAuthenticationProviderProps = {
	children: (authState: FuseAuthProviderState | null) => React.ReactNode;
	providers: FuseAuthProviderType[];
	onAuthStateChanged?: (authState: FuseAuthProviderState) => void;
};

function FuseAuthProvider(props: FuseAuthenticationProviderProps) {
	const { children, providers, onAuthStateChanged } = props;

	const [authState, setAuthState] = useState<AuthState | null>(initialAuthState);

	const currentAuthStatus = useMemo(() => authState?.authStatus, [authState]);
	const [isLoading, setIsLoading] = useState(true);

	const [providerStatuses, setProviderStatuses] = useState<Record<string, string>>({});
	const providerRefs = useRef<Record<string, FuseAuthProviderMethods | null>>({});
	const currentProvider = useMemo(() => providerRefs.current[authState?.provider], [authState, providerRefs]);

	const allProvidersReady = useMemo(() => {
		return providers.every(
			(provider) => providerStatuses[provider.name] && providerStatuses[provider.name] !== 'configuring'
		);
	}, [providers, providerStatuses]);

	const getAuthProvider = useCallback(() => {
		return localStorage.getItem(authProviderLocalStorageKey);
	}, []);

	const setAuthProvider = useCallback((authProvider: string) => {
		if (authProvider) {
			localStorage.setItem(authProviderLocalStorageKey, authProvider);
		}
	}, []);

	const resetAuthProvider = useCallback(() => {
		localStorage.removeItem(authProviderLocalStorageKey);
	}, []);

	const handleAuthStateChange = useCallback(
		(providerAuthState: FuseAuthProviderState, name: string) => {
			setProviderStatuses((prevStatuses) => {
				if (prevStatuses[name] === providerAuthState.authStatus) {
					return prevStatuses;
				}
				return {
					...prevStatuses,
					[name]: providerAuthState.authStatus
				};
			});
			setAuthState((prev) => {
				if (
					prev?.isAuthenticated === providerAuthState.isAuthenticated &&
					prev?.authStatus === providerAuthState.authStatus &&
					(prev?.user as any)?._id === (providerAuthState?.user as any)?._id &&
					(prev?.user as any)?.email === (providerAuthState?.user as any)?.email &&
					prev?.provider === name
				) {
					return prev;
				}

				// Scenario 1: Provider is authenticated with a user (initial login or switching users)
				if (providerAuthState.isAuthenticated && providerAuthState.user) {
					setAuthProvider(name);
					return { ...providerAuthState, provider: name };
				}

				// Scenario 2: Same provider, user logged out
				if (prev?.provider === name && !providerAuthState.isAuthenticated) {
					return initialAuthState;
				}

				// Scenario 3: Ignore unauthenticated state if previously authenticated with another provider
				if (prev?.isAuthenticated && !providerAuthState.isAuthenticated) {
					return prev;
				}

				return prev;
			});
		},
		[setAuthProvider]
	);

	useEffect(() => {
		if (onAuthStateChanged) {
			onAuthStateChanged(authState);
		}
	}, [onAuthStateChanged, authState]);

	useEffect(() => {
		if (allProvidersReady && currentAuthStatus !== 'configuring') {
			setIsLoading(false);
		}
	}, [allProvidersReady, currentAuthStatus]);

	const signOut = useCallback(() => {
		if (currentProvider) {
			currentProvider?.signOut();
			resetAuthProvider();
		} else {
			// eslint-disable-next-line no-console
			console.warn('No current auth provider to sign out from');
		}
	}, [currentProvider, resetAuthProvider]);

	const updateUser = useCallback(
		async (_userData: PartialDeep<User>) => {
			if (currentProvider?.updateUser) {
				return currentProvider?.updateUser(_userData);
			}

			throw new Error('No current auth provider to updateUser from');
		},
		[currentProvider]
	);

	const contextValue = useMemo(
		() => ({
			isAuthenticated: authState?.isAuthenticated,
			getAuthProvider,
			setAuthProvider,
			resetAuthProvider,
			providers,
			signOut,
			updateUser,
			authState
		}),
		[authState, getAuthProvider, setAuthProvider, resetAuthProvider, providers, signOut, updateUser]
	);

	// Nest providers with handleAuthStateChange and ref
	const nestedProviders = useMemo(
		() =>
			providers.reduceRight(
				(acc, { Provider, name }) => {
					return (
						<Provider
							key={name}
							ref={(ref: FuseAuthProviderMethods | null) => {
								providerRefs.current[name] = ref;
							}}
							onAuthStateChanged={(authState) => {
								handleAuthStateChange(authState, name);
							}}
						>
							{acc}
						</Provider>
					);
				},
				!isLoading ? children(authState) : <FuseLoading />
			),
		[providers, isLoading, handleAuthStateChange, children, authState]
	);

	return <FuseAuthContext value={contextValue}>{nestedProviders}</FuseAuthContext>;
}

export default FuseAuthProvider;
