import { BoardContainer, BoardGrid, BoardPosition, Card } from './Board.styles';

const Board = ({ board }) => {
  console.log({ board });
  return (
    <BoardContainer>
      <BoardGrid>
        {board.map((row) =>
          row.map(({ position, value }) => {
            const card = position.slice(1);
            console.log({ card });
            return <Card key={position} width="auto" height="auto" src={`/cards/${card}.svg`} />;
          })
        )}
      </BoardGrid>
    </BoardContainer>
  );
};

export default Board;
