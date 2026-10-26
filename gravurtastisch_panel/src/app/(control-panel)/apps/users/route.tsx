import { Navigate } from "react-router";
import { FuseRouteItemType } from "@fuse/utils/FuseUtils";

const Route: FuseRouteItemType = {
  path: "/users",
  element: <Navigate to="/team/members" replace />,
};

export default Route;
