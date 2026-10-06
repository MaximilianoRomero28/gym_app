import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPlataforma(){
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const [cargando, setCargando]= useState(false);
    const [error,setError]= useState('');
    const navigate= useNavigate();

    const manejarLoginSoberano = async(e) =>{
        e.preventDefault();
        setError('');
        setCargando(true);

        const url=`http://127.0.0.1:8000/v1/plataforma/login`;

        try {
            const respuesta= await fetch(url,{
                method:'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    contrasena: password
                })
            });

            const datos=await respuesta.json();

            if (respuesta.status===200){
                sessionStorage.setItem('token_plataforma',datos.access_token);
                sessionStorage.setItem('nombre_admin',datos.nombre);

                navigate('/plataforma', {replace:true});
            } else {
                setError(datos.detail || 'Firma digital incorrecta o acceso no autorizado')
            }
        } catch (err){
            console.error(err);
            setError('Error de enlace de red con la central del servidor');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-slate-800 text-purple-400 rounded-xl mb-3 border border-slate-700 shadow-inner">
                        <svg xmlns="http://w3.org" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253"/>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-slate-100 tracking-tight">GymCore Multi-Tenant</h2>
                    <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mt-1">Consola de Control Admin</p>
                </div>
                {error && (
                    <div className="bg-red-950/50 border border-red-800 text-red-400 p-3 rounded-xl text-xs font-semibold mb-6">
                        {error}
                    </div>   
                )}

                <form 
                    onSubmit={manejarLoginSoberano}
                    className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email de Admin</label>
                            <input
                                type="email"
                                required
                                placeholder="root@gymcore.com"
                                value={email}
                                onChange={(e)=>setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm font-semibold"/>                                     
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contraseña</label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e)=>setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm font-semibold"
                                />
                        </div>

                        <button 
                            type="submit"
                            disabled={cargando}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-purple-900/30 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:bg-purple-800 disabled:cursor-not-allowed text-xs uppercase tracking-wider mt-2 cursor-pointer"
                            >
                                {cargando ? 'Verificando firmas...' : 'Autenticar Nodo Raíz'}
                            </button>
                    </form>
            </div>
        </div>
    );
}

export default LoginPlataforma;