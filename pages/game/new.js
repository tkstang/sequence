import { useState } from 'react';
import Router from 'next/router';
import { Button } from 'components';
import { NewContainer, FormContainer } from 'page-styles/New.styles';

const NewGame = () => {
  const [gameName, setGameName] = useState('');

  const handleSubmit = async () => {
    // TODO: Add validation

    const url = `${location.protocol}//${location.host}/api/game/new`;
    console.log({ url });

    const res = await fetch(url, {
      method: 'post',
      body: gameName,
    });
    const json = await res.json();
    if (res.status === 200) {
      console.log({ json });
      console.log({ name: json.gameName });
      Router.push('/game/[name]', `/game/${json.gameName}`);
    } else {
      console.log({ status: res.status, error: json.error });
    }
  };

  return (
    <NewContainer>
      <FormContainer>
        <label htmlFor="game-name">
          Give the game a name so others can join:
          <input
            type="text"
            id="game-name"
            name="name"
            onChange={(e) => setGameName(e.target.value)}
          />
        </label>
      </FormContainer>
      <Button onKeyPress={handleSubmit} onClick={handleSubmit}>
        Get Started!
      </Button>
    </NewContainer>
  );
};

export default NewGame;
