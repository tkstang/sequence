import { useState, useEffect } from 'react';
import { subscribe } from 'services/GameService';
import { Loading, Board } from 'components';

const Game = ({ gameName }) => {
  console.log({ gameName });
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribe(gameName, setLoading, setBoard);

    return () => {
      console.log(`Unsubscribing from ${gameName}`);
      unsubscribe();
    };
  }, []);

  return loading || !board ? (
    <Loading color="#000" size={100} />
  ) : (
    <>
      <Board board={board} />
    </>
  );
};

export const getServerSideProps = ({ query: { name } }) => {
  console.log(name);
  return {
    props: {
      gameName: name,
    },
  };
};

export default Game;
