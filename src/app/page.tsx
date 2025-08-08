'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [motivo, setMotivo] = useState('');
  const [oracao, setOracao] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/oracao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivo }),
      });

      const data = await response.json();
      if (response.ok) {
        setOracao(data.oracao);
      } else {
        alert(data.error || 'Erro ao gerar oração');
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(oracao);
    alert('Oração copiada para a área de transferência!');
  };

  if (showSplash) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333'
      }}>
        Seja bem-vindo(a) de volta
      </div>
    );
  }

  return (
    <main style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{
        textAlign: 'center',
        color: '#333',
        marginBottom: '30px'
      }}>
        Para o que você quer orar hoje?
      </h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '10px',
            marginBottom: '10px',
            borderRadius: '5px',
            border: '1px solid #ccc'
          }}
          placeholder="Digite seu motivo de oração aqui..."
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            opacity: isLoading ? '0.7' : '1'
          }}
        >
          {isLoading ? 'Gerando oração...' : 'Gerar oração'}
        </button>
      </form>

      {oracao && (
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '20px',
          borderRadius: '5px',
          marginTop: '20px'
        }}>
          <p style={{ whiteSpace: 'pre-line', marginBottom: '15px' }}>{oracao}</p>
          <button
            onClick={copyToClipboard}
            style={{
              padding: '8px 15px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Copiar
          </button>
        </div>
      )}
    </main>
  );
}
