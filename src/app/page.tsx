'use client';

import { useState, useEffect } from 'react';
import { frasesRotativas } from '../data/frasesRotativas';

type TabKey = 'left' | 'center' | 'right';

// Utilidades para rotação sem repetição (persistida por localStorage)
const ROTATE_STORAGE_KEY = 'frasesRotativasState_v1';

type RotateState = {
  order: number[]; // ordem embaralhada dos índices
  index: number;   // próximo índice a ser usado na ordem
  total: number;   // total de frases para validar mudanças
};

function createShuffledOrder(total: number): number[] {
  const arr = Array.from({ length: total }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function loadRotateState(total: number): RotateState {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(ROTATE_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as RotateState;
      if (parsed && Array.isArray(parsed.order) && typeof parsed.index === 'number' && parsed.total === total) {
        return parsed;
      }
    }
  } catch {
    // ignora leitura inválida
  }
  return { order: createShuffledOrder(total), index: 0, total };
}

function saveRotateState(state: RotateState) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ROTATE_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // ignora escrita inválida
  }
}

// Gradiente claro por horário (para dentro do card)
function gradientForHour(hour: number): string {
  // manhã 5-11 | tarde 12-17 | entardecer 18-20 | noite 21-4
  if (hour >= 5 && hour <= 11) {
    // Manhã: quase branco com leve azul
    return 'linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%)';
  }
  if (hour >= 12 && hour <= 17) {
    // Tarde: branco com azul muito suave
    return 'linear-gradient(180deg, #F6FAFF 0%, #FFFFFF 100%)';
  }
  if (hour >= 18 && hour <= 20) {
    // Entardecer: pêssego/lilás bem claros
    return 'linear-gradient(180deg, #FFF1E6 0%, #FBF5FF 100%)';
  }
  // Noite: cinza-azulado muito claro
  return 'linear-gradient(180deg, #F5F7FF 0%, #FFFFFF 100%)';
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('center');
  // Estados para transição entre abas
  const [displayedTab, setDisplayedTab] = useState<TabKey>('center');
  const [incomingTab, setIncomingTab] = useState<TabKey | null>(null);
  const [animatingTabs, setAnimatingTabs] = useState<boolean>(false);
  const [enterPhase, setEnterPhase] = useState<boolean>(false);
  const [animDirection, setAnimDirection] = useState<'left' | 'right' | null>(null);
  const [motivo, setMotivo] = useState('');
  const [oracao, setOracao] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');
  const [fraseTopo, setFraseTopo] = useState<string>('');
  const [fraseVisible, setFraseVisible] = useState<boolean>(false);
  const [bgGradient, setBgGradient] = useState<string>(gradientForHour(new Date().getHours()));
  // Splash controlado por timeline
  const [logoVisible, setLogoVisible] = useState<boolean>(false);
  const [phraseVisible, setPhraseVisible] = useState<boolean>(false);
  const FADE_IN_MS = 500;  // 0.5s
  const FADE_OUT_MS = 1000; // 1s
  // Visibilidade da tela principal
  const [mainVisible, setMainVisible] = useState<boolean>(false);

  // Timeline do splash: 
  // t=0s: start -> logo fade-in 0.5s
  // t=1s: frase fade-in 0.5s
  // t=2-3s: ambos estáticos
  // t=3-4s: ambos fade-out 1s => entra app
  useEffect(() => {
    // garantir estado inicial
    setLogoVisible(false);
    setPhraseVisible(false);

    const t0 = window.setTimeout(() => setLogoVisible(true), 30);       // dispara transição do logo
    const t1 = window.setTimeout(() => setPhraseVisible(true), 1000);   // inicia frase no segundo 2
    const t2 = window.setTimeout(() => {                                 // segundo 4: fade-out dos dois
      setLogoVisible(false);
      setPhraseVisible(false);
    }, 3000);
    const t3 = window.setTimeout(() => setShowSplash(false), 4000);     // encerra splash

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Quando o splash some, aplica fade-in de 0.5s na tela principal
  useEffect(() => {
    if (!showSplash) {
      const tid = window.setTimeout(() => setMainVisible(true), 30);
      return () => clearTimeout(tid);
    }
  }, [showSplash]);

  // Atualiza gradiente conforme horário (checa a cada 5 minutos)
  useEffect(() => {
    const update = () => setBgGradient(gradientForHour(new Date().getHours()));
    update();
    const id = setInterval(update, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Seleciona uma frase sem repetição até percorrer toda a lista, e aplica animação de saída/entrada
  useEffect(() => {
    const total = frasesRotativas.length;
    const state = loadRotateState(total);
    const nextIndex = state.order[state.index] ?? 0;

    // prepara animação de saída
    setFraseVisible(false);

    const t = setTimeout(() => {
      setFraseTopo(frasesRotativas[nextIndex] ?? '');
      // avança o ponteiro e salva; reseta ordem quando terminar o ciclo
      let newIndex = state.index + 1;
      let newOrder = state.order;
      if (newIndex >= total) {
        newOrder = createShuffledOrder(total);
        newIndex = 0;
      }
      saveRotateState({ order: newOrder, index: newIndex, total });
      // anima entrada
      setFraseVisible(true);
    }, 140); // pequena transição de saída

    return () => clearTimeout(t);
  }, []);

  const handleGenerate = async () => {
    if (!motivo.trim()) return;
    setIsLoading(true);
    setOracao('');
    try {
      const response = await fetch('/api/oracao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo }),
      });
      const data = await response.json();
      if (response.ok) {
        setOracao(data.oracao);
      } else {
        alert(data.error || 'Erro ao gerar oração');
      }
    } catch {
      alert('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!oracao) return;
    await navigator.clipboard.writeText(oracao);
    setCopyMsg('Copiado!');
    setTimeout(() => setCopyMsg(''), 1500);
  };

  const orderIndex = (tab: TabKey) => (tab === 'left' ? 0 : tab === 'center' ? 1 : 2);

  const handleTabChange = (next: TabKey) => {
    if (next === activeTab || animatingTabs) return;
    const dir = orderIndex(next) > orderIndex(activeTab) ? 'left' : 'right';
    setActiveTab(next);
    setIncomingTab(next);
    setAnimDirection(dir);
    setAnimatingTabs(true);
    setEnterPhase(false);
    // start enter on next tick
    const tEnter = window.setTimeout(() => setEnterPhase(true), 20);
    const tDone = window.setTimeout(() => {
      setDisplayedTab(next);
      setIncomingTab(null);
      setAnimatingTabs(false);
      setEnterPhase(false);
    }, 400);
    // cleanup
    return () => {
      clearTimeout(tEnter);
      clearTimeout(tDone);
    };
  };

  const renderTabContent = (tab: TabKey) => {
    if (tab === 'center') {
      return (
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: '10px 0 10px',
            fontSize: '22px',
            lineHeight: '28px',
            color: '#111827',
            fontWeight: 800
          }}>
            Pelo que você gostaria de orar hoje?
          </h1>

          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Digite aqui..."
            style={{
              width: '100%',
              minHeight: '90px',
              padding: '10px 12px',
              borderRadius: '14px',
              border: '1px solid #e6e6e6',
              background: '#ffffff',
              fontSize: '14px',
              color: '#333',
              outline: 'none'
            }}
          />

          <div style={{ height: 14 }} />

          <button
            onClick={handleGenerate}
            disabled={isLoading || !motivo.trim()}
            aria-label="Gerar oração"
            style={{
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: 'none',
              background: isLoading ? '#c7d2fe' : '#4f46e5',
              color: '#fff',
              fontSize: '28px',
              cursor: isLoading ? 'default' : 'pointer',
              boxShadow: '0 10px 24px rgba(79,70,229,0.35)',
              margin: '0 auto'
            }}
          >
            {isLoading ? '⏳' : '🙏'}
          </button>

          {oracao && (
            <div style={{
              marginTop: 16,
              textAlign: 'left',
              background: 'linear-gradient(180deg, #FAFBFF 0%, #FFFFFF 100%)',
              border: '1px solid #eef0ff',
              borderRadius: 14,
              padding: 14,
              color: '#2a2a2a'
            }}>
              <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{oracao}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid #e0e3ff',
                    background: '#fff',
                    color: '#4f46e5',
                    cursor: 'pointer'
                  }}
                >
                  Copiar
                </button>
                {copyMsg && (
                  <span style={{ alignSelf: 'center', color: '#16a34a', fontSize: 12 }}>{copyMsg}</span>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Conteúdos placeholder para outras abas
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#8a8a8e'
      }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🕊️</div>
        <div style={{ fontSize: 15 }}>Conteúdo em breve</div>
      </div>
    );
  };

  // Fundo externo fixo escuro (fora do card)
  const outerBackground = 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)';

  if (showSplash) {
    return (
      <div style={{
        height: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: outerBackground,
        color: '#fff'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              opacity: logoVisible ? 1 : 0,
              transition: `opacity ${logoVisible ? FADE_IN_MS : FADE_OUT_MS}ms ease`,
              fontSize: '56px',
              lineHeight: '56px'
            }}
          >
            📖
          </div>
          <div
            style={{
              opacity: phraseVisible ? 1 : 0,
              transition: `opacity ${phraseVisible ? FADE_IN_MS : FADE_OUT_MS}ms ease`,
              fontSize: '22px',
              fontWeight: 700,
              textAlign: 'center',
              padding: '0 24px'
            }}
          >
            <span>VAMOS CONVERSAR</span>
            <br />
            <span>COM DEUS HOJE?</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: outerBackground,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: bgGradient,
        borderRadius: '28px',
        boxShadow: '0 24px 60px rgba(20, 40, 120, 0.20)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '92dvh',
        border: '1px solid rgba(230,235,255,0.8)',
        opacity: mainVisible ? 1 : 0,
        transform: mainVisible ? 'translateY(0px)' : 'translateY(8px)',
        transition: 'opacity 500ms ease, transform 500ms ease'
      }}>
        {/* Header simples */}
        <div style={{ padding: '14px 18px 6px 18px' }}>
          <div style={{ height: 4, width: 28, background: '#eaeaea', borderRadius: 2 }} />
        </div>

        {/* Conteúdo principal variável por aba */}
        <div style={{ flex: 1, padding: '10px 18px 0 18px', overflowY: 'auto' }}>
          {/* Removido título "Vamos conversar com Deus hoje?" do conteúdo principal */}
          {/* Frase rotativa com animação sutil */}
          {fraseTopo && (
            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: '#6b7280',
              fontStyle: 'italic',
              marginBottom: '8px',
              transition: 'opacity 260ms ease, transform 260ms ease',
              opacity: fraseVisible ? 1 : 0,
              transform: fraseVisible ? 'translateY(0px)' : 'translateY(6px)'
            }}>
              {fraseTopo}
            </div>
          )}

          {/* Área com transição entre abas */}
          <div style={{ position: 'relative', minHeight: 220 }}>
            {/* Aba atual (saindo) */}
            <div
              style={{
                position: animatingTabs ? 'absolute' : 'relative',
                inset: 0,
                transition: 'transform 400ms ease, opacity 400ms ease',
                transform: animatingTabs
                  ? animDirection === 'left'
                    ? 'translateX(-24px)'
                    : 'translateX(24px)'
                  : 'translateX(0px)',
                opacity: animatingTabs ? 0 : 1
              }}
            >
              {renderTabContent(displayedTab)}
            </div>

            {/* Aba entrando */}
            {incomingTab && (
              <div
                style={{
                  position: 'relative',
                  transition: 'transform 400ms ease, opacity 400ms ease',
                  transform: enterPhase
                    ? 'translateX(0px)'
                    : animDirection === 'left'
                      ? 'translateX(24px)'
                      : 'translateX(-24px)',
                  opacity: enterPhase ? 1 : 0
                }}
              >
                {renderTabContent(incomingTab)}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Nav */}
        <nav style={{
          padding: '8px 18px 14px',
          borderTop: '1px solid #f0f0f5',
          background: 'transparent',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <TabIcon
            label="Menu 1"
            emoji="🏔️"
            active={activeTab === 'left'}
            onClick={() => handleTabChange('left')}
          />
          <TabIcon
            label="Orar"
            emoji="🙏"
            active={activeTab === 'center'}
            onClick={() => handleTabChange('center')}
          />
          <TabIcon
            label="Menu 3"
            emoji="🌟"
            active={activeTab === 'right'}
            onClick={() => handleTabChange('right')}
          />
        </nav>
      </div>
    </div>
  );
}

function TabIcon({ label, emoji, active, onClick }: { label: string; emoji: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        width: 80,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: active ? '#4f46e5' : '#9a9aa1'
      }}
    >
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span style={{ fontSize: 11 }}>{label}</span>
      {active && (
        <span style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: '#4f46e5',
          marginTop: 4
        }} />
      )}
    </button>
  );
}
