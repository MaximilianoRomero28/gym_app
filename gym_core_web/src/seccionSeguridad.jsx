import React, {useState} from "react";

function SeccionSeguridad() {
    const [passwordActual, setPasswordActual] = useState('');
    const [passwordNueva, setPasswordNueva] = useState('');
    const [errorPassword, setErrorPassword] = useState('');
    const [exitoPassword, setExitoPassword] = useState('');
    const [actualizandoPassword, setActualizandoPassword] = useState(false);

    const manejarCambioPasswordApi = async (e) =>{
        e.preventDefault();
        setErrorPassword('');
        setExitoPassword('');
        setActualizandoPassword(true);

        const url= `http://127.0.0.1:8000/v1/usuarios/cambiar-password`;

        try {
            const respuesta= await fetch(url,{
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token_web')}`
                },
                body: JSON.stringify({
                    contrasena_actual: passwordActual,
                    contrasena_nueva: passwordNueva
                })
            });

            if (respuesta.status===200){
                setExitoPassword("¡Contraseña actualizada con éxito!");
                setPasswordActual('');
                setPasswordNueva('');
            } else{
                const datos= await respuesta.json();
                setErrorPassword(datos.detail || 'No se pudo procesar la actualización en el servidor.');
            }
        } catch (error) {
            console.error(error);
            setErrorPassword('Error de red al conectar con el servidor.');
        } finally {
            setActualizandoPassword(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in mt-6">
            <div className="bg-slate-900 p-5 text-white">
                <h3 className="font-bold text-lg flex items-center gap-2">Cambiar Contraseña</h3>
                <p className="text-xs text-slate-400 mt-0.5">Modifique sus credenciales</p>
            </div>
            <div className="p-6 space-y-4">
                {errorPassword && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-xl text-xs font-medium"> 
                        {errorPassword}
                    </div>
                )}
                {exitoPassword && (
                    <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded-xl text-xs font-medium">
                        {exitoPassword}
                    </div>
                )}

                <form 
                    onSubmit={manejarCambioPasswordApi}
                    className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contraseña Actual</label>
                            <input 
                                type="password"
                                required
                                placeholder="Ingrese clave de acceso actual"
                                value={passwordActual}
                                onChange={(e)=> setPasswordActual(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none text-slate-800 focus:ring-2 focus:ring-purple-500 transition-all"/>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nueva Contraseña</label>
                            <input 
                                type="password"
                                required
                                placeholder="Mínimo 6 caracteres"
                                value={passwordNueva}
                                onChange={(e)=> setPasswordNueva(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none text-slate-800 focus:ring-2 focus:ring-purple-500 transition-all"/>
                        </div>
                        <button
                            type="submit"
                            disabled={actualizandoPassword}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md disabled:bg-purple-400 cursor-pointer mt-2"
                        >
                            {actualizandoPassword ? 'Modificando Registro...' : 'Actualizar Credencial de Acceso'}        
                        </button>
                </form>
            </div>
        </div>
    )
}

export default SeccionSeguridad;