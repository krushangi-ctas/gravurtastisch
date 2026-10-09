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
      subtitle: 'Manage your public profile and private information',
    },
    {
      id: 'settings.generalSetting',
      icon: 'lucide:settings',
      title: 'General Setting',
      type: 'item',
      url: '/settings/generalSetting',
      subtitle: 'Configure automated review rules, dispatch schedule, and campaign triggers',
    },
  ],
};

export default SettingsAppNavigation;
