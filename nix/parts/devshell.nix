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
      mkNakedShell =
        {
          name ? "dev-shell",
          packages ? [ ],
          env ? { },
          shellHook ? "",
        }:
        let
          bash = pkgs.bashInteractive;
          path = lib.makeBinPath packages;
          envHook = lib.concatStringsSep "\n" (
            lib.mapAttrsToList (k: v: "export ${k}=${lib.escapeShellArg v}") env
          );
          hook = ''
            export PATH="${path}:$PATH"
            ${envHook}
            ${shellHook}
          '';
        in
        pkgs.runCommandLocal name
          {
            shellHook = hook;
            passthru = {
              inherit shellHook;
              stdenv = pkgs.writeTextFile {
                name = "fake-stdenv";
                destination = "/setup";
                text = "";
                passthru.shell = "${bash}/bin/bash";
              };
            };
          }
          ''
            mkdir -p $out
          '';
    in
    {
      devShells.default = mkNakedShell {
        name = "rsvp-reader-dev";
        packages = shared.shellInputs;
        env = {
          LIBRARY_PATH = shared.libPath;
          LD_LIBRARY_PATH = shared.libPath;
          PKG_CONFIG_PATH = shared.pkgConfigPath;
          XDG_DATA_DIRS = "${shared.xdgDataDirs}:${builtins.getEnv "XDG_DATA_DIRS"}";
        };
        shellHook = ''
          pre-commit install --install-hooks > /dev/null 2>&1
          nix run .#info
        '';
      };
    };
}
