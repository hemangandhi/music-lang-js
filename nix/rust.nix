let
  rust_overlay = import (builtins.fetchTarball https://github.com/oxalica/rust-overlay/archive/master.tar.gz);
  nixpkgs = import <nixpkgs> { overlays = [ rust_overlay ]; };
  rust_of_choice = nixpkgs.rust-bin.stable.latest.rust.override {
    extensions = ["rust-src"];
  };
  nvim = import ./nvim.nix ( rec {
    nixPkgs = nixpkgs;
    neovim = nixpkgs.neovim;
    customPackages = with nixpkgs.vimPlugins; {
      start = [
        rust-vim
        coc-rust-analyzer
      ];
    };
  }); in
nixpkgs.stdenv.mkDerivation {
  name = "rust-env";
  buildInputs = [
    # linter
    nixpkgs.clippy
    # builder
    nixpkgs.cargo
    # compiler
    rust_of_choice
    # WASM
    nixpkgs.wasm-pack
    # nodejs -- for wasm stuffs.
    nixpkgs.nodejs
    # For bootstrapping.
    nixpkgs.cargo-generate
    # editor
    nvim
  ];
}
