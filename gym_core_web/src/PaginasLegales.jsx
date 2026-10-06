import React from "react";

const ContenedorLegal = ({titulo, subtitulo,children}) => {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12 font-sans selection:bg-purple-100">
            <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="border-b border-slate-100 pb-5 mb-6">
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-md">
                        Documento Oficial GymCore
                    </span>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-3">{titulo}</h1>
                    <p className="text-xs text-slate-500 mt-1">{subtitulo}</p>
                </div>
                <div className="space-y-6 text-sm leading-relaxed text-slate-600 font-medium">
                    {children}
                </div>
                <div className="border-t border-slate-100 pt-5 mt-8 flex justify-between items-center text-xs text-slate-400">
                    <p>© 2026 GymCore SaaS. Todos los derechos reservados.</p>
                    <a href="/login" className="text-purple-600 hover:text-purple-700 font-bold transition-colors">Volver al Login</a>
                </div>
            </div>
        </div>
    );
};

//Terminos y Condiciones
export function TerminosCondiciones() {
    return(
        <ContenedorLegal titulo="Términos y Condiciones de uso"
            subtitulo="Última actualización: Octubre 2026">
            <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">1. Aceptación del Servicio</h2>
                <p>Al registrar una sucursal o iniciar sesión en la plataforma GymCore, el usuario (en adelante, "El Cliente" o "Dueño de Gimnasio) acepta de forma vinculante los presentes Términos y Condiciones. 
                    El servicio se presta bajo la modalidad SaaS (Software como Servicio).
                </p>
            </section> 
            <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">2. Ciclos de Facturación y Licenciamientos</h2>
                <p>Las suscripciones a la plataforma de GymCore se rigen por períodos mensuales rígidos. De acuerdo con los usos comerciales vigentes, **las licencias caducan de forma improrrogable el día 10 de cada mes**. El Cliente dispone del período comprendido 30 días luego del pago para regularizar el abono del servicio.
                    El impago posterior al día 10 facultará al Súper Administrado a la suspensión inmedia del acceso a la plataforma.
                </p>
            </section>
            <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">3. Responsabilidad del Uso de Cuentas</h2>
                <p>El Cliente es el único responsable de la custodia de las credenciales de acceso asignadas a su personal (Recepcionistas, Profesores). GymCore no se responsabiliza por alteraciones de datos, borrado físico de planes o modificaciones de finanzas resultantes del descuido o filtración de dichas contraseñas locales.</p>
            </section>
        </ContenedorLegal>
    );
}

//Política de privacidad
export function PoliticaPrivacidad() {
    return(
        <ContenedorLegal titulo="Política de Privacidad y Tratamiento de Datos" subtitulo="Cumplimiento Estricto Ley Nacional N° 25.326">
            <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">1. Marco Legal y Protección de Datos</h2>
                <p>En cumplimiento de la **Ley Nº 25.326 de Protección de Datos Personal de la República Argentina**, GymCore asume el rol de procesado técnico de datos. Se garantiza que toda la información relativa de Alumnos, Profesores, Rutinas y Asistencias se almacena de forma aislada e inviolable en bases de datos cifrados.</p>
            </section>
            <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">2. Seguridad Criptográfica de Credenciales</h2>
                <p>GymCore aplica protocolos de seguridad de grado industrial. Las contraseñas de todos los usuarios de la plataforma (Dueño, Personal y Alumnos) son procesadas mediante algoritmos de hash unidireccionales pesados (**Bcrypt**). Ningún administrador del sistema ni personal técnico tiene acceso a las contraseñas planas de los usuarios comerciales.</p>
            </section>
            <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">3. No Transferencia de Información</h2>
                <p>Los datos recolectados por cada gimnasio cliente (nombres, correos electrónicos, historiales de cobro y registros biométricos o de visitas) pertenecen exclusivamente a dicha sucursal. GymCore jamás comercialzará, transferirá ni expondrá las bases de datos a terceras empresas bajo ningún concepto.</p>
            </section>
        </ContenedorLegal>
    );
}

//Declaración de cookies y almacenamiento
export function PoliticaCookies() {
    return(
        <ContenedorLegal titulo="Uso de Cookies y Almacenamiento Local (Web Storage)" subtitulo="Optimización de sesiones de Usuario">
            <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">1. ¿Qué tecnología utilizamos?</h2>
                <p>Para garantizar una navegación fluida sin cierres de sesión abruptos, GymCore no utiliza cookies de rastreo publicitario de terceros. En su lugar, utiliza las tecnologías nativas de HTML conocidas como **LocalStorage** y **SessionStorage** (Web Storage) en el navegador de la PC o dispositivo móvil [local].</p>
            </section>
            <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">2. Finalidad del Almacenamiento</h2>
                <p>Los datos almacenados localmente en el dispositivo del usuario tienen finalidades estrictamente técnicas y operativas:</p>
                <ul className="list-disc pl-5 mt-2 space-y-2 text-xs">
                    <li><strong>token_web/token_plataforma:</strong> Conserva de forma cifrada el token Bearer JWT para validar los permisos ante FastAPI [local].</li>
                    <li><strong>rol_usuario:</strong> Permite a React dibujar las solapas correspondientes según los permisos jerárquicos aprobados [local].</li>
                    <li><strong>config_visual:</strong> Almacena de forma temporal el ID y el nombre del gimnasio asignado para personalizar los títulos del panel de control de mostrador [local]-</li>
                </ul>
            </section>
            <section>
                <h2 className="text-base font-bold text-slate-900 mb-2">3. Control por parte del Usuario</h2>
                <p>SessionStorage se destruye de forma automática al cerrar la pestaña actual del navegador. LocalStorage puede ser vaciado en cualquier momento por el usuario haciendo uso del botón "Cerrar Sesión" del sistema o limpiando el historial de navegación de su explorador web [local].</p>
            </section>
        </ContenedorLegal>
    );
}