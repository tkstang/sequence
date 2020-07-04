import styled from 'styled-components';

const BoardContainer = styled.div`
  background-color: black;
  height: 100vh;
  width: 100vw;
`;

const BoardGrid = styled.div`
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  grid-template-rows: repeat(10, 1fr);
  grid-column-gap: 10px;
  grid-row-gap: 10px;

  > * {
    overflow: auto;
  }
`;

const BoardPosition = styled.div`
  width: 100%;
  height: 100%;
  background-color: grey;
  background: url(${({ card }) => `/cards/${card}.svg`});
`;

const CardContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const Card = styled.img`
  width: ${({ dimensions }) => `${dimensions.height}px`};
  height: ${({ dimensions }) => `${dimensions.width}px`};
  transform: rotate(90deg);
  transform-origin: 0 0;
  margin-left: 100%;

  &:hover {
    cursor: pointer;
  }
`;

const Chip = styled.div`
  z-index: 1;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70%;
  height: 70%;
  margin-left: -35%;
  margin-top: -35%;
  /* padding: 20px; */
  background-color: ${({ team }) => {
    switch (team) {
      case 'team1':
        return 'blue';
      case 'team2':
        return 'green';
      case 'team3':
        return 'red';
      default:
        return 'black';
    }
  }};
  opacity: ${({ isProtectable, isProtected }) => {
    if (!isProtectable) return 0.8;
    return isProtected ? 1 : 0.4;
  }};
  border-radius: 50%;

  &:hover {
    cursor: pointer;
  }
`;

export { BoardContainer, BoardGrid, BoardPosition, CardContainer, Card, Chip };
