import { FuseSettingsConfigType } from '@fuse/core/FuseSettings/FuseSettings';
import { FuseAuthUser } from '@fuse/core/FuseAuthProvider/types/FuseAuthUser';
import { PartialDeep } from 'type-fest';
import { PermissionsMap } from '@/hooks/usePermissions';

export type RoleInfo = {
	id?: string;
	role_name?: string;
	scope?: 'admin' | 'seller';
	description?: string;
	isBypass?: boolean;
};

/**
 * The type definition for a user object.
 */
export type User = FuseAuthUser & {
	id: string;
	role: string[] | string | null;
	displayName: string;
	photoURL?: string;
	email?: string;
	contact_no?: string;
	shortcuts?: string[];
	settings?: PartialDeep<FuseSettingsConfigType>;
	loginRedirectUrl?: string; // The URL to redirect to after login.
	isSuperAdmin?: boolean;
	isSellerAdmin?: boolean;
	userType?: 'admin' | 'seller';
	parentId?: string | null;
	role_id?: string | null;
	permissions?: PermissionsMap;
	roleInfo?: RoleInfo | null;
	name?: string;
};
