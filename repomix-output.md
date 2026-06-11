This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.

# File Summary

## Purpose

This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format

The content is organized as follows:

1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
   a. A header with the file path (## File: path/to/file)
   b. The full contents of the file in a code block

## Usage Guidelines

- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes

- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching these patterns are excluded: **/\*.svg, **/\*.xml
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure

```
components/
  Board/
    Board.js
    Board.styles.js
  Button/
    Button.js
    Button.styles.js
  Loading/
    Loading.js
  index.js
db/
  firebase-client.js
  firebase-server.js
pages/
  api/
    game/
      board.js
      new.js
  game/
    [name].js
    new.js
  page-styles/
    Home.styles.js
    New.styles.js
  _app.js
  _document.js
  index.js
public/
  cards/
    AUTHORS.txt
    CHANGELOG.txt
    COPYING.LESSER.txt
    COPYING.txt
    NEWS.txt
    readme.txt
services/
  GameService.js
utils/
  game.js
.babelrc
.eslintrc
.gitignore
.nvmrc
.prettierrc
jsconfig.json
package.json
README.md
```

# Files

## File: .nvmrc

```
v14
```

## File: components/Button/Button.js

```javascript
import PropTypes from 'prop-types';
import Link from 'next/link';
import ButtonStyles from './Button.styles';

const Button = ({ children, type, href, onKeyPress, onClick }) => {
  if (href) {
    return (
      <Link href={href}>
        <ButtonStyles type={type} onClick={onClick} onKeyPress={onKeyPress}>
          {children}
        </ButtonStyles>
      </Link>
    );
  }
  return (
    <ButtonStyles type={type} onClick={onClick} onKeyPress={onKeyPress}>
      {children}
    </ButtonStyles>
  );
};

Button.propTypes = {
  type: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  href: PropTypes.string,
  onClick: PropTypes.func,
  onKeyPress: PropTypes.func,
};

Button.defaultProps = {
  type: 'submit',
  href: null,
  onClick: () => {},
  onKeyPress: () => {},
};

export default Button;
```

## File: components/Button/Button.styles.js

```javascript
import styled from 'styled-components';

const ButtonStyles = styled.button`
  padding: 20px;

  &:hover {
    cursor: pointer;
  }
`;

export default ButtonStyles;
```

## File: components/Loading/Loading.js

```javascript
const Loading = ({ size, color }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <g transform="translate(100 100)">
        <path
          transform="translate(-50 -50)"
          fill={color}
          d="M92.71,7.27L92.71,7.27c-9.71-9.69-25.46-9.69-35.18,0L50,14.79l-7.54-7.52C32.75-2.42,17-2.42,7.29,7.27v0 c-9.71,9.69-9.71,25.41,0,35.1L50,85l42.71-42.63C102.43,32.68,102.43,16.96,92.71,7.27z"
        />
        <animateTransform
          attributeName="transform"
          type="scale"
          values="1; 1.5; 1.25; 1.5; 1.5; 1;"
          dur="1s"
          repeatCount="indefinite"
          additive="sum"
        />
      </g>
    </svg>
  );
};

export default Loading;
```

## File: db/firebase-client.js

```javascript
// Initialize Firebase
import firebase from 'firebase/app';
import 'firebase/firestore';

const config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DB_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const clientFirebase = !firebase.apps.length ? firebase.initializeApp(config) : firebase.app();

const db = clientFirebase.firestore();

export default db;
```

## File: db/firebase-server.js

```javascript
import * as admin from 'firebase-admin';

const serverFirebase = !admin.apps.length
  ? admin.initializeApp({
      credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    })
  : admin.app();

const db = serverFirebase.firestore();

export default db;
```

## File: pages/page-styles/New.styles.js

```javascript
import styled from 'styled-components';

const NewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;

  label {
    display: flex;
    flex-direction: column;

    input {
      margin-top: 20px;
      height: 30px;
    }
  }
`;

export { NewContainer, FormContainer };
```

## File: pages/\_document.js

```javascript
import Document from 'next/document';
import { ServerStyleSheet } from 'styled-components';

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;
    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />),
        });
      const initialProps = await Document.getInitialProps(ctx);

      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      };
    } finally {
      sheet.seal();
    }
  }
}
```

## File: public/cards/NEWS.txt

```
10/29/2011 - Version 1.3 Released
             Additional cleanup/optimization of court cards.
             Card Back Template added. One can add their own image or pattern.
9/11/2011  - Version 1.2 Released
             Individual cards now offered in two versions (with or without crop
             marks) - A minor grouping error corrected in combined color set.
             In combined color set, Card names have been updated in xml.
6/08/2011  - Version 1.1 released - Wrong QH fixed. ESP cards added.
4/24/2011  - Initial 1.0 Release of Vectorized Playing Cards
```

## File: public/cards/readme.txt

```
These files comprise the Vectorized Playing Cards 1.3 graphics library.

Vectorized Playing Cards 1.3 Graphics Library is free software: you can
redistribute it and/or modify it under the terms of the GNU Lesser General
Public License as published by the Free Software Foundation, either version 3
of the License, or (at your option) any later version.

Vectorized Playing Cards 1.3 Library is distributed in the hope that it
will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with the Vectorized Playing Cards 1.3 Graphics Library.
If not, see <http://www.gnu.org/licenses/>.

______________________________________________

Vectorized Playing Cards 1.3
http://code.google.com/p/vectorized-playing-cards/
Copyright 2011 - Chris Aguilar

Licensing terms can be found in the files "Copying.txt" and "COPYING.LESSER.txt"

__________________________

This complete set of 52 playing card faces is based off the standard set dating
back to the late 1900's and in use in most modern decks today. The cards were
initially scanned from a real deck at 600 DPI and then auto traced with Inkscape
( www.inkscape.org ) as a starting point. Nearly every line/node was redrawn
from this initial starting point and then optimized to decrease file size and
create cleaner curves, sharper transitions, etc.

For .SVG capable editors (Inkscape and Illustrator CS5 tested) the cards are
offered individually (with and without crop marks) as a complete set of 52 (full
color), as a complete set of 52 (gray-scale) and as a complete set of 52 (High
contrast B/W). For those needing .eps, a complete conversion of all 52 faces (
singly) plus the two backs is also offered. A template with various card
elements (pips, numbers, etc.) is included for those who wish to use the
discrete objects.

There is now also a small set of ESP cards added.
__________________________


When using this library, please include with your project (be it a book,
program, derivative work, etc) the following attribution/credit per the LGPL 3.0
licensing terms:


Vectorized Playing Cards 1.3- http://code.google.com/p/vectorized-playing-cards/
Copyright 2011 - Chris Aguilar
Licensed under LGPL 3 - www.gnu.org/copyleft/lesser.html
```

## File: .prettierrc

```
{
  "printWidth": 100,
  "singleQuote": true,
  "tabWidth": 2
}
```

## File: README.md

````markdown
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/zeit/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/zeit/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/import?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
````

## File: pages/api/game/new.js

```javascript
import db from 'db/firebase-server';
import { generateNewGame } from 'utils/game';

export default async (req, res) => {
  const gameName = req.body;

  console.log(`Creating game with name ${gameName}`);

  try {
    // This will overwrite a game matching the name, need to only create game if it does not exist.
    const newGame = generateNewGame();
    const game = await db.collection('games').doc(gameName).set(newGame);

    console.log('Created game', game);
  } catch (e) {
    console.log(e.message);

    return res.status(500).json({ error: e.message });
  }

  return res.status(200).json({ gameName });
};
```

## File: pages/game/new.js

```javascript
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
```

## File: pages/page-styles/Home.styles.js

```javascript
import styled from 'styled-components';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

export { HomeContainer };
```

## File: services/GameService.js

```javascript
import db from 'db/firebase-client';
import { mapBoardDataToArray } from 'utils/game';

const subscribe = (gameName, setLoading, setBoard, setPlayerTurn, setTeams) => {
  try {
    const unsubscribe = db
      .collection('games')
      .doc(gameName)
      .onSnapshot((doc) => {
        // doc.docChanges().forEach((change) => {
        //   console.log({ change });
        // });
        const game = doc.data();
        console.log({ game });

        const board = mapBoardDataToArray(game.board);
        // FIXME: Is there any benefit to breaking it down like this? Maybe just one setGame
        setBoard(board);
        setPlayerTurn(game.playerTurn);
        setTeams(game.teams);
        setLoading(false);
      });

    return unsubscribe;
  } catch (error) {
    setLoading(false);
    console.error(error);

    // FIXME: Handle error differently, maybe setSubscribeError?
    throw new Error(error.message);
  }
};

export { subscribe };
```

## File: jsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~/*": ["./*"],
      "page-styles/*": ["./pages/page-styles/*"],
      "components/*": ["./components/*"],
      "styles/*": ["./styles/*"],
      "utils/*": ["./utils/*"],
      "db/*": ["./db/*"],
      "services/*": ["./services/*"]
    }
  }
}
```

## File: components/index.js

```javascript
import Loading from './Loading/Loading';
import Board from './Board/Board';
import Button from './Button/Button';

export { Loading, Board, Button };
```

## File: pages/\_app.js

```javascript
import Head from 'next/head';

const App = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>Sequence</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link
          href="https://fonts.googleapis.com/css?family=Quicksand:400,700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <style jsx global>
        {`
          body {
            margin: 0;
          }
        `}
      </style>
      <Component {...pageProps} />
    </>
  );
};

export default App;
```

## File: pages/index.js

```javascript
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
```

## File: .babelrc

```
{
  "presets": ["next/babel"],
  "plugins": [
    [
      "styled-components",
      {
        "ssr": true,
        "displayName": true,
        "preprocess": false
      }
    ],
    [
      "module-resolver",
      {
        "root": ["."],
        "alias": {
          "page-styles": "./pages/page-styles",
          "components": "./components",
          "db": "./db",
          "services": "./services"
        }
      }
    ]
  ]
}
```

## File: .eslintrc

```
{
  "root": true,
  "parser": "babel-eslint",
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:jsx-a11y/recommended",
    "plugin:react-hooks/recommended",
    "airbnb",
    "prettier"
  ],
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true,
    "node": true
  },
  "parserOptions": {
    "ecmaVersion": 2018,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    },
    "emitError": false,
    "failOnError": false
  },
  "settings": {
    "react": {
      "version": "detect"
    },
    "import/resolver": {
      "babel-module": {}
    }
  },
  "plugins": [],
  "globals": {
    "fetch": "readonly",
    "window": true,
    "document": true
  },
  "rules": {
    "react/jsx-filename-extension": "off",
    "react/jsx-props-no-spreading": "off",
    "react/react-in-jsx-scope": "off",
    "no-console": "off",
    "no-param-reassign": "off",
    "no-underscore-dangle": "off",
    "camelcase": "off",
    "no-plusplus": "off",
    "jsx-quotes": ["error", "prefer-double"],
    "jsx-a11y/label-has-for": [
      2,
      {
        "components": ["Label"],
        "required": {
          "some": ["nesting", "id"]
        },
        "allowChildren": false
      }
    ]
  }
}
```

## File: .gitignore

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
next.config.js


# firebase credentials
firebase-service-key-sequence-staging.json
firebase-service-key-sequence-production.json
```

## File: pages/api/game/board.js

```javascript
import db from 'db/firebase-server';

export default async (req, res) => {
  const { gameName, position, playerTurn, teams, board } = JSON.parse(req.body);

  const teamTurn = teams[playerTurn];

  console.log(`Playing in position ${position} with value ${playerTurn} for team ${teamTurn}`);
  const { numberPlayers } = teams;

  const nextPlayer = 1; // Temporary for dev;
  // const nextPlayer = playerTurn < numberPlayers ? playerTurn + 1 : 1;

  try {
    const gameRef = await db.collection('games').doc(gameName);

    // If protection data is passed in the body of this request we will instead be updating the data for all protected positions

    await gameRef.update({
      [`board.${position}`]: { team: teamTurn, isProtected: false },
      playerTurn: nextPlayer,
    });

    console.log('Played turn');
  } catch (e) {
    console.log(e.message);

    return res.status(500).json({ error: e.message });
  }

  return res.status(200).end('Success');
};
```

## File: package.json

```json
{
  "name": "sequence",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "firebase": "^7.14.3",
    "firebase-admin": "^8.12.1",
    "next": "9.3.6",
    "next-connect": "^0.6.6",
    "prop-types": "^15.7.2",
    "react": "16.13.1",
    "react-dom": "16.13.1",
    "styled-components": "^5.1.0",
    "throttle-debounce": "^2.2.1"
  },
  "devDependencies": {
    "babel-eslint": "^10.1.0",
    "babel-plugin-module-resolver": "^4.0.0",
    "babel-plugin-styled-components": "^1.10.7",
    "eslint": "^7.0.0",
    "eslint-config-airbnb": "^18.1.0",
    "eslint-config-prettier": "^6.11.0",
    "eslint-import-resolver-babel-module": "^5.1.2",
    "eslint-plugin-import": "^2.20.2",
    "eslint-plugin-jsx-a11y": "^6.2.3",
    "eslint-plugin-react": "^7.19.0",
    "eslint-plugin-react-hooks": "^4.0.0",
    "prettier": "^2.0.5"
  }
}
```

## File: components/Board/Board.styles.js

```javascript
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
```

## File: components/Board/Board.js

```javascript
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
```

## File: pages/game/[name].js

```javascript
import { useState, useEffect } from 'react';
import { subscribe } from 'services/GameService';
import { Loading, Board } from 'components';
import {
  checkPlayEligibility,
  checkForSequence,
  checkSequenceProtection,
  generateProtectSelectionBoard,
} from 'utils/game';

const Game = ({ gameName }) => {
  const [board, setBoard] = useState(null);
  const [playerTurn, setPlayerTurn] = useState(1);
  const [teams, setTeams] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playingTurn, setPlayingTurn] = useState(false);
  const [protectablePositions, setProtectablePositions] = useState(null);

  const playTurnUrl = `${location.protocol}//${location.host}/api/game/board`;

  useEffect(() => {
    setLoading(true);
    console.log('Subscribing');
    const unsubscribe = subscribe(gameName, setLoading, setBoard, setPlayerTurn, setTeams);

    return () => {
      console.log(`Unsubscribing from ${gameName}`);
      unsubscribe();
    };
  }, [gameName]);

  const handleProtectPosition = (rowIndex, columnIndex) => {
    const { position } = board[rowIndex][columnIndex];
    let protectableData = { ...protectablePositions };
    console.log('Protect position: ', position);
    // Check if key exists for position in protectable positions, if it doesn't show error message
    // If it does, set value of protectable position to true, increase protectablePositions.positionsProtected count
    if (protectableData[position]) {
      protectableData[position].isProtected = true;
      protectableData.positionsProtected++;
      protectableData.selectionBoard[rowIndex][columnIndex].positionData = {
        team: teams[playerTurn],
        isProtected: true,
      };
    }

    if (protectableData.positionsProtected % 5 === 0) {
      const selectionIsSequence = checkSequenceProtection(
        teams[playerTurn],
        protectableData.selectionBoard,
        rowIndex,
        columnIndex
      );

      if (selectionIsSequence) {
        protectableData.sequencesProtected++;
      } else {
        // User has made an error in selecting protected positions, they must restart the process
        // TODO: Add error notification
        protectableData = {
          ...protectableData,
          ...protectableData.resetData,
          positionsProtected: 0,
          sequencesProtected: 0,
        };
      }
      // Clear selection board for verifying sequence of next selections
      protectableData.selectionBoard = generateProtectSelectionBoard();
    }

    if (
      protectableData.positionsProtected === protectableData.positionsToProtect &&
      protectableData.sequencesProtected === protectableData.sequencesToProtect
    ) {
      // FIXME: Set protection data here next!
      // fetch play turn url with protect data to update all of those positions with team data and protected
      setProtectablePositions(null);
    } else {
      setProtectablePositions({
        ...protectableData,
      });
    }
  };

  // Move me to game service
  const handleTurn = async (rowIndex, columnIndex) => {
    if (playingTurn) {
      // Prevent multiple requests
      return;
    }
    const { position } = board[rowIndex][columnIndex];
    // Call checkPlayEligibility here

    const { isSequence, protectablePositions } = checkForSequence(
      teams[playerTurn],
      board,
      rowIndex,
      columnIndex
    );

    // There are more than 5 protectable positions, allow user to choose which positions to protect
    if (protectablePositions && Object.keys(protectablePositions).length > 5) {
      setProtectablePositions(protectablePositions);
      return;
    }
    console.log(playTurnUrl);
    const res = await fetch(playTurnUrl, {
      method: 'post',
      body: JSON.stringify({
        gameName,
        position,
        playerTurn,
        teams,
        board,
        // Need to add protecting of these positions when updating game board if protectablePositions is not null
        protectablePositions,
      }),
    });

    if (res.status === 500) {
      // Handle the error
    }
    setPlayingTurn(false);
  };

  return loading || !board ? (
    <Loading color="#000" size={100} />
  ) : (
    <>
      <Board
        board={board}
        teams={teams}
        protectablePositions={protectablePositions}
        handleProtectPosition={handleProtectPosition}
        handleTurn={handleTurn}
      />
    </>
  );
};

export const getServerSideProps = ({ query: { name } }) => {
  console.log(name);
  return {
    props: {
      gameName: name,
    },
  };
};

export default Game;
```

## File: utils/game.js

```javascript
const boardMap = [
  ['1WW', '1AC', '1KC', '1QC', '1TC', '19C', '18C', '17C', '16C', '2WW'],
  ['1AD', '17S', '18S', '19S', '1TS', '1QS', '1KS', '1AS', '15C', '12S'],
  ['1KD', '16S', '2TC', '29C', '28C', '27C', '26C', '12D', '14C', '13S'],
  ['1QD', '15S', '2QC', '18H', '17H', '16H', '25C', '13D', '13C', '14S'],
  ['1TD', '24S', '2KC', '19H', '12H', '15H', '24C', '14D', '12C', '25S'],
  ['19D', '23S', '2AC', '1TH', '13H', '14H', '23C', '15D', '1AH', '26S'],
  ['18D', '22S', '2AD', '1QH', '1KH', '2AH', '22C', '16D', '2KH', '27S'],
  ['17D', '22H', '2KD', '2QD', '2TD', '29D', '28D', '27D', '2QH', '28S'],
  ['26D', '23H', '24H', '25H', '26H', '27H', '28H', '29H', '2TH', '29S'],
  ['3WW', '25D', '24D', '23D', '22D', '2AS', '2KS', '2QS', '2TS', '4WW'],
];

const unflattenBoard = (flatBoard) => {
  const board = [];
  let rowIndex = -1;

  flatBoard.forEach((position, i) => {
    if (i % 10 === 0) {
      rowIndex++;
      board.push([]);
    }

    board[rowIndex].push(position);
  });

  return board;
};

const generateEmptyBoard = () => {
  const board = {};

  boardMap.forEach((row) => {
    row.forEach((position) => {
      board[position] = { team: null, isProtected: false };
    });
  });

  return board;
};

const generateNewGame = (numberPlayers = 2, numberTeams = 2) => {
  const board = generateEmptyBoard();

  const teams = {
    numberPlayers,
    numberTeams,
    1: 1,
    // FIXME: On init there will only be one player - this is for testing
    2: 2,
  };

  Array(numberTeams)
    .fill()
    .forEach((_, i) => {
      teams[`team${++i}Score`] = 0;
    });

  return {
    playerTurn: 1,
    board,
    teams,
  };
};

const mapBoardDataToArray = (boardObject) => {
  const flatBoard = boardMap.flat();

  flatBoard.forEach((position, i) => {
    flatBoard[i] = { position, positionData: boardObject[position] };
  });

  const board = unflattenBoard(flatBoard);

  return board;
};

const generateProtectSelectionBoard = () => {
  return mapBoardDataToArray(generateEmptyBoard());
};

const checkRow = (team, row, index) => {
  const getPosition = (i) => row[i].position;
  const getTeam = (i) => row[i].positionData.team;
  const getProtected = (i) => row[i].positionData.isProtected;

  const positions = {
    [getPosition(index)]: { team, isProtected: getProtected(index) },
  };
  let sequence = 1;

  // Move forward in row checking if position is held by team
  for (let i = index + 1; i < 10; i++) {
    if (getTeam(i) === team) {
      positions[getPosition(i)] = { team, isProtected: getProtected(i) };
      sequence++;
    } else {
      break;
    }
  }

  // Move backward in row checking if position is held by team
  for (let i = index - 1; i >= 0; i--) {
    if (getTeam(i) === team) {
      positions[getPosition(i)] = { team, isProtected: getProtected(i) };
      sequence++;
    } else {
      break;
    }
  }

  const rowSequenceFound = sequence >= 5;
  const rowPositions = rowSequenceFound ? positions : {};

  return { rowPositions, rowSequenceFound };
};

const checkColumn = (team, column, index) => {
  const getPosition = (i) => column[i].position;
  const getTeam = (i) => column[i].positionData.team;
  const getProtected = (i) => column[i].positionData.isProtected;
  console.log({ team, column, index });

  const positions = {
    [getPosition(index)]: { team, isProtected: getProtected(index) },
  };
  let sequence = 1;

  // Move down in column checking if position is held by team
  for (let i = index + 1; i < 10; i++) {
    if (getTeam(i) === team) {
      positions[getPosition(i)] = { team, isProtected: getProtected(i) };
      sequence++;
    } else {
      break;
    }
  }

  // Move up in column checking if position is held by team
  for (let i = index - 1; i >= 0; i--) {
    if (getTeam(i) === team) {
      positions[getPosition(i)] = { team, isProtected: getProtected(i) };
      sequence++;
    } else {
      break;
    }
  }

  const columnSequenceFound = sequence >= 5;
  const columnPositions = columnSequenceFound ? positions : {};

  return { columnPositions, columnSequenceFound };
};

const checkDiagonal = (team, board, rowIndex, columnIndex, direction) => {
  const getPosition = (r, c) => board[r][c].position;
  const getTeam = (r, c) => board[r][c].positionData.team;
  const getProtected = (r, c) => board[r][c].positionData.isProtected;

  const positions = {
    [getPosition(rowIndex, columnIndex)]: {
      team,
      isProtected: getProtected(rowIndex, columnIndex),
    },
  };
  let sequence = 1;
  let sequenceFound;
  let diagonalPositions;
  let c;
  let r;

  if (direction === 'forward') {
    // Check diagonally down left
    c = columnIndex - 1;
    for (r = rowIndex + 1; r < 10 && c >= 0; r++) {
      if (getTeam(r, c) === team) {
        positions[getPosition(r, c)] = { team, isProtected: getProtected(r, c) };
        sequence++;
        c--;
      } else {
        break;
      }
    }

    // Check diagonally up right
    c = columnIndex + 1;
    for (r = rowIndex - 1; r >= 0 && c < 10; r--) {
      if (getTeam(r, c) === team) {
        positions[getPosition(r, c)] = { team, isProtected: getProtected(r, c) };
        sequence++;
        c++;
      } else {
        break;
      }
    }

    sequenceFound = sequence >= 5;
    diagonalPositions = sequenceFound ? positions : {};
  } else {
    // Check diagonally down right
    c = columnIndex + 1;
    for (r = rowIndex + 1; r < 10 && c < 10; r++) {
      if (getTeam(r, c) === team) {
        positions[getPosition(r, c)] = { team, isProtected: getProtected(r, c) };
        sequence++;
        c++;
      } else {
        break;
      }
    }

    // Check diagonally up left
    c = columnIndex - 1;
    for (r = rowIndex - 1; r >= 0 && c >= 0; r--) {
      if (getTeam(r, c) === team) {
        positions[getPosition(r, c)] = { team, isProtected: getProtected(r, c) };
        sequence++;
        c--;
      } else {
        break;
      }
    }

    sequenceFound = sequence >= 5;
    diagonalPositions = sequenceFound ? positions : {};
  }

  return {
    [`${direction}DiagonalPositions`]: diagonalPositions,
    [`${direction}DiagonalSequenceFound`]: sequenceFound,
  };
};

const generateSequenceData = (team, board, rowIndex, columnIndex) => {
  const sequenceData = {};

  // Check all angles for sequence in case there is a sequence at more than one angle to give player opportunity to pick which sequence to protect
  const column = board.map((row) => row[columnIndex]);

  sequenceData.column = checkColumn(team, column, rowIndex);
  sequenceData.row = checkRow(team, board[rowIndex], columnIndex);
  sequenceData.forwardDiagonal = checkDiagonal(team, board, rowIndex, columnIndex, 'forward');
  sequenceData.backwardDiagonal = checkDiagonal(team, board, rowIndex, columnIndex, 'backward');

  return sequenceData;
};

const checkSequenceProtection = (team, board, rowIndex, columnIndex) => {
  console.log({ team, board, rowIndex, columnIndex });
  const sequenceData = generateSequenceData(team, board, rowIndex, columnIndex);
  let isSequence = false;

  Object.entries(sequenceData).forEach(([key, value]) => {
    if (value[`${key}SequenceFound`]) {
      isSequence = true;
    }
  });

  return isSequence;
};

const checkForSequence = (team, board, rowIndex, columnIndex) => {
  let isSequence = false;
  let numberOfSequences = 0;
  let positionsToProtect = null;
  // Once protectable positions is no longer null, add to object numberProtected: 0
  // Set value of protectable position key to teamTurn
  let protectablePositions = {};
  const sequenceData = generateSequenceData(team, board, rowIndex, columnIndex);

  Object.entries(sequenceData).forEach(([key, value]) => {
    if (value[`${key}SequenceFound`]) {
      isSequence = true;
      numberOfSequences++;

      protectablePositions = { ...protectablePositions, ...value[`${key}Positions`] };
    }
    console.log({ key, value, positions: value[`${key}Positions`] });
  });

  if (isSequence) {
    console.log('Sequence!');
    // There are exactly 5 positions in the sequence, these positions are automatically protected
    if (Object.keys(protectablePositions).length === 5) {
      positionsToProtect = protectablePositions;
      protectablePositions = null;
    } else {
      // Provide a data set to reset to in case user protection selection is erroneous
      protectablePositions.resetData = { ...protectablePositions };
      // This count will be used to determine when user has completed selection of positions to protect
      protectablePositions.positionsProtected = 0;
      protectablePositions.sequencesProtected = 0;
      // If the user got more than one sequence with this play we allow them to choose positions to protect for each
      protectablePositions.positionsToProtect = numberOfSequences * 5;
      protectablePositions.sequencesToProtect = numberOfSequences;
      protectablePositions.selectionBoard = generateProtectSelectionBoard();
    }
  } else {
    protectablePositions = null;
  }

  // If more than one sequence is found we need to return positions from all sequences as protectablePositions
  // If only one sequence is found but it has a sequence length greater than 5 we need to return those positions as protectable
  // If a sequence is found with only a length of five we need to return those positions to submit as protected but there is no need to update protectablePositions in state as the protected positions cannot be chosen
  console.log({ isSequence, protectablePositions, positionsToProtect });
  return {
    isSequence,
    protectablePositions,
    positionsToProtect,
  };
};

// This checks if the player is able to play in that position based on their hand
const checkPlayEligibility = (board, hand, position) => {
  // Check if player has a valid card to play in the position, if not notify player this is not an eligible play based ontheir hand
};

// TODO: Maybe split all of these utils into GameService and BoardService

export {
  generateNewGame,
  mapBoardDataToArray,
  checkPlayEligibility,
  checkForSequence,
  checkSequenceProtection,
  generateProtectSelectionBoard,
};
```
