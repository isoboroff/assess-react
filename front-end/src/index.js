import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import DashboardApp from './Dashboard';
import reportWebVitals from './reportWebVitals';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const routes = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/dashboard", element: <DashboardApp /> },
]);

ReactDOM.render(
  <React.StrictMode>
    <RouterProvider router={routes} />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
