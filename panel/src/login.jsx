import React, {useState} from 'react';
import API from './api';

export default function Login({onLogin}){
  const [u,setU]=useState('admin');
  const [p,setP]=useState('admin');
  const [err,setErr]=useState('');

  const submit = async ()=>{
    try{
      const r = await API.post('/auth/login',{username:u,password:p});
      onLogin(r.data.token);
    }catch(e){
      setErr('Credenciales inválidas');
    }
  };

  return (
    <div style={{padding:20}}>
      <h2>Panel Revendedores</h2>

      <input value={u} onChange={e=>setU(e.target.value)} placeholder="usuario"/><br/>
      <input value={p} onChange={e=>setP(e.target.value)} placeholder="password" type="password"/><br/>

      <button onClick={submit} style={{marginTop:10}}>Entrar</button>

      <div style={{color:'red',marginTop:10}}>{err}</div>
    </div>
  );
}
