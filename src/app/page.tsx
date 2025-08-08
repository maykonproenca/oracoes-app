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

// Gradiente de fundo por horário
function gradientForHour(hour: number): string {
  // manhã 5-11 | tarde 12-17 | entardecer 18-20 | noite 21-4
  if (hour >= 5 && hour <= 11) {
    // Manhã: azul claro para branco
    return 'linear-gradient(180deg, #EAF4FF 0%, #FDFEFF 100%)';
  }
  if (hour >= 12 && hour <= 17) {
    // Tarde: azul vivo suave
    return 'linear-gradient(180deg, #DDEBFF 0%, #EEF5FF 100%)';
  }
  if (hour >= 18 && hour <= 20) {
    // Entardecer: laranja/rosa para lilás
    return 'linear-gradient(180deg, #FFD7B8 0%, #F3E0FF 100%)';
  }
  // Noite: azul escuro para roxo
  return 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)';
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
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

  if (showSplash) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: bgGradient,
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#fff'
      }}>
        Seja bem-vindo(a) de volta
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: bgGradient,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#fff',
        borderRadius: '28px',
        boxShadow: '0 24px 60px rgba(20, 40, 120, 0.12)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 48px)'
      }}>
        {/* Header simples */}
        <div style={{ padding: '20px 22px 8px 22px' }}>
          <div style={{ height: 4, width: 28, background: '#eaeaea', borderRadius: 2 }} />
        </div>

        {/* Conteúdo principal variável por aba */}
        <div style={{ flex: 1, padding: '12px 22px 0 22px', overflowY: 'auto' }}>
          {/* Frase no topo, centralizada e em uma única linha */}
          <div
            style={{
              textAlign: 'center',
              fontSize: '22px',
              fontWeight: 600,
              color: '#1d1d1f',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: '6px 0 2px'
            }}
          >
            Vamos conversar com Deus hoje?
          </div>
          {/* Frase rotativa com animação sutil */}
          {fraseTopo && (
            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: '#6b7280',
              fontStyle: 'italic',
              marginBottom: '10px',
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
                margin: '18px 0 14px',
                fontSize: '24px',
                lineHeight: '30px',
                color: '#1d1d1f',
                fontWeight: 700
              }}>
                Pelo que você gostaria de orar hoje?
              </h1>

              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Digite aqui..."
                style={{
                  width: '100%',
                  minHeight: '110px',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1px solid #e6e6e6',
                  background: '#fafafa',
                  fontSize: '14px',
                  color: '#333',
                  outline: 'none'
                }}
              />

              <div style={{ height: 20 }} />

              <button
                onClick={handleGenerate}
                disabled={isLoading || !motivo.trim()}
                aria-label="Gerar oração"
                style={{
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  border: 'none',
                  background: isLoading ? '#c7d2fe' : '#4f46e5',
                  color: '#fff',
                  fontSize: '30px',
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
                  marginTop: 20,
                  textAlign: 'left',
                  background: 'linear-gradient(180deg, #f8f9ff 0%, #f5f7ff 100%)',
                  border: '1px solid #eef0ff',
                  borderRadius: 16,
                  padding: 16,
                  color: '#2a2a2a'
                }}>
                  <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{oracao}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
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
              <div style={{ fontSize: 48, marginBottom: 12 }}>🕊️</div>
              <div style={{ fontSize: 16 }}>Conteúdo em breve</div>
            </div>
          )}
        </div>

        {/* Bottom Nav */}
        <nav style={{
          padding: '10px 22px 18px',
          borderTop: '1px solid #f0f0f5',
          background: '#fff',
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
