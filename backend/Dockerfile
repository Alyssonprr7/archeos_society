# Estágio 1: Build e Instalação de dependências
FROM python:3.11-slim as builder

WORKDIR /app
COPY requirements.txt .
# Instalando dependências no diretório de usuário para facilitar a cópia
RUN pip install --user --no-cache-dir -r requirements.txt

# Estágio 2: Imagem Final de Execução
FROM python:3.11-slim

WORKDIR /app
# Copiando apenas as dependências instaladas do estágio anterior
COPY --from=builder /root/.local /root/.local
COPY ./app ./app

# Garantindo que o Python encontre os pacotes instalados
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

EXPOSE 8000

# Comando para rodar o FastAPI com suporte a WebSockets (essencial para as Cartas de Macaco)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]