import { useState, useEffect } from 'react';
import { subscribe } from 'services/GameService';
import { Loading, Board } from 'components';
import { checkPlayEligibility, checkForSequence } from 'utils/game';

const Game = ({ gameName }) => {
  const [board, setBoard] = useState(null);
  const [playerTurn, setPlayerTurn] = useState(1);
  const [teams, setTeams] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playingTurn, setPlayingTurn] = useState(false);
  const [protectablePositions, setProtectablePositions] = useState(false);

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

  const handleProtectPosition = (position) => {
    // Check if key exists for position in protectable positions, if it doesn't show error message
    // If it does, set value of protectable position to true, increase protectablePositions.numberProtected count

    if (protectablePositions.numberProtected > 0) {
      // Once the user has chosen a second position to protect a direction of the sequence has been protected. If the number to protect is 5 remove positions that are no longer eligible for protection based on the selection from protectablePositions. If they have 2 or more sequences to protect I should do something so that they can only focus on protecting one sequence at a time.
    }

    if (protectablePositions.numberProtected + 1 === protectablePositions.numberToProtect) {
      // fetch play turn url with protect data to update all of those positions with team data and protected
    } else {
      setProtectablePositions({
        ...protectablePositions,
        numberProtected: protectablePositions.numberProtected + 1,
      });
    }
  };

  // Move me to game service
  const handleTurn = async (rowIndex, columnIndex) => {
    if (playingTurn) {
      // Prevent multiple requests
      return;
    }
    const { position } = board[rowIndex][columnIndex];
    // Call checkPlayEligibility here

    const { isSequence, protectablePositions } = checkForSequence(
      teams[playerTurn],
      board,
      rowIndex,
      columnIndex
    );

    // There are more than 5 protectable positions, allow user to choose which positions to protect
    if (protectablePositions && Object.keys(protectablePositions).length > 5) {
      setProtectablePositions(protectablePositions);
      return;
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
        // Need to add protecting of these positions when updating game board if protectablePositions is not null
        protectablePositions,
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
      <Board
        board={board}
        teams={teams}
        protectablePositions={protectablePositions}
        handleProtectPositions={handleProtectPosition}
        handleTurn={handleTurn}
      />
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
