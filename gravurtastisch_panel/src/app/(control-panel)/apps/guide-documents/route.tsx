import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';

const GuideDocumentsView = lazy(() => import('./components/views/GuideDocumentsView'));
const GuideStepFormView = lazy(() => import('./components/views/GuideStepFormView'));

/**
 * Guide Documents app Route.
 */
const Route: FuseRouteItemType[] = [
	{
		path: '/guide-document',
		element: <PermissionGuard section="guide-document" title="Guide Documents" />,
		children: [
			{
				path: '',
				element: <GuideDocumentsView />
			},
			{
				path: ':moduleId/steps/new',
				element: <GuideStepFormView />
			},
			{
				path: ':moduleId/steps/:stepId/edit',
				element: <GuideStepFormView />
			}
		]
	},
	{
		path: '/guide-documents',
		element: <PermissionGuard section="guide-document" title="Guide Documents" />,
		children: [
			{
				path: '',
				element: <GuideDocumentsView />
			},
			{
				path: ':moduleId/steps/new',
				element: <GuideStepFormView />
			},
			{
				path: ':moduleId/steps/:stepId/edit',
				element: <GuideStepFormView />
			}
		]
	}
];

export default Route;
