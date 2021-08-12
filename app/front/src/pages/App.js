import './App.css';
import React from 'react'
import { Switch, BrowserRouter as Router, Route, Redirect } from 'react-router-dom'
import LoginScreen from './Login';

function App() {
  window.myBlurFunction = function(state) {
      /* state can be 1 or 0 */
      var overlayEle = document.getElementById('overlay');

      if (state) {
          overlayEle.style.display = 'block';
      } else {
          overlayEle.style.display = 'none';
      }
  };
  return (
    <div className="App" id="App">
      <LoginScreen/>
      <div id="overlay"></div>
    </div>
  );
}

export default App;
