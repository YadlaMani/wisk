use axum::{extract::{DefaultBodyLimit, State}, http::StatusCode, routing::post, serve, Json, Router};
use serde::{Deserialize, Serialize};
use sp1_sdk::{
    blocking::{ProveRequest, Prover, ProverClient},
    include_elf, Elf, HashableKey, ProvingKey, SP1ProofWithPublicValues, SP1Stdin,
};
use std::{net::SocketAddr, sync::Arc};
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use zkpdf_lib::types::PDFCircuitInput;

pub const ZKPDF_ELF: Elf = include_elf!("zkpdf-program");

type Client = sp1_sdk::blocking::EnvProver;
type Pk = <Client as Prover>::ProvingKey;

struct AppState {
    client: Client,
    pk: Pk,
}

#[derive(Deserialize)]
struct ProofRequest {
    pdf_bytes: Vec<u8>,
    page_number: u8,
    sub_string: String,
    offset: Option<usize>,
}

/// The SP1 proof plus the hex-encoded values needed to verify it on-chain.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProveResponse {
    #[serde(flatten)]
    proof: SP1ProofWithPublicValues,
    public_values: String,
    proof_bytes: String,
    vkey: String,
}

#[derive(Serialize)]
struct VerifyResponse {
    valid: bool,
    error: Option<String>,
}

type ApiError = (StatusCode, String);

async fn prove(
    State(state): State<Arc<AppState>>,
    Json(body): Json<ProofRequest>,
) -> Result<Json<ProveResponse>, ApiError> {
    let ProofRequest {
        pdf_bytes,
        page_number,
        sub_string,
        offset,
    } = body;

    let offset = u32::try_from(offset.unwrap_or(0))
        .map_err(|_| (StatusCode::BAD_REQUEST, "offset does not fit in u32".to_string()))?;

    let mut stdin = SP1Stdin::new();
    stdin.write(&PDFCircuitInput {
        pdf_bytes,
        page_number,
        offset,
        substring: sub_string,
    });

    let proof = tokio::task::spawn_blocking(move || {
        state.client.prove(&state.pk, stdin).groth16().run().map(|proof| {
            let vkey = state.pk.verifying_key().bytes32();
            (proof, vkey)
        })
    })
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let (proof, vkey) =
        proof.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("failed to generate proof: {e}")))?;

    Ok(Json(ProveResponse {
        public_values: format!("0x{}", hex::encode(proof.public_values.as_slice())),
        proof_bytes: format!("0x{}", hex::encode(proof.bytes())),
        vkey,
        proof,
    }))
}

async fn verify(
    State(state): State<Arc<AppState>>,
    Json(proof): Json<SP1ProofWithPublicValues>,
) -> Json<VerifyResponse> {
    let result = tokio::task::spawn_blocking(move || {
        state.client.verify(&proof, state.pk.verifying_key(), None)
    })
    .await;

    match result {
        Ok(Ok(())) => Json(VerifyResponse {
            valid: true,
            error: None,
        }),
        Ok(Err(e)) => Json(VerifyResponse {
            valid: false,
            error: Some(format!("Verification failed: {}", e)),
        }),
        Err(e) => Json(VerifyResponse {
            valid: false,
            error: Some(e.to_string()),
        }),
    }
}

#[tokio::main]
async fn main() {
    sp1_sdk::utils::setup_logger();
    dotenv::dotenv().ok();

    let prover = std::env::var("SP1_PROVER").unwrap_or_default();
    let key = std::env::var("NETWORK_PRIVATE_KEY").unwrap_or_default();

    assert_eq!(prover, "network", "SP1_PROVER must be set to 'network'");
    assert!(
        key.starts_with("0x") && key.len() > 10,
        "Invalid or missing NETWORK_PRIVATE_KEY"
    );

    let state = tokio::task::spawn_blocking(|| {
        let client = ProverClient::from_env();
        let pk = client.setup(ZKPDF_ELF).expect("failed to setup elf");
        tracing::info!("program vkey: {}", pk.verifying_key().bytes32());
        Arc::new(AppState { client, pk })
    })
    .await
    .expect("failed to initialise prover");

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/prove", post(prove))
        .route("/verify", post(verify))
        .layer(DefaultBodyLimit::max(64 * 1024 * 1024))
        .layer(cors)
        .with_state(state);

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(3001);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("listening on {}", addr);

    let listener = TcpListener::bind(addr).await.unwrap();
    serve(listener, app.into_make_service()).await.unwrap();
}
