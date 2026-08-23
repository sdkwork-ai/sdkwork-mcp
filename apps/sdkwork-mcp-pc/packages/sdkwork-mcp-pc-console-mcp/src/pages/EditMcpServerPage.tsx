import { Navigate, useParams } from 'react-router-dom';

/** Deep-link compatibility: edit opens the list drawer via query. */
export function EditMcpServerPage() {
  const { serverKey: routeServerKey = '' } = useParams<{ serverKey: string }>();
  const serverKey = decodeURIComponent(routeServerKey);
  const target = serverKey
    ? `/console/mcp?edit=${encodeURIComponent(serverKey)}`
    : '/console/mcp';
  return <Navigate to={target} replace />;
}
