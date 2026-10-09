'use client';

import FusePageCarded from '@fuse/core/FusePageCarded';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';
import useParams from '@fuse/hooks/useParams';
import Link from '@fuse/core/Link';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import FuseLoading from '@fuse/core/FuseLoading';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import { useOrder } from '../../../../api/hooks/orders/useOrder';

/**
 * The order.
 */
function Order() {
  const routeParams = useParams();
  const { orderId } = routeParams as { orderId: string };
  const { data: order, isLoading, isError } = useOrder(orderId);

  const isMobile = useThemeMediaQuery((_theme) =>
    _theme.breakpoints.down('lg')
  );



  if (isLoading) {
    return <FuseLoading />;
  }

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.1 } }}
        className="flex h-full flex-1 flex-col items-center justify-center"
      >
        <Typography color="text.secondary" variant="h5">
          There is no such order!
        </Typography>
        <Button
          className="mt-6"
          component={Link}
          variant="outlined"
          to="/orders"
          color="inherit"
        >
          Go to Orders Page
        </Button>
      </motion.div>
    );
  }

  return (
    <FusePageCarded
      header={
        order && (
          <div className="flex flex-1 flex-col py-2">
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1, transition: { delay: 0.3 } }}
            >
              <PageBreadcrumb className="mb-2" />
            </motion.div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1, transition: { delay: 0.3 } }}
              className="flex min-w-0 flex-col"
            >
              <Typography className="truncate text-2xl font-semibold">
                {`Order ${order.reference}`}
              </Typography>
              <Typography variant="caption" className="font-medium">
                {`From ${order.customer.firstName} ${order.customer.lastName}`}
              </Typography>
            </motion.div>
          </div>
        )
      }
      content={<div className="w-full p-4 sm:p-6"></div>}
      scroll={isMobile ? 'page' : 'content'}
    />
  );
}

export default Order;
