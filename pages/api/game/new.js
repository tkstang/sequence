import db from 'db/firebase-server';
import { generateNewGame } from 'utils/game';

export default async (req, res) => {
  console.log(req.body);
  const gameName = req.body;

  console.log(`Creating game with name ${gameName}`);

  try {
    // This will overwrite a game matching the name, need to only create game if it does not exist.
    const newGame = generateNewGame();
    const game = await db.collection('games').doc(gameName).set(newGame);

    console.log('Created game', game);
  } catch (e) {
    console.log(e.message);

    return res.status(500).json({ error: e.message });
  }

  return res.status(200).json({ gameName });
};
