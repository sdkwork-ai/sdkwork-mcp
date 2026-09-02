use sdkwork_api_mcp_standalone_gateway::serve_router;
use sdkwork_web_bootstrap::{ApiModuleRegistry, infra_public_path_prefixes};
use sdkwork_iam_web_adapter::{
    build_web_framework_builder, iam_web_request_context_resolver_from_env,
};

#[tokio::main]
async fn main() {
    let listen_addr = std::env::var("SDKWORK_MCP_APPLICATION_PUBLIC_INGRESS_BIND")
        .unwrap_or_else(|_| "127.0.0.1:18092".to_string());

    let assembly = sdkwork_api_mcp_assembly::assemble_api_router()
        .await
        .expect("assemble sdkwork-mcp gateway router");
    let framework = build_web_framework_builder(
        iam_web_request_context_resolver_from_env().await,
        assembly.route_manifest.clone(),
        infra_public_path_prefixes(),
    );
    let mut module_registry = ApiModuleRegistry::new();
    module_registry.add_modules(vec![assembly]);
    let router = module_registry
        .try_compose("SDKWork MCP API")
        .expect("compose sdkwork-mcp API contribution")
        .into_hosted(framework)
        .router;
    serve_router(&listen_addr, "sdkwork-api-mcp-standalone-gateway", router).await;
}
