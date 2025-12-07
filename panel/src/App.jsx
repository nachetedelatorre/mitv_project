import React, {useState} from 'react';
import Login from './login';
import Dashboard from './dashboard';

function App(){
  const [token,setToken]=useState(localStorage.getItem('token')||'');

  return token
    ? <Dashboard token={token} onLogout={()=>{localStorage.removeItem('token'); setToken('');}}/>
    : <Login onLogin={(t)=>{localStorage.setItem('token',t); setToken(t);}} />;
}

export default App;
