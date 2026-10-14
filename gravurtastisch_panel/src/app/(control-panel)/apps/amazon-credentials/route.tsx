import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';

const AmazonCredentialsView = lazy(() => import('./components/views/amazonCredentials/AmazonCredentialView'));

/**
 * The Emails app Routes.
 */
const Route: FuseRouteItemType = {
  path: '/amazon-credentials',
  element: <PermissionGuard section="amazon-credentials" title="Amazon Authorisation" />,
  children: [
    {
      path: '',
      children: [
        {
          path: '',
          element: <AmazonCredentialsView />,
        },
        // {
        //   path: ":orderId",
        //   element: <OrderView />,
        // },
      ],
    },
  ],
};

export default Route;
