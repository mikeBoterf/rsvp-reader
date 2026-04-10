{ ... }:
{
  perSystem =
    { pkgs, ... }:
    {
      formatter = pkgs.writeShellApplication {
        name = "treefmt";
        runtimeInputs = [
          pkgs.nixfmt
          pkgs.prettier
          pkgs.python312Packages.black
          pkgs.rustfmt
          pkgs.treefmt
        ];
        text = ''exec treefmt "$@"'';
      };
    };
}
