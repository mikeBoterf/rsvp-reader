{
  lib,
  pkgs,
  system,
}:
let
  buildTools = with pkgs; [
    cargo
    clang
    coreutils
    python312Packages.black
    glib
    nodejs_22
    nixfmt
    onefetch
    pkg-config
    prettier
    python312
    rust-analyzer
    rustc
    rustfmt
    stdenv.cc
    treefmt
  ];
  runtimeLibs = with pkgs; [
    atk
    cairo
    dbus
    gdk-pixbuf
    glib
    gtk3
    harfbuzz
    libsoup_3
    openssl
    pango
    webkitgtk_4_1
    zlib
    stdenv.cc.cc.lib
  ];
  schemaDirs = [
    "${pkgs.gtk3}/share/gsettings-schemas/${pkgs.gtk3.name}/glib-2.0/schemas"
    "${pkgs.gsettings-desktop-schemas}/share/gsettings-schemas/${pkgs.gsettings-desktop-schemas.name}/glib-2.0/schemas"
  ];
  sidecarName =
    {
      x86_64-linux = "python-backend-x86_64-unknown-linux-gnu";
      aarch64-linux = "python-backend-aarch64-unknown-linux-gnu";
    }
    .${system};
  libPath = lib.makeLibraryPath runtimeLibs;
  pkgConfigPath = lib.makeSearchPathOutput "dev" "lib/pkgconfig" runtimeLibs;
  xdgDataDirs = lib.makeSearchPath "share" [
    pkgs.gtk3
    pkgs.gsettings-desktop-schemas
  ];
in
{
  inherit
    buildTools
    libPath
    pkgConfigPath
    runtimeLibs
    schemaDirs
    sidecarName
    xdgDataDirs
    ;
  shellInputs = buildTools ++ runtimeLibs;
  commonEnv = ''
    export LIBRARY_PATH="${libPath}:''${LIBRARY_PATH:-}"
    export LD_LIBRARY_PATH="$LIBRARY_PATH"
    export PKG_CONFIG_PATH="${pkgConfigPath}:''${PKG_CONFIG_PATH:-}"
    export XDG_DATA_DIRS="${xdgDataDirs}:''${XDG_DATA_DIRS:-}"
  '';
  devEnv = ''
    export GDK_BACKEND=x11
    export WINIT_UNIX_BACKEND=x11
    export XDG_SESSION_TYPE=x11
    export WEBKIT_DISABLE_DMABUF_RENDERER=1
    export LIBGL_ALWAYS_SOFTWARE=1
    unset WAYLAND_DISPLAY
  '';
  ensureRepo = ''
    repo_root="$PWD"
    test -f "$repo_root/flake.nix" && test -f "$repo_root/package.json"
  '';
  installNode = ''
    if [ ! -d "$repo_root/node_modules" ]; then npm install --prefix "$repo_root"; fi
  '';
  ensureVenv = ''
    if [ ! -x "$repo_root/backend/.nix-venv/bin/python" ]; then
      python3 -m venv "$repo_root/backend/.nix-venv"
    fi
    if [ ! -f "$repo_root/backend/.nix-venv/.requirements-installed" ] || [ "$repo_root/backend/requirements.txt" -nt "$repo_root/backend/.nix-venv/.requirements-installed" ]; then
      "$repo_root/backend/.nix-venv/bin/pip" install -r "$repo_root/backend/requirements.txt"
      touch "$repo_root/backend/.nix-venv/.requirements-installed"
    fi
  '';
  ensureSidecar = ''
        mkdir -p "$repo_root/src-tauri/binaries"
        cat > "$repo_root/src-tauri/binaries/${sidecarName}" <<EOF
    #!/usr/bin/env bash
    set -euo pipefail
    exec "$repo_root/backend/.nix-venv/bin/python" "$repo_root/backend/main.py" "\$@"
    EOF
        chmod +x "$repo_root/src-tauri/binaries/${sidecarName}"
  '';
  compileSchemas = root: ''
    schema_dir="${root}/.nix-gsettings-schemas"
    rm -rf "$schema_dir"
    mkdir -p "$schema_dir"
    ln -sf ${builtins.elemAt schemaDirs 0}/*.xml "$schema_dir"/ 2>/dev/null || true
    ln -sf ${builtins.elemAt schemaDirs 1}/*.xml "$schema_dir"/ 2>/dev/null || true
    ${pkgs.glib.dev}/bin/glib-compile-schemas "$schema_dir"
    export GSETTINGS_SCHEMA_DIR="$schema_dir"
  '';
}
