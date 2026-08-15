const LINAJE_META_VERSION = '2026-03-27';

// Metadata editorial local para enriquecer fichas narrativas.
// Fuente de verdad on-chain: el OP_RETURN siempre manda.
export const LINAJE_EDITORIAL_META = Object.freeze({
  'nox-ramirez': {
    slug: 'nox-ramirez',
    txid: '46a96ccf2e5ca44bc9fc02e0b3b01fe405016715707c488bcfbb82b80a1680fa',
    tokenId: '46a96ccf2e5ca44bc9fc02e0b3b01fe405016715707c488bcfbb82b80a1680fa',

    title: 'Nox Ramírez',
    subtitle: 'Registro de Linaje - Pedigree FCM/FCI',

    narrative: 'Nox Ramírez es un xoloitzcuintle macho intermedio, color negro, nacido el 12 de febrero de 2026 en Ciudad de México. Su registro documental integra su microchip, certificado internacional de pedigree FCM/FCI y genealogía dentro del Archivo del Linaje Vivo de Xolos Ramírez mediante Tonalli Wallet.',

    nombreCompleto: 'NOX (RAMÍREZ/RAMÍREZ) MEX.FCI.',
    afijo: 'Ramírez',

    etapa: 'cachorro',
    origen: 'pedigree-fcm',

    sexo: 'Macho',
    color: 'negro',
    variedad: 'sin-pelo',
    talla: 'intermedia',

    displayColor: 'Negro',
    displayVariedad: 'Sin Pelo',

    fechaNacimiento: '2026-02-12',
    lugarNacimiento: 'Ciudad de México, México',

    criador: 'Xolos Ramírez',

    microchip: '939000002766011',
    registroFCM: 'FCMYV0889-A',
    fechaExpedicionPedigree: '2026-08-12',

    padreNombre: 'HUAPANGO (RAMÍREZ/RAMÍREZ) MEX.FCI.',
    madreNombre: 'TULA (RAMÍREZ/RAMÍREZ) MEX.',

    padre: 'huapango-ramirez',
    madre: 'tula-ramirez',

    explorerUrl: 'https://explorer.xolosarmy.xyz/tx/46a96ccf2e5ca44bc9fc02e0b3b01fe405016715707c488bcfbb82b80a1680fa',

    documentosOnChain: [
      {
        tipo: 'linaje-fcm-pedigree',
        titulo: 'NFT de linaje y pedigree FCM/FCI de Nox Ramírez',
        txid: '46a96ccf2e5ca44bc9fc02e0b3b01fe405016715707c488bcfbb82b80a1680fa',
        explorerUrl: 'https://explorer.xolosarmy.xyz/tx/46a96ccf2e5ca44bc9fc02e0b3b01fe405016715707c488bcfbb82b80a1680fa',
        red: 'eCash',
        sistema: 'Tonalli Wallet',
        estado: 'verificado',
        incluye: [
          'registro-fcm',
          'certificado-internacional-pedigree',
          'microchip',
          'genealogia',
          'identidad'
        ]
      }
    ],

    theme: 'codex',
    accent: '#111111',

    tags: [
      'xoloitzcuintle',
      'linaje',
      'ramirez',
      'nox',
      'macho',
      'intermedia',
      'sin-pelo',
      'negro',
      'microchip',
      'fcm',
      'pedigree-internacional',
      'huapango',
      'tula',
      'on-chain',
      'tonalli-wallet'
    ],

    nota: 'NFT de linaje minteado exitosamente vía Tonalli Wallet. Registro basado en Certificado Internacional de Pedigree FCM/FCI. Microchip 939000002766011. Registro FCM FCMYV0889-A. Padre: Huapango Ramírez. Madre: Tula Ramírez.'
  },
  'tika-ramirez': {
    slug: 'tika-ramirez',
    title: 'Tika Ramírez',
    subtitle: 'Entrada editorial local del Archivo del Linaje Vivo',
    narrative: 'Capa editorial local para completar su vínculo genealógico y enlazar a ambos progenitores dentro del archivo.',
    nombreCompleto: 'Tika Ramírez',
    afijo: 'Ramírez',
    variedad: 'Sin pelo',
    color: 'Negro',
    sexo: 'Hembra',
    lugarNacimiento: 'Ciudad de México, México',
    fechaNacimiento: '2025-10-06',
    criador: 'Fernando Ramírez Gutiérrez / Alexandra Ramírez Gutiérrez',
    padre: 'cc43d40fa21304cfde5271a2f897fc0deff14c4854fa2b8f9f58c5a0ab4b171a',
    madre: '70a3b2dbfcf0c4891a5c27a83b1b52cb0a920f10a1720c506ff1849ed2e9bfa4',
    theme: 'codex',
    accent: '#00eaff',
    backgroundNote: 'Registro editorial local usado para completar la genealogía.',
    tags: ['linaje', 'xoloitzcuintle', 'ramirez', 'tika'],
  },
  'amixtli-ramirez': {
    slug: 'amixtli-ramirez',
    txid: '3033fe4d51767d196597df41d14ecdb4822b4c9e48be630035a76b7d301b502a',
    tokenId: '3033fe4d51767d196597df41d14ecdb4822b4c9e48be630035a76b7d301b502a',

    title: 'Amixtli Ramírez',
    subtitle: 'Registro de Linaje - Microchip Verificado',

    narrative: 'Amixtli Ramírez es una xoloitzcuintle hembra talla intermedia, variedad sin pelo, color negro, nacida el 3 de mayo de 2025 dentro del linaje de Xolos Ramírez. Hija de Pandero Ramírez y Tula Ramírez, su identidad física queda vinculada mediante microchip al archivo digital on-chain de Xolos Ramírez en la blockchain de eCash.',

    nombreCompleto: 'AMIXTLI (RAMÍREZ/RAMÍREZ) MEX.',
    afijo: 'Ramírez',

    etapa: 'cachorro',
    origen: 'microchip',

    sexo: 'Hembra',
    color: 'negro',
    variedad: 'sin-pelo',
    talla: 'intermedia',

    displayColor: 'Negro',
    displayVariedad: 'Sin Pelo',

    fechaNacimiento: '2025-05-03',
    lugarNacimiento: 'Ciudad de México, México',

    criador: 'Xolos Ramírez',

    microchip: '900255002683040',
    registroFCM: null,

    padre: '7f0004c748fd06f4a7770b8d48c27b1f3492b81be8fe02df1a8bc9b96f91e9b3',
    madre: 'c6d67d82b53c2d94751ee3aaf487fcdac2c945319f65b435fc29b198d3e8e95',

    theme: 'codex',
    accent: '#111111',

    tags: [
      'xoloitzcuintle',
      'linaje',
      'ramirez',
      'amixtli',
      'hembra',
      'intermedia',
      'sin-pelo',
      'negro',
      'microchip',
      'registro-fisico-digital',
      'on-chain'
    ],

    nota: 'NFT minteado exitosamente. Registro físico-digital vinculado mediante microchip 900255002683040. Hija de Pandero Ramírez y Tula Ramírez.'
  },
  'tomate-ramirez': {
    slug: 'tomate-ramirez',
    txid: 'cc43d40fa21304cfde5271a2f897fc0deff14c4854fa2b8f9f58c5a0ab4b171a',
    tokenId: 'cc43d40fa21304cfde5271a2f897fc0deff14c4854fa2b8f9f58c5a0ab4b171a',
    title: 'Tomate Ramírez',
    subtitle: 'Entrada editorial local del Archivo del Linaje Vivo',
    narrative: 'Padre incorporado al archivo local para resolver la genealogía de Tika.',
    nombreCompleto: 'Tomate (Ramírez/Ramírez) Mex.',
    afijo: 'Ramírez',
    etapa: 'adulto',
    sexo: 'Macho',
    color: 'Negro',
    variedad: 'Con pelo',
    fechaNacimiento: '2022-04-25',
    lugarNacimiento: 'Ciudad de México, México',
    criador: 'Fernando Ramírez Gutiérrez / Alexandra Ramírez Gutiérrez',
    registroFCM: 'FCMA2526-C',
    microchip: '939000002661506',
    padre: 'Vovid Caliente Mex. FCI',
    madre: 'Frida (Ramírez) Mex.',
    theme: 'obsidian',
    accent: '#00eaff',
    tags: ['linaje', 'xoloitzcuintle', 'ramirez', 'tomate', 'padre'],
  },
  'frida-ramirez': {
    slug: 'frida-ramirez',
    txid: '70a3b2dbfcf0c4891a5c27a83b1b52cb0a920f10a1720c506ff1849ed2e9bfa4',
    tokenId: '70a3b2dbfcf0c4891a5c27a83b1b52cb0a920f10a1720c506ff1849ed2e9bfa4',
    title: 'Frida Ramírez',
    subtitle: 'Entrada editorial local del Archivo del Linaje Vivo',
    narrative: 'Madre incorporada al archivo local para que la ficha genealógica de Tika resuelva su rama materna.',
    nombreCompleto: 'Frida (Ramírez) Mex.',
    afijo: 'Ramírez',
    etapa: 'adulta',
    sexo: 'Hembra',
    color: 'Negro',
    variedad: 'Sin pelo',
    fechaNacimiento: '2020-04-03',
    lugarNacimiento: 'Ciudad de México, México',
    criador: 'Fernando Ramírez Gutiérrez / Alexandra Ramírez Gutiérrez',
    registroFCM: 'FCMC4734',
    microchip: '939000002599643',
    theme: 'jade',
    accent: '#00eaff',
    tags: ['linaje', 'xoloitzcuintle', 'ramirez', 'frida', 'madre'],
  },
  'ikal-caliente': {
    slug: 'ikal-caliente',
    txid: '415b0d971d78ccf465c8a0b99b74edee950e0bdbacc6a941cb8f44b1874867f4',
    tokenId: '415b0d971d78ccf465c8a0b99b74edee950e0bdbacc6a941cb8f44b1874867f4',
    title: 'Ikal Caliente',
    subtitle: 'Semental Fundador - Anclaje On-Chain Confirmado',
    narrative: 'Ikal Caliente Mex.FCI. (Macho, Intermedio, nacido en Tijuana B.C. en 2018) ha quedado inmortalizado en la red eCash. Hijo de Un Papalote Caliente Mex. y Silice Caliente Mex.FCI., Ikal aporta una genética de exportación inigualable.',
    nombreCompleto: 'IKAL CALIENTE MEX.FCI.',
    afijo: 'Caliente',
    etapa: 'adulto',
    sexo: 'Macho',
    color: 'Gris',
    variedad: 'Intermedio Sin Pelo',
    fechaNacimiento: '2018-08-15',
    lugarNacimiento: 'Tijuana B.C., Mexico',
    registroFCM: 'FCMF6818-A',
    microchip: '939000002513328',
    padre: 'papalote_caliente_placeholder_id',
    madre: 'silice_caliente_placeholder_id',
    theme: 'codex',
    accent: '#a0a0a0',
    tags: ['linaje', 'xoloitzcuintle', 'caliente', 'ramirez', 'macho', 'intermedio', 'ikal', 'on-chain'],
  },
  'kiwi-ramirez': {
    slug: 'kiwi-ramirez',
    txid: '5bcf1823927af2645c310037666a3852a5726b9526c03550c820282b7c48ed2a',
    tokenId: '5bcf1823927af2645c310037666a3852a5726b9526c03550c820282b7c48ed2a',
    title: 'Kiwi Ramirez',
    subtitle: 'Estándar Negro - Anclaje On-Chain Confirmado',
    narrative: 'Kiwi (Ramirez/Ramirez) Mex. FCI. (Macho, Estándar, Negro) representa la consolidación verificada on-chain de la línea Estándar Negra, al ser hijo directo de Jicamo Lopez y la matriarca Tabasqueña Alatorre.',
    nombreCompleto: 'KIWI (RAMIREZ/RAMIREZ) MEX. FCI.',
    afijo: 'Ramirez',
    etapa: 'adulto',
    sexo: 'Macho',
    color: 'Negro',
    variedad: 'Estándar Sin Pelo',
    fechaNacimiento: '2023-06-07',
    registroFCM: 'FCMA5764-A',
    microchip: '93900002700617',
    padre: '44b35bf6dfb472b982bf6964f9eeb6783b5eea5ab71e7adb84246b61ff4371f5', // Jicamo Lopez
    madre: '4df6ec8a9c51578d79b8b43886cec0930520a0179748f055da52cad0fdd75434', // Tabasqueña Alatorre
    theme: 'codex',
    accent: '#121212',
    tags: ['linaje', 'xoloitzcuintle', 'ramirez', 'kiwi', 'estandar', 'negro', 'macho', 'on-chain'],
  },
  'ixchel-ramirez': {
    slug: 'ixchel-ramirez',
    txid: 'bde767e246706ddaa4c208aa913285ac7e0e4517b5eaedaf40b0b15a42207e95',
    tokenId: 'bde767e246706ddaa4c208aa913285ac7e0e4517b5eaedaf40b0b15a42207e95',
    title: 'Ixchel Ramirez',
    subtitle: 'Pinto Mariposa - Anclaje On-Chain Confirmado',
    narrative: 'Ixchel (Ramirez/Ramirez) Mex. FCI. representa la consolidación verificada on-chain de generaciones de excelencia, al ser hija de Uxmal Avila y Mimosa Ramirez (FCMA6280-C). Su distintivo fenotipo pinto está ahora preservado para siempre en la blockchain.',
    nombreCompleto: 'IXCHEL (RAMIREZ/RAMIREZ) MEX. FCI.',
    afijo: 'Ramirez',
    etapa: 'joven',
    sexo: 'Hembra',
    color: 'Pinto (Mariposa)',
    variedad: 'Intermedio Sin Pelo',
    fechaNacimiento: '2024-01-27',
    lugarNacimiento: 'Ciudad de México, México',
    registroFCM: 'FCMZZ2531-D',
    microchip: '93900002723848',
    padre: '1dc6943cc081e410646c1466653a1c6937815ce6a05253f0e541620e47bb3d7f', // Uxmal Avila
    madre: 'mimosa_ramirez_c_placeholder_id', 
    theme: 'codex',
    accent: '#1e1e1e',
    tags: ['linaje', 'xoloitzcuintle', 'ramirez', 'ixchel', 'pinto', 'mariposa', 'intermedio', 'hembra', 'on-chain'],
  },
  'rima-langarica': {
    slug: 'rima-langarica',
    txid: 'a4c358ca51058e3b893a3579c0d558bec17a5854d2fd7200aa0d42b8c0ea76ca', 
    tokenId: 'a4c358ca51058e3b893a3579c0d558bec17a5854d2fd7200aa0d42b8c0ea76ca', 
    title: 'Rima Langarica',
    subtitle: 'Anclaje On-Chain Confirmado - Miniatura Bronce',
    narrative: 'Rima (Langarica) Mex. FCI. es una hembra Miniatura Sin Pelo de un color Bronce excepcional. Su registro on-chain certifica un linaje de gran prestigio, siendo hija de Piquin Chechue y Agripina Espinoza.',
    nombreCompleto: 'RIMA (LANGARICA) MEX. FCI.',
    afijo: 'Langarica',
    etapa: 'adulto',
    sexo: 'Hembra',
    color: 'Bronce',
    variedad: 'Miniatura Sin Pelo',
    fechaNacimiento: '2022-03-05',
    registroFCM: 'FCMA5977-B',
    microchip: '939000026322098',
    padre: 'piquin_chechue_placeholder_id', 
    madre: 'agripina_espinoza_placeholder_id', 
    theme: 'codex',
    accent: '#b5651d',
    tags: ['linaje', 'xoloitzcuintle', 'rima', 'sin-pelo', 'miniatura', 'bronce', 'on-chain'],
  },
  'jicamo-lopez': {
    slug: 'jicamo-lopez',
    txid: '44b35bf6dfb472b982bf6964f9eeb6783b5eea5ab71e7adb84246b61ff4371f5',
    tokenId: '44b35bf6dfb472b982bf6964f9eeb6783b5eea5ab71e7adb84246b61ff4371f5',
    title: 'Jicamo Lopez',
    subtitle: 'Semental Standard Mariposa - Registro On-Chain',
    narrative: 'Jicamo (Lopez) Mex.FCI. es un imponente macho Standard Sin Pelo con un fenotipo Mariposa distintivo. Certifica su linaje que unifica las líneas Avalos, Langarica y Lopez. Padre verificado de Kiwi Ramirez y Chontal Ramirez.',
    nombreCompleto: 'JICAMO (LOPEZ) MEX.FCI.',
    afijo: 'Lopez / Ramirez',
    etapa: 'adulto',
    sexo: 'Macho',
    color: 'Negro Mariposa',
    variedad: 'Standard Sin Pelo',
    fechaNacimiento: '2021-12-28',
    registroFCM: 'FCMB9671-B',
    microchip: '93900002632099',
    padre: 'matute_langarica_placeholder_id',
    madre: 'onix_lopez_placeholder_id',
    theme: 'codex',
    accent: '#1e1e1e',
    tags: ['linaje', 'xoloitzcuintle', 'standard', 'macho', 'jicamo', 'on-chain'],
  },
  'ticuiz-langarica': {
    slug: 'ticuiz-langarica',
    txid: 'a4c6f91bc781ae03d82b71345715b9590a5cbea5ccccd4a9d505fef1da5b7bc3',
    tokenId: 'a4c6f91bc781ae03d82b71345715b9590a5cbea5ccccd4a9d505fef1da5b7bc3',
    title: 'Ticuiz Langarica',
    subtitle: 'Semental Miniatura Bronce - Registro On-Chain',
    narrative: 'Ticuiz (Langarica) Mex. FCI. es un ejemplar Miniatura Sin Pelo de un color bronce vibrante. Su identidad genética ha sido inmortalizada on-chain, certificando un linaje puro Langarica al ser hijo de Miztli Langarica y Mictla Langarica.',
    nombreCompleto: 'TICUIZ (LANGARICA) MEX. FCI.',
    afijo: 'Langarica',
    etapa: 'adulto',
    sexo: 'Macho',
    color: 'Bronce',
    variedad: 'Miniatura Sin Pelo',
    fechaNacimiento: '2022-09-20',
    registroFCM: 'FCMA5830-B',
    microchip: '93900002685971',
    padre: 'miztli_langarica_placeholder_id', 
    madre: 'mictla_langarica_placeholder_id', 
    theme: 'codex',
    accent: '#a87c5c',
    tags: ['linaje', 'xoloitzcuintle', 'ticuiz', 'bronce', 'miniatura', 'macho', 'on-chain'],
  },
  'bolero-ramirez': {
    slug: 'bolero-ramirez',
    txid: 'Draft_Token_BOLERO_RAMIREZ_FCMZZ1560-A',
    tokenId: 'Draft_Token_BOLERO_RAMIREZ_FCMZZ1560-A',
    title: 'Bolero Ramirez',
    subtitle: 'Intermedio Sin Pelo - Ojos Azules',
    narrative: 'Bolero (Ramirez/Ramirez) Mex. FCI. (Macho, Intermedio, nacido 07/03/2024) es un ejemplar excepcional por su fenotipo. Hijo de Uxmal Avila y Jade Ramirez, destaca visualmente por sus distintivos ojos azules y un pelaje pálido, casi plateado.',
    nombreCompleto: 'BOLERO (RAMIREZ/RAMIREZ) MEX. FCI.',
    etapa: 'joven',
    sexo: 'Macho',
    color: 'Negro Mariposa pálido con ojos azules',
    variedad: 'Intermedio',
    fechaNacimiento: '2024-03-07',
    registroFCM: 'FCMZZ1560-A',
    microchip: '93900002718849',
    padre: '1dc6943cc081e410646c1466653a1c6937815ce6a05253f0e541620e47bb3d7f', // Uxmal Avila
    madre: 'jade_ramirez_placeholder_id',
    accent: '#a0a0a0',
    tags: ['linaje', 'xoloitzcuintle', 'intermedio', 'macho', 'bolero', 'ramirez', 'ojosazules']
  },
  'chimalma-ramirez': {
    slug: 'chimalma-ramirez',
    txid: 'c490864b0c4cd2cbe163a573e830c22d7e270207062903f9f2f0e08fca6a13f6',
    tokenId: 'c490864b0c4cd2cbe163a573e830c22d7e270207062903f9f2f0e08fca6a13f6',
    title: 'Chimalma Ramirez',
    nombreCompleto: 'Chimalma (Ramirez/Ramirez) Mex.',
    afijo: 'Ramirez',
    sexo: 'Hembra',
    color: 'Bermejo',
    variedad: 'Sin pelo',
    etapa: 'Recién nacido',
    fechaNacimiento: '2026-04-27',
    lugarNacimiento: 'Ciudad de México, México',
    criador: 'Xolos Ramírez',
    padre: 'koox_ramirez_placeholder_id', // Koox Ramirez
    madre: 'zia_ramirez_placeholder_id', // Zia Ramirez
    theme: 'genesis-line',
    accent: '#d97d7d',
    tags: [
      'xoloitzcuintle',
      'linaje',
      'ramirez',
      'chimalma',
      'recien-nacido',
      'sin-pelo',
      'hembra',
      'bermejo',
      'copete-blanco',
      'on-chain'
    ],
    nota: 'NFT minteado exitosamente. Acta digital de nacimiento verificada on-chain. Representa una nueva vida dentro del legado del xoloitzcuintle mexicano: fuerza ancestral, ternura y memoria viva de una raza sagrada.'
  },
  'chontal-ramirez': {
    slug: 'chontal-ramirez',
    txid: 'fb0f49f9b6c5b701c637afbe6c10088fe11b4689bdf7a3800e62ba1a192499ab',
    tokenId: 'fb0f49f9b6c5b701c637afbe6c10088fe11b4689bdf7a3800e62ba1a192499ab',
    title: 'Chontal Ramirez',
    subtitle: 'Estándar Negro - Linaje Full On-Chain',
    narrative: 'Chontal (Ramirez/Ramirez) Mex. FCI. representa la culminación de la trazabilidad en el afijo Ramírez. Nacida el 7 de junio de 2023, su identidad está anclada permanentemente en la blockchain. Hija de Jicamo Lopez y Tabasqueña Alatorre.',
    nombreCompleto: 'CHONTAL (RAMIREZ/RAMIREZ) MEX. FCI.',
    afijo: 'Ramirez',
    etapa: 'adulto',
    sexo: 'Hembra',
    color: 'Negro',
    variedad: 'Estándar Sin Pelo',
    fechaNacimiento: '2023-06-07',
    registroFCM: 'FCMA5764-E',
    microchip: '93900002700593',
    padre: '44b35bf6dfb472b982bf6964f9eeb6783b5eea5ab71e7adb84246b61ff4371f5', // Jicamo Lopez
    madre: '4df6ec8a9c51578d79b8b43886cec0930520a0179748f055da52cad0fdd75434', // Tabasqueña Alatorre
    theme: 'codex',
    accent: '#1e1e1e',
    tags: ['linaje', 'xoloitzcuintle', 'estandar', 'hembra', 'chontal', 'on-chain'],
  },
  'uxmal-avila': {
    slug: 'uxmal-avila',
    txid: '1dc6943cc081e410646c1466653a1c6937815ce6a05253f0e541620e47bb3d7f',
    tokenId: '1dc6943cc081e410646c1466653a1c6937815ce6a05253f0e541620e47bb3d7f',
    title: 'Uxmal Avila',
    subtitle: 'Semental Fundador - Registro On-Chain Confirmado',
    narrative: 'Uxmal (Avila) Mex. FCI. (Macho, Standard Sin Pelo, Negro Mariposa, nacido 24/10/2021) es un pilar fundamental en el afijo Ramírez. Su identidad genética certifica un linaje de excelencia que unifica las líneas Avila y Espinoza. Padre verificado de ejemplares como Pandero, Huapango, Ixchel y Xiuh.',
    nombreCompleto: 'UXMAL (AVILA) MEX. FCI.',
    afijo: 'Avila',
    etapa: 'adulto',
    sexo: 'Macho',
    color: 'Negro Mariposa',
    variedad: 'Standard Sin Pelo',
    fechaNacimiento: '2021-10-24',
    lugarNacimiento: 'Morelos, México',
    registroFCM: 'FCMB8012-B',
    microchip: '93900002644408',
    padre: 'tyzoc-avila_PLACEHOLDER', 
    madre: 'quetzalli-espinoza_PLACEHOLDER', 
    theme: 'codex',
    accent: '#1e1e1e',
    tags: ['linaje', 'xoloitzcuintle', 'standard', 'macho', 'uxmal', 'on-chain'],
  },
  'tyzoc-avila': {
    slug: 'tyzoc-avila',
    txid: 'tyzoc-avila_PLACEHOLDER',
    tokenId: 'tyzoc-avila_PLACEHOLDER', 
    title: 'Tyzoc Avila',
    subtitle: 'Intermedio Negro — Linaje On-Chain Fundador',
    narrative: 'Tyzoc Avila (Macho, Intermedio, Negro, FCM: FCMC0111-C) es el padre del semental documentado on-chain Uxmal Avila. Su pedigrí valida su linaje de fundadores, siendo hijo de Solitario Langarica y Reyna Langarica.',
    etapa: 'adulto',
    sexo: 'Macho',
    variedad: 'Intermedio Sin Pelo',
    color: 'Negro',
    registroFCM: 'FCMC0111-C',
    microchip: '93900002577206',
    tags: ['linaje', 'xoloitzcuintle', 'tyzoc', 'avila', 'fundador'],
  },
  'quetzalli-espinoza': {
    slug: 'quetzalli-espinoza',
    txid: 'quetzalli-espinoza_PLACEHOLDER', 
    tokenId: 'quetzalli-espinoza_PLACEHOLDER',
    title: 'Quetzalli Espinoza',
    subtitle: 'Intermedio Negro — Linaje Caliente-Ramirez',
    narrative: 'Quetzalli Espinoza (Hembra, Intermedio, Negro, FCM: FCMD1547-C) es la madre del semental documentado on-chain Uxmal Avila. Hija de UN PAPALOTE CALIENTE MEX. y SILICE CALIENTE MEX. FCI.',
    etapa: 'adulto',
    sexo: 'Hembra',
    variedad: 'Intermedio Sin Pelo',
    color: 'Negro',
    registroFCM: 'FCMD1547-C',
    microchip: '93900002385584',
    tags: ['linaje', 'xoloitzcuintle', 'quetzalli', 'espinoza', 'fundador'],
  },
  'aztlan-ramirez': {
    slug: 'aztlan-ramirez',
    txid: 'Draft_Token_AZTLAN_RAMIREZ_FCMD4169-B',
    tokenId: 'Draft_Token_AZTLAN_RAMIREZ_FCMD4169-B',
    title: 'Aztlán Ramirez',
    subtitle: 'Intermedio Negro - Padre de Amoxtli',
    narrative: 'Aztlán (Ramirez/Ramirez) Mex. FCI. (Macho, Intermedio Sin Pelo, Negro, nacido 02/09/2024) es un pilar fundamental de la nueva generación. Su pedigrí documenta su ascendencia a través de Romeo y Mayahuel, consolidando la línea Caliente.',
    nombreCompleto: 'AZTLÁN (RAMIREZ/RAMIREZ) MEX.FCI.',
    afijo: 'Ramirez',
    etapa: 'adulto',
    sexo: 'Macho',
    color: 'Negro',
    variedad: 'Intermedio Sin Pelo',
    fechaNacimiento: '2024-09-02',
    lugarNacimiento: 'Ciudad de México, México',
    registroFCM: 'FCMD4169-B',
    microchip: '939000002725505',
    padre: 'romeo_ramirez_placeholder_id',
    madre: 'mayahuel_ramirez_placeholder_id',
    theme: 'codex',
    accent: '#1e1e1e',
    tags: ['linaje', 'xoloitzcuintle', 'ramirez', 'aztlan', 'intermedio', 'macho', 'negro'],
    nota: 'Certificado FCMD4169-B verificado. Padre de Amoxtli Ramirez.'
  },
  'copal-ramirez': {
    slug: 'copal-ramirez',
    txid: 'Draft_Token_COPAL_RAMIREZ_FCMZZ2531-C',
    tokenId: 'Draft_Token_COPAL_RAMIREZ_FCMZZ2531-C',
    title: 'Copal Ramirez',
    subtitle: 'Intermedia Rojo - Hija de Uxmal Avila',
    narrative: 'Copal (Ramirez/Ramirez) Mex. FCI. (Hembra, Intermedio Sin Pelo, Rojo, nacida 27/11/2024) aporta una diversidad cromática invaluable al afijo. Es descendiente directa del semental on-chain Uxmal Avila (`1dc6943...`) y madre de Amoxtli Ramirez.',
    nombreCompleto: 'COPAL (RAMIREZ/RAMIREZ) MEX.FCI.',
    afijo: 'Ramirez',
    etapa: 'adulto',
    sexo: 'Hembra',
    color: 'Rojo',
    variedad: 'Intermedio Sin Pelo',
    fechaNacimiento: '2024-11-27',
    lugarNacimiento: 'Ciudad de México, México',
    registroFCM: 'FCMZZ2531-C',
    microchip: '939000002723921',
    padre: '1dc6943cc081e410646c1466653a1c6937815ce6a05253f0e541620e47bb3d7f', // Uxmal Avila
    madre: 'mimosa_ramirez_c_placeholder_id',
    theme: 'codex',
    accent: '#b5331d',
    tags: ['linaje', 'xoloitzcuintle', 'ramirez', 'copal', 'intermedio', 'hembra', 'rojo'],
    nota: 'Certificado FCMZZ2531-C verificado. Hija on-chain de Uxmal Avila.'
  },
  'humo-ramirez': {
    slug: 'humo-ramirez',
    txid: '13a2fd97493e2c15ec1077465da11dd602e86fbf4e200b9c4bb72dab78c199ea',
    tokenId: '13a2fd97493e2c15ec1077465da11dd602e86fbf4e200b9c4bb72dab78c199ea',
    title: 'Humo Ramirez',
    subtitle: 'Archivo del Linaje Vivo - Registro On-Chain',
    narrative: 'Humo Ramirez es un ejemplar macho de la variedad Sin Pelo y color Negro, nacido el 18 de octubre de 2025. Humo representa la vitalidad y pureza del afijo Ramirez. Su registro on-chain está blindado biométricamente mediante un microchip subdermal (ISO 11784/11785) verificado y leído exitosamente antes de su consolidación on-chain.',
    nombreCompleto: 'Humo Ramirez',
    afijo: 'Ramirez',
    etapa: 'adulto joven',
    sexo: 'Macho',
    color: 'Negro',
    variedad: 'Sin pelo',
    fechaNacimiento: '2025-10-18',
    criador: 'Fernando Ramirez Gutierrez / Alexandra Ramirez Gutierrez',
    microchip: '900255002683036',
    padre: 'a4c6f91bc781ae03d82b71345715b9590a5cbea5ccccd4a9d505fef1da5b7bc3', // Ticuiz Langarica
    madre: 'gema_ramirez_placeholder_id', // Gema (Ramirez/Ramirez)
    theme: 'codex',
    accent: '#00eaff',
    tags: ['linaje', 'xoloitzcuintle', 'ramirez', 'humo', 'microchip', 'on-chain'],
    nota: 'Vínculo físico-digital verificado mediante escáner de microchip 900255002683036. Padres: Ticuiz Langarica y Gema Ramirez.'
  },
  'misha-ramirez': {
    slug: 'misha-ramirez',
    txid: '4628220c6bb119148f320fd943f3957a12367ade2282e5fcaaae18d92b8f9909',
    tokenId: '4628220c6bb119148f320fd943f3957a12367ade2282e5fcaaae18d92b8f9909',
    title: 'Misha Ramirez',
    nombreCompleto: 'Misha (Ramirez/Ramirez) Mex.',
    afijo: 'Ramirez',
    sexo: 'Hembra',
    color: 'Negro',
    variedad: 'Con pelo',
    talla: 'Miniatura',
    fechaNacimiento: '2026-04-14',
    lugarNacimiento: 'Ciudad de Mexico, Mexico',
    criador: 'Xolos Ramirez',
    padre: '415b0d971d78ccf465c8a0b99b74edee950e0bdbacc6a941cb8f44b1874867f4', // Ikal Caliente
    madre: 'a4c358ca51058e3b893a3579c0d558bec17a5854d2fd7200aa0d42b8c0ea76ca', // Rima Langarica
    tags: [
      'xoloitzcuintle',
      'linaje',
      'ramirez',
      'misha',
      'miniatura',
      'con-pelo',
      'hembra',
      'cachorro',
      'on-chain'
    ],
    theme: 'genesis-line',
    accent: '#222222',
    nota: 'NFT minteado exitosamente. Hija de Ikal Caliente y Rima Langarica. Registro temprano de nacimiento en el Archivo del Linaje Vivo. Variedad con pelo, talla miniatura. Rasgo único en foto de génesis: El primer "Mlem".'
  },
  'tejocote-ramirez': {
    slug: 'tejocote-ramirez',
    txid: '407bf5b92211cd2c77c6b8ca95d9cdc7e5d40f201b2348a0c886ed3f52c5f12e',
    tokenId: '407bf5b92211cd2c77c6b8ca95d9cdc7e5d40f201b2348a0c886ed3f52c5f12e',
    title: 'Tejocote Ramirez',
    nombreCompleto: 'Tejocote (Ramirez/Ramirez) Mex.FCI.',
    afijo: 'Ramirez',
    sexo: 'Macho',
    color: 'Negro',
    variedad: 'Sin pelo',
    talla: 'Intermedio',
    fechaNacimiento: '2026-01-18',
    lugarNacimiento: 'Ciudad de Mexico, Mexico',
    criador: 'Xolos Ramirez',
    registroFCM: 'FCMZZ4032-A',
    microchip: '939000002748329',
    padre: '94fc64e3bea9ae9d333ff22cdf84925552d6922919958c86c9651fde64b0c4cb',
    madre: '6e02dbf7fb0e16d833aad89422094306dcd1ce002b9037a55fed47e304551353',
    tags: [
      'xoloitzcuintle',
      'linaje',
      'ramirez',
      'tejocote',
      'intermedio',
      'negro',
      'macho'
    ],
    theme: 'genesis-line',
    accent: '#111111',
    nota: 'Hijo de Aztlan Ramirez y Copal Ramirez. Nodo de nueva generacion dentro del archivo del linaje vivo.'
  },
  'mitla-ramirez': {
    slug: 'mitla-ramirez',
    txid: 'ce37133f74d42ee1e5b4574a7b9bde9623200a61172f350b3e47f746fdf5cbad',
    tokenId: 'ce37133f74d42ee1e5b4574a7b9bde9623200a61172f350b3e47f746fdf5cbad',
    title: 'Mitla Ramirez',
    nombreCompleto: 'Mitla (Ramirez/Ramirez) Mex.FCI.',
    afijo: 'Ramirez',
    sexo: 'Hembra',
    color: 'Mariposa',
    variedad: 'Sin pelo',
    talla: 'Intermedio',
    fechaNacimiento: '2026-01-18',
    lugarNacimiento: 'Ciudad de Mexico, Mexico',
    criador: 'Xolos Ramirez',
    registroFCM: 'FCMZZ4032-C',
    microchip: '93900002748330',
    padre: '94fc64e3bea9ae9d333ff22cdf84925552d6922919958c86c9651fde64b0c4cb',
    madre: '6e02dbf7fb0e16d833aad89422094306dcd1ce002b9037a55fed47e304551353',
    tags: [
      'xoloitzcuintle',
      'linaje',
      'ramirez',
      'mitla',
      'intermedio',
      'mariposa',
      'hembra'
    ],
    theme: 'genesis-line',
    accent: '#6f6a66',
    nota: 'Hija de Aztlan Ramirez y Copal Ramirez. Nodo de nueva generacion dentro del archivo del linaje vivo.'
  },
  'mixa-ramirez': {
    slug: 'mixa-ramirez',
    txid: 'ae69f7111c9b733f9788d787b7e974ce9b053527ea4cbab8603ba2e9be3d2eda',
    tokenId: 'ae69f7111c9b733f9788d787b7e974ce9b053527ea4cbab8603ba2e9be3d2eda',
    title: 'Mixa Ramirez',
    nombreCompleto: 'Mixa (Ramirez/Ramirez) Mex.',
    afijo: 'Ramirez',
    sexo: 'Hembra',
    color: 'Mariposa',
    variedad: 'Sin pelo',
    talla: 'Intermedia',
    etapa: 'Recién nacido',
    fechaNacimiento: '2026-04-20',
    lugarNacimiento: 'Ciudad de México, México',
    criador: 'Xolos Ramírez',
    padre: 'Draft_Token_BOLERO_RAMIREZ_FCMZZ1560-A', // Bolero Ramirez
    madre: 'gema_ramirez_placeholder_id', // Gema Ramirez
    padreNombre: 'HUAPANGO (RAMIREZ/RAMIREZ) MEX.FCI.',
    madreNombre: 'CITLALI (RAMIREZ/RAMIREZ) MEX.',
    documentosOnChain: [
      {
        tipo: 'nacimiento',
        titulo: 'NFT de nacimiento de Mixa Ramírez',
        txid: 'ae69f7111c9b733f9788d787b7e974ce9b053527ea4cbab8603ba2e9be3d2eda',
        red: 'eCash',
        sistema: 'Tonalli Wallet',
        estado: 'verificado'
      },
      {
        tipo: 'expediente-fcm-sanitario',
        titulo: 'Registro FCM, pedigree y expediente sanitario de Mixa Ramírez',
        txid: 'c3b14df7f7a31314cabc60db4093707c6ef168a5727f6b4d2ca935d1b25f9f31',
        explorerUrl: 'https://explorer.xolosarmy.xyz/search/c3b14df7f7a31314cabc60db4093707c6ef168a5727f6b4d2ca935d1b25f9f31',
        red: 'eCash',
        sistema: 'Tonalli Wallet',
        fechaRegistro: '2026-07-04',
        estado: 'verificado',
        incluye: [
          'registro-fcm',
          'certificado-internacional-pedigree',
          'microchip',
          'vacunacion',
          'desparasitacion',
          'genealogia'
        ]
      }
    ],
    registroDocumental: {
      estado: 'verificado',
      institucion: 'Federación Canófila Mexicana',
      incluyePedigreeInternacional: true,
      incluyeMicrochip: true,
      incluyeVacunacion: true,
      incluyeDesparasitacion: true,
      txid: 'c3b14df7f7a31314cabc60db4093707c6ef168a5727f6b4d2ca935d1b25f9f31'
    },
    theme: 'genesis-line',
    accent: '#6f6a66',
    tags: [
      'xoloitzcuintle',
      'linaje',
      'ramirez',
      'mixa',
      'recien-nacido',
      'sin-pelo',
      'hembra',
      'mariposa',
      'fcm',
      'pedigree-internacional',
      'vacunacion',
      'desparasitacion',
      'expediente-documental',
      'on-chain'
    ],
    nota: 'Mixa Ramírez cuenta con NFT de nacimiento y con un segundo NFT documental que preserva su registro FCM, Certificado Internacional de Pedigree, microchip, vacunación, desparasitación y genealogía. El expediente documental fue minteado en Tonalli Wallet con TXID c3b14df7f7a31314cabc60db4093707c6ef168a5727f6b4d2ca935d1b25f9f31.'
  },
  'luna-ramirez': {
    slug: 'luna-ramirez',
    txid: '094639e668c24620ec9f2107f68b55eb4766c3fee41261fc624117d4fa805fd4',
    tokenId: '094639e668c24620ec9f2107f68b55eb4766c3fee41261fc624117d4fa805fd4',
    title: 'Luna Ramirez',
    nombreCompleto: 'Luna (Ramirez/Ramirez) Mex.',
    afijo: 'Ramirez',
    sexo: 'Hembra',
    color: 'Negro',
    variedad: 'Sin pelo',
    etapa: 'Recién nacido',
    fechaNacimiento: '2026-04-20',
    lugarNacimiento: 'Ciudad de México, México',
    criador: 'Xolos Ramírez',
    padre: 'Draft_Token_BOLERO_RAMIREZ_FCMZZ1560-A', // Bolero Ramirez
    madre: 'gema_ramirez_placeholder_id', // Gema Ramirez
    theme: 'genesis-line',
    accent: '#1e1e1e',
    tags: [
      'xoloitzcuintle',
      'linaje',
      'ramirez',
      'luna',
      'recien-nacido',
      'sin-pelo',
      'hembra',
      'negro',
      'on-chain'
    ],
    nota: 'NFT minteado exitosamente. Hermana de camada de Mixa Ramirez. Acta digital de nacimiento verificada on-chain. Camada del 20 de abril de 2026.'
  },
  'onix-ramirez': {
    slug: 'onix-ramirez',
    txid: 'efec4f67bad956de425122d0496071842832433d349209f6f201898dc737477b',
    tokenId: 'efec4f67bad956de425122d0496071842832433d349209f6f201898dc737477b',
    title: 'Onix Ramirez',
    nombreCompleto: 'Onix (Ramirez/Ramirez) Mex.',
    afijo: 'Ramirez',
    sexo: 'Macho',
    color: 'Negro',
    variedad: 'Sin pelo',
    etapa: 'Recién nacido',
    fechaNacimiento: '2026-04-20',
    lugarNacimiento: 'Ciudad de México, México',
    criador: 'Xolos Ramírez',
    padre: 'Draft_Token_BOLERO_RAMIREZ_FCMZZ1560-A', // Bolero Ramirez
    madre: 'gema_ramirez_placeholder_id', // Gema Ramirez
    theme: 'genesis-line',
    accent: '#121212',
    tags: [
      'xoloitzcuintle',
      'linaje',
      'ramirez',
      'onix',
      'recien-nacido',
      'sin-pelo',
      'macho',
      'negro',
      'on-chain'
    ],
    nota: 'NFT minteado exitosamente. Hermano de camada de Mixa y Luna Ramirez. Acta digital de nacimiento verificada on-chain. Camada del 20 de abril de 2026.'
  },
  'puka-ramirez': {
    slug: 'puka-ramirez',
    txid: '26fb361599ec6ce20b9259f6ec59433bbed50a83dedef706bcef7a5323fe1694',
    tokenId: '26fb361599ec6ce20b9259f6ec59433bbed50a83dedef706bcef7a5323fe1694',

    title: 'Puka Ramírez',
    subtitle: 'Registro de Linaje - Microchip Verificado On-Chain',

    narrative: 'Puka Ramírez es un xoloitzcuintle macho de dos años, variedad sin pelo y color negro, perteneciente al linaje de Xolos Ramírez. Hijo de Uxmal Ávila (FCI color mariposa sin pelo) y de Jade Ramírez (variedad con pelo color negro). Su identidad física queda blindada y vinculada mediante microchip al archivo digital on-chain de eCash, uniendo identidad, cultura y tecnología al servicio de la raza.',

    nombreCompleto: 'PUKA (RAMÍREZ/RAMÍREZ) MEX.',
    afijo: 'Ramírez',

    etapa: 'adulto',
    origen: 'microchip',

    sexo: 'Macho',
    color: 'negro',
    variedad: 'sin-pelo',

    displayColor: 'Negro',
    displayVariedad: 'Sin Pelo',

    fechaNacimiento: '2024-06-09',
    lugarNacimiento: 'Ciudad de México, México',

    criador: 'Xolos Ramírez',

    microchip: '900255002683037',
    registroFCM: null,

    padre: '1dc6943cc081e410646c1466653a1c6937815ce6a05253f0e541620e47bb3d7f', // Uxmal Avila / Uxmal Ramirez FCI
    madre: 'jade_ramirez_placeholder_id', // Jade Ramirez

    theme: 'codex',
    accent: '#111111',

    tags: [
      'xoloitzcuintle',
      'linaje',
      'ramirez',
      'puka',
      'macho',
      'sin-pelo',
      'negro',
      'microchip',
      'registro-fisico-digital',
      'on-chain'
    ],

    social: {
      blog: 'https://xolosramirez.com/blog/2026-06-09-registro-de-linaje-puka-ramirez.html'
    },

    nota: 'NFT minteado exitosamente vía Tonalli Wallet. Registro físico-digital vinculado mediante microchip 900255002683037. Hijo de Uxmal Ávila y Jade Ramírez.'
  }
});

function normalizeKey(value) {
  if (!value || typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function isHex64(value) {
  return typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
}

export function findLinajeMetaBySlug(slug) {
  const key = normalizeKey(slug);
  if (!key) return null;
  return LINAJE_EDITORIAL_META[key] || null;
}

export function findLinajeMetaByTxid(txid) {
  if (!isHex64(txid)) return null;
  const target = txid.toLowerCase();

  for (const meta of Object.values(LINAJE_EDITORIAL_META)) {
    if (!meta || typeof meta !== 'object') continue;
    const candidates = [meta.txid, meta.tokenId, meta.nftTokenId]
      .filter((value) => typeof value === 'string')
      .map((value) => value.toLowerCase());
    if (candidates.includes(target)) return meta;
  }

  return null;
}

export function resolveLinajeMeta({ slug = '', txid = '' } = {}) {
  const bySlug = findLinajeMetaBySlug(slug);
  if (bySlug) return bySlug;
  return findLinajeMetaByTxid(txid);
}

export { LINAJE_META_VERSION };
