import { useState } from 'react';
import Router from 'next/router';

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
    <>
      <label htmlFor="game-name">
        Give the game a name so others can join:
        <input
          type="text"
          id="game-name"
          name="name"
          onChange={(e) => setGameName(e.target.value)}
        />
      </label>
      <button onClick={handleSubmit} onKeyPress={handleSubmit} type="submit">
        Get Started!
      </button>
    </>
  );
};

export default NewGame;
