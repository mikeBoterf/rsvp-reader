{ ... }:
{
  perSystem =
    {
      lib,
      pkgs,
      system,
      ...
    }:
    let
      shared = import ../lib/shared.nix { inherit lib pkgs system; };
    in
    {
      devShells.default = pkgs.mkShell {
        packages = shared.shellInputs;
        shellHook = ''
                    ${shared.ensureRepo}
                    ${shared.commonEnv}
                    ${shared.compileSchemas "$repo_root"}
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
    };
}
