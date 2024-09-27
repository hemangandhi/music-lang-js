{
  nixPkgs,
  neovim,
  customPackages,
  extraRC ? "",
}:

neovim.override {
  configure = {
    customRC = ''
filetype plugin indent on

set autoindent
set backspace=indent,eol,start
set complete-=i
set showmatch
set showmode
set smarttab

set laststatus=2
set ruler
set showcmd
set wildmenu

set autoread

set encoding=utf-8
set tabstop=4 shiftwidth=4 expandtab
set listchars=tab:▒░,trail:▓
set list

set number
set hlsearch
set ignorecase
set smartcase

set number

set hidden

set fileformats=unix,dos,mac
set directory=$HOME/.config/nvim/swapfiles//

let &undodir="/home/heman/.config/nvim/undodir/"
set undofile

set completeopt=menuone,longest,preview

set wildignore+=*/.git/*,*/.hg/*,*/.svn/*

nnoremap <C-h> <C-w><C-h>
nnoremap <C-j> <C-w><C-j>
nnoremap <C-k> <C-w><C-k>
nnoremap <C-l> <C-w><C-l>
hi! CocErrorSign guibg=#0d0957

${extraRC}
        '';

    packages.myPlugins = with nixPkgs.vimPlugins; {
      start = [
        coc-nvim
        coc-git
        vim-lsp
        vim-nix
        nvim-treesitter
      ] ++ customPackages.start;
    };
  };
}
