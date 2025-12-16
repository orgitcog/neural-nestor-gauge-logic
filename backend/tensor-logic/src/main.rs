use axum::{
    response::Html,
    routing::get,
    Router,
};
use std::path::PathBuf;
use tower_http::services::ServeDir;
use tower::ServiceBuilder;
use tower_http::trace::TraceLayer;

async fn serve_index() -> Html<String> {
    let index_path = PathBuf::from("dist/index.html");
    match tokio::fs::read_to_string(&index_path).await {
        Ok(content) => Html(content),
        Err(_) => Html("<h1>Error: index.html not found</h1>".to_string()),
    }
}

#[shuttle_runtime::main]
async fn main() -> shuttle_axum::ShuttleAxum {
    // Serve static files from dist
    let static_dir = PathBuf::from("dist");
    
    // Create router with static file serving and SPA fallback
    let router = Router::new()
        // Serve static assets (JS, CSS, fonts, etc.) from /assets
        .nest_service(
            "/assets",
            ServeDir::new(static_dir.join("assets")),
        )
        // Serve index.html for all other routes (SPA routing)
        .fallback(get(serve_index))
        .layer(ServiceBuilder::new().layer(TraceLayer::new_for_http()));

    Ok(router.into())
}
