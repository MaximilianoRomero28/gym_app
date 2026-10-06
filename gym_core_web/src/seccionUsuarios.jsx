import React, { useState, useEffect } from 'react';

const textoDeError =(detail) => {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(e => `${(e.loc || []).slice(1).join('.')}: ${e.msg}`).join(' | ');
  }
  return 'Error inesperado';
}

function SeccionAlumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);

  //Registro ALUMNO (MODAL 1)
  const [mostrarModalAlta, setMostrarModalAlta] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [errorAlta, setErrorAlta] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState('Alumno');


  //PANEL INTERACTIVO DE RUTINAS (MODAL 2)
  const [mostrarModalFicha, setMostrarModalFicha] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [rutinasCompletas, setRutinasCompletas] = useState([]); 
  const [cargandoRutinas, setCargandoRutinas] = useState(false);

  // Control de la rutina activa en pantalla
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null); 
  const [nombreNuevaRutina, setNombreNuevaRutina] = useState('');
  const [creandoRutina, setCreandoRutina] = useState(false);
  const [errorRutinas, setErrorRutinas] = useState('');

  // Campos para la inyección de nuevos ejercicios
  const [nombreEjercicio, setNombreEjercicio] = useState('');
  const [seriesEjercicio, setSeriesEjercicio] = useState('4');
  const [repeticionesEjercicio, setRepeticionesEjercicio] = useState('12');
  const [guardandoEjercicio, setGuardandoEjercicio] = useState(false);

  //Estado monetarios
  const [mostrarModalPagos, setMostrarModalPagos] = useState(false);
  const [historialPagosAlumno, setHistorialPagosAlumno] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  //Catálogo de planes
  const [planesGimnasio, setPlanesGimnasio] = useState([]);
  const [planSeleccionadoId, setPlanSeleccionadoId] = useState('');
  const [procesandoPago, setProcesandoPago] = useState(false);

  //metodo pago
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado]= useState('Efectivo')

  const [filtroCuota, setFiltroCuota] = useState('todos');

  const gimnasioId = localStorage.getItem('gimnasio_id');
  const profesorId = localStorage.getItem('usuario_id');

  //BUSCADOR PREDICTIVO PRINCIPAL
  const obtenerAlumnosDeApi = async (termino = '') => {
    setCargando(true);
    const url = `http://127.0.0.1:8000/v1/usuarios/buscar?termino=${encodeURIComponent(termino)}`;
    try {
      const respuesta = await fetch(url, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${localStorage.getItem('token_web')}` }
      });
      if (respuesta.status === 200) {
        const datos = await respuesta.json();
        setAlumnos(datos);
      }
    } catch (error) {
      console.error("Error en buscador predictivo:", error);
    } finally { setCargando(false); }
  };

  useEffect(() => { obtenerAlumnosDeApi(); }, []);

  const alCambiarBusqueda = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    obtenerAlumnosDeApi(valor);
  };

 //crear usuario
  const manejarAltaAlumno = async (e) => {
    e.preventDefault();
    setErrorAlta('');
    setGuardando(true);
    const url = `http://127.0.0.1:8000/v1/usuarios/alumnos`;
    try {
      const respuesta = await fetch(url, { 
        method: 'POST', 
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token_web')}`,
          'Content-Type': 'application/json'
        }, 
        body: JSON.stringify({
          nombre: nuevoNombre.trim(),
          email: nuevoEmail.trim(),
          contrasena: nuevaPassword,
          rol: rolSeleccionado
        })
      });
      if (respuesta.status === 201 || respuesta.status === 200) {
        alert("Alumno registrado con éxito.");
        setNuevoNombre(''); 
        setNuevoEmail(''); 
        setNuevaPassword(''); 
        setMostrarModalAlta(false);

        obtenerAlumnosDeApi(busqueda);
      } else {
        const datos = await respuesta.json();
        setErrorAlta(datos.detail || 'Error al guardar el usuario.');
      }
    } catch (err) { setErrorAlta('Error de red.'); } finally { setGuardando(false); }
  };

  //Dar de baja
  const alternarEstadoUsuarioApi = async (id,nombre,estadoActual) => {
    const accionTexto = estadoActual ? 'DESACTIVAR' : 'HABILITAR';
    const advertenciaTexto = estadoActual
      ? `¿Está seguro/a que desea DESACTIVAR la cuenta de ${nombre}?`
      : `¿Querés volver a HABILITAR la cuenta de ${nombre}?. Recuperará el acceso.`
   

    if (!window.confirm(`${advertenciaTexto}`))
      return;


    const rutaAccion= estadoActual ? 'desactivar' : 'activar'

    const url = `http://127.0.0.1:8000/v1/admin/usuarios/${id}/${rutaAccion}`;

    try {
      const respuesta = await fetch(url,{
        method:"PATCH",
        headers:{
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token_web')}`
        }
      });

      if (respuesta.status===200) {
        const datos = await respuesta.json();
        const estadoFinalTexto = datos.activo ? 'habilitado' : 'suspendida';
        alert(`Cuenta de ${nombre} ${estadoFinalTexto} con éxito.`)

        obtenerAlumnosDeApi(busqueda);
      } else {
        alert("El servidor rechazó la solicitud.")
      }
    } catch (error){
      console.error("Error al desactivar: ", error);
    }
  };

  //obtener rutina
  const consultarRutinasCompletasApi = async (alumnoId, idRutinaAActivar = null) => {
    setCargandoRutinas(true);
    
    const url = `http://127.0.0.1:8000/v1/admin/usuarios/${alumnoId}/rutinas-completas`;
    try {
      const respuesta = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token_web')}` }
      });
      if (respuesta.status === 200) {
        const datos = await respuesta.json();
        setRutinasCompletas(datos); 

        if (idRutinaAActivar) {
          const encontrada = datos.find(r => r.id === idRutinaAActivar);
          if (encontrada) setRutinaSeleccionada(encontrada);
        } else if (datos.length > 0 && !rutinaSeleccionada) {          
          setRutinaSeleccionada(datos[0]);
        } else if (rutinaSeleccionada) {

          const actualizada = datos.find(r => r.id === rutinaSeleccionada.id);
          setRutinaSeleccionada(actualizada || null);
        }
      }
    } catch (error) {
      console.error("Error al consultar el nuevo endpoint espejo:", error);
    } finally { setCargandoRutinas(false); }
  };

  //crear rutina
  const manejarCrearRutina = async (e) => {
    e.preventDefault();
    if (!nombreNuevaRutina.trim()) return;
    setErrorRutinas('');
    setCreandoRutina(true);

    const url = `http://127.0.0.1:8000/v1/rutina`;
    try {
      const respuesta = await fetch(url, { 
        method: 'POST', 
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token_web')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre_rutina: nombreNuevaRutina.trim(),
          profesor_id:parseInt(profesorId),
          alumno_id: parseInt(alumnoSeleccionado.id)
        })
      });
      if (respuesta.status === 201 || respuesta.status === 200) {
        const datos = await respuesta.json();
        const nuevoId = datos.id_asignado || datos.id_assigned;
        setNombreNuevaRutina('');
        alert("🏋️‍♀️ ¡Rutina base creada con éxito!");
        
        
        await consultarRutinasCompletasApi(alumnoSeleccionado.id, nuevoId);
        obtenerAlumnosDeApi(busqueda); 
      } else {
        const datosError = await respuesta.json();
        setErrorRutinas(datosError.detail || 'Rechazado por el servidor.');
      }
    } catch (err) { setErrorRutinas('Error de red al crear rutina.'); } finally { setCreandoRutina(false); }
  };

  //Crear ejercicio dentro de rutina
  const manejarCargarEjercicio = async (e) => {
    e.preventDefault();
    if (!nombreEjercicio.trim() || !rutinaSeleccionada) return;
    setGuardandoEjercicio(true);
    setErrorRutinas('');

    const url = `http://127.0.0.1:8000/v1/ejerciciosrutina/${rutinaSeleccionada.id}`;
    try {
      const respuesta = await fetch(url, { method: 'POST', 
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token_web')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ejercicio:nombreEjercicio.trim(),
          numeros_series: parseInt(seriesEjercicio),
          rep: parseInt(repeticionesEjercicio),
        })
      });
      if (respuesta.status === 201 || respuesta.status === 200) {
        setNombreEjercicio('');
        alert("Ejercicio inyectado con éxito.");
        consultarRutinasCompletasApi(alumnoSeleccionado.id);
      } else {
        const datos = await respuesta.json();
        setErrorRutinas(datos.detail || 'No se pudo vincular el ejercicio.');
      }
    } catch (err) { setErrorRutinas('Error de comunicación.'); } finally { setGuardandoEjercicio(false); }
  };

  const abrirFichaMecanica = (alumno) => {
    setAlumnoSeleccionado(alumno);
    setRutinaSeleccionada(null);
    setRutinasCompletas([]);
    setErrorRutinas('');
    
    consultarRutinasCompletasApi(alumno.id);
    setMostrarModalFicha(true);
  };

  const abrirHistorialPagosMecanica = async (alumno) => {
    setAlumnoSeleccionado(alumno);
    setPlanSeleccionadoId('');
    setHistorialPagosAlumno([]);
    setMostrarModalPagos(true);
    setCargandoHistorial(true);

    const url = `http://127.0.0.1:8000/v1/admin/planes/obtener`
    try {
      const respPlanes = await fetch(url,{
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token_web')}`
        }
      });

      if (respPlanes.status===200) {
        const datosPlanes= await respPlanes.json();
        setPlanesGimnasio(datosPlanes);
        
        if (datosPlanes.length>0) setPlanSeleccionadoId(datosPlanes[0].id);
      }
    }catch (err){
      console.error("Error al traer planes: ", err);
    }

    const urlHistorial=`http://127.0.0.1:8000/v1/admin/pagos/alumno/${alumno.id}`

    try {
      const respHistorial= await fetch(urlHistorial, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token_web')}`
        }
      })
      if (respHistorial.status===200) {
        const datosHistorial= await respHistorial.json();
        setHistorialPagosAlumno(datosHistorial);
      }
    } catch (err) {
      console.error("Error al consultar el historial:", err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const manejarRegistroCobroApi= async (e) =>{
    e.preventDefault();
    if (!planSeleccionadoId || !alumnoSeleccionado) return;
    setProcesandoPago(true);

    const url=`http://127.0.0.1:8000/v1/pagos`;

    try {
      const respuesta= await fetch(url, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token_web')}`
        },
        body: JSON.stringify({
          alumno_id: parseInt(alumnoSeleccionado.id),
          plan_id:parseInt(planSeleccionadoId),
          metodo_pago: metodoPagoSeleccionado
        })
      })

      if (respuesta.status===201) {
        alert("¡Pago procesado con éxito! Cuota renovada.");
        setMostrarModalPagos(false);
        obtenerAlumnosDeApi(busqueda);
      } else {
        alert("_No se pudo procesar el pago.");
      }
    } catch (error) {
      console.error("Error crítico en la terminal de cobros:", error)
      alert("Error de red al intentar registrar el cobro.")
    } finally{
      setProcesandoPago(false);
    }
  };

  //Borrar usuario
  const eliminarUsuarioApi= async (id,nombre) =>{
    if (!window.confirm(`¿Estás seguro/a que quieres ELIMINAR permanentemente a ${nombre}? Se borrarán todos sus registros`)) return;

    const url=`http://127.0.0.1:8000/v1/usuarios/${id}`

    try {
      const respuesta= await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token_web')}`
        }
      });

      if (respuesta.status===200) {
        alert("Usuario borrado con éxito.")
        obtenerAlumnosDeApi(busqueda);
      } else {
        alert("El servidor rechazó la eliminación.")
      }
    } catch (error) {
      console.error("Error al borrar usuario:", error);
    }
  }

  //Borrar rutina
  const eliminarRutinaApi = async(rutinaId, nombreRutina) => {
    if (!window.confirm(`¿Querés borrar la rutina ${nombreRutina} entera juntos con sus ejercicios?`)) return;

    const url=`http://127.0.0.1:8000/v1/rutina/${rutinaId}`

    try {
      const respuesta= await fetch(url,{
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token_web')}`
        }
      });

      if (respuesta.status===200){
        alert("Plan de entrenamiento eliminado.")
        setRutinaSeleccionada(null);
        consultarRutinasCompletasApi(alumnoSeleccionado.id);
        obtenerAlumnosDeApi(busqueda);
      }
    } catch (error) {
      console.error("Error al borrar rutina:", error);
    }
  };

  //Borrar ejercicio
  const eliminarEjercicioApi = async(ejercicioId) =>{
    const url=`http://127.0.0.1:8000/v1/ejerciciosrutina/${ejercicioId}`

    try{
      const respuesta= await fetch(url,{
        method: 'DELETE',
        headers:{
          'Authorization': `Bearer ${localStorage.getItem('token_web')}`
        }
      });

      if (respuesta.status===200) {
        consultarRutinasCompletasApi(alumnoSeleccionado.id);
      }
    } catch (error) {
      console.error("Error al quitar ejercicio:", error);
    }
  }

  const alumnosFiltrados= alumnos.filter((alumno)=>{
    const coincideTexto=alumno.nombre_usuario?.toLowerCase().includes(busqueda.toLowerCase());

    let coincideEstado=true;
    if (filtroCuota==='al_dia'){
      coincideEstado=alumno.rol_id!==3 && alumno.cuota_vencida===false;
    } else if (filtroCuota==='vencidos'){
      coincideEstado=alumno.cuota_vencida===true;
    }

    return coincideTexto && coincideEstado;
  });

  return (
    <div className="w-full flex flex-col gap-6">
      
      <div className='w-full flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6'>
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto flex-1 max-w-2xl">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg xmlns="http://w3.org" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input type="text" placeholder="Buscar usuario por nombre..." value={busqueda} onChange={alCambiarBusqueda} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-all" />
          </div>

          <select 
            value={filtroCuota}
            onChange={(e)=>setFiltroCuota(e.target.value)}
            className='px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer shadow-sm min-w-[150px] h-[40px]'
            >
              <option value="todos">Todos los Miembros</option>
              <option value="al_dia">Cuentas al Día</option>
              <option value="vencidos">Cuotas Vencidas</option>
          </select>
        </div>
        <button 
          onClick={() => setMostrarModalAlta(true)} 
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all shadow-md flex items-center gap-2 whitespace-nowrap cursor-pointer ml-auto w-full md:w-auto justify-center md:justify-star">
          <svg xmlns="http://w3.org" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Registrar Nuevo Miembro
        </button>       
      </div>

      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-200 uppercase text-xs tracking-wider border-b border-slate-800">
                <th className="py-4 px-6 font-semibold w-24">ID</th>
                <th className="py-4 px-6 font-semibold">Nombre Completo</th>
                <th className="py-4 px-6 font-semibold w-32">Rol</th>
                <th className="py-4 px-6 font-semibold w-36">Estado Cuota</th>
                <th className="py-4 px-6 font-semibold">Rutinas Vinculadas</th>
                <th className="py-4 px-6 font-semibold text-center w-56">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 text-sm">
              {cargando ? (
                <tr><td colSpan="6" className="py-12 text-center text-slate-400 font-medium animate-pulse">Consultando SQLite...</td></tr>
              ) : alumnosFiltrados.length === 0 ? (
                <tr><td colSpan="6" className="py-12 text-center text-slate-400 font-medium">No se encontraron coincidencias.</td></tr>
              ) : (
                alumnosFiltrados.map((alumno) => {
                  const esProfesor= alumno.rol_id===3;
                  const cuotaVencida=alumno.cuota_vencida===true;
                  const estaActivo= alumno.esta_activo !== undefined ? alumno.esta_activo :true;
                  
                  return (
                    <tr key={alumno.id} className='hover:bg-slate-50 transition-colors'>
                      <td className='py-4 px-6 font-mono text-slate-400'>#{alumno.id}</td>
                      <td className='py-4 px-6 font-semibold tracking-wide text-slate-800'>{alumno.nombre_usuario}</td>

                      <td className='py-4 px-6'>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          alumno.rol_id === 3 ? 'bg-orange-50 text-orange-700 border border-orange-100' : 
                          alumno.rol_id === 5 ? 'bg-blue-50 text-blue-700 border border-blue-100' : // ⚡ CHIP AZUL RECEPT
                          'bg-purple-50 text-purple-700 border border-purple-100' // Alumno por descarte
                        }`}>
                          {esProfesor ? 'Profesor' : alumno.rol_id===2 ? 'Recepción' : 'Alumno'}
                        </span>
                      </td>

                      <td className='py-4 px-6'>
                        {esProfesor ? (
                          <span className='text-xs text-slate-400 font-medium'>Exento (Staff)</span>

                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${cuotaVencida ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            {cuotaVencida ? 'Cuota Vencida' : 'Cuota al Día'}
                          </span>
                        )
                      }
                      </td>

                      <td className='py-4 px-6'>
                        {esProfesor ? (
                          <span className='text-xs text-slate-400 italic'>Personal de Planta</span>
                        ): alumno.rutinas_activas && alumno.rutinas_activas.length >0 ? (
                          <div className='flex flex-wrap gap-1.5'>
                            {alumno.rutinas_activas.map((rutina)=>(
                              <span key={rutina.id} className='inline-flex items-center px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200'>
                                {rutina.nombre}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className='text-xs text-slate-400 italic'>Sin rutinas asignadas</span>
                        )}
                      </td>

                      <td className='py-4 px-6 text-center space-x-2 flex items-center justify-center gap-1.5'>
                        <button 
                          disabled={esProfesor}
                          onClick={() => abrirFichaMecanica(alumno)}
                          className='text-purple-600 hover:text-purple-900 font-bold text-xs bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-all border border-purple-200 disabled:opacity-30 disabled:cursor-not-allowed'>
                            Ver Ficha
                          </button>

                          <button 
                            onClick={() => alternarEstadoUsuarioApi(alumno.id, alumno.nombre_usuario, estaActivo)}
                            className={`font-bold text-xs px-3 py-1.5 rounded-lg transition-all border shadow-sm ${estaActivo ? 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-600 hover:text-white hover:border-transparent' : 'text-green-600 bg-green-50 border-green-200 hover:bg-green-600 hover:text-white hover:border-transparent'}`}
                          >
                            {estaActivo ? 'Suspender' : 'Habilitar'}
                          </button>
                          <button 
                           onClick={() => abrirHistorialPagosMecanica(alumno)}
                           className='text-slate-600 hover:text-emerald-700 font-bold text-xs bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all border border-slate-200 shadow-sm'>
                            Caja/Pagos
                          </button>
                          <button
                            onClick={() => eliminarUsuarioApi(alumno.id,alumno.nombre_usuario)}
                            className='text-red-600 hover:text-white font-bold text-xs bg-red-50 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-all border border-red-200 shadow-sm'>
                              Eliminar
                          </button>
                      </td>
                    </tr>
                  );
                })               
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cargar usuario */}
      {mostrarModalAlta && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Registrar Usuario</h3>

            {errorAlta && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-lg text-xs font-medium mb-3">
                {typeof errorAlta === 'string' ? errorAlta : textoDeError(errorAlta)}
              </div>
            )}

            <form onSubmit={manejarAltaAlumno} className="space-y-4">
              <div>
                <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>Tipo de cuenta</label>
                <select
                  value={rolSeleccionado}
                  onChange={(e) => setRolSeleccionado(e.target.value)}
                  className='w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all'
                >
                  <option value="Alumno">Alumno/Cliente</option>
                  <option value="Profesor">Profesor/Staff</option>
                  <option value="Recepcionista">Recepcionista/Ventas</option>
                </select>
              </div>

              <input type="text" required placeholder="Nombre Completo" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
              <input type="email" required placeholder="Email" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
              <input type="password" required placeholder="Contraseña" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
              
              <div className="flex gap-2 pt-2 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setMostrarModalAlta(false)} className="flex-1 bg-slate-100 py-2 rounded-xl text-xs font-bold">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md">
                  {guardando ? 'Creando...' : 'Confirmar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ficha tecnica */}
      {mostrarModalFicha && alumnoSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
            
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Ficha de Entrenamiento</h3>
                <p className="text-xs text-purple-400 font-medium">Alumno: 
                  <span className="text-white font-bold">
                    {alumnoSeleccionado.nombre_usuario}
                  </span>
                </p>
              </div>
              <button onClick={() => setMostrarModalFicha(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg xmlns="http://w3.org" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" /></svg>
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
              
              <div className="w-full md:w-1/2 p-6 border-r border-slate-200 overflow-y-auto space-y-6">
                
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Inicializar Nueva Rutina</h4>
                  <form onSubmit={manejarCrearRutina} className="flex gap-2">
                    <input 
                      type="text" 
                      required placeholder="Ej: Rutina Piernas - Jueves" 
                      value={nombreNuevaRutina} 
                      onChange={(e) => setNombreNuevaRutina(e.target.value)} 
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <button 
                      type="submit" 
                      disabled={creandoRutina} 
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all">
                        {creandoRutina ? 'Creando...' : 'Crear'}
                    </button>
                  </form>
                  {errorRutinas && <p className="text-xs text-red-600 font-semibold mt-2">⚠️ {errorRutinas}</p>}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historial de Rutinas</h4>
                  {cargandoRutinas ? (
                    <div className="text-center p-4 text-xs text-slate-400 animate-pulse">Sincronizando rutinas...</div>
                  ) : rutinasCompletas.length > 0 ? (
                    rutinasCompletas.map((rutina) => (
                     <div
                        key={rutina.id}
                        className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${rutinaSeleccionada?.id === rutina.id ? 'bg-purple-600 text-white border-transparent shadow-md' : 'bg-white text-slate-800 border-slate-200'}`}>
                          <button
                            type='button'
                            onClick={()=> setRutinaSeleccionada(rutina)}
                            className='flex-1 text-left font-bold text-sm'>
                              {rutina.nombre_rutina}
                          </button>

                          <button
                          onClick={() => eliminarRutinaApi(rutina.id, rutina.nombre_rutina)}
                          className={`p-1.5 rounded-lg border transition-all ${rutinaSeleccionada?.id === rutina.id ? 'bg-purple-700 border-purple-500 text-purple-200 hover:bg-red-600 hover:text-white hover:border-transparent' : 'bg-slate-50 border-slate-200 text-red-500 hover:bg-red-50 cursor-pointer'}`}
                          title='Quitar Rutina'
                          >
                            <svg xmlns='http://w3.org' className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                      </div>
                    ))
                  ) : <p className="text-xs text-slate-400 italic">No registra planes guardados.</p>}
                </div>
              </div>

              {/* Carga e Inventario de Ejercicios */}
              <div className="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col bg-white">
                {rutinaSeleccionada ? (
                  <div className="flex flex-col h-full space-y-6">
                    
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-xl shadow-sm">
                      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">
                        Agregar Ejercicio a : <span className="text-white font-black text-sm block mt-1">"{rutinaSeleccionada.nombre_rutina}"</span>
                      </h4>

                      <form onSubmit={manejarCargarEjercicio} className="space-y-3">
                        <div>
                           <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Nombre del Ejercicio</label>
                          <input
                            type="text"
                            required
                            placeholder="Nombre del Ejercicio(Ej: Press de Banca)"
                            value={nombreEjercicio}
                            onChange={(e) => setNombreEjercicio(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Series</label>
                            <input
                              type="number"
                              required
                              value={seriesEjercicio}
                              onChange={(e)=> setSeriesEjercicio(e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs focus:outline-none text-white font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Repeticiones</label>
                            <input
                              type="number"
                              required
                              placeholder="12"
                              value={repeticionesEjercicio}
                              onChange={(e)=> setRepeticionesEjercicio(e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs focus:outline-none text-white font-bold font-mono"
                            />
                          </div>

                        </div>

                        <button 
                          type="submit" 
                          disabled={guardandoEjercicio} 
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md mt-2 disabled:bg-purple-400 disabled:cursor-not-allowed"
                        >
                          {guardandoEjercicio ? 'Vincular...' : 'Guardar e Inyectar Ejercicio'}
                        </button>
                      </form>
                    </div>

                    {/* Lista Visual de Ejercicios */}
                    <div className="flex-1 flex flex-col min-h-[200px]">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ejercicios Configurados</h4>
                      <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                        {rutinaSeleccionada.ejercicios && rutinaSeleccionada.ejercicios.length > 0 ? (
                          <div className="divide-y divide-slate-200 overflow-y-auto max-h-[250px]">
                            {rutinaSeleccionada.ejercicios.map((ej) => (
                              <div key={ej.id} className="p-3 bg-white flex items-center justify-between text-xs hover:bg-purple-50/50 transition-all">
                                <span className="font-bold text-slate-800">➔ {ej.nombre_ejercicio || ej.ejercicios}</span>
                                <div className='flex items-center gap-3'>
                                  <span className="px-2 py-0.5 bg-slate-100 border rounded-lg font-mono text-slate-600 font-semibold">{ej.series}x{ej.repeticiones}</span>
                                  <button
                                    onClick={()=> eliminarEjercicioApi(ej.id)}
                                    className='text-slate-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50 cursor-pointer'
                                    title='Quitar Ejercicio'>
                                      <svg xmlns='http://w3.org' className="h-4 w-4 stroke-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-xs text-slate-400 italic">La rutina está vacía. Cargá el primer ejercicio arriba.</div>
                        )}
                      </div>
                    </div>
                      
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center p-6 text-slate-400 italic text-xs">
                    Seleccioná una rutina de la izquierda o creá una nueva para auditar y cargar ejercicios.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
      {mostrarModalPagos && alumnoSeleccionado && (
        <div className='fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden'>
            <div className='bg-emerald-600 text-white p-5 flex items-center justify-between'>
              <div>
                <h3 className='font-bold text-lg'>Terminal de Cobranza</h3>
                <p className='text-xs text-emerald-100 mt-0.5'>Cliente:</p>
              </div>
              <button 
                onClick={()=> setMostrarModalPagos(false)}
                className='text-emerald-100 hover:text-white transition-colors'>
                  <svg xmlns='http://w3.org' className='h-6 w-6' fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18"/></svg>
              </button>
            </div>
            <div className='p-6 space-y-6 bg-slate-50'>
              <form
                onSubmit={manejarRegistroCobroApi}
                className='bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4'>
                  <h4 className='text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2 border-slate-100'>Registrar Cobro de Cuota</h4>
                  <div>
                    <label className='block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5'>Seleccionar Plan de Pago Comercial</label>
                    <select 
                      value={planSeleccionadoId}
                      onChange={(e)=> setPlanSeleccionadoId(e.target.value)}
                      className='w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer'>
                        {planesGimnasio.length===0 ? (
                          <option value="">No se encontraron pases comerciales</option>
                        ) : (
                          planesGimnasio.map((p)=> (
                            <option key={p.id} value={p.id}>
                              {p.nombre_plan || p.nombre} - ${parseFloat(p.precio).toLocaleString('es-AR')} ({p.dias_duracion} días)
                            </option>
                          ))
                        )
                      }
                    </select>
                  </div>

                  <div className='mt-4'>
                    <label className='block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5'>Forma de Pago</label>
                    <select
                      value={metodoPagoSeleccionado}
                      onChange={(e)=> setMetodoPagoSeleccionado(e.target.value)}
                      className='w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer'
                      >
                        <option value="Efectivo">Efectivo (Caja física)</option>
                        <option value="Transferencia">Transferencia Bancaria</option>
                        <option value="Débito">Tarjeta de Débito</option>
                        <option value="Crédito">Tarejta de Crédito</option>
                    </select>
                  </div>

                  <button
                    type='submit'
                    disabled={procesandoPago || planesGimnasio.length===0}
                    className='w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2'>
                      {procesandoPago ? 'Asetando en Libro Diario...' : 'Confirmar recaudación e Inyectar Pago'}
                  </button>
              </form>

              <div className='space-y-2'>
                <h4 className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Historial Cronológico de Recibos</h4>
                <div className='bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-[180px] overflow-y-auto'>
                  {cargandoHistorial ? (
                    <div className='p-6 text-center text-xs text-slate-400 animate-pulse'>Consultando transacciones en SQLite...</div>
                  ) : historialPagosAlumno.length===0 ? (
                    <div className='p-8 text-center text-xs text-slate-400 italic'>El alumno no registra cobros históricos en el sistema</div>
                  ):(
                    <table className='w-full text-left border-collapse text-xs'>
                      <thead>
                        <tr className='bg-slate-900 text-slate-200 uppercase tracking-wider text-[10px] border-b border-slate-800'>
                          <th className='py-2.5 px-4 font-semibold'>Recibo</th>
                          <th className='py-2.5 px-4 font-semibold'>Fecha Pago</th>
                          <th className='py-2.5 px-4 fpmt-semibold'>Método</th>
                          <th className='py-2.5 px-4 font-semibold'>Vencimiento</th>
                          <th className='py-2.5 px-4 font-semibold text-right'>Monto</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-slate-100 text-slate-600'>
                        {historialPagosAlumno.map((pago) => (
                          <tr key={pago.id_recibo} className='hover:bg-slate-50 transition-colors'>
                            <td className='py-2.5 px-4 font-mono text-slate-400'>#{pago.id_recibo}</td>
                            <td className='py-2.5 px-4'>{pago.fecha_pago}</td>
                            <td className='py-2.5 px-4'>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                pago.metodo_pago === 'Efectivo' ? 'bg-slate-100 text-slate-700' :
                                pago.metodo_pago === 'Transferencia' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                                  {pago.metodo_pago || 'No especif.'}
                              </span>
                            </td>
                            <td className='py-2.5 px-4 font-semibold text-slate-700'>{pago.fecha_vencimiento}</td>
                            <td className='py-2.5 px-4 font-black text-green-600 text-right'>
                              ${parseFloat(pago.monto).toLocaleString('es-AR', {minimumFractionDigits: 2})}
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
        </div>
      )}
    </div>
  );
}

export default SeccionAlumnos;