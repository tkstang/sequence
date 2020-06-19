const boardMap = [
  ['1WW', '1AC', '1KC', '1QC', '1TC', '19C', '18C', '17C', '16C', '2WW'],
  ['1AD', '17S', '18S', '19S', '1TS', '1QS', '1KS', '1AS', '15C', '12S'],
  ['1KD', '16S', '2TC', '29C', '28C', '27C', '26C', '12D', '14C', '13S'],
  ['1QD', '15S', '2QC', '18H', '17H', '16H', '15C', '13D', '13C', '14S'],
  ['1TD', '14S', '2KC', '19H', '12H', '15H', '24C', '14D', '12C', '25S'],
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

const generateNewGame = (numberPlayers = 2, numberTeams = 2) => {
  const board = {};

  boardMap.forEach((row) => {
    row.forEach((position) => {
      board[position] = { team: null, isProtected: false };
    });
  });

  const teams = {
    numberPlayers,
    numberTeams,
    1: 1,
    // FIXME: On init there will only be one player - this is for testing
    2: 2,
  };

  Array(numberTeams)
    .fill()
    .forEach((_, i) => {
      teams[`team${++i}Score`] = 0;
    });

  return {
    playerTurn: 1,
    board,
    teams,
  };
};

const mapBoardDataToArray = (boardObject) => {
  const flatBoard = boardMap.flat();

  flatBoard.forEach((position, i) => {
    flatBoard[i] = { position, positionData: boardObject[position] };
  });

  const board = unflattenBoard(flatBoard);

  return board;
};

const checkRow = (team, row, index) => {
  const positions = { [row[index].position]: team };
  let sequence = 1;

  // Move forward in row checking if position is held by team
  for (let i = index + 1; i < 10; i++) {
    if (row[i].positionData.team === team) {
      positions[row[i].position] = team;
      sequence++;
    } else {
      break;
    }
  }

  // Move backward in row checking if position is held by team
  for (let i = index - 1; i >= 0; i--) {
    if (row[i].positionData.team === team) {
      positions[row[i].position] = team;
      sequence++;
    } else {
      break;
    }
  }

  const rowSequenceFound = sequence >= 5;
  const rowPositions = rowSequenceFound ? positions : {};

  return { rowPositions, rowSequenceFound };
};

const checkColumn = (team, column, index) => {
  const positions = { [column[index].position]: team };
  let sequence = 1;

  // Move down in column checking if position is held by team
  for (let i = index + 1; i < 10; i++) {
    if (column[i].positionData.team === team) {
      positions[column[i].position] = team;
      sequence++;
    } else {
      break;
    }
  }

  // Move up in column checking if position is held by team
  for (let i = index - 1; i >= 0; i--) {
    if (column[i].positionData.team === team) {
      positions[column[i].position] = team;
      sequence++;
    } else {
      break;
    }
  }

  const columnSequenceFound = sequence >= 5;
  const columnPositions = columnSequenceFound ? positions : {};

  return { columnPositions, columnSequenceFound };
};

const checkDiagonal = (team, board, rowIndex, columnIndex, direction) => {
  const getPosition = (r, c) => board[r][c].position;
  const getTeam = (r, c) => board[r][c].positionData.team;
  const getProtected = (r, c) => board[r][c].positionData.isProtected;

  const positions = { [getPosition(rowIndex, columnIndex)]: team };
  let sequence = 1;
  let sequenceFound;
  let diagonalPositions;
  let c;
  let r;

  if (direction === 'forward') {
    // Check diagonally down left
    c = columnIndex - 1;
    for (r = rowIndex + 1; r < 10 && c >= 0; r++) {
      if (getTeam(r, c) === team) {
        positions[getPosition(r, c)] = { team, isProtected: getProtected(r, c) };
        sequence++;
        c--;
      } else {
        break;
      }
    }

    // Check diagonally up right
    c = columnIndex + 1;
    for (r = rowIndex - 1; r >= 0 && c < 10; r--) {
      if (getTeam(r, c) === team) {
        positions[getPosition(r, c)] = { team, isProtected: getProtected(r, c) };
        sequence++;
        c++;
      } else {
        break;
      }
    }

    sequenceFound = sequence >= 5;
    diagonalPositions = sequenceFound ? positions : {};
  } else {
    // Check diagonally down right
    c = columnIndex + 1;
    for (r = rowIndex + 1; r < 10 && c < 10; r++) {
      if (getTeam(r, c) === team) {
        positions[getPosition(r, c)] = { team, isProtected: getProtected(r, c) };
        sequence++;
        c++;
      } else {
        break;
      }
    }

    // Check diagonally up left
    c = columnIndex - 1;
    for (r = rowIndex - 1; r >= 0 && c >= 0; r--) {
      if (getTeam(r, c) === team) {
        positions[getPosition(r, c)] = { team, isProtected: getProtected(r, c) };
        sequence++;
        c--;
      } else {
        break;
      }
    }

    sequenceFound = sequence >= 5;
    diagonalPositions = sequenceFound ? positions : {};
  }

  return {
    [`${direction}DiagonalPositions`]: diagonalPositions,
    [`${direction}DiagonalSequenceFound`]: sequenceFound,
  };
};

const checkForSequence = (team, board, rowIndex, columnIndex) => {
  const sequenceData = {};
  let isSequence = false;
  let numberOfSequences = 0;
  let positionsToProtect = null;
  // Once protectable positions is no longer null, add to object numberProtected: 0
  // Set value of protectable position key to teamTurn
  let protectablePositions = {};

  // Check all angles for sequence in case there is a sequence at more than one angle to give player opportunity to pick which sequence to protect
  const column = board.map((row) => row[columnIndex]);

  sequenceData.column = checkColumn(team, column, rowIndex);
  sequenceData.row = checkRow(team, board[rowIndex], columnIndex);
  sequenceData.forwardDiagonal = checkDiagonal(team, board, rowIndex, columnIndex, 'forward');
  sequenceData.backwardDiagonal = checkDiagonal(team, board, rowIndex, columnIndex, 'backward');

  Object.entries(sequenceData).forEach(([key, value]) => {
    if (value[`${key}SequenceFound`]) {
      isSequence = true;
      numberOfSequences++;

      protectablePositions = { ...protectablePositions, ...value[`${key}Positions`] };
    }
    console.log({ key, value, positions: value[`${key}Positions`] });
  });

  if (isSequence) {
    console.log('Sequence!');
    // There are exactly 5 positions in the sequence, these positions are automatically protected
    if (Object.keys(protectablePositions).length === 5) {
      positionsToProtect = protectablePositions;
      protectablePositions = null;
    } else {
      // This count will be used to determine when user has completed selection of positions to protect
      protectablePositions.numberProtected = 0;
      // If the user got more than one sequence with this play we allow them to choose positions to protect for each
      protectablePositions.numberToProtect = numberOfSequences * 5;
    }
  } else {
    protectablePositions = null;
  }

  // If more than one sequence is found we need to return positions from all sequences as protectablePositions
  // If only one sequence is found but it has a sequence length greater than 5 we need to return those positions as protectable
  // If a sequence is found with only a length of five we need to return those positions to submit as protected but there is no need to update protectablePositions in state as the protected positions cannot be chosen

  return {
    isSequence,
    protectablePositions,
    positionsToProtect,
  };
};

// This checks if the player is able to play in that position based on their hand
const checkPlayEligibility = (board, hand, position) => {
  // Check if player has a valid card to play in the position, if not notify player this is not an eligible play based ontheir hand
};

// TODO: Maybe split all of these utils into GameService and BoardService

export { generateNewGame, mapBoardDataToArray, checkPlayEligibility, checkForSequence };
