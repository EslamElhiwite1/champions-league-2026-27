import React from 'react';
import {CLEARED_CLUB_CREST_REGISTRY, COMPETITION_CONFIG} from '../config/competition';
import {formatUtcTimestamp} from '../domain/knockoutEngine';
import type {KnockoutSnapshot} from '../types/knockout';

interface FooterProps {
  snapshot: KnockoutSnapshot | null;
}

export const Footer: React.FC<FooterProps> = ({snapshot}) => {
  const clearedEntries = Object.values(CLEARED_CLUB_CREST_REGISTRY);

  return (
    <footer className="bg-[#070d19] text-xs text-[#7f91ad]">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 border-b border-[#c4d2e8]/12 pb-6 md:grid-cols-3">
          <div className="space-y-1.5">
            <h2 className="font-medium text-[#d8e1ee]">إسناد البيانات وسياسة الشعارات</h2>
            <p className="leading-relaxed">
              تتكامل بيانات المباريات والنتائج مع{' '}
              <a
                href={COMPETITION_CONFIG.providerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#b7c5da] underline underline-offset-4 hover:text-white"
              >
                {COMPETITION_CONFIG.providerName}
              </a>{' '}
              (نطاق دوري أبطال أوروبا فقط دون جداول الترتيب أو البطولات الأخرى). ملاحظة: يختلف توفر
              شعارات الأندية؛ تُحجب الشعارات الخارجية افتراضيًا وتعتمد الواجهة على الأحرف المختصرة
              (المونوغرام) لبقية الأندية. رسم الكأس عمل متجهي أصلي مخصص لهذا المشروع.
            </p>
          </div>

          <div className="space-y-1.5">
            <h2 className="font-medium text-[#d8e1ee]">بيان الاستقلالية</h2>
            <p className="leading-relaxed">
              مشروع تحريري مستقل لمتابعة موسم {snapshot?.seasonLabel ?? COMPETITION_CONFIG.seasonLabel}
              . هذا الموقع غير تابع للاتحاد الأوروبي لكرة القدم (UEFA) أو الأندية المشاركة ولا يحظى
              برعاية أو اعتماد رسمي منها.
            </p>
          </div>

          <div className="space-y-1.5">
            <h2 className="font-medium text-[#d8e1ee]">آلية التحديث المتأخر</h2>
            <p className="leading-relaxed">
              يقرأ الموقع لقطات JSON ثابتة منشورة على نفس النطاق وتُحدّث كل ساعة عبر مهام GitHub
              Actions. البيانات المجانية تحمل تأخيرًا طبيعيًا، وقد تتأخر المهام المجدولة أو تتوقف بعد
              فترات الخمول؛ لذا لا يُعد خدمة بث لحظي فوري.
            </p>
          </div>
        </div>

        {/* Accessible Attribution Section for Cleared Club Icons */}
        <section
          aria-labelledby="crest-attribution-heading"
          className="border-b border-[#c4d2e8]/12 py-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="crest-attribution-heading" className="font-medium text-[#d8e1ee]">
              مصادر وإسناد أيقونات الشعارات المتاحة
            </h2>
            <span className="font-mono-tabular text-[11px] text-[#5ca0ff]">
              تغطية جزئية للشعارات: {clearedEntries.length} أندية مصرح بها فقط
            </span>
          </div>
          <p className="mt-1.5 leading-relaxed">
            يختلف توفر شعارات الأندية ولا تشمل هذه القائمة جميع الفرق المشاركة: تقتصر الشعارات
            المصورة حاليًا على {clearedEntries.length} أندية فقط كرموز تعريفية صغيرة دون أي تعديل،
            استنادًا إلى صفحات ملفاتها الحالية على ويكيميديا كومنز المصنفة ضمن الملكية العامة لتصميمها
            الهندسي/النصي البسيط، مع بقاء العلامات التجارية محمية لمالكيها ودون أي رعاية أو اعتماد
            رسمي. وتحتفظ بقية الأندية بالاختصارات النصية حتى يتم التحقق منها بشكل مستقل.
          </p>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {clearedEntries.map((entry) => (
              <li
                key={entry.teamId}
                className="rounded-md border border-[#c4d2e8]/12 bg-[#0d172b]/70 px-3.5 py-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-[#f4f7fb]">
                    {entry.arabicClubName} ({entry.clubName})
                  </span>
                  <span className="font-mono-tabular text-[11px] text-[#5ca0ff]">
                    ID: {entry.teamId} · {entry.licenseLabel}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#b7c5da]">{entry.arabicLicenseNote}</p>
                <p className="mt-1 text-[11px] text-[#9fb1ca]">المنشئ / المصمم: {entry.creator}</p>
                <p className="mt-0.5 text-[11px]">
                  المصدر:{' '}
                  <a
                    href={entry.sourcePageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#b7c5da] underline underline-offset-4 hover:text-white"
                  >
                    {entry.sourceCredit}
                  </a>
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            موسم {snapshot?.seasonLabel ?? COMPETITION_CONFIG.seasonLabel} · العرض الافتراضي:{' '}
            {COMPETITION_CONFIG.defaultTimezoneLabel}
          </p>
          <p>
            آخر تحديث ناجح للقطة:{' '}
            <span className="text-[#b7c5da]">
              {snapshot?.ingestedAtUtc
                ? formatUtcTimestamp(snapshot.ingestedAtUtc)
                : 'بانتظار أول مزامنة موثقة'}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};
