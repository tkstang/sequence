import Link from 'next/link';
import { HomeContainer } from './page-styles/Home.styles';

const Home = () => {
  return (
    <HomeContainer>
      <Link href="/game/new">
        <button type="submit">Start a New Game</button>
      </Link>
    </HomeContainer>
  );
};

export default Home;
