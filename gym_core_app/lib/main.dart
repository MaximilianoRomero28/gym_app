import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert' as convert; //para transformar los datos a json

void main() {
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
        colorScheme: .fromSeed(seedColor: Colors.deepPurple),
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
                
                //aca contecto con fastapi
                final url= Uri.http('127.0.0.1:8000',
                '/v1/auth/login',{
                  'email': _emailController.text,
                  'contrasena_plana': _passwordController.text,
                }
                );

                try {
                  final respuesta = await http.post(url);//lanzamos la peticion post por la red usando la url

                  if (respuesta.statusCode==201) {
                    final datos=convert.jsonDecode(respuesta.body);
                    //ignore: avoid_print
                    print("Exito: token recibido:${datos['access_token']}");
                  } else {
                    //ignore: avoid_print
                    print("Error Login:${respuesta.statusCode}-${respuesta.body}");
                  }
                } catch (e){
                  //ignore: avoid_print
                  print("Error critico de red: $e");
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

