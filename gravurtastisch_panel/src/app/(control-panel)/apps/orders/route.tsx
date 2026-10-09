import { lazy } from 'react';
import { Outlet } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import OrdersView from './components/views/orders/OrdersView';

const OrderView = lazy(
  () => import('./components/views/orders/order/OrderView')
);

/**
 * The Orders app Routes.
 */
const Route: FuseRouteItemType = {
  path: 'orders',
  element: <Outlet />,
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
