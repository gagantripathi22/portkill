#!/usr/bin/env bash
set -e

REPO="gagantripathi22/portkill"
INSTALL_DIR="${HOME}/.local/bin"
TMP_DIR=$(mktemp -d)

# Detect OS and architecture
detect_os() {
    case "$(uname -s)" in
        Linux*)  echo "linux" ;;
        Darwin*) echo "darwin" ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        *)       echo " unsupported OS" && exit 1 ;;
    esac
}

detect_arch() {
    case "$(uname -m)" in
        x86_64|amd64)  echo "amd64" ;;
        aarch64|arm64) echo "arm64" ;;
        *)             echo " unsupported architecture" && exit 1 ;;
    esac
}

get_version() {
    local version
    # Use provided version or fetch latest tag
    if [ -n "$1" ]; then
        version="$1"
    else
        version=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
    fi
    echo "$version"
}

download() {
    local os="$1"
    local arch="$2"
    local version="$3"

    local binary_name="portkill-${os}-${arch}"
    [ "$os" = "windows" ] && binary_name="${binary_name}.exe"

    local url="https://github.com/${REPO}/releases/download/${version}/${binary_name}"

    echo "Downloading ${binary_name}..."
    curl -fSL "$url" -o "${TMP_DIR}/${binary_name}"

    echo "Verifying checksum..."
    curl -fSL "${url}.sha256" -o "${TMP_DIR}/${binary_name}.sha256"
    cd "${TMP_DIR}"
    sha256sum -c "${binary_name}.sha256"
    cd - > /dev/null

    echo "Installing to ${INSTALL_DIR}..."
    mkdir -p "${INSTALL_DIR}"
    mv "${TMP_DIR}/${binary_name}" "${INSTALL_DIR}/portkill"
    chmod +x "${INSTALL_DIR}/portkill"

    echo "Successfully installed portkill ${version} to ${INSTALL_DIR}/portkill"
}

cleanup() {
    rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

main() {
    local version=$(get_version "$1")
    local os=$(detect_os)
    local arch=$(detect_arch)

    echo "Installing portkill ${version} for ${os}/${arch}"

    download "$os" "$arch" "$version"

    echo ""
    echo "Add ${INSTALL_DIR} to your PATH if not already added."
    echo "  export PATH=\"\${HOME}/.local/bin:\${PATH}\""
    echo ""
    echo "Then run: portkill --help"
}

main "$@"
