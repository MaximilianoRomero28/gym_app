import React, {useState, useEffect} from "react";

function SeccionSoporte() {
    const [asunto, setAsunto] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [historial, setHistorial] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [mensajeExito, setMensajeExito] = useState('');
    const [mensajeError, setMEnsajeError] = useState('');


    const obtenerMisConsultasApi = async() => {
        setCargando(true);
        const url=`http://127.0.0.1:8000/v1/web/soporte/consultas`

        try {
            const respuesta= await fetch(url,{
                method: "GET",
                headers:{
                    'Authorization': `Bearer ${localStorage.getItem('token_web')}`
                }
            });

            if (respuesta.status===200) {
                const datos= await respuesta.json();
                setHistorial(datos);
            }
        } catch (error) {
            console.error("Error de red al traer soporte", error)
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        obtenerMisConsultasApi();
    }, []);

    const manejarEnvioConsulta = async(e) => {
        e.preventDefault();
        setEnviando(true);
        setMensajeExito('');
        setMEnsajeError('');

        const url=`http://127.0.0.1:8000/v1/soporte/consulta`

        try {
            const respuesta= await fetch(url,{
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token_web')}`
                },
                body: JSON.stringify({
                    asunto,
                    mensaje
                })
            })
 
            if (respuesta.status===201) {
                setMensajeExito('Consulta enviada con éxito. El soporte ya fue notificado')
                setAsunto('');
                setMensaje('');
                obtenerMisConsultasApi();
            } else {
                const datos= await respuesta.json();
                setMEnsajeError(datos.detail || 'No se pudo enviar el reporte.')
            }
        } catch (error) {
            setMEnsajeError('Error de conexión con el servidor.');
        } finally {
            setEnviando(false);
        }
    };

    return(
        <div className="fw-full flex flex-col lg:flex-row gap-6 animate-fade-in">
            <div className="flex-1 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <div className="border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider"> Redactar Ticket de Soporte</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Escribe a Soporte ante caídas, dudas o errores.</p>
                </div>

                {mensajeExito && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs font-bold mb-4">{mensajeExito}</div>}
                {mensajeError && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold mb-4"> Error: {mensajeError}</div>}

                <form
                    onSubmit={manejarEnvioConsulta}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Asunto/Título Consulta</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: Falla al registrar Alumno"
                            value={asunto}
                            onChange={(e)=>setAsunto(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium transition-all"/>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Descripción Detalla del Problema</label>
                        <textarea
                            required
                            rows="5"
                            placeholder="Describe detalladamente el problema técnico."
                            value={mensaje}
                            onChange={(e)=> setMensaje(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium transition-all resize-none"
                            />
                    </div>
                    <button 
                        type="submit"
                        disabled={enviando}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:bg-slate-400"
                    >
                        {enviando ? 'Enviando ticket...' : 'Enviar ticket'}
                    </button>
                </form>
            </div>

            <div className="w-full lg:w-96 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col">
                <div className="border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider"> Estado de mis Consultas</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Auditoría en vivo de respuesta técnicas.</p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 max-h-[350px] pr-1">
                    {cargando ? (
                        <div className="text-center py-8 text-xs text-slate-400 font-medium animate-pulse">Abriendo Libro de Quejas...</div>                        
                    ) : historial.length==0 ? (
                        <div className="text-center py-12 text-xs text-slate-400 italic">No registrás consultas previas. Tu sistema de diez.</div>
                    ) : (
                        historial.map((ticket)=>(
                            <div key={ticket.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-[10px] text-purple-500 font-bold">#{ticket.id}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${ticket.esta_resuelto ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'}`}>
                                        {ticket.esta_resuelto ? 'Resuelto' : 'Pendiente'}
                                    </span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-800 truncate">{ticket.asunto}</h4>
                                <p className="text-[11px] text-slate-500 line-clamp-2">{ticket.mensaje}</p>
                                <div className="text-[9px] text-slate-400 font-semibold pt-1 border-t border-slate-200/60">
                                    {new Date(ticket.fecha_envio).toLocaleDateString('es-AR')}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default SeccionSoporte;