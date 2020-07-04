import { useRef, useLayoutEffect, useEffect, useState } from 'react';
import { throttle } from 'throttle-debounce';
import {
  BoardContainer,
  BoardGrid,
  BoardPosition,
  CardContainer,
  Card,
  Chip,
} from './Board.styles';

const Board = ({ board, teams, handleTurn, handleProtectPosition, protectablePositions }) => {
  console.log({ protectablePositions });
  const targetRef = useRef();
  const [cardDimensions, setCardDimensions] = useState(null);

  const updateCardDimensions = throttle(500, () => {
    console.log('updating');
    if (targetRef.current) {
      setCardDimensions({
        width: targetRef.current.offsetWidth,
        height: targetRef.current.offsetHeight,
      });
    }
  });

  useLayoutEffect(() => {
    if (targetRef.current) {
      setCardDimensions({
        width: targetRef.current.offsetWidth,
        height: targetRef.current.offsetHeight,
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateCardDimensions);

    return () => window.removeEventListener('resize', updateCardDimensions);
  }, []);

  return (
    <BoardContainer>
      <BoardGrid>
        {board.map((row, rowIndex) =>
          row.map(({ position, positionData }, columnIndex) => {
            let value = positionData;
            // TODO: Add some sort of indicator that position is protected

            if (protectablePositions) {
              value = protectablePositions[position] ?? value;
            }

            const { isProtected, team } = value;

            const card = position.slice(1);

            return (
              <CardContainer
                ref={rowIndex === 0 && columnIndex === 0 ? targetRef : null}
                key={position}
                onClick={() =>
                  protectablePositions
                    ? handleProtectPosition(rowIndex, columnIndex)
                    : handleTurn(rowIndex, columnIndex)
                }
              >
                {cardDimensions && (
                  <Card
                    dimensions={cardDimensions}
                    width="auto"
                    height="auto"
                    value={position}
                    src={`/cards/${card}.svg`}
                  />
                )}
                {/* Add chip if value is not null (or if value is a protectable position) and pass team as prop to determing color */}
                {team && (
                  <Chip
                    team={`team${team}`}
                    isProtected={isProtected}
                    isProtectable={protectablePositions && protectablePositions[position]}
                  />
                )}
              </CardContainer>
            );
          })
        )}
      </BoardGrid>
    </BoardContainer>
  );
};

export default Board;
