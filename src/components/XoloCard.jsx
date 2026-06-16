import React from 'react';
import { Hash, Shield } from 'lucide-react';
import { LINAJE_SLUG_INDEX } from '../data/linajeIndex';
import { LINAJE_EDITORIAL_META, resolveLinajeMeta } from '../data/linajeMeta';
import { pickNftImageUrl } from '../utils/ipfsMetadata';

function normalizeKey(value) {
  if (!value || typeof value !== 'string') return '';
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function findSlugByTokenId(tokenId) {
  const target = normalizeKey(tokenId);
  if (!target) return '';

  return Object.entries(LINAJE_SLUG_INDEX).find(([, txid]) => normalizeKey(txid) === target)?.[0] || '';
}

function pickAttribute(meta, traitNames = []) {
  if (!Array.isArray(meta?.attributes) || traitNames.length === 0) return '';

  const normalizedTraits = traitNames.map((name) => normalizeKey(name));
  const match = meta.attributes.find((attr) => {
    const traitType = normalizeKey(attr?.trait_type);
    return traitType && normalizedTraits.includes(traitType);
  });

  return match?.value ? String(match.value) : '';
}

export function XoloCard({ tokenId }) {
  const [imageFailed, setImageFailed] = React.useState(false);

  const resolvedMeta = React.useMemo(() => {
    const slugFromIndex = findSlugByTokenId(tokenId);
    const byToken = resolveLinajeMeta({ txid: tokenId, slug: tokenId });
    const bySlug = slugFromIndex ? resolveLinajeMeta({ slug: slugFromIndex }) : null;
    const byRawSlug = LINAJE_EDITORIAL_META[normalizeKey(tokenId)] || null;

    return byToken || bySlug || byRawSlug || null;
  }, [tokenId]);

  const resolvedImage = React.useMemo(
    () => pickNftImageUrl({ local: resolvedMeta, debugLabel: `xolo-card:${tokenId}` }),
    [resolvedMeta, tokenId],
  );

  React.useEffect(() => {
    setImageFailed(false);
  }, [resolvedImage.url]);

  if (!resolvedMeta) return null;

  const rank = pickAttribute(resolvedMeta, ['Rango']) || resolvedMeta.rango || 'Soldado';
  const generation = pickAttribute(resolvedMeta, ['Generacion']) || resolvedMeta.generacion || '1';
  const name = resolvedMeta.title || resolvedMeta.nombreCompleto || resolvedMeta.name || `Xolo ${tokenId}`;
  const description = resolvedMeta.narrative || resolvedMeta.nota || resolvedMeta.description || 'Registro editorial del linaje.';
  const imageUrl = resolvedImage.url;

  return (
    <article className="xolo-card" aria-labelledby={`xolo-card-title-${tokenId}`}>
      <div className="xolo-card__ribbon">EXPEDIENTE TACTICO | LINAJE VERIFICADO</div>

      <div className="xolo-card__body">
        <div className="xolo-card__media">
          {imageUrl && !imageFailed ? (
            <img
              className="xolo-card__image"
              src={imageUrl}
              alt={resolvedMeta.imageAlt || `Retrato de ${name}`}
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="xolo-card__placeholder">XOLO IDENTIFICADO</div>
          )}
        </div>

        <div className="xolo-card__content">
          <h2 className="xolo-card__title" id={`xolo-card-title-${tokenId}`}>
            {name}
          </h2>
          <p className="xolo-card__description">{description}</p>

          <div className="xolo-card__facts">
            <div className="xolo-card__fact">
              <Shield className="xolo-card__icon" size={16} aria-hidden="true" />
              <span>Rango: {rank}</span>
            </div>
            <div className="xolo-card__fact">
              <Hash className="xolo-card__icon" size={16} aria-hidden="true" />
              <span>Generacion: {generation}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
