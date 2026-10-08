import { Outlet } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import AmazonCredentialsView from './components/views/amazonCredentials/AmazonCredentialView';

/**
 * The Emails app Routes.
 */
const Route: FuseRouteItemType = {
  path: '/amazon-credentials',
  element: <Outlet />,
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
