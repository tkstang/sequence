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
