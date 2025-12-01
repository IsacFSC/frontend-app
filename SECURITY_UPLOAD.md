# Segurança de Upload de Arquivos

## 🔒 Medidas de Segurança Implementadas

### 1. **Autenticação e Autorização**
- ✅ **Middleware de autenticação**: Todos os uploads exigem sessão válida
- ✅ **Controle de acesso por role**: 
  - Escalas (UploadThing): apenas ADMIN e LEADER
  - Mensagens: todos os usuários autenticados
  - Avatares (UploadThing): apenas o próprio usuário
- ✅ **Verificação de sessão JWT**: Usando next-auth

### 2. **Validação de Tipo de Arquivo**
- ✅ **Whitelist de MIME types**: Lista restrita de tipos permitidos por endpoint
- ✅ **Validação tripla**: Cliente (input accept) + Cliente (onChange) + Servidor (API)
- ✅ **Extensões permitidas**:
  - **Escalas: APENAS PDF** (validação rigorosa em múltiplas camadas)
  - **Mensagens: APENAS PDF** (validação rigorosa em 3 camadas)
  - Avatares: JPG, PNG, WebP apenas
- ✅ **Verificação de extensão**: Validação adicional do nome do arquivo
- ✅ **Rejeição imediata**: Arquivos não-PDF são bloqueados antes do envio

### 3. **Controle de Tamanho**
- ✅ **Limites por tipo**:
  - **Escalas: máximo 8MB** (apenas PDF - validação cliente + servidor)
  - **Mensagens: máximo 8MB** (apenas PDF - validação cliente + servidor)
  - Avatares: máximo 2MB (UploadThing)
- ✅ **Validação em múltiplos níveis**: Cliente + Servidor
- ✅ **Tamanho mínimo**: 100 bytes (evita arquivos vazios/corrompidos)

### 4. **Sanitização de Nome de Arquivo**
- ✅ **Remoção de caracteres perigosos**: `<>:"|?*\x00-\x1f`, `..`, `\`, `/`
- ✅ **Substituição por underscore**: Caracteres proibidos substituídos
- ✅ **Limite de comprimento**: Máximo 255 caracteres
- ✅ **Validação de caracteres no servidor**: Regex para detectar padrões maliciosos

### 5. **Proteção contra Malware**
- ✅ **UploadThing nativo**: Scanning automático de malware (endpoints UploadThing)
- ✅ **Validação de MIME type**: Rejeita tipos executáveis
- ✅ **Validação de extensão**: Cross-check entre MIME e extensão
- ✅ **Isolamento de arquivos**: Hospedagem separada (CDN do UploadThing para escalas/avatares)

### 6. **Protocolo Seguro**
- ✅ **HTTPS obrigatório**: Todos os uploads via TLS
- ✅ **Tokens de acesso**: Chaves API seguras (variáveis de ambiente para UploadThing)
- ✅ **CORS configurado**: Apenas domínios autorizados

### 7. **Controle de Acesso aos Arquivos**
- ✅ **URLs assinadas**: UploadThing gera URLs com assinatura
- ✅ **Rastreamento de uploads**: `uploadedBy` registra quem fez upload
- ✅ **Auditoria**: Logs de todas as operações
- ✅ **Download controlado**: Endpoints de download com autenticação

### 8. **Prevenção de Ataques**
- ✅ **Rate limiting**: Limitado pelo UploadThing
- ✅ **Prevenção de path traversal**: Nomes sanitizados, caracteres `..`, `/`, `\` removidos
- ✅ **Proteção contra injeção**: Validação rigorosa de entrada
- ✅ **Proteção XSS**: Content-Type correto definido
- ✅ **Validação de tamanho mínimo**: Previne arquivos malformados

## 📋 Estrutura de Arquivos

### Sistema UploadThing (Escalas e Avatares)
```
src/
├── app/
│   └── api/
│       └── uploadthing/
│           ├── core.ts          # Lógica de upload e validações
│           └── route.ts         # Rotas HTTP do UploadThing
├── components/
│   ├── SecureFileUploader.tsx   # Componente React com validações
│   └── ScheduleFileManagement.tsx  # Usa SecureFileUploader
└── lib/
    └── uploadthing.ts           # Helpers e hooks customizados
```

### Sistema de Mensagens (Validação Rigorosa PDF-only)
```
src/
├── app/
│   └── api/
│       └── messaging/
│           └── conversations/
│               └── [id]/
│                   └── messages/
│                       └── upload/
│                           └── route.ts  # Validação rigorosa PDF-only
└── components/
    └── MessagingClient.tsx       # Validação tripla no cliente
```

## 🛡️ Fluxo de Segurança - Mensagens (PDF-only)

### Camada 1: Input HTML
```tsx
<input 
  type="file" 
  accept=".pdf,application/pdf"  // Filtra visualmente no seletor
/>
```

### Camada 2: Validação onChange (Cliente)
```tsx
onChange={(e) => {
  const file = e.target.files[0];
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    toast.error('Apenas arquivos PDF são permitidos.');
    return; // BLOQUEIO 1
  }
  if (file.size > 8 * 1024 * 1024) {
    toast.error('Arquivo muito grande. Tamanho máximo: 8MB.');
    return; // BLOQUEIO 2
  }
}}
```

### Camada 3: Validação handleSendMessage (Cliente)
```tsx
if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
  toast.error('Apenas arquivos PDF são permitidos.');
  return; // BLOQUEIO 3
}
if (selectedFile.size > 8 * 1024 * 1024) {
  toast.error('Arquivo muito grande. Máximo: 8MB.');
  return; // BLOQUEIO 4
}
```

### Camada 4: Validação Servidor (API)
```typescript
// 1. Validação MIME type
if (file.type !== 'application/pdf') {
  return NextResponse.json({ error: 'Tipo não permitido. Apenas PDF.' }, { status: 400 });
}

// 2. Validação extensão
if (!file.name.toLowerCase().endsWith('.pdf')) {
  return NextResponse.json({ error: 'Extensão inválida. Apenas .pdf.' }, { status: 400 });
}

// 3. Validação tamanho máximo
if (file.size > 8 * 1024 * 1024) {
  return NextResponse.json({ error: 'Arquivo muito grande. Máximo: 8MB.' }, { status: 400 });
}

// 4. Validação tamanho mínimo
if (file.size < 100) {
  return NextResponse.json({ error: 'Arquivo muito pequeno ou corrompido.' }, { status: 400 });
}

// 5. Validação comprimento nome
if (file.name.length > 255) {
  return NextResponse.json({ error: 'Nome do arquivo muito longo.' }, { status: 400 });
}

// 6. Validação caracteres perigosos
const dangerousChars = /[<>:"|?*\x00-\x1f]/g;
if (dangerousChars.test(file.name)) {
  return NextResponse.json({ error: 'Nome contém caracteres inválidos.' }, { status: 400 });
}

// 7. Sanitização do nome
const sanitizedFileName = file.name
  .replace(/[<>:"|?*\x00-\x1f]/g, '_')
  .replace(/\.\./g, '_')
  .replace(/\\/g, '_')
  .replace(/\//g, '_')
  .substring(0, 255);
```

## 🛡️ Fluxo de Segurança - UploadThing (Escalas/Avatares)

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
# UploadThing (apenas para escalas e avatares)
UPLOADTHING_APP_ID=seu_app_id
UPLOADTHING_SECRET=sua_secret_key
UPLOADTHING_TOKEN=seu_token

# Database
DATABASE_URL=postgresql://...
```

## 📊 Limites e Quotas

| Tipo | Sistema | Tamanho Máx | Tipos Permitidos | Validações |
|------|---------|-------------|------------------|------------|
| **Escalas** | **UploadThing** | **8MB** | **APENAS PDF** | **Cliente + Servidor (7x) + Malware Scan** |
| **Mensagens** | **Direct Upload** | **8MB** | **APENAS PDF** | **Cliente (3x) + Servidor (7x)** |
| Avatares | UploadThing | 2MB | JPG, PNG, WebP | Cliente + Servidor + Malware Scan |

## 🚀 Como Usar

### Em Escalas (UploadThing - PDF-only)
```tsx
import SecureFileUploader from '@/components/SecureFileUploader';

<SecureFileUploader
  endpoint="scheduleFileUploader"
  acceptedTypes=".pdf"
  onUploadComplete={(res) => {
    // res.fileUrl - URL do arquivo
    // res.fileKey - Chave única
    // res.fileId - ID no banco
  }}
/>
```

### Em Mensagens (Validação Rigorosa PDF-only)
```tsx
// O componente MessagingClient já implementa todas as validações
// Não é necessário usar SecureFileUploader para mensagens
// Sistema validado em 4 camadas (input accept + onChange + handleSend + API)
```

### Para Avatares (UploadThing)
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
5. **Mensagens aceitam APENAS PDF**: 10 camadas de validação (3 cliente + 7 servidor)
6. **Teste regularmente**: Tente enviar imagens/documentos para garantir bloqueio

## 🔄 Migração do Sistema Antigo

Para migrar do sistema de upload legado:

1. Execute a migração do Prisma para adicionar campos do UploadThing:
```bash
npx prisma migrate dev --name add_uploadthing_fields
```

2. Substitua componentes de upload antigos por `SecureFileUploader` (apenas para escalas/avatares)

3. Mantenha sistema de mensagens como está (validação rigorosa já implementada)

## ✅ Checklist de Segurança

### Escalas (PDF-only via UploadThing)
- [x] Input HTML com `accept=".pdf"`
- [x] SecureFileUploader com endpoint="scheduleFileUploader"
- [x] API: MIME type === 'application/pdf'
- [x] API: Extensão === '.pdf'
- [x] API: Tamanho <= 8MB e >= 100 bytes
- [x] API: Nome <= 255 caracteres
- [x] API: Sanitização do nome
- [x] UploadThing: Malware scan automático
- [x] UploadThing: CDN seguro com URLs assinadas
- [x] Autorização: Apenas ADMIN e LEADER

### Mensagens (PDF-only)
- [x] Input HTML com `accept=".pdf,application/pdf"`
- [x] Validação onChange: MIME type + extensão + tamanho
- [x] Validação handleSend: MIME type + extensão + tamanho
- [x] API: MIME type === 'application/pdf'
- [x] API: Extensão === '.pdf'
- [x] API: Tamanho <= 8MB e >= 100 bytes
- [x] API: Nome <= 255 caracteres
- [x] API: Caracteres perigosos bloqueados
- [x] API: Sanitização do nome
- [x] API: Mensagens de erro descritivas

### UploadThing (Escalas/Avatares)
- [x] Autenticação JWT obrigatória
- [x] Autorização por role (ADMIN/LEADER para escalas)
- [x] MIME type whitelist
- [x] Extensão validada
- [x] Tamanho limitado por tipo
- [x] Nome sanitizado
- [x] Malware scan automático
- [x] CDN seguro com URLs assinadas

## 📞 Suporte

Em caso de problemas:
1. Verifique logs do console do navegador
2. Verifique logs do servidor (`console.error`)
3. Consulte documentação do UploadThing: https://docs.uploadthing.com
4. **Para mensagens**: Teste com arquivo PDF válido < 8MB
