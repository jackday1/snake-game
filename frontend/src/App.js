// import { useEffect, useRef } from 'react';
// import socketIOClient from 'socket.io-client';

// const host = 'http://localhost:8888';

// const App = () => {
//   const socketRef = useRef();

//   useEffect(() => {
//     socketRef.current = socketIOClient.connect(host, {
//       auth: { token: 'abc' },
//     });
//   }, []);

//   const onClick = () => {
//     socketRef.current.emit('keydown', 'w');
//   };

//   return (
//     <>
//       <button onClick={onClick}>keydown</button>
//     </>
//   );
// };

// export default App;

import Navigations from './navigations';

const App = () => {
  return <Navigations />;
};

export default App;
