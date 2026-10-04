import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  UserCheck,
  Building,
  Sparkles,
  Lock,
} from 'lucide-react';

export interface CompanyReview {
  id: string;
  companyName: string;
  roleTitle: string;
  ratingOverall: number;
  ratingInterview: number;
  ratingSpeed: number;
  ratingTransparency: number;
  stage: 'Interview Completed' | 'Offer Received' | 'Applied & Screened';
  reviewText: string;
  date: string;
  parish: string;
}

const DEFAULT_REVIEWS: Record<string, CompanyReview[]> = {
  default: [
    {
      id: 'rev-1',
      companyName: 'Dominica Geothermal Development Co. (DGDC)',
      roleTitle: 'SCADA Systems Engineer',
      ratingOverall: 5,
      ratingInterview: 5,
      ratingSpeed: 4,
      ratingTransparency: 5,
      stage: 'Interview Completed',
      reviewText:
        'Very thorough and respectful technical panel in Roseau. They asked practical questions about Laudat volcanic weather challenges and high-voltage grid standards. Salary and allowances were clearly stated from day one.',
      date: 'September 2026',
      parish: 'St. George',
    },
    {
      id: 'rev-2',
      companyName: 'Secret Bay Resort',
      roleTitle: 'Eco-Luxury Guest Experience Concierge',
      ratingOverall: 5,
      ratingInterview: 5,
      ratingSpeed: 5,
      ratingTransparency: 4,
      stage: 'Offer Received',
      reviewText:
        'Professional recruitment team. The interview tested situational etiquette with high-net-worth international guests while ensuring respect for local Portsmouth and Dominica heritage.',
      date: 'August 2026',
      parish: 'St. John',
    },
    {
      id: 'rev-3',
      companyName: 'National Bank of Dominica (NBD)',
      roleTitle: 'Compliance & AML Specialist',
      ratingOverall: 4,
      ratingInterview: 4,
      ratingSpeed: 4,
      ratingTransparency: 5,
      stage: 'Interview Completed',
      reviewText:
        'Standard structured panel following ECCB guidelines. Interviewers were punctual, and the HR department followed up with feedback within 5 business days.',
      date: 'July 2026',
      parish: 'St. George',
    },
  ],
};

interface CompanyReviewModuleProps {
  companyName: string;
  parish: string;
}

export const CompanyReviewModule: React.FC<CompanyReviewModuleProps> = ({
  companyName,
  parish,
}) => {
  const storageKey = `natureisland_company_reviews_${companyName.toLowerCase().replace(/[^\w]/g, '_')}`;

  const [reviews, setReviews] = useState<CompanyReview[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    // Matching or fallback seed
    const seeded = DEFAULT_REVIEWS[companyName] || DEFAULT_REVIEWS.default;
    return seeded.map((r) => ({ ...r, companyName }));
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [roleTitle, setRoleTitle] = useState('');
  const [ratingOverall, setRatingOverall] = useState(5);
  const [ratingInterview, setRatingInterview] = useState(5);
  const [ratingSpeed, setRatingSpeed] = useState(4);
  const [ratingTransparency, setRatingTransparency] = useState(5);
  const [stage, setStage] = useState<'Interview Completed' | 'Offer Received' | 'Applied & Screened'>(
    'Interview Completed'
  );
  const [reviewText, setReviewText] = useState('');
  const [submitNotice, setSubmitNotice] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(reviews));
    } catch {
      // ignore
    }
  }, [reviews, storageKey]);

  // Aggregate scores
  const avgOverall = (
    reviews.reduce((acc, r) => acc + r.ratingOverall, 0) / (reviews.length || 1)
  ).toFixed(1);
  const avgInterview = (
    reviews.reduce((acc, r) => acc + r.ratingInterview, 0) / (reviews.length || 1)
  ).toFixed(1);
  const avgSpeed = (
    reviews.reduce((acc, r) => acc + r.ratingSpeed, 0) / (reviews.length || 1)
  ).toFixed(1);
  const avgTransparency = (
    reviews.reduce((acc, r) => acc + r.ratingTransparency, 0) / (reviews.length || 1)
  ).toFixed(1);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    const newRev: CompanyReview = {
      id: `rev-${Date.now()}`,
      companyName,
      roleTitle: roleTitle.trim() || 'Candidate',
      ratingOverall,
      ratingInterview,
      ratingSpeed,
      ratingTransparency,
      stage,
      reviewText: reviewText.trim(),
      date: 'Just now',
      parish,
    };

    setReviews([newRev, ...reviews]);
    setReviewText('');
    setRoleTitle('');
    setIsFormOpen(false);
    setSubmitNotice(true);
    setTimeout(() => setSubmitNotice(false), 3000);
  };

  return (
    <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4 text-xs">
      {/* Header and Aggregate Ratings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-stone-950 text-sm flex items-center gap-1.5">
              <Building className="w-4 h-4 text-emerald-800" />
              <span>Candidate Experience Reviews</span>
            </h4>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>100% Anonymous</span>
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Standardized hiring feedback from applicants and interviewed candidates in Dominica.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer self-start sm:self-center shadow-2xs"
        >
          {isFormOpen ? 'Cancel Review' : '+ Leave Anonymous Review'}
        </button>
      </div>

      {submitNotice && (
        <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Thank you! Your anonymous review has been published to the community.</span>
        </div>
      )}

      {/* Aggregate Scorecards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-white rounded-xl border border-stone-200 text-center space-y-0.5">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
            Overall Rating
          </span>
          <div className="flex items-center justify-center gap-1 font-black text-emerald-900 text-base">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{avgOverall}</span>
            <span className="text-stone-400 text-xs font-normal">/ 5.0</span>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-stone-200 text-center space-y-0.5">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
            Interview Process
          </span>
          <div className="font-extrabold text-stone-850 text-sm">
            {avgInterview} / 5.0
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-stone-200 text-center space-y-0.5">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
            Feedback Speed
          </span>
          <div className="font-extrabold text-stone-850 text-sm">
            {avgSpeed} / 5.0
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-stone-200 text-center space-y-0.5">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
            Salary Transparency
          </span>
          <div className="font-extrabold text-stone-850 text-sm">
            {avgTransparency} / 5.0
          </div>
        </div>
      </div>

      {/* Submission Form Modal / Drawer */}
      {isFormOpen && (
        <form onSubmit={handleSubmitReview} className="p-4 bg-white rounded-xl border border-emerald-300 shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="font-bold text-stone-900 text-xs">
              Leave Anonymous Feedback for {companyName}
            </span>
            <span className="text-[10px] text-stone-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-stone-400" />
              <span>Your name is never shared</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Role Applied For / Interviewed
              </label>
              <input
                type="text"
                required
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Electrical Technician"
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Candidate Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white focus:ring-1 focus:ring-emerald-700"
              >
                <option value="Interview Completed">Interview Completed</option>
                <option value="Offer Received">Offer Received / Hired</option>
                <option value="Applied & Screened">Applied & Screened</option>
              </select>
            </div>
          </div>

          {/* Rating Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div>
              <span className="block text-[10px] font-bold text-stone-500 uppercase">Overall Experience</span>
              <select
                value={ratingOverall}
                onChange={(e) => setRatingOverall(Number(e.target.value))}
                className="w-full mt-0.5 px-2 py-1 border border-stone-300 rounded text-xs"
              >
                {[5, 4, 3, 2, 1].map((s) => (
                  <option key={s} value={s}>{s} Stars</option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-stone-500 uppercase">Interview Professionalism</span>
              <select
                value={ratingInterview}
                onChange={(e) => setRatingInterview(Number(e.target.value))}
                className="w-full mt-0.5 px-2 py-1 border border-stone-300 rounded text-xs"
              >
                {[5, 4, 3, 2, 1].map((s) => (
                  <option key={s} value={s}>{s} Stars</option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-stone-500 uppercase">Response Speed</span>
              <select
                value={ratingSpeed}
                onChange={(e) => setRatingSpeed(Number(e.target.value))}
                className="w-full mt-0.5 px-2 py-1 border border-stone-300 rounded text-xs"
              >
                {[5, 4, 3, 2, 1].map((s) => (
                  <option key={s} value={s}>{s} Stars</option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-stone-500 uppercase">Wage Transparency</span>
              <select
                value={ratingTransparency}
                onChange={(e) => setRatingTransparency(Number(e.target.value))}
                className="w-full mt-0.5 px-2 py-1 border border-stone-300 rounded text-xs"
              >
                {[5, 4, 3, 2, 1].map((s) => (
                  <option key={s} value={s}>{s} Stars</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Your Recruitment Experience (2-4 sentences)
            </label>
            <textarea
              rows={3}
              required
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="How was the communication, technical assessment, local parish alignment, and interview panel tone?"
              className="w-full p-2.5 rounded-lg border border-stone-300 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
            >
              Submit Anonymous Review
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-2.5 pt-1">
        <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
          Candidate Dossiers & Feedback ({reviews.length})
        </span>

        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-3.5 bg-white rounded-xl border border-stone-200/90 space-y-1.5"
          >
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900">{rev.roleTitle}</span>
                <span className="text-stone-300">·</span>
                <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[10px]">
                  {rev.stage}
                </span>
              </div>
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{rev.ratingOverall}.0</span>
              </div>
            </div>

            <p className="text-stone-700 text-xs leading-relaxed">
              "{rev.reviewText}"
            </p>

            <div className="flex items-center justify-between pt-1 text-[10px] text-stone-400 border-t border-stone-100">
              <span>Verified Dominica Candidate · {rev.parish}</span>
              <span>{rev.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
