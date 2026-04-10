{
  description = "Nix development environment for RSVP Reader";

  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux"
        "aarch64-linux"
      ];

      imports = [
        ./nix/parts/apps.nix
        ./nix/parts/devshell.nix
        ./nix/parts/formatter.nix
        ./nix/parts/packages.nix
      ];
    };
}
