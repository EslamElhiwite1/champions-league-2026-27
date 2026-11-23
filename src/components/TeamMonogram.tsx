import React, {useState} from 'react';
import {isCrestUrlPermitted} from '../config/competition';
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

  const canRenderCrest =
    !team.isTbd && !imageFailed && isCrestUrlPermitted(team.crestUrl);

  if (canRenderCrest && team.crestUrl) {
    return (
      <img
        src={team.crestUrl}
        alt={`${team.name} crest`}
        referrerPolicy="no-referrer"
        onError={() => setImageFailed(true)}
        className={`shrink-0 rounded object-contain bg-[#0d172b] p-0.5 ${dimensions}`}
      />
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
