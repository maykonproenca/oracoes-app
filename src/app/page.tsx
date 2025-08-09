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
  const [motivo, setMotivo] = useState('');
  const [oracao, setOracao] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');
  const [fraseTopo, setFraseTopo] = useState<string>('');
  const [fraseVisible, setFraseVisible] = useState<boolean>(false);
  const [bgGradient, setBgGradient] = useState<string>(gradientForHour(new Date().getHours()));
  // Novo splash em duas etapas
  const [splashStage, setSplashStage] = useState<'logo' | 'phrase'>('logo');
  const [splashVisible, setSplashVisible] = useState<boolean>(false);
  const FADE_IN_MS = 1000;
  const FADE_OUT_MS = 2000;

  // Sequência do splash: logo -> frase -> app
  useEffect(() => {
    let t1: number | undefined;
    let t2: number | undefined;
    let t3: number | undefined;
    let t4: number | undefined;

    setSplashStage('logo');
    setSplashVisible(true); // dispara fade-in do logo (1s)
    t1 = window.setTimeout(() => setSplashVisible(false), FADE_IN_MS); // fade-out (2s)
    t2 = window.setTimeout(() => {
      setSplashStage('phrase');
      setSplashVisible(true); // fade-in da frase (1s)
      t3 = window.setTimeout(() => setSplashVisible(false), FADE_IN_MS); // fade-out (2s)
      t4 = window.setTimeout(() => setShowSplash(false), FADE_IN_MS + FADE_OUT_MS); // encerra splash
    }, FADE_IN_MS + FADE_OUT_MS); // após 3s do logo

    return () => {
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      if (t3) clearTimeout(t3);
      if (t4) clearTimeout(t4);
    };
  }, []);

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
        <div
          style={{
            opacity: splashVisible ? 1 : 0,
            transition: `opacity ${splashVisible ? FADE_IN_MS : FADE_OUT_MS}ms ease`,
            transform: 'translateY(0)',
            fontSize: splashStage === 'logo' ? '56px' : '22px',
            fontWeight: splashStage === 'logo' ? 400 : 700,
            textAlign: 'center',
            padding: '0 24px'
          }}
        >
          {splashStage === 'logo' ? '📖' : 'Vamos conversar com Deus hoje?'}
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
        border: '1px solid rgba(230,235,255,0.8)'
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

          {activeTab === 'center' && (
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

              {/* Resultado */}
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
          )}

          {activeTab !== 'center' && (
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
          )}
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
            onClick={() => setActiveTab('left')}
          />
          <TabIcon
            label="Orar"
            emoji="🙏"
            active={activeTab === 'center'}
            onClick={() => setActiveTab('center')}
          />
          <TabIcon
            label="Menu 3"
            emoji="🌟"
            active={activeTab === 'right'}
            onClick={() => setActiveTab('right')}
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
