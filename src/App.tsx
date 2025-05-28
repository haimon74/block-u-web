import React from 'react';
import Game from './components/Game';
import styles from './App.module.css';

const App: React.FC = () => {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Block-U</h1>
      </header>
      <main>
        <Game />
      </main>
    </div>
  );
};

export default App;
