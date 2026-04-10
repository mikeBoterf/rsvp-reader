{ ... }:
{
  perSystem =
    {
      config,
      lib,
      pkgs,
      system,
      ...
    }:
    let
      shared = import ../lib/shared.nix { inherit lib pkgs system; };
      mkApp = name: text: {
        type = "app";
        program = "${
          (pkgs.writeShellApplication {
            inherit name text;
            runtimeInputs = shared.shellInputs;
          })
        }/bin/${name}";
      };
    in
    {
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
        ${shared.compileSchemas "$repo_root"}
        ${shared.ensureVenv}
        ${shared.ensureSidecar}
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
      apps.info = mkApp "rsvp-reader-info" ''
        if [ -t 1 ]; then onefetch || true; fi
        cat <<'EOF'
        Commands:
          nix build             # build the native app
          nix run               # run the native app
          nix run .#dev-desktop # Tauri desktop dev
          nix run .#dev-web     # Vite web dev
          nix fmt               # format the repo with treefmt
          npm run format        # alias for treefmt
          npm test              # project tests, if added
        EOF
      '';
    };
}
