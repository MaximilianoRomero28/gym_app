import React, { useEffect, useState } from "react";

function PanelPlataforma(){
    const nombreAdmin=sessionStorage.getItem('nombre_admin') || 'Super Administrador';
    const tokenPlataforma=sessionStorage.getItem('token_plataforma');

    //Estados formularios
    const [nombreGimnasio, setNombreGimnasio]= useState('');
    const [ubicacion, setUbicacion]=useState('');
    const [nombreDueno,setNombreDueno]=useState('');
    const [emailDueno,setEmailDueno]= useState('');
    const [contrasenaDueno, setContrasenaDueno]= useState('');

    //Estados del Negocio/Listados
    const [listaGimnasios, setListaGimnasios] = useState([]);
    const [resumenFinanzas,setResumenFinanzas] = useState(null);
    const [cargandoLista, setCargandoLista] = useState(true);

    //Estados de caja
    const [gymSeleccionadoPago,setGymSeleccionadoPago] = useState(null);
    const [montoPago, setMontoPago] = useState('');
    const [diasCubierto,setDiasCubiertos] = useState('30');
    const [metodoPago, setMetodoPago] = useState('Transferencia');
    const [notaPago, setNotaPago] = useState('');

    const [gymSeleccionadoHistorial,setGymSeleccionadoHistorial]= useState(null);
    const [histortialPagos,setHistorialPagos] = useState([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);

    //Estado Control global
    const [cargando, setCargando] = useState(false);
    const [errorApi, setErrorApi] = useState('');
    const [exitoApi, setExitoApi] = useState('');
    
    const fetchPlataforma = async (endpoint,opciones={})=>{
        const url =`http://127.0.0.1:8000${endpoint}`;
        const cabecerasUnificadas ={
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenPlataforma}`,
            ...opciones.headers,
        };

        try {
            const respuesta = await fetch(url,
                {...opciones,
                    headers: cabecerasUnificadas
                }
            );

            if (respuesta.status===401 || respuesta.status===403) {
                const detalle=await respuesta.clone().json().catch(()=>({}));
                console.warn("Rechazado", respuesta.status,detalle.detail);
                sessionStorage.clear();
                window.location.href='/plataforma/login';
                return null;
            }
            return respuesta;
        } catch (error) {
            console.error("Error crítico en canal de plataforma:", error);
            throw error;
        }
    };

    const consultarTodoElSistemaSaas = async ()=>{
        try {
            const resGyms=await fetchPlataforma('/v1/plataforma/gimnasios');
            if (resGyms && resGyms.status===200){
                const datosGyms= await resGyms.json();
                setListaGimnasios(datosGyms);
            }

            const resMoneys= await fetchPlataforma('/v1/plataforma/finanzas/resumen')
            if (resMoneys && resMoneys===200) {
                const datosMoneys= await resMoneys.json();
                setResumenFinanzas(datosMoneys);
            }
        } catch (err) {
            console.error("Error en sincronización master:", err);
        } finally {
            setCargandoLista(false);
        }
    };
    
    useEffect(()=>{
        consultarTodoElSistemaSaas();
    },[]);

    const conmutarEstadoGimnasioApi = async (gimnasioId, estaActivoActualmente) => {
        setErrorApi(''); setExitoApi('');
        const endpointAccion = estaActivoActualmente
         ? `/v1/plataforma/gimnasios/${gimnasioId}/desactivar`
         : `/v1/plataforma/gimnasios/${gimnasiosId}/activar`;

        try {
            const respuesta=await fetchPlataforma(endpointAccion,{
                method: 'PATCH',
            });

            if (respuesta && respuesta.status===200){
                setExitoApi(`Estado de la sucursal ID #${gimnasioId} modificado`);
                consultarTodoElSistemaSaas();
            }
        } catch (err){
            setErrorApi('Error al conmutar licencia.');
        }
    };

    const manejarAltaGimnasioSoberano = async (e) =>{
        e.preventDefault();
        setErrorApi('');
        setExitoApi('');
        setCargando(true);

        try {
            const payload= {
                nombre_gimnasio: nombreGimnasio.trim(),
                ubicacion: ubicacion.trim(),
                nombre_dueno: nombreDueno.trim(),
                email_dueno: emailDueno.trim(),
                contrasena_dueno: contrasenaDueno
            };
            const respuesta= await fetchPlataforma('/v1/plataforma/gimnasios',{
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (!respuesta) return;

            const datos= await respuesta.json();

            if (respuesta.status===201){
                setExitoApi('¡Sucursal creada con éxito!')
                setNombreGimnasio('');
                setUbicacion('');
                setNombreDueno('');
                setEmailDueno('');
                setContrasenaDueno('');
                consultarTodoElSistemaSaas();
            } else {
                setErrorApi(datos.detail || 'No se pudo crear la sucursal');
            }
        } catch (err) {
            setErrorApi('Error al procesar el alta.')
        } finally {
            setCargando(false);
        }
    };

    const manejarCobroSuscripcionSaaS= async (e) => {
        e.preventDefault();
        setErrorApi('');
        setExitoApi('');
        setCargando(true);
        
        try {
            const payload= {
                gimnasio_id: gymSeleccionadoPago.id,
                monto: parseFloat(montoPago),
                dias_cubiertos: parseInt(diasCubierto),
                metodo_pago: metodoPago,
                nota: notaPago.trim()
            };

            const respuesta= await fetchPlataforma('/v1/plataforma/pagos',{
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (respuesta && respuesta.status===201){
                setExitoApi(`Recibo Procesado con éxito.`)
                setGymSeleccionadoPago(null),
                setMetodoPago(''),
                setNotaPago('');
                consultarTodoElSistemaSaas();
            } else {
                const errData= await respuesta.json();
                setErrorApi(errData.detail || 'No se pudo asentar el pago.');
            }
        } catch (err) {
            setErrorApi('Error al inyectar el cobro.');
        } finally {
            setCargando(false);
        }
    };

    const abrirHistorialPagosGym = async (gym) => {
        setGymSeleccionadoHistorial(gym);
        setCargandoHistorial(true);
        setHistorialPagos([]);
        
        try {
            const respuesta= await fetchPlataforma(`/v1/plataforma/gimnasios/${gym.id}/pagos`);
            if (respuesta && respuesta.status===200){
                const datos= await respuesta.json();
                setHistorialPagos(datos);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCargandoHistorial(false);
        }
    };

    const cerrarSesionSoberana = () => {
        sessionStorage.clear();
        window.location.href='/plataforma/login';
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-5">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Consola Máxima de Control</h1>
                        <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mt-0.5">Bienvenido: {nombreAdmin}</p>
                    </div>
                    <button 
                        onClick={cerrarSesionSoberana}
                        className="bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                        Cerrar Consola
                    </button>
                </div>

                {resumenFinanzas && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 animate-fade-in">
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Caja Histórica</p>
                            <h3 className="text-xl font-black text-emerald-400 mt-1">${parseFloat(resumenFinanzas.total_recaudado).toLocaleString('es-AR')}</h3>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facturado Este Mes</p>
                            <h3 className="text-xl font-black text-purple-400 mt-1">${parseFloat(resumenFinanzas.recaudado_este_mes).toLocaleString('es-AR')}</h3>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gimnasios Activos</p>
                            <h3 className="text-xl font-black text-slate-100 mt-1">{resumenFinanzas.gimnasios_activos}</h3>
                        </div>
                         <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gimnasios Inactivos</p>
                            <h3 className="text-xl font-black text-slate-400 mt-1">{resumenFinanzas.gimnasios_inactivos} Cancelados</h3>
                            </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md border-l-4 border-l-amber-500">
                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">⚠️ Licencias Vencidas</p>
                            <h3 className="text-xl font-black text-amber-400 mt-1">{resumenFinanzas.gimnasios_activos_con_pago_vencido} En Deuda</h3>
                        </div>
                    </div>    
                )}

                {errorApi && 
                    <div className="bg-red-950/40 border border-red-800 text-red-400 p-4 rounded-2xl text-sm font-semibold">
                        Error: {errorApi}
                    </div>
                }
                {exitoApi && (
                    <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-400 p-4 rounded-2xl text-sm font-semibold animate-fade-in">
                        {exitoApi}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <form   
                        onSubmit={manejarAltaGimnasioSoberano}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl sticky top-6">
                            <h3 className="text-xs font-black text-purple-400 uppercase tracking-wider border-b border-slate-800 pb-2">Agregar Sucursal</h3>
                            <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Gimnasio</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="GymCore Central"
                                    value={nombreGimnasio}
                                    onChange={(e)=>setNombreGimnasio(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ubicación</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Av. Corrientes 100, CABA"
                                    value={ubicacion}
                                    onChange={(e)=>setUbicacion(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                            </div>
                            <h3 className="ext-xs font-black text-purple-400 uppercase tracking-wider border-b border-slate-800 pb-2 pt-2">Credenciales del Dueño</h3>
                            <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Dueño</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Juan Pérez"
                                    value={nombreDueno}
                                    onChange={(e)=> setNombreDueno(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Acceso</label>
                                <input 
                                    type="email"
                                    required
                                    placeholder="juan@gym.com"
                                    value={emailDueno}
                                    onChange={(e)=>setEmailDueno(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contraseña Inicial</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Mínimo 8 dígitos"
                                    value={contrasenaDueno}
                                    onChange={(e)=> setContrasenaDueno(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                            </div>
                            <button
                                type="submit"
                                disabled={cargando}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer font-black uppercase tracking-wider disabled:bg-purple-800">
                                    {cargando ? 'Registrando...' : 'Agregar Gimnasio'}
                            </button>
                    </form>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                           <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">Directorio Multi-Gym</h3>
                            <button
                                onClick={consultarTodoElSistemaSaas}
                                className="bg-slate-800 text-slate-200 text-[10px] font-bold px-3 py-1 rounded-xl border border-slate-700 cursor-pointer">Recargar</button>
                        </div>
                        <div className="overflow-x-auto">
                            {cargandoLista ? (
                                <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Consultando servidor...</div>
                            ):(
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-widest border-b border-slate-800">
                                            <th className="py-3 px-4 font-bold w-12">Nodo</th>
                                            <th className="py-3 px-4 font-bold">Gimnasio</th>
                                            <th className="py-3 px-4 font-bold text-center">Usuarios</th>
                                            <th className="py-3 px-4 font-bold text-right">Abonado</th>
                                            <th className="py-3 px-4 font-bold text-center">Estado</th>
                                            <th className="py-3 px-4 font-bold text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                        {listaGimnasios.map((gym)=> (
                                            <tr key={gym.id} className="hover:bg-slate-950/40 transition-colors">
                                                <td className="py-3.5 px-4 font-mono text-purple-400 font-bold">#{gym.id}</td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-slate-100 text-xs">{gym.nombre}</div>
                                                    <div className="text-[10px] text-slate-500 mt-0.5">{gym.ubicacion}</div>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className="bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-bold text-[10px]">{gym.usuarios_activos}</span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">${parseFloat(gym.total_pagado)}</td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                                        gym.activo && gym.al_dia ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/40' :
                                                        gym.activo && !gym.al_dia ? 'bg-amber-950/60 text-amber-400 border-amber-900/40' : 'bg-red-950/60 text-red-400 border-red-900/40'
                                                    }`}>
                                                        {!gym.activo ? 'BLOQUEADO' : gym.al_dia ? 'ACTIVO' : 'VENCIDO'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right space-x-1.5 flex items-center justify-end">
                                                    <button 
                                                        onClick={()=> setGymSeleccionadoPago(gym)}
                                                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2 py-1 rounded text-[10px] cursor-pointer shadow">
                                                            Cobrar
                                                    </button>
                                                    <button 
                                                        onClick={()=>abrirHistorialPagosGym(gym)}
                                                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2 py-1 rounded text-[10px] border border-slate-700 cursor-pointer">
                                                            Recibos
                                                    </button>
                                                    <button 
                                                        onClick={()=> conmutarEstadoGimnasioApi(gym.id,gym.activo)}
                                                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${gym.activo ? 'bg-red-950/40 text-red-400 hover:bg-red-900/40 border border-red-900/40' : 'bg-slate-100 text-slate-900 hover:bg-white font-bold'}`}>
                                                            {gym.activo ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {gymSeleccionadoPago &&(
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <h3 className="font-bold text-slate-100 text-sm mb-1">Facturación: Recibir Pago de Licencia</h3>  
                        <p className="text-[11px] text-purple-400 font-bold uppercase tracking-wider mb-4">Gimnasio: {gymSeleccionadoPago.nombre}</p>

                        <form 
                            onSubmit={manejarCobroSuscripcionSaaS}
                            className="space-y-4 text-xs">
                                <div>
                                    <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Monto Recibido</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="50000"
                                        value={montoPago}
                                        onChange={(e)=>setMontoPago(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Días cobertura</label>
                                        <select 
                                            value={diasCubierto}
                                            onChange={(e)=> setDiasCubiertos(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-semibold focus:outline-none cursor-pointer">
                                                <option value="30">30 días (1 Mes)</option>
                                                <option value="90">90 días (3 Meses)</option>
                                                <option value="365">365 días (1año)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Método Origen</label>
                                        <select
                                            value={metodoPago}
                                            onChange={(e)=>setMetodoPago(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-semibold focus:outline-none cursor-pointer">
                                                <option value="Transferencia">Transferencia</option>
                                                <option value="Efectivo">Efectivo</option>
                                                <option value="Débito">Débito</option>
                                            </select>
                                    </div>
                                </div> 
                                <div>
                                    <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Nota de Auditoría / Comprobante</label>
                                    <input
                                        type="text"
                                        placeholder="Comprobante Banco Nación Nro #..."
                                        value={notaPago}
                                        onChange={(e)=>setNotaPago(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        />
                                </div>
                                <div className="flex gap-2 pt-2 border-t border-slate-800 mt-4">
                                    <button
                                        type="button"
                                        onClick={()=>setGymSeleccionadoPago(null)}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl font-bold transition-all cursor-pointer">
                                            Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2 rounded-xl font-black transition-all cursor-pointer">
                                            Asentar Cobro
                                    </button>
                                </div>
                        </form>
                    </div>  
                </div>               
                )}
                {gymSeleccionadoHistorial && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-5 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-100 text-sm">Libro Diario de Cobros</h3>
                                    <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Gimnasio: {gymSeleccionadoHistorial.nombre}</p>
                                </div>
                                <button
                                    onClick={()=> setGymSeleccionadoHistorial(null)}
                                    className="text-slate-500 hover:text-slate-300 font-bold text-xs cursor-pointer">
                                        Cerrar
                                </button>
                            </div>

                            <div className="max-h-60 overflow-y-auto w-full text-xs">
                                {cargandoHistorial ? (
                                    <div className="py-6 text-center text-slate-500 animate-pulse">Buscando transacciones...</div>
                                ): histortialPagos.length===0 ? (
                                    <div className="py-8 text-center text-slate-500 italic">Esta sucursal no registra pagos</div>
                                ):(
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-widest border-b border-slate-800">
                                                <th className="py-2 px-3 font-bold">Recibo</th>
                                                <th className="py-2 px-3 font-bold">Fecha Pago</th>
                                                <th className="py-2 px-3 font-bold">Método</th>
                                                <th className="py-2 px-3 font-bold">Cobertura Vence</th>
                                                <th className="py-2 px-3 font-bold">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50 text-slate-300 font-mono text-[11px]">
                                           {histortialPagos.map((p)=>(
                                            <tr key={p.id} className="hover:bg-slate-950/20">
                                                <td className="py-2 px-3 text-purple-400 font-bold">#{p.id}</td>
                                                <td className="py-2 px-3 text-slate-400">{new Date(p.fecha_pago).toLocaleDateString('es-AR')}</td>
                                                <td className="py-2 px-3">
                                                    <span className="bg-slate-950 text-slate-400 px-1 py-0.5 rounded text-[9px] font-bold border border-slate-800">
                                                        {p.metodo_pago}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 font-sans font-bold text-slate-300">{new Date(p.vence).toLocaleDateString('es-AR')}</td>
                                                <td className="py-2 px-3 text-right font-bold text-emerald-400">${parseFloat(p.monto).toLocaleString('es-AR')}</td>
                                            </tr>
                                           ))} 
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
        </div>
    )   
}

export default PanelPlataforma;