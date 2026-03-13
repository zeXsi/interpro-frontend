import { useLocation } from 'react-router';

export default function useIsPdfExport() {
  const location = useLocation();

  return (
    location.pathname.endsWith('/print') ||
    new URLSearchParams(location.search).get('export') === 'pdf'
  );
}
