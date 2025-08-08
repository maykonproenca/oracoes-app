import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Array de orações de exemplo para teste (mock)
const oracoesExemplo = [
  "Que a luz da esperança ilumine seu caminho e traga paz ao seu coração. Que você encontre força nas pequenas vitórias e coragem para enfrentar os desafios. Que o amor e a gratidão preencham seus dias.",
  "Que você seja abençoado com sabedoria para tomar as melhores decisões. Que sua jornada seja guiada pela fé e que cada passo traga você mais perto de seus sonhos. Que a paz reine em seu coração.",
  "Que você encontre serenidade em meio às tempestades da vida. Que sua fé seja sua âncora e que cada amanhecer traga novas possibilidades. Que você seja cercado por pessoas que te amam e apoiam.",
  "Que sua vida seja preenchida com momentos de alegria e gratidão. Que você tenha força para superar as dificuldades e sabedoria para apreciar as bênçãos. Que seu caminho seja iluminado pela esperança.",
  "Que você encontre equilíbrio entre dar e receber. Que sua jornada seja marcada por crescimento pessoal e espiritual. Que cada desafio seja uma oportunidade de se tornar mais forte e sábio."
];

function shouldUseMock() {
  return process.env.MOCK_OPENAI === '1' || !process.env.OPENAI_API_KEY;
}

async function gerarOracaoComMock(motivo: string) {
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 2000));
  const oracaoAleatoria = oracoesExemplo[Math.floor(Math.random() * oracoesExemplo.length)];
  const frasesPersonalizadas = [
    `Que ${motivo.toLowerCase()} seja uma fonte de crescimento e aprendizado em sua vida.`,
    `Que você encontre paz e clareza ao lidar com ${motivo.toLowerCase()}.`,
    `Que ${motivo.toLowerCase()} traga transformações positivas para sua jornada.`,
    `Que você tenha sabedoria e discernimento em relação a ${motivo.toLowerCase()}.`
  ];
  const frasePersonalizada = frasesPersonalizadas[Math.floor(Math.random() * frasesPersonalizadas.length)];
  return `${oracaoAleatoria}\n\n${frasePersonalizada}`;
}

async function gerarOracaoComOpenAI(motivo: string) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = `Gere uma oração breve, positiva e inclusiva (3–6 linhas) para o seguinte motivo: "${motivo}". A oração deve ser respeitosa e não usar termos específicos de denominações religiosas.`;

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Você cria orações inclusivas, positivas e respeitosas.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  return completion.choices[0]?.message?.content ?? '';
}

export async function POST(request: Request) {
  try {
    const { motivo } = await request.json();

    if (!motivo || typeof motivo !== 'string') {
      return NextResponse.json({ error: 'Motivo inválido.' }, { status: 400 });
    }

    const oracao = shouldUseMock()
      ? await gerarOracaoComMock(motivo)
      : await gerarOracaoComOpenAI(motivo);

    return NextResponse.json({ oracao });
  } catch (error) {
    console.error('Erro ao gerar oração:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar oração. Por favor, tente novamente.' },
      { status: 500 }
    );
  }
}
