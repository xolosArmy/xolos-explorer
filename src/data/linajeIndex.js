const LINAGE_INDEX_VERSION = '2026-03-27';

// Índice local persistente: slug -> txid.
// Mantén este archivo en control de versiones para resolución estable.
export const LINAJE_SLUG_INDEX = Object.freeze({
  'tomate-ramirez': 'cc43d40fa21304cfde5271a2f897fc0deff14c4854fa2b8f9f58c5a0ab4b171a',
  'frida-ramirez': '70a3b2dbfcf0c4891a5c27a83b1b52cb0a920f10a1720c506ff1849ed2e9bfa4',
  'ikal-caliente': '415b0d971d78ccf465c8a0b99b74edee950e0bdbacc6a941cb8f44b1874867f4',
  'kiwi-ramirez': '5bcf1823927af2645c310037666a3852a5726b9526c03550c820282b7c48ed2a',
  'ixchel-ramirez': 'bde767e246706ddaa4c208aa913285ac7e0e4517b5eaedaf40b0b15a42207e95',
  'rima-langarica': 'a4c358ca51058e3b893a3579c0d558bec17a5854d2fd7200aa0d42b8c0ea76ca',
  'jicamo-lopez': '44b35bf6dfb472b982bf6964f9eeb6783b5eea5ab71e7adb84246b61ff4371f5',
  'ticuiz-langarica': 'a4c6f91bc781ae03d82b71345715b9590a5cbea5ccccd4a9d505fef1da5b7bc3',
  'bolero-ramirez': 'Draft_Token_BOLERO_RAMIREZ_FCMZZ1560-A',
  'amixtli-ramirez': '3033fe4d51767d196597df41d14ecdb4822b4c9e48be630035a76b7d301b502a',
  'chontal-ramirez': 'fb0f49f9b6c5b701c637afbe6c10088fe11b4689bdf7a3800e62ba1a192499ab',
  'chimalma-ramirez': 'c490864b0c4cd2cbe163a573e830c22d7e270207062903f9f2f0e08fca6a13f6',
  'uxmal-avila': '1dc6943cc081e410646c1466653a1c6937815ce6a05253f0e541620e47bb3d7f',
  'humo-ramirez': '13a2fd97493e2c15ec1077465da11dd602e86fbf4e200b9c4bb72dab78c199ea',
  'aztlan-ramirez': 'Draft_Token_AZTLAN_RAMIREZ_FCMD4169-B',
  'copal-ramirez': 'Draft_Token_COPAL_RAMIREZ_FCMZZ2531-C',
  'tejocote-ramirez': '407bf5b92211cd2c77c6b8ca95d9cdc7e5d40f201b2348a0c886ed3f52c5f12e',
  'misha-ramirez': '4628220c6bb119148f320fd943f3957a12367ade2282e5fcaaae18d92b8f9909',
  'mitla-ramirez': 'ce37133f74d42ee1e5b4574a7b9bde9623200a61172f350b3e47f746fdf5cbad',
  'luna-ramirez': '094639e668c24620ec9f2107f68b55eb4766c3fee41261fc624117d4fa805fd4',
  'onix-ramirez': 'efec4f67bad956de425122d0496071842832433d349209f6f201898dc737477b',
  'puka-ramirez': '26fb361599ec6ce20b9259f6ec59433bbed50a83dedef706bcef7a5323fe1694',
  'nox-ramirez': '46a96ccf2e5ca44bc9fc02e0b3b01fe405016715707c488bcfbb82b80a1680fa',
  'iztli-ramirez': '6a14c61eee376cb86ec310bc0a9bf68ed501439ac3ab0378c1a9885e559165ed',
  'tonalli-ramirez': '084ff1d5dde0cdfe3f6d61978dc39e7a21ebb9a25cb21e8e44616315f7d9b199',
  'reyna-ramirez': '2de34e3d7c8eb32a0493c9711f7fc888c327e355c8932794ec7a2f9fc0fcf707',
  'agata-ramirez': 'f4f26fa9099a02067c0977bff52c2030635619382b08dbb4e304c5f64d57c0be',
  'romeo-ramirez': '4b9680a440279a54211305b142105142c7e57fc9fc586e666a679a903dac1107',
  'vovid-caliente': '40a8d3b6cf35dc3d8db8e0d70f57f45ae158659de9364d5c591b55dfe555ba70',
  'ehecatl-ramirez': '2ab5d1890eec894ed87b00f02721ce57dc36f681e96f9125a84a7e3936e25c4e',
  'tabasqueña-alatorre': '4df6ec8a9c51578d79b8b43886cec0930520a0179748f055da52cad0fdd75434',
  'durango-ramirez': '02c571ffefef3a28ad07d3afe20e07ba059f78c9f4807f27e5cc12dc4654af41',
  'altar-alvarado': '83e5e796338d8caf7dc57db01e530b3222cb0cb73641a448e6a896e05f6974b7',
  'anahuac-ramirez': 'e46491551765133ad49efd1b71f5b47e9ca65fecd90a55c02dfb22da726ee558',
  'cereza-ramirez': '30c912d7bc57e6c950eb4786e1d1dbc947ba5a8705d85d5e330c38e65b9a7ddf',
  'itzia-ramirez': 'fedaff48232023ab2e06230a389895e2648a1bdc5158a7e3091f9bbff6df5088',
   'bronce-ramirez': '28a5c3ad2f792e6ed747512f2170590690c5c02e0a67dc59fbbad0222400e4c8',
   'venus-ramirez': '0d4926f2c94567a1e97c435229439e885e36672bbb31b26b5be3dd9160a7c4b7',
   'balamka-ramirez': '0153b3cdc6bb45fb5fc9fa0162914f9a0edb14ea565607993336b46d5d4bc6b3',
   'ocelotl-ramirez': 'b1afe01140c3aa4cc3a653170c18b043ac07bc2867aee288b94fc253a85ab7d3',
   'anubis-ramirez': '5bbf51e055b39ee1eaabcd828b4206b9b50fac69252af280c0b83f575c56b6a2',
   'teyolia-ramirez': 'c95242fdea3a16ba21d3c876ecf11990c04ae4f1eb0d04d22801c8ff5a885c02',
   'mixa-ramirez': '218006a83344dd21c849fe852f375ff2673f3184c1018b725889fe7413a0981e',
   'venecia-ramirez': '1eeefaf68adb859dbbf588df2bc1bf4b41717ada776b6883231843dd1bd0eafa',
   'jade-ramirez': '0004bd83727c79eb7ad2d3e232eb88b058dee238006cf4d3aeb5b317f630047e',
   'axia-ramirez': '84c28813ce5ce06b90cf0a2339f3a46d1cd12582b6674b706e91bb0236fba68f',
   'yohualli-ramirez': '2cd356ecf042c3182352b3f240895090e1d716cb5d08f4ee4da8a178365a3ed1',
   'xiuh-ramirez': 'e2384d8728fc958c459b4859619938ddda4b1dd0e4ca47aac0779a26496eb9db',
   'mimosa-ramirez': '2a40ed39f83a48a89aa79c464c43ceff1fb65239fff1210a7a79709d9548f0d5',
   'papalotl-ramirez': '999ecf726d29b2dc4866b226d9c5e550da40fe5a9949d550c4a381affe53b1e7',
   'sabina-ramirez': '91fa432c1b051c4e8bc9b396b924ed9ef2835b6c2e00f90f720ae1a33b482991'
});

function normalizeSlugKey(slug) {
  if (!slug || typeof slug !== 'string') return '';
  return slug.trim().toLowerCase();
}

export function findLinajeTxidBySlug(slug) {
  const key = normalizeSlugKey(slug);
  if (!key) return '';
  return LINAJE_SLUG_INDEX[key] || '';
}

export { LINAGE_INDEX_VERSION };
