import 'dart:convert';
import '../http/client.dart';
import '../models.dart';

import 'paths.dart';
import 'response_helpers.dart';


class McpApi {
  final HttpClient _client;

  McpApi(this._client);

  /// MCP mcp.listCategories
  Future<McpListCategoriesResponse?> listCategories([int? page, int? pageSize, String? cursor, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.appPath('/mcp/categories'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : McpListCategoriesResponse.fromJson(map);
    })();
  }

  /// MCP mcp.listServers
  Future<McpListServersResponse?> listServers([int? page, int? pageSize, String? cursor, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.appPath('/mcp/servers'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : McpListServersResponse.fromJson(map);
    })();
  }

  /// MCP mcp.createOwnServer
  Future<McpCreateOwnServerResponse?> createOwnServer(CreateOwnMcpServerCommand body) async {
    final payload = body.toJson();
    final response = await _client.post(ApiPaths.appPath('/mcp/servers'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : McpCreateOwnServerResponse.fromJson(map);
    })();
  }

  /// MCP mcp.listOwnedServers
  Future<McpListOwnedServersResponse?> listOwnedServers([int? page, int? pageSize, String? cursor, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.appPath('/mcp/servers/owned'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : McpListOwnedServersResponse.fromJson(map);
    })();
  }

  /// MCP mcp.getServer
  Future<McpGetServerResponse?> getServer(String serverKey) async {
    final response = await _client.get(ApiPaths.appPath('/mcp/servers/${serializePathParameter(serverKey, const PathParameterSpec('serverKey', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : McpGetServerResponse.fromJson(map);
    })();
  }

  /// MCP mcp.updateOwnServer
  Future<McpUpdateOwnServerResponse?> updateOwnServer(String serverKey, UpdateOwnMcpServerCommand body) async {
    final payload = body.toJson();
    final response = await _client.patch(ApiPaths.appPath('/mcp/servers/${serializePathParameter(serverKey, const PathParameterSpec('serverKey', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : McpUpdateOwnServerResponse.fromJson(map);
    })();
  }

  /// MCP mcp.deleteOwnServer
  Future<McpDeleteOwnServerResponse?> deleteOwnServer(String serverKey) async {
    final response = await _client.delete(ApiPaths.appPath('/mcp/servers/${serializePathParameter(serverKey, const PathParameterSpec('serverKey', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : McpDeleteOwnServerResponse.fromJson(map);
    })();
  }

  /// MCP mcp.listTools
  Future<McpListToolsResponse?> listTools(int serverId, [int? page, int? pageSize, String? cursor, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.appPath('/mcp/servers/${serializePathParameter(serverId, const PathParameterSpec('serverId', 'simple', false))}/tools'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : McpListToolsResponse.fromJson(map);
    })();
  }

  /// MCP mcp.getTool
  Future<McpGetToolResponse?> getTool(int serverId, String toolKey) async {
    final response = await _client.get(ApiPaths.appPath('/mcp/servers/${serializePathParameter(serverId, const PathParameterSpec('serverId', 'simple', false))}/tools/${serializePathParameter(toolKey, const PathParameterSpec('toolKey', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : McpGetToolResponse.fromJson(map);
    })();
  }

  /// MCP mcp.listResources
  Future<McpListResourcesResponse?> listResources(int serverId, [int? page, int? pageSize, String? cursor, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.appPath('/mcp/servers/${serializePathParameter(serverId, const PathParameterSpec('serverId', 'simple', false))}/resources'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : McpListResourcesResponse.fromJson(map);
    })();
  }

  /// MCP mcp.getResource
  Future<McpGetResourceResponse?> getResource(int serverId, String resourceKey) async {
    final response = await _client.get(ApiPaths.appPath('/mcp/servers/${serializePathParameter(serverId, const PathParameterSpec('serverId', 'simple', false))}/resources/${serializePathParameter(resourceKey, const PathParameterSpec('resourceKey', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : McpGetResourceResponse.fromJson(map);
    })();
  }

  /// MCP mcp.listPrompts
  Future<McpListPromptsResponse?> listPrompts(int serverId, [int? page, int? pageSize, String? cursor, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.appPath('/mcp/servers/${serializePathParameter(serverId, const PathParameterSpec('serverId', 'simple', false))}/prompts'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : McpListPromptsResponse.fromJson(map);
    })();
  }

  /// MCP mcp.getPrompt
  Future<McpGetPromptResponse?> getPrompt(int serverId, String promptKey) async {
    final response = await _client.get(ApiPaths.appPath('/mcp/servers/${serializePathParameter(serverId, const PathParameterSpec('serverId', 'simple', false))}/prompts/${serializePathParameter(promptKey, const PathParameterSpec('promptKey', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : McpGetPromptResponse.fromJson(map);
    })();
  }

  /// MCP mcp.upsertOwnConnector
  Future<McpUpsertOwnConnectorResponse?> upsertOwnConnector(int serverId, UpsertOwnMcpConnectorCommand body) async {
    final payload = body.toJson();
    final response = await _client.post(ApiPaths.appPath('/mcp/servers/${serializePathParameter(serverId, const PathParameterSpec('serverId', 'simple', false))}/connectors'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : McpUpsertOwnConnectorResponse.fromJson(map);
    })();
  }

  /// MCP mcp.deleteOwnConnector
  Future<McpDeleteOwnConnectorResponse?> deleteOwnConnector(int serverId, String connectorKey) async {
    final response = await _client.delete(ApiPaths.appPath('/mcp/servers/${serializePathParameter(serverId, const PathParameterSpec('serverId', 'simple', false))}/connectors/${serializePathParameter(connectorKey, const PathParameterSpec('connectorKey', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : McpDeleteOwnConnectorResponse.fromJson(map);
    })();
  }

  /// MCP mcp.listInvocations
  Future<McpListInvocationsResponse?> listInvocations([int? page, int? pageSize, String? cursor, String? q, int? serverId]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null),
      QueryParameterSpec('server_id', serverId, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.appPath('/mcp/invocations'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : McpListInvocationsResponse.fromJson(map);
    })();
  }
}

class PathParameterSpec {
  final String name;
  final String style;
  final bool explode;

  const PathParameterSpec(this.name, this.style, this.explode);
}

String serializePathParameter(dynamic value, PathParameterSpec spec) {
  if (value == null) return '';
  final style = spec.style.trim().isEmpty ? 'simple' : spec.style;
  if (value is Iterable) {
    return serializePathArray(spec.name, value, style, spec.explode);
  }
  if (value is Map) {
    return serializePathObject(spec.name, value, style, spec.explode);
  }
  return pathPrimitivePrefix(spec.name, style) + Uri.encodeComponent(value.toString());
}

String serializePathArray(String name, Iterable values, String style, bool explode) {
  final serialized = values.where((item) => item != null).map((item) => Uri.encodeComponent(item.toString())).toList();
  if (serialized.isEmpty) return pathPrefix(name, style);
  if (style == 'matrix') {
    if (explode) {
      return serialized.map((item) => ';$name=$item').join();
    }
    return ';$name=${serialized.join(',')}';
  }
  final separator = explode ? '.' : ',';
  return pathPrefix(name, style) + serialized.join(separator);
}

String serializePathObject(String name, Map values, String style, bool explode) {
  final entries = <String>[];
  final exploded = <String>[];
  values.forEach((key, value) {
    if (value == null) return;
    final escapedKey = Uri.encodeComponent(key.toString());
    final escapedValue = Uri.encodeComponent(value.toString());
    if (explode) {
      if (style == 'matrix') {
        exploded.add(';$escapedKey=$escapedValue');
      } else {
        exploded.add('$escapedKey=$escapedValue');
      }
    } else {
      entries.add(escapedKey);
      entries.add(escapedValue);
    }
  });
  if (style == 'matrix') {
    if (explode) return exploded.join();
    return ';$name=${entries.join(',')}';
  }
  if (explode) {
    final separator = style == 'label' ? '.' : ',';
    return pathPrefix(name, style) + exploded.join(separator);
  }
  return pathPrefix(name, style) + entries.join(',');
}

String pathPrefix(String name, String style) {
  if (style == 'label') return '.';
  if (style == 'matrix') return ';$name';
  return '';
}

String pathPrimitivePrefix(String name, String style) {
  return style == 'matrix' ? ';$name=' : pathPrefix(name, style);
}
class QueryParameterSpec {
  final String name;
  final dynamic value;
  final String style;
  final bool explode;
  final bool allowReserved;
  final String? contentType;

  const QueryParameterSpec(
    this.name,
    this.value,
    this.style,
    this.explode,
    this.allowReserved,
    this.contentType,
  );
}

String buildQueryString(List<QueryParameterSpec> parameters) {
  final pairs = <String>[];
  for (final parameter in parameters) {
    appendSerializedParameter(pairs, parameter);
  }
  return pairs.join('&');
}

void appendSerializedParameter(List<String> pairs, QueryParameterSpec parameter) {
  final value = parameter.value;
  if (value == null) return;

  final contentType = parameter.contentType;
  if (contentType != null && contentType.trim().isNotEmpty) {
    pairs.add('${urlEncode(parameter.name)}=${encodeQueryValue(jsonEncode(value), parameter.allowReserved)}');
    return;
  }

  final style = parameter.style.trim().isEmpty ? 'form' : parameter.style;
  if (style == 'deepObject' && value is Map) {
    appendDeepObjectParameter(pairs, parameter.name, value, parameter.allowReserved);
    return;
  }
  if (value is Iterable) {
    appendArrayParameter(pairs, parameter.name, value, style, parameter.explode, parameter.allowReserved);
    return;
  }
  if (value is Map) {
    appendObjectParameter(pairs, parameter.name, value, style, parameter.explode, parameter.allowReserved);
    return;
  }
  pairs.add('${urlEncode(parameter.name)}=${encodeQueryValue(value.toString(), parameter.allowReserved)}');
}

void appendArrayParameter(
  List<String> pairs,
  String name,
  Iterable values,
  String style,
  bool explode,
  bool allowReserved,
) {
  final serialized = values.where((item) => item != null).map((item) => item.toString()).toList();
  if (serialized.isEmpty) return;
  if (style == 'form' && explode) {
    for (final item in serialized) {
      pairs.add('${urlEncode(name)}=${encodeQueryValue(item, allowReserved)}');
    }
    return;
  }
  pairs.add('${urlEncode(name)}=${encodeQueryValue(serialized.join(','), allowReserved)}');
}

void appendObjectParameter(
  List<String> pairs,
  String name,
  Map values,
  String style,
  bool explode,
  bool allowReserved,
) {
  final serialized = <String>[];
  values.forEach((key, value) {
    if (value == null) return;
    if (style == 'form' && explode) {
      pairs.add('${urlEncode(key.toString())}=${encodeQueryValue(value.toString(), allowReserved)}');
      return;
    }
    serialized.add(key.toString());
    serialized.add(value.toString());
  });
  if (serialized.isNotEmpty) {
    pairs.add('${urlEncode(name)}=${encodeQueryValue(serialized.join(','), allowReserved)}');
  }
}

void appendDeepObjectParameter(List<String> pairs, String name, Map values, bool allowReserved) {
  values.forEach((key, value) {
    if (value != null) {
      pairs.add('${urlEncode('$name[$key]')}=${encodeQueryValue(value.toString(), allowReserved)}');
    }
  });
}

String encodeQueryValue(String value, bool allowReserved) {
  var encoded = urlEncode(value);
  if (!allowReserved) return encoded;
  const replacements = <String, String>{
    '%3A': ':',
    '%2F': '/',
    '%3F': '?',
    '%23': '#',
    '%5B': '[',
    '%5D': ']',
    '%40': '@',
    '%21': '!',
    '%24': r'$',
    '%26': '&',
    '%27': "'",
    '%28': '(',
    '%29': ')',
    '%2A': '*',
    '%2B': '+',
    '%2C': ',',
    '%3B': ';',
    '%3D': '=',
  };
  replacements.forEach((escaped, reserved) {
    encoded = encoded.replaceAll(escaped, reserved);
  });
  return encoded;
}

String urlEncode(String value) => Uri.encodeQueryComponent(value);
