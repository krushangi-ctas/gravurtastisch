import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';
import OrdersView from './components/views/orders/OrdersView';

const OrderView = lazy(
  () => import('./components/views/orders/order/OrderView')
);

/**
 * The Orders app Routes.
 */
const Route: FuseRouteItemType = {
  path: 'orders',
  element: <PermissionGuard section="orders" title="Orders" />,
  children: [
    {
      path: '',
      children: [
        {
          path: '',
          element: <OrdersView />,
        },
        {
          path: ':orderId',
          element: <OrderView />,
        },
      ],
    },
  ],
};

export default Route;
