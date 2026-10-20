import heroImg from './assets/hero.png';
import reactLogo from './assets/react.svg';
import viteLogo from './assets/vite.svg';
import './App.css';

const SITE_URL = import.meta.env.VITE_SITE_URL;
const JWT_SCRECT = import.meta.env.VITE_JWT_SCRECT;

function App() {
  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            SITE_URL: {SITE_URL}
            <br />
            JWT_SCRECT: {JWT_SCRECT}
          </p>
        </div>
      </section>
    </>
  );
}

export default App;
