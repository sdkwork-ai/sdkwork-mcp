import { Navigate } from 'react-router-dom';

/** Deep-link compatibility: register opens the list drawer via query. */
export function RegisterMcpServerPage() {
  return <Navigate to="/console/mcp?register=1" replace />;
}
