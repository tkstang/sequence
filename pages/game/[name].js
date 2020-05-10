import { useState, useEffect } from 'react';
import { subscribe } from 'services/GameService';
import { Loading } from 'components';

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
  }, [gameName]);

  return loading ? (
    <Loading color="#000" size={100} />
  ) : (
    <>
      <div>Hi.</div>
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
