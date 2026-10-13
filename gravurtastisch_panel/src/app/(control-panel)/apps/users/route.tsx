import { lazy } from "react";
import { FuseRouteItemType } from "@fuse/utils/FuseUtils";
import PermissionGuard from "@/components/PermissionGuard";

const UsersView = lazy(() => import("./components/views/UsersView"));

/**
 * The Users app Routes.
 */
const Route: FuseRouteItemType = {
  path: "/users",
  element: <PermissionGuard section="user" title="Team" />,
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
