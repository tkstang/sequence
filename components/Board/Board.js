import {
  BoardContainer,
  BoardGrid,
  BoardPosition,
  CardContainer,
  Card,
  Chip,
} from './Board.styles';

const Board = ({ board, teams, handleTurn }) => {
  return (
    <BoardContainer>
      <BoardGrid>
        {board.map((row) =>
          row.map(({ position, value }) => {
            const card = position.slice(1);

            return (
              <CardContainer key={position} onClick={() => handleTurn(position, value)}>
                <Card width="auto" height="auto" value={position} src={`/cards/${card}.svg`} />
                {/* Add chip if value is not null and pass team as prop to determing color -- Also this means I think the value of a given position should be something like P#T* so both player number and team can be derived */}
                {value && <Chip team={`team${teams[value]}`} />}
              </CardContainer>
            );
          })
        )}
      </BoardGrid>
    </BoardContainer>
  );
};

export default Board;
