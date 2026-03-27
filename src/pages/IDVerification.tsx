import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function IDVerification() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/verifyphoto', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
}
