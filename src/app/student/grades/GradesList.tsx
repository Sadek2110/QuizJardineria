'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, BarChart3, HelpCircle } from 'lucide-react';
import { formatDateTime, formatGrade, gradeColor } from '@/lib/utils';

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface Answer {
  id: string;
  questionId: string;
  optionId: string;
  question: Question;
  option: {
    id: string;
    text: string;
    isCorrect: boolean;
  };
}

interface Attempt {
  id: string;
  score: number;
  correctAnswersCount: number;
  totalQuestionsCount: number;
  createdAt: Date;
  quiz: {
    id: string;
    title: string;
    description: string | null;
  };
  answers: Answer[];
}

interface Props {
  attempts: Attempt[];
}

export function GradesList({ attempts }: Props) {
  // Track which attempt ID is expanded: Record<attemptId, boolean>
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleExpand(id: string) {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  return (
    <div className="space-y-4">
      {attempts.map((att) => {
        const isExpanded = !!expanded[att.id];
        const isPassed = att.score >= 5;

        return (
          <div
            key={att.id}
            className="card p-0 overflow-hidden border-slate-900 hover:border-slate-800 transition-colors"
          >
            {/* Header row */}
            <div
              onClick={() => toggleExpand(att.id)}
              className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-slate-100 truncate">{att.quiz.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Completado el {formatDateTime(att.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Aciertos</p>
                  <p className="text-sm font-semibold text-slate-350 mt-0.5">
                    {att.correctAnswersCount} / {att.totalQuestionsCount}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Nota</p>
                  <span className={`inline-flex items-center justify-center font-bold px-3 py-1 rounded-lg text-sm bg-slate-950/80 border border-slate-850 mt-0.5 ${gradeColor(att.score)}`}>
                    {formatGrade(att.score)}
                  </span>
                </div>

                <div className="text-slate-500 hover:text-slate-300 p-1">
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>
            </div>

            {/* Expandable Details */}
            {isExpanded && (
              <div className="px-5 pb-6 pt-1 border-t border-slate-900/60 bg-slate-900/10 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <HelpCircle className="h-4 w-4" /> Desglose de preguntas y respuestas
                </h4>

                <div className="grid gap-4">
                  {att.answers.map((ans, idx) => {
                    const isCorrect = ans.option.isCorrect;
                    const correctOption = ans.question.options.find((o) => o.isCorrect);

                    return (
                      <div
                        key={ans.id}
                        className={`p-4 rounded-xl border text-sm space-y-3 ${
                          isCorrect
                            ? 'bg-emerald-500/5 border-emerald-500/10'
                            : 'bg-rose-500/5 border-rose-500/10'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300 mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="font-semibold text-slate-200">{ans.question.text}</p>
                        </div>

                        {/* Options breakdown */}
                        <div className="grid gap-2 pl-7 sm:grid-cols-2">
                          {ans.question.options.map((opt) => {
                            const wasSelectedByStudent = ans.optionId === opt.id;
                            const isOptionCorrect = opt.isCorrect;

                            let optStyle = 'bg-slate-950/20 border-slate-800 text-slate-500';
                            let icon = null;

                            if (wasSelectedByStudent && isOptionCorrect) {
                              // Answered correctly
                              optStyle = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium';
                              icon = <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />;
                            } else if (wasSelectedByStudent && !isOptionCorrect) {
                              // Selected wrong option
                              optStyle = 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-medium';
                              icon = <XCircle className="h-4 w-4 shrink-0 text-rose-400" />;
                            } else if (isOptionCorrect) {
                              // Correct option that student did not select
                              optStyle = 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300 font-medium';
                              icon = <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />;
                            }

                            return (
                              <div
                                key={opt.id}
                                className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${optStyle}`}
                              >
                                <span className="break-words">{opt.text}</span>
                                {icon}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
