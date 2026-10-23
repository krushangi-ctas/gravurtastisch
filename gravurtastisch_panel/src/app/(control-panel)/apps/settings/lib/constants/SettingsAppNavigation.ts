import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';

const SettingsAppNavigation: FuseNavItemType = {
  id: 'settings',
  title: 'Settings',
  type: 'collapse',
  icon: 'lucide:settings',
  url: '/settings',
  children: [
    {
      id: 'settings.account',
      icon: 'lucide:circle-user',
      title: 'Account',
      type: 'item',
      url: '/settings/account',
    },
    {
      id: 'settings.generalSetting',
      icon: 'lucide:settings',
      title: 'General Setting',
      type: 'item',
      url: '/settings/generalSetting',
    },
  ],
};

export default SettingsAppNavigation;
