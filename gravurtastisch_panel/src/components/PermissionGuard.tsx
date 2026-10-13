import { ReactNode } from 'react';
import { Outlet } from 'react-router';
import usePermissions, { PermissionAction } from '@/hooks/usePermissions';
import AccessDeniedView from './AccessDeniedView';

type PermissionGuardProps = {
	section: string;
	action?: PermissionAction;
	title?: string;
	children?: ReactNode;
};

export default function PermissionGuard({
	section,
	action = 'view',
	title,
	children
}: PermissionGuardProps) {
	const { can } = usePermissions();
	const hasAccess = can(section, action);

	if (!hasAccess) {
		return <AccessDeniedView sectionTitle={title} />;
	}

	return children ? <>{children}</> : <Outlet />;
}
