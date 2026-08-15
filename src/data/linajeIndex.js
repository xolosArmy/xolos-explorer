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
  'nox-ramirez': '46a96ccf2e5ca44bc9fc02e0b3b01fe405016715707c488bcfbb82b80a1680fa'
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
