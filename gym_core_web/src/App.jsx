import React, { useEffect, useState } from "react";
import SeccionAlumnos from "./seccionUsuarios";
import SeccionPlanes from "./seccionesPlanes";
import SeccionFinanzas from "./seccionFinanzas";
import SeccionSeguridad from "./seccionSeguridad";
import SeccionSoporte from "./seccionSoporte";

function App() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error,setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const [token,setToken] = useState(localStorage.getItem('token_web')  || null);
    const [rol, setRol] = useState(localStorage.getItem('rol_usuario')  ||  '');
    const [nombreGym, setNombreGym] = useState(localStorage.getItem('nombre_gimnasio')  || '');

    const [vistaActiva, setVistaActiva] = useState(0);

    //Fecha vencimiento
    const [fechaVencimientoSoftware, setFechaVencimientoSoftware]=useState(null);

    const consultarVencimientoLicenciaSaaS = async () => {
        const configGym=JSON.parse(localStorage.getItem('config_visual')) || {};
        const gimnasioId=configGym.gimnasio_id;

        if (!gimnasioId) return;

        const url="http://127.0.0.1:8000/v1/pago/gimnasio/vencimiento"

        try {
            const respuesta= await fetch(url,{
                method: "GET",
                headers:{
                    'Authorization': `Bearer ${localStorage.getItem('token_web')}`,
                },
            });

            if (respuesta.status===200) {
                setFechaVencimientoSoftware(datos.fecha_vencimiento);
            }
        } catch (error) {
            console.error("Error al auditar vencimiento", error)
        }
    };

    useEffect(()=>{
        if (rol==="Dueño") {
            consultarVencimientoLicenciaSaaS();
        }
    }, [rol])

    const cerrarSesion = () => {
        localStorage.clear();
        setToken(null);
        setRol('');
        setNombreGym('');
    }

    const manejarLogin = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        const url = `http://127.0.0.1:8000/v1/auth/login`;

        try {
            const respuesta= await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    contrasena: password,
                    cliente: "web"
                })
            });

            const datos = await respuesta.json();

            if (respuesta.status===200) {
                localStorage.setItem('token_web',datos.access_token);
                localStorage.setItem('rol_usuario', datos.rol);
                localStorage.setItem('gimnasio_id', datos.config_visual.gimnasio_id);
                localStorage.setItem('nombre_gimnasio', datos.config_visual.nombre_gimnasio);
                localStorage.setItem('usuario_id', datos.config_visual.usuario_id);

                setToken(datos.access_token)
                setRol(datos.rol);
                setNombreGym(datos.config_visual.nombre_gimnasio);

            } else {
                setError(datos.detail || 'Credenciales inválidas o cuenta inactiva.');
            }
        } catch (err) {
            console.error(err);
            setError('Error de red. Asegurate de que FastAPI esté encendido.');
        } finally {
            setCargando(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">

             <div className="bg-white p-8 rounded-2x1 shadow-x1 w-full max-w-md border border-slate-200">

                    <div className="text-center mb-8">

                     <div className="inline-flex p-3 bg-purple-100 text-purple-600 rounded-full mb-3">
                            <svg xmlns="http://w3.org" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Panel de Gestion</h2>
                        <p className="text-sm text-slate-500 mt-1">Ingresá para administrar la sucursal</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-lg text-sm mb-6 flex items-center">
                            <span className="font-semibold mr-1">Error:</span> {error}
                        </div>
                    )}

                    <form onSubmit={manejarLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Correo Electrónico</label>
                            <input
                                type="email"
                                required
                                placeholder="ejemplo@gym.com"
                                value={email}
                                onChange={(e)=>setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>
                    
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e)=> setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={cargando}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-purple-200 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-purple-400 disabled:cursor-not-allowed"
                        >
                        {cargando ? 'Verificando...' : 'Iniciar Sesión'}
                        </button> 
                        <div className="flex justify-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-5 border-t border-slate-100 pt-4">
                            <a href="/terminos" className="hover:text-purple-600 transition-colors">Términos</a>
                            <span>•</span>
                            <a href="/privacidad" className="hover:text-purple-600 transition-colors">Privacidad</a>
                            <span>•</span>
                            <a href="/cookies" className="hover:text-purple-600 transition-colors">Cookies</a>
                        </div>     
                    </form>
                </div>    
            </div>    
        );
    };

    return(
        <div className="min-h-screen bg-slate-50 flex">
            <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-lg text-white truncate max-w-[140px]">{nombreGym}</h1>
                        <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">{rol}</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setVistaActiva(0)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${vistaActiva === 0 ? 'bg-purple-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                    <svg xmlns="http://w3.org" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    Usuarios
                    </button>

                    <button
                        onClick={()=>setVistaActiva(1)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${vistaActiva === 1 ? 'bg-purple-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                        <svg xmlns="http://w3.org" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                        Planes del Gym
                    </button>

                    {rol === 'Dueño'&& (
                        <button
                            onClick={()=> setVistaActiva(2)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${vistaActiva === 2 ? 'bg-purple-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                        >
                            <svg xmlns="http://w3.org" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            Finanzas (Caja)
                        </button>
                    )}
                    <button
                        onClick={()=>setVistaActiva(3)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${
                            vistaActiva === 3 
                            ? 'bg-purple-600 text-white shadow-md' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                    >
                        <svg xmlns="http://w3.org" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                        Mi Seguridad
                    </button>
                    {rol==="Dueño" && (
                        <button 
                            onClick={()=>setVistaActiva(4)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${vistaActiva === 4 ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                            >
                                <svg xmlns="http://w3.org" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                Soporte Técnico 
                        </button>
                    )}
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={cerrarSesion}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 font-medium transition-all"
                    >
                        <svg xmlns="http://w3.org" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col overflow-y-auto">
                <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-8">
                    <h2 className="text-xl font-bold text-slate-800">
                        {vistaActiva===0 && "Gestión de Usuarios"}
                        {vistaActiva===1 && "Inventario de Planes Comerciales"}
                        {vistaActiva===2 && "Estadísticas Financieras y Recaudación"}
                        {vistaActiva===3 && "Cambiar Contraseña"}
                        {vistaActiva===4 && "Ayuda y Consultas"}
                    </h2>
                    <div className="flex items-center gap-3">
                        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-sm font-semibold text-slate-600">Terminal Web Activa</span>
                    </div>
                </header>

                {rol==="Dueño" && (()=>{
                    if (!fechaVencimientoSoftware) return null;

                    const soloFechaStr = fechaVencimientoSoftware.includes('T')
                    ? fechaVencimientoSoftware.split('T')[0]
                    : fechaVencimientoSoftware.split('T')[0];
                    
                    const hoy = new Date();
                    hoy.setHours(0,0,0,0);

                    const fechaVence = new Date(soloFechaStr+'T00:00:00');

                    const diferenciaMilisegundos = fechaVence.getTime() - hoy.getTime();
                    const diasRestantes= Math.ceil(diferenciaMilisegundos/(1000*60*60*24));

                    if (diasRestantes >0 && diasRestantes<=10) {
                        return (
                            <div className="w-full bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500 text-white rounded-xl shadow-md">
                                        <svg xmlns="http://w3.org" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Período de Licenciamiento y Vencimiento Próximo</h4>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                             La suscripción mensual de su sucursal vence el próximo <strong>{fechaVence.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>. 
                                                Recuerde registrar el pago correspondiente antes del corte automático de servicio.
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black bg-amber-200 text-amber-800 px-3 py-1 rounded-xl uppercase tracking-widest">
                                    Quedan {diasRestantes} {diasRestantes === 1 ? 'Día' : 'Días'}
                                </span>
                            </div>
                        )
                    }
                    return null;
                })()}

                <div className="p-8 flex-1 flex flex-col gap-6">
                    {vistaActiva===0 && <SeccionAlumnos/>}
                    {vistaActiva === 1 && <SeccionPlanes/>}
                    {vistaActiva===2 && <SeccionFinanzas/>}
                    {vistaActiva===3 && <SeccionSeguridad/>}
                    {vistaActiva===4 && <SeccionSoporte/>}
                </div>
            </main>
        </div>
    )
}

export default App;