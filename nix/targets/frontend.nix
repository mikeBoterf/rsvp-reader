{ pkgs, src }:
pkgs.buildNpmPackage {
  pname = "rsvp-reader-frontend";
  version = "0.1.0";
  inherit src;
  npmDepsHash = "sha256-GjzrA91fUt9hC0ajJfqlOPbNRBA77j9Gk7Vu71V+LhI=";
  installPhase = ''
    runHook preInstall
    cp -r dist $out
    runHook postInstall
  '';
}
