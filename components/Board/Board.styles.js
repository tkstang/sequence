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

const Card = styled.img`
  width: 100%;
  height: 100%;
  transform: rotate(90deg);
`;

export { BoardContainer, BoardGrid, BoardPosition, Card };
