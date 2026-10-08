import { lazy } from "react";
import { Outlet } from "react-router";
import { FuseRouteItemType } from "@fuse/utils/FuseUtils";

const UsersView = lazy(() => import("./components/views/UsersView"));

/**
 * The Users app Routes.
 */
const Route: FuseRouteItemType = {
  path: "/users",
  element: <Outlet />,
  children: [
    {
      path: "",
      children: [
        {
          path: "",
          element: <UsersView variant="team" />,
        },
      ],
    },
  ],
};

export default Route;
