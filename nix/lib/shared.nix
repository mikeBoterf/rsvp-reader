{ lib, pkgs, system }:
let
  runtimeLibs = with pkgs; [
    atk cairo dbus gdk-pixbuf glib gtk3 harfbuzz
    libsoup_3 openssl pango webkitgtk_4_1 zlib stdenv.cc.cc.lib
  ];
  schemaDirs = [
    "${pkgs.gtk3}/share/gsettings-schemas/${pkgs.gtk3.name}/glib-2.0/schemas"
    "${pkgs.gsettings-desktop-schemas}/share/gsettings-schemas/${pkgs.gsettings-desktop-schemas.name}/glib-2.0/schemas"
  ];
  sidecarName = {
    x86_64-linux = "python-backend-x86_64-unknown-linux-gnu";
    aarch64-linux = "python-backend-aarch64-unknown-linux-gnu";
  }.${system};
  libPath = lib.makeLibraryPath runtimeLibs;
in {
  inherit runtimeLibs schemaDirs sidecarName libPath;
  devInputs = with pkgs; [
    bash clang cargo coreutils glib nodejs_22 onefetch
    pkg-config python311 rustc stdenv.cc
  ];
  pkgConfigPath = lib.makeSearchPathOutput "dev" "lib/pkgconfig" runtimeLibs;
  xdgDataDirs = lib.makeSearchPath "share" [ pkgs.gtk3 pkgs.gsettings-desktop-schemas ];
  commonEnv = ''
    export LIBRARY_PATH="${libPath}:''${LIBRARY_PATH:-}"
    export LD_LIBRARY_PATH="$LIBRARY_PATH"
    export PKG_CONFIG_PATH="${lib.makeSearchPathOutput "dev" "lib/pkgconfig" runtimeLibs}:''${PKG_CONFIG_PATH:-}"
    export XDG_DATA_DIRS="${lib.makeSearchPath "share" [ pkgs.gtk3 pkgs.gsettings-desktop-schemas ]}:''${XDG_DATA_DIRS:-}"
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
