import { data } from "autoprefixer";
import React, {useState, useEffect} from "react";

function SeccionPlanes () {
    const [planes, setPlanes] = useState([]);
    const [cargando, setCargando] = useState(false);

    //registrar lista
    const [nombrePlan, setNombrePlan] = useState('');
    const [precioPlan, setPrecioPlan]= useState('');
    const [diasDuracion, setDiasDuracion] = useState('30');
    const [mostrarModal, setMostrarModal] = useState(false);
    const [errorAlta, setErrorAlta] = useState('');
    const [guardando, setGuardando] = useState(false);

    //editar precio
    const [mostrarModalEdicion,setMostrarModalEdicion] = useState(false);
    const [planSeleccionado, setPlanSeleccionado] = useState(null);
    const [nuevoPrecio, setNuevoPrecio] = useState('');
    const [erroEdicion, setErrorEdicion] = useState('');
    const [actualizando, setActualizando] = useState(false);


    const obtenerPlanesdeApi= async () => {
        setCargando(true);

        const url =`http://127.0.0.1:8000/v1/admin/planes/obtener`;

        try {
            const respuesta = await fetch(url,{
                method: "GET",
                headers: {
                    'Content-Tpye': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token_web')}`
                },             
            });

            if (respuesta.status===200) {
                const datos= await respuesta.json();
                setPlanes(datos);
            }
        } catch(error) {
            console.error("Error al traer planes.",error);
        }finally {
            setCargando(false);
        }
    };

    useEffect(() =>{
        obtenerPlanesdeApi();
    }, []);

    const manejarAltaPlan= async (e) =>{
        setGuardando(true);
        e.preventDefault();
        setErrorAlta('');

        const url =`http://127.0.0.1:8000/v1/admin/planes`;

        try {
            const respuesta=await fetch(url,{
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token_web')}`
                },
                body: JSON.stringify({
                    nombre_plan: nombrePlan.trim(),
                    precio: parseFloat(precioPlan),
                    dias_duracion: parseInt(diasDuracion)
                })
            });

            const datos= await respuesta.json();

            if (respuesta.status===201 || respuesta.status===200) {               
                alert("¡Nueva tarifa creada con éxito!");

                setNombrePlan('');
                setPrecioPlan('');
                setDiasDuracion('30');
                setMostrarModal(false);

                obtenerPlanesdeApi();
            } else {
                if (typeof datos.detail === 'object') {
                    setErrorAlta('Erro de validación: Verifique los tipos de datos enviados.');
                    console.log("Detalle 422 de Python", datos.detail)
                } else {
                    setErrorAlta(datos.detail || 'No se pudo crear el plan comercial');
                }
            }
        } catch (err) {
            console.error(err);
            setErrorAlta('Error de red. Asegurate de que el servidor esté en linea.')
        } finally {
            setGuardando(false);
        }
    };

    const manejarModificarPrecio = async (e) => {
        e.preventDefault();
        setErrorEdicion('');
        setActualizando(true);

        const url=`http://127.0.0.1:8000/v1/admin/planes/${planSeleccionado.id}/precio`;

        try {
            const respuesta= await fetch(url,{
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token_web')}`
                },
                body: JSON.stringify({
                    nuevo_precio: parseFloat(nuevoPrecio),
                })
            });

            if (respuesta.status===200) {
                alert("Precio modificado correctamente.");

                setMostrarModalEdicion(false);
                setPlanSeleccionado(null);
                setNuevoPrecio('');

                obtenerPlanesdeApi();
            } else {
                const datos =await respuesta.json();
                setErrorEdicion(datos.detail || 'No se pudo actualizar el precio.');
            }
        } catch (err) {
            setErrorEdicion('Error de conexión con el servidor');
        } finally {
            setActualizando(false);
        }
    };

    const abrirEdicion = (plan) => {
        setPlanSeleccionado(plan);
        setNuevoPrecio(plan.precio || plan.monto || '');
        setErrorEdicion('');
        setMostrarModalEdicion(true);
    };

    const manejarEliminarPlan = async (planId, nombrePlan) => {
        const confirmar =window.confirm(`¿Estas seguro que quieres eliminar este plan comercial?`);
        if (!confirmar) return;

        const url=`http://127.0.0.1:8000/v1/planes/${planId}`;

        try {
            const respuesta= await fetch( url, {
                method:'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token_web')}`
                }
            });

            if (respuesta.status===200) {
                alert("Plan comercial eliminado con éxito.")

                obtenerPlanesdeApi();

                if (typeof consultarPlanes==='function') {
                    consultarPlanes();
                } else if (typeof cargarPlanes==='function'){
                    cargarPlanes();
                }
            } else {
                const datos= await respuesta.json();
                alert(`Error: ${datos.detail || 'No se pudo eliminar el pase comercial'}`)
            }
        } catch (error) {
            console.error(error);
            alert("Erro de red al conectar con el servidor.")
        }
    };

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">Membresías Oficiales</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Listado de aranceles y pases vigentes de la sucursal</p>
                </div>

                <button 
                    onClick={() => setMostrarModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all shadow-md shadow-purple-100 flex items-center gap-2 whitespace-nowrap">
                       <svg xmlns="http://w3.org" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                       </svg> 
                       Crear Nueva Tarifa
                </button>
            </div>

            <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-slate-200 uppercase text-xs tracking-wider">
                                <th className="py-4 px-6 font-semibold w-24">ID</th>
                                <th className="py-4 px-6 font-semibold">Nombre del Pase</th>
                                <th className="py-4 px-6 font-semibold">Duración</th>
                                <th className="py-4 px-6 font-semibold">Precio Mensual</th>
                                <th className="py-4 px-6 font-semibold text-center w-40">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700 text-sm">
                           {cargando ? (
                            <tr>
                                <td colSpan="5" className="py-12 text-center text-slate-400 font-medium animate-pulse">Consultando SQLite...</td>
                            </tr>
                            ) : planes.length === 0 ?(
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">No hay planes comerciales registrados.</td>
                                </tr>
                            ) : (
                                planes.map((plan) => (
                                    <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-6 font-mono text-slate-400">#{plan.id}</td>
                                        <td className="py-4 px-6 font-bold text-slate-900">{plan.nombre_plan || plan.nombre}</td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200">
                                                {plan.dias_duracion || plan.dias || '30'} días
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 font-bold text-green-600 text-base">
                                            ${plan.precio || plan.monto}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={()=>abrirEdicion(plan)}
                                                    className="text-purple-600 hover:text-purple-900 font-bold text-xs bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-all">
                                                        Editar Precio
                                                </button>
                                                <button 
                                                    onClick={()=>manejarEliminarPlan(plan.id,plan.nombrePlan || plan.nombre || 'Plan')}
                                                    className="text-red-600 hover:text-red-900 font-bold text-xs bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                                                >
                                                    Eliminar
                                                </button>                                            
                                            </div>
                                        </td>
                                    </tr>
                                )
                            ))
                            } 
                        </tbody>
                    </table>
                </div>
            </div>

            {mostrarModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-slide-up">
                        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
                            <h3 className="font-bold text-lg">Crear Nueva Membresía</h3>
                            <button onClick={() => setMostrarModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <svg xmlns="http://w3.org" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18"/></svg>
                            </button>
                        </div>

                        <form onSubmit={manejarAltaPlan} className="p-6 space-y-4">
                            {errorAlta && (
                                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-lg text-xs font-medium">
                                    {errorAlta}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nombre del Plan</label>
                                <input type="text" required placeholder="Pase Libre Mensual" value={nombrePlan} onChange={(e) => setNombrePlan(e.target.value)}
                                 className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-all"/>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Precio ($)</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="15000"
                                        value={precioPlan}
                                        onChange={(e)=> setPrecioPlan(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-all"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Duración (Días)</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="30"
                                        value={diasDuracion}
                                        onChange={(e)=> setDiasDuracion(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-all"/>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button 
                                    type="button"
                                    onClick={() => setMostrarModal(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-sm transition-all">
                                        Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md disabled:bg-purple-400">
                                        {guardando ? 'Guardando...' : 'Crear Tarifa'}
                                    </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {mostrarModalEdicion && planSeleccionado && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-slide-up">
                        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                           <h3 className="font-bold text-sm uppercase tracking-wider">Modificar Arancel</h3>
                           <button
                            onClick={() => setMostrarModalEdicion(false)}
                            className="text-slate-400 hover:text-white transition-colors">
                                <svg xmlns="http://w3.org" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18"/>
                                </svg>        
                            </button>
                        </div>

                        <form onSubmit={manejarModificarPrecio} className="p-6 space-y-4">
                            {erroEdicion && (
                                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-lg text-xs font-medium">
                                    {erroEdicion}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Membresía Seleccionada
                                </label>
                                <div className="bg-slate-100 p-3 rounded-xl font-bold text-slate-700 text-sm">
                                    {planSeleccionado.nombre_plan || planSeleccionado.nombre}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                   Nuevo Valor ($) 
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={nuevoPrecio}
                                    onChange={(e) => setNuevoPrecio(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-lg text-green-600 transition-all"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button
                                    type="button"
                                    onClick={()=> setMostrarModalEdicion(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-sm transition-all">
                                        Cancelar
                                    </button>
                                
                                <button
                                    type="submit"
                                    disabled={actualizando}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md disabled:bg-purple-400">
                                        {actualizando ? 'Actualizando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SeccionPlanes;