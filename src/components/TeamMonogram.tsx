import React, {useEffect, useState} from 'react';
import {getClearedClubCrest, isCrestUrlPermitted} from '../config/competition';
import {getArabicClubDisplayName} from '../domain/arabicClubs';
import type {TeamRef} from '../types/knockout';

interface TeamMonogramProps {
  team: TeamRef;
  size?: 'sm' | 'md';
  isWinner?: boolean;
}

export const TeamMonogram: React.FC<TeamMonogramProps> = ({
  team,
  size = 'sm',
  isWinner = false,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const dimensions = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs';

  const clearedCrest = !team.isTbd ? getClearedClubCrest(team.id) : null;
  const resolvedCrestSrc = clearedCrest
    ? clearedCrest.imageUrl
    : !team.isTbd && isCrestUrlPermitted(team.crestUrl)
      ? team.crestUrl
      : null;

  useEffect(() => {
    setImageFailed(false);
  }, [team.id, resolvedCrestSrc]);

  if (resolvedCrestSrc && !imageFailed) {
    const arabicName = getArabicClubDisplayName(team);
    const padding = size === 'sm' ? 'p-[3px]' : 'p-1';
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-[#c4d2e8]/30 ${dimensions} ${padding}`}
      >
        <img
          src={resolvedCrestSrc}
          alt={`شعار ${arabicName}`}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-contain"
        />
      </span>
    );
  }

  if (team.isTbd) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center rounded border border-dashed border-[#c4d2e8]/25 bg-[#070d19]/70 font-mono-tabular font-medium text-[#7f91ad] ${dimensions}`}
      >
        —
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded border font-mono-tabular font-semibold tracking-tight ${dimensions} ${
        isWinner
          ? 'border-[#2f7bff]/70 bg-[#2f7bff]/20 text-[#f4f7fb]'
          : 'border-[#c4d2e8]/25 bg-[#12203b] text-[#d8e1ee]'
      }`}
    >
      {team.monogram}
    </span>
  );
};
