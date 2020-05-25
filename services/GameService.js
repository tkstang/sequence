import db from 'db/firebase-client';
import { mapBoardDataToArray } from 'utils/game';

const subscribe = (gameName, setLoading, setBoard, setPlayerTurn, setTeams) => {
  try {
    const unsubscribe = db
      .collection('games')
      .doc(gameName)
      .onSnapshot((doc) => {
        // doc.docChanges().forEach((change) => {
        //   console.log({ change });
        // });
        const game = doc.data();
        console.log({ game });

        const board = mapBoardDataToArray(game.board);
        // FIXME: Is there any benefit to breaking it down like this? Maybe just one setGame
        setBoard(board);
        setPlayerTurn(game.playerTurn);
        setTeams(game.teams);
        setLoading(false);
      });

    return unsubscribe;
  } catch (error) {
    setLoading(false);
    console.error(error);

    // FIXME: Handle error differently, maybe setSubscribeError?
    throw new Error(error.message);
  }
};

export { subscribe };
