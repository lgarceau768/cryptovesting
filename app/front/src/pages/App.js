import './App.css';
import React from 'react'
import { Switch, BrowserRouter as Router, Route, Redirect } from 'react-router-dom'
import LoginScreen from './Login';

function App() {
  return (
    <div className="App">
      <LoginScreen/>
    </div>
  );
}

export default App;
