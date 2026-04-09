{ ... }:
{
  perSystem = { config, lib, pkgs, system, ... }:
    let
      shared = import ../lib/shared.nix { inherit lib pkgs system; };
      mkApp = name: text: {
        type = "app";
        program = "${(pkgs.writeShellApplication {
          inherit name text;
          runtimeInputs = shared.devInputs ++ shared.runtimeLibs;
        })}/bin/${name}";
      };
    in {
      apps.default = {
        type = "app";
        program = "${config.packages.default}/bin/rsvp-reader";
      };
      apps.desktop = config.apps.default;
      apps.dev-desktop = mkApp "rsvp-reader-dev-desktop" ''
        set -euo pipefail
        ${shared.ensureRepo}
        ${shared.commonEnv}
        ${shared.devEnv}
        ${shared.compileSchemas ''$repo_root''}
        if [ ! -x "$repo_root/backend/.nix-venv/bin/python" ]; then python3 -m venv "$repo_root/backend/.nix-venv"; fi
        if [ ! -f "$repo_root/backend/.nix-venv/.requirements-installed" ] || [ "$repo_root/backend/requirements.txt" -nt "$repo_root/backend/.nix-venv/.requirements-installed" ]; then
          "$repo_root/backend/.nix-venv/bin/pip" install -r "$repo_root/backend/requirements.txt"
          touch "$repo_root/backend/.nix-venv/.requirements-installed"
        fi
        mkdir -p "$repo_root/src-tauri/binaries"
        cat > "$repo_root/src-tauri/binaries/${shared.sidecarName}" <<EOF
#!/usr/bin/env bash
set -euo pipefail
exec "$repo_root/backend/.nix-venv/bin/python" "$repo_root/backend/main.py" "\$@"
EOF
        chmod +x "$repo_root/src-tauri/binaries/${shared.sidecarName}"
        ${shared.installNode}
        exec npm --prefix "$repo_root" run tauri dev -- "$@"
      '';
      apps.dev-web = mkApp "rsvp-reader-dev-web" ''
        set -euo pipefail
        ${shared.ensureRepo}
        ${shared.commonEnv}
        ${shared.installNode}
        exec npm --prefix "$repo_root" run dev:vite -- --host 0.0.0.0 "$@"
      '';
    };
}
