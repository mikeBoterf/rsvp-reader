{ frontend, pkgs, shared, src }:
pkgs.rustPlatform.buildRustPackage {
  pname = "rsvp-reader-unwrapped";
  version = "0.1.0";
  inherit src;
  cargoRoot = "src-tauri";
  cargoLock.lockFile = ../../src-tauri/Cargo.lock;
  buildAndTestSubdir = "src-tauri";
  nativeBuildInputs = [ pkgs.pkg-config ];
  buildInputs = shared.runtimeLibs;
  doCheck = false;
  postPatch = ''
    cp -r ${frontend} dist
    mkdir -p src-tauri/binaries
    touch src-tauri/binaries/${shared.sidecarName}
    chmod +x src-tauri/binaries/${shared.sidecarName}
  '';
}
