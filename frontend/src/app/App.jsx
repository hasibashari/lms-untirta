import ErrorBoundary from '../components/shared/ErrorBoundary.jsx';
import AppRoutes from '../routes/AppRoutes.jsx';

function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default App;
