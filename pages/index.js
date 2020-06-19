import { Button } from 'components';
import { HomeContainer } from './page-styles/Home.styles';

const Home = () => {
  return (
    <HomeContainer>
      <Button href="/game/new">Start a New Game</Button>
    </HomeContainer>
  );
};

export default Home;
