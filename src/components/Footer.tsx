import React from 'react';
import {COMPETITION_CONFIG} from '../config/competition';
import {formatUtcTimestamp} from '../domain/knockoutEngine';
import type {KnockoutSnapshot} from '../types/knockout';

interface FooterProps {
  snapshot: KnockoutSnapshot | null;
}

export const Footer: React.FC<FooterProps> = ({snapshot}) => {
  return (
    <footer className="bg-[#070d19] text-xs text-[#7f91ad]">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 border-b border-[#c4d2e8]/12 pb-6 md:grid-cols-3">
          <div className="space-y-1.5">
            <h2 className="font-medium text-[#d8e1ee]">Data Attribution &amp; Asset Policy</h2>
            <p className="leading-relaxed">
              Competition fixture and score data integration built for{' '}
              <a
                href={COMPETITION_CONFIG.providerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#b7c5da] underline underline-offset-4 hover:text-white"
              >
                {COMPETITION_CONFIG.providerName}
              </a>{' '}
              (CL season scope only; standings and unrelated competitions are excluded). Third-party
              club crests are withheld under an explicit permission-gated policy unless a licensed
              origin is configured; geometric monograms serve as safe defaults. Trophy artwork is
              an original vector illustration authored for this project.
            </p>
          </div>

          <div className="space-y-1.5">
            <h2 className="font-medium text-[#d8e1ee]">Independent Project Statement</h2>
            <p className="leading-relaxed">
              Independent football editorial application for the{' '}
              {snapshot?.seasonLabel ?? COMPETITION_CONFIG.seasonLabel} season. Not affiliated with,
              sponsored by, or endorsed by UEFA or participating clubs.
            </p>
          </div>

          <div className="space-y-1.5">
            <h2 className="font-medium text-[#d8e1ee]">Delayed Snapshot Architecture</h2>
            <p className="leading-relaxed">
              This static site reads sanitized same-origin JSON snapshots updated via scheduled
              hourly GitHub Actions workflows. Free-tier feeds carry delayed updates and GitHub
              scheduled workflows may experience queue delays or inactivity pauses; this is not a
              guaranteed real-time live score service.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Season {snapshot?.seasonLabel ?? COMPETITION_CONFIG.seasonLabel} · Default display{' '}
            {COMPETITION_CONFIG.defaultTimezoneLabel}
          </p>
          <p className="font-mono-tabular">
            Last successful snapshot update:{' '}
            <span className="text-[#b7c5da]">
              {snapshot?.ingestedAtUtc
                ? formatUtcTimestamp(snapshot.ingestedAtUtc)
                : 'Awaiting first verified ingestion'}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};
