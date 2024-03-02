import React, { useEffect, useState } from 'react';
import './App.scss';
import Loading from './loading.svg';
import pluralize from 'pluralize';

export default function App() {
  // API State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0); // State to hold remaining time until next quote refresh

  const storecurrentQuoteInLocalStorage = (quoteObject) => {
    const currentTime = Math.floor(Date.now() / 1000); // Get current Unix timestamp in seconds
    const dataToStore = {
      id: quoteObject.id,
      quote: quoteObject.quote,
      author: quoteObject.author,
      year: quoteObject.year,
      timestamp: currentTime,
    };
    localStorage.setItem('currentQuote', JSON.stringify(dataToStore));
  };


  // Function to fetch data based on ID
  const fetchData = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://api.learn.skuflic.com/stoic/${id}`);
      const result = await response.json();
      setData(result);
      storecurrentQuoteInLocalStorage(result);
    } catch (error) {
      setError(error);
    } finally {

      setTimeout(() => {
        setLoading(false);
      }, '500');
    }
  }

  // Function to fetch new random quote
  const fetchRandomQuote = () => {
    let shownQuotes = JSON.parse(localStorage.getItem('shownQuotes')) || [];

    const generateRandomId = () => Math.floor(Math.random() * 100) + 1;

    let randomId = generateRandomId();

    // Check if randomId already exists in shownQuotes
    while (shownQuotes.includes(randomId)) {
      randomId = generateRandomId();
    }

    // If shownQuotes length exceeds 90, remove the oldest item
    if (shownQuotes.length >= 90) {
      shownQuotes.shift(); // Remove the oldest item
    }

    fetchData(randomId);

    // Update shownQuotes in localStorage
    shownQuotes.push(randomId);
    localStorage.setItem('shownQuotes', JSON.stringify(shownQuotes));
  }


  const isQuoteOlderThan24Hours = (storedTimestamp) => {
    if (!storedTimestamp) return true; // If there's no timestamp, consider it older
    const currentTime = new Date().getTime(); // Current time in milliseconds
    const storedTime = storedTimestamp * 1000; // Convert stored timestamp from seconds to milliseconds
    const millisecondsPerHour = 3600 * 1000; // 1 hour in milliseconds
    const hoursPerDay = 24;
    const millisecondsPerDay = hoursPerDay * millisecondsPerHour; // 24 hours in milliseconds
    return (currentTime - storedTime) >= millisecondsPerDay;
  };


  // Function to calculate remaining time until next quote refresh
  const calculateTimeRemaining = () => {
    const storedQuote = JSON.parse(localStorage.getItem('currentQuote'));
    if (storedQuote) {
      const currentTime = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds
      const nextRefreshTimestamp = storedQuote.timestamp + 24 * 60 * 60; // Timestamp for next refresh (24 hours later)
      const remainingTime = nextRefreshTimestamp - currentTime;
      setTimeRemaining(remainingTime > 0 ? remainingTime : 0);
    }
  };


  const formatTimeRemaining = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    return `
    
    ${hours} ${pluralize('hour', hours)}
    
    ${minutes} ${pluralize('minute', minutes)}
    
    ${seconds} ${pluralize('second', seconds)}`;
  };

  // Fetch random quote on component mount
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    const storedQuote = JSON.parse(localStorage.getItem('currentQuote'));

    if (storedQuote == null) {
      fetchRandomQuote();
    } else if (isQuoteOlderThan24Hours(storedQuote.timestamp)) {
      fetchRandomQuote();
    } else {
      setData(storedQuote);
      setLoading(false);
    }

    // Calculate time remaining on component mount
    calculateTimeRemaining();

    // Update time remaining every second
    const timer = setInterval(() => {
      calculateTimeRemaining();
    }, 1000);

    return () => clearInterval(timer); // Cleanup interval on unmount
  }, []);

  useEffect(() => {
    if (!isInitialRender && timeRemaining === 0) {
      fetchRandomQuote();
    } else {
      setIsInitialRender(false);
    }
  }, [timeRemaining]);


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
                <p className='next-qoute'>Next quote available in {formatTimeRemaining(timeRemaining)}</p>
                <h1>'{data?.quote}'</h1>
                <p>— {data?.author}, {data?.year}</p>
              </main>
          }

          <footer>
            <div className='legal'>
              <div>
                <a href='https://go.skuflic.com/servicesagreement' target='_blank' rel='noreferrer'>Services Agreement</a>
                <a href='https://go.skuflic.com/privacy' target='_blank' rel='noreferrer'>Privacy Policy</a>
                <a href='https://go.skuflic.com/report-a-bug' target='_blank' rel='noreferrer'>Bug Report</a>
                <a href='https://go.skuflic.com/status' target='_blank' rel='noreferrer'>System Status</a>
              </div>
              <p>TM and Copyright &copy; {new Date().getFullYear()} Skuflic.com. All rights reserved.</p>
            </div>
          </footer>
        </>
      )}
    </>
  );
}