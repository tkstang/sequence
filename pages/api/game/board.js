import db from 'db/firebase-server';

export default async (req, res) => {
  const { gameName, position, playerTurn, teams, board } = JSON.parse(req.body);

  const teamTurn = teams[playerTurn];

  console.log(`Playing in position ${position} with value ${playerTurn} for team ${teamTurn}`);
  const { numberPlayers } = teams;

  const nextPlayer = 1; // Temporary for dev;
  // const nextPlayer = playerTurn < numberPlayers ? playerTurn + 1 : 1;

  try {
    const gameRef = await db.collection('games').doc(gameName);

    // If protection data is passed in the body of this request we will instead be updating the data for all protected positions

    await gameRef.update({
      [`board.${position}`]: { team: teamTurn, isProtected: false },
      playerTurn: nextPlayer,
    });

    console.log('Played turn');
  } catch (e) {
    console.log(e.message);

    return res.status(500).json({ error: e.message });
  }

  return res.status(200).end('Success');
};
