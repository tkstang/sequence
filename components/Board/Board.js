import {
  BoardContainer,
  BoardGrid,
  BoardPosition,
  CardContainer,
  Card,
  Chip,
} from './Board.styles';

const Board = ({ board, teams, handleTurn, handleProtectPosition, protectablePositions }) => {
  return (
    <BoardContainer>
      <BoardGrid>
        {board.map((row, rowIndex) =>
          row.map(({ position, value }, columnIndex) => {
            if (protectablePositions) {
              value = protectablePositions[position] ?? value;
            }

            const card = position.slice(1);

            return (
              <CardContainer
                key={position}
                onClick={() =>
                  protectablePositions
                    ? handleProtectPosition(position)
                    : // May not need position as it can be derived from board[rowIndex][columnIndex].position
                      handleTurn(position, value, rowIndex, columnIndex)
                }
              >
                <Card width="auto" height="auto" value={position} src={`/cards/${card}.svg`} />
                {/* Add chip if value is not null (or if value is a protectable position) and pass team as prop to determing color */}
                {value && <Chip team={`team${value}`} />}
              </CardContainer>
            );
          })
        )}
      </BoardGrid>
    </BoardContainer>
  );
};

export default Board;
