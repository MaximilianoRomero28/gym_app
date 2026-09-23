import 'package:flutter/material.dart';
import 'package:gym_core_app/auth_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert' as convert; //para transformar los datos a json
import 'package:gym_core_app/constans.dart';
import 'package:gym_core_app/asistencias_service.dart';


void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const GymCoreApp());
}

class GymCoreApp extends StatelessWidget {
  const GymCoreApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gym Core',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const PantallaLogin(),
    );
  }//esto es lo que va a aparecer en la pantalla mientras la aplicacion inicia, 
  //no es la interfaz de inicio de sesion sino que es hasta que cargue
}

class PantallaLogin extends StatefulWidget {
  const PantallaLogin({super.key});


  @override
  State<PantallaLogin> createState()=> _PantallaLoginState();
}

class _PantallaLoginState extends State<PantallaLogin>{

  final _emailController= TextEditingController();

  final _passwordController= TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        //esto es el margen (padding) y como queremos que sea constante le colocamos const
        padding: const EdgeInsets.symmetric(horizontal: 24.0),
        child: Column(//esto es para hacer una caja para centrar los box de mail,password y el boton de ingresar
          mainAxisAlignment: MainAxisAlignment.center,//centra verticalmente
          crossAxisAlignment: CrossAxisAlignment.stretch,//estira los botones a lo ancho
          children: [
            //icono del gimnasio
            const Icon(Icons.fitness_center, size: 80, color: Colors.deepPurple),
            const SizedBox(height: 30),
            //campo de email con icono carta
            TextField(
              controller:  _emailController,
              decoration: const InputDecoration(
                labelText: 'Correo Electrónico',//esto es el texto que va a tener la caja
                prefixIcon: Icon(Icons.email),//esto es para colocar el icono de mail
                border: OutlineInputBorder(//aca estoy definiendo el borde de la caja con su radio de borde
                  borderRadius: BorderRadius.all(Radius.circular(12.0))
                ),
              ),
            ),
            const SizedBox(height: 16),//otro espacio vacio
            //el otro campo de password
            TextField(
              controller: _passwordController,
              obscureText: true,//esto es para cada letra que se escriba tenga puntitos
              decoration: const InputDecoration(
                labelText: 'Contraseña',
                prefixIcon: Icon(Icons.lock),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(12.0)),
                ),
              ),
            ),
            const SizedBox(height: 24),

            //Boton de ingreso
            ElevatedButton(
              onPressed: () async {
                
                final rolUsuario = await AuthService.login(
                  _emailController.text,
                  _passwordController.text,
                );

                if (context.mounted) {
                  if (rolUsuario=="Alumno"){
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) => PantallaPrincipalHome(emailAlumno: _emailController.text)
                      ), 
                    );
                  } else if (rolUsuario=="Profesor" || rolUsuario=="Dueño"){
                    Navigator.pushReplacement(
                      context, 
                      MaterialPageRoute(builder: (context) => const PanelProfesorHub()
                      ),
                    );
                  }
                }
              },

              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16.0),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12.0)
                ),
              ),
              child: const Text('Ingresar', style: TextStyle(fontSize: 16)),
            )
          ],
        ),
      ),
    );
  }

}

class PantallaPrincipalHome extends StatefulWidget {
  final String emailAlumno;

  const PantallaPrincipalHome({super.key, required this.emailAlumno});

  @override
  State<PantallaPrincipalHome> createState() => _PantallaPrincipalHomeState();

}

class _PantallaPrincipalHomeState extends State<PantallaPrincipalHome> {
  String _estadoAcceso = "ESPERA";
  String _mensajeServidor = "Toque el botón al pasar por el molinete";

  Future<void> _ficharMolinete() async {

    final resultado = await AsistenciasService.ficharMolinete(widget.emailAlumno);
    final statusCode = resultado['status'];

    if (statusCode==201){
      setState(() {
        _estadoAcceso = "PERMITIDO";
        _mensajeServidor = "¡ACCESO PERMITIDO! Buen entrenamiento";
      });
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context)=> const ContenidoAppHub()),
          );
        }
      });
    } else if (statusCode==403) {
      setState(() {
        _estadoAcceso ="DENEGADO";
        _mensajeServidor="ACCESO DENEGADO\nCuotaVencida. Regularice en administración";
      });
    } else {
      setState(() {
        _estadoAcceso= "ESPERA";
        final error= resultado['error'] != null
          ? "Error de conexión con el molinete: ${resultado['error']}"
          : "Error inesperado: $statusCode";
        _mensajeServidor =error;
      });
    }
  }

  @override

  Widget build(BuildContext context){
    Color colorFondo=Colors.grey[200]!;
    IconData iconoVisual = Icons.fitness_center;
    Color colorElementos = Colors.deepPurple;

    if (_estadoAcceso=="PERMITIDO"){
      colorFondo = Colors.green;
      iconoVisual = Icons.check_circle;
      colorElementos = Colors.white;
    } else if (_estadoAcceso=="DENEGADO"){
      colorFondo=Colors.red;
      iconoVisual=Icons.error;
      colorElementos=Colors.white;
    }

    return Scaffold(
      backgroundColor: colorFondo,
      appBar: AppBar(
        title: const Text("GymCore - Pulsera Virtual"),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(iconoVisual, size: 120, color: colorElementos),
              const SizedBox(height: 32),
              Text(
                _mensajeServidor,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 22,fontWeight: FontWeight.bold,color: colorElementos),
              ),
              const SizedBox(height: 48),

              if (_estadoAcceso=="ESPERA")
                ElevatedButton.icon(
                  onPressed: _ficharMolinete,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadiusGeometry.circular(12)),
                  ),
                  icon: const Icon(Icons.sensors),
                  label: const Text("Fichar Entrada",style: TextStyle(fontSize: 18)),
                ),
              const SizedBox(height: 24),
              TextButton(
                onPressed: () async{
                  final prefs= await SharedPreferences.getInstance();
                  await prefs.remove('token_seguro');
                  if (!context.mounted) return;
                    Navigator.pushReplacement(
                      context, 
                      MaterialPageRoute(builder: (context)=>const PantallaLogin()),
                    );
                  
                },
                style: TextButton.styleFrom(
                  foregroundColor: _estadoAcceso=="ESPERA" ? Colors.deepPurple: Colors.white,
                ),
                child: const Text("Cerrar Sesión",style: TextStyle(fontSize: 16)),
              )
            ],
          ),
        ),
      ),
    );
  }
}

class ContenidoAppHub extends StatefulWidget {
  const ContenidoAppHub({super.key});

  @override
  State<ContenidoAppHub> createState() => _ContenidoAppHubState();
}

class _ContenidoAppHubState extends State<ContenidoAppHub> {
  int _indexActual = 0;

  final List<Widget> _vistas= [
    const VistaRutinas(),
    const VistasPagosAlumno(),
    const VistasMarcasPersonales(),
    const VistaAforoGimnasio(),
    const VistaAsistenciaMensual(),

  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("GymCore - Mi Panel"),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,

        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            tooltip: "Cerrar Sesión",
            onPressed: () async{
              final prefs= await SharedPreferences.getInstance();
              await prefs.remove('token_seguro');
              await prefs.remove('rol_usuario_seguro');

              if (context.mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (context) => const PantallaLogin()),
                );
              }
            },
          )
        ],
      ),
      body: _vistas[_indexActual],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _indexActual,
        type: BottomNavigationBarType.fixed,
        onTap: (indice) {
          setState(() {
            _indexActual=indice;
          });
        },
        selectedItemColor: Colors.deepPurple,
        unselectedItemColor: Colors.grey,
        items: const[
          BottomNavigationBarItem(icon: Icon(Icons.assignment),
          label: 'Rutinas',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.assignment),
          label: 'Pagos',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.emoji_events_sharp),
          label: 'Marcas',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.group),
          label: 'Ocupación',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.calendar_month),
          label: 'Metas')
        ],
      ),
    );
  }
}

class VistaRutinas extends StatefulWidget {
  const VistaRutinas({super.key});

  @override
  State<VistaRutinas> createState() => _VistaRutinasState();
}

class _VistaRutinasState extends State<VistaRutinas> {
  List<dynamic> _todasLasRutinas =[];
  Map<String,dynamic>? _rutinaSeleccionada;
  bool _cargando = true;
  

  @override
  void initState() {
    super.initState();
    _pedirRutinaalServidor();
  }

  Future<void> _pedirRutinaalServidor() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token_seguro') ?? "";


    final url = Uri.http(ApiConfig.authority, '/v1/rutina/alumno');

    try {
      final respuesta = await http.get(
        url,
        headers:{
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (respuesta.statusCode==200) {
        setState(() {
          _todasLasRutinas= convert.jsonDecode(respuesta.body);
          _cargando = false;
        });
      } else if (respuesta.statusCode==404) {
        setState(() {
          _cargando=false;
        });
      }
    } catch (e) {
      setState(() {
        debugPrint("Error cargando rutinas alumno: ${e.toString()}");
        _cargando= false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_cargando) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_todasLasRutinas.isEmpty) {
      return const Center(child: Text("No tenés ninguna rutina asignada"));
    }

    //El Alumno selecciona la rutina para hacer
    if (_rutinaSeleccionada==null) {
      return Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              "¿Qué vas a entrenar hoy?",
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold,
              color: Colors.deepPurple
                ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Expanded(
              child: ListView.builder(
                itemCount: _todasLasRutinas.length,
                itemBuilder: (context, index) {
                  final rut = _todasLasRutinas[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12.0),
                    child: ElevatedButton.icon(
                      onPressed: (){
                        setState(() {
                          _rutinaSeleccionada= rut;
                        });
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.deepPurple,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: Icon(Icons.play_circle_outline),
                      label: Text(
                        rut['nombre_rutina'] ?? 'Rutina Diaria',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                  );
                },
              ),
            )
          ],
        ),
      );
    }

    //El alumno ya eligió y ve las tarjetas con sus ejercicios
    final listasEjercicios=_rutinaSeleccionada!['ejercicios'] as List<dynamic>;

    final String nombreDelaRutinaElegida =_rutinaSeleccionada!['nombre_rutina'];

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                nombreDelaRutinaElegida,
                style: TextStyle(fontSize: 20,fontWeight: FontWeight.bold,color: Colors.deepPurple),
              ),
              TextButton.icon(
                onPressed: () => setState(() => _rutinaSeleccionada=null),
                icon: const Icon(Icons.swap_horiz,color: Colors.deepPurple),
                label: const Text("Cambiar Rutina", style: TextStyle(color: Colors.deepPurple),),
              )
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: listasEjercicios.length,
              itemBuilder: (context, index) {
                final item = listasEjercicios[index];
                return Card(
                  elevation: 3,
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: Colors.deepPurple,
                      child: Icon(Icons.fitness_center, color: Colors.white),
                    ),
                    title: Text(
                      item['ejercicios'] ?? 'Ejercicio',
                      style: const TextStyle(fontWeight: FontWeight.bold,fontSize: 18),
                    ),
                    subtitle: Text(
                      "Series: ${item['series'] ?? 0}   |   Repeticiones: ${item['repeticiones'] ?? 0}",
                      style: TextStyle(color: Colors.grey[700]),
                    ),
                  ),
                );
              },
            ),
          )
        ],
      ),
    );
  }
}


class PanelProfesorHub extends StatefulWidget {
  const PanelProfesorHub({super.key});

  @override
  State<PanelProfesorHub> createState() => _PanelProfesorHub();
}

class _PanelProfesorHub extends State<PanelProfesorHub> {
 
  final _nombreRutinaController = TextEditingController();

  final _ejercicioController = TextEditingController();

  Map<String, dynamic>? _alumnoSeleccionado;
  int? _rutinaIdCreada;
  String _nombreRutinaActiva ="";
  final List<Map<String, dynamic>> _ejerciciosCargadosEnSesion =[];

  int _series = 4;
  int _repeticiones = 10;
  bool _enviando= false;
  

  //1. Crear rutina
  Future<void> _crearRutinaMadre() async {
    final messenger = ScaffoldMessenger.of(context);
    if (_alumnoSeleccionado==null) {
      messenger.showSnackBar(const SnackBar(content: Text("Por favor, busca y selecciona un alumno")));
      return;
    }
    if (_nombreRutinaController.text.trim().isEmpty){
      messenger.showSnackBar((const SnackBar(content: Text("escribe nombre de la rutina"))));
      return;
    }

    setState(() => _enviando=true);
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token_seguro') ?? "";

    final url=Uri.http(ApiConfig.authority,'/v1/rutina', {
      'nombre_rutina': _nombreRutinaController.text.trim(),
      'profesor_id': "1",//aca hacerlo automatico
      'gimnasio_id': "1",
      'alumno_id': _alumnoSeleccionado!['id'].toString(),
    });

    try {
      final respuesta= await http.post(
        url,
        headers: {
          'Authorization': 'Bearer $token',
        }
      );
      setState(() => _enviando=false);

      if (respuesta.statusCode==201) {
        final datos=convert.jsonDecode(respuesta.body);
        setState(() {
          _rutinaIdCreada= datos['id_asignado'];
        });
        messenger.showSnackBar(const SnackBar(
          backgroundColor: Colors.green, content: Text("Rutina madre creada. Ahora añade ejercicios.")
        ));
      } else {
        messenger.showSnackBar(SnackBar(content: Text("Error al crear la rutina: ${respuesta.statusCode}.")));
      }
    } catch (e) {
      setState(() => _enviando = false);
      messenger.showSnackBar(const SnackBar(content: Text("Error de red al crear rutina.")));
    }
  }

  Future<void> _cargarEjerciciosDeRutinaExistente(int rutinaId) async {
    setState(() => _enviando = true);

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token_seguro') ?? "";

    final url= Uri.http(ApiConfig.authority,
    "/v1/rutina/$rutinaId/ejercicios");

    try {
      final respuesta=await http.get(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        }
      );

      if (!context.mounted) return;

      setState(() => _enviando=false);

      if (respuesta.statusCode==200) {
        final List<dynamic> datos= convert.jsonDecode((respuesta.body));
        setState(() {
          _ejerciciosCargadosEnSesion.clear();
          _ejerciciosCargadosEnSesion.addAll(datos.map((json) => json as Map<String,dynamic>));
          _rutinaIdCreada= rutinaId;
        });
      }
    } catch (e) {
      if (!context.mounted) return;
      setState(() => _enviando=false);
      debugPrint("Error al recuperar ejercicios viejos: ${e.toString()}");
    }

  }

    //2. Cargar ejercicios
  Future<void> _agregarEjercicioEnBucle() async {

    final messenger= ScaffoldMessenger.of(context);

    final String nombreEjercicioTipeado = _ejercicioController.text.trim();

    if (nombreEjercicioTipeado.isEmpty) {
      messenger.showSnackBar(const SnackBar(content: Text("Escribe el nombre del ejercicio.")));
      return;
    }

    setState(() => _enviando = true);

    final prefs = await SharedPreferences.getInstance();
    final token= prefs.getString('token_seguro') ?? "";

    final url = Uri.http(ApiConfig.authority,
    '/v1/ejerciciosrutina', {
      'ejercicio': nombreEjercicioTipeado,
      'numeros_series': _series.toString(),
      'rep': _repeticiones.toString(),
      'rutina_id': _rutinaIdCreada!.toString(),
    });

    try {
      final respuesta = await http.post(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Tpye': 'application/json',
        },
      );

      setState(() => _enviando = false);

      if (respuesta.statusCode==201) {
        
        setState(() {
          _ejerciciosCargadosEnSesion.add({
            'nombre_del_ejercicio': nombreEjercicioTipeado,
            'series': _series,
            'repeticiones': _repeticiones,
          });
          _ejercicioController.clear();
          _series=4;
          _repeticiones=10; 
        });
         messenger.showSnackBar(const SnackBar(backgroundColor: Colors.green, content: Text("Ejercicio añadido.")));
      } else {
        messenger.showSnackBar(
          SnackBar(content: Text("Error al cargar el ejercicio: ${respuesta.statusCode}")),
        );
      }
    } catch (e) {
      setState(() => _enviando=false);
      messenger.showSnackBar(
        const SnackBar(content: Text("Error de red. Verifica la conexión.")),
      );
    }
  }


  @override
  void dispose() {
    _nombreRutinaController.dispose();
    _ejercicioController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bool modoCargaEjercicios = _rutinaIdCreada !=null;

    return Scaffold(
      appBar: AppBar(
        title: const Text("GymCore - Panel Profesor"),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
      
      actions: [
        if (_rutinaIdCreada !=null)
          IconButton(
            icon: Icon(Icons.done_all, color: Colors.greenAccent),
            tooltip: "Finalizar Rutina Completa",
            onPressed: () {
              setState(() {
                _alumnoSeleccionado = null;
                _rutinaIdCreada = null;
                _ejerciciosCargadosEnSesion.clear();
                _nombreRutinaController.clear();
              });
            },
          ),
          IconButton(
            icon: Icon(Icons.logout, color: Colors.white),
            tooltip: "Cerra Sesión",
            onPressed: () async{
              final prefs= await SharedPreferences.getInstance();
              await prefs.remove('token_seguro');
              await prefs.remove('rol_usuario_seguro');

              if (context.mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (context) => const PantallaLogin()),
                );
              }
            },
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Asignar Entrenamiento", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.deepPurple)),
            const SizedBox(height: 24),
            
            // 1. FASE DE SELECCIÓN (Buscador + Nombre + Botones Naranjas)
            if (!modoCargaEjercicios) ...[
              const Text("Buscar Alumno", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Autocomplete<Map<String, dynamic>>(
                displayStringForOption: (option) => option['nombre_usuario'] ?? '',
                optionsBuilder: (textEditingValue) async {
                  if (textEditingValue.text.length < 2) return const Iterable.empty();
                  final prefs = await SharedPreferences.getInstance();
                  final token = prefs.getString('token_seguro') ?? "";
                  final url = Uri.http(ApiConfig.authority, '/v1/usuarios/buscar', {'termino': textEditingValue.text, 'gimnasio_id': "1"});
                  try {
                    final respuesta = await http.get(url, headers: {'Authorization': 'Bearer $token'});
                    if (respuesta.statusCode == 200) {
                      final List<dynamic> datos = convert.jsonDecode(respuesta.body);
                      return datos.map((json) => json as Map<String, dynamic>);
                    }
                  } catch (e) { debugPrint(e.toString()); }
                  return const Iterable.empty();
                },
                onSelected: (Map<String, dynamic> seleccion) {
                  setState(() {
                    _alumnoSeleccionado = seleccion; 
                  });
                },
              ),
              const SizedBox(height: 24),
              const Text("Nombre de la Rutina", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextField(
                controller: _nombreRutinaController,
                decoration: const InputDecoration(
                  hintText: "Ej: Rutina A - Hipertrofia Pecho/Tríceps",
                  prefixIcon: Icon(Icons.assignment),
                  border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12.0))),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _enviando ? null : _crearRutinaMadre,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.deepPurple, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(50)),
                icon: const Icon(Icons.create_new_folder),
                label: const Text("Iniciar nueva Rutina"),
              ),
              const SizedBox(height: 16),
              
              if (_alumnoSeleccionado != null && 
                  _alumnoSeleccionado!['rutinas_activas'] != null &&
                  (_alumnoSeleccionado!['rutinas_activas'] as List).isNotEmpty) ...[
                const Text("O reanudar una rutina diaria existente:", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey)),
                const SizedBox(height: 8),
                ...(_alumnoSeleccionado!['rutinas_activas'] as List<dynamic>).map((rutina) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8.0),
                    child: ElevatedButton.icon(
                      onPressed: () {
                        _nombreRutinaController.text = rutina['nombre'] ?? '';
                        _nombreRutinaActiva = rutina['nombre'] ?? '';
                        _cargarEjerciciosDeRutinaExistente(rutina['id']);
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(45)),
                      icon: const Icon(Icons.fitness_center),
                      label: Text("Entrar a: ${rutina['nombre']}"),
                    ),
                  );
                }),
              ],
            ],

            // 2. FASE DE CARGA EN BUCLE (Inputs + Selectores Series/Reps + Botón Verde)
            if (modoCargaEjercicios) ...[
              const Divider(height: 40, thickness: 2),
              Text("Añadiendo a Rutina: $_nombreRutinaActiva", style: const TextStyle(fontSize: 14, color: Colors.grey)),
              const SizedBox(height: 8),
              const Text("Añadir Ejercicio a la Rutina", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.deepPurple)),
              const SizedBox(height: 16),
              TextField(
                controller: _ejercicioController,
                textCapitalization: TextCapitalization.sentences,
                decoration: const InputDecoration(
                  hintText: "Ej: Press inclinado con mancuernas...",
                  prefixIcon: Icon(Icons.edit),
                  border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12.0))),
                ),
              ),
              const SizedBox(height: 24),
              
              // Fila de Series y Reps optimizada sin desbordes
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Expanded(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            IconButton(icon: const Icon(Icons.remove_circle), onPressed: _series > 1 ? () => setState(() => _series--) : null),
                            Text("$_series Series"),
                            IconButton(icon: const Icon(Icons.add_circle), onPressed: () => setState(() => _series++)),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            IconButton(icon: const Icon(Icons.remove_circle), onPressed: _repeticiones > 1 ? () => setState(() => _repeticiones--) : null),
                            Text("$_repeticiones Reps"),
                            IconButton(icon: const Icon(Icons.add_circle), onPressed: () => setState(() => _repeticiones++)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _enviando ? null : _agregarEjercicioEnBucle,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(50)),
                icon: const Icon(Icons.add),
                label: const Text("Cargar Ejercicio y Añadir Otro"),
              ),
              
              // 🚨 NUEVA UBICACIÓN: EL LISTADO DE EJERCICIOS AHORA SE DIBUJA ABAJO DEL BOTÓN VERDE 🚨
              const Divider(height: 40, thickness: 1),
              Text("Ejercicios Añadidos (${_ejerciciosCargadosEnSesion.length})", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.deepPurple)),
              const SizedBox(height: 12),
              
              // Usamos ListView.builder con shrinkWrap para que se adapte perfecto al scroll vertical global
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _ejerciciosCargadosEnSesion.length,
                itemBuilder: (context, index) {
                  final ej = _ejerciciosCargadosEnSesion[index];
                  final nombreEjercicio = ej['nombre_del_ejercicio']?.toString() ?? 'Ejercicio';
                  final series = ej['series']?.toString() ?? '0';
                  final repeticiones = ej['repeticiones']?.toString() ?? '0';

                  return Card(
                    margin: const EdgeInsets.symmetric(vertical: 6.0),
                    child: ListTile(
                      leading: CircleAvatar(backgroundColor: Colors.deepPurple, child: Text("${index + 1}", style: const TextStyle(color: Colors.white))),
                      title: Text(nombreEjercicio, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text("$series Series x $repeticiones Reps"),
                    ),
                  );
                },
              ),
            ]
          ],
        ),
      ),
    );
  }
}

class VistasPagosAlumno extends StatefulWidget {
  const VistasPagosAlumno({super.key});

  @override
  State<VistasPagosAlumno> createState() => _VistaPagosAlumnoState();
}

class _VistaPagosAlumnoState extends State<VistasPagosAlumno> {
  List<dynamic> _historialPagos=[];

  bool _cargando =true;

  @override
  void initState() {
    super.initState();
    _obtenerPagosdelServidor();
  }

  Future<void> _obtenerPagosdelServidor() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token_seguro') ?? "";

    final url= Uri.http(ApiConfig.authority,
    '/v1/pagos/alumno');

    try {
      final respuesta = await http.get(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        }
      );
      if (respuesta.statusCode==200) {
        setState(() {
          _historialPagos =convert.jsonDecode(respuesta.body);
          _cargando =false;
        });
      } else {
        setState(() => _cargando = false);
      }
    } catch (e) {
      setState(() => _cargando=false);
      debugPrint("Error cargando pagos: ${e.toString()}");
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_cargando) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_historialPagos.isEmpty) {
      return const Center(child: Text("No tienes pagos registrados."));
    }

    final ultimoPago = _historialPagos.first;
    final String proximoVencimiento = ultimoPago['fecha_vencimiento'] ?? 'Sin fecha';

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            color: Colors.deepPurple.withValues(alpha: 0.08),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: ListTile(
              leading: const CircleAvatar(
                backgroundColor: Colors.deepPurple,
                child: Icon(Icons.calendar_month, color: Colors.white),
              ),
              title: const Text("Tú próximo vencimiento", style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle:  Text(
                proximoVencimiento,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.deepPurple),
              ),
            ),
          ),
          const SizedBox(height: 20),
          const Text("Historial de Facturas", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold,color: Colors.grey)),
          const SizedBox(height: 10),

          //Listado de cuotas históricas
          Expanded(
            child: ListView.builder(
              itemCount: _historialPagos.length,
              itemBuilder: (context, index) {
                final factura = _historialPagos[index];
                final monto = factura['monto']?.toString() ?? '0';
                final fecha = factura['fecha_pago'] ?? 'sin fecha';
                final reciboId=factura['id']?.toString() ?? '0';

                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 6.0),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: ListTile(
                    leading: const Icon(Icons.receipt_long, color: Colors.green, size: 30),
                    title: Text("Monto Abonado: \$$monto", style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text("Pagado el: $fecha"),
                    trailing: Text("Recibo #$reciboId", style: const TextStyle(color: Colors.grey, fontSize: 12)),
                  ),
                );
              },
            ),
          )
        ],
      ),
    );

  }
}

class VistasMarcasPersonales extends StatefulWidget {
  const VistasMarcasPersonales({super.key});
  
  @override
  State<VistasMarcasPersonales> createState() => _VistasMarcasPersonalesState();
}

class _VistasMarcasPersonalesState extends State<VistasMarcasPersonales> {
  List<dynamic> _historiaMarcas = []; //declaro una lista vacía

  bool _cargando = true;

  final _nombreEjercicio= TextEditingController();
  final _peso = TextEditingController();
  final _repeticiones = TextEditingController();

  @override//esto es para que cuando apenas apriete la solapa la app vaya a buscar las marcas
  void initState() {
    super.initState();
    _obtenerHistorialDelServidor();
  }

  Future<void> _obtenerHistorialDelServidor() async {
    final prefs= await SharedPreferences.getInstance();
    final token= prefs.getString('token_seguro') ?? "";

    final url= Uri.http(ApiConfig.authority,
    '/v1/marcas-personales/historial');

    try {
      final respuesta= await http.get(
        url,
        headers: {
          'Authorization':'Bearer $token',
          'Content-Type': 'application/json',
        }
      );

      if (respuesta.statusCode==200) {
        setState((){
          _historiaMarcas = convert.jsonDecode(respuesta.body);
          _cargando=false;
        });
      } else if (respuesta.statusCode==404){
        debugPrint("No se encuentran marcas en tu historial.");
        _cargando=false;
      }
    } catch (e) {
      debugPrint("Error cargando marcas: ${e.toString()}");
      _cargando=false;
    }  
  }

  Future<void> _guardarNuevaMarca() async{
    final String ejercicio= _nombreEjercicio.text.trim();
    final String peso= _peso.text.trim();
    final String reps= _repeticiones.text.trim();

    if (ejercicio.isEmpty || peso.isEmpty || reps.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.red,
          content: Text("Por favor, completa todos los campos del récord."),
        ),
      );
      return;
    }
    
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token_seguro') ?? "";

    final url = Uri.http(ApiConfig.authority,
    '/v1/marcas-personales',{
      'ejercicio': ejercicio,
      'peso': peso,
      'reps': reps,
    });

    try {
      final respuesta= await http.post(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        }
      );

      if (respuesta.statusCode==201) {
        _nombreEjercicio.clear();
        _peso.clear();
        _repeticiones.clear();
        if (mounted) {
          Navigator.pop(context,
          );
        }
        _obtenerHistorialDelServidor();
      }
    } catch (e){
      debugPrint("Error al cargar ejercicio: ${e.toString()}");
      _cargando=false;
    }
  }

  void _abrirFormularioFlotante(){
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text(
            "Registrar Nuevo Récord",
            style: TextStyle(color: Colors.deepPurple, fontWeight: FontWeight.bold),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: _nombreEjercicio,
                  decoration: const InputDecoration(labelText: "Ejercicio (Ej:Prensa)"),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _peso,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: "Peso máximo (KG)"),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _repeticiones,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: "Repeticiones máximas"),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancelar", style: TextStyle(color: Colors.red)),
            ),
            ElevatedButton(
              onPressed: _guardarNuevaMarca,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.deepPurple,
                  foregroundColor: Colors.white
                ),
              child: const Text("Guardar Récord"),
            )
          ],
        );
      }
    );
  }

  @override
  void dispose() {
    _nombreEjercicio.dispose();
    _peso.dispose();
    _repeticiones.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context){
    if (_cargando==true) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }
      
    return Scaffold(
      body: _historiaMarcas.isEmpty
        ? const Center(
          child: Text("¡Registra tu primer récord de fuerza!"),
        )
        : ListView.builder(
        itemCount: _historiaMarcas.length,
        itemBuilder: (context, index) {
          final marca = _historiaMarcas[index];
          final ejercicio= marca['ejercicio']?.toString() ?? "Ejercicio";
          final peso= marca['peso']?.toString() ?? "";
          final reps= marca['repeticiones']?.toString() ?? "";

          return Card(
            margin: const EdgeInsets.symmetric(vertical: 6.0,horizontal: 16.0),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: ListTile(
             leading: const Icon(Icons.format_list_bulleted),
              title: Text("Ejercicio: $ejercicio",  style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text("Peso: $peso   |   Repeticiones: $reps", style: const TextStyle(fontSize: 14.0, color: Colors.grey)),
           ),
          );
        }),
      floatingActionButton: FloatingActionButton(
         backgroundColor: Colors.deepPurple,
         foregroundColor: Colors.white,
         onPressed: _abrirFormularioFlotante,
         child: const Icon(Icons.add),
           
        )  
     );
  } 
} 

class VistaAforoGimnasio extends StatefulWidget{
  const VistaAforoGimnasio({super.key});

  @override
  State<VistaAforoGimnasio> createState() => _VistaAforoGimnasioState();
}

class _VistaAforoGimnasioState extends State<VistaAforoGimnasio> {
  Map<String,dynamic> _datosAforo= {};

  bool _cargando=true;

  @override
  void initState() {
    super.initState();
    _obtenerAforoDelServidor(1);
  }

  Future<void> _obtenerAforoDelServidor(int gimnasioId) async{
    setState (() => _cargando=true);
    final prefs= await SharedPreferences.getInstance();
    final token= prefs.getString('token_seguro') ?? "";

    final url=Uri.http(ApiConfig.authority,
      '/v1/gimnasios/$gimnasioId/aforo',
    );


    try{
      final respuesta= await http.get(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        }
      );

      if (respuesta.statusCode==200){
        setState(() {
          _datosAforo= convert.jsonDecode(respuesta.body);
          _cargando=false;
        });
      } else {
        setState(() => _cargando=false);
      }
    } catch (e) {
      setState(() => _cargando= false);
      debugPrint("Error cargando aforo: ${e.toString()}");
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_cargando) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_datosAforo.isEmpty) {
      return const Center(
        child: Text("No se pudieron recuperar los datos de ocupación"),
      );
    }

    final int porcentaje = _datosAforo['porcentaje_ocupacion'] ?? 0;
    final int presentes = _datosAforo['personas_adentro'] ?? 0;
    final int maximo= _datosAforo['capacidad_maxima'] ?? 0;
    final String estadoTexto= _datosAforo['estado_texto']?.toString() ?? "Desconocido";

    //Logica de color dinamico segun el estado
    Color colorBarra= Colors.green;
    if (porcentaje>=40 && porcentaje<75){
      colorBarra=Colors.amber;
    } else if (porcentaje>75) {
      colorBarra=Colors.red;
    }

  return Scaffold(
    body: RefreshIndicator(
      onRefresh: () => _obtenerAforoDelServidor(1),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 10),
            const Icon(Icons.speed, size: 60, color: Colors.deepPurple),
            const SizedBox(height: 12),
            const Text(
              "¿Cómo está el gimnasio ahora?",
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.deepPurple),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),

            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 16.0,horizontal: 20.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      estadoTexto,
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),

                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: LinearProgressIndicator(
                        value: porcentaje/100,
                        minHeight: 12,
                        backgroundColor: Colors.grey[300],
                        valueColor: AlwaysStoppedAnimation<Color>(colorBarra),
                      ),
                    ),
                    const SizedBox(height: 16),

                    Text(
                      "$porcentaje% de ocupación",
                      style: TextStyle(fontSize: 14,fontWeight: FontWeight.w500,color: colorBarra),                      
                    ),
                    const SizedBox(height: 6),

                    Text(
                      "Hay $presentes personas entrenando (Capacidad máx: $maximo)",
                      style: const TextStyle(fontSize: 13, color: Colors.grey),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
            const Spacer(),

            ElevatedButton.icon(
              onPressed: () async{
                final prefs= await SharedPreferences.getInstance();
                final token= prefs.getString('token_seguro') ?? "";

                final url= Uri.http(ApiConfig.authority,
                '/v1/aforo/asistencia/fichar');

                try {
                  final respuesta= await http.post(
                    url,
                    headers: {
                      'Authorization': 'Bearer $token',
                      'Content-Type': 'application/json'
                    }
                  );

                  if (respuesta.statusCode==201) {

                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        backgroundColor: Colors.green,
                        content: Text("¡Ingreso registrado con éxito! Buen entrenamiento"),
                      )
                    );
                    _obtenerAforoDelServidor(1);
                  } else {

                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(backgroundColor: Colors.red,
                      content: Text("Error al ingresar: ${respuesta.statusCode}"),
                      )
                    );
                  }
                } catch (e) {
                  debugPrint("Error de red en molinete: $e");
                }
              },
              icon: Icon(Icons.qr_code_scanner),
              label: const Text("Fichar Ingreso al Gimnasio (QR)", style: TextStyle(fontSize: 16,fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.deepPurple,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),

            const SizedBox(height: 16),

            OutlinedButton.icon(
              onPressed:() => _obtenerAforoDelServidor(1),
              icon: const Icon(Icons.refresh, color: Colors.deepPurple),
              label: const Text("Actualizar Ocupación",style: TextStyle(color: Colors.deepPurple)),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                side: const BorderSide(color: Colors.deepPurple),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
              ),
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    ),
  );}
}

class VistaAsistenciaMensual extends StatefulWidget {
  const VistaAsistenciaMensual({super.key});

  @override
  State<VistaAsistenciaMensual> createState() => _VistaAsistenciaMensualState();
}

class _VistaAsistenciaMensualState extends State<VistaAsistenciaMensual> {

  Map<String,dynamic> _datosMetas= {};
  bool _cargando =true;

  @override
  void initState() {
    super.initState();
    _obtenerMetasDelServidor();
  }

  Future<void> _obtenerMetasDelServidor() async{
    setState(() => _cargando=true);

    final prefs=await SharedPreferences.getInstance();
    final token= prefs.getString('token_seguro') ?? "";

    final url= Uri.http(ApiConfig.authority,
    '/v1/asistencia/metas_mensuales');

    try {
      final respuesta= await http.get(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        }
      );

      if (respuesta.statusCode==200) {
        setState(() {
          _datosMetas= convert.jsonDecode(respuesta.body);
          _cargando=false;
        });
      } else {
        setState(() => _cargando=false);
      }
    } catch (e) {
      setState(() => _cargando=false);
      debugPrint("Error cargando metas:${e.toString()}");
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_cargando) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    final int totalDias= _datosMetas['total_dias_mes'] ?? 0;
    final List<dynamic> fechas= _datosMetas['fechas_asistidas'] ?? [];

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _obtenerMetasDelServidor,
        child: Padding(
          padding: const EdgeInsetsGeometry.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                color: Colors.green.withValues(alpha: 0.08),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsetsGeometry.all(20.0),
                  child: Row(
                    children: [
                      const CircleAvatar(
                        radius: 30,
                        backgroundColor: Colors.green,
                        child: Icon(Icons.workspace_premium, size: 35, color: Colors.white),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "Constancia Mensual",
                              style: TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              "Entrenaste $totalDias ${totalDias ==1 ? 'día' : 'días'} este mes!",
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green),
                            )
                          ],
                        ),
                      )
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              const Text(
                "Días Fichados",
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey),
              ),
              const SizedBox(height: 12),

              Expanded(
                child: fechas.isEmpty
                ? const Center(
                  child: Text(
                    "Todavía no registrás ingresos este mes. \n¡Fichá tu QR al llegar!",
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey, fontSize: 15),
                  ),
                )
                : ListView.builder(
                  itemCount: fechas.length,
                  itemBuilder: (context, index) {
                    final fecha = fechas[index]?.toString() ?? "";
                    return Card(
                      margin: const EdgeInsets.symmetric(vertical: 6.0),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: ListTile(
                        leading: const Icon(Icons.check_circle, color: Colors.green, size: 28),
                        title: Text(
                          "Asistencia Confirmada",
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Text("Fecha: $fecha"),
                        trailing: Text(
                          "#${index + 1}",
                          style: const TextStyle(color: Colors.grey,fontWeight: FontWeight.bold),
                        ),
                      ),
                    );
                  },
                )
              )
            ],
          ),
        ),
      ),
    );
  }
}