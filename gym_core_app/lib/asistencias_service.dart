import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:gym_core_app/constans.dart';

class AsistenciasService {

  static Future<Map<String, dynamic>> ficharMolinete(String email) async{
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token_seguro') ?? "";


    final url = Uri.http(ApiConfig.authority,
    '/v1/asistencias/fichar',{
      "email": email,      
    }

    );

    try {
      final respuesta= await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        }
      );
      return {
        'status': respuesta.statusCode,
        'body': respuesta.body,
      };
    } catch (e) {
      //ignore: avoid_print
      print("Error de conexión con el molinete: $e");
      return {
        'status': -1,
        'error': e.toString(),
      };
    }
  }
}