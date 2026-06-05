import ErrorBoundary from '../shared/components/feedback/ErrorBoundary.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default App;
