# Segurança de Upload de Arquivos - UploadThing

## 🔒 Medidas de Segurança Implementadas

### 1. **Autenticação e Autorização**
- ✅ **Middleware de autenticação**: Todos os uploads exigem sessão válida
- ✅ **Controle de acesso por role**: 
  - Escalas: apenas ADMIN e LEADER
  - Mensagens: todos os usuários autenticados
  - Avatares: apenas o próprio usuário
- ✅ **Verificação de sessão JWT**: Usando next-auth

### 2. **Validação de Tipo de Arquivo**
- ✅ **Whitelist de MIME types**: Lista restrita de tipos permitidos por endpoint
- ✅ **Validação dupla**: Cliente + servidor
- ✅ **Extensões permitidas**:
  - Escalas: PDF, JPG, PNG, WebP
  - Mensagens: PDF, JPG, PNG, WebP, DOC, DOCX
  - Avatares: JPG, PNG, WebP apenas

### 3. **Controle de Tamanho**
- ✅ **Limites por tipo**:
  - Escalas: máximo 16MB
  - Mensagens: máximo 8MB
  - Avatares: máximo 2MB
- ✅ **Validação em dois níveis**: UploadThing SDK + middleware customizado

### 4. **Sanitização de Nome de Arquivo**
- ✅ **Remoção de caracteres perigosos**: Mantém apenas alfanuméricos, hífens e underscores
- ✅ **Normalização de acentos**: Remove caracteres especiais unicode
- ✅ **Limite de comprimento**: Máximo 100 caracteres
- ✅ **Conversão para lowercase**: Extensões padronizadas

### 5. **Proteção contra Malware**
- ✅ **UploadThing nativo**: Scanning automático de malware
- ✅ **Isolamento de arquivos**: Hospedagem separada (CDN do UploadThing)
- ✅ **Validação de conteúdo**: Magic bytes verificados pelo UploadThing

### 6. **Protocolo Seguro**
- ✅ **HTTPS obrigatório**: Todos os uploads via TLS
- ✅ **Tokens de acesso**: Chaves API seguras (variáveis de ambiente)
- ✅ **CORS configurado**: Apenas domínios autorizados

### 7. **Controle de Acesso aos Arquivos**
- ✅ **URLs assinadas**: UploadThing gera URLs com assinatura
- ✅ **Rastreamento de uploads**: `uploadedBy` registra quem fez upload
- ✅ **Auditoria**: Logs de todas as operações

### 8. **Prevenção de Ataques**
- ✅ **Rate limiting**: Limitado pelo UploadThing
- ✅ **Prevenção de path traversal**: Nomes sanitizados
- ✅ **Proteção contra injeção**: Validação rigorosa de entrada
- ✅ **Proteção XSS**: Content-Type correto definido

## 📋 Estrutura de Arquivos

```
src/
├── app/
│   └── api/
│       └── uploadthing/
│           ├── core.ts          # Lógica de upload e validações
│           └── route.ts         # Rotas HTTP do UploadThing
├── components/
│   └── SecureFileUploader.tsx   # Componente React com validações
└── lib/
    └── uploadthing.ts           # Helpers e hooks customizados
```

## 🛡️ Fluxo de Segurança

1. **Cliente seleciona arquivo**
   - Validação de tipo no navegador
   - Validação de tamanho no navegador

2. **Middleware processa requisição**
   - Verifica autenticação (JWT)
   - Verifica autorização (role)
   - Valida MIME type
   - Valida tamanho do arquivo
   - Sanitiza nome do arquivo

3. **UploadThing processa**
   - Scan de malware
   - Validação de magic bytes
   - Compressão e otimização
   - Upload para CDN seguro

4. **onUploadComplete**
   - Salva referência no banco
   - Registra metadados
   - Retorna URL assinada

## 🔑 Variáveis de Ambiente Necessárias

```env
UPLOADTHING_APP_ID=seu_app_id
UPLOADTHING_SECRET=sua_secret_key
UPLOADTHING_TOKEN=seu_token
```

## 📊 Limites e Quotas

| Tipo | Tamanho Máx | Quantidade | Tipos Permitidos |
|------|-------------|------------|------------------|
| Escalas | 16MB | 1 | PDF, JPG, PNG, WebP |
| Mensagens | 8MB | 1 | PDF, JPG, PNG, WebP, DOC, DOCX |
| Avatares | 2MB | 1 | JPG, PNG, WebP |

## 🚀 Como Usar

### Em Escalas
```tsx
import SecureFileUploader from '@/components/SecureFileUploader';

<SecureFileUploader
  endpoint="scheduleFileUploader"
  acceptedTypes=".pdf,.jpg,.jpeg,.png,.webp"
  onUploadComplete={(res) => {
    // res.fileUrl - URL do arquivo
    // res.fileKey - Chave única
    // res.fileId - ID no banco
  }}
/>
```

### Em Mensagens
```tsx
<SecureFileUploader
  endpoint="messageFileUploader"
  acceptedTypes=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
  onUploadComplete={(res) => {
    // Anexar à mensagem
  }}
/>
```

### Para Avatares
```tsx
<SecureFileUploader
  endpoint="avatarUploader"
  acceptedTypes=".jpg,.jpeg,.png,.webp"
  onUploadComplete={(res) => {
    // Atualizar avatar do usuário
  }}
/>
```

## ⚠️ Avisos Importantes

1. **Nunca armazene chaves de API no código**: Use apenas variáveis de ambiente
2. **Valide sempre no servidor**: Validações do cliente são facilmente contornáveis
3. **Monitore uso**: UploadThing tem limites de quota
4. **Revise logs regularmente**: Detecte padrões suspeitos de upload

## 🔄 Migração do Sistema Antigo

Para migrar do sistema de upload legado:

1. Execute a migração do Prisma para adicionar campos do UploadThing:
```bash
npx prisma migrate dev --name add_uploadthing_fields
```

2. Substitua componentes de upload antigos por `SecureFileUploader`

3. Atualize rotas de API para usar UploadThing URLs quando disponíveis

## 📞 Suporte

Em caso de problemas:
1. Verifique logs do console do navegador
2. Verifique logs do servidor (`console.error`)
3. Consulte documentação do UploadThing: https://docs.uploadthing.com
