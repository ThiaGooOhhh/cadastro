# Script para automatizar o processo de envio de atualizações para o GitHub.

# Função para imprimir mensagens coloridas
function Write-Host-Color {
    param(
        [string]$Message,
        [string]$Color
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-Host-Color "--- Iniciando script de atualização para o GitHub ---" "Cyan"

# Validação de caminho
try {
    $ProjectRoot = (Get-Item $PSScriptRoot).Parent.FullName
    Set-Location $ProjectRoot

    if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
        throw "Não foi possível encontrar 'package.json'. Certifique-se de que a pasta 'scripts' está na raiz do projeto."
    }
    Write-Host-Color "Executando a partir da raiz do projeto: $(Get-Location)" "Green"
} catch {
    Write-Host-Color "ERRO CRÍTICO: Falha ao definir o diretório do projeto. $_" "Red"
    exit 1
}

# Verificar se a CLI do GitHub está instalada
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host-Color "ERRO: A CLI do GitHub ('gh') não foi encontrada. Por favor, instale-a a partir de: https://cli.github.com/" "Red"
    exit 1
}

# Verificar autenticação
Write-Host-Color "Verificando autenticação com o GitHub..." "Yellow"
$authStatus = gh auth status -