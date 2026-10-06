import React, {useState, useEffect} from "react";


function SeccionFinanzas() {
    const [datosCaja, setDatosCaja] = useState(null);
    const [cargando, setCargando] = useState(false);

    const obtenerFechaHoyStr = () =>{ 
        return new Date().toISOString().split('T')[0];
    }
    const obtenerPrimerDiaMesStr = () => {
        const d= new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
    };

    const [fechaDesde, setFechaDesde] = useState(obtenerPrimerDiaMesStr());
    const [fechaHasta,setFechaHasta] = useState(obtenerFechaHoyStr());

    const [movimientos, setMovimientos] = useState([]);
    const [totales, setTotales] = useState({ total_general: 0, efectivo: 0, transferencia: 0, tarjetas: 0 });
    const [auditoria, setAuditoria] = useState({ total_alumnos: 0, alumnos_al_dia: 0, alumnos_morosos: 0 });

    const aplicarFiltroRapido= (tipo) => {
        const hoy = new Date();
        const hoyStr= hoy.toISOString().split('T')[0];

        if (tipo==='hoy') {
            setFechaDesde(hoyStr);
            setFechaHasta(hoyStr);
        } else if (tipo ==='semana') {
            const hace7Dias= new Date(hoy.getTime()-7*24*60*60*1000);
            setFechaDesde(hace7Dias.toISOString().split('T')[0]);
            setFechaHasta(hoyStr);
        } else if (tipo ==='mes') {
            setFechaOriginales();
        }
    };

    const setFechaOriginales =()=> {
        setFechaDesde(obtenerPrimerDiaMesStr());
        setFechaHasta(obtenerFechaHoyStr());
    };   

    const consultarResumenFinancieroApi = async () => {
        setCargando(true);

        const url=`http://127.0.0.1:8000/v1/admin/finanzas/resumen?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`;

        try {
            const respuesta= await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token_web')}`
                }
            });

            if (respuesta.status===200) {
                const datos= await respuesta.json();
                setDatosCaja(datos);

                setMovimientos(datos.ultimos_movimientos || []);

                setTotales(datos.totales ||{
                    total_general: 0,
                    efectivo: 0,
                    transferencia: 0,
                    tarjetas: 0
                });

                setAuditoria(datos.auditoria || {
                    total_alumnos: 0,
                    alumnos_al_dia: 0,
                    alumnos_morosos: 0
                });
            }
        } catch (error) {
            console.error("Error al consultar el motor de finanzas:", error)
        } finally {
            setCargando(false);
        };
    };

    useEffect(()=> {
        consultarResumenFinancieroApi();
    },[]);

    if (cargando) {
        return <div className="py-12 text-center text-slate-400 font-medium animate-pulse text-sm">Procesando balances contables</div>
    }


    return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">

      
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <svg xmlns="http://w3.org" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Período de Rendición de Caja</h4>
        </div>
        
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Desde:</span>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold" />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Hasta:</span>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold" />
          </div>
          
          
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-wider">
            <button type="button" onClick={() => aplicarFiltroRapido('hoy')} className="px-2.5 py-1 hover:bg-white rounded-lg transition-all cursor-pointer text-slate-600 hover:text-purple-600">Hoy</button>
            <button type="button" onClick={() => aplicarFiltroRapido('semana')} className="px-2.5 py-1 hover:bg-white rounded-lg transition-all cursor-pointer text-slate-600 hover:text-purple-600">7 Días</button>
            <button type="button" onClick={() => aplicarFiltroRapido('mes')} className="px-2.5 py-1 hover:bg-white rounded-lg transition-all cursor-pointer text-slate-600 hover:text-purple-600">Mes</button>
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
            Caja General Acumulada</p>
          <h3 className="text-2xl font-black mt-2">
            ${parseFloat(totales.total_general).toLocaleString('es-AR',{minimumFractionDigits: 2})} 
          </h3>
          <p className="text-xs text-slate-400 mt-1">Libro diario</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Efectivo Físico en Caja</p>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            ${parseFloat(totales.efectivo).toLocaleString('es-AR', {minimumFractionDigits:2})} 
          </h3>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Contar Caja</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Banco/Transferencia</p>
          <h3 className="text-2xl font-black text-blue-600 mt-2">
            ${parseFloat(totales.transferencia).toLocaleString('es-AR', {minimumFractionDigits:2})} {/* ⚡ Vinculado */}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Ingresos virtuales directos</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Posnet/Tarjetas</p>
          <h3 className="text-2xl font-black text-purple-600 mt-2">
            ${parseFloat(totales.tarjetas).toLocaleString('es-AR', {minimumFractionDigits:2})} {/* ⚡ Vinculado */}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Débito y Crédito diferido</p>
        </div>
      </div>

     
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-around gap-4 text-center">
         
      </div>

      
      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Libro Diario: Transacciones del Período</h4>
          <button onClick={consultarResumenFinancieroApi} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 px-3 rounded-lg transition-all border border-slate-700">Actualizar Caja</button>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-6 font-semibold w-24">Recibo</th>
                <th className="py-3 px-6 font-semibold">Fecha/Hora</th>
                <th className="py-3 px-6 font-semibold">Miembro</th>
                <th className="py-3 px-6 font-semibold w-36">Método Usado</th>
                <th className="py-3 px-6 font-semibold text-right w-40">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {movimientos.length === 0 ? ( 
                <tr><td colSpan="5" className="py-8 text-center text-slate-400 font-medium italic">No se registran cobranzas en este rango de fechas</td></tr>
              ) : (
                movimientos.map((mov)=> ( 
                  <tr key={mov.id_recibo} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-slate-400">#{mov.id_recibo}</td>
                    <td className="py-3.5 px-6 text-xs text-slate-500">{mov.fecha}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{mov.alumno}</td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${mov.metodo === 'Efectivo' ? 'bg-slate-50 text-slate-700 border-slate-200' : mov.metodo === 'Transferencia' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>{mov.metodo}</span>
                    </td>
                    <td className="py-3.5 px-6 font-black text-green-600 text-right">
                      ${parseFloat(mov.monto).toLocaleString('es-AR', {minimumFractionDigits:2})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
    
}

export default SeccionFinanzas;