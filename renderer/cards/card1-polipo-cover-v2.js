module.exports = {
  meta: {
    id: 'card1-polipo-cover-v2',
    output: 'card1-polipo-cover-v2',
  },

  canvas: {
    width: 1080,
    height: 1440,
    background: '#F5EFE6',
  },

  textBlocks: [
    // CONTEXTO — sans light, pequeno, recuado por opacidade e escala
    {
      role: 'context',
      lines: [
        { text: 'Minha ultrassonografia', y: 390 },
        { text: 'achou um',              y: 426 },
      ],
      fontFamily: 'Montserrat',
      fontWeight: 300,
      fontSize: 26,
      letterSpacing: 0.52, // 0.02em × 26
      fill: '#4A1C3C',
      opacity: 0.50,
      x: 162,
    },

    // HERO — serif display, escala dominante, aubergine
    {
      role: 'hero',
      lines: [
        { text: 'pólipo.', y: 600 },
      ],
      fontFamily: 'Cormorant Garamond',
      fontWeight: 500,
      fontSize: 192,
      letterSpacing: -1.92, // -0.01em × 192
      fill: '#4A1C3C',
      opacity: 1,
      x: 148,
    },

    // PERGUNTA — sans regular, segunda âncora
    {
      role: 'question',
      lines: [
        { text: 'O que isso',  y: 770 },
        { text: 'significa?',  y: 820 },
      ],
      fontFamily: 'Montserrat',
      fontWeight: 400,
      fontSize: 40,
      letterSpacing: -0.2, // -0.005em × 40
      fill: '#4A1C3C',
      opacity: 0.85,
      x: 162,
    },
  ],
};
