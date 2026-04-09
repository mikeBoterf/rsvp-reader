{ pkgs }:
pkgs.python312Packages.buildPythonPackage rec {
  pname = "standard-imghdr";
  version = "3.13.0";
  format = "wheel";
  src = pkgs.fetchurl {
    url = "https://files.pythonhosted.org/packages/py3/s/standard-imghdr/standard_imghdr-${version}-py3-none-any.whl";
    hash = "sha256-MKG/9UZWBbtJb4QqasPMHyExvzAlsNoo1Id9bUt8yOk=";
  };
  doCheck = false;
}
