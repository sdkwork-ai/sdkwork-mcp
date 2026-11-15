import '../src/mcp_app_client.dart';
import '../src/session/mcp_app_session.dart';

class SdkworkMcpFlutterSdkClients {
  const SdkworkMcpFlutterSdkClients({
    required this.apiBaseUrl,
    required this.backendApiBaseUrl,
    required this.sdkFamilies,
    required this.appClient,
  });

  final String apiBaseUrl;
  final String backendApiBaseUrl;
  final List<String> sdkFamilies;
  final SdkworkAppClient appClient;
}

SdkworkMcpFlutterSdkClients createSdkworkMcpFlutterSdkClients({
  required String apiBaseUrl,
  String? backendApiBaseUrl,
  McpAppSession? session,
}) {
  final normalizedApiBaseUrl = apiBaseUrl.replaceAll(RegExp(r'/+$'), '');
  final bundle = createMcpAppClient(
    apiBaseUrl: normalizedApiBaseUrl,
    accessToken: session?.accessToken,
    authToken: session?.authToken,
    tenantId: session?.tenantId,
    organizationId: session?.organizationId,
    userId: session?.userId,
  );
  return SdkworkMcpFlutterSdkClients(
    apiBaseUrl: normalizedApiBaseUrl,
    backendApiBaseUrl: backendApiBaseUrl ??
        normalizedApiBaseUrl.replaceAll('/app/v3/api', '/backend/v3/api'),
    sdkFamilies: const [
      'sdkwork-mcp-app-sdk',
    ],
    appClient: bundle.appClient,
  );
}
