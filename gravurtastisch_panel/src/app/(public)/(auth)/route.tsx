import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const SignInPageView = lazy(() => import('./components/views/SignInPageView'));
const SignOutPageView = lazy(() => import('./components/views/SignOutPageView'));

const route: FuseRouteItemType = {
	children: [
		{
			path: 'sign-in',
			element: <SignInPageView />,
			settings: {
				layout: {
					config: {
						navbar: {
							display: false
						},
						toolbar: {
							display: false
						},
						footer: {
							display: false
						},
						leftSidePanel: {
							display: false
						},
						rightSidePanel: {
							display: false
						}
					}
				}
			},
			auth: authRoles.onlyGuest // []
		},
		{
			path: 'sign-out',
			element: <SignOutPageView />,
			settings: {
				layout: {
					config: {
						navbar: {
							display: false
						},
						toolbar: {
							display: false
						},
						footer: {
							display: false
						},
						leftSidePanel: {
							display: false
						},
						rightSidePanel: {
							display: false
						}
					}
				}
			},
			auth: null
		}
	]
};

export default route;
