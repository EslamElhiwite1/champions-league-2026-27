import React from 'react';
import {
  BROADCASTER_SCHEDULE_META,
  CLEARED_CLUB_CREST_REGISTRY,
  CLUB_LOGOS_COLLECTION_META,
  COMPETITION_CONFIG,
} from '../config/competition';
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
              (نطاق دوري أبطال أوروبا فقط دون جداول الترتيب أو البطولات الأخرى). تُحجب روابط شعارات
              مزود البيانات الخارجية افتراضيًا، وتعتمد الواجهة على سجل تعريفي محدد للأندية المشاركة مع
              الاحتفاظ بالأحرف المختصرة (المونوغرام) عند تعذر التحميل أو لأي نادٍ غير مدرج. رسم الكأس
              عمل متجهي أصلي مخصص لهذا المشروع.
            </p>
          </div>

          <div className="space-y-1.5">
            <h2 className="font-medium text-[#d8e1ee]">بيان الاستقلالية</h2>
            <p className="leading-relaxed">
              مشروع تحريري معلوماتي مستقل وغير تجاري لمتابعة موسم{' '}
              {snapshot?.seasonLabel ?? COMPETITION_CONFIG.seasonLabel}. هذا الموقع غير تابع للاتحاد
              الأوروبي لكرة القدم (UEFA) أو الأندية المشاركة أو الشبكات الناقلة ولا يحظى برعاية أو
              اعتماد رسمي منها.
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

        {/* Accessible Attribution Section for 36 Club Logos & Verified Broadcast Channels */}
        <section
          aria-labelledby="crest-attribution-heading"
          className="space-y-4 border-b border-[#c4d2e8]/12 py-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="crest-attribution-heading" className="font-medium text-[#d8e1ee]">
              مصادر وإسناد شعارات الأندية والقنوات الناقلة
            </h2>
            <span className="font-mono-tabular text-[11px] text-[#5ca0ff]">
              شعارات الأندية الموثقة: {clearedEntries.length} ناديًا عبر{' '}
              {CLUB_LOGOS_COLLECTION_META.providerName}
            </span>
          </div>

          <p className="leading-relaxed">
            شعارات الأندية الـ {clearedEntries.length} المشاركة مصدرها{' '}
            <a
              href={CLUB_LOGOS_COLLECTION_META.collectionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#b7c5da] underline underline-offset-4 hover:text-white"
            >
              دليل {CLUB_LOGOS_COLLECTION_META.providerName}
            </a>{' '}
            لأغراض التعريف المعلوماتي والتحريري فقط ضمن هذا الموقع غير التجاري، وفق{' '}
            <a
              href={CLUB_LOGOS_COLLECTION_META.licenseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#b7c5da] underline underline-offset-4 hover:text-white"
            >
              شروط الاستخدام المعلنة للمصدر
            </a>
            . جميع الحقوق والعلامات التجارية الخاصة بالشعارات مملوكة بالكامل للأندية المعنية، دون أي
            استخدام تجاري أو ترويجي ودون أي اعتماد أو رعاية رسمية. وفي حال تعذر تحميل أي شعار أو عند
            ورود نادٍ غير مدرج في السجل، يظهر الرمز المختصر (المونوغرام) تلقائيًا.
          </p>

          <details className="rounded-md border border-[#c4d2e8]/12 bg-[#0d172b]/60 px-3.5 py-2.5">
            <summary className="cursor-pointer font-medium text-[#d8e1ee] hover:text-white">
              عرض قائمة مصادر شعارات الأندية الـ {clearedEntries.length} على{' '}
              {CLUB_LOGOS_COLLECTION_META.providerName}
            </summary>
            <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {clearedEntries.map((entry) => (
                <li
                  key={entry.teamId}
                  className="rounded border border-[#c4d2e8]/12 bg-[#070d19]/80 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="font-medium text-[#f4f7fb]">
                      {entry.arabicClubName} ({entry.clubName})
                    </span>
                    <span className="font-mono-tabular text-[11px] text-[#5ca0ff]">
                      ID: {entry.teamId}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px]">
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
          </details>

          <details className="rounded-md border border-[#c4d2e8]/12 bg-[#0d172b]/60 px-3.5 py-2.5">
            <summary className="cursor-pointer font-medium text-[#d8e1ee] hover:text-white">
              ملاحظة إسناد القنوات التلفزيونية في مصر (تم التحقق في{' '}
              <span dir="ltr" className="font-mono-tabular">
                {BROADCASTER_SCHEDULE_META.checkedAt}
              </span>
              )
            </summary>
            <p className="mt-2 leading-relaxed text-[#9fb1ca]">
              تستند القنوات المرقمة الظاهرة على البطاقات إلى{' '}
              <a
                href={BROADCASTER_SCHEDULE_META.tvGuideUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#b7c5da] underline underline-offset-4 hover:text-white"
              >
                دليل البث الرسمي لـ beIN SPORTS MENA
              </a>{' '}
              (المفحوص بتاريخ{' '}
              <span dir="ltr" className="font-mono-tabular">
                {BROADCASTER_SCHEDULE_META.checkedAt}
              </span>{' '}
              ليومي 24 و25 نوفمبر 2026، البث المباشر فقط). كما يوثّق{' '}
              <a
                href={BROADCASTER_SCHEDULE_META.rightsAnnouncementUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#b7c5da] underline underline-offset-4 hover:text-white"
              >
                إعلان تمديد حقوق البث حتى 2027
              </a>{' '}
              حقوق الشبكة في المنطقة دون أن يثبت رقم القناة الفردي لكل مباراة. تُعرض شعارات القنوات
              الرسمية للتعريف التحريري بالقناة فقط دون أي اعتماد أو رعاية رسمية.
            </p>
          </details>
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
