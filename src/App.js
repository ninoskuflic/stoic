import React, { useEffect, useState } from 'react';
import './App.scss';
import Loading from './loading.svg'
export default function App() {
  // API State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Function to fetch data based on ID
  const fetchData = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://api.learn.skuflic.com/stoic/${id}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }

  // Function to fetch new random quote
  const fetchRandomQuote = () => {
    const randomId = Math.floor(Math.random() * 100) + 1; // Generate random ID between 1 and 100
    fetchData(randomId);
  }

  // Fetch random quote on component mount
  useEffect(() => {
    fetchRandomQuote();
  }, []);

  return (
    <>
      {loading ? (
        <div className='loading'><img src={Loading} alt='Loading' /></div>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : (
        <>
          <header>
            <h1>STOIC QUOTES</h1>
          </header>
          <main>
            <h1>"{data?.quote}"</h1>
            <p>— {data?.author}, {data?.year}</p>
          </main >
          <footer>
            <button onClick={fetchRandomQuote}>New Quote</button>
            <div className='legal'>
              <div>
                <a href='https://go.skuflic.com/terms' target='_blank' rel='noreferrer'>Terms of Use</a>
                <a href='https://go.skuflic.com/servicesagreement' target='_blank' rel='noreferrer'>Services Agreement</a>
                <a href='https://go.skuflic.com/privacy' target='_blank' rel='noreferrer'>Privacy Policy</a>
              </div>
              <p>TM and Copyright &copy; {new Date().getFullYear()} Skuflic.com. All rights reserved. Quotes provided are AI-generated for inspirational purposes only.</p>
            </div>
          </footer>
        </>
      )}
    </>
  );
}
