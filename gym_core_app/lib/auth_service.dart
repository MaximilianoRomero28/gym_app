import 'dart:convert' as convert;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:gym_core_app/constans.dart';


class AuthService {

  static Future<String?> login(String email, String password) async {
    
     final url= Uri.http(ApiConfig.authority,
      '/v1/auth/login');

    try {
      final respuesta = await http.post(url,
      headers: {
        'Content-Type': 'application/json'
      },
      body: convert.jsonEncode({
        'email': email,
        'contrasena': password,
        'cliente': "mobile"
      })
      );

      if (respuesta.statusCode==200) {
        final datos=convert.jsonDecode(respuesta.body);
        final tokenRecibido= datos['access_token'];
        final rolUsuario = datos['rol'] ?? "Alumno";

        final prefs= await SharedPreferences.getInstance();
        await prefs.setString('token_seguro',tokenRecibido);
        await prefs.setString('rol_usuario_seguro', rolUsuario);

        final String gimnasioID=datos['config_visual']?['gimnasio_id']?.toString() ?? "1";
        await prefs.setString('gimnasio_id_usuario',gimnasioID);

        final String profesorId= datos['config_visual']?['usuario_id']?.toString() ?? "1";
        await prefs.setString('profesor_id_usuario', profesorId);

        //ignore: avoid_print
        print("Éxito: Rol detectado -> $rolUsuario");
        //ignore: avoid_print
        print("Exito: token recibido:$tokenRecibido");                  

        return rolUsuario;        
      } else {
      //ignore: avoid_print
      print("Error Login:${respuesta.statusCode}-${respuesta.body}");
      return null;
      }
    } catch (e){
    //ignore: avoid_print
      print("Error critico de red: $e");
      return null;
    }
  }
}