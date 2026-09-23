import 'dart:convert' as convert;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:gym_core_app/constans.dart';


class AuthService {

  static Future<String?> login(String email, String password) async {
    
     final url= Uri.http(ApiConfig.authority,
      '/v1/auth/login',{
      'email': email,
      'contrasena_plana': password,
      }
    );

    try {
      final respuesta = await http.post(url);//lanzamos la peticion post por la red usando la url

      if (respuesta.statusCode==200) {
        final datos=convert.jsonDecode(respuesta.body);
        final tokenRecibido= datos['access_token'];
        final rolUsuario = datos['rol'] ?? "Alumno";

        final prefs= await SharedPreferences.getInstance();
        await prefs.setString('token_seguro',tokenRecibido);
        await prefs.setString('rol_usuario_seguro', rolUsuario);

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