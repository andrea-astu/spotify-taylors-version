import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom'
import HomePage from './pages/Home';
import ProgrammPage from './pages/ProgrammPage';


const App = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path='/'>
        <Route index element={<HomePage />} /> 
        {/* <Route path='/programm' element={<ProgrammPage />} /> */}
        <Route path="/callback" element={<ProgrammPage />} />
      </Route>
    )
  );
  return <RouterProvider router= { router } />
}

export default App


/*

import { useState } from 'react';
import { runSpotifyWorkflow } from './myScript';

function App() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Waiting');

  const handleRun = async () => {
    setStatus('Running...');
    setProgress(25);
    await runSpotifyWorkflow(); // your full script runs here
    setProgress(100);
    setStatus('Done!');
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>🎵 Spotify Script Runner</h1>
      <button onClick={handleRun}>Run Script</button>
      <p>{status}</p>
      <div style={{ height: '20px', background: '#eee', marginTop: '20px' }}>
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: '#1db954',
            transition: 'width 0.3s',
          }}
        />
      </div>
    </div>
  );
}

export default App;
*/