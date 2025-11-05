#!/bin/bash
# Deployment script for AI Agent System
# Supports deployment to Cloud Run and local testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check required environment variables
check_env() {
    if [ -z "$PROJECT_ID" ]; then
        log_error "PROJECT_ID is not set"
        echo "Please set PROJECT_ID: export PROJECT_ID=your-project-id"
        exit 1
    fi

    log_info "Using PROJECT_ID: $PROJECT_ID"
}

# Build Docker image locally
build_local() {
    log_info "Building Docker image locally..."

    docker build \
        -t ai-agent-system:latest \
        -f deploy/Dockerfile \
        .

    log_info "Build complete: ai-agent-system:latest"
}

# Run tests
run_tests() {
    log_info "Running tests..."

    pytest tests/ -v --cov --cov-report=term

    log_info "Tests passed!"
}

# Deploy to Cloud Run using Cloud Build
deploy_cloud_run() {
    check_env

    log_info "Deploying to Cloud Run using Cloud Build..."

    gcloud builds submit \
        --config=deploy/cloudbuild.yaml \
        --project=$PROJECT_ID

    log_info "Deployment complete!"
    log_info "Service URL: https://ai-agent-system-$(gcloud config get-value project).run.app"
}

# Deploy directly to Cloud Run (without Cloud Build)
deploy_cloud_run_direct() {
    check_env

    log_info "Building and deploying directly to Cloud Run..."

    # Build and push image
    gcloud builds submit \
        --tag gcr.io/$PROJECT_ID/ai-agent-system:latest \
        --project=$PROJECT_ID

    # Deploy to Cloud Run
    gcloud run deploy ai-agent-system \
        --image gcr.io/$PROJECT_ID/ai-agent-system:latest \
        --region us-central1 \
        --platform managed \
        --allow-unauthenticated \
        --memory 4Gi \
        --cpu 2 \
        --max-instances 10 \
        --min-instances 0 \
        --timeout 300 \
        --set-env-vars PROJECT_ID=$PROJECT_ID,LOCATION=us-central1 \
        --project=$PROJECT_ID

    log_info "Deployment complete!"
}

# Run locally with Docker
run_local() {
    log_info "Running locally with Docker..."

    # Build if needed
    if ! docker images | grep -q "ai-agent-system"; then
        build_local
    fi

    # Run container
    docker run -it --rm \
        -p 8080:8080 \
        -e PROJECT_ID=${PROJECT_ID:-"your-project-id"} \
        -e LOCATION=${LOCATION:-"us-central1"} \
        ai-agent-system:latest
}

# Show usage
usage() {
    cat << EOF
AI Agent System Deployment Script

Usage: $0 [command]

Commands:
    build              Build Docker image locally
    test               Run tests
    deploy             Deploy to Cloud Run using Cloud Build
    deploy-direct      Deploy directly to Cloud Run
    run-local          Run locally with Docker
    help               Show this help message

Environment Variables:
    PROJECT_ID         Google Cloud Project ID (required)
    LOCATION           Google Cloud region (default: us-central1)

Examples:
    export PROJECT_ID=my-project
    $0 test
    $0 build
    $0 deploy
EOF
}

# Main
main() {
    case "${1:-}" in
        build)
            build_local
            ;;
        test)
            run_tests
            ;;
        deploy)
            deploy_cloud_run
            ;;
        deploy-direct)
            deploy_cloud_run_direct
            ;;
        run-local)
            run_local
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            log_error "Unknown command: ${1:-}"
            echo
            usage
            exit 1
            ;;
    esac
}

main "$@"
