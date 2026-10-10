module.exports = {
  meta: {
    id: 'card1-polipo-cover',
    output: 'card1-polipo-cover',
  },

  canvas: {
    width: 1080,
    height: 1440,
    background: '#F5EFE6',
  },

  textBlocks: [
    // CONTEXTO — recuado, menor, opacidade reduzida
    {
      role: 'context',
      lines: [
        { text: 'Minha ultrassonografia', y: 420 },
        { text: 'achou um',              y: 474 },
      ],
      fontFamily: 'Cormorant Garamond',
      fontWeight: 400,
      fontSize: 42,
      letterSpacing: -0.42, // -0.01em × 42
      fill: '#4A1C3C',
      opacity: 0.55,
      x: 120,
    },

    // HERO — primeiro elemento percebido
    {
      role: 'hero',
      lines: [
        { text: 'pólipo.', y: 570 },
      ],
      fontFamily: 'Cormorant Garamond',
      fontWeight: 500,
      fontSize: 108,
      letterSpacing: -1.08, // -0.01em × 108
      fill: '#B08D57',
      opacity: 1,
      x: 120,
    },

    // PERGUNTA — segundo elemento percebido
    {
      role: 'question',
      lines: [
        { text: 'O que isso',  y: 730 },
        { text: 'significa?',  y: 795 },
      ],
      fontFamily: 'Cormorant Garamond',
      fontWeight: 400,
      fontSize: 52,
      letterSpacing: -0.52, // -0.01em × 52
      fill: '#4A1C3C',
      opacity: 1,
      x: 120,
    },
  ],
};
