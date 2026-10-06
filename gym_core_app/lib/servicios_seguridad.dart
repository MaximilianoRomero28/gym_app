import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:gym_core_app/constans.dart';
import 'dart:convert' as convert;

class ServiciosSeguridad {
  static Future<String?> cambiarContrasenaUniversal(String actual, String nueva) async{
    final prefs=await SharedPreferences.getInstance();

    final String? token=prefs.getString('token_seguro');

    final url= Uri.http(ApiConfig.authority,
    '/v1/usuarios/cambiar-password');

    try {
      final respuesta= await http.patch(url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: convert.jsonEncode({
        'contrasena_actual': actual,
        'contrasena_nueva': nueva,
      })
      );


      if (respuesta.statusCode==200){
       return null;
      } else {
        final datosError= convert.jsonDecode(respuesta.body);
       return datosError['detail'] ?? 'Error al procesar actualización';
      }
    } catch (e) {
      return 'Error de conexión con el servidor';
    }
  }
}