# Preparacao para Portainer em Docker Swarm

Este material prepara somente a publicacao da aplicacao. Nao cria PostgreSQL, Redis, n8n ou Evolution API, nao executa migrations, nao altera o banco e nao inclui segredos reais.

## Estrutura identificada

- Backend/API: `api/`
- Frontend: `site/`
- API package: `api/package.json`
- API start: `npm start` -> `node src/server.js`
- Frontend package: `site/package.json`
- Frontend build: `npm run build` -> `vite build`
- O frontend usa Vite; variaveis `VITE_*` entram no build, nao no runtime do Nginx.

## Imagens de producao

O `docker-compose.prod.yml` usa somente `image:` e nao depende de `build:`. Antes de criar ou atualizar a stack no Portainer, publique as duas imagens no GitHub Container Registry. Se elas nao existirem no GHCR, o Swarm falhara com erro parecido com `No such image`.

As imagens usadas pela stack sao exatamente:

```text
ghcr.io/braltec/airesolve-api:v1.0.0
ghcr.io/braltec/airesolve-frontend:v1.0.0
```

O owner `braltec` e os nomes das imagens estao em minusculo, como exigido pelo formato de imagens Docker/GHCR.

## Publicar imagens pelo GitHub Actions

O workflow fica em `.github/workflows/docker-publish.yml` e publica no GitHub Container Registry com permissoes minimas:

```yaml
contents: read
packages: write
```

Ele publica:

- `ghcr.io/braltec/airesolve-api:v1.0.0`
- `ghcr.io/braltec/airesolve-api:latest`
- `ghcr.io/braltec/airesolve-frontend:v1.0.0`
- `ghcr.io/braltec/airesolve-frontend:latest`

Formas de executar:

1. Executar manualmente em `Actions > Publish Docker images`, usando `image_tag=v1.0.0`, `publish_latest=true` e `vite_api_url=/api`.
2. Criar e enviar uma tag Git `v1.0.0`. O workflow usa essa tag e tambem publica `latest`.

Depois que o workflow terminar com sucesso, confirme em `Packages` no GitHub que as duas imagens existem antes de rodar a stack no Portainer.

Para publicacao no mesmo dominio via Nginx desta stack, mantenha:

```env
VITE_API_URL=/api
```

Essa URL e gravada no build do frontend. Se ela mudar, gere uma nova imagem do frontend.

## Publicar imagens manualmente

Se preferir publicar fora do GitHub Actions:

```bash
docker build -f Dockerfile.api -t ghcr.io/braltec/airesolve-api:v1.0.0 .
docker build -f Dockerfile.frontend --build-arg VITE_API_URL=/api -t ghcr.io/braltec/airesolve-frontend:v1.0.0 .

docker push ghcr.io/braltec/airesolve-api:v1.0.0
docker push ghcr.io/braltec/airesolve-frontend:v1.0.0
```

Esses comandos nao executam migrations.

## Banco PostgreSQL existente

Use o nome do servico do PostgreSQL no Swarm:

```env
postgres_postgres
```

Nao use o nome completo da task/container:

```text
postgres_postgres.1.3ke8blj4snfgn3tracjkjbaue
```

Esse nome completo pertence a uma task do Swarm e pode mudar em qualquer recriacao. A `DATABASE_URL` da API deve usar o servico:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@postgres_postgres:5432/NOME_DO_BANCO
```

Se usuario ou senha tiverem caracteres especiais como `@`, `#`, `/`, `:` ou espacos, aplique URL encoding antes de colocar na `DATABASE_URL`.

## Rede

A stack usa a rede externa ja existente:

```yaml
network_swarm_public
```

O PostgreSQL existente deve estar conectado a essa rede. A stack nao publica porta de banco e nao cria servico `postgres`.

## Arquivos preparados

- `Dockerfile.api`: imagem de producao da API Node/Express.
- `Dockerfile.frontend`: build Vite e runtime Nginx unprivileged; aceita `ARG VITE_API_URL`.
- `nginx.conf`: serve o frontend, faz proxy de `/api/`, `/health` e `/health/db` para a API.
- `docker-compose.prod.yml`: stack Swarm somente com `api` e `frontend`, usando imagens GHCR versionadas.
- `.github/workflows/docker-publish.yml`: build e push das imagens para GHCR.
- `.env.example`: exemplo de variaveis sem segredos.
- `.dockerignore`: bloqueia envs, builds, logs, backups, dumps, Git e arquivos SQL.

## Variaveis no Portainer

Configure estas variaveis na stack:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://USUARIO:SENHA@postgres_postgres:5432/NOME_DO_BANCO
JWT_SECRET=troque_por_uma_chave_forte_com_mais_de_32_caracteres
CORS_ORIGIN=https://seu-dominio.com.br
```

O frontend acessa a API por `/api`, e o Nginx encaminha para `api:5000` dentro da rede `network_swarm_public`.

Se o pacote GHCR estiver privado, configure credenciais do GitHub Container Registry no Portainer antes de criar a stack.

## Criar a stack no Portainer

1. Acesse `Stacks` no ambiente Swarm.
2. Crie uma nova stack usando o arquivo `docker-compose.prod.yml`.
3. Confirme que as imagens `ghcr.io/braltec/airesolve-api:v1.0.0` e `ghcr.io/braltec/airesolve-frontend:v1.0.0` ja existem no GHCR.
4. Configure as variaveis `DATABASE_URL`, `JWT_SECRET` e `CORS_ORIGIN`.
5. Confirme que `DATABASE_URL` usa `postgres_postgres` como host.
6. Confirme que a rede externa `network_swarm_public` existe.
7. Aponte o proxy/reverse proxy externo para o servico `frontend` na porta interna `8080`.

O compose nao usa `container_name`, nao cria servicos extras, nao expoe portas diretamente com `ports` e nao cria banco.

## Validar logs

Depois que a stack existir, use o nome real da stack como prefixo dos servicos:

```bash
docker service logs -f NOME_DA_STACK_api --tail 100
docker service logs -f NOME_DA_STACK_frontend --tail 100
```

No Portainer, os mesmos logs podem ser vistos em `Services` ou na propria stack.

## Testar health checks

Pelo dominio publicado no proxy:

```bash
curl -i https://seu-dominio.com.br/health
curl -i https://seu-dominio.com.br/health/db
```

Resultados esperados:

- `/health`: resposta JSON com `status: "ok"`.
- `/health/db`: resposta JSON com `status: "ok"` e `database: "ok"` quando a API conseguir consultar o PostgreSQL.

Para validar apenas o Nginx do frontend:

```bash
curl -i https://seu-dominio.com.br/nginx-health
```

## Rollback para tag anterior

A stack esta configurada com `update_config.failure_action: rollback`. Se uma atualizacao falhar, o Swarm deve tentar voltar automaticamente.

Rollback recomendado por tag:

1. Mantenha a tag anterior publicada no GHCR, por exemplo `v0.9.9`.
2. Altere as linhas `image:` no `docker-compose.prod.yml` para a tag anterior.
3. Atualize a stack no Portainer.
4. Valide `/health`, `/health/db` e logs.

Rollback manual via CLI:

```bash
docker service rollback NOME_DA_STACK_api
docker service rollback NOME_DA_STACK_frontend
```

## Observacoes de seguranca

- Somente a API recebe `DATABASE_URL`.
- O frontend acessa a API por `/api` via Nginx.
- O banco nao e publicado na internet por esta stack.
- Segredos reais devem ficar no Portainer ou em arquivo local nao versionado.
- Nao rode migrations durante esta preparacao.
