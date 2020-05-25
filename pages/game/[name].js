import { useState, useEffect } from 'react';
import { subscribe } from 'services/GameService';
import { Loading, Board } from 'components';

const Game = ({ gameName }) => {
  const [board, setBoard] = useState(null);
  const [playerTurn, setPlayerTurn] = useState(1);
  const [teams, setTeams] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playingTurn, setPlayingTurn] = useState(false);

  const playTurnUrl = `${location.protocol}//${location.host}/api/game/board`;

  useEffect(() => {
    setLoading(true);
    console.log('Subscribing');
    const unsubscribe = subscribe(gameName, setLoading, setBoard, setPlayerTurn, setTeams);

    return () => {
      console.log(`Unsubscribing from ${gameName}`);
      unsubscribe();
    };
  }, [gameName]);

  // Move me to game service
  const handleTurn = async (position, currentValue) => {
    if (playingTurn) {
      // Prevent multiple requests
      return;
    }
    console.log({ position, currentValue });
    if (currentValue) {
      // Check if player has one eyed jack - if so remove chip, if not notify player they can only play on this position if they have a one eyed jack
    }
    console.log(playTurnUrl);
    const res = await fetch(playTurnUrl, {
      method: 'post',
      body: JSON.stringify({
        gameName,
        position,
        playerTurn,
        teams,
        board,
      }),
    });

    if (res.status === 500) {
      // Handle the error
    }
    setPlayingTurn(false);
  };

  return loading || !board ? (
    <Loading color="#000" size={100} />
  ) : (
    <>
      <Board board={board} teams={teams} handleTurn={handleTurn} />
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
