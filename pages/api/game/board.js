import db from 'db/firebase-server';

export default async (req, res) => {
  const { gameName, position, playerTurn, teams, board } = JSON.parse(req.body);

  const teamTurn = teams[playerTurn];

  console.log(`Playing in position ${position} with value ${playerTurn} for team ${teamTurn}`);
  const { numberPlayers } = teams;

  const nextPlayer = playerTurn < numberPlayers ? playerTurn + 1 : 1;

  try {
    const gameRef = await db.collection('games').doc(gameName);

    // Pass board and position into game service function to check for a sequence
    // Will need to add some way to lock positions once a sequence has been made

    await gameRef.update({
      [`board.${position}`]: teamTurn,
      playerTurn: nextPlayer,
    });

    console.log('Played turn');
  } catch (e) {
    console.log(e.message);

    return res.status(500).json({ error: e.message });
  }

  return res.status(200).end('Success');
};
