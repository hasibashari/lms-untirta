import ErrorBoundary from '../components/shared/ErrorBoundary.jsx';
import AppRoutes from '../routes/AppRoutes.jsx';
import GlobalLoadingBar from '../components/shared/GlobalLoadingBar.jsx';

function App() {
  return (
    <ErrorBoundary>
      <GlobalLoadingBar />
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default App;
