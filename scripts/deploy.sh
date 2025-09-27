#!/bin/bash

# Unified deployment script for ZKPDF (Next.js only)
# Usage: ./deploy.sh [app|all]
# Default: all

set -e  # Exit on any error

# Default to deploy all
DEPLOY_TARGET="${1:-all}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to build WASM module
build_wasm() {
    print_status "Building WASM module..."
    cd pdf-utils/wasm
    
    if [ ! -f "generate_wasm.sh" ]; then
        print_error "generate_wasm.sh not found in pdf-utils/wasm/"
        exit 1
    fi
    
    chmod +x generate_wasm.sh
    ./generate_wasm.sh
    
    # Copy WASM files to app public directory
    print_status "Copying WASM files to app..."
    mkdir -p ../../app/public/pkg
    cp pkg/* ../../app/public/pkg/
    
    cd ../..
    print_success "WASM module built and copied successfully!"
}

# Function to build Next.js app
build_app() {
    print_status "Building Next.js application..."

    # Check if we're in the right directory
    if [ ! -f "app/package.json" ]; then
        print_error "app/package.json not found. Are you in the project root?"
        exit 1
    fi

    cd app

    # Check if yarn is available
    if ! command_exists yarn; then
        print_error "yarn is not installed. Please install it first."
        exit 1
    fi

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        yarn install
    fi

    # Build Next.js (not export)
    yarn build

    # Check if build was successful
    if [ -d ".next" ]; then
        print_success "Next.js app build successful! Build output is in app/.next/"
    else
        print_error "App build failed! No '.next' directory found."
        exit 1
    fi

    cd ..
}

# Main deployment logic
main() {
    print_status "🚀 Starting ZKPDF deployment (target: $DEPLOY_TARGET)..."
    
    case $DEPLOY_TARGET in
        "app"|"all")
            build_wasm
            build_app
            print_success "🎉 App deployment ready!"
            echo ""
            echo "📁 App files: app/.next/ (for Vercel/Node deployment)"
            echo "🌐 App URL: https://privacy-ethereum.github.io/zkpdf/ (if using static export)"
            ;;
        *)
            print_error "Invalid deployment target: $DEPLOY_TARGET"
            echo ""
            echo "Usage: $0 [app|all]"
            echo "  app  - Deploy only the web application"
            echo "  all  - Deploy app (default)"
            exit 1
            ;;
    esac
    
    echo ""
    echo "📝 Next steps:"
    echo "   - For local: cd app && yarn start"
    echo "   - For Vercel: push to main/dev branch"
    echo "   - For Docker/Node: run 'next start' with proper server setup"
}

# Run main function
main "$@"
