import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;



class ApiConfig {
  static const String _port = '8000';

  static const String _hostManual = String.fromEnvironment('API_HOST');

  static String get authority {
    if (_hostManual.isNotEmpty) {
      return '$_hostManual:$_port';
    } else if (kIsWeb) {
      return '127.0.0.1:$_port';
    } else if (Platform.isAndroid) {
      return '10.0.2.2:$_port';
    }
    return '127.0.0.1:$_port';
  }
}