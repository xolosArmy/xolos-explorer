import React from 'react';
import { BrowserRouter, Link, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { ChronikClient } from 'chronik-client';
import * as ecashaddr from 'ecashaddrjs';
import { LINAJE_SLUG_INDEX, findLinajeTxidBySlug } from './data/linajeIndex';
import { LINAJE_EDITORIAL_META, resolveLinajeMeta } from './data/linajeMeta';
import { XoloCard } from './components/XoloCard';
import { AppShell } from './components/AppShell';
import { SearchBar as AccessibleSearchBar } from './components/SearchBar';
import { PageStatus } from './components/PageStatus';
import { PageSkeleton } from './components/PageSkeleton';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import {
  extractTokenDocumentUrl,
  fetchIpfsMetadataByDocumentUrl,
  pickNftImageUrl,
  sha256HexFromString,
} from './utils/ipfsMetadata';

const CHRONIK_URL = 'https://chronik.xolosarmy.xyz';
const chronik = new ChronikClient(CHRONIK_URL);
const RMZ_TOKEN_ID = (import.meta.env.VITE_RMZ_TOKEN_ID || '').trim().toLowerCase();
const tokenIpfsMetadataByIdCache = new Map();
const tokenIpfsMetadataPromiseById = new Map();
const LazyHomePage = React.lazy(() => import('./pages/HomePage.jsx'));
// TODO: Extraer las páginas restantes cuando los helpers Chronik/IPFS/linaje estén desacoplados del módulo principal.

function detectQueryType(value) {
  const q = value.trim();
  if (!q) return 'empty';
  if (/^[0-9]+$/.test(q)) return 'block-height';
  if (/^(ecash:|bitcoincash:)/i.test(q)) return 'address';
  if (/^[0-9a-fA-F]{64}$/.test(q)) return 'hash';
  return 'unknown';
}

function safeStringify(obj) {
  return JSON.stringify(
    obj,
    (_, value) => (typeof value === 'bigint' ? value.toString() : value),
    2,
  );
}

function shortHex(value = '', start = 14, end = 10) {
  if (!value) return '—';
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

function unixToText(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString('es-MX');
}

function formatNumber(value) {
  if (value === undefined || value === null || value === '') return '—';
  return new Intl.NumberFormat('es-MX').format(Number(value));
}

function satsToXec(sats) {
  if (sats === undefined || sats === null) return '—';
  const n = Number(sats) / 100;
  return `${new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)} XEC`;
}

function toBigIntSafe(value) {
  try {
    if (value === undefined || value === null || value === '') return 0n;
    if (typeof value === 'bigint') return value;
    return BigInt(value);
  } catch {
    return 0n;
  }
}

function formatTokenAmount(value) {
  return new Intl.NumberFormat('es-MX').format(toBigIntSafe(value));
}

function formatTokenAmountWithDecimals(value, decimals) {
  const atoms = toBigIntSafe(value);
  const safeDecimals = Number.isFinite(Number(decimals)) ? Math.max(0, Number(decimals)) : 0;
  if (safeDecimals === 0) return formatTokenAmount(atoms);

  const negative = atoms < 0n;
  const absAtoms = negative ? -atoms : atoms;
  const base = 10n ** BigInt(safeDecimals);
  const whole = absAtoms / base;
  const fraction = (absAtoms % base).toString().padStart(safeDecimals, '0').replace(/0+$/, '');
  const wholeText = new Intl.NumberFormat('es-MX').format(whole);

  return `${negative ? '-' : ''}${wholeText}${fraction ? `.${fraction}` : ''}`;
}

function outputScriptToAddress(outputScript) {
  try {
    if (!outputScript || typeof outputScript !== 'string') return null;

    if (outputScript.startsWith('76a914') && outputScript.endsWith('88ac') && outputScript.length === 50) {
      const hash = outputScript.slice(6, -4);
      return ecashaddr.encodeCashAddress('ecash', 'p2pkh', hash);
    }

    if (outputScript.startsWith('a914') && outputScript.endsWith('87') && outputScript.length === 46) {
      const hash = outputScript.slice(4, -2);
      return ecashaddr.encodeCashAddress('ecash', 'p2sh', hash);
    }

    return null;
  } catch {
    return null;
  }
}

function isOpReturn(outputScript) {
  return typeof outputScript === 'string' && outputScript.startsWith('6a');
}

function decodeHexToAscii(hex) {
  try {
    if (!hex || typeof hex !== 'string') return '';
    let clean = hex.replace(/^6a/, '');
    if (clean.length % 2 !== 0) return clean;
    const bytes = clean.match(/.{1,2}/g) || [];
    let text = '';
    for (const b of bytes) {
      const code = parseInt(b, 16);
      if (Number.isNaN(code)) continue;
      text += code >= 32 && code <= 126 ? String.fromCharCode(code) : '.';
    }
    return text;
  } catch {
    return '';
  }
}

function extractOpReturnText(outputScript) {
  if (!isOpReturn(outputScript)) return null;
  const ascii = decodeHexToAscii(outputScript);
  return ascii || outputScript;
}

// Formato oficial de registro de linaje:
// XOLO|RAMIREZ|NOMBRE=TIKA|NAC=2025-10-06|LUGAR=CDMX|SEXO=H|COLOR=NEGRO|VAR=SINPELO
function isXolosLinajeRecord(text) {
  if (!text || typeof text !== 'string') return false;
  return text.startsWith('XOLO|RAMIREZ|');
}

function parseLinajeRecord(text) {
  if (!isXolosLinajeRecord(text)) return null;

  const parts = text.split('|');
  const data = {};

  for (const part of parts.slice(2)) {
    const [key, ...rest] = part.split('=');
    if (!key || rest.length === 0) continue;
    data[key] = rest.join('=');
  }

  return data;
}

function isHex64(value) {
  return typeof value === 'string' && /^[0-9a-fA-F]{64}$/.test(value);
}

function slugify(value) {
  if (!value || typeof value !== 'string') return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeArchiveNameKey(value) {
  if (!value || typeof value !== 'string') return '';

  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (!normalized) return '';

  const compacted = normalized
    .replace(/[()[\]{}]/g, ' ')
    .replace(/[/'".,;:!?#&+*_\\|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!compacted) return '';

  const tokens = compacted
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean);

  const dedupedTokens = tokens.filter((token, index) => token !== tokens[index - 1]);
  const stopTokens = new Set(['mex', 'mexico', 'mx']);

  while (dedupedTokens.length > 1 && stopTokens.has(dedupedTokens[dedupedTokens.length - 1])) {
    dedupedTokens.pop();
  }

  return dedupedTokens.join(' ').trim();
}

function buildArchiveNameVariants(value) {
  if (!value || typeof value !== 'string') return [];

  const variants = new Set();
  const register = (candidate) => {
    const normalized = normalizeArchiveNameKey(candidate);
    if (normalized) variants.add(normalized);
  };

  register(value);
  register(value.replace(/\([^)]*\)/g, ' '));
  register(value.replace(/\[[^\]]*\]/g, ' '));
  register(value.replace(/\{[^}]*\}/g, ' '));
  register(value.replace(/[([{].*$/, ' '));
  register(value.replace(/\([^)]*\)/g, ' ').replace(/\b(?:mex|mexico|mx)\.?$/i, ' '));
  register(slugify(value).replace(/-/g, ' '));

  return Array.from(variants);
}

function collectEditorialNameFields(meta = {}) {
  return [
    meta.title,
    meta.nombreCompleto,
    meta.name,
    meta.nombre,
    meta.slug,
    meta.afijo ? `${meta.title || meta.nombreCompleto || meta.name || ''} ${meta.afijo}` : '',
    ...(Array.isArray(meta.aliases) ? meta.aliases : []),
    ...(Array.isArray(meta.alias) ? meta.alias : []),
    ...(Array.isArray(meta.nombres) ? meta.nombres : []),
    ...(Array.isArray(meta.nombresAlternos) ? meta.nombresAlternos : []),
    ...(Array.isArray(meta.nombresAlternativos) ? meta.nombresAlternativos : []),
    ...(Array.isArray(meta.knownNames) ? meta.knownNames : []),
  ].filter((entry) => typeof entry === 'string' && entry.trim());
}

function buildLinajeArchiveNameLookup() {
  const lookup = new Map();

  Object.entries(LINAJE_EDITORIAL_META || {}).forEach(([metaSlug, meta]) => {
    if (!meta || typeof meta !== 'object') return;

    const slug = slugify(meta.slug || metaSlug || '');
    const indexedTxid = slug ? (LINAJE_SLUG_INDEX[slug] || '') : '';
    const txidCandidate = [meta.txid, meta.tokenId, meta.nftTokenId, indexedTxid]
      .find((value) => isHex64((value || '').toString().trim()));
    const txid = txidCandidate ? txidCandidate.toString().trim().toLowerCase() : '';
    const lineageRef = slug || txid;

    if (!lineageRef) return;

    const entry = {
      slug,
      txid,
      lineageHref: `/linaje/${lineageRef}`,
      collectionHref: slug ? `/collection/xolosnft/${slug}` : '',
      title: meta.title || meta.nombreCompleto || meta.name || slug || txid,
    };

    const names = new Set();
    if (slug) names.add(slug.replace(/-/g, ' '));
    collectEditorialNameFields(meta).forEach((name) => {
      buildArchiveNameVariants(name).forEach((variant) => names.add(variant));
    });

    names.forEach((name) => {
      const normalized = normalizeArchiveNameKey(name);
      if (normalized && !lookup.has(normalized)) {
        lookup.set(normalized, entry);
      }
    });
  });

  return lookup;
}

const LINAJE_ARCHIVE_NAME_LOOKUP = buildLinajeArchiveNameLookup();

function findLinajeSlugByTokenId(tokenId) {
  const normalizedTokenId = (tokenId || '').toString().trim().toLowerCase();
  if (!normalizedTokenId) return '';

  return Object.entries(LINAJE_SLUG_INDEX || {}).find(([, txid]) => (
    (txid || '').toString().trim().toLowerCase() === normalizedTokenId
  ))?.[0] || '';
}

function buildResolvedLinajeRecord({ slug = '', txid = '', title = '' } = {}) {
  const normalizedSlug = slugify(slug || findLinajeSlugByTokenId(txid));
  const indexedTxid = normalizedSlug ? findLinajeTxidBySlug(normalizedSlug) : '';
  const normalizedTxid = [txid, indexedTxid]
    .find((value) => isHex64((value || '').toString().trim()));
  const safeTxid = normalizedTxid ? normalizedTxid.toString().trim().toLowerCase() : '';
  const editorialMeta = resolveLinajeMeta({ slug: normalizedSlug, txid: safeTxid });
  const displayTitle = editorialMeta?.title
    || editorialMeta?.nombreCompleto
    || editorialMeta?.name
    || title
    || normalizedSlug
    || shortHex(safeTxid, 10, 8);
  const resolvedImage = pickNftImageUrl({
    local: editorialMeta,
    debugLabel: `family-record:${normalizedSlug || safeTxid || displayTitle}`,
  });

  return {
    slug: normalizedSlug,
    txid: safeTxid,
    title: displayTitle || '',
    etapa: editorialMeta?.etapa || '',
    image: resolvedImage.url,
    tokenHref: safeTxid ? `/token/${safeTxid}` : '',
    lineageHref: normalizedSlug || safeTxid ? `/linaje/${normalizedSlug || safeTxid}` : '',
    collectionHref: normalizedSlug ? `/collection/xolosnft/${normalizedSlug}` : '',
    editorialMeta,
  };
}

function buildLocalLinajeFallbackRecord(identifier = '') {
  const rawIdentifier = (identifier || '').toString().trim();
  const slug = isHex64(rawIdentifier)
    ? findLinajeSlugByTokenId(rawIdentifier)
    : slugify(rawIdentifier);
  const editorialMeta = resolveLinajeMeta({ slug, txid: rawIdentifier });
  if (!editorialMeta) return null;

  const record = buildResolvedLinajeRecord({
    slug: editorialMeta.slug || slug,
    txid: editorialMeta.txid || editorialMeta.tokenId || rawIdentifier,
    title: editorialMeta.title || editorialMeta.nombreCompleto || rawIdentifier,
  });

  return {
    ...record,
    rawValue: rawIdentifier,
    indexedTxid: record.slug ? findLinajeTxidBySlug(record.slug) : '',
    parsed: null,
    opReturnText: '',
    sourceKind: 'local',
  };
}

function resolveLinajeMetaForToken({ tokenId = '', ipfsMeta = null, token = null } = {}) {
  const normalizedTokenId = (tokenId || '').toString().trim().toLowerCase();
  const direct = resolveLinajeMeta({ txid: normalizedTokenId });
  if (direct) return direct;

  const slugCandidates = [
    ipfsMeta?.slug,
    buildLinajeSlug({ NOMBRE: ipfsMeta?.name || '' }),
    buildLinajeSlug({ NOMBRE: token?.tokenName || token?.genesisInfo?.tokenName || '' }),
    slugify(ipfsMeta?.name || ''),
    slugify(token?.tokenName || token?.genesisInfo?.tokenName || ''),
  ].filter(Boolean);

  for (const slug of slugCandidates) {
    const match = resolveLinajeMeta({ slug, txid: normalizedTokenId });
    if (match) return match;
  }

  return null;
}

function resolveFamilyReference(rawValue) {
  const rawText = rawValue === undefined || rawValue === null ? '' : String(rawValue).trim();
  if (!rawText || rawText === '—') {
    return {
      rawValue: rawText,
      tokenId: '',
      txid: '',
      slug: '',
      title: '',
      etapa: '',
      image: '',
      tokenHref: '',
      lineageHref: '',
      collectionHref: '',
      resolved: false,
    };
  }

  if (isHex64(rawText)) {
    const record = buildResolvedLinajeRecord({ txid: rawText });
    return {
      rawValue: rawText,
      tokenId: record.txid,
      txid: record.txid,
      slug: record.slug,
      title: record.title || shortHex(rawText, 10, 8),
      etapa: record.etapa,
      image: record.image,
      tokenHref: record.tokenHref || `/token/${rawText.toLowerCase()}`,
      lineageHref: record.lineageHref,
      collectionHref: record.collectionHref,
      resolved: Boolean(record.txid || record.slug || record.editorialMeta),
    };
  }

  const slugCandidate = slugify(rawText);
  if (slugCandidate) {
    const record = buildResolvedLinajeRecord({ slug: slugCandidate, title: rawText });
    if (record.slug || record.txid || record.editorialMeta) {
      return {
        rawValue: rawText,
        tokenId: record.txid,
        txid: record.txid,
        slug: record.slug,
        title: record.title || rawText,
        etapa: record.etapa,
        image: record.image,
        tokenHref: record.tokenHref,
        lineageHref: record.lineageHref,
        collectionHref: record.collectionHref,
        resolved: true,
      };
    }
  }

  const archiveTarget = resolveParentLinajeTarget(rawText);
  if (archiveTarget) {
    const record = buildResolvedLinajeRecord({
      slug: archiveTarget.slug,
      txid: archiveTarget.txid,
      title: archiveTarget.title || rawText,
    });
    return {
      rawValue: rawText,
      tokenId: record.txid,
      txid: record.txid,
      slug: record.slug,
      title: record.title || rawText,
      etapa: record.etapa,
      image: record.image,
      tokenHref: record.tokenHref,
      lineageHref: record.lineageHref || archiveTarget.lineageHref || '',
      collectionHref: record.collectionHref || archiveTarget.collectionHref || '',
      resolved: true,
    };
  }

  return {
    rawValue: rawText,
    tokenId: '',
    txid: '',
    slug: slugCandidate,
    title: rawText,
    etapa: '',
    image: '',
    tokenHref: '',
    lineageHref: '',
    collectionHref: '',
    resolved: false,
  };
}

function buildRootFamilyNode({ tokenId = '', localMeta = null, ipfsMeta = null, token = null } = {}) {
  const slug = findLinajeSlugByTokenId(tokenId) || slugify(localMeta?.slug || ipfsMeta?.slug || '');
  const editorialMeta = resolveLinajeMeta({ slug, txid: tokenId }) || localMeta || null;
  const title = pickValueWithSource({
    local: editorialMeta?.title || editorialMeta?.nombreCompleto || editorialMeta?.name,
    ipfs: ipfsMeta?.name || ipfsMeta?.slug,
    onchain: token?.tokenName || token?.genesisInfo?.tokenName,
    fallback: shortHex(tokenId, 10, 8),
  }).value;
  const etapa = pickValueWithSource({
    local: editorialMeta?.etapa,
    ipfs: ipfsMeta?.etapa,
    onchain: '',
    fallback: '',
  }).value;
  const resolvedImage = pickNftImageUrl({
    local: editorialMeta || localMeta,
    ipfs: ipfsMeta,
    onchain: [token?.genesisInfo, token],
    debugLabel: `family-root:${tokenId || slug || title}`,
  });

  return {
    rawValue: tokenId,
    tokenId: (tokenId || '').toString().trim().toLowerCase(),
    txid: (tokenId || '').toString().trim().toLowerCase(),
    slug,
    title,
    etapa: etapa === '—' ? '' : etapa,
    image: resolvedImage.url,
    tokenHref: tokenId ? `/token/${tokenId}` : '',
    lineageHref: slug || tokenId ? `/linaje/${slug || tokenId}` : '',
    collectionHref: slug ? `/collection/xolosnft/${slug}` : '',
    resolved: Boolean(tokenId || slug),
    isRoot: true,
  };
}

function buildFamilyMatchKeys(...values) {
  const keys = new Set();

  values.forEach((value) => {
    if (!value) return;
    const text = String(value).trim();
    if (!text || text === '—') return;

    if (isHex64(text)) {
      keys.add(text.toLowerCase());
      const slugFromToken = findLinajeSlugByTokenId(text);
      if (slugFromToken) keys.add(slugFromToken);
    }

    const slug = slugify(text);
    if (slug) keys.add(slug);
    buildArchiveNameVariants(text).forEach((variant) => keys.add(variant));
  });

  return keys;
}

function collectDirectDescendants(rootNode) {
  if (!rootNode?.tokenId && !rootNode?.slug && !rootNode?.title) return [];

  const rootKeys = buildFamilyMatchKeys(rootNode.tokenId, rootNode.slug, rootNode.title, rootNode.rawValue);
  if (!rootKeys.size) return [];

  return Object.entries(LINAJE_EDITORIAL_META || {})
    .map(([metaSlug, meta]) => {
      if (!meta || typeof meta !== 'object') return null;

      const parentRefs = [meta.padre, meta.madre].filter(Boolean);
      if (!parentRefs.length) return null;

      const hasMatch = parentRefs.some((value) => {
        const valueKeys = buildFamilyMatchKeys(value);
        return Array.from(valueKeys).some((key) => rootKeys.has(key));
      });
      if (!hasMatch) return null;

      const record = buildResolvedLinajeRecord({
        slug: meta.slug || metaSlug,
        txid: meta.txid || meta.tokenId || meta.nftTokenId,
      });

      return {
        rawValue: record.txid || record.slug || metaSlug,
        tokenId: record.txid,
        txid: record.txid,
        slug: record.slug,
        title: record.title,
        etapa: record.etapa,
        image: record.image,
        tokenHref: record.tokenHref,
        lineageHref: record.lineageHref,
        collectionHref: record.collectionHref,
        resolved: true,
      };
    })
    .filter(Boolean)
    .filter((entry, index, list) => list.findIndex((candidate) => (
      `${candidate.tokenId || ''}|${candidate.slug || ''}|${candidate.title || ''}`
      === `${entry.tokenId || ''}|${entry.slug || ''}|${entry.title || ''}`
    )) === index)
    .sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }));
}

function resolveParentLinajeTarget(rawName) {
  if (!rawName || typeof rawName !== 'string') return null;

  const variants = buildArchiveNameVariants(rawName);
  for (const variant of variants) {
    const match = LINAJE_ARCHIVE_NAME_LOOKUP.get(variant);
    if (match) return match;
  }

  return null;
}

function hasMeaningfulValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return Boolean(value.trim());
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function pickValueWithSource({ local, ipfs, onchain, fallback = '' }) {
  if (hasMeaningfulValue(local)) return { value: local, source: 'local' };
  if (hasMeaningfulValue(ipfs)) return { value: ipfs, source: 'ipfs' };
  if (hasMeaningfulValue(onchain)) return { value: onchain, source: 'onchain' };
  return { value: fallback, source: 'fallback' };
}

function normalizeMetadataTags(input) {
  if (Array.isArray(input)) {
    return input
      .map((entry) => (entry === null || entry === undefined ? '' : String(entry).trim()))
      .filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeMetadataFieldKey(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalMetadataFieldKey(value) {
  const normalized = normalizeMetadataFieldKey(value);
  if (!normalized) return '';
  const compact = normalized.replace(/\s+/g, '');
  const aliasMap = {
    parent: 'padre',
    registrofcm: 'registro fcm',
    registrofederacioncaninamexicana: 'registro fcm',
    microchipid: 'microchip',
  };
  return aliasMap[compact] || normalized;
}

function hasRenderableMetadataValue(value) {
  if (!hasMeaningfulValue(value)) return false;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return Boolean(trimmed) && trimmed !== '—';
  }
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function formatMetadataAttributeValue(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (entry === undefined || entry === null) return '';
        if (typeof entry === 'object') return '';
        return String(entry).trim();
      })
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'object') {
    try {
      const keys = Object.keys(value);
      if (!keys.length) return '';
      return safeStringify(value);
    } catch {
      return '';
    }
  }
  return String(value).trim();
}

function buildEmptyIpfsState(tokenId = '', documentUrl = '') {
  return {
    ok: false,
    attempted: false,
    metadata: null,
    rawText: '',
    tokenMeta: null,
    documentUrl,
    resolvedUrl: '',
    tokenId,
    error: '',
  };
}

async function loadTokenIpfsMetadata(tokenId, seedTokenMeta = null) {
  const normalizedTokenId = (tokenId || '').toString().trim().toLowerCase();
  const seedDocumentUrl = extractTokenDocumentUrl(seedTokenMeta);

  if (normalizedTokenId && tokenIpfsMetadataByIdCache.has(normalizedTokenId)) {
    const cached = tokenIpfsMetadataByIdCache.get(normalizedTokenId);
    if (!seedDocumentUrl || cached?.documentUrl === seedDocumentUrl) {
      return cached;
    }
  }

  if (normalizedTokenId && tokenIpfsMetadataPromiseById.has(normalizedTokenId)) {
    return tokenIpfsMetadataPromiseById.get(normalizedTokenId);
  }

  const loadPromise = (async () => {
    let tokenMeta = seedTokenMeta;
    let documentUrl = seedDocumentUrl;

    if (!tokenMeta && normalizedTokenId) {
      try {
        tokenMeta = await chronik.token(normalizedTokenId);
        documentUrl = extractTokenDocumentUrl(tokenMeta);
      } catch {
        tokenMeta = null;
      }
    }

    if (!documentUrl) {
      const empty = buildEmptyIpfsState(normalizedTokenId, '');
      if (normalizedTokenId) tokenIpfsMetadataByIdCache.set(normalizedTokenId, empty);
      return empty;
    }

    const metadataResult = await fetchIpfsMetadataByDocumentUrl(documentUrl);
    const merged = {
      ...metadataResult,
      tokenMeta,
      tokenId: normalizedTokenId,
      documentUrl: metadataResult.documentUrl || documentUrl,
    };

    if (normalizedTokenId) tokenIpfsMetadataByIdCache.set(normalizedTokenId, merged);
    return merged;
  })().finally(() => {
    if (normalizedTokenId) tokenIpfsMetadataPromiseById.delete(normalizedTokenId);
  });

  if (normalizedTokenId) tokenIpfsMetadataPromiseById.set(normalizedTokenId, loadPromise);
  return loadPromise;
}

function useTokenIpfsMetadata(tokenId, tokenMeta = null) {
  const normalizedTokenId = (tokenId || '').toString().trim().toLowerCase();
  const documentUrl = extractTokenDocumentUrl(tokenMeta);
  const [state, setState] = React.useState(
    normalizedTokenId && tokenIpfsMetadataByIdCache.has(normalizedTokenId)
      ? tokenIpfsMetadataByIdCache.get(normalizedTokenId)
      : buildEmptyIpfsState(normalizedTokenId, documentUrl),
  );

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      const next = await loadTokenIpfsMetadata(normalizedTokenId, tokenMeta);
      if (mounted) setState(next);
    }

    if (normalizedTokenId || documentUrl) {
      load();
    } else {
      setState(buildEmptyIpfsState('', ''));
    }

    return () => { mounted = false; };
  }, [normalizedTokenId, documentUrl, tokenMeta]);

  return state;
}

function buildLinajeSlug(parsed) {
  const nameSlug = slugify(parsed?.NOMBRE || '');
  if (!nameSlug) return '';
  if (nameSlug.endsWith('-ramirez') || nameSlug === 'ramirez') return nameSlug;
  return `${nameSlug}-ramirez`;
}

function extractLinajeRecordsFromTx(tx) {
  return (tx?.outputs || [])
    .filter((o) => isOpReturn(o.outputScript))
    .map((o) => {
      const text = extractOpReturnText(o.outputScript);
      const parsed = parseLinajeRecord(text);
      return {
        text,
        parsed,
        slug: buildLinajeSlug(parsed),
      };
    })
    .filter((op) => isXolosLinajeRecord(op.text));
}

function enrichLinajeRecord(record, txid) {
  const slug = record?.slug || buildLinajeSlug(record?.parsed);
  const indexedTxid = slug ? findLinajeTxidBySlug(slug) : '';
  const editorialMeta = resolveLinajeMeta({ slug, txid });
  return {
    ...record,
    slug,
    indexedTxid,
    editorialMeta,
  };
}

function buildLocalLinajeGalleryRecords() {
  return Object.entries(LINAJE_EDITORIAL_META || {})
    .map(([metaSlug, meta], index) => {
      if (!meta || typeof meta !== 'object') return null;

      const record = buildLocalLinajeFallbackRecord(meta.slug || metaSlug || meta.txid || meta.tokenId || '');
      if (!record) return null;

      const sexoValue = meta?.sexo || '';
      const variedadValue = meta?.variedad || '';
      const tags = Array.isArray(meta?.tags) ? meta.tags.join(' ') : '';
      const searchText = [
        record.slug,
        record.txid,
        meta?.title,
        meta?.nombreCompleto,
        meta?.subtitle,
        meta?.color,
        meta?.variedad,
        meta?.sexo,
        tags,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return {
        id: `local-${record.txid || record.slug || index}`,
        tx: record.txid ? { txid: record.txid, block: null } : null,
        index,
        parsed: null,
        slug: record.slug,
        indexedTxid: record.indexedTxid,
        editorialMeta: meta,
        opReturnText: '',
        sexoFilter: normalizeSexoFilterValue(sexoValue),
        variedadFilter: (variedadValue || '').toString().trim().toLowerCase(),
        hasIndexedSlug: isHex64(record.indexedTxid),
        searchText,
        sourceKind: 'local',
      };
    })
    .filter(Boolean);
}

async function fetchRecentLinajeMatches(maxBlocks = 20, txPageSize = 25) {
  const tip = await chronik.blockchainInfo();
  const tipHeight = tip.tipHeight;

  const heights = [];
  for (let h = tipHeight; h > Math.max(0, tipHeight - (maxBlocks - 1)); h--) {
    heights.push(h);
  }

  const txPages = await Promise.all(
    heights.map((h) => chronik.blockTxs(h.toString(), 0, txPageSize))
  );

  const allTxs = txPages.flatMap((page) => page.txs || []);

  return allTxs
    .map((tx) => ({
      tx,
      opReturns: extractLinajeRecordsFromTx(tx),
    }))
    .filter((item) => item.opReturns.length > 0);
}

function Box({ children, style = {} }) {
  return (
    <div
      style={{
        border: '1px solid #00eaff',
        padding: '14px',
        background: '#0b0b0b',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Shell({ children }) {
  return <AppShell>{children}</AppShell>;
}

function SearchBar() {
  return <AccessibleSearchBar detectQueryType={detectQueryType} />;
}

function LoadingBox({ text = 'Cargando datos de blockchain...' }) {
  return <PageSkeleton text={text} />;
}

function ErrorBox({ error }) {
  return <PageStatus type="error">{error}</PageStatus>;
}

function StatGrid({ items }) {
  return (
    <div
      style={{
        marginTop: '24px',
        display: 'grid',
        gap: '12px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      }}
    >
      {items.map((item, i) => (
        <Box key={i}>
          <div style={{ color: '#8ff7ff', marginBottom: '8px' }}>{item.label}</div>
          <strong style={{ wordBreak: 'break-word' }}>{item.value}</strong>
        </Box>
      ))}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 style={{ marginTop: '28px', marginBottom: '12px' }}>{children}</h2>;
}

function formatFamilyDisplayValue(value) {
  if (!hasRenderableMetadataValue(value)) return '—';
  const target = resolveFamilyReference(value);
  if (target?.resolved && target?.title) return target.title;
  return value;
}

function LinajeCard({
  tx,
  opReturnText,
  parsed,
  slug = '',
  editorialMeta = null,
  indexedTxid = '',
  showDetailLink = true,
  sourceKind = 'official',
}) {
  const sexoMap = {
    H: 'Hembra',
    M: 'Macho',
  };
  const [imageFailed, setImageFailed] = React.useState(false);

  const resolvedSlug = slug || buildLinajeSlug(parsed);
  const resolvedTxid = tx?.txid || editorialMeta?.txid || editorialMeta?.tokenId || indexedTxid || '';
  const localMeta = editorialMeta || resolveLinajeMeta({ slug: resolvedSlug, txid: resolvedTxid });
  const displayName = localMeta?.title || localMeta?.nombreCompleto || parsed?.NOMBRE || 'Sin nombre';
  const displaySexo = localMeta?.sexo || (parsed?.SEXO ? sexoMap[parsed.SEXO] || parsed.SEXO : '—');
  const resolvedImage = React.useMemo(
    () => pickNftImageUrl({ local: localMeta, debugLabel: `linaje-card:${resolvedSlug || tx?.txid || displayName}` }),
    [displayName, localMeta, resolvedSlug, tx?.txid],
  );
  const mediaUrl = resolvedImage.url;
  const placeholderText = localMeta?.imagePlaceholder || (displayName ? displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() : 'XOLO');
  const imageAlt = localMeta?.imageAlt || `Retrato de ${displayName}`;
  const showImage = Boolean(mediaUrl) && !imageFailed;
  const detailPath = resolvedSlug ? `/linaje/${resolvedSlug}` : (resolvedTxid ? `/linaje/${resolvedTxid}` : '');
  const localIndexTxid = indexedTxid || (resolvedSlug ? findLinajeTxidBySlug(resolvedSlug) : '');
  const hasIndexedSlug = isHex64(localIndexTxid);
  const ficha = {
    nombreCompleto: localMeta?.nombreCompleto || parsed?.NOMBRE || '—',
    afijo: localMeta?.afijo || '—',
    variedad: localMeta?.variedad || parsed?.VAR || '—',
    color: localMeta?.color || parsed?.COLOR || '—',
    sexo: displaySexo || '—',
    lugarNacimiento: localMeta?.lugarNacimiento || parsed?.LUGAR || '—',
    fechaNacimiento: localMeta?.fechaNacimiento || parsed?.NAC || '—',
    criador: localMeta?.criador || '—',
    padre: formatFamilyDisplayValue(localMeta?.padre),
    madre: formatFamilyDisplayValue(localMeta?.madre),
    camada: localMeta?.camada || '—',
    microchip: localMeta?.microchip || '—',
    registroFCM: localMeta?.registroFCM || '—',
    entregaEstado: localMeta?.entregaEstado || '—',
    nftLinaje: localMeta?.nftLinaje || '—',
  };
  const editorialText = localMeta?.narrative || localMeta?.nota || '';
  const linkEntries = Array.isArray(localMeta?.links)
    ? localMeta.links
      .filter((item) => item?.href)
      .map((item) => ({ label: item?.label || item?.href, href: item?.href }))
    : Object.entries(localMeta?.links || {})
      .filter(([, href]) => typeof href === 'string' && href.trim())
      .map(([key, href]) => ({ label: key, href }));

  React.useEffect(() => {
    setImageFailed(false);
  }, [mediaUrl]);

  return (
    <div
      style={{
        border: '1px solid #00eaff',
        background: 'linear-gradient(145deg, #071319 0%, #0b0b0b 55%, #0f1e24 100%)',
        boxShadow: '0 0 0 1px #09333a inset, 0 0 18px rgba(0, 234, 255, 0.14)',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: '#8ff7ff', fontSize: '0.85rem', letterSpacing: '0.04em' }}>
            {sourceKind === 'local' ? 'FICHA LOCAL DE ARCHIVO' : 'FICHA OFICIAL DE LINAJE'}
          </div>
          <h3 style={{ margin: '6px 0 0', fontSize: '1.4rem', color: '#d6ffff' }}>{displayName}</h3>
          {localMeta?.subtitle && (
            <div style={{ marginTop: '6px', color: '#8ff7ff', fontSize: '0.95rem' }}>{localMeta.subtitle}</div>
          )}
        </div>
        <div
          style={{
            border: '1px solid #2f6f7a',
            background: '#0a1b20',
            color: '#7dffe4',
            padding: '6px 10px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}
        >
          {sourceKind === 'local' ? 'ARCHIVO LOCAL' : 'XOLO | RAMIREZ'}
        </div>
      </div>

      <div
        style={{
          marginTop: '14px',
          border: '1px solid #1c515b',
          background: 'radial-gradient(circle at 20% 20%, #124a55 0%, #0a1b20 45%, #061115 100%)',
          minHeight: '200px',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        {showImage ? (
          <img
            src={mediaUrl}
            alt={imageAlt}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', maxHeight: '320px', objectFit: 'cover', display: 'block' }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div style={{ color: '#9bdfff', letterSpacing: '0.12em', fontSize: '1.15rem' }}>
            {placeholderText || 'XOLO'}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: '14px',
          display: 'grid',
          gap: '10px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        }}
      >
        <Box style={{ background: 'rgba(1, 34, 40, 0.55)', borderColor: '#1c515b', padding: '10px' }}>
          <div style={{ color: '#8ff7ff', fontSize: '0.85rem' }}>Nombre completo</div>
          <strong>{ficha.nombreCompleto}</strong>
        </Box>
        <Box style={{ background: 'rgba(1, 34, 40, 0.55)', borderColor: '#1c515b', padding: '10px' }}>
          <div style={{ color: '#8ff7ff', fontSize: '0.85rem' }}>Afijo</div>
          <strong>{ficha.afijo}</strong>
        </Box>
        <Box style={{ background: 'rgba(1, 34, 40, 0.55)', borderColor: '#1c515b', padding: '10px' }}>
          <div style={{ color: '#8ff7ff', fontSize: '0.85rem' }}>Sexo</div>
          <strong>{ficha.sexo}</strong>
        </Box>
        <Box style={{ background: 'rgba(1, 34, 40, 0.55)', borderColor: '#1c515b', padding: '10px' }}>
          <div style={{ color: '#8ff7ff', fontSize: '0.85rem' }}>Color</div>
          <strong>{ficha.color}</strong>
        </Box>
        <Box style={{ background: 'rgba(1, 34, 40, 0.55)', borderColor: '#1c515b', padding: '10px' }}>
          <div style={{ color: '#8ff7ff', fontSize: '0.85rem' }}>Variedad</div>
          <strong>{ficha.variedad}</strong>
        </Box>
        <Box style={{ background: 'rgba(1, 34, 40, 0.55)', borderColor: '#1c515b', padding: '10px' }}>
          <div style={{ color: '#8ff7ff', fontSize: '0.85rem' }}>Fecha de nacimiento</div>
          <strong>{ficha.fechaNacimiento}</strong>
        </Box>
        <Box style={{ background: 'rgba(1, 34, 40, 0.55)', borderColor: '#1c515b', padding: '10px' }}>
          <div style={{ color: '#8ff7ff', fontSize: '0.85rem' }}>Lugar de nacimiento</div>
          <strong>{ficha.lugarNacimiento}</strong>
        </Box>
        <Box style={{ background: 'rgba(1, 34, 40, 0.55)', borderColor: '#1c515b', padding: '10px' }}>
          <div style={{ color: '#8ff7ff', fontSize: '0.85rem' }}>Criador</div>
          <strong>{ficha.criador}</strong>
        </Box>
      </div>

      <div
        style={{
          marginTop: '10px',
          display: 'grid',
          gap: '10px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        }}
      >
        <Box style={{ background: 'rgba(1, 34, 40, 0.55)', borderColor: '#1c515b', padding: '10px' }}>
          <div style={{ color: '#8ff7ff', fontSize: '0.85rem' }}>Padre</div>
          <strong>{ficha.padre}</strong>
        </Box>
        <Box style={{ background: 'rgba(1, 34, 40, 0.55)', borderColor: '#1c515b', padding: '10px' }}>
          <div style={{ color: '#8ff7ff', fontSize: '0.85rem' }}>Madre</div>
          <strong>{ficha.madre}</strong>
        </Box>
        <Box style={{ background: 'rgba(1, 34, 40, 0.55)', borderColor: '#1c515b', padding: '10px' }}>
          <div style={{ color: '#8ff7ff', fontSize: '0.85rem' }}>Camada</div>
          <strong>{ficha.camada}</strong>
        </Box>
        <Box style={{ background: 'rgba(1, 34, 40, 0.55)', borderColor: '#1c515b', padding: '10px' }}>
          <div style={{ color: '#8ff7ff', fontSize: '0.85rem' }}>Microchip</div>
          <strong>{ficha.microchip}</strong>
        </Box>
        <Box style={{ background: 'rgba(1, 34, 40, 0.55)', borderColor: '#1c515b', padding: '10px' }}>
          <div style={{ color: '#8ff7ff', fontSize: '0.85rem' }}>Registro FCM</div>
          <strong>{ficha.registroFCM}</strong>
        </Box>
        <Box style={{ background: 'rgba(1, 34, 40, 0.55)', borderColor: '#1c515b', padding: '10px' }}>
          <div style={{ color: '#8ff7ff', fontSize: '0.85rem' }}>Estado de entrega</div>
          <strong>{ficha.entregaEstado}</strong>
        </Box>
        <Box style={{ background: 'rgba(1, 34, 40, 0.55)', borderColor: '#1c515b', padding: '10px' }}>
          <div style={{ color: '#8ff7ff', fontSize: '0.85rem' }}>NFT linaje</div>
          <strong>{ficha.nftLinaje}</strong>
        </Box>
      </div>

      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #17444d' }}>
        {resolvedSlug && (
          <div style={{ color: '#8ff7ff' }}>
            <strong>Slug narrativo:</strong> {resolvedSlug}
          </div>
        )}
        <div style={{ marginTop: '6px', color: '#8ff7ff' }}>
          <strong>Índice local:</strong> {hasIndexedSlug ? 'Vinculado' : 'Sin vínculo'}
        </div>
        <div style={{ marginTop: '6px', color: '#8ff7ff' }}>
          <strong>Capa editorial local:</strong> {localMeta ? 'Disponible' : 'No encontrada'}
        </div>
        <div style={{ color: '#8ff7ff' }}>
          <strong>TXID:</strong> {resolvedTxid ? <TxLink txid={resolvedTxid} /> : '—'}
        </div>
        <div style={{ marginTop: '6px', color: '#8ff7ff' }}>
          <strong>Bloque:</strong>{' '}
          {tx?.block?.height !== undefined ? (
            <BlockLink hashOrHeight={tx.block.height}>{tx.block.height}</BlockLink>
          ) : (sourceKind === 'local' ? 'Archivo local' : 'Mempool')}
        </div>
        {showDetailLink && detailPath && (
          <div style={{ marginTop: '8px' }}>
            <Link to={detailPath} style={{ color: '#7dffe4' }}>
              Ver registro individual
            </Link>
          </div>
        )}
      </div>

      {editorialText && (
        <Box style={{ marginTop: '12px', background: 'rgba(1, 34, 40, 0.55)', borderColor: '#1c515b', padding: '10px' }}>
          <div style={{ color: '#8ff7ff', fontSize: '0.85rem', marginBottom: '6px' }}>Capa editorial</div>
          <div style={{ color: '#d6ffff', lineHeight: 1.45 }}>{editorialText}</div>
        </Box>
      )}

      {Array.isArray(localMeta?.tags) && localMeta.tags.length > 0 && (
        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {localMeta.tags.map((tag) => (
            <span
              key={tag}
              style={{
                border: '1px solid #1c515b',
                background: '#0a1b20',
                color: '#7dffe4',
                padding: '4px 8px',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {linkEntries.length > 0 && (
        <div style={{ marginTop: '10px', display: 'grid', gap: '6px' }}>
          {linkEntries.map((item) => (
            <a
              key={`${item?.label || 'link'}-${item?.href || ''}`}
              href={item?.href}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#7dffe4', wordBreak: 'break-word' }}
            >
              {item?.label || item?.href}
            </a>
          ))}
        </div>
      )}

      <details style={{ marginTop: '12px' }}>
        <summary style={{ cursor: 'pointer', color: '#9bdfff' }}>Ver OP_RETURN completo</summary>
        <div
          style={{
            marginTop: '8px',
            padding: '10px',
            border: '1px solid #1c4048',
            background: '#081316',
            color: '#ffd37a',
            wordBreak: 'break-word',
            fontSize: '0.9rem',
          }}
        >
          {opReturnText}
        </div>
      </details>
    </div>
  );
}

function normalizeSexoFilterValue(value) {
  const raw = (value || '').toString().trim().toLowerCase();
  if (!raw) return 'desconocido';
  if (raw === 'h' || raw === 'hembra') return 'hembra';
  if (raw === 'm' || raw === 'macho') return 'macho';
  return 'desconocido';
}

function LinajeGalleryCard({ record }) {
  const sexoMap = { H: 'Hembra', M: 'Macho' };
  const [imageFailed, setImageFailed] = React.useState(false);
  const tx = record?.tx || null;
  const parsed = record?.parsed || null;
  const opReturnText = record?.opReturnText || record?.text || '';
  const resolvedSlug = record?.slug || buildLinajeSlug(parsed);
  const localMeta = record?.editorialMeta || resolveLinajeMeta({ slug: resolvedSlug, txid: tx?.txid });
  const indexedTxid = record?.indexedTxid || (resolvedSlug ? findLinajeTxidBySlug(resolvedSlug) : '');
  const displayName = localMeta?.title || localMeta?.nombreCompleto || parsed?.NOMBRE || 'Sin nombre';
  const displaySexo = localMeta?.sexo || (parsed?.SEXO ? sexoMap[parsed.SEXO] || parsed.SEXO : '—');
  const displayVariedad = localMeta?.variedad || parsed?.VAR || '—';
  const displayColor = localMeta?.color || parsed?.COLOR || '—';
  const hasIndexedSlug = isHex64(indexedTxid);
  const detailPath = resolvedSlug ? `/linaje/${resolvedSlug}` : `/linaje/${tx?.txid || ''}`;
  const resolvedImage = React.useMemo(
    () => pickNftImageUrl({ local: localMeta, debugLabel: `linaje-gallery:${resolvedSlug || tx?.txid || displayName}` }),
    [displayName, localMeta, resolvedSlug, tx?.txid],
  );
  const mediaUrl = resolvedImage.url;
  const placeholderText = localMeta?.imagePlaceholder || (displayName ? displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() : 'XOLO');
  const imageAlt = localMeta?.imageAlt || `Retrato de ${displayName}`;
  const showImage = Boolean(mediaUrl) && !imageFailed;
  const tags = Array.isArray(localMeta?.tags) ? localMeta.tags.filter(Boolean).slice(0, 3) : [];

  React.useEffect(() => {
    setImageFailed(false);
  }, [mediaUrl]);

  return (
    <article
      style={{
        border: '1px solid #00eaff',
        background: 'linear-gradient(145deg, #071319 0%, #0b0b0b 55%, #0f1e24 100%)',
        boxShadow: '0 0 0 1px #09333a inset, 0 0 18px rgba(0, 234, 255, 0.14)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '140px',
          borderBottom: '1px solid #1c515b',
          background: 'radial-gradient(circle at 20% 20%, #124a55 0%, #0a1b20 45%, #061115 100%)',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        {showImage ? (
          <img
            src={mediaUrl}
            alt={imageAlt}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div style={{ color: '#9bdfff', letterSpacing: '0.12em', fontSize: '0.95rem' }}>
            {placeholderText || 'XOLO'}
          </div>
        )}
      </div>

      <div style={{ padding: '12px' }}>
        <div style={{ color: '#8ff7ff', fontSize: '0.78rem', letterSpacing: '0.05em' }}>
          ARCHIVO DEL LINAJE VIVO
        </div>
        <h3 style={{ margin: '6px 0 0', fontSize: '1.1rem', color: '#d6ffff', lineHeight: 1.2 }}>{displayName}</h3>

        {localMeta?.subtitle && (
          <div style={{ marginTop: '6px', color: '#8ff7ff', fontSize: '0.88rem' }}>{localMeta.subtitle}</div>
        )}

        <div style={{ marginTop: '10px', display: 'grid', gap: '6px', fontSize: '0.9rem', color: '#c3fbff' }}>
          <div><strong style={{ color: '#8ff7ff' }}>Sexo:</strong> {displaySexo}</div>
          <div><strong style={{ color: '#8ff7ff' }}>Variedad:</strong> {displayVariedad}</div>
          <div><strong style={{ color: '#8ff7ff' }}>Color:</strong> {displayColor}</div>
        </div>

        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              border: '1px solid #1c515b',
              background: '#0a1b20',
              color: '#7dffe4',
              padding: '3px 8px',
              fontSize: '0.72rem',
              textTransform: 'uppercase',
            }}
          >
            {hasIndexedSlug ? 'Índice: vinculado' : 'Índice: sin vínculo'}
          </span>
          {resolvedSlug && (
            <span
              style={{
                border: '1px solid #1c515b',
                background: '#0a1b20',
                color: '#7dffe4',
                padding: '3px 8px',
                fontSize: '0.72rem',
              }}
            >
              {resolvedSlug}
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  border: '1px solid #16424a',
                  color: '#8ff7ff',
                  background: 'rgba(1, 34, 40, 0.55)',
                  padding: '2px 7px',
                  fontSize: '0.72rem',
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ marginTop: '10px', color: '#8ff7ff', fontSize: '0.8rem' }}>
          <strong>TX:</strong> {tx?.txid ? shortHex(tx.txid, 12, 10) : 'Archivo local'}
        </div>
        <div style={{ marginTop: '4px', color: '#8ff7ff', fontSize: '0.8rem' }}>
          <strong>Bloque:</strong> {tx?.block?.height !== undefined ? tx.block.height : 'Mempool'}
        </div>

        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <Link to={detailPath} style={{ color: '#7dffe4' }}>
            Abrir ficha
          </Link>
          <details>
            <summary style={{ cursor: 'pointer', color: '#9bdfff', fontSize: '0.85rem' }}>OP_RETURN</summary>
            <div
              style={{
                marginTop: '8px',
                padding: '8px',
                border: '1px solid #1c4048',
                background: '#081316',
                color: '#ffd37a',
                wordBreak: 'break-word',
                fontSize: '0.8rem',
                maxWidth: '420px',
              }}
            >
              {opReturnText || '—'}
            </div>
          </details>
        </div>
      </div>
    </article>
  );
}

function TxLink({ txid }) {
  return (
    <Link to={`/tx/${txid}`} style={{ color: '#00eaff' }}>
      {shortHex(txid, 18, 14)}
    </Link>
  );
}

function BlockLink({ hashOrHeight, children }) {
  return (
    <Link to={`/block/${hashOrHeight}`} style={{ color: '#00eaff' }}>
      {children || hashOrHeight}
    </Link>
  );
}

function AddressLink({ address }) {
  return (
    <Link to={`/address/${encodeURIComponent(address)}`} style={{ color: '#00eaff', wordBreak: 'break-word' }}>
      {address}
    </Link>
  );
}

function TokenLink({ tokenId, children }) {
  return (
    <Link to={`/token/${tokenId}`} style={{ color: '#00eaff', wordBreak: 'break-word' }}>
      {children || shortHex(tokenId, 18, 14)}
    </Link>
  );
}

function buildCollectibleInitials(label, tokenId) {
  const base = (label || '').trim();
  if (base) {
    const tokens = base.split(/\s+/).filter(Boolean);
    if (tokens.length > 1) return `${tokens[0][0] || ''}${tokens[1][0] || ''}`.toUpperCase();
    return base.slice(0, 2).toUpperCase();
  }
  return shortHex(tokenId, 2, 0).toUpperCase();
}

const XOLO_ARCHIVE_THEME_KEYS = Object.freeze(['obsidian', 'codex', 'jade', 'ritual', 'neon']);

function normalizeXoloArchiveTheme(value) {
  if (!value || typeof value !== 'string') return 'codex';
  const normalized = value.trim().toLowerCase();
  return XOLO_ARCHIVE_THEME_KEYS.includes(normalized) ? normalized : 'codex';
}

function buildXoloArchiveThemeStyles(theme = 'codex', accent = '') {
  const themes = {
    obsidian: {
      border: '#555b74',
      articleBg: 'linear-gradient(165deg, #08090d 0%, #121722 54%, #1a2234 100%)',
      articleShadow: '0 0 0 1px #2f3a58 inset, 0 0 34px rgba(120, 142, 201, 0.2)',
      frameBorder: '#4f5f8c',
      frameBg: 'radial-gradient(circle at 16% 10%, #3b4669 0%, #181f2f 45%, #0b0d12 100%)',
      label: '#adb8e0',
      value: '#eef1ff',
      panelBg: 'rgba(15, 18, 28, 0.82)',
      panelTitle: '#cad5ff',
      narrative: '#e6ecff',
      linkBorder: '#7588cc',
      linkBg: '#172039',
      linkColor: '#e8eeff',
      breadcrumb: '#beccff',
      placeholder: '#e8eeff',
    },
    codex: {
      border: '#00eaff',
      articleBg: 'linear-gradient(165deg, #050e13 0%, #0a1a22 48%, #0d2731 100%)',
      articleShadow: '0 0 0 1px #103d46 inset, 0 0 34px rgba(0, 234, 255, 0.16)',
      frameBorder: '#1f6570',
      frameBg: 'radial-gradient(circle at 20% 15%, #1a5d66 0%, #0d1d24 46%, #061015 100%)',
      label: '#79ced6',
      value: '#d7fbff',
      panelBg: 'rgba(7, 24, 30, 0.72)',
      panelTitle: '#86eaf2',
      narrative: '#caf9ff',
      linkBorder: '#2abfce',
      linkBg: '#0a1c22',
      linkColor: '#b4fbff',
      breadcrumb: '#7dffe4',
      placeholder: '#9feeff',
    },
    jade: {
      border: '#46c08a',
      articleBg: 'linear-gradient(160deg, #05110b 0%, #0e2718 50%, #1e3a24 100%)',
      articleShadow: '0 0 0 1px #205437 inset, 0 0 34px rgba(70, 192, 138, 0.2)',
      frameBorder: '#3f9368',
      frameBg: 'radial-gradient(circle at 24% 12%, #4aa778 0%, #1d3a28 48%, #08140d 100%)',
      label: '#9de4bf',
      value: '#e2ffe8',
      panelBg: 'rgba(11, 34, 21, 0.78)',
      panelTitle: '#84f2bd',
      narrative: '#d4ffe5',
      linkBorder: '#4cb87f',
      linkBg: '#0f2c1d',
      linkColor: '#d9ffe5',
      breadcrumb: '#8ff8c3',
      placeholder: '#d9ffe5',
    },
    ritual: {
      border: '#d2b56c',
      articleBg: 'linear-gradient(160deg, #120b04 0%, #26170b 52%, #3f2a16 100%)',
      articleShadow: '0 0 0 1px #624321 inset, 0 0 34px rgba(223, 187, 104, 0.24)',
      frameBorder: '#94703a',
      frameBg: 'radial-gradient(circle at 20% 10%, #ba9650 0%, #47301a 50%, #1a0f08 100%)',
      label: '#efd9a6',
      value: '#fff3d3',
      panelBg: 'rgba(39, 24, 11, 0.76)',
      panelTitle: '#ffd68e',
      narrative: '#ffeec2',
      linkBorder: '#c89f51',
      linkBg: '#2c1a0e',
      linkColor: '#ffe7b3',
      breadcrumb: '#ffd98f',
      placeholder: '#ffe7b3',
    },
    neon: {
      border: '#4cff8f',
      articleBg: 'linear-gradient(164deg, #040d10 0%, #0a1d2a 44%, #1a1240 100%)',
      articleShadow: '0 0 0 1px #345f7a inset, 0 0 34px rgba(76, 255, 143, 0.2)',
      frameBorder: '#45bb93',
      frameBg: 'radial-gradient(circle at 22% 11%, #53ffb5 0%, #15374a 45%, #09071a 100%)',
      label: '#8dffd4',
      value: '#ddffec',
      panelBg: 'rgba(8, 27, 38, 0.78)',
      panelTitle: '#82ffd0',
      narrative: '#d5ffee',
      linkBorder: '#42e2ad',
      linkBg: '#0e2230',
      linkColor: '#d5ffee',
      breadcrumb: '#88ffd0',
      placeholder: '#d5ffee',
    },
  };
  const palette = themes[normalizeXoloArchiveTheme(theme)] || themes.codex;
  const accentColor = typeof accent === 'string' && accent.trim() ? accent.trim() : palette.border;
  return {
    ...palette,
    border: accentColor,
    linkBorder: accentColor,
    breadcrumb: accentColor,
  };
}

function buildXoloNftCollectionItems() {
  return Object.entries(LINAJE_EDITORIAL_META || {})
    .map(([metaSlug, meta]) => {
      if (!meta || typeof meta !== 'object') return null;

      const normalizedSlug = slugify(metaSlug || meta.slug || '');
      const indexedTxid = normalizedSlug ? findLinajeTxidBySlug(normalizedSlug) : '';
      const tokenIdCandidate = [
        meta.tokenId,
        meta.nftTokenId,
        meta.token?.tokenId,
        meta.txid,
        indexedTxid,
      ].find((value) => isHex64((value || '').toString().trim()));
      const tokenId = tokenIdCandidate ? tokenIdCandidate.toString().trim().toLowerCase() : '';
      const title = meta.title || meta.nombreCompleto || normalizedSlug || 'Sin titulo';
      const subtitle = meta.subtitle && meta.subtitle !== title ? meta.subtitle : '';
      const narrative = meta.narrative || meta.nota || meta.subtitle || '';
      const tokenSymbol = meta.tokenSymbol || meta.symbol || meta.tokenTicker || '';
      const tokenName = meta.tokenName || meta.name || meta.token?.tokenName || '';
      const lineageRef = normalizedSlug || (isHex64(meta.txid || '') ? meta.txid : '');
      const theme = normalizeXoloArchiveTheme(meta.theme);
      const accent = typeof meta.accent === 'string' ? meta.accent.trim() : '';
      const backgroundNote = typeof meta.backgroundNote === 'string' ? meta.backgroundNote.trim() : '';
      const etapa = typeof meta.etapa === 'string' ? meta.etapa.trim() : '';
      const tags = normalizeMetadataTags(meta.tags);

      return {
        id: `${normalizedSlug || tokenId || title}`,
        title,
        subtitle,
        slug: normalizedSlug,
        editorialMeta: meta,
        tokenId,
        tokenSymbol,
        tokenName,
        narrative,
        lineageRef,
        theme,
        accent,
        backgroundNote,
        etapa,
        tags,
        imageUrl: pickNftImageUrl({ local: meta, debugLabel: `collection-item:${normalizedSlug || tokenId || title}` }).url,
        imageAlt: meta.imageAlt || `Imagen de ${title}`,
        searchText: `${title} ${subtitle} ${normalizedSlug} ${tokenSymbol} ${tokenName} ${narrative} ${etapa} ${tags.join(' ')}`.toLowerCase(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }));
}

function resolveCollectionDisplayItem(item, ipfsMeta = null) {
  const title = pickValueWithSource({
    local: item.title,
    ipfs: ipfsMeta?.name || ipfsMeta?.slug,
    onchain: item.tokenSymbol || item.tokenName,
    fallback: 'Sin titulo',
  }).value;
  const subtitle = pickValueWithSource({
    local: item.subtitle,
    ipfs: ipfsMeta?.description,
    onchain: '',
    fallback: '',
  }).value;
  const narrative = pickValueWithSource({
    local: item.narrative,
    ipfs: ipfsMeta?.description,
    onchain: '',
    fallback: '',
  }).value;
  const resolvedImage = pickNftImageUrl({
    local: item.editorialMeta || item.imageUrl,
    ipfs: ipfsMeta,
    onchain: item.tokenMeta || null,
    debugLabel: `collection-display:${item.slug || item.tokenId || item.id || item.title}`,
  });
  const etapa = pickValueWithSource({
    local: item.etapa,
    ipfs: ipfsMeta?.etapa,
    onchain: '',
    fallback: '',
  }).value;
  const tags = pickValueWithSource({
    local: normalizeMetadataTags(item.tags),
    ipfs: normalizeMetadataTags(ipfsMeta?.tags),
    onchain: [],
    fallback: [],
  }).value;
  const theme = pickValueWithSource({
    local: item.theme,
    ipfs: ipfsMeta?.theme,
    onchain: '',
    fallback: 'codex',
  }).value;
  const accent = pickValueWithSource({
    local: item.accent,
    ipfs: ipfsMeta?.accent,
    onchain: '',
    fallback: '',
  }).value;

  return {
    ...item,
    title,
    subtitle,
    narrative,
    imageUrl: resolvedImage.url,
    imageRaw: resolvedImage.raw,
    imageSource: resolvedImage.source,
    etapa,
    tags,
    theme,
    accent,
  };
}

function buildRelatedXoloPreviewData(target) {
  if (!target || (!target.slug && !target.txid)) return null;

  const editorialMeta = resolveLinajeMeta({ slug: target.slug, txid: target.txid });
  if (!editorialMeta) return null;

  const title = pickValueWithSource({
    local: editorialMeta.title || editorialMeta.nombreCompleto || editorialMeta.name,
    ipfs: '',
    onchain: target.title,
    fallback: target.slug || shortHex(target.txid, 10, 8),
  }).value;
  const etapa = pickValueWithSource({
    local: editorialMeta.etapa,
    ipfs: '',
    onchain: '',
    fallback: '',
  }).value;
  const resolvedImage = pickNftImageUrl({
    local: editorialMeta,
    debugLabel: `related-xolo:${target.slug || target.txid || title}`,
  });

  return {
    title,
    etapa: hasRenderableMetadataValue(etapa) && etapa !== '—' ? etapa : '',
    imageUrl: resolvedImage.url,
    lineageHref: target.lineageHref || '',
    collectionHref: target.collectionHref || '',
  };
}

function RelatedXoloPreviewCard({ target }) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const preview = React.useMemo(() => buildRelatedXoloPreviewData(target), [target]);

  React.useEffect(() => {
    setImageFailed(false);
  }, [preview?.imageUrl]);

  if (!preview) return null;

  const showImage = Boolean(preview.imageUrl) && !imageFailed;

  return (
    <div
      style={{
        marginTop: '8px',
        maxWidth: '320px',
        border: '1px solid #1c515b',
        borderRadius: '12px',
        background: 'linear-gradient(160deg, rgba(6, 18, 24, 0.96) 0%, rgba(9, 28, 34, 0.96) 100%)',
        boxShadow: '0 0 16px rgba(0, 234, 255, 0.08)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '88px minmax(0, 1fr)', minHeight: '88px' }}>
        <div
          style={{
            borderRight: '1px solid #143c45',
            background: 'linear-gradient(160deg, #071117 0%, #0d1d25 100%)',
            display: 'grid',
            placeItems: 'center',
            overflow: 'hidden',
          }}
        >
          {showImage ? (
            <img
              src={preview.imageUrl}
              alt={preview.title}
              loading="lazy"
            decoding="async"
              onError={() => setImageFailed(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div
              style={{
                color: '#9feeff',
                fontSize: '0.68rem',
                letterSpacing: '0.08em',
                textAlign: 'center',
                padding: '8px',
                fontWeight: 700,
              }}
            >
              XOLO
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gap: '6px', padding: '10px 12px' }}>
          <div style={{ color: '#eafcff', fontWeight: 700, lineHeight: 1.2 }}>{preview.title}</div>
          {preview.etapa && (
            <div style={{ color: '#8fdce4', fontSize: '0.76rem' }}>
              etapa: <span style={{ color: '#d9faff' }}>{preview.etapa}</span>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.75rem' }}>
            {preview.lineageHref && (
              <Link
                to={preview.lineageHref}
                style={{ color: '#7dffe4', textDecoration: 'underline', textUnderlineOffset: '0.18em' }}
              >
                Ver linaje
              </Link>
            )}
            {preview.collectionHref && (
              <Link
                to={preview.collectionHref}
                style={{ color: '#8ff7ff', textDecoration: 'underline', textUnderlineOffset: '0.18em' }}
              >
                Ver colección
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeDocumentHash(value) {
  if (value === undefined || value === null) return '';
  const raw = String(value).trim().toLowerCase();
  if (!raw) return '';
  if (raw.startsWith('0x')) return raw.slice(2);
  return raw;
}

function extractTokenDocumentHash(tokenInfo) {
  const candidates = [
    tokenInfo?.hash,
    tokenInfo?.documentHash,
    tokenInfo?.documentSHA256,
    tokenInfo?.documentSha256,
    tokenInfo?.genesisInfo?.hash,
    tokenInfo?.genesisInfo?.documentHash,
    tokenInfo?.genesisInfo?.documentSHA256,
    tokenInfo?.genesisInfo?.documentSha256,
  ];
  const found = candidates.find((entry) => typeof entry === 'string' && entry.trim());
  return normalizeDocumentHash(found || '');
}

function NftCollectibleCard({ item }) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const ipfsState = useTokenIpfsMetadata(item.tokenId, item.tokenMeta);
  const ipfsMeta = ipfsState.metadata || null;
  const localMeta = item.editorialMeta || null;
  const resolvedName = pickValueWithSource({
    local: localMeta?.title || localMeta?.name,
    ipfs: ipfsMeta?.name || ipfsMeta?.slug,
    onchain: item.symbol || item.name,
    fallback: shortHex(item.tokenId, 10, 8),
  });
  const secondaryTitle = pickValueWithSource({
    local: localMeta?.subtitle,
    ipfs: ipfsMeta?.description,
    onchain: item.name && item.name !== item.symbol ? item.name : '',
    fallback: '',
  }).value;
  const quantityLabel = toBigIntSafe(item.amount) === 1n ? '1 collectible' : `Cantidad: ${item.humanBalance}`;
  const lineageSlug = typeof item.editorialMeta?.slug === 'string' ? item.editorialMeta.slug.trim() : '';
  const lineageTxid = typeof item.editorialMeta?.txid === 'string' ? item.editorialMeta.txid.trim() : '';
  const lineageHref = (lineageSlug || lineageTxid) ? `/linaje/${lineageSlug || lineageTxid}` : '';
  const resolvedImage = React.useMemo(
    () => pickNftImageUrl({
      local: localMeta,
      ipfs: ipfsMeta,
      onchain: [item.tokenMeta?.genesisInfo, item.tokenMeta],
      debugLabel: `collectible-card:${item.tokenId}`,
    }),
    [ipfsMeta, item.tokenId, item.tokenMeta, localMeta],
  );
  const imageUrl = resolvedImage.url;
  const etapaValue = pickValueWithSource({
    local: localMeta?.etapa,
    ipfs: ipfsMeta?.etapa,
    onchain: '',
    fallback: '',
  }).value;
  const tags = pickValueWithSource({
    local: normalizeMetadataTags(localMeta?.tags),
    ipfs: normalizeMetadataTags(ipfsMeta?.tags),
    onchain: [],
    fallback: [],
  }).value;
  const visualTheme = pickValueWithSource({
    local: localMeta?.theme,
    ipfs: ipfsMeta?.theme,
    onchain: '',
    fallback: '',
  }).value;
  const visualAccent = pickValueWithSource({
    local: localMeta?.accent,
    ipfs: ipfsMeta?.accent,
    onchain: '',
    fallback: '',
  }).value;
  const showImage = Boolean(imageUrl) && !imageFailed;
  const placeholderText = buildCollectibleInitials(resolvedName.value, item.tokenId);

  React.useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);
  const actionLinkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px 9px',
    fontSize: '0.75rem',
    lineHeight: 1.2,
    textDecoration: 'none',
    border: '1px solid #00eaff',
    background: '#09181d',
    color: '#8ff7ff',
    letterSpacing: '0.03em',
  };

  return (
    <div
      style={{
        border: '1px solid #1a4e57',
        background: '#081216',
        padding: '10px',
        display: 'grid',
        gap: '8px',
      }}
    >
      <div
        style={{
          border: '1px solid #00eaff',
          background: 'linear-gradient(160deg, #071117 0%, #0d1d25 100%)',
          minHeight: '110px',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        {showImage ? (
          <img
            src={imageUrl}
            alt={resolvedName.value}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div style={{ color: '#9feeff', fontWeight: 'bold', letterSpacing: '0.06em' }}>{placeholderText}</div>
        )}
      </div>

      <div style={{ color: '#d5fcff', fontWeight: 'bold', wordBreak: 'break-word' }}>{resolvedName.value}</div>
      {secondaryTitle && <div style={{ color: '#8ff7ff', fontSize: '0.82rem', wordBreak: 'break-word' }}>{secondaryTitle}</div>}
      {etapaValue && <div style={{ color: '#9adbe2', fontSize: '0.8rem' }}>Etapa: {etapaValue}</div>}
      {(visualTheme || visualAccent) && (
        <div style={{ color: '#79ced6', fontSize: '0.76rem' }}>
          {(visualTheme && `Tema: ${visualTheme}`) || ''}{visualTheme && visualAccent ? ' · ' : ''}{(visualAccent && `Acento: ${visualAccent}`) || ''}
        </div>
      )}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {tags.slice(0, 3).map((tag) => (
            <span
              key={`${item.tokenId}-${tag}`}
              style={{
                border: '1px solid #16424a',
                color: '#8ff7ff',
                background: 'rgba(1, 34, 40, 0.55)',
                padding: '2px 7px',
                fontSize: '0.72rem',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div style={{ color: '#9adbe2', fontSize: '0.85rem' }}>{quantityLabel}</div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Link to={`/token/${item.tokenId}`} style={actionLinkStyle}>
          Ver Token
        </Link>
        {lineageHref && (
          <Link to={lineageHref} style={actionLinkStyle}>
            Ver Linaje
          </Link>
        )}
      </div>
    </div>
  );
}

function XoloNftCollectionCard({ item }) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const ipfsState = useTokenIpfsMetadata(item.tokenId);
  const resolvedItem = React.useMemo(
    () => resolveCollectionDisplayItem(item, ipfsState.metadata),
    [item, ipfsState.metadata],
  );
  const curatedHref = item.slug ? `/collection/xolosnft/${item.slug}` : '';
  const actionLinkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px 9px',
    fontSize: '0.75rem',
    lineHeight: 1.2,
    textDecoration: 'none',
    border: '1px solid #00eaff',
    background: '#09181d',
    color: '#8ff7ff',
    letterSpacing: '0.03em',
  };
  const showImage = Boolean(resolvedItem.imageUrl) && !imageFailed;
  const placeholderText = buildCollectibleInitials(resolvedItem.title, item.tokenId || item.slug);

  React.useEffect(() => {
    setImageFailed(false);
  }, [resolvedItem.imageUrl]);

  const primaryContent = (
    <>
      <div
        style={{
          border: '1px solid #00eaff',
          background: 'linear-gradient(160deg, #071117 0%, #0d1d25 100%)',
          minHeight: '120px',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        {showImage ? (
          <img
            src={resolvedItem.imageUrl}
            alt={item.imageAlt || resolvedItem.title}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div style={{ color: '#9feeff', fontWeight: 'bold', letterSpacing: '0.06em' }}>{placeholderText}</div>
        )}
      </div>

      <div style={{ color: '#d5fcff', fontWeight: 'bold', wordBreak: 'break-word' }}>{resolvedItem.title}</div>
      {resolvedItem.subtitle && (
        <div style={{ color: '#99edf5', fontSize: '0.86rem', fontStyle: 'italic', lineHeight: 1.45 }}>{resolvedItem.subtitle}</div>
      )}
      {item.tokenSymbol && (
        <div style={{ color: '#8ff7ff', fontSize: '0.82rem', wordBreak: 'break-word' }}>
          {item.tokenSymbol}
        </div>
      )}
      {resolvedItem.narrative && (
        <div style={{ color: '#9adbe2', fontSize: '0.85rem', lineHeight: 1.4 }}>{resolvedItem.narrative}</div>
      )}
      {resolvedItem.etapa && <div style={{ color: '#8ac9d0', fontSize: '0.8rem' }}>Etapa: {resolvedItem.etapa}</div>}
      {resolvedItem.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {resolvedItem.tags.slice(0, 3).map((tag) => (
            <span
              key={`${item.id}-${tag}`}
              style={{
                border: '1px solid #16424a',
                color: '#8ff7ff',
                background: 'rgba(1, 34, 40, 0.55)',
                padding: '2px 7px',
                fontSize: '0.72rem',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      {item.slug && <div style={{ color: '#78cad2', fontSize: '0.8rem' }}>Slug: {item.slug}</div>}
      <div style={{ color: '#7dffe4', fontSize: '0.82rem', letterSpacing: '0.04em' }}>Abrir ficha curada →</div>
    </>
  );

  return (
    <article
      style={{
        border: '1px solid #1a4e57',
        background: '#081216',
        padding: '10px',
        display: 'grid',
        gap: '8px',
      }}
    >
      {curatedHref ? (
        <Link to={curatedHref} style={{ display: 'grid', gap: '8px', textDecoration: 'none' }}>
          {primaryContent}
        </Link>
      ) : primaryContent}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {item.tokenId && (
          <Link to={`/token/${item.tokenId}`} style={actionLinkStyle}>
            Token tecnico
          </Link>
        )}
        {item.lineageRef && (
          <Link to={`/linaje/${item.lineageRef}`} style={actionLinkStyle}>
            Ver Linaje
          </Link>
        )}
      </div>
    </article>
  );
}

function XoloNftCollectionPage() {
  useDocumentTitle('Colección XOLOSNFT');
  const [query, setQuery] = React.useState('');

  const collectionItems = React.useMemo(() => buildXoloNftCollectionItems(), []);

  const filteredItems = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return collectionItems;
    return collectionItems.filter((item) => item.searchText.includes(normalizedQuery));
  }, [collectionItems, query]);

  return (
    <Shell>
      <SearchBar />
      <SectionTitle>XOLOSNFT Collection</SectionTitle>
      <div style={{ color: '#8ff7ff', marginTop: '-4px', marginBottom: '10px' }}>
        Archivo curado del Linaje Vivo
      </div>
      <div style={{ marginTop: '-2px', marginBottom: '12px' }}>
        <Link to="/collection/xolosnft/codex" style={{ color: '#7dffe4', fontSize: '0.9rem' }}>
          Vista códice
        </Link>
      </div>

      <Box style={{ marginBottom: '14px' }}>
        <p style={{ marginTop: 0, color: '#9adbe2', lineHeight: 1.5 }}>
          Seleccion editorial de NFTs y fichas narrativas del archivo XOLOSNFT. Esta vista reúne metadatos locales de
          linaje para explorar piezas con contexto tecnico y genealogico.
        </p>
        <label style={{ display: 'grid', gap: '6px', color: '#8ff7ff', fontSize: '0.85rem' }}>
          Buscar en coleccion
          <input
            type="text"
            placeholder="Nombre, slug o simbolo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              background: '#081316',
              border: '1px solid #1c515b',
              color: '#d6ffff',
              padding: '8px 10px',
              fontFamily: 'monospace',
            }}
          />
        </label>
      </Box>

      {filteredItems.length === 0 ? (
        <Box>No hay elementos disponibles en la colección XOLOSNFT.</Box>
      ) : (
        <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
          {filteredItems.map((item) => (
            <XoloNftCollectionCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </Shell>
  );
}

function XoloNftCodexCard({ item }) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const ipfsState = useTokenIpfsMetadata(item.tokenId);
  const resolvedItem = React.useMemo(
    () => resolveCollectionDisplayItem(item, ipfsState.metadata),
    [item, ipfsState.metadata],
  );
  const curatedHref = item.slug ? `/collection/xolosnft/${item.slug}` : '';
  const showImage = Boolean(resolvedItem.imageUrl) && !imageFailed;
  const placeholderText = buildCollectibleInitials(resolvedItem.title, item.tokenId || item.slug);
  const actionLinkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '7px 11px',
    fontSize: '0.8rem',
    lineHeight: 1.2,
    textDecoration: 'none',
    border: '1px solid #2abfce',
    background: '#0a1c22',
    color: '#b4fbff',
    letterSpacing: '0.02em',
  };

  React.useEffect(() => {
    setImageFailed(false);
  }, [resolvedItem.imageUrl]);

  const primaryContent = (
    <>
      <div
        style={{
          minHeight: '220px',
          borderBottom: '1px solid #1b5f6a',
          background: 'radial-gradient(circle at 15% 20%, #185b66 0%, #0b1b23 46%, #061015 100%)',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        {showImage ? (
          <img
            src={resolvedItem.imageUrl}
            alt={item.imageAlt || resolvedItem.title}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', minHeight: '220px', maxHeight: '320px', objectFit: 'cover', display: 'block' }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div style={{ color: '#9feeff', fontWeight: 'bold', letterSpacing: '0.12em', fontSize: '1.25rem' }}>
            {placeholderText}
          </div>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ color: '#8ff7ff', fontSize: '0.76rem', letterSpacing: '0.11em', textTransform: 'uppercase' }}>
          Archivo del Linaje Vivo
        </div>
        <h3 style={{ margin: '8px 0 0', color: '#dcfdff', fontSize: '1.55rem', lineHeight: 1.15 }}>
          {resolvedItem.title}
        </h3>
        {resolvedItem.subtitle && (
          <div style={{ marginTop: '8px', color: '#b0eef4', fontSize: '0.93rem', fontStyle: 'italic', lineHeight: 1.45 }}>
            {resolvedItem.subtitle}
          </div>
        )}
        {item.tokenSymbol && (
          <div style={{ marginTop: '8px', color: '#9aeaf2', fontSize: '0.9rem' }}>
            {item.tokenSymbol}
          </div>
        )}
        <div style={{ marginTop: '10px', color: '#b9f4f9', lineHeight: 1.5, minHeight: '56px' }}>
          {resolvedItem.narrative || 'Pieza del archivo editorial XOLOSNFT con referencia al linaje vivo.'}
        </div>
        {resolvedItem.etapa && (
          <div style={{ marginTop: '8px', color: '#9aeaf2', fontSize: '0.88rem' }}>
            Etapa: {resolvedItem.etapa}
          </div>
        )}
        {resolvedItem.tags?.length > 0 && (
          <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {resolvedItem.tags.slice(0, 4).map((tag) => (
              <span
                key={`${item.id}-codex-${tag}`}
                style={{
                  border: '1px solid #16424a',
                  color: '#8ff7ff',
                  background: 'rgba(1, 34, 40, 0.55)',
                  padding: '2px 7px',
                  fontSize: '0.72rem',
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        {item.slug && <div style={{ marginTop: '10px', color: '#7bcfd8', fontSize: '0.84rem' }}>Clave: {item.slug}</div>}
        <div style={{ marginTop: '10px', color: '#7dffe4', fontSize: '0.85rem', letterSpacing: '0.03em' }}>
          Abrir entrada de archivo →
        </div>
      </div>
    </>
  );

  return (
    <article
      style={{
        border: '1px solid #00eaff',
        background: 'linear-gradient(160deg, #050d12 0%, #0a1a22 48%, #0d2731 100%)',
        boxShadow: '0 0 0 1px #103d46 inset, 0 0 26px rgba(0, 234, 255, 0.16)',
        display: 'grid',
        overflow: 'hidden',
      }}
    >
      {curatedHref ? (
        <Link to={curatedHref} style={{ display: 'grid', textDecoration: 'none' }}>
          {primaryContent}
        </Link>
      ) : primaryContent}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ marginTop: '2px', display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
          {item.tokenId && (
            <Link to={`/token/${item.tokenId}`} style={actionLinkStyle}>
              Ver token
            </Link>
          )}
          {item.lineageRef && (
            <Link to={`/linaje/${item.lineageRef}`} style={actionLinkStyle}>
              Ver linaje
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function XoloNftCodexPage() {
  useDocumentTitle('Códice XOLOSNFT');
  const [query, setQuery] = React.useState('');
  const collectionItems = React.useMemo(() => buildXoloNftCollectionItems(), []);
  const filteredItems = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return collectionItems;
    return collectionItems.filter((item) => item.searchText.includes(normalizedQuery));
  }, [collectionItems, query]);

  return (
    <Shell>
      <SearchBar />
      <SectionTitle>XOLOSNFT Codex</SectionTitle>
      <div style={{ color: '#8ff7ff', marginTop: '-4px', marginBottom: '10px' }}>
        Museo digital del Archivo del Linaje Vivo
      </div>
      <div style={{ marginTop: '-2px', marginBottom: '12px' }}>
        <Link to="/collection/xolosnft" style={{ color: '#7dffe4', fontSize: '0.9rem' }}>
          Vista explorador
        </Link>
      </div>

      <Box style={{ marginBottom: '14px', background: 'linear-gradient(160deg, #08151b 0%, #0b1f29 100%)' }}>
        <p style={{ marginTop: 0, color: '#b9f4f9', lineHeight: 1.55 }}>
          Este códice reúne piezas de XOLOSNFT como una sala curatorial: cada obra dialoga con el linaje, su memoria
          editorial y su rastro on-chain dentro del archivo vivo.
        </p>
        <label style={{ display: 'grid', gap: '6px', color: '#8ff7ff', fontSize: '0.85rem' }}>
          Buscar en códice
          <input
            type="text"
            placeholder="Nombre, slug o símbolo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              background: '#081316',
              border: '1px solid #1c515b',
              color: '#d6ffff',
              padding: '8px 10px',
              fontFamily: 'monospace',
            }}
          />
        </label>
      </Box>

      {filteredItems.length === 0 ? (
        <Box>No hay elementos disponibles en el códice XOLOSNFT.</Box>
      ) : (
        <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {filteredItems.map((item) => (
            <XoloNftCodexCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </Shell>
  );
}

function XoloNftCollectionItemPage() {
  const { slug } = useParams();
  useDocumentTitle(slug ? `XOLOSNFT ${slug}` : 'XOLOSNFT');
  const [imageFailed, setImageFailed] = React.useState(false);
  const collectionItems = React.useMemo(() => buildXoloNftCollectionItems(), []);
  const normalizedSlug = slugify((slug || '').trim());
  const item = React.useMemo(
    () => collectionItems.find((entry) => entry.slug === normalizedSlug),
    [collectionItems, normalizedSlug],
  );
  const actionLinkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '7px 11px',
    fontSize: '0.82rem',
    lineHeight: 1.2,
    textDecoration: 'none',
    border: '1px solid #2abfce',
    background: '#0a1c22',
    color: '#b4fbff',
    letterSpacing: '0.02em',
  };
  const metaLabelStyle = {
    color: '#79ced6',
    fontSize: '0.8rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  };
  const metaValueStyle = {
    color: '#d7fbff',
    wordBreak: 'break-word',
  };
  const ipfsState = useTokenIpfsMetadata(item?.tokenId || '');
  const resolvedItem = React.useMemo(
    () => (item ? resolveCollectionDisplayItem(item, ipfsState.metadata) : null),
    [item, ipfsState.metadata],
  );

  React.useEffect(() => {
    setImageFailed(false);
  }, [resolvedItem?.imageUrl]);

  if (!item) {
    return (
      <Shell>
        <SearchBar />
        <SectionTitle>XOLOSNFT Entry</SectionTitle>
        <Box>No se encontró esta pieza dentro de la colección XOLOSNFT.</Box>
      </Shell>
    );
  }

  const tokenLabel = [item.tokenSymbol, item.tokenName].filter(Boolean).join(' / ') || '—';
  const lineageHref = item.lineageRef ? `/linaje/${item.lineageRef}` : '';
  const themeStyles = buildXoloArchiveThemeStyles(resolvedItem.theme, resolvedItem.accent);
  const resolvedActionLinkStyle = {
    ...actionLinkStyle,
    border: `1px solid ${themeStyles.linkBorder}`,
    background: themeStyles.linkBg,
    color: themeStyles.linkColor,
  };
  const resolvedMetaLabelStyle = { ...metaLabelStyle, color: themeStyles.label };
  const resolvedMetaValueStyle = { ...metaValueStyle, color: themeStyles.value };
  const showImage = Boolean(resolvedItem.imageUrl) && !imageFailed;

  return (
    <Shell>
      <SearchBar />
      <SectionTitle>{resolvedItem.title}</SectionTitle>
      {resolvedItem.subtitle && (
        <div style={{ marginTop: '-4px', marginBottom: '10px', color: '#99edf5', fontStyle: 'italic', lineHeight: 1.45 }}>
          {resolvedItem.subtitle}
        </div>
      )}
      <div style={{ marginBottom: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Link to="/collection/xolosnft" style={{ color: themeStyles.breadcrumb, fontSize: '0.9rem' }}>
          Volver a la colección
        </Link>
        <Link to="/collection/xolosnft/codex" style={{ color: themeStyles.breadcrumb, fontSize: '0.9rem' }}>
          Vista códice
        </Link>
      </div>

      <article
        style={{
          border: `1px solid ${themeStyles.border}`,
          background: themeStyles.articleBg,
          boxShadow: themeStyles.articleShadow,
          display: 'grid',
          gap: '14px',
          padding: '14px',
        }}
      >
        <div
          style={{
            border: `1px solid ${themeStyles.frameBorder}`,
            minHeight: '320px',
            background: themeStyles.frameBg,
            display: 'grid',
            placeItems: 'center',
            overflow: 'hidden',
          }}
        >
          {showImage ? (
            <img
              src={resolvedItem.imageUrl}
              alt={item.imageAlt || resolvedItem.title}
              loading="lazy"
              decoding="async"
              style={{ width: '100%', minHeight: '320px', maxHeight: '520px', objectFit: 'cover', display: 'block' }}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div style={{ color: themeStyles.placeholder, fontWeight: 'bold', letterSpacing: '0.12em', fontSize: '1.5rem' }}>
              {buildCollectibleInitials(resolvedItem.title, item.tokenId || item.slug)}
            </div>
          )}
        </div>

        <Box style={{ background: themeStyles.panelBg }}>
          <div style={{ color: themeStyles.panelTitle, fontSize: '0.78rem', letterSpacing: '0.11em', textTransform: 'uppercase' }}>
            Entrada curada
          </div>
          <div style={{ marginTop: '10px', color: themeStyles.narrative, lineHeight: 1.65 }}>
            {resolvedItem.narrative || 'Registro editorial del archivo XOLOSNFT, vinculado al linaje vivo y a su rastro on-chain.'}
          </div>
          {item.backgroundNote && (
            <div style={{ marginTop: '10px', color: themeStyles.value, lineHeight: 1.55, fontSize: '0.92rem' }}>
              {item.backgroundNote}
            </div>
          )}
          {resolvedItem.etapa && (
            <div style={{ marginTop: '10px', color: themeStyles.value, fontSize: '0.92rem' }}>
              <strong>Etapa:</strong> {resolvedItem.etapa}
            </div>
          )}
          {resolvedItem.tags?.length > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {resolvedItem.tags.map((tag) => (
                <span
                  key={`${item.id}-detail-${tag}`}
                  style={{
                    border: `1px solid ${themeStyles.linkBorder}`,
                    color: themeStyles.linkColor,
                    background: themeStyles.linkBg,
                    padding: '2px 8px',
                    fontSize: '0.76rem',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </Box>

        <Box style={{ background: themeStyles.panelBg }}>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div>
              <div style={resolvedMetaLabelStyle}>Slug</div>
              <div style={resolvedMetaValueStyle}>{item.slug || '—'}</div>
            </div>
            <div>
              <div style={resolvedMetaLabelStyle}>Token símbolo / nombre</div>
              <div style={resolvedMetaValueStyle}>{tokenLabel}</div>
            </div>
            <div>
              <div style={resolvedMetaLabelStyle}>Token ID</div>
              <div style={resolvedMetaValueStyle}>{item.tokenId || '—'}</div>
            </div>
            <div>
              <div style={resolvedMetaLabelStyle}>Destino de linaje</div>
              <div style={resolvedMetaValueStyle}>{item.lineageRef || '—'}</div>
            </div>
            <div>
              <div style={resolvedMetaLabelStyle}>Tema editorial</div>
              <div style={resolvedMetaValueStyle}>{resolvedItem.theme || 'codex'}</div>
            </div>
          </div>
        </Box>

        <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
          {item.tokenId && (
            <Link to={`/token/${item.tokenId}`} style={resolvedActionLinkStyle}>
              Ver token
            </Link>
          )}
          {lineageHref && (
            <Link to={lineageHref} style={resolvedActionLinkStyle}>
              Ver linaje
            </Link>
          )}
          <Link to="/collection/xolosnft" style={resolvedActionLinkStyle}>
            Volver a la colección
          </Link>
          <Link to="/collection/xolosnft/codex" style={resolvedActionLinkStyle}>
            Vista códice
          </Link>
        </div>
      </article>
    </Shell>
  );
}

function TxTable({ txs = [] }) {
  if (!txs.length) return <Box>No hay transacciones.</Box>;

  return (
    <Box style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>TXID</th>
            <th style={thStyle}>Inputs</th>
            <th style={thStyle}>Outputs</th>
            <th style={thStyle}>Bloque</th>
          </tr>
        </thead>
        <tbody>
          {txs.map((tx) => (
            <tr key={tx.txid}>
              <td style={tdStyle}><TxLink txid={tx.txid} /></td>
              <td style={tdStyle}>{formatNumber(tx.inputs?.length || 0)}</td>
              <td style={tdStyle}>{formatNumber(tx.outputs?.length || 0)}</td>
              <td style={tdStyle}>
                {tx.block?.height !== undefined ? (
                  <BlockLink hashOrHeight={tx.block.height}>{tx.block.height}</BlockLink>
                ) : 'Mempool'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

function TokenBalancesCard({ balances = [] }) {
  const fungible = balances.filter((item) => item.kind === 'fungible');
  const nfts = balances.filter((item) => item.kind === 'nft');

  return (
    <div style={{ marginTop: '24px', display: 'grid', gap: '14px' }}>
      <Box style={{ overflowX: 'auto' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Fungible Tokens</div>
        {!fungible.length ? (
          <div style={{ color: '#8ff7ff' }}>No hay fungibles detectados en UTXOs activos.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Token</th>
                <th style={thStyle}>Balance</th>
                <th style={thStyle}>Token ID</th>
              </tr>
            </thead>
            <tbody>
              {fungible.map((item) => (
                <tr key={item.tokenId}>
                  <td style={tdStyle}>
                    <div style={{ color: '#d5fcff' }}>{item.symbol || item.name || '—'}</div>
                    {item.name && <div style={{ color: '#8ff7ff', fontSize: '0.82rem' }}>{item.name}</div>}
                  </td>
                  <td style={tdStyle}>
                    <div>{item.humanBalance}</div>
                    <div style={{ color: '#77aeb6', fontSize: '0.8rem', marginTop: '4px' }}>raw: {item.rawBalance}</div>
                  </td>
                  <td style={tdStyle}>
                    <TokenLink tokenId={item.tokenId}>{shortHex(item.tokenId, 18, 14)}</TokenLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Box>

      <Box>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>NFTs / Collectibles</div>
        {!nfts.length ? (
          <div style={{ color: '#8ff7ff' }}>No hay NFTs o coleccionables detectados.</div>
        ) : (
          <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
            {nfts.map((item) => (
              <NftCollectibleCard key={item.tokenId} item={item} />
            ))}
          </div>
        )}
      </Box>
      {!balances.length && (
        <Box>
          <div style={{ color: '#8ff7ff' }}>No hay tokens detectados.</div>
        </Box>
      )}
    </div>
  );
}

const thStyle = {
  textAlign: 'left',
  padding: '10px',
  borderBottom: '1px solid #00eaff',
  color: '#8ff7ff',
};

const tdStyle = {
  padding: '10px',
  borderBottom: '1px solid #123',
  verticalAlign: 'top',
};

function OutputsTable({ outputs = [] }) {
  if (!outputs.length) return <Box>No hay salidas.</Box>;

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {outputs.map((output, idx) => {
        const addr = outputScriptToAddress(output.outputScript);
        const opReturn = isOpReturn(output.outputScript);
        const opReturnText = extractOpReturnText(output.outputScript);

        return (
          <Box key={idx}>
            <div><strong>Output #{idx}</strong></div>
            <div style={{ marginTop: '8px' }}>Valor: {satsToXec(output.sats)}</div>

            {addr && (
              <div style={{ marginTop: '8px' }}>
                Dirección: <AddressLink address={addr} />
              </div>
            )}

            {opReturn && (
              <div style={{ marginTop: '8px', color: '#ffd37a' }}>
                OP_RETURN detectado
                <div style={{ marginTop: '6px', wordBreak: 'break-word' }}>
                  {opReturnText}
                </div>
                {isXolosLinajeRecord(opReturnText) && (
                  <div style={{ marginTop: '8px', color: '#9dff9d' }}>
                    🐾 Registro oficial de linaje detectado
                  </div>
                )}
              </div>
            )}

            {!addr && !opReturn && (
              <div style={{ marginTop: '8px', color: '#8ff7ff', wordBreak: 'break-word' }}>
                Script: {output.outputScript || '—'}
              </div>
            )}
          </Box>
        );
      })}
    </div>
  );
}

function InputsTable({ inputs = [] }) {
  if (!inputs.length) return <Box>No hay inputs.</Box>;

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {inputs.map((input, idx) => (
        <Box key={idx}>
          <div><strong>Input #{idx}</strong></div>
          {input.prevOut?.txid ? (
            <div style={{ marginTop: '8px' }}>
              Prev TX: <TxLink txid={input.prevOut.txid} />
              <div style={{ marginTop: '6px', color: '#b8fdff' }}>
                Output index: {input.prevOut.outIdx}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '8px', color: '#b8fdff' }}>Coinbase / sin prevOut</div>
          )}

          {input.sats !== undefined && (
            <div style={{ marginTop: '8px' }}>
              Valor origen: {satsToXec(input.sats)}
            </div>
          )}
        </Box>
      ))}
    </div>
  );
}

function StatusPage() {
  useDocumentTitle('Estado del nodo');
  const [state, setState] = React.useState({ loading: true, error: '', info: null });

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setState({ loading: true, error: '', info: null });
        const info = await chronik.blockchainInfo();
        if (mounted) setState({ loading: false, error: '', info });
      } catch (err) {
        if (mounted) setState({ loading: false, error: err?.message || 'No se pudo cargar el estado del nodo.', info: null });
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const info = state.info || {};

  return (
    <Shell>
      <SearchBar />
      <SectionTitle>Estado del Nodo</SectionTitle>
      {state.loading && <LoadingBox text="Consultando Chronik..." />}
      {state.error && <ErrorBox error={state.error} />}
      {state.info && (
        <>
          <StatGrid
            items={[
              { label: 'Altura actual', value: formatNumber(info.tipHeight) },
              { label: 'Tip hash', value: info.tipHash || '—' },
              { label: 'Estado', value: 'Online' },
            ]}
          />
          <Box style={{ marginTop: '14px' }}>
            <div style={{ color: '#8ff7ff', marginBottom: '6px' }}>Network Status</div>
            <div><strong>Endpoint:</strong> {CHRONIK_URL}</div>
            <div style={{ marginTop: '6px' }}>
              Nodo sincronizado hasta altura <strong>{formatNumber(info.tipHeight)}</strong> con tip{' '}
              <span style={{ color: '#bffbff' }}>{shortHex(info.tipHash, 20, 16)}</span>.
            </div>
          </Box>
        </>
      )}
    </Shell>
  );
}

function ExplorerPage() {
  useDocumentTitle('Explorer');
  const [state, setState] = React.useState({
    loading: true,
    error: '',
    blocks: [],
    txs: [],
  });

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setState({ loading: true, error: '', blocks: [], txs: [] });

        const tip = await chronik.blockchainInfo();
        const tipHeight = tip.tipHeight;

        const heights = [];
        for (let h = tipHeight; h > Math.max(0, tipHeight - 9); h--) {
          heights.push(h);
        }

        const blockResults = await Promise.all(
          heights.map((h) => chronik.block(h.toString()))
        );

        const txResults = await Promise.all(
          heights.slice(0, 5).map((h) => chronik.blockTxs(h.toString(), 0, 5))
        );

        const flatTxs = txResults.flatMap((r) => r.txs || []);

        if (mounted) {
          setState({
            loading: false,
            error: '',
            blocks: blockResults,
            txs: flatTxs,
          });
        }
      } catch (err) {
        if (mounted) {
          setState({
            loading: false,
            error: err?.message || 'No se pudo cargar el explorer.',
            blocks: [],
            txs: [],
          });
        }
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <Shell>
      <SearchBar />
      {state.loading && <LoadingBox text="Cargando dashboard del explorador..." />}
      {state.error && <ErrorBox error={state.error} />}

      {!state.loading && !state.error && (
        <>
          <SectionTitle>Últimos bloques</SectionTitle>
          <Box style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Altura</th>
                  <th style={thStyle}>Hash</th>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>TXs</th>
                  <th style={thStyle}>Tamaño</th>
                </tr>
              </thead>
              <tbody>
                {state.blocks.map((b) => {
                  const info = b.blockInfo;
                  return (
                    <tr key={info.hash}>
                      <td style={tdStyle}>
                        <BlockLink hashOrHeight={info.height}>{info.height}</BlockLink>
                      </td>
                      <td style={tdStyle}>{shortHex(info.hash, 18, 14)}</td>
                      <td style={tdStyle}>{unixToText(info.timestamp)}</td>
                      <td style={tdStyle}>{formatNumber(info.numTxs)}</td>
                      <td style={tdStyle}>{formatNumber(info.blockSize)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>

          <SectionTitle>Últimas transacciones</SectionTitle>
          <TxTable txs={state.txs} />
        </>
      )}
    </Shell>
  );
}

function LinajePage() {
  useDocumentTitle('Linaje');
  const [state, setState] = React.useState({
    loading: true,
    error: '',
    matches: [],
  });
  const [query, setQuery] = React.useState('');
  const [sexoFilter, setSexoFilter] = React.useState('todos');
  const [variedadFilter, setVariedadFilter] = React.useState('todas');
  const [onlyIndexed, setOnlyIndexed] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setState({ loading: true, error: '', matches: [] });
        const matches = await fetchRecentLinajeMatches(20, 25);

        if (mounted) {
          setState({ loading: false, error: '', matches });
        }
      } catch (err) {
        if (mounted) {
          setState({
            loading: false,
            error: err?.message || 'No se pudo cargar la vista de linaje.',
            matches: [],
          });
        }
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  const records = React.useMemo(() => {
    const flattened = state.matches.flatMap(({ tx, opReturns }) =>
      opReturns.map((op, i) => {
        const enriched = enrichLinajeRecord(op, tx.txid);
        const localMeta = enriched.editorialMeta || resolveLinajeMeta({ slug: enriched.slug, txid: tx.txid });
        const sexoValue = localMeta?.sexo || enriched.parsed?.SEXO || '';
        const variedadValue = localMeta?.variedad || enriched.parsed?.VAR || '';
        const tags = Array.isArray(localMeta?.tags) ? localMeta.tags.join(' ') : '';
        const searchText = [
          enriched.slug,
          tx.txid,
          localMeta?.title,
          localMeta?.nombreCompleto,
          localMeta?.subtitle,
          localMeta?.color,
          localMeta?.variedad,
          localMeta?.sexo,
          enriched.parsed?.NOMBRE,
          enriched.parsed?.COLOR,
          enriched.parsed?.VAR,
          enriched.parsed?.SEXO,
          tags,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return {
          id: `${tx.txid}-${i}`,
          tx,
          index: i,
          parsed: enriched.parsed,
          slug: enriched.slug,
          indexedTxid: enriched.indexedTxid,
          editorialMeta: localMeta,
          opReturnText: enriched.text,
          sexoFilter: normalizeSexoFilterValue(sexoValue),
          variedadFilter: (variedadValue || '').toString().trim().toLowerCase(),
          hasIndexedSlug: isHex64(enriched.indexedTxid),
          searchText,
        };
      })
    );

    const existingKeys = new Set(flattened.map((record) => record.slug || record.tx?.txid || ''));
    const localOnlyRecords = buildLocalLinajeGalleryRecords().filter((record) => {
      const key = record.slug || record.tx?.txid || '';
      return key && !existingKeys.has(key);
    });

    return [...flattened, ...localOnlyRecords].sort((a, b) => {
      const sourceBoostA = a.sourceKind === 'local' ? -1 : 0;
      const sourceBoostB = b.sourceKind === 'local' ? -1 : 0;
      const heightA = a.tx?.block?.height ?? -1;
      const heightB = b.tx?.block?.height ?? -1;
      if (heightA !== heightB) return heightB - heightA;
      if (sourceBoostA !== sourceBoostB) return sourceBoostB - sourceBoostA;
      return a.index - b.index;
    });
  }, [state.matches]);

  const variedadOptions = React.useMemo(() => {
    const raw = Array.from(new Set(records.map((record) => record.variedadFilter).filter(Boolean))).sort();
    return raw;
  }, [records]);

  const filteredRecords = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return records.filter((record) => {
      if (q && !record.searchText.includes(q)) return false;
      if (sexoFilter !== 'todos' && record.sexoFilter !== sexoFilter) return false;
      if (variedadFilter !== 'todas' && record.variedadFilter !== variedadFilter) return false;
      if (onlyIndexed && !record.hasIndexedSlug) return false;
      return true;
    });
  }, [records, query, sexoFilter, variedadFilter, onlyIndexed]);

  return (
    <Shell>
      <SearchBar />
      <SectionTitle>Archivo del Linaje Vivo</SectionTitle>

      {state.loading && <LoadingBox text="Buscando inscripciones OP_RETURN..." />}
      {state.error && <ErrorBox error={state.error} />}

      {!state.loading && !state.error && (
        <>
          {records.length === 0 ? (
            <Box>No se encontraron registros oficiales ni entradas locales de linaje en el rango escaneado.</Box>
          ) : (
            <>
              <Box style={{ marginBottom: '14px' }}>
                <div
                  style={{
                    display: 'grid',
                    gap: '10px',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    alignItems: 'end',
                  }}
                >
                  <label style={{ display: 'grid', gap: '6px', color: '#8ff7ff', fontSize: '0.85rem' }}>
                    Buscar
                    <input
                      type="text"
                      placeholder="Nombre, slug, txid, color..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      style={{
                        background: '#081316',
                        border: '1px solid #1c515b',
                        color: '#d6ffff',
                        padding: '8px 10px',
                        fontFamily: 'monospace',
                      }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#8ff7ff', fontSize: '0.85rem' }}>
                    Sexo
                    <select
                      value={sexoFilter}
                      onChange={(e) => setSexoFilter(e.target.value)}
                      style={{
                        background: '#081316',
                        border: '1px solid #1c515b',
                        color: '#d6ffff',
                        padding: '8px 10px',
                        fontFamily: 'monospace',
                      }}
                    >
                      <option value="todos">Todos</option>
                      <option value="hembra">Hembra</option>
                      <option value="macho">Macho</option>
                      <option value="desconocido">Desconocido</option>
                    </select>
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#8ff7ff', fontSize: '0.85rem' }}>
                    Variedad
                    <select
                      value={variedadFilter}
                      onChange={(e) => setVariedadFilter(e.target.value)}
                      style={{
                        background: '#081316',
                        border: '1px solid #1c515b',
                        color: '#d6ffff',
                        padding: '8px 10px',
                        fontFamily: 'monospace',
                      }}
                    >
                      <option value="todas">Todas</option>
                      {variedadOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8ff7ff', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={onlyIndexed}
                      onChange={(e) => setOnlyIndexed(e.target.checked)}
                    />
                    Solo con vínculo en índice local
                  </label>
                </div>

                <div style={{ marginTop: '10px', color: '#8ff7ff' }}>
                  Mostrando <strong>{filteredRecords.length}</strong> de <strong>{records.length}</strong> registros
                </div>
              </Box>

              {filteredRecords.length === 0 ? (
                <Box>No hay registros que coincidan con los filtros aplicados.</Box>
              ) : (
                <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                  {filteredRecords.map((record) => (
                    <LinajeGalleryCard key={record.id} record={record} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </Shell>
  );
}

function LinajeRecordPage() {
  const { txidOrSlug } = useParams();
  useDocumentTitle(txidOrSlug ? `Linaje ${txidOrSlug}` : 'Registro de linaje');
  const [state, setState] = React.useState({
    loading: true,
    error: '',
    tx: null,
    records: [],
    localRecord: null,
    resolvedBy: '',
  });

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setState({ loading: true, error: '', tx: null, records: [], localRecord: null, resolvedBy: '' });
        const value = (txidOrSlug || '').trim();
        const localRecord = buildLocalLinajeFallbackRecord(value);

        if (!value) {
          throw new Error('Falta identificar un txid o slug de linaje.');
        }

        if (isHex64(value)) {
          try {
            const tx = await chronik.tx(value);
            const records = extractLinajeRecordsFromTx(tx);

            if (!records.length) {
              if (localRecord && mounted) {
                setState({ loading: false, error: '', tx, records: [], localRecord, resolvedBy: 'local-txid' });
                return;
              }
              throw new Error('La transacción existe, pero no contiene un registro oficial de linaje XOLO|RAMIREZ.');
            }

            if (mounted) {
              setState({ loading: false, error: '', tx, records, localRecord: null, resolvedBy: 'txid' });
            }
            return;
          } catch (err) {
            if (localRecord && mounted) {
              setState({ loading: false, error: '', tx: null, records: [], localRecord, resolvedBy: 'local-txid' });
              return;
            }
            throw err;
          }
        }

        const slug = slugify(value);
        const indexedTxid = findLinajeTxidBySlug(slug);

        if (isHex64(indexedTxid)) {
          try {
            const tx = await chronik.tx(indexedTxid);
            const records = extractLinajeRecordsFromTx(tx);
            const matchedRecord = records.find((record) => record.slug === slug);

            if (matchedRecord) {
              if (mounted) {
                setState({
                  loading: false,
                  error: '',
                  tx,
                  records: [matchedRecord],
                  localRecord: null,
                  resolvedBy: 'slug-index',
                });
              }
              return;
            }
            if (localRecord && mounted) {
              setState({
                loading: false,
                error: '',
                tx,
                records: [],
                localRecord,
                resolvedBy: 'local-slug-index',
              });
              return;
            }
          } catch (err) {
            if (!localRecord) throw err;
          }
        }

        if (localRecord) {
          if (mounted) {
            setState({
              loading: false,
              error: '',
              tx: null,
              records: [],
              localRecord,
              resolvedBy: 'local-slug',
            });
          }
          return;
        }

        const matches = await fetchRecentLinajeMatches(250, 25);
        const flattened = matches.flatMap(({ tx, opReturns }) =>
          opReturns.map((record) => ({ tx, record }))
        );
        const found = flattened.find(({ record }) => record.slug === slug);

        if (!found) {
          throw new Error(`No se encontró un registro de linaje para el slug "${value}" en el índice local ni en el rango escaneado.`);
        }

        if (mounted) {
          setState({
            loading: false,
            error: '',
            tx: found.tx,
            records: [found.record],
            resolvedBy: 'slug-scan',
          });
        }
      } catch (err) {
        if (mounted) {
          setState({
            loading: false,
            error: err?.message || 'No se pudo cargar el registro de linaje.',
            tx: null,
            records: [],
            localRecord: null,
            resolvedBy: '',
          });
        }
      }
    }

    load();
    return () => { mounted = false; };
  }, [txidOrSlug]);

  return (
    <Shell>
      <SearchBar />
      <SectionTitle>Registro Individual del Linaje Vivo</SectionTitle>
      <div style={{ marginTop: '6px' }}>
        <Link to="/linaje" style={{ color: '#00eaff' }}>
          ← Volver al archivo de linaje
        </Link>
      </div>

      {state.loading && <LoadingBox text="Cargando registro individual..." />}
      {state.error && <ErrorBox error={state.error} />}

      {!state.loading && !state.error && (state.tx || state.localRecord) && (
        <>
          {/*
            La vista individual unifica:
            1) OP_RETURN parseado (records),
            2) slug/índice local,
            3) metadata editorial local.
          */}
          {(() => {
            const primary = state.records[0] || null;
            const enriched = primary ? enrichLinajeRecord(primary, state.tx.txid) : state.localRecord;
            return (
          <StatGrid
            items={[
              { label: 'TXID', value: enriched?.txid || state.tx?.txid || '—' },
              { label: 'Resuelto por', value: state.resolvedBy || '—' },
              { label: 'Slug narrativo', value: enriched?.slug || '—' },
              { label: 'Índice local', value: isHex64(enriched?.indexedTxid || '') ? 'Vinculado' : 'Sin vínculo' },
              { label: 'Capa editorial', value: enriched?.editorialMeta ? 'Disponible' : 'No encontrada' },
              {
                label: 'Bloque',
                value: state.tx?.block?.height !== undefined ? (
                  <BlockLink hashOrHeight={state.tx.block.height}>{state.tx.block.height}</BlockLink>
                ) : (state.localRecord ? 'Archivo local' : 'Mempool'),
              },
              { label: 'Registros oficiales en TX', value: formatNumber(state.records.length) },
            ]}
          />
            );
          })()}

          <div style={{ marginTop: '14px', display: 'grid', gap: '14px' }}>
            {state.localRecord && state.records.length === 0 ? (
              <LinajeCard
                key={`local-${state.localRecord.txid || state.localRecord.slug || txidOrSlug}`}
                tx={state.tx || (state.localRecord.txid ? { txid: state.localRecord.txid, block: null } : null)}
                opReturnText="Registro editorial local. No hay OP_RETURN oficial XOLO|RAMIREZ asociado a esta ficha."
                parsed={null}
                slug={state.localRecord.slug}
                indexedTxid={state.localRecord.indexedTxid}
                editorialMeta={state.localRecord.editorialMeta}
                showDetailLink={false}
                sourceKind="local"
              />
            ) : state.records.map((record, i) => {
              const enriched = enrichLinajeRecord(record, state.tx.txid);
              return (
                <LinajeCard
                  key={`${state.tx.txid}-${i}`}
                  tx={state.tx}
                  opReturnText={enriched.text}
                  parsed={enriched.parsed}
                  slug={enriched.slug}
                  indexedTxid={enriched.indexedTxid}
                  editorialMeta={enriched.editorialMeta}
                  showDetailLink={false}
                  sourceKind="official"
                />
              );
            })}
          </div>
        </>
      )}
    </Shell>
  );
}

function BlockPage() {
  const { height } = useParams();
  useDocumentTitle(height ? `Bloque ${height}` : 'Bloque');
  const [state, setState] = React.useState({ loading: true, error: '', data: null });

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setState({ loading: true, error: '', data: null });
        const [block, txs] = await Promise.all([
          chronik.block(height),
          chronik.blockTxs(height, 0, 25),
        ]);
        if (mounted) setState({ loading: false, error: '', data: { block, txs } });
      } catch (err) {
        if (mounted) setState({ loading: false, error: err?.message || 'No se pudo cargar el bloque.', data: null });
      }
    }
    load();
    return () => { mounted = false; };
  }, [height]);

  const info = state.data?.block?.blockInfo;

  return (
    <Shell>
      <SearchBar />
      <div style={{ marginTop: '20px', color: '#8ff7ff' }}>
        Viendo bloque: <strong>{height}</strong>
      </div>

      {state.loading && <LoadingBox />}
      {state.error && <ErrorBox error={state.error} />}

      {state.data && (
        <>
          <StatGrid
            items={[
              { label: 'Altura', value: info?.height },
              { label: 'Hash', value: info?.hash },
              { label: 'Fecha', value: unixToText(info?.timestamp) },
              { label: 'TXs', value: formatNumber(info?.numTxs) },
              { label: 'Tamaño', value: formatNumber(info?.blockSize) },
              { label: 'Bits', value: formatNumber(info?.nBits) },
              {
                label: 'Bloque anterior',
                value: info?.height > 0 ? <BlockLink hashOrHeight={info.height - 1}>{info.height - 1}</BlockLink> : '—',
              },
              {
                label: 'Bloque siguiente',
                value: <BlockLink hashOrHeight={info.height + 1}>{info.height + 1}</BlockLink>,
              },
            ]}
          />

          <SectionTitle>Transacciones del bloque</SectionTitle>
          <TxTable txs={state.data?.txs?.txs || []} />
        </>
      )}
    </Shell>
  );
}

function TxPage() {
  const { txid } = useParams();
  useDocumentTitle(txid ? `TX ${shortHex(txid, 12, 8)}` : 'Transacción');
  const [state, setState] = React.useState({ loading: true, error: '', data: null });

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setState({ loading: true, error: '', data: null });
        const tx = await chronik.tx(txid);
        if (mounted) setState({ loading: false, error: '', data: tx });
      } catch (err) {
        if (mounted) setState({ loading: false, error: err?.message || 'No se pudo cargar la transacción.', data: null });
      }
    }
    load();
    return () => { mounted = false; };
  }, [txid]);

  const tx = state.data;

  return (
    <Shell>
      <SearchBar />
      <div style={{ marginTop: '20px', color: '#8ff7ff' }}>
        Viendo transacción: <strong>{shortHex(txid, 20, 16)}</strong>
      </div>

      {state.loading && <LoadingBox />}
      {state.error && <ErrorBox error={state.error} />}

      {tx && (
        <>
          <StatGrid
            items={[
              { label: 'TXID', value: tx.txid },
              { label: 'Inputs', value: formatNumber(tx.inputs?.length || 0) },
              { label: 'Outputs', value: formatNumber(tx.outputs?.length || 0) },
              { label: 'Primera vez vista', value: unixToText(tx.timeFirstSeen) },
              {
                label: 'Bloque',
                value: tx.block?.height !== undefined ? (
                  <BlockLink hashOrHeight={tx.block.height}>{tx.block.height}</BlockLink>
                ) : 'Mempool',
              },
            ]}
          />

          <SectionTitle>Inputs</SectionTitle>
          <InputsTable inputs={tx.inputs || []} />

          <SectionTitle>Outputs</SectionTitle>
          <OutputsTable outputs={tx.outputs || []} />
        </>
      )}
    </Shell>
  );
}

function AddressPage() {
  const { address } = useParams();
  useDocumentTitle('Dirección');
  const decodedAddress = decodeURIComponent(address || '');
  const [state, setState] = React.useState({ loading: true, error: '', data: null });

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setState({ loading: true, error: '', data: null });
        const [history, utxos] = await Promise.all([
          chronik.address(decodedAddress).history(0, 25),
          chronik.address(decodedAddress).utxos(),
        ]);
        const utxoList = utxos?.utxos || [];
        const tokenIds = Array.from(new Set(
          utxoList
            .map((utxo) => utxo?.token?.tokenId?.toLowerCase())
            .filter(Boolean),
        ));

        const tokenInfoById = {};
        await Promise.all(
          tokenIds.map(async (tokenId) => {
            try {
              const token = await chronik.token(tokenId);
              tokenInfoById[tokenId] = token;
            } catch {
              tokenInfoById[tokenId] = null;
            }
          })
        );

        if (mounted) setState({ loading: false, error: '', data: { history, utxos, tokenInfoById } });
      } catch (err) {
        if (mounted) setState({ loading: false, error: err?.message || 'No se pudo cargar la dirección.', data: null });
      }
    }
    load();
    return () => { mounted = false; };
  }, [decodedAddress]);

  const utxos = React.useMemo(() => state.data?.utxos?.utxos || [], [state.data]);
  const txs = React.useMemo(() => state.data?.history?.txs || [], [state.data]);
  const totalSats = utxos.reduce((acc, u) => acc + Number(u.sats || 0), 0);
  const tokenInfoById = React.useMemo(() => state.data?.tokenInfoById || {}, [state.data]);
  const tokenBalances = React.useMemo(() => {
    const balances = new Map();
    for (const utxo of utxos) {
      const token = utxo?.token;
      if (!token) continue;

      const tokenId = token.tokenId?.toLowerCase();
      if (!tokenId) continue;

      const amount = token.amount ?? token.atoms ?? 0;
      const prev = balances.get(tokenId) || 0n;
      balances.set(tokenId, prev + toBigIntSafe(amount));
    }

    return Array.from(balances.entries())
      .map(([tokenId, amount]) => {
        const tokenMeta = tokenInfoById[tokenId];
        const editorialMeta = resolveLinajeMeta({ txid: tokenId });
        const isRmz = tokenId.toLowerCase() === RMZ_TOKEN_ID;
        const symbol = isRmz ? 'RMZ' : (tokenMeta?.tokenTicker || tokenMeta?.genesisInfo?.tokenTicker || '');
        const name = tokenMeta?.tokenName || tokenMeta?.genesisInfo?.tokenName || '';
        const decimals = Number(tokenMeta?.decimals ?? tokenMeta?.genesisInfo?.decimals ?? 0);

        // NFT heuristic: explicit metadata hints win; otherwise, default 0-decimals + single-unit balances to collectibles.
        const typeHints = [
          tokenMeta?.tokenType,
          tokenMeta?.genesisInfo?.tokenType,
          tokenMeta?.tokenTicker,
          tokenMeta?.tokenName,
          tokenMeta?.genesisInfo?.tokenTicker,
          tokenMeta?.genesisInfo?.tokenName,
        ]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase())
          .join(' ');
        const hasNftHint = /nft|collectible|collection|artifact|child/.test(typeHints);
        const isLikelyNft = !isRmz && (hasNftHint || (decimals === 0 && toBigIntSafe(amount) === 1n));

        return {
          tokenId,
          amount,
          symbol,
          name,
          decimals,
          tokenMeta,
          editorialMeta,
          humanBalance: formatTokenAmountWithDecimals(amount, decimals),
          rawBalance: formatTokenAmount(amount),
          kind: isLikelyNft ? 'nft' : 'fungible',
        };
      })
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'fungible' ? -1 : 1;
        if (a.amount === b.amount) return a.tokenId.localeCompare(b.tokenId);
        return a.amount > b.amount ? -1 : 1;
      });
  }, [utxos, tokenInfoById]);

  return (
    <Shell>
      <SearchBar />
      <div style={{ marginTop: '20px', color: '#8ff7ff', wordBreak: 'break-word' }}>
        Viendo dirección: <strong>{decodedAddress}</strong>
      </div>

      {state.loading && <LoadingBox />}
      {state.error && <ErrorBox error={state.error} />}

      {state.data && (
        <>
          <StatGrid
            items={[
              { label: 'Dirección', value: decodedAddress },
              { label: 'UTXOs', value: formatNumber(utxos.length) },
              { label: 'TXs cargadas', value: formatNumber(txs.length) },
              { label: 'Balance visible', value: satsToXec(totalSats) },
            ]}
          />

          <TokenBalancesCard balances={tokenBalances} />

          <SectionTitle>Historial reciente</SectionTitle>
          <TxTable txs={txs} />
        </>
      )}
    </Shell>
  );
}

function FamilyTreeNodeCard({ node, label = '', prominent = false }) {
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [node?.image]);

  if (!node) return null;

  const title = node.title || node.rawValue || 'Registro sin identificar';
  const showImage = Boolean(node.image) && !imageFailed;
  const initials = buildCollectibleInitials(title, node.tokenId || node.slug || title);

  return (
    <div
      style={{
        position: 'relative',
        border: `1px solid ${prominent ? '#3fe9ff' : '#1c515b'}`,
        borderRadius: prominent ? '16px' : '14px',
        background: prominent
          ? 'linear-gradient(160deg, rgba(6, 23, 30, 0.98) 0%, rgba(9, 35, 44, 0.98) 100%)'
          : 'linear-gradient(160deg, rgba(6, 18, 24, 0.96) 0%, rgba(8, 26, 33, 0.96) 100%)',
        boxShadow: prominent
          ? '0 0 22px rgba(0, 234, 255, 0.16)'
          : '0 0 14px rgba(0, 234, 255, 0.08)',
        overflow: 'hidden',
      }}
    >
      {label ? (
        <div
          style={{
            padding: '6px 10px',
            borderBottom: '1px solid #123a42',
            color: '#8ff7ff',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            background: 'rgba(0, 234, 255, 0.06)',
          }}
        >
          {label}
        </div>
      ) : null}
      <div
        style={{
          display: 'grid',
          gap: '12px',
          padding: prominent ? '14px' : '12px',
          gridTemplateColumns: prominent ? '96px minmax(0, 1fr)' : '80px minmax(0, 1fr)',
          minHeight: prominent ? '128px' : '110px',
        }}
      >
        <div
          style={{
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid #18454f',
            background: 'linear-gradient(160deg, #071117 0%, #0d1d25 100%)',
            display: 'grid',
            placeItems: 'center',
            minHeight: prominent ? '96px' : '80px',
          }}
        >
          {showImage ? (
            <img
              src={node.image}
              alt={title}
              loading="lazy"
            decoding="async"
              onError={() => setImageFailed(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div
              style={{
                color: '#9feeff',
                fontSize: prominent ? '1rem' : '0.92rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              {initials}
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gap: '7px', minWidth: 0 }}>
          <div style={{ color: '#eafcff', fontWeight: 700, lineHeight: 1.2, fontSize: prominent ? '1rem' : '0.92rem' }}>
            {title}
          </div>
          {node.etapa ? (
            <div style={{ color: '#8ff7ff', fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {node.etapa}
            </div>
          ) : null}
          {!node.resolved && node.rawValue ? (
            <div style={{ color: '#9adbe2', fontSize: '0.8rem', wordBreak: 'break-word' }}>
              Referencia: {node.rawValue}
            </div>
          ) : null}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {node.tokenHref ? (
              <Link to={node.tokenHref} style={{ color: '#7dffe4', fontSize: '0.8rem' }}>
                Ver token
              </Link>
            ) : null}
            {node.lineageHref ? (
              <Link to={node.lineageHref} style={{ color: '#7dffe4', fontSize: '0.8rem' }}>
                Ver linaje
              </Link>
            ) : null}
            {node.collectionHref ? (
              <Link to={node.collectionHref} style={{ color: '#7dffe4', fontSize: '0.8rem' }}>
                Ver coleccion
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function XoloFamilyTree({ rootNode, padreNode, madreNode, descendants = [] }) {
  const hasParents = Boolean(
    (padreNode && (padreNode.resolved || padreNode.rawValue))
    || (madreNode && (madreNode.resolved || madreNode.rawValue)),
  );

  if (!rootNode) return null;

  if (!hasParents) {
    return (
      <Box style={{ background: 'rgba(7, 24, 30, 0.68)' }}>
        <div style={{ color: '#9adbe2', fontSize: '0.92rem' }}>
          No hay suficientes vínculos genealógicos para construir este árbol.
        </div>
      </Box>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <Box style={{ overflow: 'hidden' }}>
        <div
          className="xolo-family-tree-grid"
          style={{
            display: 'grid',
            gap: '14px',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(240px, 1.08fr) minmax(0, 1fr)',
            alignItems: 'stretch',
          }}
        >
          <div style={{ display: 'grid', alignContent: 'start', gap: '10px' }}>
            {padreNode && (padreNode.resolved || padreNode.rawValue) ? (
              <FamilyTreeNodeCard node={padreNode} label="Padre" />
            ) : (
              <div />
            )}
          </div>
          <div style={{ display: 'grid', alignContent: 'end', gap: '12px' }}>
            <div
              aria-hidden="true"
              style={{
                justifySelf: 'center',
                width: 'min(100%, 280px)',
                height: '42px',
                borderTop: '1px solid rgba(143, 247, 255, 0.35)',
                borderLeft: '1px solid rgba(143, 247, 255, 0.35)',
                borderRight: '1px solid rgba(143, 247, 255, 0.35)',
                borderRadius: '18px 18px 0 0',
                marginBottom: '-4px',
              }}
            />
            <FamilyTreeNodeCard node={rootNode} label="Xolo actual" prominent />
          </div>
          <div style={{ display: 'grid', alignContent: 'start', gap: '10px' }}>
            {madreNode && (madreNode.resolved || madreNode.rawValue) ? (
              <FamilyTreeNodeCard node={madreNode} label="Madre" />
            ) : (
              <div />
            )}
          </div>
        </div>
        <style>
          {`@media (max-width: 760px) {
            .xolo-family-tree-grid {
              grid-template-columns: 1fr !important;
            }
          }`}
        </style>
      </Box>
      {descendants.length > 0 ? (
        <Box>
          <div style={{ color: '#8ff7ff', fontWeight: 'bold', marginBottom: '12px' }}>Descendencia</div>
          <div
            style={{
              display: 'grid',
              gap: '12px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            {descendants.map((node) => (
              <FamilyTreeNodeCard
                key={`${node.tokenId || 'token'}-${node.slug || node.title}`}
                node={node}
              />
            ))}
          </div>
        </Box>
      ) : null}
    </div>
  );
}

function TokenFamilyTreeSection({ tokenId, token, localMeta, ipfsMeta }) {
  const resolvedPadre = React.useMemo(() => pickValueWithSource({
    local: localMeta?.padre,
    ipfs: ipfsMeta?.padre || ipfsMeta?.parent,
    onchain: '',
    fallback: '',
  }), [ipfsMeta, localMeta]);
  const resolvedMadre = React.useMemo(() => pickValueWithSource({
    local: localMeta?.madre,
    ipfs: ipfsMeta?.madre,
    onchain: '',
    fallback: '',
  }), [ipfsMeta, localMeta]);
  const rootNode = React.useMemo(
    () => buildRootFamilyNode({ tokenId, token, localMeta, ipfsMeta }),
    [ipfsMeta, localMeta, token, tokenId],
  );
  const padreNode = React.useMemo(() => resolveFamilyReference(resolvedPadre.value), [resolvedPadre.value]);
  const madreNode = React.useMemo(() => resolveFamilyReference(resolvedMadre.value), [resolvedMadre.value]);
  const descendants = React.useMemo(() => collectDirectDescendants(rootNode), [rootNode]);

  return (
    <>
      <SectionTitle>Árbol de linaje</SectionTitle>
      <div style={{ marginBottom: '12px' }}>
        <Link to={`/arbol/${tokenId}`} style={{ color: '#7dffe4', fontSize: '0.92rem' }}>
          Ver árbol completo
        </Link>
      </div>
      <XoloFamilyTree
        rootNode={rootNode}
        padreNode={padreNode}
        madreNode={madreNode}
        descendants={descendants}
      />
    </>
  );
}

function FamilyTreePage() {
  const { tokenId } = useParams();
  useDocumentTitle('Árbol de linaje');
  const [state, setState] = React.useState({ loading: true, error: '', data: null });

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setState({ loading: true, error: '', data: null });
        const token = await chronik.token(tokenId);
        if (mounted) setState({ loading: false, error: '', data: token });
      } catch (err) {
        if (mounted) setState({ loading: false, error: err?.message || 'No se pudo cargar el token.', data: null });
      }
    }
    load();
    return () => { mounted = false; };
  }, [tokenId]);

  const token = state.data;
  const ipfsState = useTokenIpfsMetadata(tokenId, token);
  const localMeta = React.useMemo(
    () => resolveLinajeMetaForToken({ tokenId, ipfsMeta: ipfsState.metadata || null, token }),
    [ipfsState.metadata, token, tokenId],
  );

  return (
    <Shell>
      <SearchBar />
      <div style={{ marginTop: '20px', color: '#8ff7ff', wordBreak: 'break-word' }}>
        Árbol genealógico: <strong>{shortHex(tokenId, 20, 16)}</strong>
      </div>
      <div style={{ marginTop: '8px' }}>
        <Link to={`/token/${tokenId}`} style={{ color: '#7dffe4', fontSize: '0.92rem' }}>
          Volver al token
        </Link>
      </div>

      {state.loading && <LoadingBox />}
      {state.error && <ErrorBox error={state.error} />}

      {token ? (
        <div style={{ marginTop: '24px' }}>
          <TokenFamilyTreeSection
            tokenId={tokenId}
            token={token}
            localMeta={localMeta}
            ipfsMeta={ipfsState.metadata || null}
          />
        </div>
      ) : null}
    </Shell>
  );
}

function TokenPage() {
  const { tokenId } = useParams();
  useDocumentTitle(tokenId ? `Token ${shortHex(tokenId, 12, 8)}` : 'Token');
  const [state, setState] = React.useState({ loading: true, error: '', data: null });
  const [integrityState, setIntegrityState] = React.useState({
    loading: false,
    computedHash: '',
    error: '',
  });

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setState({ loading: true, error: '', data: null });
        const token = await chronik.token(tokenId);
        if (mounted) setState({ loading: false, error: '', data: token });
      } catch (err) {
        if (mounted) setState({ loading: false, error: err?.message || 'No se pudo cargar el token.', data: null });
      }
    }
    load();
    return () => { mounted = false; };
  }, [tokenId]);

  const token = state.data;
  const ipfsState = useTokenIpfsMetadata(tokenId, token);
  const ipfsMeta = ipfsState.metadata || null;
  const localMeta = React.useMemo(
    () => resolveLinajeMetaForToken({ tokenId, ipfsMeta, token }),
    [ipfsMeta, token, tokenId],
  );
  const [imageFailed, setImageFailed] = React.useState(false);
  const onChainDocumentHash = React.useMemo(() => extractTokenDocumentHash(token), [token]);
  const sourceDocumentUrl = ipfsState.resolvedUrl || ipfsState.documentUrl || token?.genesisInfo?.url || token?.url || '';

  React.useEffect(() => {
    let mounted = true;

    async function computeIntegrityHash() {
      if (!onChainDocumentHash || !ipfsState.ok || !ipfsState.rawText) {
        if (mounted) {
          setIntegrityState({ loading: false, computedHash: '', error: '' });
        }
        return;
      }

      if (mounted) {
        setIntegrityState({ loading: true, computedHash: '', error: '' });
      }

      try {
        const computedHash = await sha256HexFromString(ipfsState.rawText);
        if (mounted) {
          setIntegrityState({ loading: false, computedHash: normalizeDocumentHash(computedHash), error: '' });
        }
      } catch (err) {
        if (mounted) {
          setIntegrityState({
            loading: false,
            computedHash: '',
            error: err?.message || 'hash-compute-failed',
          });
        }
      }
    }

    computeIntegrityHash();
    return () => { mounted = false; };
  }, [onChainDocumentHash, ipfsState.ok, ipfsState.rawText]);

  const resolvedName = pickValueWithSource({
    local: localMeta?.title || localMeta?.name,
    ipfs: ipfsMeta?.name || ipfsMeta?.slug,
    onchain: token?.tokenName || token?.genesisInfo?.tokenName,
    fallback: '—',
  });
  const resolvedDescription = pickValueWithSource({
    local: localMeta?.narrative || localMeta?.nota || localMeta?.subtitle,
    ipfs: ipfsMeta?.description,
    onchain: token?.description || token?.genesisInfo?.description,
    fallback: '—',
  });
  const resolvedImage = React.useMemo(
    () => pickNftImageUrl({
      local: localMeta,
      ipfs: ipfsMeta,
      onchain: [token?.genesisInfo, token],
      debugLabel: `token-page:${tokenId}`,
    }),
    [ipfsMeta, localMeta, token, tokenId],
  );
  const resolvedEtapa = pickValueWithSource({
    local: localMeta?.etapa,
    ipfs: ipfsMeta?.etapa,
    onchain: '',
    fallback: '—',
  });
  const resolvedPadre = pickValueWithSource({
    local: localMeta?.padre,
    ipfs: ipfsMeta?.padre || ipfsMeta?.parent,
    onchain: '',
    fallback: '—',
  });
  const resolvedMadre = pickValueWithSource({
    local: localMeta?.madre,
    ipfs: ipfsMeta?.madre,
    onchain: '',
    fallback: '—',
  });
  const resolvedPadreTarget = React.useMemo(
    () => resolveFamilyReference(resolvedPadre.value),
    [resolvedPadre.value],
  );
  const resolvedMadreTarget = React.useMemo(
    () => resolveFamilyReference(resolvedMadre.value),
    [resolvedMadre.value],
  );
  const resolvedCamada = pickValueWithSource({
    local: localMeta?.camada,
    ipfs: ipfsMeta?.camada,
    onchain: '',
    fallback: '—',
  });
  const resolvedRegistroFCM = pickValueWithSource({
    local: localMeta?.registroFCM,
    ipfs: ipfsMeta?.registroFCM,
    onchain: '',
    fallback: '—',
  });
  const resolvedMicrochip = pickValueWithSource({
    local: localMeta?.microchip,
    ipfs: ipfsMeta?.microchip,
    onchain: '',
    fallback: '—',
  });
  const resolvedTheme = pickValueWithSource({
    local: localMeta?.theme,
    ipfs: ipfsMeta?.theme,
    onchain: '',
    fallback: '—',
  });
  const resolvedTags = pickValueWithSource({
    local: normalizeMetadataTags(localMeta?.tags),
    ipfs: normalizeMetadataTags(ipfsMeta?.tags),
    onchain: [],
    fallback: [],
  });
  // Root metadata fields are rendered first; standard NFT attributes are rendered second.
  // Attribute rows are filtered when they duplicate a root field already shown with a real value.
  const renderedRootMetadataKeys = React.useMemo(() => {
    const keys = new Set();
    const maybeAdd = (fieldName, fieldValue, aliases = []) => {
      if (!hasRenderableMetadataValue(fieldValue)) return;
      const normalizedField = canonicalMetadataFieldKey(fieldName);
      if (normalizedField) keys.add(normalizedField);
      aliases.forEach((alias) => {
        const normalizedAlias = canonicalMetadataFieldKey(alias);
        if (normalizedAlias) keys.add(normalizedAlias);
      });
    };
    maybeAdd('name', resolvedName.value);
    maybeAdd('description', resolvedDescription.value);
    maybeAdd('etapa', resolvedEtapa.value);
    maybeAdd('padre', resolvedPadre.value, ['parent']);
    maybeAdd('madre', resolvedMadre.value);
    maybeAdd('camada', resolvedCamada.value);
    maybeAdd('registroFCM', resolvedRegistroFCM.value, ['registro fcm']);
    maybeAdd('microchip', resolvedMicrochip.value);
    maybeAdd('theme', resolvedTheme.value);
    maybeAdd('tags', resolvedTags.value);
    return keys;
  }, [
    resolvedName.value,
    resolvedDescription.value,
    resolvedEtapa.value,
    resolvedPadre.value,
    resolvedMadre.value,
    resolvedCamada.value,
    resolvedRegistroFCM.value,
    resolvedMicrochip.value,
    resolvedTheme.value,
    resolvedTags.value,
  ]);
  const filteredIpfsAttributes = React.useMemo(() => {
    if (!Array.isArray(ipfsMeta?.attributes)) return [];
    const seenTraits = new Set();
    return ipfsMeta.attributes
      .map((attr) => {
        if (!attr || typeof attr !== 'object') return null;
        const traitType = String(attr.trait_type || '').trim();
        if (!traitType) return null;
        const valueText = formatMetadataAttributeValue(attr.value);
        if (!valueText) return null;
        const normalizedTrait = canonicalMetadataFieldKey(traitType);
        if (!normalizedTrait) return null;
        if (renderedRootMetadataKeys.has(normalizedTrait)) return null;
        if (seenTraits.has(normalizedTrait)) return null;
        seenTraits.add(normalizedTrait);
        return { traitType, valueText };
      })
      .filter(Boolean);
  }, [ipfsMeta, renderedRootMetadataKeys]);
  const preferredSource = [
    resolvedName,
    resolvedDescription,
    resolvedImage,
    resolvedEtapa,
    resolvedPadre,
    resolvedMadre,
    resolvedCamada,
    resolvedRegistroFCM,
    resolvedMicrochip,
    resolvedTheme,
    resolvedTags,
  ]
    .map((entry) => entry.source)
    .find((source) => source === 'local')
    || [
      resolvedName,
      resolvedDescription,
      resolvedImage,
      resolvedEtapa,
      resolvedPadre,
      resolvedMadre,
      resolvedCamada,
      resolvedRegistroFCM,
      resolvedMicrochip,
      resolvedTheme,
      resolvedTags,
    ]
      .map((entry) => entry.source)
      .find((source) => source === 'ipfs')
    || '';
  const hasOnChainHash = Boolean(onChainDocumentHash);
  const hashMatches = hasOnChainHash
    && Boolean(integrityState.computedHash)
    && integrityState.computedHash === onChainDocumentHash;
  const ipfsFetchFailed = ipfsState.attempted && !ipfsState.ok;
  const canCompare = hasOnChainHash && ipfsState.ok && Boolean(ipfsState.rawText);
  const shouldShowFamilyTree = Boolean(
    localMeta
    || findLinajeSlugByTokenId(token?.tokenId || tokenId)
    || hasRenderableMetadataValue(resolvedPadre.value)
    || hasRenderableMetadataValue(resolvedMadre.value)
    || hasRenderableMetadataValue(resolvedEtapa.value),
  );
  const integrityStatus = !hasOnChainHash
    ? 'unavailable'
    : hashMatches
      ? 'verified'
      : canCompare
        ? 'mismatch'
        : 'failed';
  const integrityVisual = integrityStatus === 'verified'
    ? {
      border: '#2fd38f',
      background: 'rgba(10, 46, 28, 0.68)',
      color: '#afffd8',
      label: 'Integridad verificada',
    }
    : integrityStatus === 'mismatch'
      ? {
        border: '#ff9351',
        background: 'rgba(52, 23, 9, 0.72)',
        color: '#ffd4a8',
        label: 'Hash no coincide con la génesis',
      }
      : integrityStatus === 'unavailable'
        ? {
          border: '#2d7080',
          background: 'rgba(7, 27, 36, 0.72)',
          color: '#9ed7e2',
          label: 'No hay hash on-chain disponible',
        }
        : {
          border: '#cf6640',
          background: 'rgba(48, 20, 12, 0.72)',
          color: '#ffbea5',
          label: 'No se pudo verificar',
        };

  React.useEffect(() => {
    setImageFailed(false);
  }, [resolvedImage.url]);

  const renderResolvedParentValue = (value, target) => {
    if (!target?.lineageHref || !hasRenderableMetadataValue(value)) return value;
    const label = target?.resolved && target?.title ? target.title : value;

    return (
      <Link
        to={target.lineageHref}
        title={target.title || value}
        style={{
          color: '#7dffe4',
          textDecoration: 'underline',
          textUnderlineOffset: '0.18em',
        }}
      >
        {label}
      </Link>
    );
  };

  const renderResolvedParentField = (label, value, target) => (
    <div>
      <strong style={{ color: '#8ff7ff' }}>{label}:</strong> {renderResolvedParentValue(value, target)}
      {/* Resolved parents get an inline archive preview card; unresolved values stay plain text. */}
      {target ? <RelatedXoloPreviewCard target={target} /> : null}
    </div>
  );

  return (
    <Shell>
      <SearchBar />
      <div style={{ marginTop: '20px', color: '#8ff7ff', wordBreak: 'break-word' }}>
        Viendo token: <strong>{shortHex(tokenId, 20, 16)}</strong>
      </div>

      {state.loading && <LoadingBox />}
      {state.error && <ErrorBox error={state.error} />}

      {token && (
        <>
          <XoloCard tokenId={token.tokenId || tokenId} />

          <StatGrid
            items={[
              { label: 'Token ID', value: token.tokenId || tokenId },
              { label: 'Ticker', value: token.tokenTicker || '—' },
              { label: 'Nombre', value: token.tokenName || '—' },
              { label: 'Decimales', value: token.decimals ?? '—' },
              { label: 'URL', value: token.url || token.genesisInfo?.url || '—' },
            ]}
          />

          {shouldShowFamilyTree ? (
            <TokenFamilyTreeSection
              tokenId={token.tokenId || tokenId}
              token={token}
              localMeta={localMeta}
              ipfsMeta={ipfsMeta}
            />
          ) : null}

          <SectionTitle>Metadatos IPFS</SectionTitle>
          <Box>
            {preferredSource === 'local' && (
              <div style={{ color: '#8ff7ff', marginBottom: '10px', fontSize: '0.84rem' }}>Fuente: metadata local</div>
            )}
            {preferredSource === 'ipfs' && (
              <div style={{ color: '#8ff7ff', marginBottom: '10px', fontSize: '0.84rem' }}>Fuente: IPFS metadata</div>
            )}
            {ipfsState.attempted && !ipfsState.ok && (
              <div style={{ color: '#9adbe2', marginBottom: '10px', fontSize: '0.82rem' }}>
                No se pudieron cargar metadatos IPFS.
              </div>
            )}
            {resolvedImage.url && !imageFailed && (
              <div style={{ marginBottom: '10px' }}>
                <img
                  src={resolvedImage.url}
                  alt={resolvedName.value !== '—' ? resolvedName.value : `NFT ${shortHex(tokenId, 12, 8)}`}
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', maxWidth: '440px', border: '1px solid #1c515b', borderRadius: '12px', objectFit: 'cover', display: 'block' }}
                  onError={() => setImageFailed(true)}
                />
              </div>
            )}
            {resolvedImage.url && imageFailed && (
              <div
                style={{
                  marginBottom: '10px',
                  width: '100%',
                  maxWidth: '440px',
                  minHeight: '220px',
                  border: '1px solid #1c515b',
                  borderRadius: '12px',
                  background: 'linear-gradient(160deg, #071117 0%, #0d1d25 100%)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#9feeff',
                  fontWeight: 'bold',
                  letterSpacing: '0.06em',
                }}
              >
                {buildCollectibleInitials(resolvedName.value, tokenId)}
              </div>
            )}
            <div style={{ display: 'grid', gap: '7px' }}>
              <div><strong style={{ color: '#8ff7ff' }}>name:</strong> {resolvedName.value}</div>
              <div><strong style={{ color: '#8ff7ff' }}>description:</strong> {resolvedDescription.value}</div>
              <div><strong style={{ color: '#8ff7ff' }}>etapa:</strong> {resolvedEtapa.value}</div>
              {renderResolvedParentField('padre', resolvedPadre.value, resolvedPadreTarget)}
              {renderResolvedParentField('madre', resolvedMadre.value, resolvedMadreTarget)}
              <div><strong style={{ color: '#8ff7ff' }}>camada:</strong> {resolvedCamada.value}</div>
              <div><strong style={{ color: '#8ff7ff' }}>registroFCM:</strong> {resolvedRegistroFCM.value}</div>
              <div><strong style={{ color: '#8ff7ff' }}>microchip:</strong> {resolvedMicrochip.value}</div>
              <div><strong style={{ color: '#8ff7ff' }}>theme:</strong> {resolvedTheme.value}</div>
              <div>
                <strong style={{ color: '#8ff7ff' }}>tags:</strong>{' '}
                {resolvedTags.value.length ? resolvedTags.value.join(', ') : '—'}
              </div>
            </div>
            {filteredIpfsAttributes.length > 0 && (
              <div style={{ marginTop: '12px', display: 'grid', gap: '7px' }}>
                <div style={{ color: '#8ff7ff', fontWeight: 'bold' }}>Atributos</div>
                {filteredIpfsAttributes.map((attribute) => (
                  <div key={attribute.traitType}>
                    <strong style={{ color: '#8ff7ff' }}>{attribute.traitType}:</strong> {attribute.valueText}
                  </div>
                ))}
              </div>
            )}
          </Box>

          <SectionTitle>Integridad de metadata</SectionTitle>
          <Box
            style={{
              borderColor: integrityVisual.border,
              background: integrityVisual.background,
            }}
          >
            <div style={{ color: integrityVisual.color, fontWeight: 'bold' }}>{integrityVisual.label}</div>
            {integrityState.loading && (
              <div style={{ marginTop: '8px', color: '#8ff7ff', fontSize: '0.85rem' }}>
                Calculando SHA-256...
              </div>
            )}
            {ipfsFetchFailed && (
              <div style={{ marginTop: '8px', color: '#8ff7ff', fontSize: '0.85rem' }}>
                Error IPFS: {ipfsState.error || 'fetch-failed'}
              </div>
            )}
            {integrityState.error && (
              <div style={{ marginTop: '8px', color: '#8ff7ff', fontSize: '0.85rem' }}>
                Error hash: {integrityState.error}
              </div>
            )}

            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', color: '#8ff7ff' }}>Detalles técnicos</summary>
              <div style={{ marginTop: '8px', display: 'grid', gap: '6px', wordBreak: 'break-word', fontSize: '0.86rem' }}>
                <div><strong style={{ color: '#8ff7ff' }}>Hash on-chain:</strong> {onChainDocumentHash || '—'}</div>
                <div><strong style={{ color: '#8ff7ff' }}>Hash calculado:</strong> {integrityState.computedHash || '—'}</div>
                <div><strong style={{ color: '#8ff7ff' }}>Documento:</strong> {sourceDocumentUrl || '—'}</div>
              </div>
            </details>
          </Box>
        </>
      )}
    </Shell>
  );
}

function SearchHashPage() {
  const { hash } = useParams();
  const navigate = useNavigate();
  useDocumentTitle('Resolver hash');
  const [state, setState] = React.useState({ loading: true, error: '' });

  React.useEffect(() => {
    let mounted = true;
    async function resolveHash() {
      try {
        setState({ loading: true, error: '' });

        try {
          await chronik.tx(hash);
          if (mounted) navigate(`/tx/${hash}`, { replace: true });
          return;
        } catch {
          // Continue resolving the same hash as a block or token.
        }

        try {
          await chronik.block(hash);
          if (mounted) navigate(`/block/${hash}`, { replace: true });
          return;
        } catch {
          // Continue resolving the same hash as a block or token.
        }

        await chronik.token(hash);
        if (mounted) navigate(`/token/${hash}`, { replace: true });
      } catch (err) {
        if (mounted) setState({ loading: false, error: err?.message || 'Hash no encontrado.' });
      }
    }
    resolveHash();
    return () => { mounted = false; };
  }, [hash, navigate]);

  return (
    <Shell>
      <SearchBar />
      {state.loading && <LoadingBox text="Resolviendo hash..." />}
      {state.error && <ErrorBox error={state.error} />}
    </Shell>
  );
}

function NotFoundPage() {
  useDocumentTitle('Ruta no encontrada');
  return (
    <Shell>
      <SearchBar />
      <PageStatus type="error" title="Ruta no encontrada">
        No encontramos esa ruta. Puedes volver al inicio, abrir el explorer o usar la búsqueda para recuperar el camino.
      </PageStatus>
      <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: '#7dffe4' }}>Ir a Inicio</Link>
        <Link to="/explorer" style={{ color: '#7dffe4' }}>Abrir Explorer</Link>
      </div>
    </Shell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={(
          <React.Suspense fallback={<PageSkeleton text="Cargando inicio..." />}>
            <LazyHomePage chronikUrl={CHRONIK_URL} detectQueryType={detectQueryType} />
          </React.Suspense>
        )} />
        <Route path="/explorer" element={<ExplorerPage />} />
        <Route path="/linaje" element={<LinajePage />} />
        <Route path="/linaje/:txidOrSlug" element={<LinajeRecordPage />} />
        <Route path="/collection/xolosnft" element={<XoloNftCollectionPage />} />
        <Route path="/coleccion/xolosnft" element={<XoloNftCollectionPage />} />
        <Route path="/collection/xolosnft/codex" element={<XoloNftCodexPage />} />
        <Route path="/coleccion/xolosnft/codice" element={<XoloNftCodexPage />} />
        <Route path="/collection/xolosnft/:slug" element={<XoloNftCollectionItemPage />} />
        <Route path="/coleccion/xolosnft/:slug" element={<XoloNftCollectionItemPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/block/:height" element={<BlockPage />} />
        <Route path="/tx/:txid" element={<TxPage />} />
        <Route path="/address/:address" element={<AddressPage />} />
        <Route path="/token/:tokenId" element={<TokenPage />} />
        <Route path="/arbol/:tokenId" element={<FamilyTreePage />} />
        <Route path="/genealogia/:tokenId" element={<FamilyTreePage />} />
        <Route path="/search/:hash" element={<SearchHashPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
