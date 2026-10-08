import { Navigate, Outlet } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import SettingsAppView from './components/views/SettingsAppView';
import AccountTabView from './components/views/AccountTabView';
import GeneralSetAppView from './components/views/GeneralSetAppView';

/**
 * The Settings App Route.
 */
const Route: FuseRouteItemType = {
  path: '/settings',
  element: (
    <SettingsAppView>
      <Outlet />
    </SettingsAppView>
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
