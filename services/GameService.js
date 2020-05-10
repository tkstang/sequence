import db from 'db/firebase-client';
import { mapBoardDataToArray } from 'utils/game';

const subscribe = (gameName, setLoading, setBoard) => {
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
        setBoard(board);
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
