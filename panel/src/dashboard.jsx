import React, {useEffect, useState} from 'react';
import API from './api';

export default function Dashboard({token,onLogout}){
  const [users,setUsers]=useState([]);
  const [mac,setMac]=useState('');
  const [m3u,setM3u]=useState('');
  const [days,setDays]=useState(5);
  const [msg,setMsg]=useState('');

  useEffect(()=>{
    API.defaults.headers.common['Authorization']='Bearer '+token;
    load();
  },[]);

  const load = async ()=>{
    try{
      const r = await API.get('/reseller/users');
      setUsers(r.data.users||[]);
    }catch(e){
      setMsg('No se pudo cargar usuarios');
    }
  };

  const activate = async ()=>{
    try{
      await API.post('/reseller/activate',{
        mac,
        password:'x',
        duration_days:Number(days),
        m3u_url:m3u
      });
      setMsg('Activado');
      load();
    }catch(e){
      setMsg('Error al activar');
    }
  };

  const deactivate = async (macv)=>{
    try{
      await API.post('/reseller/deactivate',{mac:macv});
      setMsg('Desactivado');
      load();
    }catch(e){
      setMsg('Error');
    }
  };

  return (
    <div style={{padding:20,fontFamily:'Arial'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Panel Revendedores</h2>
        <button onClick={onLogout}>Salir</button>
      </div>

      <h3>Usuarios</h3>

      <table border="1" cellPadding="6">
        <thead>
          <tr><th>MAC</th><th>Activo</th><th>Expira</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {users.map(u=>(
            <tr key={u.mac}>
              <td>{u.mac}</td>
              <td>{u.active ? "Sí" : "No"}</td>
              <td>{u.expires_at || ''}</td>
              <td><button onClick={()=>deactivate(u.mac)}>Desactivar</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{marginTop:20}}>Activar nuevo dispositivo</h3>

      <input placeholder="MAC" value={mac} onChange={e=>setMac(e.target.value)}/><br/>
      <input placeholder="URL M3U" value={m3u} onChange={e=>setM3u(e.target.value)}/><br/>
      <input placeholder="Días" type="number" value={days} onChange={e=>setDays(e.target.value)}/><br/>
      
      <button onClick={activate} style={{marginTop:10}}>Activar</button>
      <div style={{color:'green',marginTop:10}}>{msg}</div>
    </div>
  );
}
