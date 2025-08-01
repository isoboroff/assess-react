// From https://devtrium.com/posts/how-keyboard-shortcut

// To use:

// import useKeyPress from './useKeyPress';
//
// export default function App() {
//   const onKeyPress = (event) => {
//     console.log(`key pressed: ${event.key}`);
//   };
//
//   useKeyPress(['a', 'b', 'c'], onKeyPress);
//
//   return (
//     <div>
//       <h1>Hello world</h1>
//     </div>
//   );
// }


import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

const useKeyPress = (keys, callback, node = null) => {
  // implement the callback ref pattern
  // (https://epicreact.dev/the-latest-ref-pattern-in-react/)
  const callbackRef = useRef(callback);
  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  // handle what happens on key press
  const handleKeyPress = useCallback(
    (event) => {
      // check if one of the key is part of the ones we want
      if (keys.some((key) => event.key === key)) {
        callbackRef.current(event);
      }
    },
    [keys]
  );

  useEffect(() => {
    // target is either the provided node or the document
    const targetNode = node ?? document;
    // attach the event listener
    targetNode &&
      targetNode.addEventListener("keydown", handleKeyPress);

    // remove the event listener
    return () =>
      targetNode &&
      targetNode.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress, node]);
};

export { useKeyPress as default };
