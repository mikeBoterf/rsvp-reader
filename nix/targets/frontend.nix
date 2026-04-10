{ pkgs, src }:
pkgs.buildNpmPackage {
  pname = "rsvp-reader-frontend";
  version = "0.1.0";
  inherit src;
  npmDepsHash = "sha256-/Cwzch7jfMQ4ACXbE0lWt+g/dAdBq5OPWPd09YC+A3E=";
  installPhase = ''
    runHook preInstall
    cp -r dist $out
    runHook postInstall
  '';
}
