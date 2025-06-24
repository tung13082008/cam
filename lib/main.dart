import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:http/http.dart' as http;

late List<CameraDescription> cameras;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  cameras = await availableCameras();
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SpyCam',
      home: CameraCaptureScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class CameraCaptureScreen extends StatefulWidget {
  @override
  _CameraCaptureScreenState createState() => _CameraCaptureScreenState();
}

class _CameraCaptureScreenState extends State<CameraCaptureScreen> {
  late CameraController _controller;
  bool _isCameraReady = false;
  Timer? _captureTimer;

  @override
  void initState() {
    super.initState();
    requestCameraPermission();
  }

  Future<void> requestCameraPermission() async {
    var status = await Permission.camera.request();
    if (status.isGranted) {
      await initCamera();
    } else {
      print('❌ Camera permission denied');
    }
  }

  Future<void> initCamera() async {
    _controller = CameraController(cameras[0], ResolutionPreset.medium);
    await _controller.initialize();
    setState(() => _isCameraReady = true);

    // Bắt đầu chụp ảnh mỗi 5 giây
    _captureTimer = Timer.periodic(Duration(seconds: 5), (_) => captureAndSend());
  }

  Future<void> captureAndSend() async {
    try {
      final file = await _controller.takePicture();
      final imageFile = File(file.path);
      await sendToServer(imageFile);
    } catch (e) {
      print("❌ Capture error: $e");
    }
  }

  Future<void> sendToServer(File image) async {
    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('http://192.168.1.12:5000/upload'), // ← IP máy Windows của bạn
      );
      request.files.add(await http.MultipartFile.fromPath('image', image.path));
      var response = await request.send();
      print('✅ Upload status: ${response.statusCode}');
    } catch (e) {
      print("❌ Upload failed: $e");
    }
  }

  @override
  void dispose() {
    _captureTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isCameraReady
          ? CameraPreview(_controller)
          : Center(child: CircularProgressIndicator()),
    );
  }
}
