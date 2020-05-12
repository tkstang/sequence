const boardMap = [
  ['1WW', '1AC', '1KC', '1QC', '1TC', '19C', '18C', '17C', '16C', '2WW'],
  ['1AD', '17S', '18S', '19S', '1TS', '1QS', '1KS', '1AS', '15C', '12S'],
  ['1KD', '16S', '1TC', '19C', '18C', '17C', '16C', '12D', '14C', '13S'],
  ['1QD', '15S', '1QC', '18H', '17H', '16H', '15C', '13D', '13C', '14S'],
  ['1TD', '14S', '1KC', '19H', '12H', '15H', '24C', '14D', '12C', '25S'],
  ['19D', '23S', '2AC', '1TD', '13H', '14H', '23C', '15D', '1AH', '26S'],
  ['18D', '22S', '2AD', '1QH', '1KH', '2AH', '22C', '16D', '2KH', '27S'],
  ['17D', '22H', '2KD', '2QD', '2TD', '29D', '28D', '27D', '2QH', '28S'],
  ['26D', '23H', '24H', '25H', '26H', '27H', '28H', '29H', '2TH', '29S'],
  ['3WW', '25D', '24D', '23D', '22D', '2AS', '2KS', '2QS', '2TS', '4WW'],
];

const unflattenBoard = (flatBoard) => {
  const board = [];
  let rowIndex = -1;

  flatBoard.forEach((position, i) => {
    if (i % 10 === 0) {
      rowIndex++;
      board.push([]);
    }

    board[rowIndex].push(position);
  });

  return board;
};

const generateNewGame = (players = 2, teams = 2) => {
  const board = {};

  boardMap.forEach((row) => {
    row.forEach((position) => {
      board[position] = null;
    });
  });

  // console.log({ board });

  return {
    numberPlayers: players,
    numberTeams: teams,
    board,
  };
};

const mapBoardDataToArray = (boardObject) => {
  const flatBoard = boardMap.flat();

  flatBoard.forEach((position, i) => {
    // console.log({ position, key: boardObject[position] });
    flatBoard[i] = { position, value: boardObject[position] };
  });

  // console.log({ flatBoard });
  const board = unflattenBoard(flatBoard);

  return board;
};

export { generateNewGame, mapBoardDataToArray };
