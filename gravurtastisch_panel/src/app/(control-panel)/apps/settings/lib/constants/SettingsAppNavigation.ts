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
      authSection: '/settings/account',
    },
    {
      id: 'settings.siteConfiguration',
      icon: 'lucide:globe',
      title: 'Site Configuration',
      type: 'item',
      url: '/settings/site-configuration',
      authSection: '/settings/site-configuration',
    },
    {
      id: 'settings.generalSetting',
      icon: 'lucide:settings',
      title: 'General Setting',
      type: 'item',
      url: '/settings/generalSetting',
      authSection: '/settings/generalsetting',
    },
  ],
};

export default SettingsAppNavigation;
