import {
  BoardContainer,
  BoardGrid,
  BoardPosition,
  CardContainer,
  Card,
  Chip,
} from './Board.styles';

const Board = ({ board }) => {
  const handleTurn = () => {};
  console.log({ board });
  return (
    <BoardContainer>
      <BoardGrid>
        {board.map((row) =>
          row.map(({ position, value }) => {
            const card = position.slice(1);
            console.log({ card });
            return (
              <CardContainer>
                <Card key={position} width="auto" height="auto" src={`/cards/${card}.svg`} />
                {/* Add chip if value is not null and pass team as prop to determing color -- Also this means I think the value of a given position should be something like P#T* so both player number and team can be derived */}
                <Chip />
              </CardContainer>
            );
          })
        )}
      </BoardGrid>
    </BoardContainer>
  );
};

export default Board;
