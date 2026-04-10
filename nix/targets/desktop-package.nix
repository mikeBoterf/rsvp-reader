{
  lib,
  pkgs,
  pythonEnv,
  shared,
  src,
  unwrapped,
}:
pkgs.symlinkJoin {
  name = "rsvp-reader";
  paths = [ unwrapped ];
  nativeBuildInputs = [
    pkgs.makeWrapper
    pkgs.glib
  ];
  postBuild = ''
        mkdir -p $out/libexec/rsvp-reader $out/share/glib-2.0/schemas $out/share/rsvp-reader
        cp -r ${src}/backend $out/share/rsvp-reader/backend
        mv $out/bin/tauri-app $out/libexec/rsvp-reader/tauri-app
        cat > $out/libexec/rsvp-reader/backend <<EOF
    #!/usr/bin/env bash
    set -euo pipefail
    exec ${pythonEnv}/bin/python $out/share/rsvp-reader/backend/main.py "\$@"
    EOF
        chmod +x $out/libexec/rsvp-reader/backend
        ln -sf ${builtins.elemAt shared.schemaDirs 0}/*.xml $out/share/glib-2.0/schemas/ 2>/dev/null || true
        ln -sf ${builtins.elemAt shared.schemaDirs 1}/*.xml $out/share/glib-2.0/schemas/ 2>/dev/null || true
        ${pkgs.glib.dev}/bin/glib-compile-schemas $out/share/glib-2.0/schemas
        makeWrapper $out/libexec/rsvp-reader/tauri-app $out/bin/rsvp-reader \
          --set RSVP_READER_BACKEND $out/libexec/rsvp-reader/backend \
          --set GSETTINGS_SCHEMA_DIR $out/share/glib-2.0/schemas \
          --set WEBKIT_DISABLE_DMABUF_RENDERER 1 \
          --set LIBGL_ALWAYS_SOFTWARE 1 \
          --prefix XDG_DATA_DIRS : ${shared.xdgDataDirs} \
          --prefix LD_LIBRARY_PATH : ${shared.libPath}
  '';
}
