'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Modal from './Modal';
import { FaQuestion, FaTimes, FaSearch, FaChevronDown, FaChevronUp } from 'react-icons/fa';

// Categorias de FAQ
type FAQCategory = 'all' | 'escalas' | 'tarefas' | 'mensagens' | 'perfil' | 'upload' | 'permissoes' | 'seguranca' | 'mobile';

interface FAQItem {
  id: number;
  category: FAQCategory;
  question: string;
  answer: string;
  roles?: ('USER' | 'LEADER' | 'ADMIN')[];
  keywords: string[];
}

const faqData: FAQItem[] = [
  // ESCALAS
  {
    id: 1,
    category: 'escalas',
    question: 'Como posso ver minhas escalas?',
    answer: 'Acesse a seção "Minhas Escalas" no painel principal. Você verá todas as suas escalas futuras e passadas organizadas por data. As escalas de hoje aparecem em destaque.',
    keywords: ['visualizar', 'ver', 'listar', 'minhas'],
  },
  {
    id: 2,
    category: 'escalas',
    question: 'Como visualizar os detalhes de uma escala?',
    answer: 'Clique sobre qualquer escala na lista para abrir os detalhes completos, incluindo data, hora, participantes, tarefas associadas e arquivos anexados.',
    keywords: ['detalhes', 'informações', 'ver'],
  },
  {
    id: 3,
    category: 'escalas',
    question: 'Como baixar a escala em PDF?',
    answer: 'Ao visualizar os detalhes de uma escala, clique no botão "Baixar PDF" no canto superior. O PDF incluirá todos os detalhes da escala formatados para impressão.',
    keywords: ['download', 'pdf', 'imprimir', 'baixar'],
  },
  {
    id: 4,
    category: 'escalas',
    question: 'Como criar uma nova escala?',
    answer: 'Clique no botão "Criar Nova Escala" no painel de escalas. Preencha o nome, descrição, data/hora e selecione os participantes. Você pode também anexar arquivos PDF relacionados.',
    roles: ['ADMIN', 'LEADER'],
    keywords: ['criar', 'nova', 'adicionar'],
  },
  {
    id: 5,
    category: 'escalas',
    question: 'Posso editar uma escala já criada?',
    answer: 'Sim. Clique no menu de três pontos (⋮) na escala e selecione "Editar". Você pode alterar nome, descrição, data, participantes e arquivos anexados.',
    roles: ['ADMIN', 'LEADER'],
    keywords: ['editar', 'modificar', 'alterar'],
  },
  {
    id: 6,
    category: 'escalas',
    question: 'Como adicionar participantes a uma escala?',
    answer: 'Ao criar ou editar uma escala, use a seção "Gerenciar Usuários" para adicionar ou remover participantes. Você pode pesquisar usuários por nome ou habilidade.',
    roles: ['ADMIN', 'LEADER'],
    keywords: ['adicionar', 'participantes', 'usuários', 'membros'],
  },

  // TAREFAS
  {
    id: 7,
    category: 'tarefas',
    question: 'Como criar uma nova tarefa?',
    answer: 'Acesse a seção "Tarefas" e clique em "Criar Tarefa". Preencha o nome, descrição e data da tarefa. A tarefa será submetida para aprovação.',
    roles: ['ADMIN', 'LEADER'],
    keywords: ['criar', 'nova', 'adicionar'],
  },
  {
    id: 8,
    category: 'tarefas',
    question: 'Como aprovar ou rejeitar uma tarefa?',
    answer: 'No painel de tarefas, clique no menu (⋮) da tarefa pendente e selecione "Aprovar" ou "Rejeitar". Apenas tarefas com status "Pendente" podem ser aprovadas ou rejeitadas.',
    roles: ['ADMIN'],
    keywords: ['aprovar', 'rejeitar', 'validar'],
  },
  {
    id: 9,
    category: 'tarefas',
    question: 'Posso editar uma tarefa após criá-la?',
    answer: 'Sim. Clique no menu (⋮) e selecione "Editar". Você pode modificar nome, descrição e data da tarefa.',
    roles: ['ADMIN', 'LEADER'],
    keywords: ['editar', 'modificar', 'alterar'],
  },
  {
    id: 10,
    category: 'tarefas',
    question: 'Como deletar uma tarefa?',
    answer: 'Clique no menu (⋮) e selecione "Deletar". Apenas tarefas pendentes podem ser deletadas. Tarefas aprovadas ou rejeitadas não podem ser removidas.',
    roles: ['ADMIN', 'LEADER'],
    keywords: ['deletar', 'remover', 'excluir'],
  },
  {
    id: 11,
    category: 'tarefas',
    question: 'Como filtrar tarefas por status ou data?',
    answer: 'Use os filtros no topo da página de tarefas. Você pode filtrar por nome, status (Pendente/Aprovado/Rejeitado), data inicial e data final. Clique em "Aplicar Filtros" para atualizar a lista.',
    keywords: ['filtrar', 'buscar', 'pesquisar'],
  },

  // MENSAGENS
  {
    id: 12,
    category: 'mensagens',
    question: 'Como funciona o sistema de mensagens?',
    answer: 'O sistema permite conversas privadas entre usuários. Você pode iniciar novas conversas, enviar mensagens de texto e anexar arquivos PDF. Todas as conversas ficam organizadas na seção "Mensagens".',
    keywords: ['conversa', 'chat', 'comunicação'],
  },
  {
    id: 13,
    category: 'mensagens',
    question: 'Como iniciar uma nova conversa?',
    answer: 'Clique no botão "Nova Conversa", selecione um ou mais participantes e opcionalmente vincule a conversa a uma escala. Após criar, você já pode começar a enviar mensagens.',
    keywords: ['criar', 'nova', 'iniciar'],
  },
  {
    id: 14,
    category: 'mensagens',
    question: 'Como enviar arquivos em mensagens?',
    answer: 'Nas mensagens, clique no ícone de anexo (📎) e selecione um arquivo PDF. Apenas arquivos PDF de até 8MB são permitidos por questões de segurança.',
    keywords: ['anexar', 'arquivo', 'pdf', 'enviar'],
  },
  {
    id: 15,
    category: 'mensagens',
    question: 'Como baixar um arquivo recebido em mensagem?',
    answer: 'Clique no nome do arquivo PDF na mensagem. O download iniciará automaticamente. Caso o download falhe, verifique se você tem permissão para acessar o arquivo.',
    keywords: ['download', 'baixar', 'arquivo'],
  },
  {
    id: 16,
    category: 'mensagens',
    question: 'Como deletar uma conversa?',
    answer: 'Abra a conversa e clique no menu (⋮) no canto superior. Selecione "Deletar Conversa". Esta ação é permanente e não pode ser desfeita.',
    keywords: ['deletar', 'remover', 'excluir'],
  },
  {
    id: 17,
    category: 'mensagens',
    question: 'Como sei se tenho mensagens não lidas?',
    answer: 'Conversas com mensagens não lidas aparecem com um indicador vermelho no ícone de mensagens do menu. O número de conversas não lidas é exibido ao lado do ícone.',
    keywords: ['notificação', 'não lidas', 'novas'],
  },

  // PERFIL
  {
    id: 18,
    category: 'perfil',
    question: 'Como atualizar meu perfil?',
    answer: 'Clique no seu avatar no canto superior direito e selecione "Perfil". Você pode atualizar seu nome, email e foto de perfil. Algumas informações podem requerer aprovação do administrador.',
    keywords: ['editar', 'atualizar', 'modificar'],
  },
  {
    id: 19,
    category: 'perfil',
    question: 'Como alterar minha foto de perfil?',
    answer: 'No seu perfil, clique em "Alterar Foto". Selecione uma imagem JPG, PNG ou WebP de até 2MB. A foto será atualizada imediatamente.',
    keywords: ['foto', 'avatar', 'imagem'],
  },
  {
    id: 20,
    category: 'perfil',
    question: 'O que fazer se esquecer minha senha?',
    answer: 'Na tela de login, clique em "Esqueceu a senha?". Digite seu email e você receberá um link para redefinir sua senha. O link é válido por 24 horas.',
    keywords: ['senha', 'esqueci', 'recuperar', 'redefinir'],
  },
  {
    id: 21,
    category: 'perfil',
    question: 'Como alterar minhas habilidades/skills?',
    answer: 'Entre em contato com um administrador para atualizar suas habilidades (vocal, instrumento, mesa de som, etc.). Esta informação é usada para criar escalas adequadas.',
    roles: ['USER'],
    keywords: ['habilidades', 'skills', 'instrumentos'],
  },

  // UPLOAD DE ARQUIVOS
  {
    id: 22,
    category: 'upload',
    question: 'Que tipos de arquivos posso fazer upload?',
    answer: 'Para escalas e mensagens: apenas arquivos PDF de até 8MB. Para foto de perfil: imagens JPG, PNG ou WebP de até 2MB. Isso garante segurança e compatibilidade.',
    keywords: ['tipos', 'formatos', 'permitidos'],
  },
  {
    id: 23,
    category: 'upload',
    question: 'Como anexar um arquivo PDF a uma escala?',
    answer: 'Ao criar ou editar uma escala, use o botão "Anexar Arquivo" na seção de arquivos. Selecione um PDF de até 8MB. O arquivo será enviado de forma segura para o servidor.',
    roles: ['ADMIN', 'LEADER'],
    keywords: ['anexar', 'pdf', 'escala'],
  },
  {
    id: 24,
    category: 'upload',
    question: 'Por que meu upload de arquivo falhou?',
    answer: 'Verifique: 1) O arquivo é um PDF válido? 2) O tamanho é menor que 8MB? 3) O nome do arquivo tem menos de 255 caracteres? 4) Você tem permissão para fazer upload? Se o problema persistir, verifique os logs no console do navegador (F12).',
    keywords: ['erro', 'falha', 'não funciona'],
  },
  {
    id: 25,
    category: 'upload',
    question: 'Como funciona a segurança no upload de arquivos?',
    answer: 'Todos os arquivos passam por validação rigorosa: tipo MIME, extensão, tamanho, caracteres perigosos no nome. Arquivos de escalas são enviados para CDN seguro com scan de malware automático.',
    keywords: ['segurança', 'proteção', 'validação'],
  },
  {
    id: 26,
    category: 'upload',
    question: 'Posso substituir um arquivo já anexado?',
    answer: 'Sim. Para escalas: delete o arquivo atual e faça upload do novo. Para mensagens: envie uma nova mensagem com o arquivo atualizado.',
    keywords: ['substituir', 'trocar', 'atualizar'],
  },

  // PERMISSÕES
  {
    id: 27,
    category: 'permissoes',
    question: 'Qual a diferença entre os perfis de usuário?',
    answer: 'USER: visualiza escalas, envia mensagens. LEADER: cria escalas e tarefas, gerencia equipes. ADMIN: acesso completo, gerencia usuários, aprova tarefas.',
    keywords: ['roles', 'perfis', 'níveis'],
  },
  {
    id: 28,
    category: 'permissoes',
    question: 'Quem pode criar escalas?',
    answer: 'Apenas administradores (ADMIN) e líderes (LEADER) podem criar, editar e deletar escalas.',
    roles: ['ADMIN', 'LEADER'],
    keywords: ['criar', 'permissão', 'escala'],
  },
  {
    id: 29,
    category: 'permissoes',
    question: 'Quem pode aprovar tarefas?',
    answer: 'Apenas administradores (ADMIN) podem aprovar ou rejeitar tarefas. Líderes podem criar tarefas, mas não aprová-las.',
    roles: ['ADMIN'],
    keywords: ['aprovar', 'permissão', 'tarefa'],
  },
  {
    id: 30,
    category: 'permissoes',
    question: 'Como solicitar mudança de perfil/permissão?',
    answer: 'Entre em contato com um administrador do sistema. Informe o motivo da solicitação e aguarde aprovação.',
    keywords: ['solicitar', 'mudar', 'upgrade'],
  },
  {
    id: 31,
    category: 'permissoes',
    question: 'Posso ver escalas de outras pessoas?',
    answer: 'Você vê apenas escalas onde você está incluído como participante. Administradores e líderes podem ver todas as escalas.',
    keywords: ['visualizar', 'privacidade', 'outras'],
  },

  // SEGURANÇA
  {
    id: 32,
    category: 'seguranca',
    question: 'Meus dados estão seguros?',
    answer: 'Sim. Usamos autenticação JWT, criptografia de senhas, validação rigorosa de uploads, proteção contra SQL injection e XSS. Todos os dados trafegam via HTTPS.',
    keywords: ['segurança', 'proteção', 'privacidade'],
  },
  {
    id: 33,
    category: 'seguranca',
    question: 'Como posso sair com segurança?',
    answer: 'Clique no seu avatar e selecione "Sair". Sua sessão será encerrada imediatamente. Sempre faça logout em dispositivos compartilhados.',
    keywords: ['logout', 'sair', 'desconectar'],
  },
  {
    id: 34,
    category: 'seguranca',
    question: 'O que fazer se suspeitar de acesso não autorizado?',
    answer: 'Altere sua senha imediatamente e contate um administrador. Verifique a lista de atividades recentes no seu perfil.',
    keywords: ['hackeado', 'invasão', 'suspeita'],
  },

  // MOBILE
  {
    id: 35,
    category: 'mobile',
    question: 'Posso usar o sistema no celular?',
    answer: 'Sim! O sistema é totalmente responsivo e funciona em smartphones e tablets. Acesse pelo navegador (Chrome, Safari, Firefox) usando a mesma URL.',
    keywords: ['mobile', 'celular', 'tablet', 'smartphone'],
  },
  {
    id: 36,
    category: 'mobile',
    question: 'Como fazer upload de PDF pelo celular?',
    answer: 'Toque no botão "Anexar Arquivo", selecione "Documentos" ou "Arquivos" no menu do celular e escolha o PDF desejado. Funciona igual ao computador.',
    keywords: ['mobile', 'upload', 'celular'],
  },
  {
    id: 37,
    category: 'mobile',
    question: 'Como baixar arquivos no celular?',
    answer: 'Toque no nome do arquivo PDF. O download iniciará e o arquivo será salvo na pasta "Downloads" do seu dispositivo. Você pode abrir com qualquer leitor de PDF.',
    keywords: ['mobile', 'download', 'celular'],
  },

  // GERAIS
  {
    id: 38,
    category: 'all',
    question: 'Como obter suporte técnico?',
    answer: 'Entre em contato com o administrador do sistema via mensagem interna ou email de suporte. Descreva o problema detalhadamente e, se possível, inclua prints de tela.',
    keywords: ['suporte', 'ajuda', 'contato'],
  },
  {
    id: 39,
    category: 'all',
    question: 'Como fornecer feedback sobre a plataforma?',
    answer: 'Envie suas sugestões e feedback para a equipe de desenvolvimento através do email de suporte ou através de mensagem para um administrador.',
    keywords: ['feedback', 'sugestão', 'melhoria'],
  },
  {
    id: 40,
    category: 'all',
    question: 'O sistema fica fora do ar para manutenção?',
    answer: 'Manutenções são realizadas em horários de baixo uso e comunicadas com antecedência. Dados são sempre preservados durante atualizações.',
    keywords: ['manutenção', 'fora do ar', 'indisponível'],
  },
];

const categoryLabels: Record<FAQCategory, string> = {
  all: 'Todas',
  escalas: 'Escalas',
  tarefas: 'Tarefas',
  mensagens: 'Mensagens',
  perfil: 'Perfil',
  upload: 'Upload de Arquivos',
  permissoes: 'Permissões',
  seguranca: 'Segurança',
  mobile: 'Mobile',
};

export default function FAQButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  
  const draggingRef = useRef(false);
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const STORAGE_KEY_HIDDEN = 'faq-hidden';
  const STORAGE_KEY_POS = 'faq-pos';

  const { data: session, status } = useSession();
  const userRole = session?.user?.role;

  useEffect(() => {
    try {
      const h = sessionStorage.getItem(STORAGE_KEY_HIDDEN);
      if (h === 'true') setHidden(true);
      const p = localStorage.getItem(STORAGE_KEY_POS);
      if (p) {
        const parsed = JSON.parse(p);
        if (typeof parsed.left === 'number' && typeof parsed.top === 'number') {
          setPos(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // save position changes
    if (pos) {
      try {
        localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(pos));
      } catch {
        // ignore
      }
    }
  }, [pos]);

  useEffect(() => {
    try {
      // persist hidden only for current browser session
      sessionStorage.setItem(STORAGE_KEY_HIDDEN, hidden ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, [hidden]);

  const openModal = () => {
    setIsModalOpen(true);
    setSearchTerm('');
    setSelectedCategory('all');
  };
  
  const closeModal = () => setIsModalOpen(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Start dragging
    const btn = buttonRef.current;
    if (!btn) return;
    draggingRef.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    const rect = btn.getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!draggingRef.current) return;
    // calculate new left/top clamped to viewport
    const left = Math.min(Math.max(0, e.clientX - offsetRef.current.x), window.innerWidth - 56);
    const top = Math.min(Math.max(0, e.clientY - offsetRef.current.y), window.innerHeight - 56);
    setPos({ left, top });
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch {
      // ignore
    }
  };

  useEffect(() => {
    // Attach global pointermove/up while dragging
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const handleCloseButton = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    setHidden(true);
  };

  const toggleItem = (id: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filtrar FAQs baseado em categoria, busca e permissões do usuário
  const filteredFAQs = useMemo(() => {
    return faqData.filter(item => {
      // Filtro de categoria
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Filtro de permissão (se o item tem restrição de role)
      if (item.roles && userRole) {
        const allowedRoles = item.roles;
        const currentRole = userRole as 'USER' | 'LEADER' | 'ADMIN';
        if (!allowedRoles.includes(currentRole)) {
          return false;
        }
      }

      // Filtro de busca
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const matchQuestion = item.question.toLowerCase().includes(search);
        const matchAnswer = item.answer.toLowerCase().includes(search);
        const matchKeywords = item.keywords.some(k => k.toLowerCase().includes(search));
        return matchQuestion || matchAnswer || matchKeywords;
      }

      return true;
    });
  }, [selectedCategory, searchTerm, userRole]);

  // Reset handler removed (not currently used). To reset position double-click the button.

  // ensure FAQ reappears when user logs in again
  useEffect(() => {
    if (status === 'authenticated') {
      setHidden(false);
      try { sessionStorage.removeItem(STORAGE_KEY_HIDDEN); } catch {
        // ignore
      }
    }
  }, [status]);

  // Don't render FAQ on public pages or while loading session
  if (status === 'loading') return null;
  if (status !== 'authenticated') return null;

  return (
    <>
      {!hidden && (
        <button
          ref={buttonRef}
          onDoubleClick={openModal}
          onPointerDown={handlePointerDown}
          className="fixed bg-blue-500 opacity-90 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-50"
          aria-label="Ajuda e FAQ"
          title="Duplo clique para abrir FAQ"
          style={pos ? { left: pos.left, top: pos.top, right: 'auto', bottom: 'auto', width: 56, height: 56 } : { right: 16, bottom: 16, width: 56, height: 56 }}
        >
          <FaQuestion size={20} />
          <div
            onClick={handleCloseButton}
            role="button"
            tabIndex={0}
            onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') handleCloseButton(); }}
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-red-700"
            aria-label="Fechar FAQ"
            title="Fechar FAQ"
            style={{ transform: 'translate(50%, -50%)' }}
          >
            <FaTimes size={10} />
          </div>
        </button>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Central de Ajuda - FAQ">
        <div className="space-y-4">
          {/* Barra de Busca */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar dúvidas, palavras-chave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro de Categorias */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(categoryLabels) as FAQCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>

          {/* Resultados */}
          <div className="text-sm text-gray-400 mb-2">
            {filteredFAQs.length} {filteredFAQs.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
          </div>

          {/* Lista de FAQs */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>Nenhuma pergunta encontrada.</p>
                <p className="text-sm mt-2">Tente outras palavras-chave ou categorias.</p>
              </div>
            ) : (
              filteredFAQs.map(item => {
                const isExpanded = expandedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800 hover:bg-gray-750 transition-colors"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900 text-blue-200">
                            {categoryLabels[item.category]}
                          </span>
                          {item.roles && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900 text-purple-200">
                              {item.roles.join('/')}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-200">{item.question}</h4>
                      </div>
                      <div className="ml-3 text-gray-400">
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-4 pb-3 pt-0">
                        <div className="border-t border-gray-700 pt-3">
                          <p className="text-gray-300 leading-relaxed">{item.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Rodapé */}
          <div className="border-t border-gray-700 pt-3 mt-4">
            <p className="text-sm text-gray-400 text-center">
              Não encontrou o que procura? Entre em contato com o suporte.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
