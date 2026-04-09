{ pkgs, standardImghdr }:
pkgs.python312Packages.buildPythonPackage rec {
  pname = "mobi";
  version = "0.4.1";
  pyproject = true;
  src = pkgs.python312Packages.fetchPypi {
    inherit pname version;
    hash = "sha256-m4FPQs03UNIjd+gJXYSXSUO5TdgIGpChxAPGTDYCvSY=";
  };
  build-system = [ pkgs.python312Packages.hatchling ];
  dependencies = [ pkgs.python312Packages.loguru standardImghdr ];
  doCheck = false;
}
