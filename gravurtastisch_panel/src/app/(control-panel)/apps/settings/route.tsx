import { lazy } from 'react';
import { Navigate, Outlet } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';

const SettingsAppView = lazy(() => import('./components/views/SettingsAppView'));
const AccountTabView = lazy(() => import('./components/views/AccountTabView'));
const GeneralSetAppView = lazy(() => import('./components/views/GeneralSetAppView'));

/**
 * The Settings App Route.
 */
const Route: FuseRouteItemType = {
  path: '/settings',
  element: (
    <PermissionGuard section="settings" title="Settings">
      <SettingsAppView>
        <Outlet />
      </SettingsAppView>
    </PermissionGuard>
  ),
  children: [
    {
      path: 'account',
      element: <AccountTabView />,
    },
    {
      path: 'generalSetting',
      element: <GeneralSetAppView />,
    },
    {
      path: '',
      element: <Navigate to="account" />,
    },
  ],
};

export default Route;
