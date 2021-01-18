import { useState } from 'react';

// from https://usehooks.com/useLocalStorage/
// Make a state variable like useState, but that gets persisted
// in the window.localStorage
//
function useLocalStorage(key, initialValue) {
  // Intial state function
  const init = () => {
    try {
      // Check for value in localStorage, else return the initialValue
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log('Error initializing useLocalStorage for ' + key + ', ' + initialValue);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState(init);

  // set the stored value and mirror the update to localStorage
  const setValue = value => {
    try {
      const valueToStore =
            value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log('Error storing useLocalStorage for ' + value);
    }
  };

  return [storedValue, setValue];
}

export { useLocalStorage };
