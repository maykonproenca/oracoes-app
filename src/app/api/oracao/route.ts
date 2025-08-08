import { NextResponse } from 'next/server';

// Array de orações de exemplo para teste
const oracoesExemplo = [
  "Que a luz da esperança ilumine seu caminho e traga paz ao seu coração. Que você encontre força nas pequenas vitórias e coragem para enfrentar os desafios. Que o amor e a gratidão preencham seus dias.",
  
  "Que você seja abençoado com sabedoria para tomar as melhores decisões. Que sua jornada seja guiada pela fé e que cada passo traga você mais perto de seus sonhos. Que a paz reine em seu coração.",
  
  "Que você encontre serenidade em meio às tempestades da vida. Que sua fé seja sua âncora e que cada amanhecer traga novas possibilidades. Que você seja cercado por pessoas que te amam e apoiam.",
  
  "Que sua vida seja preenchida com momentos de alegria e gratidão. Que você tenha força para superar as dificuldades e sabedoria para apreciar as bênçãos. Que seu caminho seja iluminado pela esperança.",
  
  "Que você encontre equilíbrio entre dar e receber. Que sua jornada seja marcada por crescimento pessoal e espiritual. Que cada desafio seja uma oportunidade de se tornar mais forte e sábio."
];

export async function POST(request: Request) {
  try {
    const { motivo } = await request.json();

    // Simula um delay para parecer mais realista
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Seleciona uma oração aleatória do array
    const oracaoAleatoria = oracoesExemplo[Math.floor(Math.random() * oracoesExemplo.length)];

    // Adiciona uma frase personalizada baseada no motivo
    const frasesPersonalizadas = [
      `Que ${motivo.toLowerCase()} seja uma fonte de crescimento e aprendizado em sua vida.`,
      `Que você encontre paz e clareza ao lidar com ${motivo.toLowerCase()}.`,
      `Que ${motivo.toLowerCase()} traga transformações positivas para sua jornada.`,
      `Que você tenha sabedoria e discernimento em relação a ${motivo.toLowerCase()}.`
    ];

    const frasePersonalizada = frasesPersonalizadas[Math.floor(Math.random() * frasesPersonalizadas.length)];
    const oracaoCompleta = `${oracaoAleatoria}\n\n${frasePersonalizada}`;

    return NextResponse.json({ oracao: oracaoCompleta });
  } catch (error) {
    console.error('Erro ao gerar oração:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar oração. Por favor, tente novamente.' },
      { status: 500 }
    );
  }
}
