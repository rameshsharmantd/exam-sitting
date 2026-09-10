import React from 'react';
import { CONFIG } from '../../data/constants';

interface HeaderPrintProps {
  title: string;
  subtitle?: string;
  exam?: string;
  session?: string;
}

export const HeaderPrint: React.FC<HeaderPrintProps> = ({
  title,
  subtitle,
  exam = CONFIG.DEFAULT_EXAM,
  session = CONFIG.DEFAULT_SESSION
}) => {
  return (
    <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
      <div className="text-xl font-bold tracking-tight text-slate-900 uppercase">
        {CONFIG.SCHOOL_NAME}
      </div>
      <div className="text-xs text-slate-600 font-medium">
        Senior Secondary English Medium Co-Educational Institution • Affiliated to CBSE
      </div>
      <div className="mt-2 inline-block px-3 py-1 rounded bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800">
        Academic Session: {session} &nbsp;|&nbsp; Examination: {exam}
      </div>
      <h2 className="text-base font-bold uppercase mt-2 text-slate-900 tracking-wider">
        {title}
      </h2>
      {subtitle && <p className="text-xs text-slate-600">{subtitle}</p>}
    </div>
  );
};
