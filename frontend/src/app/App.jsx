import ErrorBoundary from '../shared/components/feedback/ErrorBoundary.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import GlobalLoadingBar from '../shared/components/feedback/GlobalLoadingBar.jsx';

function App() {
  return (
    <ErrorBoundary>
      <GlobalLoadingBar />
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default App;
