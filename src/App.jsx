import React, { useEffect, useState } from 'react';
import './App.scss';
import Loading from './loading.svg';

export default function App() {
  // API State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [currentQuote, setCurrentQuote] = useState(null);

  // Function to fetch all quotes
  const fetchAllQuotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://api.learn.skuflic.com/stoic');
      const result = await response.json();
      setQuotes(result);
    } catch (error) {
      setError(error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  // Function to fetch new random quote
  const fetchRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setCurrentQuote(quotes[randomIndex]);
  };

  // Fetch all quotes on component mount
  useEffect(() => {
    fetchAllQuotes();
  }, []);

  // Fetch random quote on initial load
  useEffect(() => {
    if (quotes.length > 0) {
      fetchRandomQuote();
    }
  }, [quotes]);

  return (
    <>
      {error ? (
        <div className='error'>
          <h1>Whoopsy daisy</h1>
          <p>An unexpected error occurred, please contact support and provide this error message — {error.message.toLowerCase()}.</p>
        </div>
      ) : (
        <>
          {
            loading ? (
              <div className='loading'><img src={Loading} alt='Loading' /></div>
            ) :
              <main>
                <h1>'{currentQuote?.quote}'</h1>
                <p>— {currentQuote?.author}, {currentQuote?.year}</p>
              </main >
          }

          <footer>
            <button onClick={fetchRandomQuote} alt='refresh'>
              <span className='material-symbols-outlined'>
                refresh
              </span>
            </button>
            <div className='legal'>
              <div>
                <a href='https://go.skuflic.com/terms' target='_blank' rel='noreferrer'>Terms of Use</a>
                <a href='https://go.skuflic.com/servicesagreement' target='_blank' rel='noreferrer'>Services Agreement</a>
                <a href='https://go.skuflic.com/privacy' target='_blank' rel='noreferrer'>Privacy Policy</a>
              </div>
              <p>TM and Copyright &copy; {new Date().getFullYear()} Skuflic.com. All rights reserved. The quotes are AI-generated and for inspirational purposes only. While efforts have been made to ensure the accuracy and appropriateness of the content, it's important to recognize that AI-generated text may occasionally contain inaccuracies, offensive language, or incorrect information.</p>
            </div>
          </footer>
        </>
      )}
    </>
  );
}