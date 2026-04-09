{ ... }:
{
  perSystem = { config, lib, pkgs, system, ... }:
    let
      shared = import ../lib/shared.nix { inherit lib pkgs system; };
      src = ../..;
      standardImghdr = import ../python/standard-imghdr.nix { inherit pkgs; };
      mobi = import ../python/mobi.nix { inherit pkgs standardImghdr; };
      pythonEnv = pkgs.python312.withPackages (ps: with ps; [
        beautifulsoup4 ebooklib lxml pymupdf standardImghdr mobi
      ]);
      frontend = import ../targets/frontend.nix { inherit pkgs src; };
      unwrapped = import ../targets/desktop-unwrapped.nix {
        inherit frontend pkgs shared src;
      };
    in {
      packages.default = import ../targets/desktop-package.nix {
        inherit lib pkgs pythonEnv shared src unwrapped;
      };
      packages.bundle = config.packages.default;
      packages.frontend = frontend;
      packages.unwrapped = unwrapped;
    };
}
