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
          row.map(({ position, positionData }, columnIndex) => {
            let value = positionData.team;
            // TODO: Add some sort of indicator that position is protected
            const { isProtected } = positionData;

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
                    : handleTurn(rowIndex, columnIndex)
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
