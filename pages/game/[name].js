import { useState, useEffect } from 'react';
import { subscribe } from 'services/GameService';
import { Loading, Board } from 'components';
import {
  checkPlayEligibility,
  checkForSequence,
  checkSequenceProtection,
  generateProtectSelectionBoard,
} from 'utils/game';

const Game = ({ gameName }) => {
  const [board, setBoard] = useState(null);
  const [playerTurn, setPlayerTurn] = useState(1);
  const [teams, setTeams] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playingTurn, setPlayingTurn] = useState(false);
  const [protectablePositions, setProtectablePositions] = useState(null);

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

  const handleProtectPosition = (rowIndex, columnIndex) => {
    const { position } = board[rowIndex][columnIndex];
    let protectableData = { ...protectablePositions };
    console.log('Protect position: ', position);
    // Check if key exists for position in protectable positions, if it doesn't show error message
    // If it does, set value of protectable position to true, increase protectablePositions.positionsProtected count
    if (protectableData[position]) {
      protectableData[position].isProtected = true;
      protectableData.positionsProtected++;
      protectableData.selectionBoard[rowIndex][columnIndex].positionData = {
        team: teams[playerTurn],
        isProtected: true,
      };
    }

    if (protectableData.positionsProtected % 5 === 0) {
      const selectionIsSequence = checkSequenceProtection(
        teams[playerTurn],
        protectableData.selectionBoard,
        rowIndex,
        columnIndex
      );

      if (selectionIsSequence) {
        protectableData.sequencesProtected++;
      } else {
        // User has made an error in selecting protected positions, they must restart the process
        // TODO: Add error notification
        protectableData = {
          ...protectableData,
          ...protectableData.resetData,
          positionsProtected: 0,
          sequencesProtected: 0,
        };
      }
      // Clear selection board for verifying sequence of next selections
      protectableData.selectionBoard = generateProtectSelectionBoard();
    }

    if (
      protectableData.positionsProtected === protectableData.positionsToProtect &&
      protectableData.sequencesProtected === protectableData.sequencesToProtect
    ) {
      // FIXME: Set protection data here next!
      // fetch play turn url with protect data to update all of those positions with team data and protected
      setProtectablePositions(null);
    } else {
      setProtectablePositions({
        ...protectableData,
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
        handleProtectPosition={handleProtectPosition}
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
